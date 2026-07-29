import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

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

/**
 * GET /api/transacciones
 * List user's transactions with pagination and optional type filtering
 * Query params: ?page=1&limit=20&type=BUY (optional type filter)
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
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20', 10));
    const type = searchParams.get('type')?.toUpperCase() || undefined;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      userId: authUser.userId,
    };

    // Add type filter if provided
    if (type) {
      const validTypes = ['DEPOSIT', 'WITHDRAWAL', 'BUY', 'SELL', 'REBALANCE', 'FEE', 'DIVIDEND'];
      if (validTypes.includes(type)) {
        whereClause.type = type;
      } else {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Tipo de transacción inválido. Tipos válidos: ${validTypes.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // Get total count
    const total = await db.transaction.count({
      where: whereClause,
    });

    // Get transactions ordered by createdAt DESC
    const transactions = await db.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    // Format transaction response
    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      userId: transaction.userId,
      type: transaction.type,
      amountUsd: transaction.amountUsd,
      asset: transaction.asset,
      shares: transaction.shares,
      pricePerShare: transaction.pricePerShare,
      description: transaction.description,
      status: transaction.status,
      alpacaOrderId: transaction.alpacaOrderId,
      createdAt: transaction.createdAt,
    }));

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          transactions: formattedTransactions,
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
    console.error('Error en GET /api/transacciones:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
