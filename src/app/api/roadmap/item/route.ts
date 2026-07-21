import { NextResponse } from 'next/server';
import { getRoadmap, saveRoadmap } from '@/lib/storage';
import type { RawRoadmapData, RawRoadmapItem, RawLayerData } from '@/types/roadmap';

function findItemRecursive(
  layers: RawLayerData[],
  itemId: string,
): RawRoadmapItem | null {
  for (const layer of layers) {
    for (const item of layer.items) {
      if (item.id === itemId) return item;
    }
  }
  return null;
}

/**
 * PATCH /api/roadmap/item?userId=local_user
 *
 * Body:
 * {
 *   itemId: string,
 *   updates: {
 *     status?: "pending" | "active" | "done" | "blocked",
 *     next_action?: string,
 *     snoozed_until?: string,
 *     notes?: string,
 *   }
 * }
 *
 * Auto-timestamps:
 *   status → "active"   → last_worked_on = today
 *   status → "done"     → completed_at = today
 *   status → "blocked"  → blocked_metadata = { blocked_at: today, reason: ... }
 *   snoozed_until set   → status = "pending" (implicitly)
 */
export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId || userId.trim() === '') {
    return NextResponse.json({ error: 'Valid userId is required' }, { status: 400 });
  }

  let body: { itemId?: string; updates?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { itemId, updates } = body;
  if (!itemId || typeof itemId !== 'string') {
    return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
  }
  if (!updates || typeof updates !== 'object') {
    return NextResponse.json({ error: 'updates object is required' }, { status: 400 });
  }

  try {
    const data = await getRoadmap(userId);
    const target = findItemRecursive(data.layers, itemId);

    if (!target) {
      return NextResponse.json({ error: `Item "${itemId}" not found` }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // ─── Apply status changes with auto-timestamps ──────────
    const status = updates.status as string | undefined;

    if (status && status !== target.status) {
      target.status = status as RawRoadmapItem['status'];

      if (status === 'active') {
        target.last_worked_on = today;
      } else if (status === 'done') {
        target.completed_at = today;
        if (!target.last_worked_on) target.last_worked_on = today;
      } else if (status === 'blocked') {
        // Add blocked metadata if not present
        const blockedMeta = target.blocked_metadata ?? {};
        blockedMeta.blocked_at = today;
        blockedMeta.reason = (updates.notes as string) ?? 'Manually blocked';
        target.blocked_metadata = blockedMeta;
      }
      // 'pending' — no timestamp change needed
    }

    // ─── Apply snoozed_until ─────────────────────────────────
    if (updates.snoozed_until !== undefined) {
      const su = updates.snoozed_until as string;
      if (su) {
        target.snoozed_until = su;
        if (target.status === 'done' || target.status === 'blocked') {
          target.status = 'pending';
        }
      } else {
        // Clear snooze
        delete target.snoozed_until;
      }
    }

    // ─── Apply next_action ──────────────────────────────────
    if (updates.next_action !== undefined) {
      const na = updates.next_action as string;
      target.next_action = na || '';
    }

    // ─── Apply notes ─────────────────────────────────────────
    if (updates.notes !== undefined) {
      target.notes = (updates.notes as string) || '';
    }

    // ─── Persist ────────────────────────────────────────────
    await saveRoadmap(userId, data);

    return NextResponse.json({
      success: true,
      item: target,
    });
  } catch (err) {
    console.error('API PATCH Error:', err);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}
