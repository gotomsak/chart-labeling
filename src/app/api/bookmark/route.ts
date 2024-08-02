import { Time, UTCTimestamp } from "lightweight-charts";
import { NextResponse } from "next/server";
import prisma from "@/utils/db";



export interface BookmarkRequestBody {
  time: Time,
}
export const POST = async (req: Request) => {
  const body: BookmarkRequestBody = await req.json();
  try {
    const created = await prisma.bookmark.create({
      data: {
        time: body.time.toString()
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

export const GET = async () => {
  try {
    const find:BookmarkData[] = await prisma.bookmark.findMany();
    return NextResponse.json(find, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 })

  } finally {
    await prisma.$disconnect();
  }
}