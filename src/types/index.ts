/**
 * Orinoco Invest - Comprehensive TypeScript Types
 * Defines all data models, enums, API interfaces, and configuration constants
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Risk tolerance levels for investment portfolios
 * Values match Prisma schema enum RiskTolerance
 *
 * Modeled as a const object + derived string-literal union (like Prisma's
 * generated enums) rather than a TS `enum`, so plain string literals such as
 * "CONSERVADOR" are structurally assignable without nominal-type friction.
 */
export const RiskTolerance = {
  CONSERVADOR: "CONSERVADOR",
  MODERADO: "MODERADO",
  AGRESIVO: "AGRESIVO",
} as const;
export type RiskTolerance = (typeof RiskTolerance)[keyof typeof RiskTolerance];

/**
 * Investment timeline for portfolio recommendations
 * Values match Prisma schema enum InvestTimeline
 */
export const InvestTimeline = {
  CORTO_PLAZO: "CORTO_PLAZO",
  MEDIANO_PLAZO: "MEDIANO_PLAZO",
  LARGO_PLAZO: "LARGO_PLAZO",
} as const;
export type InvestTimeline = (typeof InvestTimeline)[keyof typeof InvestTimeline];

/**
 * Comfort level with portfolio volatility
 * Values match Prisma schema enum VolatilityComfort
 */
export const VolatilityComfort = {
  CONSERVADOR: "CONSERVADOR",
  MODERADO: "MODERADO",
  AGRESIVO: "AGRESIVO",
} as const;
export type VolatilityComfort = (typeof VolatilityComfort)[keyof typeof VolatilityComfort];

/**
 * Investor experience level
 * Values match Prisma schema enum InvestExperience
 */
export const InvestExperience = {
  NINGUNA: "NINGUNA",
  ALGO: "ALGO",
  MUCHA: "MUCHA",
} as const;
export type InvestExperience = (typeof InvestExperience)[keyof typeof InvestExperience];

/**
 * Types of investment portfolios available
 * Values match Prisma schema enum PortfolioType
 */
export const PortfolioType = {
  CONSERVADOR: "CONSERVADOR",
  BALANCEADO: "BALANCEADO",
  CRECIMIENTO: "CRECIMIENTO",
} as const;
export type PortfolioType = (typeof PortfolioType)[keyof typeof PortfolioType];

/**
 * Asset class categorization
 * Values match Prisma schema enum AssetClass
 */
export const AssetClass = {
  BONDS: "BONDS",
  STOCKS: "STOCKS",
  GOLD: "GOLD",
} as const;
export type AssetClass = (typeof AssetClass)[keyof typeof AssetClass];

/**
 * Status of deposits
 * Values match Prisma schema enum DepositStatus
 */
export const DepositStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  CONFIRMED: "CONFIRMED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;
export type DepositStatus = (typeof DepositStatus)[keyof typeof DepositStatus];

/**
 * Status of withdrawals
 * Values match Prisma schema enum WithdrawalStatus
 */
export const WithdrawalStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;
export type WithdrawalStatus = (typeof WithdrawalStatus)[keyof typeof WithdrawalStatus];

/**
 * Types of transactions
 * Values match Prisma schema enum TransactionType
 */
export const TransactionType = {
  DEPOSIT: "DEPOSIT",
  WITHDRAWAL: "WITHDRAWAL",
  BUY: "BUY",
  SELL: "SELL",
  REBALANCE: "REBALANCE",
  FEE: "FEE",
  DIVIDEND: "DIVIDEND",
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

/**
 * Status of transactions
 * Values match Prisma schema enum TransactionStatus
 */
export const TransactionStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

/**
 * Methods for funding accounts
 * Values match Prisma schema enum FundingMethodType
 */
export const FundingMethodType = {
  CRYPTO: "CRYPTO",
  ZELLE: "ZELLE",
  PAYPAL: "PAYPAL",
  BANK_TRANSFER: "BANK_TRANSFER",
  OTHER: "OTHER",
} as const;
export type FundingMethodType = (typeof FundingMethodType)[keyof typeof FundingMethodType];

/**
 * Type aliases used by portfolio.ts and other modules
 */
export type TimelineType = `${InvestTimeline}`;
export type VolatilityType = `${VolatilityComfort}`;
export type ExperienceType = `${InvestExperience}`;

// ============================================================================
// CORE DATA MODELS
// ============================================================================

/**
 * User account and profile information
 */
export interface User {
  id: string;
  email: string;
  phone: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  ciPassport: string;
  dateOfBirth: Date | string;
  country: string;
  riskTolerance: RiskTolerance;
  investTimeline: InvestTimeline;
  volatilityComfort: VolatilityComfort;
  investExperience: InvestExperience;
  onboardingComplete: boolean;
  tosAccepted: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Asset information including symbol, name, and classification
 */
export interface AssetInfo {
  symbol: string;
  name: string;
  spanishName: string;
  assetClass: AssetClass;
  description: string; // Spanish description
  currentPrice?: number;
}

/**
 * Individual asset holding in a portfolio
 */
export interface Holding {
  id: string;
  portfolioId: string;
  assetSymbol: string;
  assetName: string;
  assetClass: AssetClass;
  shares: number;
  costBasis: number; // Cost per share
  currentPrice: number; // Current price per share
  currentValue: number; // Calculated: shares * currentPrice
  gainLoss?: number; // Calculated: currentValue - (shares * costBasis)
  gainLossPercentage?: number; // Calculated: (currentValue / (shares * costBasis)) - 1
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Investment portfolio for a user
 */
export interface Portfolio {
  id: string;
  userId: string;
  portfolioType: PortfolioType;
  totalValueUsd: number;
  totalCostBasis: number;
  lastRebalanced: Date | string;
  holdings: Holding[];
  gainLoss?: number; // Calculated: totalValue - totalCostBasis
  gainLossPercentage?: number; // Calculated: (totalValue / totalCostBasis) - 1
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Deposit transaction for funding account
 */
export interface Deposit {
  id: string;
  userId: string;
  amountUsd: number;
  fee: number;
  netAmount: number; // Calculated: amountUsd - fee
  status: DepositStatus;
  method: FundingMethodType;
  reference: string;
  createdAt: Date | string;
  confirmedAt?: Date | string;
  description?: string;
}

/**
 * Withdrawal transaction for accessing funds
 */
export interface Withdrawal {
  id: string;
  userId: string;
  amountUsd: number;
  fee: number;
  netAmount: number; // Calculated: amountUsd - fee
  status: WithdrawalStatus;
  destination: string;
  method: FundingMethodType;
  createdAt: Date | string;
  processedAt?: Date | string;
  description?: string;
}

/**
 * Individual asset transaction
 */
export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amountUsd: number;
  asset: string;
  assetSymbol: string;
  shares: number;
  pricePerShare: number;
  description: string;
  status: TransactionStatus;
  createdAt: Date | string;
  completedAt?: Date | string;
}

/**
 * Funding method configuration for a user
 */
export interface FundingMethod {
  id: string;
  userId: string;
  type: FundingMethodType;
  label: string; // User-friendly name
  accountLast4?: string; // Last 4 digits for cards/accounts
  accountHolder?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  statusCode?: number;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register new user request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  phone: string;
  firstName: string;
  lastName: string;
  ciPassport: string;
  dateOfBirth: string; // ISO 8601 format
  country: string;
  tosAccepted: boolean;
}

/**
 * Risk assessment questionnaire response
 */
export interface RiskAssessmentRequest {
  riskTolerance: RiskTolerance;
  investTimeline: InvestTimeline;
  volatilityComfort: VolatilityComfort;
  investExperience: InvestExperience;
}

/**
 * Deposit request payload
 */
export interface DepositRequest {
  amountUsd: number;
  method: FundingMethodType;
  fundingMethodId?: string;
  reference?: string;
}

/**
 * Withdrawal request payload
 */
export interface WithdrawalRequest {
  amountUsd: number;
  method: FundingMethodType;
  destination: string;
  fundingMethodId?: string;
}

/**
 * Portfolio rebalance request
 */
export interface RebalanceRequest {
  portfolioId: string;
  targetAllocation?: Record<AssetClass, number>;
}

/**
 * Authentication response with user and token
 */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn?: number; // Token expiration in seconds
}

/**
 * Portfolio recommendation response
 */
export interface PortfolioRecommendation {
  recommendedType: PortfolioType;
  allocation: Record<AssetClass, number>;
  expectedAnnualReturn: number;
  expectedVolatility: number;
  rationale: string; // Spanish explanation
}

// ============================================================================
// PORTFOLIO ALLOCATION CONFIGURATIONS
// ============================================================================

/**
 * Asset allocation percentages for each portfolio type
 * All allocations sum to 100%
 */
export const PORTFOLIO_ALLOCATIONS: Record<
  PortfolioType,
  Record<AssetClass, number>
> = {
  [PortfolioType.CONSERVADOR]: {
    [AssetClass.BONDS]: 85, // SHV (50%) + BND (35%)
    [AssetClass.STOCKS]: 0,
    [AssetClass.GOLD]: 15,
  },
  [PortfolioType.BALANCEADO]: {
    [AssetClass.BONDS]: 30, // BND (30%)
    [AssetClass.STOCKS]: 55, // VTI (35%) + VXUS (20%)
    [AssetClass.GOLD]: 15,
  },
  [PortfolioType.CRECIMIENTO]: {
    [AssetClass.BONDS]: 20,
    [AssetClass.STOCKS]: 70, // VTI (45%) + VXUS (25%)
    [AssetClass.GOLD]: 10,
  },
};

// ============================================================================
// ASSET CONFIGURATIONS
// ============================================================================

/**
 * Available ETF assets with metadata
 */
export const ASSETS: Record<string, AssetInfo> = {
  SHV: {
    symbol: "SHV",
    name: "iShares Short Treasury Bond ETF",
    spanishName: "Fondo de Bonos del Tesoro a Corto Plazo",
    assetClass: AssetClass.BONDS,
    description:
      "Fondo que invierte en bonos del tesoro estadounidense a corto plazo, proporcionando seguridad y estabilidad.",
  },
  BND: {
    symbol: "BND",
    name: "Vanguard Total Bond Market ETF",
    spanishName: "Fondo de Bonos del Mercado Total",
    assetClass: AssetClass.BONDS,
    description:
      "Fondo que invierte en bonos del mercado total estadounidense con bajo costo, proporcionando ingresos estables y diversificación de crédito.",
  },
  VTI: {
    symbol: "VTI",
    name: "Vanguard Total Stock Market ETF",
    spanishName: "Fondo de Acciones del Mercado Total",
    assetClass: AssetClass.STOCKS,
    description:
      "Fondo que invierte en el mercado de acciones total estadounidense, ofreciendo diversificación completa del mercado de valores con bajo costo.",
  },
  VXUS: {
    symbol: "VXUS",
    name: "Vanguard Total International Stock ETF",
    spanishName: "Fondo de Acciones Internacionales",
    assetClass: AssetClass.STOCKS,
    description:
      "Fondo que invierte en acciones internacionales, proporcionando exposición global diversificada fuera de EE.UU.",
  },
  GLD: {
    symbol: "GLD",
    name: "SPDR Gold Shares ETF",
    spanishName: "Fondo de Oro",
    assetClass: AssetClass.GOLD,
    description:
      "Fondo que invierte en oro físico para proporcionar protección contra la inflación y diversificación de cartera.",
  },
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// DASHBOARD & ANALYTICS TYPES
// ============================================================================

/**
 * User dashboard overview
 */
export interface DashboardData {
  user: User;
  portfolio: Portfolio;
  totalInvested: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercentage: number;
  recentTransactions: Transaction[];
  pendingDeposits: Deposit[];
  allocationBreakdown: Record<AssetClass, number>;
}

/**
 * Performance metrics for a portfolio
 */
export interface PortfolioMetrics {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  period: "1M" | "3M" | "6M" | "1Y" | "ALL";
}

/**
 * Historical price data point
 */
export interface PriceDataPoint {
  symbol: string;
  date: string; // ISO 8601
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if value is a valid RiskTolerance
 */
export function isRiskTolerance(value: unknown): value is RiskTolerance {
  return Object.values(RiskTolerance).includes(value as RiskTolerance);
}

/**
 * Check if value is a valid PortfolioType
 */
export function isPortfolioType(value: unknown): value is PortfolioType {
  return Object.values(PortfolioType).includes(value as PortfolioType);
}

/**
 * Check if value is a valid AssetClass
 */
export function isAssetClass(value: unknown): value is AssetClass {
  return Object.values(AssetClass).includes(value as AssetClass);
}

/**
 * Check if value is a valid DepositStatus
 */
export function isDepositStatus(value: unknown): value is DepositStatus {
  return Object.values(DepositStatus).includes(value as DepositStatus);
}

/**
 * Check if value is a valid WithdrawalStatus
 */
export function isWithdrawalStatus(value: unknown): value is WithdrawalStatus {
  return Object.values(WithdrawalStatus).includes(value as WithdrawalStatus);
}

/**
 * Check if value is a valid TransactionType
 */
export function isTransactionType(value: unknown): value is TransactionType {
  return Object.values(TransactionType).includes(value as TransactionType);
}

/**
 * Check if value is a valid TransactionStatus
 */
export function isTransactionStatus(
  value: unknown
): value is TransactionStatus {
  return Object.values(TransactionStatus).includes(value as TransactionStatus);
}

/**
 * Check if value is a valid FundingMethodType
 */
export function isFundingMethodType(
  value: unknown
): value is FundingMethodType {
  return Object.values(FundingMethodType).includes(value as FundingMethodType);
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default portfolio allocation recommendation thresholds
 */
export const ALLOCATION_THRESHOLDS = {
  CONSERVADOR: {
    riskTolerance: [RiskTolerance.CONSERVADOR],
    investTimeline: [InvestTimeline.CORTO_PLAZO, InvestTimeline.MEDIANO_PLAZO],
    volatilityComfort: [VolatilityComfort.CONSERVADOR],
  },
  BALANCEADO: {
    riskTolerance: [RiskTolerance.MODERADO],
    investTimeline: [InvestTimeline.MEDIANO_PLAZO],
    volatilityComfort: [VolatilityComfort.MODERADO],
  },
  CRECIMIENTO: {
    riskTolerance: [RiskTolerance.MODERADO, RiskTolerance.AGRESIVO],
    investTimeline: [InvestTimeline.MEDIANO_PLAZO, InvestTimeline.LARGO_PLAZO],
    volatilityComfort: [VolatilityComfort.MODERADO, VolatilityComfort.AGRESIVO],
  },
};

/**
 * Subscription plans for Orinoco Invest
 */
export const SubscriptionPlan = {
  FREE: "FREE",
  PLUS: "PLUS",
} as const;
export type SubscriptionPlan = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

/**
 * Fee structure for different subscription plans
 */
export const SUBSCRIPTION_PLANS = {
  [SubscriptionPlan.FREE]: {
    monthlyFee: 0,
    name: "Plan Gratis",
    description: "Acceso básico a inversiones con comisiones estándar",
  },
  [SubscriptionPlan.PLUS]: {
    monthlyFee: 1.99,
    name: "Plan Plus",
    description: "Acceso premium con comisiones reducidas y características avanzadas",
  },
};

/**
 * Fee percentages for different operations
 */
export const FEES = {
  DEPOSIT: 0, // No deposit fees
  WITHDRAWAL: 0, // No withdrawal fees
  REBALANCE: 0, // No rebalancing fees
};

/**
 * Minimum transaction amounts in USD
 */
export const MINIMUMS = {
  DEPOSIT: 10,
  WITHDRAWAL: 50,
  INVESTMENT: 5,
};

/**
 * Maximum transaction amounts in USD
 */
export const MAXIMUMS = {
  DEPOSIT: 100000,
  WITHDRAWAL: 50000,
  INVESTMENT: 10000,
};

/**
 * Rebalancing configuration
 */
export const REBALANCE_CONFIG = {
  AUTO_REBALANCE_ENABLED: true,
  REBALANCE_FREQUENCY_DAYS: 90, // Quarterly rebalancing
  THRESHOLD_PERCENTAGE: 5, // Rebalance if allocation drifts 5% from target
};
