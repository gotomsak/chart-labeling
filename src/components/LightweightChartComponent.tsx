'use client'
import { useContext, useEffect, useRef } from 'react';
import { createChart, IChartApi, Time } from 'lightweight-charts';
import { CandleType } from '@/app/api/candles/route';
import { ChartClickDataContext } from '@/provider/ChartClickDataProvider';


interface LightweightChartComponentProps {
  data: CandleType[];
}

const LightweightChartComponent= ({ data }:LightweightChartComponentProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { chartClickDataState, chartClickDataDispatch} = useContext(ChartClickDataContext);

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
          chartClickDataDispatch({type:"setData", payload: seriesDataMap})
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

  return <div ref={chartContainerRef} />;
};

export default LightweightChartComponent;
