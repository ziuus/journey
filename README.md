# Journey — AI-Native Roadmap Engine

[![npm version](https://img.shields.io/npm/v/%40ziuus%2Fjourney)](https://www.npmjs.com/package/@ziuus/journey)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**Your AI agent manages your roadmap. You focus on the work.**

Journey is a full-stack goal portal your AI assistant reads and updates in real time — while you chat.

```
         ┌──────────────────────┐
         │  Journey Portal      │
         │  (Next.js, 6161)     │
         └──────┬───────────────┘
                │ reads
         ┌──────▼───────────────┐
         │  data/roadmap.json   │ ◄── your AI agent reads & edits this
         └──────────────────────┘
```

No cloud, no API keys, no setup ceremonies. Your data is a local JSON file. Your agent edits it directly.

---

## Quick Start

```bash
# install & launch
npm install -g @ziuus/journey
journey
```

Open `http://localhost:6161`. Your roadmap is at `~/.journey/data/roadmap.json`.

That's it.

---

## Agent Setup (one step)

Tell your agent to read `~/.journey/data/roadmap.json`.

| Agent              | How to point it                                                      |
|--------------------|----------------------------------------------------------------------|
| **Gemini CLI**     | `gemini` → tell it "your roadmap context is at `GEMINI.md`"          |
| **Claude Code**    | drop `CLAUDE.md` in the project                                      |
| **Codex**          | tell it "your roadmap is at ~/.journey/data/roadmap.json"            |
| **ChatGPT**        | paste the file or link it to a custom GPT                            |
| **Hermes / Cursor**| same — it's a file. Point your agent at it.                          |

Any agent that reads local files can manage your roadmap. No MCP setup. No protocol negotiation. Just a file.

### Optional: MCP Server (for agents that support it)

Some agents (Claude Desktop, Hermes) can connect via MCP for structured tool access. Journey ships a built-in MCP server:

```json
{
  "mcpServers": {
    "journey": {
      "command": "journey-mcp",
      "args": []
    }
  }
}
```

This gives your agent three tools: `get_roadmap`, `add_goal`, `update_item_status`. It's optional — the JSON file approach works with any agent.

---

## CLI

| Command        | What it does                           |
|----------------|----------------------------------------|
| `journey`      | Start portal (background, port 6161)   |
| `journey dev`  | Dev server (foreground, port 3000)     |
| `journey stop` | Stop background portal                 |
| `journey status` | Check if portal is running          |
| `journey logs` | Show recent logs                       |
| `journey build`| Build the Next.js app                  |

---

## Architecture

```
journey/
├── src/                    # Next.js app
├── data/roadmap.json       # Your roadmap — your agent edits this
├── scripts/
│   ├── mcp-server.js       # MCP server (optional)
│   └── journey-cli.js      # CLI
├── agent-skills/journey/   # Agent behavior docs
├── GEMINI.md               # Context doc for Gemini CLI
└── AGENTS.md               # Quick agent setup
```

### Data Model

```typescript
roadmap.json {
  target_roles: string[],
  layers: [{ id, title, items: [{ id, title, status: "pending"|"done" }] }],
  milestones: [{ id, title, status }]
}
```

---

## Related

- [`GEMINI.md`](./GEMINI.md) — context file for Gemini CLI
- [`AGENTS.md`](./AGENTS.md) — quick agent setup
- [`agent-skills/journey/SKILL.md`](./agent-skills/journey/SKILL.md) — optional agent behaviour guide

MIT. Built for the 2030 engineering frontier.