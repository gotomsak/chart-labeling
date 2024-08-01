'use client'

import CandleChart from "@/components/CandleChart";
import './style.css'
import { useContext, useEffect, useState } from "react";
import { ChartClickDataContext, ChartClickDataProvider } from "@/provider/ChartClickDataProvider";


const ChartPage = () => {

  // const { chartClickData, setChartClickData } = useChartClickData();  
  const { chartClickDataState} = useContext(ChartClickDataContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, [])

  useEffect(()=>{
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
            <h1>test</h1>
            {chartClickDataState.close}
          </div>
        </div>
    </div>
  )
}

export default ChartPage;