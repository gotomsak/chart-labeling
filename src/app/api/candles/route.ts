import { createReadStream } from 'fs';
import { NextResponse } from 'next/server';
import fs from 'fs';
import readline from 'readline';
import { Time, UTCTimestamp } from 'lightweight-charts';

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

const createReadLine = (dataFile: string, start: number, end: number): Promise<Response> => {
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
          result.push({
            time: jsonObject['datetime'],
            open: parseFloat(jsonObject['Open']),
            high: parseFloat(jsonObject['High']),
            low: parseFloat(jsonObject['Low']),
            close: parseFloat(jsonObject['Close'])
          });
        }

        index++;
        if (index >= end) {
          rl.close();
          fileStream.destroy();
          resolve(NextResponse.json(result, { status: 200 }));
        }
      } catch (error) {
        console.error('Error processing data chunk:', error);
        reject(new Error('Error processing data chunk'));
      }
    });

    rl.on('close', () => {
      if (index < end) {
        resolve(NextResponse.json(result, { status: 200 }));
      }
    });

    fileStream.on('error', (err) => {
      reject(new Error('File stream error'));
    });
  });
}

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const start = parseInt(searchParams.get('start') || '0', 10);
  const end = parseInt(searchParams.get('end') || '10', 10);
  const time_frame = searchParams.get('time_frame');

  try {
    if (time_frame === '5T') {
      return createReadLine('src/data/GBPJPY.5.json', start, end);
    }
    if (time_frame === '1H') {
      return createReadLine('src/data/GBPJPY.1h.json', start, end);
    }
    if (time_frame === '4H') {
      return createReadLine('src/data/GBPJPY.4h.json', start, end);
    }
    return NextResponse.json({ error: 'Invalid time frame' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
};
