import axios from "axios";
import { labeling, labelingPost } from "./route";


export const labelingFetch = async (data:labelingPost, id: number) => {
  const res = await axios.post(`/api/candles/labeling?id=${id}`,data)
  return res;
}
 
