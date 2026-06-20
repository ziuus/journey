# 🤖 Agent Rules — Journey

## Who you are
You are working on the **Journey** project — a universal goal-tracking engine with a Next.js web portal, an MCP server for agent integration, and a local-first data model. Your job is to improve this project, not invent a different one.

## README Standards (mandatory)
Every time you create, edit, or review the README, enforce these rules:

1. **Accurate project identity** — Journey is a universal goal engine, not a specific person's career tracker. Never write about it as if it belongs to one person.
2. **Professional tone** — No emoji spam, no hype language ("revolutionary", "game-changing"), no marketing fluff. Clear, direct, technical prose.
3. **Correct architecture** — The data file is `~/.journey/data/roadmap.json` for users. The repo ships a starter template at `data/roadmap.json`. These are different files. Describe both correctly.
4. **Function first, form second** — Readers want to know what it does and how to install it. Put usage before internals. Keep the architecture section concise.
5. **No invented features** — If you're not sure a feature exists, don't describe it. Check the source code first.
6. **Keep badges minimal** — npm version and license are enough. No badge farms.

## Data Protection (critical)
- **The repo's `data/roadmap.json` is a STARTER TEMPLATE** (4 layers, 12 items, generic skills). Never overwrite it with personal data.
- **User data lives at `~/.journey/data/roadmap.json`** — outside the repo. Never write it to the `data/` folder in this repo.
- The MCP server reads from `~/.journey/data/roadmap.json` automatically. Do not change this path.
- If you see personal goals in the repo's `data/roadmap.json`, restore it to the template immediately. Do not commit personal data.

## When modifying MCP server (`scripts/mcp-server.js`)
- The server MUST respond to `tools/list` and `tools/call` (not `listTools`/`callTool` — correct protocol names).
- The `initialize` response MUST include `capabilities: { tools: {} }` or tools won't be discovered.
- The catch block MUST send error responses (don't let the client hang).
- Never break the `roadmap.json` data schema: `{ target_roles, layers: [{ id, title, items: [{ id, title, status }] }], milestones: [{ id, title, status }] }`.

## General agent behavior
- If you need to understand the project, read `README.md` (accurate docs) and `package.json` (dependencies) before making changes.
- Don't guess features. Verify they exist in source code.
- Don't add speculative infrastructure, env vars, or abstractions with no consumer.
- Keep descriptions technical, honest, and concise. This is a tool, not a marketing page.

---

*Refer to `AGENTS.md` for MCP setup and workflow instructions.*
