# Journey

This skill teaches you how to dynamically manage the user's roadmap. Use this when the user asks to add a new goal, mark something complete, or check progress.

## MCP Tools Integration
The user has an MCP Server (`journey-mcp`) that provides structured tool access to the live roadmap. If tools are available, use them. Otherwise, edit `~/.journey/data/roadmap.json` directly.

The MCP server reads/writes `~/.journey/data/roadmap.json` — no user_id needed. Do NOT ask for a user_id.

### Available Tools
1. `get_roadmap()`: Full JSON of the current roadmap. Shows layers, items, milestones.
2. `add_goal(layerId, title, goal?)`: Appends a new item to a layer.
3. `update_item_status(type, itemId, status, layerId)`: Marks an item or milestone done/pending.

## Data Protection
- **NEVER** write personal roadmap data to the repo's `data/roadmap.json`. That's a template file.
- User data lives at `~/.journey/data/roadmap.json` only.
- If you accidentally modify the repo template, restore it from git.

## Agent Workflows
- **"Add X to my roadmap"**: Call `get_roadmap` to see available layers, then `add_goal`.
- **"I finished learning X"**: Find the `itemId` via `get_roadmap`, then `update_item_status`.
- **"What should I learn next?"**: Get roadmap, find first incomplete layer, suggest pending items.
