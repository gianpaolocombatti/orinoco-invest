/**
 * Alpaca Utilities
 * Helper functions for common Alpaca operations
 */

import { alpaca } from '@/lib/alpaca';

/**
 * Format price data for display
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(price);
}

/**
 * Format percentage change
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Fetch and cache market data with retry logic
 */
export async function fetchMarketDataWithRetry(
  symbols: string[],
  maxRetries: number = 3
): Promise<Record<string, number> | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await alpaca.getMultiplePrices(symbols);
    } catch (error) {
      console.warn(
        `Alpaca price fetch attempt ${i + 1}/${maxRetries} failed:`,
        error
      );

      // Exponential backoff
      if (i < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }
  }

  return null;
}

/**
 * Calculate price change statistics
 */
export interface PriceStats {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  isUp: boolean;
}

export function calculatePriceStats(
  currentPrice: number,
  previousPrice: number
): PriceStats {
  const change = currentPrice - previousPrice;
  const changePercent = (change / previousPrice) * 100;

  return {
    current: currentPrice,
    previous: previousPrice,
    change,
    changePercent,
    isUp: change >= 0,
  };
}

/**
 * Calculate portfolio value from holdings
 */
export interface HoldingValue {
  symbol: string;
  shares: number;
  pricePerShare: number;
  totalValue: number;
  allocation: number; // percentage of total
}

export function calculatePortfolioValue(
  holdings: Array<{
    symbol: string;
    shares: number;
    currentPrice: number;
  }>
): {
  totalValue: number;
  holdings: HoldingValue[];
} {
  let totalValue = 0;

  const enrichedHoldings = holdings.map((holding) => {
    const value = holding.shares * holding.currentPrice;
    totalValue += value;

    return {
      ...holding,
      totalValue: value,
      allocation: 0, // Will be calculated below
      pricePerShare: holding.currentPrice,
    };
  });

  // Calculate allocations as percentages
  const result = enrichedHoldings.map((holding) => ({
    ...holding,
    allocation: totalValue > 0 ? (holding.totalValue / totalValue) * 100 : 0,
  }));

  return {
    totalValue,
    holdings: result,
  };
}

/**
 * Get asset class label in Spanish
 */
export function getAssetClassLabel(assetClass: string): string {
  const labels: Record<string, string> = {
    BONDS: 'Bonos',
    STOCKS: 'Acciones',
    GOLD: 'Oro',
  };

  return labels[assetClass] || assetClass;
}

/**
 * Get asset symbol info
 */
export const ASSET_INFO: Record<
  string,
  {
    symbol: string;
    name: string;
    spanishName: string;
    color: string;
    icon?: string;
  }
> = {
  BND: {
    symbol: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    spanishName: 'Fondo de Bonos',
    color: '#4F46E5', // Indigo
  },
  VTI: {
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    spanishName: 'Fondo de Acciones',
    color: '#10B981', // Green
  },
  GLD: {
    symbol: 'GLD',
    name: 'SPDR Gold Shares ETF',
    spanishName: 'Fondo de Oro',
    color: '#F59E0B', // Amber
  },
};

/**
 * Get asset info by symbol
 */
export function getAssetInfo(symbol: string) {
  return ASSET_INFO[symbol] || ASSET_INFO['BND'];
}

/**
 * Format order status in Spanish
 */
export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pendiente',
    accepted: 'Aceptada',
    accepted_for_bidding: 'Aceptada para subastar',
    filled: 'Completada',
    partially_filled: 'Parcialmente completada',
    canceled: 'Cancelada',
    expired: 'Expirada',
    rejected: 'Rechazada',
    replaced: 'Reemplazada',
  };

  return statusMap[status] || status;
}

/**
 * Format timeframe label
 */
export function formatTimeframeLabel(
  timeframe: '1Day' | '1Week' | '1Month'
): string {
  const labels: Record<string, string> = {
    '1Day': 'Diario',
    '1Week': 'Semanal',
    '1Month': 'Mensual',
  };

  return labels[timeframe] || timeframe;
}

/**
 * Format period label
 */
export function formatPeriodLabel(
  period: '1M' | '3M' | '6M' | '1Y'
): string {
  const labels: Record<string, string> = {
    '1M': 'Último mes',
    '3M': 'Últimos 3 meses',
    '6M': 'Últimos 6 meses',
    '1Y': 'Último año',
  };

  return labels[period] || period;
}

/**
 * Parse order response and extract key info
 */
export function parseOrderResponse(order: any) {
  return {
    id: order.id,
    symbol: order.symbol,
    side: order.side,
    filledQty: parseFloat(order.filled_qty) || 0,
    filledPrice: parseFloat(order.filled_avg_price) || 0,
    status: order.status,
    createdAt: new Date(order.created_at),
    filledAt: order.filled_at ? new Date(order.filled_at) : null,
    filledValue: (parseFloat(order.filled_qty) || 0) *
      (parseFloat(order.filled_avg_price) || 0),
  };
}

/**
 * Validate portfolio type
 */
export function isValidPortfolioType(
  type: any
): type is 'CONSERVADOR' | 'BALANCEADO' | 'CRECIMIENTO' {
  return ['CONSERVADOR', 'BALANCEADO', 'CRECIMIENTO'].includes(type);
}

/**
 * Get portfolio type description in Spanish
 */
export function getPortfolioTypeDescription(
  type: 'CONSERVADOR' | 'BALANCEADO' | 'CRECIMIENTO'
): string {
  const descriptions: Record<string, string> = {
    CONSERVADOR:
      'Portafolio conservador enfocado en preservar capital con bajo riesgo.',
    BALANCEADO:
      'Portafolio equilibrado que busca crecimiento moderado con riesgo controlado.',
    CRECIMIENTO:
      'Portafolio de crecimiento enfocado en crecimiento a largo plazo con mayor volatilidad.',
  };

  return descriptions[type] || descriptions['BALANCEADO'];
}

/**
 * Mock data for development/testing
 */
export function generateMockPrices(symbols: string[]): Record<string, number> {
  const basePrices: Record<string, number> = {
    BND: 81.45,
    VTI: 245.32,
    GLD: 182.15,
    AAPL: 182.45,
    MSFT: 418.75,
    GOOGL: 156.28,
    AMZN: 189.35,
  };

  const result: Record<string, number> = {};

  symbols.forEach((symbol) => {
    const basePrice = basePrices[symbol] || 100;
    // Add small random variance for testing
    const variance = (Math.random() - 0.5) * 10;
    result[symbol] = Math.max(0.01, basePrice + variance);
  });

  return result;
}

/**
 * Generate mock historical bars for development
 */
export function generateMockBars(symbol: string, days: number = 30) {
  const bars = [];
  const now = new Date();
  let price = (ASSET_INFO[symbol]?.symbol === 'BND' ? 81 : 200);

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const variance = (Math.random() - 0.5) * 5;
    const open = price;
    const close = price + variance;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;

    bars.push({
      t: date.toISOString(),
      o: open,
      h: high,
      l: low,
      c: close,
      v: Math.floor(Math.random() * 5000000) + 1000000,
    });

    price = close;
  }

  return bars;
}
