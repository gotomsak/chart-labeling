import type { Time } from "lightweight-charts";
import { NextResponse } from "next/server";
import prisma from "@/utils/db";

export interface BookmarkRequestBody {
  time: Time;
  chartLabelingId: number;
}

export const POST = async (req: Request) => {
  const body: BookmarkRequestBody = await req.json();
  try {
    const created = await prisma.bookmark.create({
      data: {
        time: BigInt(body.time as unknown as number),
        labelingId: Number(body.chartLabelingId),
      },
    });
    return NextResponse.json({ message: `${created.time}でbookmarkしました` }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: `${error}` }, { status: 500 });
  }
};

export interface BookmarkData {
  name: string;
  time: Time;
  index: number;
}

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const labelingId = searchParams.get("id");

  if (!labelingId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { labelingId: Number(labelingId) },
      orderBy: { time: "asc" },
    });

    if (bookmarks.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(
      bookmarks.map((b) => ({
        name: b.name,
        time: Number(b.time),
        index: b.bookmarkIndex,
      })),
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: `${error}` }, { status: 500 });
  }
};
