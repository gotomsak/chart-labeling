'use client'
import { useState, useEffect } from 'react';
// import InfiniteLoader from 'react-window-infinite-loader';
import axios from 'axios';
import { CandleType, GetResponse } from '@/app/api/candles/route';
import LightweightChartComponent from './LightweightChartComponent';



const fetchMoreData = async (startIndex: number, stopIndex: number, timeFrame: string) => {
  const response = await axios.get(`/api/candles?start=${startIndex}&end=${stopIndex}&time_frame=${timeFrame}`);
  return response.data;
};

export interface ChartsCandle {
  data1: CandleType[], data2: CandleType[], data3: CandleType[]
}


const CandleChart = () => {
  const [data, setData] = useState<{ data1: CandleType[], data2: CandleType[], data3: CandleType[] }>({
    data1: [], data2: [], data3: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      const result = { data1: [], data2: [], data3: [] }
      result.data1 = await fetchMoreData(0, 100000, '5T')
      result.data2 = await fetchMoreData(0, Math.round(100000 / 12), '1H')
      result.data3 = await fetchMoreData(0, Math.round(100000 / 48), '4H')
      setData(result)
      setIsLoading(false);
    }
    console.log("test")
    fetchAll()
  }, []);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>5 Minute Chart</h1>
      {data.data1.length !== 0 &&
        <LightweightChartComponent data={data.data1} />
      }
      <h1>1 Hour Chart</h1>
      {data.data2.length !== 0 &&
        <LightweightChartComponent data={data.data2} />
      }
      <h1>4 Hour Chart</h1>
      {data.data3.length !== 0 &&
        <LightweightChartComponent data={data.data2} />
      }

    </div>
  );
};

export default CandleChart;
