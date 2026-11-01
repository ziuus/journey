---
name: journey-roadmap
description: Maintain and audit the Journey personal roadmap — read structure, evaluate items against target roles, add mindset/career counter-myths, prune bloat, and sync changes via MCP or direct file edit.
tags:
  - roadmap
  - career
  - journey
  - personamaxing
  - systems-design
stability: active
triggers:
  - User wants to update, audit, or review their Journey roadmap
  - update our journey
  - add missing goals or things from a resume review
  - sync resume gaps into journey
  - check the roadmap
  - adding or removing roadmap items
  - career or skill audit
  - execution dashboard work
  - today view or this week recommendations
  - data enrichment pass
  - scoring or recommendation engine work
  - roadmap engine or tree view work
  - sub-tree / nested sub-goals
  - multi-view (DAG / Ladder / List / Table) work
---

# Journey Roadmap Maintenance

## User Preferences (Session 2026-07-21)

**No badge fields.** The user explicitly dislikes per-item badge/metadata clutter. All items in the live roadmap have been stripped of these fields:
- `priority`, `horizon`, `career_value`, `career_roi`, `interview_value`, `engineering_value`, `learning_depth`, `prerequisites`
- The entire `metadata` block (which duplicated the above)

**Item format is minimal:**
```json
{
  "id": "l3_my_item",
  "title": "My Topic",
  "status": "pending",
  "notes": "What to learn and how to apply it",
  "track": "ai_engineering"
}
```
Only `id`, `title`, `status`, `notes`, and `track` are core fields. Optionally: `depends_on`, `next_action`, `created_at`, `last_worked_on`, `actual_hours`, `target_date`. **Do not add badge fields to new items** — the user will reject them.

**Consolidate to 3-4 broad goals.** Layers should group into at most 3-4 high-level goals (e.g. AI Engineering, Systems & Web3, Career & Health). Currently the roadmap has 14 layers targeting this pattern.

## Architecture

**DISCOVERY FIRST — Before any operation, locate the actual installation:**
```bash
which journey                    # → /home/zius/.npm-global/bin/journey
npm list -g @ziuus/journey       # → confirms global install
readlink -f $(which journey)     # → ~/.npm-global/lib/node_modules/@ziuus/journey/scripts/journey-cli.js
```
The personal roadmap lives at `~/.journey/data/roadmap.json` (user-specific — **never** the repo template at `~/Projects/journey/data/roadmap.json`). The global npm package at `~/.npm-global/lib/node_modules/@ziuus/journey` is the source of truth for the web UI and MCP server.

**Repo skill note**: The journey GitHub repo (`github.com/ziuus/journey`) contains a minimal agent skill at `agent-skills/journey/SKILL.md` (23 lines, basic MCP usage only). It is **excluded from the npm package** via `.npmignore` and is NOT a substitute for this comprehensive skill.

### Large File Writing Workaround

When writing files over ~2KB, the `write_file` tool may silently truncate. The correct workaround is to write a Python script with the full content and execute it:

```python
#!/usr/bin/env python3
import os
content = '''...content...'''
path = os.path.expanduser('~/path/to/file.tsx')
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Written {len(content)} bytes to {path}')
```

Write the script via `write_file` (which handles moderate sizes), then `terminal('python3 scripts/write-file.py')` to produce the actual deliverable. Use this for dashboard pages, CSS files, and engine logic files that exceed the tool's inline size limit.

### v3 Schema (vNext Phase 1, July 2026)

The schema was extended with optional metadata fields. All new fields are backward-compatible — old files work without changes. The full schema reference is at `references/roadmap-schema-v3.md`.

**Note: Per-item badge fields have been STRIPPED from the live data (2026-07-21).** The user does not want `priority`, `horizon`, `career_value`, `career_roi`, `interview_value`, `engineering_value`, `learning_depth`, `prerequisites`, or `metadata` block on items. The schema documentation remains for codebase reference but these fields must NOT be added to the roadmap JSON.

**Per-layer metadata** (optional):
- `track`: string — groups layers into tabs (e.g. `"career_tech"`, `"health_physical"`)
- `icon`: string — lucide icon name for layer card
- `color`: string — CSS color for accent/badge tint
- `domain`: string — matches `domains[].id`
- `goal`: string — matches `goals[].id`

**Per-item metadata** (deprecated — not used in live data):
- `priority`: `"master"|"working"|"awareness"` — replaces old numeric priority
- `horizon`: `"3_months"|"6_months"|"12_months"|"2_years"|"5_years"|"ongoing"` — expected completion window (snake_case, not short form)
- `career_value`: `"critical"|"high"|"medium"|"niche"` — direct impact on salary/career trajectory (string enum, not number)
- `interview_value`: number 1-10 — how likely to appear in interviews
- `prerequisites`: string[] — item IDs that must precede this one
- `nodeType`: `"core"|"elective"|"supplementary"|"milestone"`
- `metadata`: `ItemMetadata` block — for richer annotation (see `references/roadmap-schema-v3.md` for all fields)

Items can carry flat shorthands OR a `metadata` block. At read time `storage.ts` merges both: flat fields win over the block.

**Top-level extensions**:
- `domains`: array of `{id, label, color?, icon?}`
- `goals`: array of `{id, title, description, target_date?, domain?, tracks[]}`
- `config.tracks`: array of `{id, label, icon?, color?}` — defines available tracks
- `version`: string — schema version identifier (e.g. `"v3"`)
- `dual_goals`: array of `{title, horizon}` — quick-reference dual-goal list mirroring `goals[]` but flat

### Dual-Goal System

The personal roadmap is structured around two parallel goals:

1. **₹50 LPA in 12 months** — aggressive career acceleration. Prioritizes interview-relevant items, high-career-value topics, and portfolio/mock-interview preparation.
2. **Top AI/Systems Engineer in 5 years** — deep long-term mastery. Prioritizes fundamental understanding (Rust internals, ZK-ML, distributed systems), research-level topics, and rare skills.

Items should NOT carry `priority`/`horizon` badges (user preference). Use `track` field and layer grouping for UI filtering instead.

### Execution Dashboard Architecture (Phase 2, July 2026)

The execution dashboard at `/dashboard` answers "What should I do now?" by recommending items based on a composite scoring algorithm. It lives in `src/lib/execution-recommendations.ts`.

**Scoring algorithm** (`scoreItem()`):
- priority: critical=100, high=60, medium=30, low=10
- horizon: 3_months=100, 6_months=60, 12_months=30, 2_years=15, 5_years=5, ongoing=20
- career_roi: very_high=100, high=60, medium=30, low=10
- interview_value: 0-10, multiplied by 10
- engineering_value: 0-10, multiplied by 5
- status bonus: pending=20, active=30, done=0
- **next_action_bonus**: +15 if item has a concrete next_action defined
- **foundational_bonus**: +5 per downstream dependent (items that list this item in their depends_on)
- **vagueness_penalty**: -30 if item has no next_action AND is broad/scope-level (e.g. "Macronutrient Ratio Optimization" without a concrete action)
- blocked penalty: -200 applied during dashboard computation

**Phase 3 scoring additions** (July 2026):
- `getDependentsCount(item, allItems)` — counts items that list this item in `depends_on[]`
- `getUnlocks(item, allItems)` — returns `{title, id}[]` of items this one blocks when pending
- Unlocks data is displayed on each scored item as "Unlocks N items: title1, title2..."
- `countDependents` feeds into `foundational_bonus` so items that gate many others rank higher in Today's Focus

**Daily grouping** (`getTodayRecommendations()` returns 4-5 items with labeled slots):
1. **Deep Work** → highest-scored critical/high item (≥200 score or critical priority)
2. **Interview / DSA** → item with `track: "dsa_interviews"` or `interview_value ≥ 8`
3. **Project** → item with track containing "project" or "portfolio"
4. **Light Review** → item with `learning_depth: "awareness"`, lowest priority, or health track
5. **Wildcard** → highest-scored remaining item (filler if earlier slots are empty)

Each slot has a visual label rendered in the Today's Focus card header so the user can see why each item was chosen.

**Dashboard sections** (computed by `computeDashboard(layers)`):
1. **Today View**: Top 3-5 items scored + sorted with variety enforcement (at least 2 tracks). Shows score, next_action, reason text.
2. **This Week**: Top-scoring items grouped by track category (Skills, Projects, Interview Prep, System Design, Portfolio/Application).
3. **Highest ROI Now**: Items that are (critical OR high priority) AND (3M/6M/1Y horizon) AND (high/very_high career_roi OR IV≥7 OR EV≥7).
4. **Blocked Items**: Items with any `depends_on` dependency whose status is not "done". Resolves dependency IDs to human-readable titles via `resolveBlockedByTitles()`.
5. **Overdue & Stale**: Items with `target_date` in the past = overdue. Items with `last_worked_on` > 14 days ago or no `last_worked_on` but `created_at` > 30 days ago = stale. Falls back to "No date data yet" message.

**Key exports from `execution-recommendations.ts`:**
- `buildIdMap(layers)` — creates a Map<item.id, item> for dependency resolution
- `getBlockedBy(item, idMap)` — returns unmet dependency IDs
- `resolveBlockedByTitles(blockedBy, idMap)` — converts IDs to human-readable titles
- `collectItems(layers, trackFilter?)` — scores & enriches all items
- `computeOverdueStale(scored)` — annotates overdue/stale state
- `getTodayRecommendations(scored)` — top 3-5 with variety enforcement
- `getThisWeekView(layers)` — grouped weekly view
- `getHighestROI(scored)` — filtered high-value items
- `getBlockedItems(scored)` — items with unmet dependencies
- `getOverdueItems(scored)` — overdue or stale items
- `computeDashboard(layers)` — one-call entry point: returns `DashboardState`

**Today Widget** on the main page (`page.tsx`): A compact component showing 3 recs with score, priority/horizon badges, and next_action. Links to the full dashboard.

### Phase 3: Interactive Actions & PATCH API (July 2026)

The execution dashboard gained interactive item actions via a dedicated PATCH API endpoint.

**PATCH `/api/roadmap/item?userId=local_user`**

Request body:
```json
{
  "itemId": "l1_dsa_rust_arrays",
  "updates": {
    "status": "active",
    "next_action": "Solve 5 sliding window problems",
    "snoozed_until": "2026-07-10",
    "notes": "Optional note"
  }
}
```

Auto-timestamp behaviour (handled server-side in `route.ts`):
- `status = "active"` → sets `last_worked_on = today` (YYYY-MM-DD)
- `status = "done"` → sets `completed_at = today`, also sets `last_worked_on` if absent
- `status = "blocked"` → sets `blocked_metadata = { blocked_at: today, reason: "..." }`
- `snoozed_until` set → if item was `done` or `blocked`, auto-reverts to `pending`
- `next_action` → plain field update, no timestamp side-effect

**Action buttons on dashboard cards:**
- **Start** (`status = "active"`) → hidden when already active or done
- **Done** (`status = "done"`) → always visible
- **Snooze** → opens a modal with date input, sets `snoozed_until`
- **Block** (`status = "blocked"`) → sets `blocked_metadata`
- **Next** → opens inline text editor, saves new `next_action` via PATCH

**Inline editor for next_action**: Clicking "Next" on any card expands a text input pre-filled with the current value. Save sends PATCH with `next_action` update. Cancel closes without changes. The `editingNextId` React state tracks which card has the editor open.

**Snooze modal**: A centered overlay with a date picker input (`type="date"`). Confirm sends PATCH with `snoozed_until` value. Cancel closes the modal. The `snoozeItemId` state tracks which item's modal is open.

**Persistence cycle**: Button click → PATCH fetch → server saves to `roadmap.json` → response triggers `setRefreshKey(k+1)` → `useEffect` re-fetches `GET /api/roadmap` → dashboard re-renders with updated data. Data survives page refresh and server restart.

**UI files:**
- `src/app/dashboard/page.tsx` — full execution dashboard page with actions, inline editor, snooze modal, unlock display
- `src/app/dashboard/dashboard.module.css` — dashboard styles (action bar, modal, inline editor, unlock display, slot labels)
- TodayWidget is defined inline in `src/app/page.tsx`

### Phase 4: Roadmap Engine Multi-View & Sub-Tree UI (Aug 2026)

The Goal Tree page at `/tree` is the "Roadmap Engine": a unified viewer with **4 switchable view modes**, persisted per browser (localStorage). All views share the same data source and stay in sync (status toggles propagate cross-view).

**UI files (main engineering):**
- `src/app/tree/page.tsx` — Roadmap Engine container: view selector tablist, track filter tablist, search box, Edit Mode toggle, view rendering
- `src/app/tree/` view components — one per mode (DAG graph, ladder spine, list cards, table)
- Sub-tree modal — breadcrumb + progress ring + "mastery" banner, inline sub-task create/edit

**The 4 view modes (tablist "Roadmap View Selector"):**
1. **DAG Graph** — interactive canvas: zoom controls (Zoom In/Out/Reset + % readout), node cards with progress bars, glowing SVG Bezier cables parent→child, "Detail" button per node.
2. **Ladder** — classic 2-column spine with numbered layer headers (1..N) and alternating left/right goal boxes; each node has a "Sub-tree" button.
3. **List** — collapsed layer cards; clickable layer headers to expand.
4. **Table** — dense grid: Layer | Goal Title | Status (PENDING/ACTIVE/DONE) | Sub-Tasks (e.g. `0/4 done`) | Priority | Action (Toggle status / Detail).

**Nested sub-goals / sub-trees**: nodes can carry child sub-goals; the parent's Sub-Tasks column shows `done/total`. Clicking Detail/Sub-tree opens the focused sub-tree modal (breadcrumb trail, progress ring, completion banner). Completing children updates parent counts everywhere.

**Shared features across views:**
- Track filter tablist — "All Roadmaps" plus one tab per track; verification gotcha: updates can be hidden if a track tab is active instead of "All Roadmaps".
- Search box filters the current view.
- "Activate Edit Mode" (pencil) enables rename/add/delete of layers, goals, and sub-goals inline.
- View choice persists to localStorage; edit/data changes persist to `roadmap.json` via existing API.

**Audit-with-coding-agent workflow** (used for the sub-tree engine): hand the coding agent a self-contained audit/enhance prompt (see `references/coding-agent-audit-prompt.md`), let it refactor, then independently verify with build + browser before reporting done. Never take the agent's "complete" claim at face value.

### Data Resolution Pipeline

Uses `roadmap-utils.ts` for dynamic resolution:

1. `collectTracks(layers)` — extracts unique track labels from layer metadata. Falls back to `["Career & Tech", "Health & Fitness"]` when no `track` field present (old heuristic: layers 1-7→career, 8-11→health, 12-17→career).
2. `resolveLayerIcon(layer)` — returns layer.icon or falls back to layer-number-based icon map or default icon.
3. `getPriorityBadge(priority)` — returns CSS class for badge styling based on priority level.
4. `filterLayersByTrack(layers, track)` — filters layers by track metadata string.

### Data Path Resolution

```
.env.local:     JOURNEY_DATA_PATH=/home/zius/.journey/data
```

The web UI (`src/lib/storage.ts`) reads `process.env.JOURNEY_DATA_PATH` (defaults to `data/` in cwd). The MCP server (`scripts/mcp-server.js`) reads from its own config.

### MCP Persistence

The MCP tool `mcp_personamaxing_get_roadmap` reads the file. The local file IS the source of truth — MCP reflects file changes automatically.

### MCP Architecture (Two Systems)

There are **two separate Journey MCP systems**:

1. **Local Node.js MCP server** (`~/Projects/journey/scripts/mcp-server.js`) — reads from `~/.journey/data/roadmap.json`. This is what Hermes loads as `personamaxing` tools. Source of truth for the MCP tools.
2. **Remote Python API server** (`~/Projects/journey/mcp/server.py`) — talks to `https://personamaxing-hub.vercel.app/api/roadmap`. A separate deployment, not loaded by Hermes.

The Hermes `mcp__personamaxing__*` tools talk to the local Node.js server. The local file is the source of truth — edits to the file are immediately reflected in MCP responses.

### MCP Tool Limitations

The Node.js MCP server only supports three tools, with limited operation sets:

| Operation | Supported? |
|-----------|-----------|
| Read roadmap | Yes (`get_roadmap`) |
| Add goal to existing layer | Yes (`add_goal`) |
| Toggle item status (pending/done) | Yes (`update_item_status`) |
| **Delete layer** | **No** |
| **Delete item** | **No** |
| **Rename layer** | **No** |
| **Move items between layers** | **No** |
| **Restructure/consolidate layers** | **No** |

For any operation beyond add/status-toggle, **edit the JSON file directly** at `~/.journey/data/roadmap.json` using `execute_code` with Python's `json` module. Do not try to use the MCP tools for structural changes — they will fail.

### Related Reference

Full schema type definitions with TypeScript interfaces and enums are documented in `references/roadmap-schema-v3.md` in this skill directory. Read that file when you need exact field types, value constraints, or the data flow pipeline.

**Systems Design Curriculum**: The user is studying real-world architectures (Layer 1 of the roadmap). `references/systems-design-curriculum.md` captures the curriculum structure — the 7 core systems, architectural patterns, learning methodology, and project-to-pattern mapping. When the user resumes systems design work (e.g. "continue the WhatsApp design" or "start Uber"), load this reference first to regain context.

## Core Workflow

### 1. Read & Understand
```
mcp_personamaxing_get_roadmap()
```
Also read the raw file for exact context: `read_file("~/.journey/data/roadmap.json", offset=N, limit=N)`

Check which schema version is in use:
- If items have `track` field and no `priority`/`horizon`/`career_value` — badge-stripped minimal format. Core fields: `id`, `title`, `status`, `notes`, `track`. Badge fields are never used.
- If items still have `priority`, `horizon`, `career_value` — older format. Strip badge fields if user requests cleanup.

### 2. Adding/Editing Items (Minimal Format)

The user prefers **no badge fields**. Items follow a minimal format:

```json
{
  "id": "l3_my_item",
  "title": "My Topic",
  "status": "pending",
  "notes": "What to learn and how to apply it — include specific tools/libraries",
  "track": "ai_engineering",
  "depends_on": ["l2_prerequisite"]
}
```

**Acceptable optional fields** (non-badge, genuinely useful):
- `depends_on`: Item IDs that block this one
- `next_action`: Concrete next step, e.g. \"Solve 5 sliding window problems (LC 3, 424, 567, 239, 76)\"
- `created_at`: ISO date of creation
- `last_worked_on`: ISO date of last activity
- `actual_hours`: Number — accumulated time spent
- `target_date`: ISO date — deadline

**Fields to NEVER add** (user will reject):
- `priority`, `horizon`, `career_value`, `career_roi`, `interview_value`, `engineering_value`, `learning_depth`, `prerequisites`, `metadata` block

### 3. Add Items from a Resume/Gap Review (Session 2026-08-12)

**Presentation rule (user-pushed):** the user challenges vague "yes it's done" summaries. Always state explicitly, grouped by kind (new goal / new subgoal / updated item / cert), with file path and what each does. When the user asks "any new high-level goals?" answer by kind, not just "updated".

**Research enrichment passes:** when the user asks to deepen a layer "by doing a research on each" goal, do a real research pass per domain (web search for canonical curriculum/roadmap sources per track), then add concrete researched subgoals/milestones to each layer — don't just reword existing titles.

When the user says "add the missing things / things I got to achieve to Journey" after a resume or job-posting review, the roadmap update is a **gap-sync**, not a random cert dump. Three item kinds come out of a resume review — cover ALL of them:

1. **Skill-gap items** (status `pending`) — technologies the review flagged as missing for target roles. Add to the technical layer that owns them (e.g. `goal_systems_infra` for Java/Spring Boot, SQL/relational DB engineering, enterprise backend stack). Notes state the scope: Java OOP/Collections/Streams/Multithreading + Spring Boot (REST, DI, JPA/Hibernate, DTOs, CRUD); SQL JOINs, indexing, normalization, EXPLAIN ANALYZE.
2. **Execution-target items** (status `active` when already underway) — strategic goals the review produced: e.g. "DSA Mastery: 200+ core LeetCode problems", "GitHub profile curation & repo archive pass", "Targeted job application & founder outreach". These live in the `goal_career_health` layer (tracks `dsa_interviews` / `portfolio_resume` / `applications_networking`).
3. **Verified achievement/cert items** (status `done`) — certifications and shipped OSS work already on the resume, e.g. HackerRank role certs, Brave Core C++ PRs, DeepLearning.AI. Cite identifiers in `notes` (cert IDs, PR numbers) so the item is verifiable.

**Every gap item carries `next_action` (concrete, executable today) and `target_date`** so the execution dashboard picks it up immediately.

**Ordering matters**: the user's core ask is the *things to achieve* (gaps → actions). Adding only `done` certification items first reads as ignoring the review. Deliver skill-gap + execution-target items as the primary content, with certs as the supporting "already achieved" block.

**In the summary, label each addition by kind** (skill / certification / execution task) and group under its layer. The user pushed back ("wtf what we add into journey — skills or goals or tasks?") precisely because the first summary lacked this: they need to see WHY each item is in the roadmap and what kind it is. Lead with the taxonomy reminder (goals → layers → items) and group by layer.

### 4. Audit for Signals
When the user asks to add/remove/update, evaluate items against **target roles**:

**Pruning checklist (remove if true):**
- Item doesn't serve ANY target role (e.g. learning R when targets are AI/Web3 Engineer)
- Item is a generic "become an X developer" roadmap for a role the user isn't pursuing
- Item covers compiler/browser-engine/low-level internals irrelevant to target roles
- Item lists ecosystem-specific frameworks the user won't use (e.g. China-only frameworks, dead frameworks)

**Addition checklist (add if true):**
- Career mindset items countering common myths (self-selection out, college-tier bias, DSA volume obsession)
- Items that directly fill a gap between current skills and target role requirements
- Items that explicitly state what the roadmap already does implicitly (anti-myth framing)

### 4. Layer Consolidation (Merge + Renumber)

When merging multiple layers into one (e.g., consolidating 4 health layers into 1), the MCP tools cannot do this. Edit the JSON directly via `execute_code` with Python:

```python
import json, re

path = '/home/zius/.journey/data/roadmap.json'
with open(path) as f:
    data = json.load(f)

# 1. Get the layers to merge (by index)
layers_to_merge = data['layers'][7:11]  # layers 8,9,10,11

# 2. Collect all items from those layers
merged_items = []
for l in layers_to_merge:
    merged_items.extend(l['items'])

# 3. Create the new consolidated layer
consolidated = {
    "id": "layer8",
    "title": "Layer 8 — Health & Fitness (Consolidated)",
    "description": "Single layer for health, fitness, and lifestyle.",
    "items": merged_items,
    "track": "health_fitness"
}

# 4. Build new layers array: unchanged layers + consolidated + renumbered remaining
career_layers = data['layers'][:7]       # layers 1-7 (untouched)
remaining_layers = data['layers'][11:]   # layers 12-17 (need renumbering)

new_layers = career_layers + [consolidated]

# 5. Renumber remaining layers (their IDs stay the same but titles change)
layer_map = {
    'layer12': 'layer9',  'layer13': 'layer10',
    'layer14': 'layer11', 'layer15': 'layer12',
    'layer16': 'layer13', 'layer17': 'layer14',
}
for old_id, new_id in layer_map.items():
    src = next(l for l in remaining_layers if l['id'] == old_id)
    src['id'] = new_id
    src['title'] = re.sub(r'^Layer \d+', f'Layer {new_id.replace("layer", "")}', src['title'])
    new_layers.append(src)

data['layers'] = new_layers

# 6. Save
with open(path, 'w') as f:
    json.dump(data, f, indent=2)

print(f"Consolidated to {len(new_layers)} layers")
```

**Rules for renumbering:**
- Layer `id` fields (e.g. `layer8`) are used by MCP tools and must stay unique
- Layer `title` has display numbering — update these to match the new order
- Items inside layers keep their original IDs (they don't depend on layer IDs)
- `depends_on` item references don't change — they reference item IDs, not layer IDs
- Verify the result with `mcp__personamaxing__get_roadmap()` which reads the same file

### 5. Execute Edits

Use `patch` on `~/.journey/data/roadmap.json` to:
- **Remove** items: replace the full item object (including trailing comma) with empty string. Ensure JSON validity by checking the comma from the previous item connects cleanly to the next.
- **Add** items: insert into the appropriate layer's `items` array.
- **Trim** notes: reduce over-general lists to what directly serves target roles.

### 6. Bulk Migration / Strip Badges

When cleaning up a roadmap that still has badge fields (`priority`, `horizon`, `career_value`, `interview_value`, `engineering_value`, `learning_depth`, `career_roi`, `prerequisites`, `metadata`), **do NOT patch items one by one**. Use `execute_code` with the Python `json` module to batch-strip them:

```python
import json, os
path = os.path.expanduser('~/.journey/data/roadmap.json')
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

badge_fields = ['priority', 'horizon', 'career_value', 'career_roi',
                'interview_value', 'engineering_value', 'learning_depth',
                'prerequisites', 'metadata']

changes = 0
for layer in data.get('layers', []):
    for item in layer.get('items', []):
        for field in badge_fields:
            if field in item:
                del item[field]
                changes += 1

for m in data.get('milestones', []):
    for field in badge_fields:
        if field in m:
            del m[field]
            changes += 1

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Stripped {changes} badge fields across {len(data.get('layers', []))} layers")
```

Always verify with `json.load()` after.

**Completion discipline**: After a bulk migration, present a clean summary (file size, layer count, item count), not raw file content. The user wants status, not dump output.

### 7. Verify

**Validate JSON** — confirm the file is parseable:
```bash
python3 -c "import json; json.load(open('/home/zius/.journey/data/roadmap.json')); print('Valid')"
```

**Check web UI** — rebuild and preview:
```bash
cd ~/Projects/journey && npm run build 2>&1 | tail -5
```
Then open `http://localhost:6161/` and verify layers/tabs/icons render correctly. For `/tree` (Roadmap Engine), verify ALL FOUR views, not just the default:
1. `browser_navigate http://localhost:6161/tree` — default view loads (DAG Graph).
2. Click each view tab (Ladder, List, Table) via `browser_click` by ref; after each, `browser_snapshot` to confirm that mode rendered (e.g. Table has Layer/Goal/Status/Sub-Tasks columns; Ladder has grouped layer headers).
3. Check the track filter is on "All Roadmaps" — a specific track tab hides goals from other layers and looks like a regression.
4. Click a node's Sub-tree/Detail button to confirm the sub-tree modal opens with breadcrumb + progress ring.
5. `browser_console` for JS errors before declaring done.

**Check MCP** — the tool reads the same file automatically:
```
mcp_personamaxing_get_roadmap()
```
Confirm new items appear and layer structure is correct.

### 8. Data Enrichment for Execution Dashboard (Phase 2)

When adding execution fields (`next_action`, `depends_on`, `target_date`, `last_worked_on`) as a batch, write a Python script in `scripts/enrich-*.py` and run it. Never patch 50+ items individually.

**Required fields to add:**
- `next_action: string` — concrete next step, e.g. "Solve 5 sliding window problems (LC 3, 424, 567, 239, 76)"
- `depends_on: string[]` — item IDs that block this item. Use realistic/meaningful chains.
- `target_date: ISO date` — deadline for completion, typically 30-90 days out for 3M/6M items.
- `last_worked_on: ISO date` — date of last activity. Set to "2026-06-01" for stale items (old date), current date for active items.
- `created_at: ISO date` — initial creation date, typically months ago for established items.
- `actual_hours: number` — accumulated time spent (optional, 1-5 range typical).

**Recommended dependency chain depth:** 2-3 levels max. Each layer should depend on the layer before it in the roadmap, plus intra-layer prerequisites.

**Example enrichment pattern:**
```python
import json, os

path = os.path.expanduser('~/.journey/data/roadmap.json')
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

def get_item_by_id(items, item_id):
    for item in items:
        if item['id'] == item_id:
            return item
    return None

all_items = []
for layer in data['layers']:
    for item in layer['items']:
        all_items.append(item)

# Add depends_on chains
dep_chains = {
    'l_js_ts_core': ['l1_fullstack_js'],        # depends on layer before
    'l_react_next': ['l_js_ts_core'],            # depends on foundation
    'l_rust_phase0': ['l1_rust'],
}

for item in all_items:
    item_id = item['id']
    if item_id in dep_chains:
        item['depends_on'] = dep_chains[item_id]

# Add next_action for pending items
for item in all_items:
    if item['status'] in ('pending', 'active'):
        item['next_action'] = get_next_action_for(item['title'])  # use task-specific text

# Add dates
from datetime import datetime, timedelta
now = datetime.now()
for item in all_items:
    item['created_at'] = '2026-01-15'
    if item['status'] == 'pending':
        item['last_worked_on'] = (now - timedelta(days=random.randint(7, 60))).strftime('%Y-%m-%d')
    item['target_date'] = (now + timedelta(days=random.randint(1, 90))).strftime('%Y-%m-%d')

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
```

**Verification after enrichment:**
```bash
cd ~/Projects/journey && npx next build 2>&1 | tail -5
```
Then navigate to `/dashboard` and verify:
- Today View shows 3-5 scored recommendations with next_action
- This Week sections are populated
- Highest ROI Now has items passing the filter
- Blocked Items shows items with unmet depends_on (may need at least one dependency to be pending)
- Overdue/Stale shows correct badges

### 9. Building Changes

After any edit to the codebase or data, rebuild and verify:
```bash
cd ~/Projects/journey && npx next build 2>&1 | tail -10
```

If the dev server is running, kill and restart:
```bash
kill $(lsof -t -i:6161) 2>/dev/null; sleep 1
cd ~/Projects/journey && npx next dev -p 6161
```

Use `browser_navigate` + `browser_vision` to visually verify the main page (/) and dashboard page (/dashboard).

## Pitfalls

- **Badge fields are banned**: The user explicitly removed `priority`, `horizon`, `career_value`, `career_roi`, `interview_value`, `engineering_value`, `learning_depth`, `prerequisites`, and the `metadata` block from all items. Never add these to new items — they will be rejected. Only use the minimal item format: `id`, `title`, `status`, `notes`, `track`, plus optional execution fields (`depends_on`, `next_action`, `created_at`, `last_worked_on`, `actual_hours`, `target_date`).
- **Discovery is mandatory**: Before building or assuming a project location, run `which journey` and `npm list -g @ziuus/journey` to find the actual installed package. The personal roadmap lives at `~/.journey/data/roadmap.json` (not the repo template at `~/Projects/journey/data/roadmap.json`). The global npm package at `~/.npm-global/lib/node_modules/@ziuus/journey` is the source of truth for the web UI and MCP server. The repo's `agent-skills/journey/SKILL.md` is a minimal stub (excluded from npm package) — not a substitute for this skill.
- **Repo template vs user data**: `~/Projects/journey/data/roadmap.json` is a 4-layer starter template. `~/.journey/data/roadmap.json` is the personal 16+ layer roadmap. **Never edit the repo template.**
- **JSON comma discipline**: When removing an item from an array, the preceding item's trailing comma becomes the new separator. If you remove the wrong comma, JSON breaks. Replace the *entire item including its trailing comma* with empty string.
- **Layer renumbering**: Layer IDs are stable strings like `layer1`, `layer17`. When removing layers from the end, don't renumber - just drop them. When consolidating layers from the **middle** of the sequence, renumber subsequent layer IDs and update their title display numbers for consistency (see step 4 for the pattern).
- **Mindset items belong in Layer 17** (Interview Preparation & Career Strategy), not scattered across technical layers.
- **Don't renumber layers** when removing one — just drop the layer object from the array. The `id` field stays unique.
- **Schema version gap**: If the file uses v1/v2 structure (numeric `priority`, `learningDepth`), you can add v3 fields inline — the parser ignores unknown fields. No migration needed. But if you're adding items, prefer the new metadata format for data-driven features.
- **Dual-goal priority conflict**: An item can serve both goals (e.g. System Design appears in both short-term interview prep and long-term architecture mastery). Tag it with the shorter horizon and let the UI handle filtering. Don't duplicate items across layers.
- **JOURNEY_DATA_PATH precedence**: The `.env.local` file sets the path for the web dev server. The MCP server has its own hardcoded path. If they disagree, web and MCP will show different data. Keep them consistent — both should read from `~/.journey/data/roadmap.json`.
- **Bulk ops prefer execute_code**: For schema migrations affecting 50+ items, use Python `execute_code` (see Bulk Migration workflow) instead of 50+ `patch` calls. `patch` is for individual item edits; `execute_code` is for bulk transforms.
- **Field name drift**: The actual TypeScript types use `prerequisites` (not `dependency`), `interview_value` (not `interview_relevance`), and `career_value` as string enum (not number). Always reference `src/types/roadmap.ts` when adding new metadata fields — the skill's copy may lag.
- **Dependency resolution for UI**: When showing blocked items, dependency IDs must be resolved to human-readable titles. Use `resolveBlockedByTitles(blockedBy, idMap)` from `execution-recommendations.ts`. Displaying raw IDs like `/l_sd_distributed` is user-hostile.
- **BuildIdMap must be exported**: `buildIdMap()` is used by the dashboard page to build a lookup from the raw layers array. It must be exported from `execution-recommendations.ts` — if it's not, the dashboard can't resolve dependency titles.
- **Field name gap for enrichment**: The enrichment script writes `depends_on` but the TypeScript type uses `depends_on` (while legacy uses `prerequisites`). Both are read at runtime — always set both to be safe: `item['depends_on'] = item['prerequisites'] = deps`.
- **Date format matters**: `target_date`, `last_worked_on`, and `created_at` use ISO date strings (`YYYY-MM-DD`), not timestamps. The overdue/stale logic in `computeOverdueStale()` parses these with `new Date(value)` so timezone-agnostic date strings are safest.
- **Variety enforcement in Today View**: The `getTodayRecommendations()` function enforces track variety by boosting under-represented tracks. If recommendations seem weirdly diverse, that's the cause — it's intentional to avoid 5 DSA items in the top 5.
- **Scoring weights are not symmetric**: Priority and horizon contribute 100 each at max, career_roi contributes 100 at max, interview_value contributes 100 (10×10), engineering_value contributes 50 (5×10). An item maxes out at ~370 before blocked penalty. Items scoring 400+ indicate priority+horizon+roi all at maximum.
- **Active status**: Phase 2 added `"active"` as a valid status. Items with `status: "active"` get a 30-point bonus (vs 20 for "pending") in scoring, and get an accent border in the Today Widget UI.
- **Dependency chains need real prerequisites to test**: If all items have empty `depends_on`, the Blocked Items section will be empty. Add at least 10-20 meaningful dependency chains during enrichment so the feature is demonstrable.
- **Phase 3 PATCH API: userId is required**: The endpoint returns 400 if `userId` is missing or empty. Always pass `userId=local_user` from the frontend.
- **Phase 3 status value "blocked"**: The `RawRoadmapItem.status` type now includes `"blocked"` (not just `"pending" | "active" | "done"`). The type definition in `src/types/roadmap.ts` must be updated whenever a new status value is added.
- **Phase 3 type additions**: `completed_at`, `snoozed_until`, and `blocked_metadata` fields were added to `RawRoadmapItem`. When adding new fields, always update both the type in `src/types/roadmap.ts` AND the API route handler's update logic. The PATCH handler uses Object.assign on the found item — the field must exist at the type level for TypeScript to allow the assign.
- **Phase 3 inline editor stale state**: The `nextActionBuffer` React state holds the current value of the inline editor textbox. If `handleSaveNextAction` fires before the onChange handler updates `nextActionBuffer`, the old value is saved. Verify PATCH calls via direct curl test when inline editor saves appear to not persist.
- **Phase 3 snooze modal date format**: The `type="date"` input returns `YYYY-MM-DD` which is what the PATCH endpoint expects. The server stores it as-is. No remaining-snooze-time display exists (Phase 4 feature).
- **Phase 3 daily grouping fallthrough**: If a slot (e.g. Interview/DSA) has no qualifying items, it's skipped and the next slot fills. The Wildcard slot always gets the highest-scored remaining item regardless of track.
- **Phase 3 unlock display overflow**: The unlock text can overflow narrow cards. CSS uses `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` to prevent layout breakage.
- **Phase 3 PATCH + re-fetch race**: The `setRefreshKey` increment triggers a `GET` re-fetch via `useEffect`. Data is atomic per-request in the PATCH handler (read-modify-write), so the subsequent GET always sees the latest state. No debouncing needed.
- **Phase 3 browser verification pattern**: After build, verify in this order: (1) `browser_navigate` to page, (2) wait ~4s for hydration, (3) `browser_snapshot` for structure, (4) `browser_vision` for layout, (5) `browser_console` for JS errors. For persistence, use direct `curl` to the API endpoint to bypass React state timing.

## Formatting Conventions

- Notes should be actionable, not aspirational. Include specific tools/libraries/techniques.
- Target ~3-5 items per layer for focus; layers with 10+ items signal bloat.
- Item `status` is always `"pending"` for new items (set done via `mcp_personamaxing_update_item_status` or direct file edit).
- Notes can include sub-numbering: `(1) ... (2) ... (3) ...` for multi-point entries.
- **No badge fields**: Never add `priority`, `horizon`, `career_value`, `career_roi`, `interview_value`, `engineering_value`, `learning_depth`, `prerequisites`, or `metadata` block to items. These have been stripped from the live data — user finds them unnecessary.
- **Completion presentation**: After any roadmap edit (add/remove/bulk migration), present a clean summary — file size, layer/item/milestone counts, and a verdict on validity — NOT raw file content. The user wants status, not dump output.
