/**
 * Alpaca Markets API Type Definitions
 * Comprehensive types for Alpaca integration
 */

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface AlpacaRequestOptions {
  method?: 'GET' | 'POST' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// ACCOUNT TYPES
// ============================================================================

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: 'ACTIVE' | 'INACTIVE';
  currency: string;
  buying_power: number;
  cash: number;
  portfolio_value: number;
  equity: number;
  multiplier: number;
  [key: string]: any;
}

export interface AccountInfo {
  id: string;
  accountNumber: string;
  status: string;
  currency: string;
  cash: {
    amount: number;
    currency: string;
  };
  buyingPower: {
    amount: number;
    currency: string;
  };
  portfolio: {
    equity: number;
    value: number;
    currency: string;
  };
  leverage: number;
  lastUpdated: string;
}

// ============================================================================
// MARKET DATA TYPES
// ============================================================================

export interface AlpacaQuote {
  ap: number; // ask price
  as: number; // ask size
  ax: string; // ask exchange
  bp: number; // bid price
  bs: number; // bid size
  bx: string; // bid exchange
  c: string; // condition
  t: number; // timestamp
  z: string; // tape
}

export interface AlpacaBar {
  t: string; // ISO timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
  n?: number; // trade count
  vw?: number; // volume weighted average price
}

export interface PriceData {
  symbol: string;
  price: number;
  timestamp: string;
}

export interface MarketDataResponse {
  prices: PriceData[];
  timestamp: string;
  historical?: Record<string, AlpacaBar[]>;
  period?: string;
  timeframe?: string;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export interface AlpacaOrderRequest {
  symbol: string;
  qty?: number;
  notional?: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
  limit_price?: number | string;
  stop_price?: number | string;
  trail_price?: number | string;
  trail_percent?: number | string;
  extended_hours?: boolean;
  order_class?: 'simple' | 'bracket' | 'oco';
  take_profit?: {
    limit_price: number | string;
  };
  stop_loss?: {
    stop_price: number | string;
    limit_price?: number | string;
  };
  client_order_id?: string;
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
  qty?: number | string;
  filled_qty: number | string;
  filled_avg_price?: number | string;
  order_class: string;
  order_type: string;
  type?: string;
  side: 'buy' | 'sell';
  time_in_force: string;
  limit_price?: string;
  stop_price?: string;
  status:
    | 'pending_new'
    | 'accepted'
    | 'accepted_for_bidding'
    | 'filled'
    | 'partially_filled'
    | 'canceled'
    | 'expired'
    | 'rejected'
    | 'replaced';
  extended_hours?: boolean;
  legs?: AlpacaOrder[];
  trail_price?: string;
  trail_percent?: string;
  hwm?: string;
  notional?: string;
  [key: string]: any;
}

export interface OrderResponse {
  id: string;
  symbol: string;
  side: string;
  status: string;
  filledQty: number;
  filledPrice: number;
  createdAt: string;
}

export interface ExecuteInvestmentResponse {
  orders: OrderResponse[];
  allocations: AllocationInfo[];
  transactions: TransactionRecord[];
  totalInvested: number;
  portfolioType: string;
}

export interface AllocationInfo {
  symbol: string;
  amount: number;
  percentage: number;
}

export interface TransactionRecord {
  id: string;
  symbol: string;
  shares: number;
  amountUsd: number;
  status: string;
  alpacaOrderId: string;
  createdAt: string;
}

// ============================================================================
// POSITION TYPES
// ============================================================================

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  avg_entry_price: string;
  qty: number | string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_gain: string;
  unrealized_gain_pct: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
  qty_available: number | string;
  [key: string]: any;
}

export interface PositionInfo {
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

// ============================================================================
// INVESTMENT TYPES
// ============================================================================

export interface InvestmentRequest {
  amount: number;
  portfolioType?: 'CONSERVADOR' | 'MODERADO' | 'AGRESIVO';
}

export interface PortfolioAllocation {
  CONSERVADOR: {
    BND: number;
    VTI: number;
    GLD: number;
  };
  MODERADO: {
    BND: number;
    VTI: number;
    GLD: number;
  };
  AGRESIVO: {
    BND: number;
    VTI: number;
    GLD: number;
  };
}

export interface OrderAllocation {
  symbol: string;
  assetClass: string;
  amount: number;
  percentage: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

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

export interface ErrorResponse {
  success: false;
  error: string;
  statusCode?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PriceChange {
  symbol: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  isUp: boolean;
}

export interface HoldingValue {
  symbol: string;
  shares: number;
  pricePerShare: number;
  totalValue: number;
  allocation: number;
}

export interface PortfolioValue {
  totalValue: number;
  holdings: HoldingValue[];
}

export interface AssetInfo {
  symbol: string;
  name: string;
  spanishName: string;
  color: string;
  icon?: string;
}

// ============================================================================
// QUERY PARAMETER TYPES
// ============================================================================

export interface MarketDataQuery {
  symbols?: string;
  history?: boolean | string;
  timeframe?: '1Day' | '1Week' | '1Month';
  period?: '1M' | '3M' | '6M' | '1Y';
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PORTFOLIO_TYPES = {
  CONSERVADOR: 'CONSERVADOR',
  BALANCEADO: 'BALANCEADO',
  CRECIMIENTO: 'CRECIMIENTO',
} as const;

export type PortfolioType = typeof PORTFOLIO_TYPES[keyof typeof PORTFOLIO_TYPES];

export const ORDER_STATUS = {
  PENDING_NEW: 'pending_new',
  ACCEPTED: 'accepted',
  ACCEPTED_FOR_BIDDING: 'accepted_for_bidding',
  FILLED: 'filled',
  PARTIALLY_FILLED: 'partially_filled',
  CANCELED: 'canceled',
  EXPIRED: 'expired',
  REJECTED: 'rejected',
  REPLACED: 'replaced',
} as const;

export const ORDER_SIDE = {
  BUY: 'buy',
  SELL: 'sell',
} as const;

export const ORDER_TYPE = {
  MARKET: 'market',
  LIMIT: 'limit',
  STOP: 'stop',
  STOP_LIMIT: 'stop_limit',
  TRAILING_STOP: 'trailing_stop',
} as const;

export const TIME_IN_FORCE = {
  DAY: 'day',
  GTC: 'gtc',
  OPG: 'opg',
  CLS: 'cls',
  IOC: 'ioc',
  FOK: 'fok',
} as const;

export const ETF_SYMBOLS = {
  BND: 'BND', // Bonds
  VTI: 'VTI', // Stocks
  GLD: 'GLD', // Gold
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isAlpacaError(error: unknown): error is AlpacaError {
  return error instanceof AlpacaError;
}

export function isOrderFilled(order: AlpacaOrder): boolean {
  return order.status === 'filled';
}

export function isOrderPending(order: AlpacaOrder): boolean {
  return (
    order.status === 'pending_new' ||
    order.status === 'accepted' ||
    order.status === 'accepted_for_bidding'
  );
}

export function isValidPortfolioType(value: any): value is PortfolioType {
  return Object.values(PORTFOLIO_TYPES).includes(value);
}

export function isValidOrderStatus(value: any): boolean {
  return Object.values(ORDER_STATUS).includes(value);
}
