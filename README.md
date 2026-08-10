<div align="center">

# Journey

### Universal Goal Engine & Real-Time AI Roadmap Portal

[![npm version](https://img.shields.io/npm/v/%40ziuus%2Fjourney?style=for-the-badge&color=007aff)](https://www.npmjs.com/package/@ziuus/journey)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.2.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![MCP Ready](https://img.shields.io/badge/MCP-Supported-purple?style=for-the-badge)](https://modelcontextprotocol.io)

*A local-first goal-tracking engine, interactive web portal, and Model Context Protocol (MCP) server that seamlessly syncs your roadmaps, skill trees, and execution tasks with AI assistants.*

</div>

---

## Key Capabilities

- **Local-First & Data Autonomous**: Your roadmap lives in a single, clean JSON file at `~/.journey/data/roadmap.json`. No proprietary cloud locking or API requirements.
- **Bi-Directional AI Sync**: AI agents (Gemini, Claude, Cursor, Codex, ChatGPT) can read, add goals, and update roadmap tasks in real time while you chat.
- **Model Context Protocol (MCP)**: Native `journey-mcp` server offering `get_roadmap`, `add_goal`, and `update_item_status` tools.
- **Multiple Domain Roadmaps**: Categorize and view goals across tracks (e.g. *Building AI & Agentic Systems*, *Building AI & LLMs*, *Systems & Infrastructure*, *Web3 Full-Stack*).
- **Automated Execution Engine**: Evaluates item priority, dependencies, and career ROI to recommend *Today's Focus* and identify blocked tasks.
- **Interactive Goal Tree**: Visual graph network allowing inline tree node editing, task creation, status toggles, and deletion.
- **Tailored Aesthetics**: Switch between Light/Dark/System themes, pick dynamic accent colors (*Neon Green, Royal Blue, Electric Purple, Flame Orange, Crimson Red, Cyber Cyan*), and adjust interface density (*Comfortable* vs *Compact*).

---

## Architecture Overview

```
   ┌─────────────────────────────────────────────────────────┐
   │                  Journey Web Portal                     │
   │               (http://localhost:6161)                   │
   │   - Home Overview     - Execution Dashboard            │
   │   - Goal Tree Graph   - System Preferences              │
   └────────────────────────────┬────────────────────────────┘
                                │ Real-Time File Sync
   ┌────────────────────────────▼────────────────────────────┐
   │             ~/.journey/data/roadmap.json                │
   │         (User's Local Goal Data Storage)                │
   └────────────────────────────▲────────────────────────────┘
                                │ Read & Update Tools
   ┌────────────────────────────┴────────────────────────────┐
   │              AI Assistant / MCP Integration             │
   │        (Gemini CLI, Claude Code, Cursor, Codex)        │
   └─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Global Installation

Install Journey globally via npm:

```bash
npm install -g @ziuus/journey
```

### 2. Launch the Portal

Start the portal background process:

```bash
journey
```

Open `http://localhost:6161` in your browser. Journey automatically initializes your local roadmap file at `~/.journey/data/roadmap.json` with a complete starter template.

---

## Portal Views

| View | Path | Description |
|---|---|---|
| **Home** | `/` | High-level roadmap overview, progress metrics, category filter pills, and expandable layer accordions. |
| **Dashboard** | `/dashboard` | Intelligent execution recommendations listing *Today's Focus*, *High ROI Items*, and *Blocked Task Alerts*. |
| **Goal Tree** | `/tree` | Full-screen interactive node graph visualization. Activate edit mode via the pencil button to rename, add, or delete nodes. |
| **Settings** | `/settings` | Customize visual mode (Light/Dark/System), accent theme highlights, interface density (*Comfortable* / *Compact*), and landing view preferences. |

---

## AI Agent & MCP Integration

Journey supports both **direct file reading** and **Model Context Protocol (MCP)** tool calling.

### Option 1: Direct File Reference (Universal)

Point your AI assistant directly to `~/.journey/data/roadmap.json`.

- **Gemini CLI**: Run `gemini` and reference [`GEMINI.md`](./GEMINI.md) context file or prompt: `"Your roadmap context is at ~/.journey/data/roadmap.json"`.
- **Claude Code**: Include [`AGENTS.md`](./AGENTS.md) in your project workspace.
- **Cursor / Windsurf**: Add `~/.journey/data/roadmap.json` to project rules or `.cursorrules`.
- **ChatGPT**: Attach or paste your `~/.journey/data/roadmap.json` file.

### Option 2: Model Context Protocol (MCP) Server

Journey includes a native MCP server (`journey-mcp`) communicating via standard JSON-RPC 2.0 over stdin/stdout.

Add `journey-mcp` to your client's MCP configuration (`mcpServers`):

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

#### Supported MCP Tools:

1. `get_roadmap` — Reads and returns the complete JSON data structure from `~/.journey/data/roadmap.json`.
2. `add_goal` — Appends a new goal item to a specified layer node.
3. `update_item_status` — Toggles or updates an item's status (`pending` or `done`).

---

## CLI Reference

```bash
# Start background web portal on port 6161
journey

# Start dev server in foreground (Port 3000)
journey dev

# Check background portal process status
journey status

# Stop running background portal
journey stop

# Display recent portal logs
journey logs

# Run stdin/stdout MCP server for agents
journey-mcp
```

---

## Repository Structure & Data Protection

```
journey/
├── src/                    # Next.js web portal source code
│   ├── app/                # Pages (/ , /dashboard, /tree, /settings) & API routes
│   ├── components/         # Reusable UI components & navigation header
│   ├── context/            # Global configuration & theme provider
│   └── lib/                # Roadmap parsing, data normalization & recommendation engine
├── data/
│   └── roadmap.json        # STARTER TEMPLATE file (used only for fresh installs)
├── scripts/
│   ├── journey-cli.js      # CLI process manager
│   ├── mcp-server.js       # Model Context Protocol server
│   └── start-roadmap.js    # Production launcher
├── GEMINI.md               # Context documentation for Gemini CLI
├── AGENTS.md               # Operational standards & agent behavior rules
└── README.md               # Project documentation
```

> [!IMPORTANT]
> **Data Separation Rules**:
> - **User Personal Goals**: Lives strictly at `~/.journey/data/roadmap.json` (outside the git repository).
> - **Repo Template File**: `data/roadmap.json` inside this repository is a generic starter template. It is never overwritten with personal goal data.

---

## License

MIT © [ziuus](https://github.com/ziuus)