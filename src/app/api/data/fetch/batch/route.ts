import { type NextRequest, NextResponse } from "next/server";
import { ingestSymbol } from "@/utils/dataIngestion";
import prisma from "@/utils/db";
import type { Interval } from "@/utils/yahooFinance";

interface BatchRequest {
  assetType?: "FX" | "STOCK";
  intervals?: Interval[];
  from?: string;
  to?: string;
}

const DEFAULT_FX_INTERVALS: Interval[] = ["1h", "4h"];
const DEFAULT_STOCK_INTERVALS: Interval[] = ["1d", "1h"];

export const POST = async (req: NextRequest) => {
  let body: BatchRequest = {};
  try {
    body = await req.json();
  } catch {
    // 空ボディでも全件処理とする
  }

  const masters = await prisma.chartMaster.findMany({
    where: {
      enabled: true,
      ...(body.assetType ? { assetType: body.assetType } : {}),
    },
  });

  const to = body.to ? new Date(body.to) : new Date();
  const defaultFrom = new Date(to.getTime() - 30 * 24 * 3600 * 1000);
  const from = body.from ? new Date(body.from) : defaultFrom;

  const results: unknown[] = [];
  const errors: { symbol: string; interval: Interval; error: string }[] = [];

  for (const m of masters) {
    const intervals =
      body.intervals ?? (m.assetType === "FX" ? DEFAULT_FX_INTERVALS : DEFAULT_STOCK_INTERVALS);

    for (const interval of intervals) {
      try {
        const r = await ingestSymbol(m.symbol, interval, from, to);
        results.push(r);
      } catch (error) {
        errors.push({ symbol: m.symbol, interval, error: `${error}` });
      }
    }
  }

  return NextResponse.json({ results, errors }, { status: 200 });
};
