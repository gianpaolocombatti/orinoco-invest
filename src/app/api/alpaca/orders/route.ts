/**
 * POST /api/alpaca/orders
 * Execute investment order for authenticated user
 *
 * Body:
 * {
 *   amount: number (USD amount to invest)
 * }
 *
 * Automatically determines portfolio type from user's profile
 * and executes fractional share orders for each asset class
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { alpaca, AlpacaError } from '@/lib/alpaca';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Validation schema
const orderSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0'),
});

type OrderRequest = z.infer<typeof orderSchema>;

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Verify authentication
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Autenticación requerida',
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body: OrderRequest;
    try {
      const json = await request.json();
      body = orderSchema.parse(json);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || 'Error de validación';
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: errorMessage,
          },
          { status: 400 }
        );
      }

      if (error instanceof SyntaxError) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: 'El cuerpo de la solicitud no es un JSON válido',
          },
          { status: 400 }
        );
      }

      throw error;
    }

    // Get user's portfolio and profile
    const portfolio = await db.portfolio.findUnique({
      where: { userId: authUser.userId },
      include: { holdings: true },
    });

    if (!portfolio) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'No se encontró portafolio del usuario. Complete su perfil de inversión primero.',
        },
        { status: 404 }
      );
    }

    // Validate minimum investment
    const MINIMUM_INVESTMENT = 5;
    if (body.amount < MINIMUM_INVESTMENT) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `El monto mínimo de inversión es $${MINIMUM_INVESTMENT} USD`,
        },
        { status: 400 }
      );
    }

    // Validate maximum investment
    const MAXIMUM_INVESTMENT = 10000;
    if (body.amount > MAXIMUM_INVESTMENT) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `El monto máximo de inversión es $${MAXIMUM_INVESTMENT} USD`,
        },
        { status: 400 }
      );
    }

    // Execute investment with Alpaca
    let alpacaResult;
    try {
      alpacaResult = await alpaca.executeInvestment(
        body.amount,
        portfolio.portfolioType as 'CONSERVADOR' | 'MODERADO' | 'AGRESIVO'
      );
    } catch (error) {
      const errorMsg =
        error instanceof AlpacaError
          ? error.message
          : 'Error al ejecutar la orden de inversión';

      console.error('Alpaca execution error:', error);

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: errorMsg,
        },
        { status: 500 }
      );
    }

    // Log transactions in database
    const transactions = [];
    for (const order of alpacaResult.orders) {
      const allocation = alpacaResult.allocations.find(
        (a) => a.symbol === order.symbol
      );

      if (!allocation) {
        console.warn(`No allocation found for ${order.symbol}`);
        continue;
      }

      // Parse filled quantity and price from Alpaca response
      const filledQty = order.filled_qty || 0;
      const filledPrice = order.filled_avg_price
        ? parseFloat(order.filled_avg_price)
        : 0;

      try {
        const transaction = await db.transaction.create({
          data: {
            userId: authUser.userId,
            type: 'BUY',
            amountUsd: allocation.amount,
            asset: order.symbol,
            shares: filledQty,
            pricePerShare: filledPrice,
            description: `Compra de ${order.symbol} - Portafolio ${portfolio.portfolioType}`,
            status: order.status === 'filled' ? 'COMPLETED' : 'PENDING',
            alpacaOrderId: order.id,
          },
        });

        transactions.push(transaction);

        // Update holding with current price and shares
        // (In production, you might want to wait for order confirmation)
        if (filledQty > 0 && filledPrice > 0) {
          const currentValue = filledQty * filledPrice;
          const costBasis = filledPrice;

          await db.holding.upsert({
            where: {
              portfolioId_assetSymbol: {
                portfolioId: portfolio.id,
                assetSymbol: order.symbol,
              },
            },
            update: {
              shares: {
                increment: filledQty,
              },
              currentPrice: filledPrice,
              currentValue: {
                increment: currentValue,
              },
              costBasis: costBasis, // Simplified: just use latest price
            },
            create: {
              portfolioId: portfolio.id,
              assetSymbol: order.symbol,
              assetName: `Asset ${order.symbol}`,
              assetClass:
                order.symbol === 'BND'
                  ? 'BONDS'
                  : order.symbol === 'VTI'
                    ? 'STOCKS'
                    : 'GOLD',
              shares: filledQty,
              costBasis: costBasis,
              currentPrice: filledPrice,
              currentValue: currentValue,
            },
          });
        }
      } catch (dbError) {
        console.error(`Error logging transaction for ${order.symbol}:`, dbError);
        // Continue with other transactions
      }
    }

    // Update portfolio metadata
    try {
      await db.portfolio.update({
        where: { id: portfolio.id },
        data: {
          updatedAt: new Date(),
          // totalValueUsd and totalCostBasis will be calculated from holdings in the app
        },
      });
    } catch (error) {
      console.error('Error updating portfolio:', error);
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          orders: alpacaResult.orders.map((order) => ({
            id: order.id,
            symbol: order.symbol,
            side: order.side,
            status: order.status,
            filled_qty: order.filled_qty,
            filled_avg_price: order.filled_avg_price,
            created_at: order.created_at,
          })),
          allocations: alpacaResult.allocations,
          transactions: transactions.map((t) => ({
            id: t.id,
            symbol: t.asset,
            shares: t.shares,
            amountUsd: t.amountUsd,
            status: t.status,
            alpacaOrderId: t.alpacaOrderId,
            createdAt: t.createdAt,
          })),
          totalInvested: body.amount,
          portfolioType: portfolio.portfolioType,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en POST /api/alpaca/orders:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
