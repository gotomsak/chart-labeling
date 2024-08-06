import axios from "axios"

export const getLabels = async () => {
  return (await axios.get('/api/candles/labels')).data
}