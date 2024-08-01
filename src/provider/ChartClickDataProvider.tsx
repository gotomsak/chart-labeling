'use client'
import { UTCTimestamp } from "lightweight-charts";
import { createContext, Dispatch, useReducer, useState } from "react";
import { CandleType } from "../types/Candle";
import React from 'react'

const initChartClickData: CandleType = {
  close: 0,
  open: 0,
  time: 0 as UTCTimestamp,
  high: 0,
  low: 0
}
type CandleTypeAction = { type: "setData"; payload: CandleType }

export const ChartClickDataContext = createContext<{
   chartClickDataState: CandleType, 
   chartClickDataDispatch: Dispatch<CandleTypeAction> 
  }>
  ({ chartClickDataState: initChartClickData, chartClickDataDispatch: () => null });



export const ChartClickDataReducer = (
  state: CandleType,
  action: CandleTypeAction
) => {
  switch (action.type) {
    case 'setData':
      return action.payload;

  }
}

export const ChartClickDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [chartClickDataState, chartClickDataDispatch] = useReducer(
    ChartClickDataReducer,
    initChartClickData
  )
  return (
    <ChartClickDataContext.Provider value={{ chartClickDataState, chartClickDataDispatch }}>
      {children}
    </ChartClickDataContext.Provider>
  )
}