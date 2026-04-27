"use client";

import "./style.css";
import type {
  SeriesMarker,
  SeriesMarkerPosition,
  SeriesMarkerShape,
  Time,
} from "lightweight-charts";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import CreateLabeling from "@/components/CreateLabeling";
import Dropdown, { type FromOption } from "@/components/DropDown";
import LightweightChartComponent from "@/components/LightweightChartComponent";
import SymbolSelector from "@/components/SymbolSelector";
import { type AssetType, INTERVALS_BY_ASSET } from "@/hooks/useMasters";
import { ChartClickDataContext } from "@/provider/ChartClickDataProvider";
import type { CandleType } from "@/types/Candle";
import { findManyBookmark, registerBookmark } from "../api/bookmark/fetch";
import type { BookmarkData } from "../api/bookmark/route";
import { fetchMoreData } from "../api/candles/fetch";
import { getLabelingData, labelingFetch } from "../api/candles/labeling/fetch";
import { getLabels } from "../api/candles/labels/fetch";
import { fileCreate } from "../api/file/fetch";

const DEFAULT_FX_SYMBOL = "GBPJPY=X";
const DEFAULT_STOCK_SYMBOL = "7203.T";

const ChartPage = () => {
  const { chartClickDataState } = useContext(ChartClickDataContext);
  const [isLoading, setIsLoading] = useState(true);
  const [bookMarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [labels, setLabels] = useState<FromOption[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>();

  const [assetType, setAssetType] = useState<AssetType>("FX");
  const [symbol, setSymbol] = useState<string>(DEFAULT_FX_SYMBOL);

  const [selectBookmark, setSelectBookmark] = useState<BookmarkData>();
  const intervals = useMemo(() => INTERVALS_BY_ASSET[assetType], [assetType]);
  const [chartData, setChartData] = useState<Record<string, CandleType[]>>({});
  const [chartIndex, setChartIndex] = useState<Record<string, number>>({});

  const [barNum, _setBarNum] = useState(20000);
  const [fromTo, setFromTo] = useState<{ from: Time; to: Time }>({ from: "0", to: "0" });

  const [labelData, setLabelData] = useState<SeriesMarker<Time>[]>([]);

  // 永続化された assetType / symbol を初期ロード
  useEffect(() => {
    const at = (localStorage.getItem("asset_type") as AssetType | null) ?? "FX";
    const sym =
      localStorage.getItem("symbol") ?? (at === "FX" ? DEFAULT_FX_SYMBOL : DEFAULT_STOCK_SYMBOL);
    setAssetType(at);
    setSymbol(sym);
  }, []);

  const handleAssetTypeChange = (next: AssetType) => {
    setAssetType(next);
    localStorage.setItem("asset_type", next);
  };

  const handleSymbolChange = (next: string) => {
    setSymbol(next);
    localStorage.setItem("symbol", next);
  };

  const fetchAllData = useCallback(
    async (lastBookMark: number) => {
      setIsLoading(true);
      const result: Record<string, CandleType[]> = {};
      for (const interval of intervals) {
        result[interval] = await fetchMoreData(
          interval,
          symbol,
          lastBookMark.toString(),
          barNum.toString(),
        );
      }
      setChartData(result);
      const idx: Record<string, number> = {};
      for (const interval of intervals) idx[interval] = lastBookMark;
      setChartIndex(idx);
      setIsLoading(false);
    },
    [intervals, symbol, barNum],
  );

  useEffect(() => {
    const firstEffect = async () => {
      const getLabelsRes = await getLabels(symbol);
      setLabels(getLabelsRes.data);

      const labelingId = localStorage.getItem("labeling_id");
      if (labelingId) {
        try {
          const bookmarkRes = await findManyBookmark(labelingId);
          setBookmarks(bookmarkRes ?? []);

          const labelingRes = await getLabelingData(labelingId);
          setLabelData(labelingRes.data ?? []);

          const last = bookmarkRes?.slice(-1)[0]?.index ?? 0;
          await fetchAllData(last);
          setSelectedLabel(getLabelsRes.data.length === 0 ? undefined : labelingId);
          return;
        } catch (error) {
          console.error("Failed to load labeling:", error);
        }
      }
      await fetchAllData(0);
      setSelectedLabel(undefined);
    };
    firstEffect();
  }, [symbol, fetchAllData]);

  const setLabelHandler = (
    time: Time,
    position?: SeriesMarkerPosition,
    color?: string,
    shape?: SeriesMarkerShape,
    text?: string,
  ) => {
    setLabelData((prevData) => {
      if (position === undefined) {
        return prevData.filter((item) => item.time !== time);
      }
      const newData = [...prevData, { time, position, color: color!, shape: shape!, text: text! }];
      return newData.sort((a, b) => Number(a.time) - Number(b.time));
    });
  };

  const handleLoadMore = (interval: string, movement: boolean) => {
    const current = chartIndex[interval] ?? 0;
    const nextIndex = movement ? current + barNum : Math.max(0, current - barNum);
    fetchMoreData(interval, symbol, nextIndex.toString(), barNum.toString()).then((newData) => {
      setChartData((prev) => ({ ...prev, [interval]: newData }));
      setChartIndex((prev) => ({ ...prev, [interval]: nextIndex }));
    });
  };

  return (
    <div>
      <div className="container">
        <div className="column">
          <div className="m-2">
            <SymbolSelector
              assetType={assetType}
              symbol={symbol}
              onChangeAssetType={handleAssetTypeChange}
              onChangeSymbol={handleSymbolChange}
            />
          </div>

          {isLoading ? (
            <div>Loading...</div>
          ) : (
            intervals.map((interval) => (
              <div key={interval}>
                <h1>{interval} Chart</h1>
                {chartData[interval]?.length ? (
                  <LightweightChartComponent
                    data={chartData[interval]}
                    labelData={labelData}
                    loadMoreItems={(movement: boolean) => handleLoadMore(interval, movement)}
                  />
                ) : (
                  <div>データがありません（自動取得を実行してください）</div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="column">
          <h2>close</h2>
          {chartClickDataState.close}
          <h2>time</h2>
          {chartClickDataState.time.toString()}
          <br />
          <div className="m-2">
            <Button
              text="この時間でBookmark"
              onClick={async () => {
                if (!selectedLabel) return;
                await registerBookmark({
                  time: chartClickDataState.time,
                  chartLabelingId: Number(selectedLabel),
                });
              }}
            />
          </div>
          <div className="m-2">
            <h2>bookmark select</h2>
            <Dropdown
              options={bookMarks.map((value) => ({
                key: value.time.toLocaleString(),
                value: value.time.toString(),
              }))}
              value={selectBookmark?.time.toString() || "-1"}
              onSelect={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setSelectBookmark(
                  bookMarks.filter((value) => e.target.value === value.time.toString())[0],
                );
              }}
            />
          </div>

          <div className="m-2">
            <h2>label select</h2>
            <Dropdown
              options={labels}
              value={selectedLabel || "-1"}
              onSelect={(e: React.ChangeEvent<HTMLSelectElement>) => {
                localStorage.setItem("labeling_id", e.target.value);
                setSelectedLabel(e.target.value);
              }}
            />
          </div>
          <div className="m-2">
            <Button text="labelを再配置" onClick={() => window.location.reload()} />
          </div>

          <div className="m-2">
            <h4>{`買い: ${labelData.filter((value) => value.shape === "arrowUp").length}`}</h4>
          </div>
          <div className="m-2">
            <h4>{`売り: ${labelData.filter((value) => value.shape === "arrowDown").length}`}</h4>
          </div>
          <div className="m-2">
            <h4>{`利確: ${labelData.filter((value) => value.shape === "circle").length}`}</h4>
          </div>
          <div className="m-2">
            <Button
              text="買い"
              onClick={() =>
                setLabelHandler(
                  chartClickDataState.time,
                  "belowBar",
                  "#2196F3",
                  "arrowUp",
                  `buy ${chartClickDataState.time}`,
                )
              }
            />
          </div>
          <div className="m-2">
            <Button
              text="売り"
              onClick={() =>
                setLabelHandler(
                  chartClickDataState.time,
                  "aboveBar",
                  "#e91e63",
                  "arrowDown",
                  `sell ${chartClickDataState.time}`,
                )
              }
            />
          </div>
          <div className="m-2">
            <Button
              text="利確"
              onClick={() =>
                setLabelHandler(
                  chartClickDataState.time,
                  "belowBar",
                  "#f68410",
                  "circle",
                  `profit ${chartClickDataState.time}`,
                )
              }
            />
          </div>
          <div className="m-2">
            <Button text="取り消し" onClick={() => setLabelHandler(chartClickDataState.time)} />
          </div>

          <Button
            text="登録"
            onClick={() => {
              if (selectedLabel) labelingFetch(labelData, selectedLabel);
            }}
          />
          <CreateLabeling symbol={symbol} />

          <h3>{fromTo.from.toString()}</h3>
          <h3>{fromTo.to.toString()}</h3>
          <Button
            text="from"
            onClick={() => setFromTo({ ...fromTo, from: chartClickDataState.time })}
          />
          <Button
            text="to"
            onClick={() => setFromTo({ ...fromTo, to: chartClickDataState.time })}
          />

          <Button
            text="ファイルを作成"
            onClick={() => {
              if (selectedLabel) fileCreate(symbol, fromTo.from, fromTo.to, selectedLabel);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartPage;
