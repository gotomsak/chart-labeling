import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const LightweightChartComponent = ({ data }:any) => {
  const chartContainerRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    const chart = createChart(chartContainerRef.current, { width: 1000, height: 400 });
    const candleSeries = chart.addCandlestickSeries();
    
    const formattedData = data.map((item:any) => {
      // 'yyyy-mm-dd hh:mm'形式の日付をUNIXタイムスタンプに変換する
      const [date, time] = item.time.split(' ');
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, day, hours, minutes));
      return {
        time: dateObj.getTime() / 1000,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      };
    });
    console.log(formattedData)
    candleSeries.setData(formattedData);
    
    if (formattedData.length !==0){
      
      chart.timeScale().setVisibleRange({
        from: formattedData[0].time,
        to: formattedData[0].time + 36000*7,
      })

      chart.subscribeClick((param:any) => {
        if (param.time) {
          console.log(param.seriesData)
          const seriesDataMap = param.seriesData.get(candleSeries);
          console.log(seriesDataMap)
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

  return <div ref={chartContainerRef} style={{ height: '400px' }} />;
};

export default LightweightChartComponent;
