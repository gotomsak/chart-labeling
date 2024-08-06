import { NextResponse } from "next/server"
import prisma from "@/utils/db";


export const GET = async ({ params }: { params: { slug: string } }) => {
  const result = await prisma?.chartLabeling.findMany()
  const res = result?.map((value) => {
    return ({ key: value.name, value: value.id })
  })
  return NextResponse.json(res, { status: 200 })
}