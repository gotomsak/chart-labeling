import { type NextRequest, NextResponse } from "next/server";
import { runRuleBasedLabeling } from "@/lib/labeling/runner";
import type { RuleBasedConfig } from "@/lib/labeling/types";
import prisma from "@/utils/db";

interface AutoLabelRequest {
  labelingId: number;
  symbol: string;
  interval: string;
  from?: string;
  to?: string;
  overwrite?: boolean;
  config?: Partial<RuleBasedConfig>;
}

export const POST = async (req: NextRequest) => {
  let body: AutoLabelRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!body.labelingId || !body.symbol || !body.interval) {
    return NextResponse.json(
      { error: "labelingId, symbol, interval are required" },
      { status: 400 },
    );
  }

  try {
    const ctx = await runRuleBasedLabeling({
      symbol: body.symbol,
      interval: body.interval,
      from: body.from ? new Date(body.from) : undefined,
      to: body.to ? new Date(body.to) : undefined,
      config: body.config,
    });

    const labeling = await prisma.labeling.findUnique({
      where: { id: body.labelingId },
    });
    if (!labeling) {
      return NextResponse.json({ error: "labeling not found" }, { status: 404 });
    }

    const existing = (labeling.markers as unknown as { time: number }[]) ?? [];
    const merged = body.overwrite ? ctx.result.markers : [...existing, ...ctx.result.markers];

    // 同一時刻の重複を除去（後勝ち）
    const dedupMap = new Map<number, (typeof merged)[number]>();
    for (const m of merged) dedupMap.set(m.time, m);
    const finalMarkers = [...dedupMap.values()].sort((a, b) => a.time - b.time);

    await prisma.$transaction([
      prisma.labeling.update({
        where: { id: body.labelingId },
        data: {
          markers: finalMarkers as object,
          source: "auto-rule",
        },
      }),
      prisma.autoLabelRun.create({
        data: {
          labelingId: body.labelingId,
          strategy: "rule-based",
          config: ctx.effectiveConfig as object,
          buyCount: ctx.result.counts.buy,
          sellCount: ctx.result.counts.sell,
          takeProfitCount: ctx.result.counts.takeProfit,
          noneCount: ctx.result.counts.none,
        },
      }),
    ]);

    return NextResponse.json(
      {
        symbol: body.symbol,
        interval: body.interval,
        candleCount: ctx.candleCount,
        markersAdded: ctx.result.markers.length,
        totalMarkers: finalMarkers.length,
        counts: ctx.result.counts,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: `${error}` }, { status: 500 });
  }
};
