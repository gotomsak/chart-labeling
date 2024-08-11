import { Time, UTCTimestamp } from "lightweight-charts";
import { NextResponse } from "next/server";
import prisma from "@/utils/db";



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
        chartLabelingId: body.chartLabelingId
      }
    })
    return NextResponse.json({ message: `${created?.time}でbookmarkしました` }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 })
  }
}

export interface BookmarkData {
  id: number
  time: Time
}

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const chartId = searchParams.get('chart_id');
  try {
    const find:BookmarkData[] = await prisma.bookmark.findMany({where: {chartLabelingId: Number(chartId)}});
    return NextResponse.json(find, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 })
  } finally {
    await prisma.$disconnect();
  }
}