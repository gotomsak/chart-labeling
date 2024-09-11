import clientPromise from "@/utils/mongo";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';

const saveLabelDataToFile = (labelData: any[]) => {
  const jsonData = JSON.stringify(labelData, null, 2); // Convert the label data to JSON format

  // Write the JSON data to a file
  fs.writeFile('labelData.json', jsonData, (err) => {
    if (err) {
      console.error('Error saving JSON file:', err);
    } else {
      console.log('JSON file has been saved.');
    }
  });
};



export const POST = async (req: NextRequest) => {
  const pair = req.nextUrl.searchParams.get("pair")
  const from = req.nextUrl.searchParams.get("from")
  const to = req.nextUrl.searchParams.get("to")
  const label = req.nextUrl.searchParams.get("label")
  const client = await clientPromise;
  const db = client.db('FXCharts');
  const labelings_collection = db.collection("labelings")
  const candle_collection = db.collection(`${pair}_5m`)

  const label_find = await labelings_collection.findOne({ _id: new ObjectId(label!) })
  console.log(from)
  console.log(to)
  const candles_find = await candle_collection.find({ time: { $gte: Number(from), $lte: Number(to) } }).toArray();
  console.log(label_find)
  console.log(candles_find)
  // label は0がなし，1が買い, 2が売り,  3が利確
  const res = candles_find.map((v) => {
    let register_label = 0;
    label_find!.label.forEach((element: any) => {
      if (element.time === v.time) {
        register_label = element.shape === "arrowUp" ? 1 : element.shape === "arrowDown" ? 2 : 3
      }
    });
    const volume = Math.abs(v.high - v.low) + Math.abs(v.close - v.open)
    const roundedVolume = parseFloat(volume.toFixed(3));
    return {
      time: v.time,
      open: v.open,
      high: v.high,
      low: v.low,
      close: v.close,
      volume: roundedVolume,
      label:  register_label,
    }
  })
  console.log(res)
  
  saveLabelDataToFile(res); // Replace `currentLabelData` with your actual label data state
  return NextResponse.json({ status: 200 });
}