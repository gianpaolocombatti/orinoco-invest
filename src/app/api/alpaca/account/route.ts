/**
 * GET /api/alpaca/account
 * Get Alpaca account information for authenticated user
 * Requires authentication (admin-like endpoint)
 *
 * Returns account balance, buying power, and portfolio value
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { alpaca, AlpacaError } from '@/lib/alpaca';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
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

    // Fetch account information from Alpaca
    let account;
    try {
      account = await alpaca.getAccount();
    } catch (error) {
      const errorMsg =
        error instanceof AlpacaError
          ? error.message
          : 'Error al obtener información de la cuenta de Alpaca';

      console.error('Alpaca getAccount error:', error);

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: errorMsg,
        },
        { status: 500 }
      );
    }

    // Format response with readable field names
    const responseData = {
      id: account.id,
      accountNumber: account.account_number,
      status: account.status,
      currency: account.currency,
      cash: {
        amount: account.cash,
        currency: account.currency,
      },
      buyingPower: {
        amount: account.buying_power,
        currency: account.currency,
      },
      portfolio: {
        equity: account.equity,
        value: account.portfolio_value,
        currency: account.currency,
      },
      leverage: account.multiplier,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en GET /api/alpaca/account:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
