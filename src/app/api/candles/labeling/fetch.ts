import axios from "axios";
import { labeling, LabelingPostJson } from "./route";
import { SeriesMarker, Time } from "lightweight-charts";


export const labelingFetch = async (data: SeriesMarker<Time>[], id: string) => {
  const res = await axios.post(`/api/candles/labeling?id=${id}`, data)
  return res;
}

export const getLabelingData = async (id: string) => {
  const res = await axios.get(`/api/candles/labeling?id=${id}`)
  return res;
}