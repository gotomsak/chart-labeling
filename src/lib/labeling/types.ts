export type LabelKind = 0 | 1 | 2 | 3; // 0:none, 1:buy, 2:sell, 3:take-profit

export interface CandleInput {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface MarkerOutput {
  time: number;
  position: "belowBar" | "aboveBar" | "inBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle";
  text: string;
  label: LabelKind;
}

export interface RuleBasedConfig {
  shortPeriod: number;
  longPeriod: number;
  rsiPeriod: number;
  rsiUpperBound: number;
  rsiLowerBound: number;
  takeProfitPct: number; // 0.005 = 0.5%
}

export const DEFAULT_RULE_CONFIG_FX: RuleBasedConfig = {
  shortPeriod: 5,
  longPeriod: 20,
  rsiPeriod: 14,
  rsiUpperBound: 70,
  rsiLowerBound: 30,
  takeProfitPct: 0.005,
};

export const DEFAULT_RULE_CONFIG_STOCK: RuleBasedConfig = {
  shortPeriod: 5,
  longPeriod: 20,
  rsiPeriod: 14,
  rsiUpperBound: 70,
  rsiLowerBound: 30,
  takeProfitPct: 0.02,
};

export interface LabelingResult {
  markers: MarkerOutput[];
  counts: {
    buy: number;
    sell: number;
    takeProfit: number;
    none: number;
  };
}
