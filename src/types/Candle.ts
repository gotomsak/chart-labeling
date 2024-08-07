import { Time, UTCTimestamp } from "lightweight-charts";

export interface CandleType {
  time: Time,
  open: number,
  high: number,
  low: number,
  close: number
}