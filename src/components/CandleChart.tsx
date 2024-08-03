'use client'
import { useState, useEffect } from 'react';
// import InfiniteLoader from 'react-window-infinite-loader';
import axios from 'axios';
import { CandleType, GetResponse } from '@/app/api/candles/route';
import LightweightChartComponent from './LightweightChartComponent';



const fetchMoreData = async (startIndex: number, stopIndex: number, timeFrame: string, pair: string, reference: string) => {
  const response = await axios.get(`/api/candles?start=${startIndex}&end=${stopIndex}&time_frame=${timeFrame}&pair=${pair}&reference=${reference}`);
  return response.data;
};

export interface ChartsCandle {
  data1: CandleType[], data2: CandleType[], data3: CandleType[]
}

// startTimeと配列の長さで指定でfetchさせたい
interface props {
  startTime?: number
  barNumber?: number
  pair: string
  reference: string
}

const CandleChart = (props: props) => {
  const [data, setData] = useState<{ data1: CandleType[], data2: CandleType[], data3: CandleType[] }>({
    data1: [], data2: [], data3: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      const barNum = 200000
      const result = { data1: [], data2: [], data3: [] }
      result.data1 = await fetchMoreData(0, barNum, '5', props.pair, props.reference)
      result.data2 = await fetchMoreData(0, Math.round(barNum / 12), '1h', props.pair, props.reference)
      result.data3 = await fetchMoreData(0, Math.round(barNum / 48), '4h', props.pair, props.reference)
      setData(result)
      setIsLoading(false);
    }
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
