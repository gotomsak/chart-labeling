import prisma from "@/utils/db";
import { type FetchedCandle, fetchCandles, type Interval } from "@/utils/yahooFinance";

export interface IngestResult {
  symbol: string;
  interval: Interval;
  inserted: number;
  updated: number;
  total: number;
}

export const ingestSymbol = async (
  symbol: string,
  interval: Interval,
  from: Date,
  to: Date,
): Promise<IngestResult> => {
  const master = await prisma.chartMaster.findUnique({ where: { symbol } });
  if (!master) {
    throw new Error(`ChartMaster not found for symbol ${symbol}. Run db:seed first.`);
  }

  const candles: FetchedCandle[] = await fetchCandles(symbol, interval, from, to);

  if (candles.length === 0) {
    return { symbol, interval, inserted: 0, updated: 0, total: 0 };
  }

  // 既存件数を計測（差分で inserted/updated を推定）
  const existing = await prisma.candle.count({
    where: {
      chartMasterId: master.id,
      interval,
      time: {
        in: candles.map((c) => BigInt(c.time)),
      },
    },
  });

  // upsert ループ（バッチ最適化は別タスク）
  for (const c of candles) {
    await prisma.candle.upsert({
      where: {
        chartMasterId_interval_time: {
          chartMasterId: master.id,
          interval,
          time: BigInt(c.time),
        },
      },
      update: {
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        source: "yahoo",
        fetchedAt: new Date(),
      },
      create: {
        chartMasterId: master.id,
        interval,
        time: BigInt(c.time),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        source: "yahoo",
      },
    });
  }

  return {
    symbol,
    interval,
    inserted: candles.length - existing,
    updated: existing,
    total: candles.length,
  };
};
