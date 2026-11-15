export interface RiskConfig {
  initialEquityUsd?: number;
  dailyLossPercent?: number;
  monthlyLossPercent?: number;
  totalLossPercent?: number;
  maxDrawdownPercent?: number;
  maxExposureUsd?: number;
  maxOpenPositions?: number;
  pauseAfterLossPercent?: number;
  pauseAfterLossMs?: number;
  haltOnMaxLoss?: boolean;
  enableGlobalGate?: boolean;
}

export interface RiskTradeContext {
  currentExposureUsd?: number;
  openPositions?: number;
  orderValueUsd?: number;
  reason?: string;
}

export interface RiskDecision {
  allowed: boolean;
  code: 'OK' | 'HALTED' | 'PAUSED' | 'DAILY_LIMIT' | 'MONTHLY_LIMIT' | 'TOTAL_LIMIT' | 'DRAWDOWN' | 'EXPOSURE' | 'POSITION_LIMIT';
  reason: string;
}

export interface RiskSnapshot {
  initialEquityUsd: number;
  equityUsd: number;
  peakEquityUsd: number;
  dailyPnlUsd: number;
  monthlyPnlUsd: number;
  totalPnlUsd: number;
  drawdownPercent: number;
  openExposureUsd: number;
  openPositions: number;
  pausedUntilTs: number;
  haltReason?: string;
}
