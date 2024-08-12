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

  const { chartClickDataState } = useContext(ChartClickDataContext);
  const [isLoading, setIsLoading] = useState(true);
  const [bookMarks, setBookmarks] = useState<BookmarkData[]>([])
  const [labels, setLabels] = useState<FromOption[]>([])
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>()
  const [selectPair, setSelectPair] = useState("GBPJPY");
  const [selectBookmark, setSelectBookmark] = useState<BookmarkData>()
  const [data, setData] = useState<{ data1: CandleType[], data2: CandleType[], data3: CandleType[] }>({
    data1: [], data2: [], data3: []
  });

  const [barNum, setBarNum] = useState(200000)

  const [labelingPost, setLabelingPost] = useState<labelingPost>({
    from: 0 as Time,
    to: 0 as Time,
    label: 0
  });
  const [lock, setLock] = useState({ from: false, to: false });

  const fetchAllData = async (chart_id: string | undefined, lastBookMark: number) => {
    setIsLoading(true);
    const result = { data1: [], data2: [], data3: [] }

    result.data1 = await fetchMoreData(
      lastBookMark,
      barNum,
      '5',
      selectPair,
      chart_id === undefined ? "master" : "labeling",
      Number(chart_id) || undefined
    )
    result.data2 = await fetchMoreData(0, Math.round(barNum / 12), '1h', selectPair, "master")
    result.data3 = await fetchMoreData(0, Math.round(barNum / 48), '4h', selectPair, "master")
    setData(result)
    setIsLoading(false);
  }

  useEffect(() => {
    const firstEffect = async () => {

      const getLabelsRes = await getLabels()
      setLabels(getLabelsRes)
      const bookmarkRes = await findManyBookmark(Number(localStorage.getItem('chart_id') || "0"))
      setBookmarks(bookmarkRes)
      console.log(bookmarkRes)
      fetchAllData(getLabelsRes.length === 0 ? undefined : localStorage.getItem('chart_id') || "0",
        bookmarkRes.length === 0 ? 1420156800 : bookmarkRes.slice(-1)[0].time)
      setSelectedLabel(getLabelsRes.length === 0 ? undefined : localStorage.getItem('chart_id') || "0")
    }
    firstEffect()


  }, [])


  useEffect(() => {
    let setLabel: labelingPost = labelingPost
    if (!lock.from) {
      setLabel = {
        ...setLabel,
        from: chartClickDataState.time
      }
    }
    if (!lock.to) {
      setLabel = {
        ...setLabel,
        to: chartClickDataState.time
      }
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
            <LightweightChartComponent data={data.data1} loadMoreItems={
              (startIndex: number, stopIndex: number) => {
                fetchMoreData(startIndex, stopIndex, '5', selectPair, selectedLabel === undefined ? "master" : "labeling", Number(selectedLabel) || undefined).then(newData => {
                  console.log('5 chart loading')
                  setData(prevData => ({ ...prevData, data1: newData }))
                })
              }
            }
            />
          }
          <h1>1 Hour Chart</h1>
          {data.data2.length !== 0 &&
            <LightweightChartComponent data={data.data2} loadMoreItems={(startIndex: number, stopIndex: number) => {
              fetchMoreData(startIndex, stopIndex, '1h', selectPair, "master").then(newData => {
                setData(prevData => ({ ...prevData, data2: newData }))
              })
            }} />
          }
          <h1>4 Hour Chart</h1>
          {data.data3.length !== 0 &&
            <LightweightChartComponent data={data.data3} loadMoreItems={(startIndex: number, stopIndex: number) => {
              fetchMoreData(startIndex, stopIndex, '4h', selectPair, "master").then(newData => {
                setData(prevData => ({ ...prevData, data3: newData }))
              })
            }} />
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
                const result = await registerBookmark({ time: chartClickDataState.time, chartLabelingId: Number(selectedLabel) })
                console.log(result)
              }}
            ></Button>
          </div>
          <div className='m-2'>
            <h2>bookmark select</h2>
            {selectBookmark?.id}
            <Dropdown
              options={
                bookMarks.map(
                  (value) => {
                    return {
                      key: value.time.toLocaleString(),
                      value: value.id.toString()
                    }
                  }
                )
              }
              value={selectBookmark?.id.toString() || "-1"}
              onSelect={(e: any) => {
                console.log(e.target.value)
                //localStorage.setItem("chart_id", e.target.value)
                setSelectBookmark(bookMarks.filter((value) => e.target.value === value.id.toString())[0])
              }}></Dropdown>
          </div>

          <div className='m-2'>
            <h2>chart select</h2>
            <Dropdown
              options={labels}
              value={selectedLabel || "-1"}
              onSelect={(e: any) => {
                console.log(e.target.value)
                localStorage.setItem("chart_id", e.target.value)
                setSelectedLabel(e.target.value)
              }}></Dropdown>

          </div>
          <div className='m-2'>
            <Button text='chartを再配置' onClick={() => {
              fetchAllData(selectedLabel, selectBookmark?.id!)
            }}></Button>
          </div>

          <div className='m-2'>
            <h1>from</h1>
            <h2>time</h2>
            {labelingPost.from.toString()}

            <h1>to</h1>
            <h2>time</h2>
            {labelingPost.to.toString()}
            <h2>label</h2>
            {labelingPost.label}
            <br></br>
          </div>
          <Button text={lock.from ? 'アンロックfrom' : 'ロックfrom'} onClick={() => {
            setLock({ ...lock, from: !lock.from })
          }}></Button>
          <Button text={lock.to ? 'アンロックto' : 'ロックto'} onClick={() => {
            setLock({ ...lock, to: !lock.to })
          }}></Button>
          <div className='m-2'>
            <Dropdown
              options={
                [{ key: "買い", value: "1" }, { key: "売り", value: "2" }, { key: "利確", value: "3" }]
              } value={labelingPost.label.toString()}
              onSelect={(e: any) => {
                setLabelingPost({ ...labelingPost, label: e.target.value })
              }}></Dropdown>
          </div>
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