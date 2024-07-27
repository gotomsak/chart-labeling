import { NextApiRequest, NextApiResponse } from "next";


export const POST = async (req: NextApiRequest, res: NextApiResponse) => {

    const { markDate } = req.body
    const marked = await prisma?.bookmark.create({data:{markDate:markDate}});
    res.status(200).json(marked);
  
}