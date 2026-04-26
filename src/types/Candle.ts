import type { Time } from "lightweight-charts";

export interface CandleType {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}
