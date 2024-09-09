import { Time, UTCTimestamp } from "lightweight-charts";
import { NextResponse } from "next/server";
import prisma from "@/utils/db";
import clientPromise from "@/utils/mongo";
import { ObjectId } from "mongodb";



export interface BookmarkRequestBody {
  time: Time,
  chartLabelingId: number
}
export const POST = async (req: Request) => {
  const body: BookmarkRequestBody = await req.json();
  try {
    const created = await prisma.bookmark.create({
      data: {
        time: String(body.time),
        chartLabelingId: body.chartLabelingId,
      }
    })
    return NextResponse.json({ message: `${created?.time}でbookmarkしました` }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 })
  }
}

export interface BookmarkData {
  //id: number
  name: string
  time: Time
  index: number
}

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const labelingId = searchParams.get('id');
  console.log(labelingId)
  const client = await clientPromise;
  const db = client.db('FXCharts');
  try {
    const find = await db.collection('labelings').findOne({_id: new ObjectId(labelingId!)});

    if (!find) {
      return NextResponse.json({ error: "Labeling not found" }, { status: 404 });
    }
    return NextResponse.json(find!.bookmarks, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 })
  } 
}