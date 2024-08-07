import { Time } from "lightweight-charts"
import fs from 'fs';
import prisma from "@/utils/db";
import { NextResponse } from "next/server";

export interface labeling {
  time: Time;
  label: number;
}

export interface labelingPost{
  from: labeling;
  to: labeling;
}


export const POST = async (req: Request) => {
  const labeling: labelingPost = await req.json()
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  const findfile = await prisma.chartLabeling.findUnique({
    where: {
      id: Number(id)
    }
  })
  //console.log(findfile)
  const jsonData = fs.readFileSync(`src/data/labeling/${findfile?.fileName}`, 'utf8');
  const lines = jsonData.split('\n').filter(line => line.trim() !== '');
  let data = lines.map(line => JSON.parse(line));
  // let data = JSON.parse(jsonData);

  data = data.map((record: any) => {
    if (labeling.from.time <= record.time && labeling.to.time >= record.time){
      console.log(record)
      return{...record, label: labeling.from.label}
    }else{
      return record
    }
    // for (let i = 0; i < labeling.length; i++) {
    //   if (labeling[i].time === record.time) {
    //     return { ...record, label: labeling[i].label }
    //   }
    // }
    
  })
  // console.log(data)
  fs.writeFileSync(`src/data/labeling/${findfile?.fileName}`, data.map(record => JSON.stringify(record)).join('\n'), 'utf8');
  
  return NextResponse.json(200)

}