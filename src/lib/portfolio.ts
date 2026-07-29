import {
  PortfolioType,
  TimelineType,
  VolatilityType,
  ExperienceType,
  AssetClass,
} from '@/types';

/**
 * Portfolio allocation percentages for each portfolio type
 * Conservador: SHV (50%) + BND (35%) + GLD (15%)
 * Balanceado: VTI (35%) + VXUS (20%) + BND (30%) + GLD (15%)
 * Crecimiento: VTI (45%) + VXUS (25%) + BND (20%) + GLD (10%)
 */
export const PORTFOLIO_ALLOCATIONS: Record<
  PortfolioType,
  Record<AssetClass, number>
> = {
  CONSERVADOR: {
    BONDS: 0.85, // SHV (50%) + BND (35%)
    STOCKS: 0,
    GOLD: 0.15,
  },
  BALANCEADO: {
    BONDS: 0.3,
    STOCKS: 0.55, // VTI (35%) + VXUS (20%)
    GOLD: 0.15,
  },
  CRECIMIENTO: {
    BONDS: 0.2,
    STOCKS: 0.7, // VTI (45%) + VXUS (25%)
    GOLD: 0.1,
  },
};

/**
 * Map asset classes to their ETF symbols
 */
export const ASSET_MAP: Record<AssetClass, string> = {
  BONDS: 'BND',
  STOCKS: 'VTI',
  GOLD: 'GLD',
};

/**
 * Recommend portfolio type based on investor profile
 * Uses scoring system: average of timeline, volatility tolerance, and experience
 * - <=1.5: CONSERVADOR
 * - <=2.5: BALANCEADO
 * - >2.5: CRECIMIENTO
 */
export function recommendPortfolio(
  timeline: TimelineType,
  volatility: VolatilityType,
  experience: ExperienceType
): PortfolioType {
  const timelineScore = getTimelineScore(timeline);
  const volatilityScore = getVolatilityScore(volatility);
  const experienceScore = getExperienceScore(experience);

  const averageScore = (timelineScore + volatilityScore + experienceScore) / 3;

  if (averageScore <= 1.5) {
    return 'CONSERVADOR';
  } else if (averageScore <= 2.5) {
    return 'BALANCEADO';
  } else {
    return 'CRECIMIENTO';
  }
}

function getTimelineScore(timeline: TimelineType): number {
  switch (timeline) {
    case 'CORTO_PLAZO':
      return 1;
    case 'MEDIANO_PLAZO':
      return 2;
    case 'LARGO_PLAZO':
      return 3;
  }
}

function getVolatilityScore(volatility: VolatilityType): number {
  switch (volatility) {
    case 'CONSERVADOR':
      return 1;
    case 'MODERADO':
      return 2;
    case 'AGRESIVO':
      return 3;
  }
}

function getExperienceScore(experience: ExperienceType): number {
  switch (experience) {
    case 'NINGUNA':
      return 1;
    case 'ALGO':
      return 2;
    case 'MUCHA':
      return 3;
  }
}

/**
 * Calculate order allocations for a given amount and portfolio type
 */
export interface OrderAllocation {
  symbol: string;
  assetClass: AssetClass;
  amount: number;
  percentage: number;
}

export function calculateOrderAllocations(
  amount: number,
  portfolioType: PortfolioType
): OrderAllocation[] {
  const allocations = PORTFOLIO_ALLOCATIONS[portfolioType];

  return (Object.entries(allocations) as [AssetClass, number][]).map(
    ([assetClass, percentage]) => ({
      symbol: ASSET_MAP[assetClass],
      assetClass,
      amount: amount * percentage,
      percentage,
    })
  );
}

/**
 * Portfolio holding for performance calculation
 */
export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  costBasis: number;
  currentPrice: number;
}

/**
 * Portfolio performance metrics
 */
export interface PortfolioPerformance {
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

/**
 * Calculate overall portfolio performance metrics
 */
export function calculatePortfolioPerformance(
  holdings: PortfolioHolding[]
): PortfolioPerformance {
  let totalValue = 0;
  let totalCostBasis = 0;

  holdings.forEach((holding) => {
    const holdingValue = holding.quantity * holding.currentPrice;
    const holdingCostBasis = holding.quantity * holding.costBasis;

    totalValue += holdingValue;
    totalCostBasis += holdingCostBasis;
  });

  const totalGainLoss = totalValue - totalCostBasis;
  const totalGainLossPercent =
    totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

  return {
    totalValue,
    totalCostBasis,
    totalGainLoss,
    totalGainLossPercent,
  };
}
