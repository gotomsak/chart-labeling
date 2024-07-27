'use client'
import React, { useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import axios from 'axios';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { CandleType, GetResponse } from '@/app/api/candles/route';
import LightweightChartComponent from './LightweightChartComponent';


const dataTest = [
  {
    time: '2023-07-01',
    open: 10,
    high: 20,
    low: 30,
    close: 15
  },
  {
    time: '2023-07-02',
    open: 10,
    high: 20,
    low: 30,
    close: 15
  },
  // 追加データポイント
];

const fetchMoreData = async (startIndex: number, stopIndex: number) => {
  const response = await axios.get(`/api/candles?start=${startIndex}&end=${stopIndex}`);
  return response.data;
};


const CandleChart = () => {
  const [data, setData] = useState<CandleType[]>([]);
  const [selectedData, setSelectedData] = useState(null);

  useEffect(() => {
    fetchMoreData(0, 100000).then(newData => {
      setData(newData)
      console.log(newData)
    });
  }, []);


  return (
    <div>
      <LightweightChartComponent data={data} />
    </div>
  );
};

export default CandleChart;
