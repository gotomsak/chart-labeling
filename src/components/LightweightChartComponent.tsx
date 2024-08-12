'use client'
import { useContext, useEffect, useRef } from 'react';
import { createChart, IChartApi, Time } from 'lightweight-charts';
import { CandleType } from '@/app/api/candles/route';
import { ChartClickDataContext } from '@/provider/ChartClickDataProvider';
import InfiniteLoader from 'react-window-infinite-loader';
import { FixedSizeList as List } from 'react-window';

interface LightweightChartComponentProps {
  data: CandleType[];
  loadMoreItems(startIndex:number, stopIndex:number): void
  // moreParam: {
  //   startIndex: number
  //   barNum: number
  //   timeFrame: string
  //   pair: string
  //   reference: string
  //   dataN: string
  //   id?: number
  // }

}

const LightweightChartComponent = ({ data,loadMoreItems }: LightweightChartComponentProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { chartClickDataState, chartClickDataDispatch } = useContext(ChartClickDataContext);

  const isItemLoaded = (index: number) => !!data[index];

  // const loadMoreItems = (startIndex: number, stopIndex: number) => {
  //   return fetchMoreData(startIndex, stopIndex).then(newData => {
  //     setData(prevData => [...prevData, ...newData]);
  //   });
  // };


  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: 1000,
      height: 400,
      handleScale: true
    });

    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(data);

    if (data.length !== 0) {
      const oldestTime = data[0].time;
      console.log(data[0].time)
      const newestTime = data[1000].time;

      chart.timeScale().setVisibleRange({
        from: oldestTime as Time,
        to: newestTime as Time,
      });
      chart.subscribeClick((param: any) => {
        if (param.time) {
          console.log(param.seriesData)
          const seriesDataMap = param.seriesData.get(candleSeries);
          console.log(seriesDataMap)
          chartClickDataDispatch({ type: "setData", payload: seriesDataMap })
          const { open, high, low, close } = seriesDataMap
          console.log(close)
          const clickedTime = new Date(param.time * 1000).toISOString();
          const clickedValue = close
          console.log(`Clicked at time: ${clickedTime}, value: ${clickedValue}`);
        }
      });
    }


    return () => {
      chart.remove();
    };
  }, [data]);

  return (
    <div>
      <div ref={chartContainerRef} />
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={10000}
        loadMoreItems={loadMoreItems}
      >
        {({ onItemsRendered, ref }) => (
          <List
            height={0}
            itemCount={data.length}
            itemSize={35}
            width={chartContainerRef.current?.clientWidth || 0}
            onItemsRendered={onItemsRendered}
            ref={ref}
          >
            {({ index, style }) => (
              <></>
              // <div style={style}>
              //   {/* グラフの下に追加情報を表示する場合 */}
              //   {`Item ${index}`}
              // </div>
            )}
          </List>

        )}
      </InfiniteLoader>
    </div>
  )

};

export default LightweightChartComponent;
