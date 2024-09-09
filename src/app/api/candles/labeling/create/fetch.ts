import axios from "axios"

interface Request{
  labelingName: string
  pair: string
}
export const labelingCreate=async(data: Request)=>{
  return await axios.post(`/api/candles/labeling/create`,data)
}