import { NextResponse } from 'next/server';
import { getRoadmap, saveRoadmap } from '@/lib/storage';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId || userId.trim() === '') {
    return NextResponse.json({ error: 'Valid userId is required' }, { status: 400 });
  }

  try {
    const data = await getRoadmap(userId);
    return NextResponse.json(data);
  } catch (err) {
    console.error('API GET Error:', err);
    return NextResponse.json({ error: 'Failed to read roadmap' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId || userId.trim() === '') {
    return NextResponse.json({ error: 'Valid userId is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    await saveRoadmap(userId, body);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API PUT Error:', err);
    return NextResponse.json({ error: 'Failed to update roadmap' }, { status: 500 });
  }
}
