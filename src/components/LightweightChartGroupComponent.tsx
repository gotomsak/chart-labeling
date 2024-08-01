'use client'
import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, isUTCTimestamp, MouseEventParams, Time } from 'lightweight-charts';
import { ChartsCandle } from './CandleChart';


const LightweightChartGroupComponent = (data: { data: ChartsCandle }) => {
  const chartContainerRef1 = useRef<HTMLDivElement>(null);
  const chartContainerRef2 = useRef<HTMLDivElement>(null);
  const chartContainerRef3 = useRef<HTMLDivElement>(null);

  const syncCrosshair = (param: MouseEventParams, chartIndex: number) => {
    if (!param || !param.time) return;

    charts.forEach((chart, index) => {
      if (index !== chartIndex) {
        chart.applyOptions({
          crosshair: {
            mode: param.hoveredSeries ? 1 : 0,
          },
        });
      }
    });
  };

  const syncTimeScale = (chartIndex: number) => {
    const targetTimeScale = charts[chartIndex].timeScale();
    const targetRange = targetTimeScale.getVisibleRange();

    charts.forEach((chart, index) => {
      if (index !== chartIndex) {
        chart.timeScale().setVisibleRange(targetRange as { from: Time, to: Time });
      }
    });
  };


  const charts: IChartApi[] = [];
  useEffect(() => {
    if (!chartContainerRef1.current || !chartContainerRef2.current || !chartContainerRef3.current) {
      return;
    }

    const chartOptions = {
      width: 1000,
      height: 400,
      // handleScroll: false,
      handleScale: false
    }


    const chart1 = createChart(chartContainerRef1.current, chartOptions);
    const chart2 = createChart(chartContainerRef2.current, chartOptions);
    const chart3 = createChart(chartContainerRef3.current, chartOptions);

    charts.push(chart1, chart2, chart3);

    const candleSeries1 = chart1.addCandlestickSeries();
    const candleSeries2 = chart2.addCandlestickSeries();
    const candleSeries3 = chart3.addCandlestickSeries();
    const seriesDataMap: any = (index: number, param: any) => {
      if (index == 0) {
        return param.seriesData.get(candleSeries1);
      }
      if (index == 1) {
        return param.seriesData.get(candleSeries2);
      }
      if (index == 2) {
        return param.seriesData.get(candleSeries3);
      }
    }


    console.log(data)
    

    const { data1, data2, data3 } = data.data;

    candleSeries1.setData(data1);
    candleSeries2.setData(data2);
    candleSeries3.setData(data3);

    const oldestTime = Math.min(
      data1[0].time,
      data2[0].time,
      data3[0].time
    );

    const newestTime = Math.max(
      data1[data1.length - 1].time,
      data2[data2.length - 1].time,
      data3[data3.length - 1].time
    );


    if (data.data.data1.length !== 0) {
      charts.forEach((chart, index) => {
        chart.subscribeCrosshairMove((param) => {
          if (!param || !param.time) return;
          syncCrosshair(param, index);
        });
        chart.subscribeClick((param: any) => {
          if (param.time) {
            console.log(param.seriesData)

            console.log(index)

            const sdm = seriesDataMap(index, param)
            console.log(sdm)
            const { open, high, low, close } = sdm
            console.log(close)
            const clickedTime = new Date(param.time * 1000).toISOString();
            const clickedValue = close
            console.log(`Clicked at time: ${clickedTime}, value: ${clickedValue}`);
          }
        });

        chart.timeScale().subscribeVisibleTimeRangeChange(() => {
          syncTimeScale(index);
        });
        chart.timeScale().setVisibleRange({
          from: oldestTime as Time,
          to: newestTime as Time,
        });
        
      });

    }


    return () => {
      charts.forEach((chart) => {
        const container = chartContainerRef1.current || chartContainerRef2.current || chartContainerRef3.current;
        if (container) {
          container.innerHTML = '';
        }
      });
      //  charts.forEach((chart) => chart.remove());
    };
  }, [data]);

  return (
    <div>
      <h1>re1</h1>
      <div ref={chartContainerRef1} />
      <h1>re2</h1>
      <div ref={chartContainerRef2} />
      <h1>re3</h1>
      <div ref={chartContainerRef3} />
    </div>
  );
};

export default LightweightChartGroupComponent;
