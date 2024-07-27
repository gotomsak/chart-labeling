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
    fetchMoreData(0, 100000).then(newData =>{setData(newData)
      console.log(newData)
    });
  }, []);

  const isItemLoaded = (index: number) => !!data[index];

  const loadMoreItems = (startIndex: number, stopIndex: number) => {
    return fetchMoreData(startIndex, stopIndex).then(newData => {
      setData(prevData => [...prevData, ...newData]);
    });
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const candle = data[index];
    return candle ? (
      <div style={style}>
        {/* <div>{candle.date}</div>
        <div>Open: {candle.open}</div>
        <div>Close: {candle.close}</div>
        <div>High: {candle.high}</div>
        <div>Low: {candle.low}</div> */}

      </div>
    ) : (
      <div style={style}>Loading...</div>
    );
  };


  return (
    <div>

      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={10000}
        loadMoreItems={loadMoreItems}
      >
        {({ onItemsRendered, ref }) => (
          <LightweightChartComponent data={data} />
          // <List
          //   height={600}
          //   itemCount={data.length}
          //   itemSize={35}
          //   width={300}
          //   onItemsRendered={onItemsRendered}
          //   ref={ref}
          // >
          //   {Row}
          // </List>
        )}
      </InfiniteLoader>
    </div>
  );
};

export default CandleChart;
