'use client'
import InfiniteLoader from 'react-window-infinite-loader';
import axios from 'axios';

import { useState, useEffect, ReactNode } from 'react';
import { CandleType } from '@/app/api/candles/route';


const fetchMoreData = async (startIndex: number, stopIndex: number) => {
  const response = await axios.get(`/api/candles?start=${startIndex}&end=${stopIndex}`);
  return response.data;
};

interface Props {
  children: ReactNode
}
const Loader = ({ children }: Props) => {
  const [data, setData] = useState<CandleType[]>([]);
  const isItemLoaded = (index: number) => !!data[index];
  const [selectedData, setSelectedData] = useState(null);

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
          <div>
            {children}
          </div>
        )}


      </InfiniteLoader>
    </div>
  )
}

export default Loader