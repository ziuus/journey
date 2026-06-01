import { NextResponse } from 'next/server';
import { getHistory, saveHistory } from '@/lib/storage';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId || userId.trim() === '') {
    return NextResponse.json({ error: 'Valid userId is required' }, { status: 400 });
  }

  try {
    const data = await getHistory(userId);
    return NextResponse.json(data);
  } catch (err) {
    console.error('History GET Error:', err);
    return NextResponse.json({ chats: [] });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId || userId.trim() === '') {
    return NextResponse.json({ error: 'Valid userId is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    await saveHistory(userId, body);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('History POST Error:', err);
    return NextResponse.json({ error: 'Failed to save history' }, { status: 500 });
  }
}
