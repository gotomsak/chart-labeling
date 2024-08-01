// import { NextApiRequest, NextApiResponse } from "next";
// import { NextResponse } from "next/server";


export const POST = async (req: Request) => {

    // const { markDate } = req
    // const marked = await prisma?.bookmark.create({data:{markDate:markDate}});
    // return NextApiResponse.json(marked);
    return new Response(JSON.stringify({message: "test"}))
  
}