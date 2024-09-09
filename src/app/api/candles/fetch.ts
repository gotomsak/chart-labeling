import axios from "axios"
import { CreateChartLabelingRequestBody } from "./route"

// export const fetchMoreData = async (startIndex: number, barNum: number, timeFrame: string, pair: string, reference: string, id?: number) => {
//   const response = await axios.get(`/api/candles?start=${startIndex}&bar_num=${barNum}&time_frame=${timeFrame}&pair=${pair}&reference=${reference}${id !== undefined ? '&id=' + id.toString() : ""}`);
//   return response.data;
// };

export const fetchMoreData = async (timeFrame: string, pair: string, index: string, limit:string) => {
  const response = await axios.get(`/api/candles?index=${index}&limit=${limit}&time_frame=${timeFrame}&pair=${pair}`);
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