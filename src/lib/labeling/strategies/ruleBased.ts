import { rsi } from "../indicators/rsi";
import { sma } from "../indicators/sma";
import type { CandleInput, LabelingResult, MarkerOutput, RuleBasedConfig } from "../types";

type Position = { side: "long" | "short"; entryPrice: number; entryIndex: number } | null;

const buyMarker = (time: number): MarkerOutput => ({
  time,
  position: "belowBar",
  color: "#2196F3",
  shape: "arrowUp",
  text: `auto buy ${time}`,
  label: 1,
});

const sellMarker = (time: number): MarkerOutput => ({
  time,
  position: "aboveBar",
  color: "#e91e63",
  shape: "arrowDown",
  text: `auto sell ${time}`,
  label: 2,
});

const takeProfitMarker = (time: number): MarkerOutput => ({
  time,
  position: "belowBar",
  color: "#f68410",
  shape: "circle",
  text: `auto profit ${time}`,
  label: 3,
});

/**
 * SMA(short) と SMA(long) のクロス + RSI フィルタで買い/売りシグナルを生成し、
 * `takeProfitPct` 到達 or 反対シグナルで利確マーカーを置く。
 */
export const labelByRules = (candles: CandleInput[], config: RuleBasedConfig): LabelingResult => {
  const closes = candles.map((c) => c.close);
  const shortMa = sma(closes, config.shortPeriod);
  const longMa = sma(closes, config.longPeriod);
  const rsiSeries = rsi(closes, config.rsiPeriod);

  const markers: MarkerOutput[] = [];
  let position: Position = null;

  for (let i = 1; i < candles.length; i++) {
    const s = shortMa[i];
    const sPrev = shortMa[i - 1];
    const l = longMa[i];
    const lPrev = longMa[i - 1];
    const r = rsiSeries[i];
    if (s == null || sPrev == null || l == null || lPrev == null || r == null) continue;

    const close = candles[i].close;
    const time = candles[i].time;

    // 利確判定（先にチェック）
    if (position) {
      const pct =
        position.side === "long"
          ? (close - position.entryPrice) / position.entryPrice
          : (position.entryPrice - close) / position.entryPrice;
      if (pct >= config.takeProfitPct) {
        markers.push(takeProfitMarker(time));
        position = null;
        continue;
      }
    }

    const crossUp = sPrev <= lPrev && s > l;
    const crossDown = sPrev >= lPrev && s < l;

    if (crossUp && r < config.rsiUpperBound) {
      // 反対ポジを利確扱いで閉じる
      if (position?.side === "short") {
        markers.push(takeProfitMarker(time));
      }
      markers.push(buyMarker(time));
      position = { side: "long", entryPrice: close, entryIndex: i };
    } else if (crossDown && r > config.rsiLowerBound) {
      if (position?.side === "long") {
        markers.push(takeProfitMarker(time));
      }
      markers.push(sellMarker(time));
      position = { side: "short", entryPrice: close, entryIndex: i };
    }
  }

  const counts = {
    buy: markers.filter((m) => m.label === 1).length,
    sell: markers.filter((m) => m.label === 2).length,
    takeProfit: markers.filter((m) => m.label === 3).length,
    none: candles.length - markers.length,
  };

  return { markers, counts };
};
