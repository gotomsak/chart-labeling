'use client'
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, SeriesMarker, Time } from 'lightweight-charts';
import { CandleType } from '@/app/api/candles/route';
import { ChartClickDataContext } from '@/provider/ChartClickDataProvider';


interface LightweightChartComponentProps {
  data: CandleType[];
  labelData: SeriesMarker<Time>[];
  loadMoreItems(movement: boolean): void

}

const calculate200MA = (data: CandleType[]) => {
  const maData = [];
  for (let i = 199; i < data.length; i++) {
    const slice = data.slice(i - 199, i + 1);
    const sum = slice.reduce((acc, candle) => acc + candle.close, 0);
    const maValue = sum / 200;
    maData.push({ time: data[i].time, value: maValue });
  }
  return maData;
};


const LightweightChartComponent = ({ data, labelData, loadMoreItems }: LightweightChartComponentProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { chartClickDataState, chartClickDataDispatch } = useContext(ChartClickDataContext);

  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const maSeriesRef = useRef<any>(null);
  // const isItemLoaded = useCallback((index: number) => !!data[index], [data]);

  const handleLabelData = () => {
    if (candleSeriesRef.current) {
      console.log(labelData)
    
      const newLabelData: SeriesMarker<Time>[] = labelData.filter((v) => data[0].time < v.time && v.time < data[data.length - 1].time)
      console.log(newLabelData)
      candleSeriesRef.current.setMarkers(newLabelData);
      
    }
  }
  const handleChartClick = useCallback((param: any) => {
    //logical: 200000 <, -で判定する
    
    if (param.time) {
      console.log(param.seriesData)
      const seriesDataMap = param.seriesData.get(candleSeriesRef.current);
      console.log(seriesDataMap)
      chartClickDataDispatch({ type: "setData", payload: seriesDataMap })
      const { open, high, low, close } = seriesDataMap
      
      const clickedTime = new Date(param.time * 1000).toISOString();
      const clickedValue = close
      console.log(`Clicked at time: ${clickedTime}, value: ${clickedValue}`);
    }
    if (param.time === undefined) {
      //const oldestTime = data[0].time as Time;
      //const newestTime = data[data.length - 1].time as Time;
      if (param.logical > data.length) {
        //console.log(to.toString()+" " + newestTime.toString())
        //const threshold = Math.floor(data.length * 0.1);
        //console.log("newWestTime: " + newestTime)
        //console.log("threshold: " + threshold)
        console.log("data.length: " + data.length)
         const newFirst = Number(data[data.length - 1].time)
        console.log("newFirst" + newFirst)
        loadMoreItems(true); // 例として新しい範囲のデータをロード  
      }
      if (param.logical < 0) {
        loadMoreItems(false); // 例として新しい範囲のデータをロード
      }
    }

  }, [data])


  useEffect(() => {
    if (!chartContainerRef.current) return;
    // チャートがすでに作成されているかどうかをチェック
    if (!chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        width: 1000,
        height: 400,
        handleScale: true
      });

      const candleSeries = chart.addCandlestickSeries();
      const maSeries = chart.addLineSeries({
        color: 'rgba(0, 0, 255, 0.5)',  // You can customize the color of the MA line
        lineWidth: 2,
      });
      candleSeries.setMarkers(labelData)
      //candleSeries.setData(data);
      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      maSeriesRef.current = maSeries;

      chart.subscribeClick(handleChartClick);


      // スクロールイベントを設定
      chart.timeScale().subscribeVisibleTimeRangeChange((visibleRange) => {

        if (!visibleRange || !candleSeriesRef.current) return;
       
        const { from, to } = visibleRange;
        const oldestTime = data[0].time as Time;
        const newestTime = data[data.length - 1].time as Time;
        // console.log("newwesttime: " + newestTime)

        // 左端に近づいたときに新しいデータをロード
        // if ( from < oldestTime) {
        //   //const threshold = Math.floor(data.length * 0.1);
        //   console.log("newWestTime: " + newestTime)
        //   //console.log("threshold: " + threshold)
        //   console.log("data.length: " + data.length)
        //   const sa = (Number(data[1].time) - Number(data[0].time))
        //   const fast = Number(data[0].time) - (200000 * sa)
        //   loadMoreItems(fast); // 例として新しい範囲のデータをロード
        // }

        // // 右端に近づいたときに新しいデータをロード
        // if ( to > newestTime) {
        //   //1505404500 1505104500
        //   console.log(to.toString()+" " + newestTime.toString())
        //   //const threshold = Math.floor(data.length * 0.1);
        //   console.log("newWestTime: " + newestTime)
        //   //console.log("threshold: " + threshold)
        //   console.log("data.length: " + data.length)
        //   console.log("testtest")
        //   loadMoreItems(Number(data[data.length - 1].time)); // 例として新しい範囲のデータをロード
        // }
      });


      //candleSeries.setMarkers()
      //}
    }

    return () => {
      chartRef.current?.unsubscribeClick(handleChartClick)
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      //chart.remove();
    };
  }, [handleChartClick]);

  useEffect(() => {
    if (candleSeriesRef.current && data.length > 0) {
      candleSeriesRef.current.setData(data);

      // 表示範囲を更新
      const oldestTime = data[0].time;
      //const newestTime = data[data.length - 1].time;
      let newestTime;
      if (data.length >= 1000) {
        newestTime = data[1000].time;

      } else {
        newestTime = data[data.length - 1].time;
      }
      console.log(oldestTime)
      console.log(newestTime)

      chartRef.current?.timeScale().setVisibleRange({
        from: oldestTime as Time,
        to: newestTime as Time,
      });
      const maData = calculate200MA(data);
      maSeriesRef.current.setData(maData);

    }
    handleLabelData()
  }, [data]);

  useEffect(() => {
    // マーカーの更新
    handleLabelData()
  }, [labelData]); // markersが変更された時のみ実行

  return (
    <div>
      <div ref={chartContainerRef} />

    </div>
  )

};

export default LightweightChartComponent;
