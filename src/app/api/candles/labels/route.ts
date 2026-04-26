import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/db";

export const GET = async (_req: NextRequest) => {
  const labelings = await prisma.labeling.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  const res = labelings.map((l) => ({
    key: l.name,
    value: l.id.toString(),
  }));

  return NextResponse.json(res, { status: 200 });
};
