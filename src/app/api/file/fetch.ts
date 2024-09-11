import axios from "axios"
import { Time } from "lightweight-charts"


export const fileCreate = async (pair: string, from: Time, to: Time, label: string) => {
  const response = await axios.post(`/api/file?pair=${pair}&from=${from}&to=${to}&label=${label}`)
  return response.data
}