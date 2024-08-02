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

export const findManyBookmark = async () => {
  try {
    const response = await axios.get(`/api/bookmark`)
    return response.data
  } catch (error) {
    console.log(error)
  }
}