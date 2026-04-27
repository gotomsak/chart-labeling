import { type NextRequest, NextResponse } from "next/server";
import { ingestSymbol } from "@/utils/dataIngestion";
import type { Interval } from "@/utils/yahooFinance";

interface FetchRequest {
  symbol: string;
  interval: Interval;
  from?: string; // ISO date
  to?: string; // ISO date
}

const VALID_INTERVALS: Interval[] = ["5m", "15m", "1h", "4h", "1d"];

export const POST = async (req: NextRequest) => {
  let body: FetchRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!body.symbol || !body.interval) {
    return NextResponse.json({ error: "symbol and interval are required" }, { status: 400 });
  }
  if (!VALID_INTERVALS.includes(body.interval)) {
    return NextResponse.json(
      { error: `interval must be one of ${VALID_INTERVALS.join(", ")}` },
      { status: 400 },
    );
  }

  const to = body.to ? new Date(body.to) : new Date();
  const defaultFrom = new Date(to.getTime() - 30 * 24 * 3600 * 1000); // 30 日前
  const from = body.from ? new Date(body.from) : defaultFrom;

  try {
    const result = await ingestSymbol(body.symbol, body.interval, from, to);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("ingestSymbol failed:", error);
    return NextResponse.json({ error: `${error}` }, { status: 500 });
  }
};
