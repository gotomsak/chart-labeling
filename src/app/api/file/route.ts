import fs from "node:fs";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/db";

const saveLabelDataToFile = async (labelData: unknown[]) => {
  const jsonData = JSON.stringify(labelData, null, 2);

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const fileName = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}.json`;
  const dir = path.join(process.cwd(), "src/data");
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(path.join(dir, fileName), jsonData, "utf-8");
};

interface MarkerEntry {
  time: number;
  shape?: string;
}

export const POST = async (req: NextRequest) => {
  const symbol = req.nextUrl.searchParams.get("pair") ?? req.nextUrl.searchParams.get("symbol");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const labelingId = req.nextUrl.searchParams.get("label");

  if (!symbol || !from || !to || !labelingId) {
    return NextResponse.json({ error: "missing parameters" }, { status: 400 });
  }

  const master = await prisma.chartMaster.findUnique({ where: { symbol } });
  if (!master) {
    return NextResponse.json({ error: "chart master not found" }, { status: 404 });
  }

  const labeling = await prisma.labeling.findUnique({ where: { id: Number(labelingId) } });
  if (!labeling) {
    return NextResponse.json({ error: "labeling not found" }, { status: 404 });
  }

  const candles = await prisma.candle.findMany({
    where: {
      chartMasterId: master.id,
      interval: "5m",
      time: { gte: BigInt(from), lte: BigInt(to) },
    },
    orderBy: { time: "asc" },
  });

  const markers = (labeling.markers as unknown as MarkerEntry[]) ?? [];

  // label: 0 なし, 1 買い, 2 売り, 3 利確
  const res = candles.map((v) => {
    let registerLabel = 0;
    for (const m of markers) {
      if (Number(m.time) === Number(v.time)) {
        registerLabel = m.shape === "arrowUp" ? 1 : m.shape === "arrowDown" ? 2 : 3;
        break;
      }
    }
    const volume = Math.abs(v.high - v.low) + Math.abs(v.close - v.open);
    return {
      time: Number(v.time),
      open: v.open,
      high: v.high,
      low: v.low,
      close: v.close,
      volume: parseFloat(volume.toFixed(3)),
      label: registerLabel,
    };
  });

  await saveLabelDataToFile(res);
  return NextResponse.json({ status: 200 });
};
