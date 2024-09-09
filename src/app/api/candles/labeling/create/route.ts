import clientPromise from "@/utils/mongo";
import { NextRequest, NextResponse } from "next/server";


export const POST = async (req: NextRequest) => {
  const body = await req.json()
  console.log(body)
  try {
    const client = await clientPromise;
    const db = client.db('FXCharts');
    const min_time = await db.collection(`${body["pair"]}_5m`).aggregate([
      { $group: { _id: null, minValue: { $min: "$time" } } },
      { $project: { _id: 0, minValue: 1 } }
    ]).toArray();
    if (min_time.length > 0) {
      const res = await db.collection("labelings").insertOne(
        {
          name: body["labelingName"],
          bookmarks: [{ name: "先頭", time: min_time[0].minValue, index: 0 }]
        }
      );
      return NextResponse.json(res, { status: 200 })
    }
    return NextResponse.json({ error: 'chart data not found' }, { status: 404 })

  } catch (error) {
    return NextResponse.json({ error: 'Failed create' }, { status: 500 })
  }
}