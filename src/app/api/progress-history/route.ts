import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

const HISTORY_PATH = path.join(process.cwd(), 'data', 'progress_history.json');

export async function GET() {
  try {
    const data = await fs.readFile(HISTORY_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (err) {
    console.error('Progress History GET Error:', err);
    return NextResponse.json([]);
  }
}
