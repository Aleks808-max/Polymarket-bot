export { RateLimiter, ApiType } from './core/rate-limiter.js';
export { Cache, CACHE_TTL } from './core/cache.js';
export { PolymarketError, ErrorCode, withRetry } from './core/errors.js';
export * from './core/types.js';

// Central risk gate
export { RiskManager } from './services/risk-manager.js';
export type {
  RiskConfig,
  RiskDecision,
  RiskSnapshot,
  RiskTradeContext,
} from './services/risk-manager.js';

// Cache integration (new)
export type { UnifiedCache } from './core/unified-cache.js';
export { createUnifiedCache } from './core/unified-cache.js';

// API Clients
export { DataApiClient } from './clients/data-api.js';
export type {
  Position,
  Activity,
  Trade,
  LeaderboardEntry,
  LeaderboardResult,
  // Leaderboard parameters (supports time period filtering)
  LeaderboardParams,
  LeaderboardTimePeriod,
  LeaderboardOrderBy,
  LeaderboardCategory,
  // P0/P1/P2 Gap Analysis types
  ActivityParams,
  PositionsParams,
  TradesParams,
  HoldersParams,
  AccountValue,
  MarketHolder,
  // Closed positions
  ClosedPosition,
  ClosedPositionsParams,
} from './clients/data-api.js';

export { GammaApiClient } from './clients/gamma-api.js';
export type {
  GammaMarket,
  GammaEvent,
  MarketSearchParams,
} from './clients/gamma-api.js';

// ... existing content preserved below
