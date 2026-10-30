/**
 * ResumeSprint Pipeline Performance & Telemetry Instrumentation
 * Lightweight, zero-overhead stage timer with structured logging and Server-Timing support.
 */

export interface StageMetric {
  stage: string;
  durationMs: number;
  success: boolean;
  itemCount?: number;
  retryCount?: number;
  error?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface PipelineReport {
  correlationId: string;
  totalDurationMs: number;
  stages: StageMetric[];
  bottleneckStage: string;
  cached: boolean;
}

export class PipelineTracer {
  private correlationId: string;
  private startTime: number;
  private stageStarts: Map<string, number> = new Map();
  private metrics: StageMetric[] = [];
  private isCached = false;

  constructor(correlationId?: string) {
    this.correlationId =
      correlationId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.startTime = performance.now();
  }

  public getCorrelationId(): string {
    return this.correlationId;
  }

  public setCached(cached: boolean): void {
    this.isCached = cached;
  }

  public startStage(stage: string): void {
    this.stageStarts.set(stage, performance.now());
  }

  public endStage(
    stage: string,
    options?: {
      success?: boolean;
      itemCount?: number;
      retryCount?: number;
      error?: string;
      metadata?: Record<string, string | number | boolean>;
    }
  ): number {
    const start = this.stageStarts.get(stage) || performance.now();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    this.stageStarts.delete(stage);

    const metric: StageMetric = {
      stage,
      durationMs,
      success: options?.success !== false,
      itemCount: options?.itemCount,
      retryCount: options?.retryCount || 0,
      error: options?.error,
      metadata: options?.metadata,
    };

    this.metrics.push(metric);
    return durationMs;
  }

  /**
   * Execute an async block within an instrumented stage.
   */
  public async traceStage<T>(
    stage: string,
    fn: () => Promise<T>,
    options?: { getItemCount?: (res: T) => number }
  ): Promise<T> {
    this.startStage(stage);
    try {
      const res = await fn();
      const itemCount = options?.getItemCount ? options.getItemCount(res) : undefined;
      this.endStage(stage, { success: true, itemCount });
      return res;
    } catch (err: any) {
      this.endStage(stage, {
        success: false,
        error: err?.message ? String(err.message).substring(0, 100) : "Unknown error",
      });
      throw err;
    }
  }

  /**
   * Execute a synchronous block within an instrumented stage.
   */
  public traceSync<T>(
    stage: string,
    fn: () => T,
    options?: { getItemCount?: (res: T) => number }
  ): T {
    this.startStage(stage);
    try {
      const res = fn();
      const itemCount = options?.getItemCount ? options.getItemCount(res) : undefined;
      this.endStage(stage, { success: true, itemCount });
      return res;
    } catch (err: any) {
      this.endStage(stage, {
        success: false,
        error: err?.message ? String(err.message).substring(0, 100) : "Unknown error",
      });
      throw err;
    }
  }

  public getReport(): PipelineReport {
    const totalDurationMs = Math.round((performance.now() - this.startTime) * 100) / 100;

    let bottleneckStage = "none";
    let maxDuration = 0;
    for (const m of this.metrics) {
      if (m.durationMs > maxDuration) {
        maxDuration = m.durationMs;
        bottleneckStage = m.stage;
      }
    }

    return {
      correlationId: this.correlationId,
      totalDurationMs,
      stages: this.metrics,
      bottleneckStage,
      cached: this.isCached,
    };
  }

  /**
   * Generate RFC-compliant Server-Timing header value.
   * e.g. "parsing;dur=12.4, rubric_match;dur=45.2, total;dur=120.5"
   */
  public toServerTimingHeader(): string {
    const timings = this.metrics.map(
      (m) => `${m.stage.replace(/[^a-zA-Z0-9_-]/g, "_")};dur=${m.durationMs}`
    );
    const total = Math.round((performance.now() - this.startTime) * 100) / 100;
    timings.push(`total;dur=${total}`);
    return timings.join(", ");
  }

  /**
   * Log structured performance summary (without PII or resume text).
   */
  public logSummary(): void {
    const report = this.getReport();
    console.log(
      `[PipelinePerformance] id=${report.correlationId} total=${report.totalDurationMs}ms bottleneck=${report.bottleneckStage} cached=${report.cached} stages=${this.metrics
        .map((m) => `${m.stage}:${m.durationMs}ms`)
        .join(" | ")}`
    );
  }
}
