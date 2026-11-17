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

export class RiskManager {
  private snapshot: RiskSnapshot;
  private config: RiskConfig;

  constructor(config: Partial<RiskConfig> = {}) {
    this.config = {
      initialEquityUsd: 250,
      dailyLossPercent: 0.05,
      monthlyLossPercent: 0.15,
      totalLossPercent: 0.4,
      maxDrawdownPercent: 0.25,
      maxExposureUsd: 250 * 0.3,
      maxOpenPositions: 8,
      pauseAfterLossPercent: 0.05,
      pauseAfterLossMs: 60 * 60 * 1000,
      haltOnMaxLoss: true,
      enableGlobalGate: true,
      ...config,
    };

    this.snapshot = {
      initialEquityUsd: this.config.initialEquityUsd ?? 250,
      equityUsd: this.config.initialEquityUsd ?? 250,
      peakEquityUsd: this.config.initialEquityUsd ?? 250,
      dailyPnlUsd: 0,
      monthlyPnlUsd: 0,
      totalPnlUsd: 0,
      drawdownPercent: 0,
      openExposureUsd: 0,
      openPositions: 0,
      pausedUntilTs: 0,
    };
  }

  public getSnapshot(): RiskSnapshot {
    return { ...this.snapshot };
  }

  public updateEquity(equityUsd: number): void {
    this.snapshot.equityUsd = equityUsd;
    if (equityUsd > this.snapshot.peakEquityUsd) {
      this.snapshot.peakEquityUsd = equityUsd;
    }
    this.snapshot.drawdownPercent =
      this.snapshot.peakEquityUsd > 0
        ? (this.snapshot.peakEquityUsd - this.snapshot.equityUsd) / this.snapshot.peakEquityUsd
        : 0;
  }

  public recordTradePnl(profitUsd: number): void {
    this.snapshot.dailyPnlUsd += profitUsd;
    this.snapshot.monthlyPnlUsd += profitUsd;
    this.snapshot.totalPnlUsd += profitUsd;
    this.snapshot.equityUsd = (this.config.initialEquityUsd ?? 250) + this.snapshot.totalPnlUsd;
    this.updateEquity(this.snapshot.equityUsd);
  }

  public setExposure(exposureUsd: number): void {
    this.snapshot.openExposureUsd = exposureUsd;
  }

  public setOpenPositions(count: number): void {
    this.snapshot.openPositions = count;
  }

  public checkTrade(ctx: RiskTradeContext): RiskDecision {
    if (!this.config.enableGlobalGate) {
      return { allowed: true, code: 'OK', reason: 'risk gate disabled' };
    }

    if (this.snapshot.haltReason) {
      return { allowed: false, code: 'HALTED', reason: this.snapshot.haltReason };
    }

    if (this.snapshot.pausedUntilTs > Date.now()) {
      return {
        allowed: false,
        code: 'PAUSED',
        reason: `pause active until ${new Date(this.snapshot.pausedUntilTs).toISOString()}`,
      };
    }

    const dailyLimit = (this.config.initialEquityUsd ?? 250) * (this.config.dailyLossPercent ?? 0.05);
    if (this.snapshot.dailyPnlUsd <= -dailyLimit) {
      this.snapshot.pausedUntilTs = Date.now() + (this.config.pauseAfterLossMs ?? 60 * 60 * 1000);
      return {
        allowed: false,
        code: 'DAILY_LIMIT',
        reason: `daily loss limit hit: ${this.snapshot.dailyPnlUsd.toFixed(2)} <= -${dailyLimit.toFixed(2)}`,
      };
    }

    const monthlyLimit = (this.config.initialEquityUsd ?? 250) * (this.config.monthlyLossPercent ?? 0.15);
    if (this.snapshot.monthlyPnlUsd <= -monthlyLimit) {
      this.snapshot.pausedUntilTs = Date.now() + (this.config.pauseAfterLossMs ?? 60 * 60 * 1000);
      return {
        allowed: false,
        code: 'MONTHLY_LIMIT',
        reason: `monthly loss limit hit: ${this.snapshot.monthlyPnlUsd.toFixed(2)} <= -${monthlyLimit.toFixed(2)}`,
      };
    }

    const totalLimit = (this.config.initialEquityUsd ?? 250) * (this.config.totalLossPercent ?? 0.4);
    if (this.snapshot.totalPnlUsd <= -totalLimit) {
      this.snapshot.haltReason = `total loss limit hit: ${this.snapshot.totalPnlUsd.toFixed(2)} <= -${totalLimit.toFixed(2)}`;
      return {
        allowed: false,
        code: 'TOTAL_LIMIT',
        reason: this.snapshot.haltReason,
      };
    }

    if (this.snapshot.drawdownPercent >= (this.config.maxDrawdownPercent ?? 0.25)) {
      this.snapshot.pausedUntilTs = Date.now() + (this.config.pauseAfterLossMs ?? 60 * 60 * 1000);
      return {
        allowed: false,
        code: 'DRAWDOWN',
        reason: `drawdown hit ${this.snapshot.drawdownPercent * 100}% >= ${(this.config.maxDrawdownPercent ?? 0.25) * 100}%`,
      };
    }

    const currentExposure = this.snapshot.openExposureUsd + (ctx.orderValueUsd ?? 0);
    const maxExposure = this.config.maxExposureUsd ?? 250 * 0.3;
    if (currentExposure > maxExposure) {
      return {
        allowed: false,
        code: 'EXPOSURE',
        reason: `exposure would exceed max: ${currentExposure.toFixed(2)} > ${maxExposure.toFixed(2)}`,
      };
    }

    const nextOpenPositions = (this.snapshot.openPositions + 1);
    const maxOpenPositions = this.config.maxOpenPositions ?? 8;
    if (nextOpenPositions > maxOpenPositions) {
      return {
        allowed: false,
        code: 'POSITION_LIMIT',
        reason: `open positions would exceed max: ${nextOpenPositions} > ${maxOpenPositions}`,
      };
    }

    return {
      allowed: true,
      code: 'OK',
      reason: 'risk check passed',
    };
  }

  public resetDailyMonthly(): void {
    this.snapshot.dailyPnlUsd = 0;
    this.snapshot.monthlyPnlUsd = 0;
  }
}
