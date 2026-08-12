import { NextResponse } from 'next/server';
import { getRoadmap, saveRoadmap } from '@/lib/storage';
import type { RawRoadmapData, RawRoadmapItem, RawLayerData } from '@/types/roadmap';

/**
 * Recursively search an array of RawRoadmapItem for target itemId.
 * Returns the target item and an array of ancestors ordered from immediate parent to root parent.
 */
function findInItemsRecursive(
  items: RawRoadmapItem[],
  itemId: string,
  ancestors: RawRoadmapItem[] = []
): { target: RawRoadmapItem | null; ancestors: RawRoadmapItem[] } {
  for (const item of items) {
    if (item.id === itemId) {
      return { target: item, ancestors };
    }
    if (item.children && item.children.length > 0) {
      const res = findInItemsRecursive(item.children, itemId, [item, ...ancestors]);
      if (res.target) return res;
    }
  }
  return { target: null, ancestors: [] };
}

/**
 * Searches across all sections of RawRoadmapData (layers, milestones, mlops_devops, security_ethics).
 */
function findItemAndAncestors(
  data: RawRoadmapData,
  itemId: string
): { target: RawRoadmapItem | null; ancestors: RawRoadmapItem[] } {
  // Search layers
  if (data.layers) {
    for (const layer of data.layers) {
      if (layer.items) {
        const res = findInItemsRecursive(layer.items, itemId, []);
        if (res.target) return res;
      }
    }
  }

  // Search top-level collections
  const extraCollections = [data.milestones, data.mlops_devops, data.security_ethics];
  for (const collection of extraCollections) {
    if (collection && Array.isArray(collection)) {
      const res = findInItemsRecursive(collection, itemId, []);
      if (res.target) return res;
    }
  }

  return { target: null, ancestors: [] };
}

/**
 * Recursively sets status and auto-timestamps for item and all nested descendants.
 */
function setStatusRecursively(
  item: RawRoadmapItem,
  status: RawRoadmapItem['status'],
  dateStr: string
) {
  item.status = status;
  if (status === 'done') {
    item.completed_at = dateStr;
    if (!item.last_worked_on) item.last_worked_on = dateStr;
  } else if (status === 'active') {
    item.last_worked_on = dateStr;
    delete item.completed_at;
  } else if (status === 'pending') {
    delete item.completed_at;
  }

  if (item.children && item.children.length > 0) {
    for (const child of item.children) {
      setStatusRecursively(child, status, dateStr);
    }
  }
}

/**
 * Propagates completion/active status upward through ancestor chain.
 */
function propagateStatusUpward(ancestors: RawRoadmapItem[], dateStr: string) {
  for (const parent of ancestors) {
    if (!parent.children || parent.children.length === 0) continue;

    const allDone = parent.children.every((c) => c.status === 'done');
    if (allDone) {
      parent.status = 'done';
      parent.completed_at = dateStr;
    } else {
      const anyActiveOrDone = parent.children.some(
        (c) => c.status === 'active' || c.status === 'done'
      );
      if (anyActiveOrDone) {
        if (parent.status === 'pending' || parent.status === 'done') {
          parent.status = 'active';
          delete parent.completed_at;
        }
      } else {
        if (parent.status === 'done' || parent.status === 'active') {
          parent.status = 'pending';
          delete parent.completed_at;
        }
      }
    }
  }
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
 *     children?: RawRoadmapItem[]
 *   }
 * }
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
    const { target, ancestors } = findItemAndAncestors(data, itemId);

    if (!target) {
      return NextResponse.json({ error: `Item "${itemId}" not found` }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // ─── Apply status changes with auto-timestamps & child propagation ───
    const status = updates.status as RawRoadmapItem['status'] | undefined;

    if (status && status !== target.status) {
      if (status === 'done') {
        setStatusRecursively(target, 'done', today);
      } else if (status === 'pending') {
        setStatusRecursively(target, 'pending', today);
      } else if (status === 'active') {
        target.status = 'active';
        target.last_worked_on = today;
        delete target.completed_at;
      } else if (status === 'blocked') {
        target.status = 'blocked';
        const blockedMeta = target.blocked_metadata ?? {};
        blockedMeta.blocked_at = today;
        blockedMeta.reason = (updates.notes as string) ?? 'Manually blocked';
        target.blocked_metadata = blockedMeta;
      }
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
        delete target.snoozed_until;
      }
    }

    // ─── Apply next_action, notes, children ─────────────────
    if (updates.next_action !== undefined) {
      target.next_action = (updates.next_action as string) || '';
    }
    if (updates.notes !== undefined) {
      target.notes = (updates.notes as string) || '';
    }
    if (updates.children !== undefined && Array.isArray(updates.children)) {
      target.children = updates.children as RawRoadmapItem[];
    }

    // ─── Auto-update parent/ancestor completion status ──────────
    if (ancestors.length > 0) {
      propagateStatusUpward(ancestors, today);
    }

    // ─── Persist ────────────────────────────────────────────
    await saveRoadmap(userId, data);

    return NextResponse.json({
      success: true,
      item: target,
      parent: ancestors[0] ?? undefined,
    });
  } catch (err) {
    console.error('Failed to update item:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
