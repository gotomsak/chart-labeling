import type { SeriesMarker, Time } from "lightweight-charts";
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/db";

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
  time: Time;
  position: string;
  color: string;
  shape: string;
  text: string;
}

// labelのロード
export const GET = async (req: NextRequest) => {
  const labelingId = req.nextUrl.searchParams.get("id");
  if (!labelingId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const labeling = await prisma.labeling.findUnique({
    where: { id: Number(labelingId) },
    select: { markers: true },
  });

  if (!labeling) {
    return NextResponse.json({ message: "labeling data not found" });
  }
  return NextResponse.json(labeling.markers, { status: 200 });
};

// labelの登録
export const POST = async (req: Request) => {
  try {
    const markers: SeriesMarker<Time>[] = await req.json();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.labeling.update({
      where: { id: Number(id) },
      data: { markers: markers as object },
    });

    return NextResponse.json({ message: "success" }, { status: 200 });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
};
