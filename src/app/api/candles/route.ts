import { createReadStream } from 'fs';
import { NextResponse } from 'next/server';
import fs from 'fs';
import readline from 'readline';
import { Time, UTCTimestamp } from 'lightweight-charts';
import prisma from "@/utils/db";
import path from 'path';

export interface GetResponse {
  data: {
    x: string;
    y: number[];
  }[]
}

export interface CandleType {
  time: Time,
  open: number,
  high: number,
  low: number,
  close: number
}

const createReadLine = (dataFile: string, start: number, barNum: number): Promise<Response> => {
  const result: CandleType[] = [];
  let index = 0;

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(dataFile)) {
      reject(NextResponse.json({ error: 'Invalid time frame' }, { status: 400 }))
    }
    console.log('Starting stream from file:', dataFile);

    const fileStream = createReadStream(dataFile);

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      try {
        const jsonObject = JSON.parse(line);
        if(jsonObject['datetime']>= start){
          index++;
          result.push({
            time: jsonObject['datetime'],
            open: parseFloat(jsonObject['Open']),
            high: parseFloat(jsonObject['High']),
            low: parseFloat(jsonObject['Low']),
            close: parseFloat(jsonObject['Close'])
          });
        }
        // if (index >= start && index < end) {
        //   //const jsonObject = JSON.parse(line);
        //   // console.log(jsonObject)
          
        // }

        if (index >= barNum) {
          rl.close();
          fileStream.destroy();
          // console.log(result)
          resolve(NextResponse.json(result, { status: 200 }));
        }
      } catch (error) {
        console.error('Error processing data chunk:', error);
        reject(new Error('Error processing data chunk'));
      }
    });

    rl.on('close', () => {
      if (index < barNum) {
        resolve(NextResponse.json(result, { status: 200 }));
      }
    });

    fileStream.on('error', (err) => {
      reject(new Error('File stream error'));
    });
  });
}

async function copyFile(source: any, destination: any) {
  try {
    await fs.promises.copyFile(source, destination);
    console.log(`File copied from ${source} to ${destination}`);
  } catch (error: any) {
    throw new Error(`Failed to copy file: ${error.message}`);
  }
}

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const start = parseInt(searchParams.get('start') || '0', 10);
  const pair = searchParams.get('pair');
  const reference = searchParams.get('reference');
  const time_frame = searchParams.get('time_frame');
  const id = searchParams.get('id');
  const barNum = parseInt(searchParams.get('bar_num')||'200000')

  console.log(reference)
  try {
    if (reference !== "labeling") {
      return createReadLine(`src/data/${reference}/${pair}.${time_frame}.json`, start, barNum)
    }
    if (id !== null){
      const findChart = await prisma.chartLabeling.findUnique({ where: { id: Number(id) } })
      return createReadLine(`src/data/${reference}/${findChart?.fileName}`, start, barNum)
    }
    return NextResponse.json({ error: "reference not found" }, { status: 500 });

  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
};

export interface CreateChartLabelingRequestBody {
  pair: string
  name: string
}
export const POST = async (req: Request) => {
  const body: CreateChartLabelingRequestBody = await req.json();
  try {
    const result = await prisma.$transaction(async (prisma) => {
      const chartMaster = await prisma.chartMaster.upsert({
        where: { pair: body.pair },
        update: {},
        create: {
          pair: body.pair,
        },
      })
      const createdAt = new Date()
      const fileName = `${createdAt.toISOString()}_${body.pair}_${body.name}.json`
      const destinationFilePath = path.join('src/data/labeling/', fileName);
      await copyFile(`src/data/master/${body.pair}.5.json`, destinationFilePath);

      const chartLabeling = await prisma.chartLabeling.create({
        data: {
          fileName: fileName,
          name: body.name,
          chartMasterId: chartMaster.id,
          created_at: createdAt
        },
      })

      const fileStream = fs.createReadStream(destinationFilePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      })

      let datetimeValue = null;
      for await (const line of rl) {
        const jsonObject = JSON.parse(line);
        datetimeValue = jsonObject.datetime;
        break; // Exit after reading the first line
      }

      await prisma.bookmark.create({
        data:{
          time: datetimeValue.toString(),
          chartLabelingId: chartLabeling.id
        }
      })
      return chartLabeling
    })

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: `Failed to insert data: ${error}` }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}