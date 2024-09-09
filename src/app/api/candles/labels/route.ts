import { NextResponse } from "next/server"
import prisma from "@/utils/db";
import clientPromise from "@/utils/mongo";


export const GET = async ({ params }: { params: { slug: string } }) => {
  // const result = await prisma?.chartLabeling.findMany()
  // const res = result?.map((value) => {
  //   return ({ key: value.name, value: value.id })
  // })
  const client = await clientPromise;
  const db = client.db('FXCharts');
  const collection = db.collection("labelings")
  const documents = await collection.find({}).toArray();
  const res = documents.map((doc:any)=>({
    key: doc.name,
    value: doc._id.toString()
  }))

  return NextResponse.json(res, { status: 200 })
}