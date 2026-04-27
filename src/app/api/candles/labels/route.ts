import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/db";

export const GET = async (req: NextRequest) => {
  const symbol = req.nextUrl.searchParams.get("symbol");

  let chartMasterId: number | undefined;
  if (symbol) {
    const master = await prisma.chartMaster.findUnique({ where: { symbol } });
    if (!master) {
      return NextResponse.json([], { status: 200 });
    }
    chartMasterId = master.id;
  }

  const labelings = await prisma.labeling.findMany({
    where: {
      deletedAt: null,
      ...(chartMasterId ? { chartMasterId } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  const res = labelings.map((l) => ({
    key: l.name,
    value: l.id.toString(),
  }));

  return NextResponse.json(res, { status: 200 });
};
