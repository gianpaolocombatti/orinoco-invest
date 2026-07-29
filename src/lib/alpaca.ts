/**
 * Alpaca Markets API Client
 * Complete integration for Orinoco Invest micro-investing platform
 *
 * NOTE: Credentials are validated lazily (on first API call) rather than at
 * module load, so the app can build and deploy before Alpaca keys exist.
 */

import { calculateOrderAllocations, ASSET_MAP } from '@/lib/portfolio';

// ============================================================================
// TYPES
// ============================================================================

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  buying_power: number;
  cash: number;
  portfolio_value: number;
  equity: number;
  multiplier: number;
}

export interface AlpacaBar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  n?: number;
  vw?: number;
}

export interface AlpacaOrder {
  id: string;
  client_order_id?: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at?: string;
  expired_at?: string;
  canceled_at?: string;
  failed_at?: string;
  replaced_at?: string;
  replaced_by?: string;
  replaces?: string;
  asset_id: string;
  symbol: string;
  asset_class: string;
  qty?: number;
  filled_qty: number;
  filled_avg_price?: number;
  order_class: string;
  order_type: string;
  type?: string;
  side: 'buy' | 'sell';
  time_in_force: string;
  limit_price?: string;
  stop_price?: string;
  status: string;
  extended_hours?: boolean;
  legs?: any[];
  trail_price?: string;
  trail_percent?: string;
  hwm?: string;
  notional?: string;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  avg_entry_price: string;
  qty: number;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_gain: string;
  unrealized_gain_pct: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
  qty_available: number;
}

export interface AlpacaPrice {
  symbol: string;
  price: number;
  timestamp: number;
}

export class AlpacaError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'AlpacaError';
  }
}

// ============================================================================
// ALPACA CLIENT CLASS
// ============================================================================

export class AlpacaClient {
  private apiKey: string;
  private secretKey: string;
  private baseUrl: string;
  private dataUrl: string;

  constructor() {
    this.apiKey = process.env.ALPACA_API_KEY || '';
    this.secretKey = process.env.ALPACA_SECRET_KEY || '';
    this.baseUrl = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets';
    this.dataUrl = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets';
  }

  /**
   * Validate credentials at call time, not construction time.
   */
  private assertCredentials(): void {
    if (!this.apiKey || !this.secretKey) {
      throw new AlpacaError(
        'Las credenciales de Alpaca no están configuradas. Verifique ALPACA_API_KEY y ALPACA_SECRET_KEY.',
        500
      );
    }
  }

  private async request<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    this.assertCredentials();

    const headers: HeadersInit = {
      'APCA-API-KEY-ID': this.apiKey,
      'APCA-API-SECRET-KEY': this.secretKey,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AlpacaError(
          errorData.message || `Error en Alpaca API: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof AlpacaError) {
        throw error;
      }
      throw new AlpacaError(
        `Error al conectar con Alpaca: ${error instanceof Error ? error.message : 'Desconocido'}`
      );
    }
  }

  // =========================================================================
  // ACCOUNT METHODS
  // =========================================================================

  async getAccount(): Promise<AlpacaAccount> {
    return this.request<AlpacaAccount>(`${this.baseUrl}/v2/account`);
  }

  // =========================================================================
  // MARKET DATA METHODS
  // =========================================================================

  async getLatestPrice(symbol: string): Promise<number> {
    const quotes = await this.request<{
      quotes: Record<string, { ap: number; bp: number; t: number }>;
    }>(`${this.dataUrl}/v2/stocks/${symbol}/quotes/latest`);

    if (
      !quotes.quotes ||
      !quotes.quotes[symbol] ||
      quotes.quotes[symbol].ap === undefined
    ) {
      throw new AlpacaError(`No se encontró precio para el símbolo ${symbol}`);
    }

    return quotes.quotes[symbol].ap;
  }

  async getMultiplePrices(symbols: string[]): Promise<Record<string, number>> {
    if (symbols.length === 0) {
      return {};
    }

    const queryString = symbols.join(',');
    const quotes = await this.request<{
      quotes: Record<string, { ap: number; bp: number; t: number }>;
    }>(
      `${this.dataUrl}/v2/stocks/quotes/latest?symbols=${encodeURIComponent(queryString)}`
    );

    const result: Record<string, number> = {};

    Object.entries(quotes.quotes || {}).forEach(([symbol, quote]) => {
      if (quote.ap !== undefined) {
        result[symbol] = quote.ap;
      }
    });

    return result;
  }

  async getBars(
    symbol: string,
    timeframe: '1Day' | '1Week' | '1Month',
    start: string,
    end: string
  ): Promise<AlpacaBar[]> {
    const bars = await this.request<{
      bars: Record<
        string,
        Array<{
          t: number;
          o: number;
          h: number;
          l: number;
          c: number;
          v: number;
          n?: number;
          vw?: number;
        }>
      >;
    }>(
      `${this.dataUrl}/v2/stocks/${symbol}/bars?start=${start}&end=${end}&timeframe=${timeframe}`
    );

    if (!bars.bars || !bars.bars[symbol]) {
      return [];
    }

    return bars.bars[symbol].map((bar) => ({
      t: new Date(bar.t * 1000).toISOString(),
      o: bar.o,
      h: bar.h,
      l: bar.l,
      c: bar.c,
      v: bar.v,
      n: bar.n,
      vw: bar.vw,
    }));
  }

  // =========================================================================
  // ORDER METHODS
  // =========================================================================

  async createOrder(params: {
    symbol: string;
    qty?: number;
    notional?: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    time_in_force: 'day' | 'gtc';
    limit_price?: number;
  }): Promise<AlpacaOrder> {
    const body: any = {
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      time_in_force: params.time_in_force,
      order_class: 'simple',
    };

    if (params.qty !== undefined) {
      body.qty = params.qty;
    }

    if (params.notional !== undefined) {
      body.notional = params.notional;
    }

    if (params.limit_price !== undefined) {
      body.limit_price = params.limit_price;
    }

    return this.request<AlpacaOrder>(`${this.baseUrl}/v2/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async getOrder(orderId: string): Promise<AlpacaOrder> {
    return this.request<AlpacaOrder>(`${this.baseUrl}/v2/orders/${orderId}`);
  }

  async getOrders(status?: 'open' | 'closed' | 'all'): Promise<AlpacaOrder[]> {
    const queryString = status ? `?status=${status}` : '';
    return this.request<AlpacaOrder[]>(`${this.baseUrl}/v2/orders${queryString}`);
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.request(`${this.baseUrl}/v2/orders/${orderId}`, {
      method: 'DELETE',
    });
  }

  // =========================================================================
  // POSITION METHODS
  // =========================================================================

  async getPositions(): Promise<AlpacaPosition[]> {
    return this.request<AlpacaPosition[]>(`${this.baseUrl}/v2/positions`);
  }

  async getPosition(symbol: string): Promise<AlpacaPosition> {
    return this.request<AlpacaPosition>(`${this.baseUrl}/v2/positions/${symbol}`);
  }

  // =========================================================================
  // PORTFOLIO OPERATIONS FOR ORINOCO INVEST
  // =========================================================================

  async executeInvestment(
    amount: number,
    portfolioType: 'CONSERVADOR' | 'BALANCEADO' | 'CRECIMIENTO'
  ): Promise<{
    orders: AlpacaOrder[];
    allocations: Array<{ symbol: string; amount: number; percentage: number }>;
  }> {
    const allocations = calculateOrderAllocations(amount, portfolioType as any);

    const symbols = allocations.map((a) => a.symbol);
    const prices = await this.getMultiplePrices(symbols);

    const orders: AlpacaOrder[] = [];

    for (const allocation of allocations) {
      const price = prices[allocation.symbol];

      if (!price || price <= 0) {
        throw new AlpacaError(
          `No se pudo obtener el precio para ${allocation.symbol}`
        );
      }

      try {
        const order = await this.createOrder({
          symbol: allocation.symbol,
          notional: allocation.amount,
          side: 'buy',
          type: 'market',
          time_in_force: 'day',
        });

        orders.push(order);
      } catch (error) {
        throw new AlpacaError(
          `Error al crear orden para ${allocation.symbol}: ${error instanceof Error ? error.message : 'Desconocido'}`
        );
      }
    }

    return {
      orders,
      allocations: allocations.map((a) => ({
        symbol: a.symbol,
        amount: a.amount,
        percentage: a.percentage * 100,
      })),
    };
  }
}

// ============================================================================
// LAZY SINGLETON
// ============================================================================

let alpacaInstance: AlpacaClient | null = null;

export function getAlpacaClient(): AlpacaClient {
  if (!alpacaInstance) {
    alpacaInstance = new AlpacaClient();
  }
  return alpacaInstance;
}

/**
 * `alpaca` behaves like a client instance but is only constructed on first
 * property access, so importing this module never crashes the build.
 */
export const alpaca = new Proxy({} as AlpacaClient, {
  get(_target, prop) {
    const client = getAlpacaClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export default alpaca;
