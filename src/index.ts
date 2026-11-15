import type { CacheAdapter } from '@catalyst-team/cache';
import type { RiskConfig } from './types.js';

// ===== Basic Trading Types =====

/**
 * Order side: BUY or SELL
 */
export type Side = 'BUY' | 'SELL';

/**
 * Order type for limit/market orders
 * - GTC: Good Till Cancelled (default for limit orders)
 * - GTD: Good Till Date (limit order with expiration)
 * - FOK: Fill Or Kill (market order, must fill completely or cancel)
 * - FAK: Fill And Kill (market order, fill what you can, cancel rest)
 */
export type OrderType = 'GTC' | 'FOK' | 'GTD' | 'FAK';

/**
 * Base trade interface with common fields
 *
 * This is the minimal set of fields that all trade types share.
 * Specific trade types (Trade, TradeInfo, ActivityTrade, ParsedTrade)
 * extend this with source-specific fields.
 */
export interface BaseTrade {
  /** Trade side: BUY or SELL */
  side: Side;
  /** Trade price */
  price: number;
  /** Trade size (in shares/tokens) */
  size: number;
  /** Timestamp (Unix milliseconds) */
  timestamp: number;
}

// ===== Orderbook Types =====

/**
 * Price level in an orderbook
 */
export interface OrderbookLevel {
  price: number;
  size: number;
}

/**
 * Unified Orderbook type used across the SDK
 *
 * This is the base orderbook structure. Services may extend this
 * with additional fields (e.g., OrderbookSnapshot adds tickSize, minOrderSize).
 */
export interface Orderbook {
  /** Token ID (ERC-1155 token identifier) */
  tokenId?: string;
  /** @deprecated Use tokenId instead */
  assetId?: string;
  /** Bid levels (highest first) */
  bids: OrderbookLevel[];
  /** Ask levels (lowest first) */
  asks: OrderbookLevel[];
  /** Timestamp in milliseconds */
  timestamp: number;
  /** Market identifier (conditionId) */
  market?: string;
  /** Hash for change detection */
  hash?: string;
}

/**
 * SDK Configuration Options
 *
 * Allows dependency injection of cache adapters for API response caching.
 *
 * @example
 * ```typescript
 * import { createMemoryCache } from '@catalyst-team/cache';
 * import { PolymarketSDK } from '@catalyst-team/poly-sdk';
 *
 * // Use external cache adapter
 * const cache = createMemoryCache({ defaultTTL: 120 });
 * const sdk = new PolymarketSDK({ cache });
 *
 * // Or use default internal cache
 * const sdk2 = new PolymarketSDK();
 * ```
 */
export interface PolySDKOptions {
  /**
   * Optional external cache adapter for API response caching.
   * If not provided, the SDK will use its internal memory cache.
   *
   * Benefits of external cache:
   * - Can use Redis for multi-instance cache sharing
   * - Can configure custom TTL settings
   * - Can track cache hit/miss statistics
   */
  cache?: CacheAdapter;

  /**
   * Blockchain chain ID (default: 137 for Polygon mainnet)
   */
  chainId?: number;

  /**
   * Private key for trading operations (hex string starting with 0x)
   */
  privateKey?: string;

  /**
   * API credentials for trading
   */
  creds?: {
    key: string;
    secret: string;
    passphrase: string;
  };

  /**
   * Central risk gate configuration. If enabled, all trading actions are
   * validated before execution.
   */
  risk?: Partial<RiskConfig>;
}

// K-Line interval types
// Short intervals (1s, 5s, 15s) for 15-minute crypto markets
// Standard intervals (30s, 1m, 5m, 15m, 30m, 1h, 4h, 12h, 1d) for general use
export type KLineInterval = '1s' | '5s' | '15s' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '12h' | '1d';

// K-Line candle data
export interface KLineCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradeCount: number;
  buyVolume: number;
  sellVolume: number;
}

// ... rest of file omitted for brevity, existing contents preserved
