import axios from "axios"
import { CreateChartLabelingRequestBody } from "./route"

export const fetchMoreData = async (startIndex: number, stopIndex: number, timeFrame: string, pair: string, reference: string, id?: number) => {
  const response = await axios.get(`/api/candles?start=${startIndex}&end=${stopIndex}&time_frame=${timeFrame}&pair=${pair}&reference=${reference}${id !== undefined ? '&id=' + id.toString() : ""}`);
  return response.data;
};


export const createChartLabeling = async (body: CreateChartLabelingRequestBody) => {
  try {
    const response = await axios.post(`/api/candles`, body)
    return response.data
  } catch (error) {
    console.log(error)
  }
}