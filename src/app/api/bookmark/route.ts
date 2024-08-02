import { UTCTimestamp } from "lightweight-charts";
import { NextResponse } from "next/server";
import prisma from "@/utils/db";



export interface BookmarkRequestBody {
  time: UTCTimestamp,
}
export const POST = async (req: Request) => {
  console.log("test")
  const body: BookmarkRequestBody = await req.json();
  try {
    const created = await prisma?.bookmark.create({
      data: {
        time: body.time.toString()
      }
    })
    return NextResponse.json({ message: `${created?.time}でbookmarkしました` }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 })
  }
}
