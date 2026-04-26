import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance();

export type Interval = "5m" | "15m" | "1h" | "4h" | "1d";

interface NonNullBar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  [key: string]: unknown;
}

const INTERVAL_MAP: Record<Interval, "5m" | "15m" | "1h" | "1d"> = {
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "1h", // Yahoo は 4h 直接非対応 → 1h を取得し、呼び出し側で集約
  "1d": "1d",
};

export interface FetchedCandle {
  time: number; // Unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Yahoo Finance から OHLCV を取得して正規化する。
 * `interval=4h` の場合は 1h 足を 4 本ずつ集約して 4h を生成する。
 */
export const fetchCandles = async (
  symbol: string,
  interval: Interval,
  from: Date,
  to: Date,
): Promise<FetchedCandle[]> => {
  const yfInterval = INTERVAL_MAP[interval];
  const result = await yf.chart(symbol, {
    period1: from,
    period2: to,
    interval: yfInterval,
  });

  const bars = (result.quotes ?? []).filter(
    (q): q is NonNullBar =>
      q.date != null && q.open != null && q.high != null && q.low != null && q.close != null,
  );

  const normalized = bars.map((b) => ({
    time: Math.floor(b.date.getTime() / 1000),
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume ?? 0,
  }));

  if (interval === "4h") {
    return aggregate4h(normalized);
  }
  return normalized;
};

const aggregate4h = (bars: FetchedCandle[]): FetchedCandle[] => {
  const buckets = new Map<number, FetchedCandle[]>();
  for (const b of bars) {
    const bucketStart = Math.floor(b.time / (4 * 3600)) * (4 * 3600);
    const arr = buckets.get(bucketStart);
    if (arr) {
      arr.push(b);
    } else {
      buckets.set(bucketStart, [b]);
    }
  }
  const result: FetchedCandle[] = [];
  for (const [bucketStart, group] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
    if (group.length === 0) continue;
    result.push({
      time: bucketStart,
      open: group[0].open,
      high: Math.max(...group.map((g) => g.high)),
      low: Math.min(...group.map((g) => g.low)),
      close: group[group.length - 1].close,
      volume: group.reduce((sum, g) => sum + g.volume, 0),
    });
  }
  return result;
};
