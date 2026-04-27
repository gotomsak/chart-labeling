import prisma from "@/utils/db";
import { labelByRules } from "./strategies/ruleBased";
import {
  DEFAULT_RULE_CONFIG_FX,
  DEFAULT_RULE_CONFIG_STOCK,
  type LabelingResult,
  type RuleBasedConfig,
} from "./types";

export interface RunOptions {
  symbol: string;
  interval: string;
  from?: Date;
  to?: Date;
  config?: Partial<RuleBasedConfig>;
}

export interface RunContext {
  master: { id: number; assetType: string };
  candleCount: number;
  result: LabelingResult;
  effectiveConfig: RuleBasedConfig;
}

export const runRuleBasedLabeling = async (opts: RunOptions): Promise<RunContext> => {
  const master = await prisma.chartMaster.findUnique({
    where: { symbol: opts.symbol },
    select: { id: true, assetType: true },
  });
  if (!master) {
    throw new Error(`ChartMaster not found for symbol ${opts.symbol}`);
  }

  const defaultConfig =
    master.assetType === "STOCK" ? DEFAULT_RULE_CONFIG_STOCK : DEFAULT_RULE_CONFIG_FX;
  const effectiveConfig: RuleBasedConfig = { ...defaultConfig, ...opts.config };

  const where: {
    chartMasterId: number;
    interval: string;
    time?: { gte?: bigint; lte?: bigint };
  } = {
    chartMasterId: master.id,
    interval: opts.interval,
  };
  if (opts.from || opts.to) {
    where.time = {};
    if (opts.from) where.time.gte = BigInt(Math.floor(opts.from.getTime() / 1000));
    if (opts.to) where.time.lte = BigInt(Math.floor(opts.to.getTime() / 1000));
  }

  const candles = await prisma.candle.findMany({
    where,
    orderBy: { time: "asc" },
    select: { time: true, open: true, high: true, low: true, close: true },
  });

  const inputs = candles.map((c) => ({
    time: Number(c.time),
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));

  const result = labelByRules(inputs, effectiveConfig);
  return { master, candleCount: candles.length, result, effectiveConfig };
};
