'use client'

import './style.css'
import { useContext, useEffect, useState } from "react";
import { ChartClickDataContext, ChartClickDataProvider } from "@/provider/ChartClickDataProvider";
import { findManyBookmark, registerBookmark } from "../api/bookmark/fetch";
import { SeriesMarker, SeriesMarkerPosition, SeriesMarkerShape, Time, UTCTimestamp } from "lightweight-charts";
import { BookmarkData } from "../api/bookmark/route";
import CreateChartLabeling from "@/components/CreateChartLabeling";
import Dropdown, { FromOption } from "@/components/DropDown";
import { getLabels } from "../api/candles/labels/fetch";
import { fetchMoreData } from "../api/candles/fetch";
import { CandleType } from "@/types/Candle";
import LightweightChartComponent from "@/components/LightweightChartComponent";
import Button from '@/components/Button';
import { getLabelingData, labelingFetch } from '../api/candles/labeling/fetch';
import { labelingPost, LabelingPostJson } from '../api/candles/labeling/route';
import CreateLabeling from '@/components/CreateLabeling';
import { fileCreate } from '../api/file/fetch';
import { kMaxLength } from 'buffer';

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

  const [barNum, setBarNum] = useState(20000)
  const [fromTo, setFromTo] = useState<{ from: Time, to: Time }>({from: '0', to:'0'})

  const [labelData, setLabelData] = useState<SeriesMarker<Time>[]>([])
  const [nowIndex, setNowIndex] = useState({ data1: 0, data2: 0, data3: 0 })

  const fetchAllData = async (labeling_id: string | undefined, lastBookMark: number) => {
    setIsLoading(true);
    const result = { data1: [], data2: [], data3: [] }
    console.log(lastBookMark)
    result.data1 = await fetchMoreData(
      '5m',
      selectPair,
      lastBookMark.toString(),
      barNum.toString(),
    )
    result.data2 = await fetchMoreData(
      '1h',
      selectPair,
      lastBookMark.toString(),
      //Math.round(barNum / 12).toString()
      barNum.toString()
    )

    result.data3 = await fetchMoreData(
      '4h',
      selectPair,
      lastBookMark.toString(),
      //Math.round(barNum / 48).toString()
      barNum.toString()
    )
    setData(result)
    setIsLoading(false);
  }

  useEffect(() => {
    const firstEffect = async () => {

      const getLabelsRes = await getLabels()

      setLabels(getLabelsRes.data)

      const bookmarkRes = await findManyBookmark(localStorage.getItem('labeling_id')!)

      const labelingRes = await getLabelingData(localStorage.getItem('labeling_id')!)

      setLabelData(labelingRes.data)
      setNowIndex({ data1: bookmarkRes.slice(-1)[0].index, data2: bookmarkRes.slice(-1)[0].index, data3: bookmarkRes.slice(-1)[0].index })
      setBookmarks(bookmarkRes)
      fetchAllData(getLabelsRes.data.length === 0 ? undefined : localStorage.getItem('labeling_id') || "0",
        bookmarkRes.slice(-1)[0].index)

      setSelectedLabel(getLabelsRes.data.length === 0 ? undefined : localStorage.getItem('labeling_id') || "0")
    }
    firstEffect()


  }, [])


  useEffect(() => {

    console.log(chartClickDataState)
  }, [chartClickDataState])

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const setLabelHandler = (time: Time, position?: SeriesMarkerPosition, color?: string, shape?: SeriesMarkerShape, text?: string) => {

    setLabelData((prevData) => {
      if (position === undefined) {
        return prevData.filter((item) => item.time != time);
      }
      const newData = [
        ...prevData,
        {
          time: time,
          position: position!,
          color: color!,
          shape: shape!,
          text: text!
        }
      ];
      return newData.sort((a, b) => Number(a.time) - Number(b.time));
    });
  }

  return (
    <div>
      <div className="container">

        <div className="column">
          <h1>5 Minute Chart</h1>
          {data.data1.length !== 0 &&
            <LightweightChartComponent data={data.data1} labelData={labelData} loadMoreItems={
              (movement: boolean) => {
                if (movement) {
                  fetchMoreData(
                    '5m',
                    selectPair,
                    (nowIndex.data1 + barNum).toString(),
                    barNum.toString()
                  )
                    .then(newData => {
                      console.log('5 chart loading')
                      setNowIndex({ ...nowIndex, data1: nowIndex.data1 + barNum })
                      setData(prevData => ({ ...prevData, data1: newData }))
                    })
                } else {

                  fetchMoreData(
                    '5m',
                    selectPair,
                    ((nowIndex.data1 - barNum) >= 0 ? nowIndex.data1 - barNum : 0).toString(),
                    barNum.toString()
                  )
                    .then(newData => {
                      console.log('5 chart loading')
                      setNowIndex({ ...nowIndex, data1: (nowIndex.data1 - barNum) >= 0 ? nowIndex.data1 - barNum : 0 })
                      setData(prevData => ({ ...prevData, data1: newData }))
                    })
                }
              }
            }
            />
          }
          <h1>1 Hour Chart</h1>
          {data.data2.length !== 0 &&
            <LightweightChartComponent data={data.data2} labelData={labelData} loadMoreItems={
              (movement: boolean) => {
                if (movement) {
                  fetchMoreData(
                    '1h',
                    selectPair,
                    (nowIndex.data2 + barNum).toString(),
                    barNum.toString()
                    //(nowIndex.data2 + Math.round(barNum / 12)).toString(),
                    //Math.round(barNum / 12).toString()
                  ).then(newData => {
                    setNowIndex(
                      {
                        ...nowIndex,
                        data2: nowIndex.data2 + barNum
                        //data2: (nowIndex.data2 + Math.round(barNum / 12))
                      })
                    setData(prevData => ({ ...prevData, data2: newData }))
                  })
                } else {
                  fetchMoreData(
                    '1h',
                    selectPair,
                    ((nowIndex.data2 - barNum) >= 0 ? nowIndex.data2 - barNum : 0).toString(),
                    barNum.toString()
                    // ((nowIndex.data2 - Math.round(barNum / 12)) >= 0 ? nowIndex.data2 - Math.round(barNum / 12) : 0).toString(),
                    // Math.round(barNum / 12).toString()
                  ).then(newData => {
                    setNowIndex(
                      {
                        ...nowIndex,
                        data2: (nowIndex.data2 - barNum) >= 0 ? nowIndex.data2 - barNum : 0
                        //data2: (nowIndex.data2 - Math.round(barNum / 12)) >= 0 ? (nowIndex.data2 - Math.round(barNum / 12)) : 0
                      })
                    setData(prevData => ({ ...prevData, data2: newData }))
                  })

                }
              }} />
          }
          <h1>4 Hour Chart</h1>
          {data.data3.length !== 0 &&
            <LightweightChartComponent data={data.data3} labelData={labelData} loadMoreItems={
              (movement: boolean) => {
                if (movement) {
                  fetchMoreData(
                    '4h',
                    selectPair,
                    (nowIndex.data3 + barNum).toString(),
                    barNum.toString()
                    // (nowIndex.data3 + Math.round(barNum / 48)).toString(),
                    // Math.round(barNum / 48).toString()
                  ).then(newData => {
                    setNowIndex(
                      {
                        ...nowIndex,
                        data3: nowIndex.data2 + barNum
                        //data3: nowIndex.data3 + Math.round(barNum / 48)
                      })
                    setData(prevData => ({ ...prevData, data3: newData }))
                  })
                } else {
                  fetchMoreData(
                    '4h',
                    selectPair,
                    ((nowIndex.data3 - barNum) >= 0 ? nowIndex.data3 - barNum : 0).toString(),
                    barNum.toString()
                    // ((nowIndex.data3 - Math.round(barNum / 48)) >= 0 ? nowIndex.data3 - Math.round(barNum / 48) : 0).toString(),
                    // Math.round(barNum / 48).toString()
                  ).then(newData => {
                    setNowIndex(
                      {
                        ...nowIndex,
                        data3: (nowIndex.data3 - barNum) >= 0 ? nowIndex.data3 - barNum : 0
                        //data3: (nowIndex.data3 - Math.round(barNum / 48)) >= 0 ? nowIndex.data3 - Math.round(barNum / 48) : 0
                      })
                    setData(prevData => ({ ...prevData, data3: newData }))
                  })
                }
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
            <Dropdown
              options={
                bookMarks.map(
                  (value) => {
                    return {
                      key: value.time.toLocaleString(),
                      value: value.time.toString()
                    }
                  }
                )
              }
              value={selectBookmark?.time.toString() || "-1"}
              onSelect={(e: any) => {
                console.log(e.target.value)
                //localStorage.setItem("chart_id", e.target.value)
                setSelectBookmark(bookMarks.filter((value) => e.target.value === value.time.toString())[0])
              }}></Dropdown>
          </div>

          <div className='m-2'>
            <h2>label select</h2>
            <Dropdown
              options={labels}
              value={selectedLabel || "-1"}
              onSelect={(e: any) => {
                console.log(e.target.value)
                localStorage.setItem("labeling_id", e.target.value)
                setSelectedLabel(e.target.value)
              }}></Dropdown>

          </div>
          <div className='m-2'>
            <Button text='labelを再配置' onClick={() => {
              window.location.reload()
            }}></Button>
          </div>

          <div className='m-2'>
            <h4>{`買い: ${labelData.filter(value => value.shape==='arrowUp').length}`}</h4>
          </div>
          <div className='m-2'>
            <h4>{`売り: ${labelData.filter(value => value.shape==='arrowDown').length}`}</h4>
          </div>
          <div className='m-2'>
            <h4>{`利確: ${labelData.filter(value => value.shape==='circle').length}`}</h4>
          </div>
          <div className='m-2'>
            <Button text='買い' onClick={() => {
              console.log(labelData)
              setLabelHandler(chartClickDataState.time, "belowBar", '#2196F3', 'arrowUp', `buy ${chartClickDataState.time}`)
            }}></Button>
          </div>
          <div className='m-2'>
            <Button text='売り' onClick={() => {
              setLabelHandler(chartClickDataState.time, "aboveBar", '#e91e63', 'arrowDown', `sell ${chartClickDataState.time}`)
            }}></Button>
          </div>
          <div className='m-2'>
            <Button text='利確' onClick={() => {
              setLabelHandler(chartClickDataState.time, "belowBar", '#f68410', 'circle', `profit ${chartClickDataState.time}`)
            }}></Button>
          </div>
          <div className='m-2'>
            <Button text='取り消し' onClick={() => {
              setLabelHandler(chartClickDataState.time)
            }}></Button>
          </div>



          <Button text='登録' onClick={() => {
            labelingFetch(labelData, selectedLabel!)
          }}></Button>
          <CreateLabeling></CreateLabeling>

          <h3>{fromTo.from.toString()}</h3>
          <h3>{fromTo.to.toString()}</h3>
          <Button text='from' onClick={()=>{
            setFromTo({...fromTo!, from: chartClickDataState!.time})
          }}></Button>
          <Button text='to' onClick={()=>{
            setFromTo({...fromTo!, to: chartClickDataState!.time})
          }}></Button>

          <Button text='ファイルを作成' onClick={() => {
            fileCreate(selectPair, fromTo!.from, fromTo!.to, selectedLabel!)
          }}></Button>
        </div>
      </div>
    </div >
  )
}

export default ChartPage;