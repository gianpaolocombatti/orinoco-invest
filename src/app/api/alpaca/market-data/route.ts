/**
 * GET /api/alpaca/market-data
 * Public endpoint for market data (no auth required)
 * Returns latest prices and optional historical data for charts
 *
 * Query Parameters:
 * - symbols: Comma-separated symbols (default: "BND,VTI,GLD")
 * - history: Boolean to include historical bars (default: false)
 * - timeframe: '1Day', '1Week', '1Month' (default: '1Day')
 * - period: '1M', '3M', '6M', '1Y' (default: '1M')
 */

import { NextRequest, NextResponse } from 'next/server';
import { alpaca, AlpacaError } from '@/lib/alpaca';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Default symbols if none provided
const DEFAULT_SYMBOLS = ['BND', 'VTI', 'GLD'];

/**
 * Calculate date range for historical data based on period
 */
function getDateRange(period: string): { start: string; end: string } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case '1M':
      start.setMonth(start.getMonth() - 1);
      break;
    case '3M':
      start.setMonth(start.getMonth() - 3);
      break;
    case '6M':
      start.setMonth(start.getMonth() - 6);
      break;
    case '1Y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setMonth(start.getMonth() - 1);
  }

  // Format as ISO dates
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  return { start: startStr, end: endStr };
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const symbolsParam = searchParams.get('symbols');
    const symbols = symbolsParam
      ? symbolsParam.split(',').map((s) => s.toUpperCase().trim())
      : DEFAULT_SYMBOLS;

    const includeHistory = searchParams.get('history')?.toLowerCase() === 'true';
    const timeframe = (searchParams.get('timeframe') || '1Day') as
      | '1Day'
      | '1Week'
      | '1Month';
    const period = searchParams.get('period') || '1M';

    // Validate symbols (max 50 for API limits)
    if (symbols.length > 50) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Máximo 50 símbolos permitidos',
        },
        { status: 400 }
      );
    }

    // Fetch latest prices
    let prices: Record<string, number> = {};
    try {
      prices = await alpaca.getMultiplePrices(symbols);
    } catch (error) {
      const errorMsg =
        error instanceof AlpacaError
          ? error.message
          : 'Error al obtener precios del mercado';
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: errorMsg,
        },
        { status: 500 }
      );
    }

    // Format price data with timestamp
    const priceData = Object.entries(prices).map(([symbol, price]) => ({
      symbol,
      price,
      timestamp: new Date().toISOString(),
    }));

    const responseData: any = {
      prices: priceData,
      timestamp: new Date().toISOString(),
    };

    // Optionally include historical data for charts
    if (includeHistory) {
      const { start, end } = getDateRange(period);
      const historicalData: Record<string, any[]> = {};

      for (const symbol of symbols) {
        try {
          const bars = await alpaca.getBars(symbol, timeframe, start, end);
          historicalData[symbol] = bars;
        } catch (error) {
          // Continue with other symbols if one fails
          console.warn(`Error fetching bars for ${symbol}:`, error);
          historicalData[symbol] = [];
        }
      }

      responseData.historical = historicalData;
      responseData.period = period;
      responseData.timeframe = timeframe;
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en GET /api/alpaca/market-data:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
