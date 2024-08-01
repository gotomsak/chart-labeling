import { UTCTimestamp } from "lightweight-charts";

export interface CandleType {
  time: UTCTimestamp,
  open: number,
  high: number,
  low: number,
  close: number
}