'use client'

import './style.css'
import { useContext, useEffect, useState } from "react";
import { ChartClickDataContext, ChartClickDataProvider } from "@/provider/ChartClickDataProvider";
import { findManyBookmark, registerBookmark } from "../api/bookmark/fetch";
import FindManyBookmarkView from "@/components/FindManyBookmarkView";
import { Time, UTCTimestamp } from "lightweight-charts";
import { BookmarkData } from "../api/bookmark/route";
import CreateChartLabeling from "@/components/CreateChartLabeling";
import Dropdown, { FromOption } from "@/components/DropDown";
import { getLabels } from "../api/candles/labels/fetch";
import { fetchMoreData } from "../api/candles/fetch";
import { CandleType } from "@/types/Candle";
import LightweightChartComponent from "@/components/LightweightChartComponent";
import Button from '@/components/Button';
import { labelingFetch } from '../api/candles/labeling/fetch';
import { labelingPost } from '../api/candles/labeling/route';

const ChartPage = () => {

  // const { chartClickData, setChartClickData } = useChartClickData();
  const { chartClickDataState } = useContext(ChartClickDataContext);
  const [isLoading, setIsLoading] = useState(true);
  const [bookMarks, setBookmarks] = useState<BookmarkData[]>([])
  const [labels, setLabels] = useState<FromOption[]>([])
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>()

  const [data, setData] = useState<{ data1: CandleType[], data2: CandleType[], data3: CandleType[] }>({
    data1: [], data2: [], data3: []
  });

  const [labelingPost, setLabelingPost] = useState<labelingPost>({
    from: { time: 0 as Time, label: 0 },
    to: { time: 0 as Time, label: 0 }
  });
  const [lock, setLock] = useState({ from: false, to: false });

  const fetchAll = async (chart_id: string | undefined) => {
    setIsLoading(true);
    const barNum = 200000
    const result = { data1: [], data2: [], data3: [] }

    result.data1 = await fetchMoreData(
      0,
      barNum,
      '5',
      "GBPJPY",
      chart_id === undefined ? "master" : "labeling",
      Number(chart_id) || undefined
    )
    result.data2 = await fetchMoreData(0, Math.round(barNum / 12), '1h', "GBPJPY", "master")
    result.data3 = await fetchMoreData(0, Math.round(barNum / 48), '4h', "GBPJPY", "master")
    setData(result)
    setIsLoading(false);
  }

  useEffect(() => {
    findManyBookmark().then((res) => {
      console.log(res)
      setBookmarks(res)
    })
    getLabels().then((res: FromOption[]) => {
      console.log(res)
      setLabels(res)
      fetchAll(res.length === 0 ? undefined : localStorage.getItem('chart_id') || "0")
      setSelectedLabel(res.length === 0 ? undefined : localStorage.getItem('chart_id') || "0")
    })

  }, [])


  useEffect(() => {
    let setLabel: labelingPost = labelingPost
    if (!lock.from) {
      setLabel = {
        ...setLabel,
        from: { ...setLabel?.from, time: chartClickDataState.time }
      }
    }
    if (!lock.to) {
      setLabel = {
        ...setLabel,
        to: { ...setLabel?.to, time: chartClickDataState.time }
      }
      // setLabelingPost(
      //   {
      //     ...labelingPost,
      //     to: { ...labelingPost?.to, time: chartClickDataState.time }
      //   }
      // )
    }
    setLabelingPost(setLabel)
  }, [chartClickDataState])

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="container">
        <div className="column">
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
        <div className="column">
          <h2>close</h2>
          {chartClickDataState.close}
          <h2>time</h2>
          {chartClickDataState.time.toString()}
          <br></br>
          <div className='m-2'>
            <Button text="この時間でBookmark"
              onClick={async () => {
                const result = await registerBookmark({ time: chartClickDataState.time })
                console.log(result)
              }}
            ></Button>
          </div>
          <div className='m-2'>
            <Dropdown options={labels} select={selectedLabel || "ラベリング中のchartデータはありません"} onSelect={(e: any) => {
              console.log(e.target.value)
              localStorage.setItem("chart_id", e.target.value)
              setSelectedLabel(e.target.value)
            }}></Dropdown>

          </div>
          <div className='m-2'>
            <Button text='chartを再配置' onClick={() => {
              fetchAll(selectedLabel)
            }}></Button>
          </div>

          <div className='m-2'>
            <h1>from</h1>
            <h2>time</h2>
            {labelingPost.from.time.toString()}
            <h2>label</h2>
            {labelingPost.from.label}

            <h1>to</h1>
            <h2>time</h2>
            {labelingPost.to.time.toString()}
            <h2>label</h2>
            {labelingPost.to.label}
            <br></br>
          </div>
          <Button text={lock.from ? 'アンロックfrom' : 'ロックfrom'} onClick={() => {
            setLock({ ...lock, from: !lock.from })
          }}></Button>
          <Button text={lock.to ? 'アンロックto' : 'ロックto'} onClick={() => {
            setLock({ ...lock, to: !lock.to })
          }}></Button>

          <Button text='登録' onClick={() => {
            if (selectedLabel !== undefined) {
              labelingFetch(labelingPost, Number(selectedLabel))
            }

          }}></Button>
          <CreateChartLabeling></CreateChartLabeling>

          <FindManyBookmarkView times={bookMarks}>
          </FindManyBookmarkView>

        </div>
      </div>
    </div >
  )
}

export default ChartPage;