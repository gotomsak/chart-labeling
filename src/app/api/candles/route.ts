import { createReadStream } from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';
import { pipeline } from 'stream';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import fs from 'fs';
import ndjson from 'ndjson';
import JSONStream from 'JSONStream';
import readline from 'readline';
import { UTCTimestamp } from 'lightweight-charts';


//[{ x: date, y: [O,H,L,C] }]
export interface GetResponse {
  data: {
    x: string;
    y: number[];
  }[]
}

export interface CandleType {
  time: UTCTimestamp,
  open: number,
  high: number,
  low: number,
  close: number
}

const createReadLine = (dataFile: string, start: number, end: number): Promise<unknown> => {
  const result: CandleType[] = [];
  let index = 0;
  
  return new Promise((resolve, reject) => {

    if (!fs.existsSync(dataFile)) {
      return reject(new Error('File not found'));
    }
    console.log('Starting stream from file:', dataFile);

    const fileStream = createReadStream(dataFile);

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      try {
        if (index >= start && index < end) {
          const jsonObject = JSON.parse(line);
          // console.log(jsonObject)
          // const dateTimeString = jsonObject['date'] + ' ' + jsonObject['time']
          result.push({
            time: jsonObject['datetime'],
            // time: dateTimeString.replace('.', '-').replace('.', '-'),
            open: parseFloat(jsonObject['Open']),
            high: parseFloat(jsonObject['High']),
            low: parseFloat(jsonObject['Low']),
            close: parseFloat(jsonObject['Close'])
          });
        }

        index++;
        if (index >= end) {
          rl.close()
          fileStream.destroy();
          resolve(NextResponse.json(result, { status: 200 }));
        }
      } catch (error) {
        console.error('Error processing data chunk:', error);
        reject(new Error('Error processing data chunk'));
      }
    });
  });
}

export const GET = async (req: Request) => {
  console.log(req)
  const { searchParams } = new URL(req.url);
  const start = parseInt(searchParams.get('start') || '0', 10);
  const end = parseInt(searchParams.get('end') || '10', 10);
  const time_frame = searchParams.get('time_frame');

  // データを生成（startとendに基づいてデータをフィルタリング）

  if (time_frame === '5T') {
    return createReadLine('src/data/GBPJPY.5.json', start, end)
  }
  if (time_frame === '1H') {
    return createReadLine('src/data/GBPJPY.1h.json', start, end)
  }
  if (time_frame === '4H') {
    return createReadLine('src/data/GBPJPY.4h.json', start, end)
  }
};
