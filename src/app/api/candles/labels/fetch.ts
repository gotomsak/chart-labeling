import axios from "axios";

export const getLabels = async (symbol?: string) => {
  return await axios.get("/api/candles/labels", {
    params: symbol ? { symbol } : undefined,
  });
};
