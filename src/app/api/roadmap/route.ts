import { NextResponse } from 'next/server';
import { getRoadmap, saveRoadmap } from '@/lib/storage';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'default';

  try {
    const data = await getRoadmap(userId);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to read roadmap' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'default';

  try {
    const body = await request.json();
    await saveRoadmap(userId, body);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update roadmap' }, { status: 500 });
  }
}
