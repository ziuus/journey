# Journey

[![npm version](https://img.shields.io/npm/v/%40ziuus%2Fjourney)](https://www.npmjs.com/package/@ziuus/journey)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**Journey** is a universal goal-tracking engine, local web portal, and Model Context Protocol (MCP) server. It manages skill trees, mastery roadmaps, and execution tasks using a simple local JSON file (`~/.journey/data/roadmap.json`) that both you and your AI assistants can read and update in real time.

```
+-----------------------------------------------------------+
|                   Journey Web Portal                      |
|                (http://localhost:6161)                    |
|   - Home Overview      - Execution Dashboard              |
|   - Goal Tree Graph    - System Preferences               |
+----------------─────────────+-----------------------------+
                              | reads & writes
+----------------─────────────v-----------------------------+
|             ~/.journey/data/roadmap.json                  |
|         (User's Local Goal Data File)                     |
+----------------─────────────^-----------------------------+
                              | MCP / File Access
+----------------─────────────+-----------------------------+
|              AI Assistants & MCP Clients                  |
|        (Gemini CLI, Claude Code, Cursor, Codex)           |
+-----------------------------------------------------------+
```

---

## Key Features

- **Local-First & Private**: Your data stays in a single local JSON file at `~/.journey/data/roadmap.json`. No cloud lock-in, API keys, or external database setup required.
- **AI Agent Integration**: Compatible with any AI assistant that can read local files or connect via Model Context Protocol (MCP).
- **Model Context Protocol (MCP)**: Built-in `journey-mcp` server exposing structured tools (`get_roadmap`, `add_goal`, `update_item_status`).
- **Multi-Track Roadmaps**: Organize goals across distinct tracks such as *AI Engineering*, *Building AI & Agentic Systems*, *Building AI & LLMs*, *Systems & Infrastructure*, and *Web3 Full-Stack*.
- **Automated Execution Dashboard**: Algorithms evaluate task urgency, career ROI, and dependencies to recommend *Today's Focus* and identify blocked goals.
- **Interactive Goal Tree**: Visual node graph interface with edit controls to rename, add, delete, or mark goals complete.
- **Personalized Appearance**: Support for Light/Dark/System visual modes, dynamic accent color highlights (*Neon Green, Royal Blue, Electric Purple, Flame Orange, Crimson Red, Cyber Cyan*), and interface density scaling (*Comfortable* vs *Compact*).

---

## Quick Start

### 1. Global Installation

Install Journey globally via npm:

```bash
npm install -g @ziuus/journey
```

> **Updating Existing Installations**: If you already have Journey installed, run `npm install -g @ziuus/journey@latest` (or `npm install -g .` inside the repository) to upgrade to the latest version.

### 2. Start the Portal

Launch the background portal process:

```bash
journey
```

Open `http://localhost:6161` in your browser. Journey automatically initializes `~/.journey/data/roadmap.json` with a starter template upon first run.

---

## Application Views

| View | Route | Key Functionality |
|---|---|---|
| **Home** | `/` | Track-by-track roadmap overview, overall progress indicator, search bar, and expandable layer accordions. |
| **Dashboard** | `/dashboard` | Algorithmic task recommendations highlighting *Today's Focus*, *High ROI Items*, and *Blocked Task Alerts*. |
| **Goal Tree** | `/tree` | Full-screen interactive graph visualization. Toggle edit mode via the pencil icon to rename, add, or delete nodes. |
| **Settings** | `/settings` | Configure theme mode (Light/Dark/System), accent highlights, interface density (*Comfortable* / *Compact*), and landing view preferences. |

---

## AI Agent & MCP Setup

Journey allows AI assistants to read and update your goals seamlessly.

### Method 1: Direct File Reference (Universal)

Point your AI agent to read `~/.journey/data/roadmap.json`.

| Agent | Configuration / Usage |
|---|---|
| **Gemini CLI** | Reference [`GEMINI.md`](./GEMINI.md) context file or instruct: `"Your roadmap context is at ~/.journey/data/roadmap.json"`. |
| **Claude Code** | Include [`AGENTS.md`](./AGENTS.md) in your workspace root. |
| **Cursor / Windsurf** | Add `~/.journey/data/roadmap.json` to your project context or `.cursorrules`. |
| **ChatGPT** | Upload or reference `~/.journey/data/roadmap.json`. |

### Method 2: MCP Server Integration

Journey includes a built-in MCP server (`journey-mcp`) communicating over stdin/stdout via JSON-RPC 2.0.

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

#### MCP Tools Provided:

- `get_roadmap`: Returns the complete roadmap JSON structure from `~/.journey/data/roadmap.json`.
- `add_goal`: Inserts a new goal item into a specified layer.
- `update_item_status`: Sets the status of an item (`pending` or `done`).

---

## CLI Reference

| Command | Description |
|---|---|
| `journey` | Start background web portal (Port 6161) |
| `journey dev` | Run development portal in foreground (Port 3000) |
| `journey status` | Check status of the background portal process |
| `journey stop` | Stop the background web portal |
| `journey logs` | Stream recent portal log output |
| `journey-mcp` | Run stdin/stdout MCP server for AI agents |

---

## Data Architecture & Separation

```
journey/
├── src/                    # Next.js web application
│   ├── app/                # Application routes (/ , /dashboard, /tree, /settings)
│   ├── components/         # Floating navigation header & shared components
│   ├── context/            # Global configuration & theme state
│   └── lib/                # Roadmap parser & recommendation scoring engine
├── data/
│   └── roadmap.json        # Repository STARTER TEMPLATE file
├── scripts/
│   ├── journey-cli.js      # CLI process manager executable
│   └── mcp-server.js       # Model Context Protocol server executable
├── GEMINI.md               # Context documentation for Gemini CLI
└── AGENTS.md               # Agent standards and operational rules
```

> **Important Data Note**:
> - **User Data**: Stored at `~/.journey/data/roadmap.json` (outside the git repository).
> - **Repository Template**: `data/roadmap.json` inside the repository is a starter template for new installations and is never overwritten with personal goal data.

---

## License

MIT © [ziuus](https://github.com/ziuus)