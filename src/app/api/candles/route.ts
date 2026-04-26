import type { Time } from "lightweight-charts";
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/db";

export interface GetResponse {
  data: {
    x: string;
    y: number[];
  }[];
}

export interface CandleType {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

const serializeCandle = <T extends { time: bigint; id?: bigint }>(c: T) => ({
  ...c,
  time: Number(c.time),
  id: c.id ? Number(c.id) : undefined,
});

export const GET = async (req: NextRequest) => {
  const symbol = req.nextUrl.searchParams.get("pair") ?? req.nextUrl.searchParams.get("symbol");
  const interval =
    req.nextUrl.searchParams.get("time_frame") ?? req.nextUrl.searchParams.get("interval");
  const index = parseInt(req.nextUrl.searchParams.get("index") || "0", 10);
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10", 10);

  if (!symbol || !interval) {
    return NextResponse.json({ error: "symbol and interval are required" }, { status: 400 });
  }

  try {
    const master = await prisma.chartMaster.findUnique({ where: { symbol } });
    if (!master) {
      return NextResponse.json([]);
    }

    const candles = await prisma.candle.findMany({
      where: { chartMasterId: master.id, interval },
      orderBy: { time: "asc" },
      skip: index,
      take: limit,
    });

    return NextResponse.json(candles.map(serializeCandle));
  } catch (error) {
    console.error("Failed to fetch candles:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
};

export interface CreateChartLabelingRequestBody {
  pair: string;
  name: string;
}

export const POST = async (req: Request) => {
  const body: CreateChartLabelingRequestBody = await req.json();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const chartMaster = await tx.chartMaster.upsert({
        where: { symbol: body.pair },
        update: {},
        create: {
          symbol: body.pair,
          displayName: body.pair,
          assetType: "FX",
          market: "FX",
        },
      });

      const createdAt = new Date();
      const fileName = `${createdAt.toISOString()}_${body.pair}_${body.name}.json`;

      const labeling = await tx.labeling.create({
        data: {
          fileName,
          name: body.name,
          chartMasterId: chartMaster.id,
          interval: "5m",
          source: "manual",
          createdAt,
        },
      });

      const firstCandle = await tx.candle.findFirst({
        where: { chartMasterId: chartMaster.id, interval: "5m" },
        orderBy: { time: "asc" },
      });

      if (firstCandle) {
        await tx.bookmark.create({
          data: {
            name: "先頭",
            time: firstCandle.time,
            bookmarkIndex: 0,
            labelingId: labeling.id,
          },
        });
      }

      return labeling;
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: `Failed to insert data: ${error}` }, { status: 500 });
  }
};
