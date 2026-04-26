import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/db";

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  try {
    const master = await prisma.chartMaster.upsert({
      where: { symbol: body.pair },
      update: {},
      create: {
        symbol: body.pair,
        displayName: body.pair,
        assetType: "FX",
        market: "FX",
      },
    });

    const firstCandle = await prisma.candle.findFirst({
      where: { chartMasterId: master.id, interval: "5m" },
      orderBy: { time: "asc" },
    });

    if (!firstCandle) {
      return NextResponse.json({ error: "chart data not found" }, { status: 404 });
    }

    const createdAt = new Date();
    const fileName = `${createdAt.toISOString()}_${body.pair}_${body.labelingName}.json`;

    const labeling = await prisma.labeling.create({
      data: {
        chartMasterId: master.id,
        fileName,
        name: body.labelingName,
        interval: "5m",
        source: "manual",
        markers: [],
        bookmarks: {
          create: {
            name: "先頭",
            time: firstCandle.time,
            bookmarkIndex: 0,
          },
        },
      },
    });

    return NextResponse.json({ id: labeling.id, name: labeling.name }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed create" }, { status: 500 });
  }
};
