import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, withRetry } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { ASSET_MAP } from '@/lib/portfolio';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Validation schema for POST/PUT requests
const portfolioSchema = z.object({
  portfolioType: z.enum(['CONSERVADOR', 'BALANCEADO', 'CRECIMIENTO']),
});

type PortfolioRequest = z.infer<typeof portfolioSchema>;

/**
 * GET /api/portafolio
 * Get user's portfolio with holdings and performance metrics
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
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

    // Get portfolio with holdings
    const portfolio = await db.portfolio.findUnique({
      where: { userId: authUser.userId },
      include: {
        holdings: true,
      },
    });

    if (!portfolio) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Portafolio no encontrado',
        },
        { status: 404 }
      );
    }

    // Calculate performance metrics
    const totalCostBasis = portfolio.holdings.reduce(
      (sum, holding) => sum + holding.shares * holding.costBasis,
      0
    );
    const totalValue = portfolio.holdings.reduce(
      (sum, holding) => sum + holding.currentValue,
      0
    );
    const gainLoss = totalValue - totalCostBasis;
    const gainLossPercent = totalCostBasis > 0 ? (gainLoss / totalCostBasis) * 100 : 0;

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          id: portfolio.id,
          userId: portfolio.userId,
          portfolioType: portfolio.portfolioType,
          totalValueUsd: totalValue,
          totalCostBasis: totalCostBasis,
          gainLoss: gainLoss,
          gainLossPercent: gainLossPercent,
          lastRebalanced: portfolio.lastRebalanced,
          holdings: portfolio.holdings.map((holding) => ({
            id: holding.id,
            assetSymbol: holding.assetSymbol,
            assetName: holding.assetName,
            assetClass: holding.assetClass,
            shares: holding.shares,
            costBasis: holding.costBasis,
            currentPrice: holding.currentPrice,
            currentValue: holding.currentValue,
            gainLoss: holding.currentValue - holding.shares * holding.costBasis,
            gainLossPercent:
              holding.shares * holding.costBasis > 0
                ? ((holding.currentValue - holding.shares * holding.costBasis) /
                    (holding.shares * holding.costBasis)) *
                  100
                : 0,
          })),
          createdAt: portfolio.createdAt,
          updatedAt: portfolio.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en GET /api/portafolio:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portafolio
 * Create/update portfolio selection with default holdings
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
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

    const body = await request.json();
    const validatedData: PortfolioRequest = portfolioSchema.parse(body);

    // Run the find-then-create/update sequence in a single transaction so it
    // executes over one pooled connection instead of several round trips —
    // PgBouncer transaction-mode pooling (used in production) can drop or
    // reassign the underlying connection between unwrapped sequential
    // queries, which was intermittently leaving behind a portfolio with no
    // holdings (or no portfolio at all) when a step failed mid-sequence.
    const portfolio = await withRetry(() =>
      db.$transaction(async (tx) => {
        const existing = await tx.portfolio.findUnique({
          where: { userId: authUser.userId },
          include: { holdings: true },
        });

        if (existing) {
          if (existing.portfolioType !== validatedData.portfolioType) {
            console.warn(
              `Usuario ${authUser.userId} está actualizando portafolio de ${existing.portfolioType} a ${validatedData.portfolioType}`
            );
          }

          return tx.portfolio.update({
            where: { id: existing.id },
            data: {
              portfolioType: validatedData.portfolioType,
              updatedAt: new Date(),
            },
            include: { holdings: true },
          });
        }

        const created = await tx.portfolio.create({
          data: {
            userId: authUser.userId,
            portfolioType: validatedData.portfolioType,
            totalValueUsd: 0,
            totalCostBasis: 0,
          },
        });

        // Create default empty holdings for each asset class
        const assetClasses = ['BONDS', 'STOCKS', 'GOLD'];
        const assetNames = {
          BONDS: 'Vanguard Total Bond Market ETF',
          STOCKS: 'Vanguard Total Stock Market ETF',
          GOLD: 'SPDR Gold Shares ETF',
        };

        for (const assetClass of assetClasses) {
          const symbol = ASSET_MAP[assetClass as keyof typeof ASSET_MAP];
          const name = assetNames[assetClass as keyof typeof assetNames];

          await tx.holding.create({
            data: {
              portfolioId: created.id,
              assetSymbol: symbol,
              assetName: name,
              assetClass: assetClass as any,
              shares: 0,
              costBasis: 0,
              currentPrice: 0,
              currentValue: 0,
            },
          });
        }

        return tx.portfolio.findUniqueOrThrow({
          where: { id: created.id },
          include: { holdings: true },
        });
      })
    );

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          id: portfolio.id,
          userId: portfolio.userId,
          portfolioType: portfolio.portfolioType,
          totalValueUsd: portfolio.totalValueUsd,
          totalCostBasis: portfolio.totalCostBasis,
          lastRebalanced: portfolio.lastRebalanced,
          holdings: portfolio.holdings.map((holding) => ({
            id: holding.id,
            assetSymbol: holding.assetSymbol,
            assetName: holding.assetName,
            assetClass: holding.assetClass,
            shares: holding.shares,
            costBasis: holding.costBasis,
            currentPrice: holding.currentPrice,
            currentValue: holding.currentValue,
          })),
          createdAt: portfolio.createdAt,
          updatedAt: portfolio.updatedAt,
        },
      },
      { status: 201 }
    );
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

    console.error('Error en POST /api/portafolio:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/portafolio
 * Update portfolio (e.g., after rebalance trigger)
 */
export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
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

    const body = await request.json();
    const validatedData: PortfolioRequest = portfolioSchema.parse(body);

    const updatedPortfolio = await withRetry(async () => {
      const portfolio = await db.portfolio.findUnique({
        where: { userId: authUser.userId },
      });

      if (!portfolio) {
        return null;
      }

      return db.portfolio.update({
        where: { id: portfolio.id },
        data: {
          portfolioType: validatedData.portfolioType,
          lastRebalanced: new Date(),
          updatedAt: new Date(),
        },
        include: { holdings: true },
      });
    });

    if (!updatedPortfolio) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Portafolio no encontrado',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          id: updatedPortfolio.id,
          userId: updatedPortfolio.userId,
          portfolioType: updatedPortfolio.portfolioType,
          totalValueUsd: updatedPortfolio.totalValueUsd,
          totalCostBasis: updatedPortfolio.totalCostBasis,
          lastRebalanced: updatedPortfolio.lastRebalanced,
          holdings: updatedPortfolio.holdings.map((holding) => ({
            id: holding.id,
            assetSymbol: holding.assetSymbol,
            assetName: holding.assetName,
            assetClass: holding.assetClass,
            shares: holding.shares,
            costBasis: holding.costBasis,
            currentPrice: holding.currentPrice,
            currentValue: holding.currentValue,
          })),
          createdAt: updatedPortfolio.createdAt,
          updatedAt: updatedPortfolio.updatedAt,
        },
      },
      { status: 200 }
    );
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

    console.error('Error en PUT /api/portafolio:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
