import { NextResponse } from 'next/server';
import { roadmapStore } from '../../../lib/roadmap/store';
import { AiManager } from '../../../lib/roadmap/aiManager';

export async function GET() {
  const pendingChanges = roadmapStore.getPendingChanges();
  return NextResponse.json(pendingChanges);
}

export async function POST(request: Request) {
  const { changeId, action } = await request.json();
  
  if (action === 'accept') {
    AiManager.applyChange(changeId);
  } else if (action === 'reject') {
    AiManager.rejectChange(changeId);
  }
  
  return NextResponse.json({ success: true });
}
