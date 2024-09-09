import { SeriesMarker, Time } from "lightweight-charts"
import fs from 'fs';
import prisma from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";
import { Next } from "node_modules/mysql2/typings/mysql/lib/parsers/typeCast";
import clientPromise from "@/utils/mongo";
import { ObjectId } from "mongodb";

export interface labeling {
  time: Time;
  label: number;
}

export interface labelingPost {
  from: Time;
  to: Time;
  label: number;
}

export interface LabelingPostJson {
  time: Time,
  position: string,
  color: string,
  shape: string,
  text: string,
}


// labelのロード
export const GET = async (req: NextRequest) => {
  const labeling_id = req.nextUrl.searchParams.get("id")
  const from = req.nextUrl.searchParams.get("from")
  const to = req.nextUrl.searchParams.get("to")
  const client = await clientPromise;
  const db = client.db('FXCharts');
  const collection = db.collection("labelings")
  console.log("labeling" + labeling_id)
  const res = await collection.findOne({ _id: new ObjectId(labeling_id!) })
  console.log(res)
  if (!res) {
    return NextResponse.json({
      message: "labeling data not found"
    })
  }
  return NextResponse.json(res?.label, { status: 200 })

}

// labelの登録
export const POST = async (req: Request) => {
  try {
    const labeling: SeriesMarker<Time>[] = await req.json()
    console.log(labeling)
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('FXCharts');
    const collection = db.collection("labelings")
    const res = await collection.updateOne(
      { _id: new ObjectId(id!) },
      { $set: { ["label"]: labeling } }
    )
    if (res.matchedCount === 0) {

      return NextResponse.json({ message: 'Document updated successfully' }, { status: 200 });
    }
    return NextResponse.json({ message: 'success' }, { status: 200 })

  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}