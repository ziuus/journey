# Journey Project Context for Gemini AI

You are working on the **Journey** project — a universal goal-tracking engine with a Next.js web portal and MCP server.

## Critical: Data Separation
- **Repo template file**: `data/roadmap.json` (4-layer starter template). Never overwrite with personal data.
- **User's personal data**: `~/.journey/data/roadmap.json`. This is outside the repo. Read/write here for actual user goals.
- The MCP server already points to `~/.journey/data/roadmap.json`. Do not change this.

## README Rule
If you edit the README, keep it accurate and professional:
1. Journey is a universal goal engine — not a personal tracker for one person.
2. No hype language, no marketing fluff. Clear technical prose.
3. Don't invent features — verify they exist in source code.
4. Badges: npm version + license only. No badge farms.

## Architecture
- Web portal: Next.js 16 app on port 6161
- Data: JSON file at `~/.journey/data/roadmap.json`
- MCP server: `scripts/mcp-server.js` (3 tools: get_roadmap, update_item_status, add_goal)
- Schema: `{ target_roles, layers: [{ id, title, items: [{ id, title, status }] }], milestones }`

## How to Manipulate the Roadmap
When the user asks you to "update the roadmap," "add a task," or "mark something done":
1. If using MCP: call the appropriate tool.
2. If editing the file directly: read `~/.journey/data/roadmap.json`, make changes, write back.
3. Never modify the repo's `data/roadmap.json` template file.

## Engineering Standards
- Maintain clean, professional language in descriptions.
- Use precise technical terms for roadmap items.
- Don't add speculative or unverifiable features.
