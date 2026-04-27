import { type NextRequest, NextResponse } from "next/server";
import { runRuleBasedLabeling } from "@/lib/labeling/runner";
import type { RuleBasedConfig } from "@/lib/labeling/types";

interface PreviewRequest {
  symbol: string;
  interval: string;
  from?: string;
  to?: string;
  config?: Partial<RuleBasedConfig>;
}

export const POST = async (req: NextRequest) => {
  let body: PreviewRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.symbol || !body.interval) {
    return NextResponse.json({ error: "symbol and interval are required" }, { status: 400 });
  }

  try {
    const ctx = await runRuleBasedLabeling({
      symbol: body.symbol,
      interval: body.interval,
      from: body.from ? new Date(body.from) : undefined,
      to: body.to ? new Date(body.to) : undefined,
      config: body.config,
    });
    return NextResponse.json(
      {
        symbol: body.symbol,
        interval: body.interval,
        candleCount: ctx.candleCount,
        config: ctx.effectiveConfig,
        ...ctx.result,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: `${error}` }, { status: 500 });
  }
};
