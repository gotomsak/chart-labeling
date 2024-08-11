import axios from "axios"
import { BookmarkRequestBody } from "./route"


export const registerBookmark = async (body: BookmarkRequestBody) => {
  try {
    console.log(body)
    const response = await axios.post(`/api/bookmark`, body)
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const findManyBookmark = async (chart_id:number) => {
  try {
    const response = await axios.get(`/api/bookmark?chart_id=${chart_id}`)
    return response.data
  } catch (error) {
    console.log(error)
  }
}