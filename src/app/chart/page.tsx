'use client'

import CandleChart from "@/components/CandleChart";
import './style.css'
import { useContext, useEffect, useState } from "react";
import { ChartClickDataContext, ChartClickDataProvider } from "@/provider/ChartClickDataProvider";
import { findManyBookmark, registerBookmark } from "../api/bookmark/fetch";
import FindManyBookmarkView from "@/components/FindManyBookmarkView";
import { UTCTimestamp } from "lightweight-charts";
import { BookmarkData } from "../api/bookmark/route";

const ChartPage = () => {

  // const { chartClickData, setChartClickData } = useChartClickData();  
  const { chartClickDataState } = useContext(ChartClickDataContext);
  const [isLoading, setIsLoading] = useState(true);
  const [bookMarks, setBookmarks] = useState<BookmarkData[]>([])
  useEffect(() => {
    setIsLoading(false);
    findManyBookmark().then((res)=>{
      console.log(res)
      setBookmarks(res)
    })
  }, [])

  useEffect(() => {
    console.log(chartClickDataState)
  }, [chartClickDataState])

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="container">
        <div className="column">
          <CandleChart></CandleChart>
        </div>
        <div className="column">
          <h2>close</h2>
          {chartClickDataState.close}
          <h2>time</h2>
          {chartClickDataState.time}
          <br></br>

          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            onClick={async() => {
              const result = await registerBookmark({ time: chartClickDataState.time })
              console.log(result)
            }}>この時間でBookmark
          </button>
          <FindManyBookmarkView times={bookMarks}>

          </FindManyBookmarkView>
        </div>
      </div>
    </div>
  )
}

export default ChartPage;