import axios from "axios"
import { CreateChartLabelingRequestBody } from "./route"


export const createChartLabeling = async (body: CreateChartLabelingRequestBody) => {
  try {
    const response = await axios.post(`/api/candles`, body)
    return response.data
  } catch (error) {
    console.log(error)
  }
}