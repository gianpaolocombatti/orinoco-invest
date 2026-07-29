import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { calculateFee, calculateNetAmount, generateReference } from '@/lib/utils';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Validation schema for POST requests
const withdrawalSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0'),
  method: z.string().min(1, 'El método es requerido'),
  destination: z.string().min(1, 'El destino es requerido'),
});

type WithdrawalRequest = z.infer<typeof withdrawalSchema>;

/**
 * GET /api/retiros
 * List user's withdrawals with pagination
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

    // Get pagination params
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '10', 10));
    const offset = (page - 1) * limit;

    // Get total count
    const total = await db.withdrawal.count({
      where: { userId: authUser.userId },
    });

    // Get withdrawals
    const withdrawals = await db.withdrawal.findMany({
      where: { userId: authUser.userId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          withdrawals: withdrawals.map((withdrawal) => ({
            id: withdrawal.id,
            userId: withdrawal.userId,
            amountUsd: withdrawal.amountUsd,
            fee: withdrawal.fee,
            netAmount: withdrawal.netAmount,
            status: withdrawal.status,
            destination: withdrawal.destination,
            method: withdrawal.method,
            notes: withdrawal.notes,
            createdAt: withdrawal.createdAt,
            processedAt: withdrawal.processedAt,
          })),
          pagination: {
            total,
            page,
            limit,
            totalPages,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en GET /api/retiros:', error);
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
 * POST /api/retiros
 * Create withdrawal request
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
    const validatedData: WithdrawalRequest = withdrawalSchema.parse(body);

    // Get user's portfolio to check balance
    const portfolio = await db.portfolio.findUnique({
      where: { userId: authUser.userId },
      include: { holdings: true },
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

    // Calculate total portfolio value
    const totalValue = portfolio.holdings.reduce(
      (sum, holding) => sum + holding.currentValue,
      0
    );

    // Check if user has sufficient balance (after fee)
    const fee = calculateFee(validatedData.amount, 0.01);
    const totalRequired = validatedData.amount + fee;

    if (totalRequired > totalValue) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Saldo insuficiente. Disponible: $${totalValue.toFixed(2)} USD, Solicitado: $${totalRequired.toFixed(2)} USD`,
        },
        { status: 400 }
      );
    }

    // Calculate net amount
    const netAmount = calculateNetAmount(validatedData.amount, 0.01);
    const reference = generateReference();

    // Create withdrawal record
    const withdrawal = await db.withdrawal.create({
      data: {
        userId: authUser.userId,
        amountUsd: validatedData.amount,
        fee,
        netAmount,
        status: 'PENDING',
        destination: validatedData.destination,
        method: validatedData.method,
        notes: `Retiro solicitado a ${validatedData.destination} por ${validatedData.method}`,
      },
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          id: withdrawal.id,
          userId: withdrawal.userId,
          amountUsd: withdrawal.amountUsd,
          fee,
          netAmount,
          status: withdrawal.status,
          destination: withdrawal.destination,
          method: withdrawal.method,
          reference,
          estimatedProcessingTime: '3-5 días hábiles',
          createdAt: withdrawal.createdAt,
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

    console.error('Error en POST /api/retiros:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
