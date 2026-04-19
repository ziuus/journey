import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const HISTORY_PATH = path.join(process.cwd(), 'data', 'history.json');

export async function GET() {
  try {
    const data = await fs.readFile(HISTORY_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json({ messages: [], commandHistory: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await fs.writeFile(HISTORY_PATH, JSON.stringify(body, null, 2));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save history' }, { status: 500 });
  }
}
