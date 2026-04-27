import { NextResponse } from "next/server";
import prisma from "@/utils/db";

export const GET = async () => {
  // ChartMaster ごとの最新時刻と件数を集計
  const masters = await prisma.chartMaster.findMany({
    where: { enabled: true },
    orderBy: { symbol: "asc" },
  });

  const summary = await Promise.all(
    masters.map(async (m) => {
      const grouped = await prisma.candle.groupBy({
        by: ["interval"],
        where: { chartMasterId: m.id },
        _count: { _all: true },
        _max: { time: true, fetchedAt: true },
      });

      return {
        symbol: m.symbol,
        displayName: m.displayName,
        assetType: m.assetType,
        market: m.market,
        intervals: grouped.map((g) => ({
          interval: g.interval,
          count: g._count._all,
          latestTime: g._max.time != null ? Number(g._max.time) : null,
          fetchedAt: g._max.fetchedAt,
        })),
      };
    }),
  );

  return NextResponse.json(summary, { status: 200 });
};
