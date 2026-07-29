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

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Validation schema for POST requests
const depositSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0'),
  method: z.enum(['zelle', 'paypal', 'crypto_usdt', 'bank_transfer', 'bolivares_fx']),
});

type DepositRequest = z.infer<typeof depositSchema>;

// Payment addresses and methods (mock - replace with real addresses in production)
const PAYMENT_ADDRESSES = {
  crypto_usdt: 'TM5tPJm86KUcTmgJGArvMSPtJLHnXZp5eF',
  zelle: 'deposits@orinoco-invest.com',
  paypal: 'deposits@orinoco-invest.com',
};

/**
 * GET /api/depositos
 * List user's deposits with pagination
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
    const total = await db.deposit.count({
      where: { userId: authUser.userId },
    });

    // Get deposits
    const deposits = await db.deposit.findMany({
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
          deposits: deposits.map((deposit) => ({
            id: deposit.id,
            userId: deposit.userId,
            amountUsd: deposit.amountUsd,
            fee: deposit.fee,
            netAmount: deposit.netAmount,
            status: deposit.status,
            method: deposit.method,
            reference: deposit.reference,
            notes: deposit.notes,
            createdAt: deposit.createdAt,
            confirmedAt: deposit.confirmedAt,
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
    console.error('Error en GET /api/depositos:', error);
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
 * POST /api/depositos
 * Create new deposit request
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
    const validatedData: DepositRequest = depositSchema.parse(body);

    // Check minimum deposit
    if (validatedData.amount < 5) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'El monto mínimo de depósito es $5 USD',
        },
        { status: 400 }
      );
    }

    // Calculate fee (1% of amount)
    const fee = calculateFee(validatedData.amount, 0.01);
    const netAmount = calculateNetAmount(validatedData.amount, 0.01);
    const reference = generateReference();

    // Generate payment instructions based on method
    let instructions = '';
    let paymentAddress = '';

    switch (validatedData.method) {
      case 'crypto_usdt':
        paymentAddress = PAYMENT_ADDRESSES.crypto_usdt;
        instructions = `Envía ${validatedData.amount} USDT (TRC-20) a la dirección: ${paymentAddress}`;
        break;
      case 'zelle':
        instructions = `Envía $${validatedData.amount} por Zelle a: pagos@orinoco-invest.com`;
        break;
      case 'paypal':
        instructions = `Envía $${validatedData.amount} por PayPal a: pagos@orinoco-invest.com`;
        break;
      case 'bank_transfer':
        instructions = `Envía $${validatedData.amount} por transferencia bancaria. Contacta a soporte@orinoco-invest.com para los datos de la cuenta.`;
        break;
      case 'bolivares_fx':
        instructions = `Envía el equivalente en bolívares de $${validatedData.amount} USD. Contacta a soporte@orinoco-invest.com para la tasa y los datos de pago.`;
        break;
    }

    // Create deposit record
    const deposit = await db.deposit.create({
      data: {
        userId: authUser.userId,
        amountUsd: validatedData.amount,
        fee,
        netAmount,
        status: 'PENDING',
        method: validatedData.method,
        reference,
        notes: instructions,
      },
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          id: deposit.id,
          userId: deposit.userId,
          amountUsd: deposit.amountUsd,
          fee,
          netAmount,
          status: deposit.status,
          method: deposit.method,
          reference: deposit.reference,
          instructions,
          paymentAddress: paymentAddress || undefined,
          createdAt: deposit.createdAt,
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

    console.error('Error en POST /api/depositos:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
