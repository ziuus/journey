# Journey — Universal Goal & Roadmap Engine

[![npm version](https://img.shields.io/npm/v/%40ziuus%2Fjourney)](https://www.npmjs.com/package/@ziuus/journey)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Journey is a local-first goal tracking portal and Model Context Protocol (MCP) server. It manages roadmaps, skill trees, and execution tasks using a local JSON data file (`~/.journey/data/roadmap.json`) that both you and your AI assistants (Gemini, Claude, Cursor, Codex) can view and update in real time.

```
                   ┌────────────────────────────┐
                   │   Journey Web Portal       │
                   │   (http://localhost:6161)  │
                   └─────────────┬──────────────┘
                                 │ reads & writes
                   ┌─────────────▼──────────────┐
                   │ ~/.journey/data/roadmap.json│ ◄── AI Agent / MCP Server
                   └────────────────────────────┘
```

---

## Quick Start

### 1. Installation

```bash
npm install -g @ziuus/journey
```

### 2. Launch Portal

```bash
journey
```

Open `http://localhost:6161` in your browser. Journey automatically initializes your local roadmap file at `~/.journey/data/roadmap.json` using the repository starter template.

---

## Features & Views

- **Home View (`/`)**: High-level overview of overall progress, search bar, multi-track filter tabs, and layer tree accordions.
- **Dashboard (`/dashboard`)**: Automated execution scoring recommending *Today's Focus*, *High ROI Items*, and *Blocked Task Detection*.
- **Goal Tree (`/tree`)**: Interactive structural graph visualization with hover edit controls (rename, add, delete, toggle completion).
- **Settings (`/settings`)**: Visual mode switching (Light / Dark / System), accent color highlights, interface density controls, and default landing preferences.

---

## Agent Integration

Journey works with any AI assistant that can read local files or connect via MCP.

### Option A: Direct File Reference (Recommended)

Point your AI assistant to read `~/.journey/data/roadmap.json`.

| Agent / Environment | Setup Instructions |
|---|---|
| **Gemini CLI** | Reference [`GEMINI.md`](./GEMINI.md) context file or tell it your roadmap lives at `~/.journey/data/roadmap.json`. |
| **Claude Code** | Reference [`AGENTS.md`](./AGENTS.md) in your workspace. |
| **Cursor / Windsurf** | Add `~/.journey/data/roadmap.json` to your project context or `.cursorrules`. |
| **ChatGPT / Custom GPTs** | Attach or reference your `~/.journey/data/roadmap.json` file. |

### Option B: Model Context Protocol (MCP) Server

Journey includes a built-in MCP server (`journey-mcp`) for agents supporting standard MCP protocol integrations (such as Claude Desktop or Cursor).

Add the following to your agent's MCP configuration (`mcpServers`):

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

#### Available MCP Tools:

- `get_roadmap`: Retrieves the full JSON roadmap data from `~/.journey/data/roadmap.json`.
- `add_goal`: Adds a new goal item to a specified roadmap layer.
- `update_item_status`: Updates the status (`pending` or `done`) of a specific roadmap item.

---

## CLI Reference

| Command | Description |
|---|---|
| `journey` | Start background web portal (Port 6161) |
| `journey dev` | Start development portal in foreground (Port 3000) |
| `journey status` | Check running portal background process status |
| `journey stop` | Terminate background web portal process |
| `journey logs` | Display recent background portal logs |
| `journey-mcp` | Run stdin/stdout JSON-RPC 2.0 MCP server |

---

## Architecture & Data Storage

```
journey/
├── src/                    # Next.js web application
│   ├── app/                # Page routes (/ , /dashboard, /tree, /settings)
│   ├── components/         # Reusable UI components & navigation
│   └── lib/                # Roadmap parser & recommendation engine
├── data/
│   └── roadmap.json        # Repository STARTER TEMPLATE file
├── scripts/
│   ├── journey-cli.js      # CLI management tool
│   └── mcp-server.js       # MCP server implementation
├── GEMINI.md               # Context file for Gemini CLI
└── AGENTS.md               # Agent guidelines and standards
```

> **Data Separation**:
> - **User Data**: Saved locally at `~/.journey/data/roadmap.json` outside the code repository.
> - **Template Data**: The repository file `data/roadmap.json` is a generic starter template used for fresh installations.

---

## License

MIT © [ziuus](https://github.com/ziuus)