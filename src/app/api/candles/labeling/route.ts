import { Time } from "lightweight-charts"
import fs from 'fs';
import prisma from "@/utils/db";
import { NextResponse } from "next/server";

export interface labeling {
  time: Time;
  label: number;
}

export interface labelingPost {
  from: Time;
  to: Time;
  label: number;
}


export const POST = async (req: Request) => {
  const labeling: labelingPost = await req.json()
  console.log(labeling)
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  const findfile = await prisma.chartLabeling.findUnique({
    where: {
      id: Number(id)
    }
  })

  const jsonData = fs.readFileSync(`src/data/labeling/${findfile?.fileName}`, 'utf8');
  const lines = jsonData.split('\n').filter(line => line.trim() !== '');
  let data = lines.map(line => JSON.parse(line));


  data = data.map((record: { datetime: Time, Open: number, High: number, Low: number, Close: number, Volume: number, label: number }) => {
    if (labeling.from <= record.datetime && labeling.to >= record.datetime) {
      console.log(record)
      console.log(labeling)
      return { ...record, label: Number(labeling.label) }
    } else {
      return record
    }
  })
  const formatJSON = (objArray: any) => {
    return objArray.map((obj: any) => {
      const entries = Object.entries(obj).map(([key, value]) => `"${key}": ${value}`);
      return `{${entries.join(', ')}}`;
    }).join('\n');
  };
  
  fs.writeFileSync(`src/data/labeling/${findfile?.fileName}`, formatJSON(data), 'utf8');

  return NextResponse.json(200)

}