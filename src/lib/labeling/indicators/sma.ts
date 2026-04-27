/**
 * Simple Moving Average. 期間に満たない位置は null。
 */
export const sma = (values: number[], period: number): (number | null)[] => {
  if (period <= 0) throw new Error("period must be > 0");
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  result[period - 1] = sum / period;

  for (let i = period; i < values.length; i++) {
    sum += values[i] - values[i - period];
    result[i] = sum / period;
  }
  return result;
};
