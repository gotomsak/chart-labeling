import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/db";

export const GET = async (req: NextRequest) => {
  const assetType = req.nextUrl.searchParams.get("assetType");

  const masters = await prisma.chartMaster.findMany({
    where: {
      enabled: true,
      ...(assetType ? { assetType } : {}),
    },
    orderBy: [{ assetType: "asc" }, { symbol: "asc" }],
    select: {
      id: true,
      symbol: true,
      displayName: true,
      assetType: true,
      market: true,
    },
  });

  return NextResponse.json(masters, { status: 200 });
};
