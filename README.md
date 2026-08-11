<p align="center">
  <img src="public/logo.png" alt="Journey Logo" width="120" />
</p>

<h1 align="center">Journey</h1>

<p align="center">
  <strong>Universal Goal Engine, Local Web Portal & Model Context Protocol (MCP) Server</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@ziuus/journey"><img src="https://img.shields.io/npm/v/%40ziuus%2Fjourney" alt="npm version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License" /></a>
</p>

<p align="center">
  Journey is a local-first goal tracking and mastery engine with a Next.js web portal and a built-in MCP server. It manages skill trees, mastery roadmaps, and daily task priorities through a single JSON file (<code>~/.journey/data/roadmap.json</code>) accessible by both humans and AI agents in real time.
</p>

---

<p align="center">
  <img src="public/preview-home.png" alt="Journey Home Portal Overview" width="880" style="border-radius: 12px;" />
</p>

<br/>

<p align="center">
  <img src="public/preview-tree.png" alt="Journey Goal Tree Graph View" width="880" style="border-radius: 12px;" />
</p>

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Journey Web Portal                    │
│                (http://localhost:6161)                  │
│   • Home Overview          • Execution Dashboard        │
│   • Goal Tree Graph        • 24 Preset Themes           │
└────────────────────────────┬────────────────────────────┘
                             │ reads & writes
┌────────────────────────────▼────────────────────────────┐
│            ~/.journey/data/roadmap.json                 │
│        (User's Local Goal & Mastery Data)               │
└────────────────────────────▲────────────────────────────┘
                             │ MCP / Stdin-Stdout
┌────────────────────────────┴────────────────────────────┐
│             AI Assistants & MCP Clients                 │
│       (Claude Desktop, Cursor, Windsurf, Gemini)        │
└─────────────────────────────────────────────────────────┘
```

---

## Core Capabilities

- **Local-First & Private**: Personal data remains stored locally at `~/.journey/data/roadmap.json`. Requires no external databases, account creation, or cloud services.
- **Model Context Protocol (MCP)**: Native `journey-mcp` executable exposing JSON-RPC 2.0 tools (`get_roadmap`, `add_goal`, `update_item_status`) for seamless AI integration.
- **24 Theme Color Combos**: Includes 24 harmonized color theme presets (*Dracula, Nord, Gruvbox, Tokyo Night, Monokai, Rosé Pine, Synthwave, Catppuccin, Cyberpunk, and Clean Light/Dark*) with automatic YIQ text contrast adjustment.
- **Algorithmic Execution Engine**: Evaluates task priority, career ROI, and dependencies to synthesize daily focus items and surface blocked goals on the Dashboard.
- **Interactive Goal Graph**: Visual node tree interface allowing direct inline node creation, deletion, status updates, and track filtering.
- **Density Scaling**: Toggle between *Comfortable* and *Compact* layout densities for different display sizes.

---

## Quick Start

### 1. Installation

Install Journey globally via npm:

```bash
npm install -g @ziuus/journey
```

> **Upgrading**: To update an existing global installation:
> ```bash
> npm install -g @ziuus/journey@latest
> ```

### 2. Launch Portal

Start the background web service:

```bash
journey
```

Navigate to `http://localhost:6161`. Journey automatically creates a starter roadmap file at `~/.journey/data/roadmap.json` on initial launch if one does not exist.

---

## Interface Guide

| View | Path | Primary Purpose |
|---|---|---|
| **Overview** | `/` | Track-by-track accordion hierarchy, global progress statistics, search filtering. |
| **Dashboard** | `/dashboard` | Algorithmic focus recommendation engine, high-ROI target lists, dependency warning panels. |
| **Goal Tree** | `/tree` | Full-screen interactive DAG node graph view with live node editing tools. |
| **Settings** | `/settings` | Theme selector (24 presets), custom accent override, density mode, default landing view preferences. |

---

## AI Agent & MCP Integration

Journey connects to AI assistants via direct file access or the Model Context Protocol.

### Method 1: Model Context Protocol (MCP)

Add `journey-mcp` to your client's MCP configuration (`mcpServers`):

#### Global Install Command Configuration
```json
{
  "mcpServers": {
    "journey": {
      "command": "journey-mcp"
    }
  }
}
```

#### NPX (Zero-Install) Configuration
```json
{
  "mcpServers": {
    "journey": {
      "command": "npx",
      "args": ["-y", "@ziuus/journey", "journey-mcp"]
    }
  }
}
```

#### Common MCP Config Locations:
- **Claude Desktop**: 
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Linux: `~/.config/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- **Cursor**: Workspace `.cursor/mcp.json` or *Features → MCP*
- **Windsurf**: `~/.codeium/windsurf/mcp_config.json`
- **Roo Code / Cline**: VS Code extension settings for MCP

#### Available MCP Tools

| Tool Name | Parameters | Description |
|---|---|---|
| `get_roadmap` | *None* | Retrieves the full JSON roadmap data structure from `~/.journey/data/roadmap.json`. |
| `add_goal` | `layerId`, `title`, `goal` | Appends a new goal item into the specified layer ID. |
| `update_item_status` | `type`, `itemId`, `status` | Updates target item status (`pending` or `done`). |

---

### Method 2: Direct File Reference

Instruct any local AI agent or LLM CLI to read `~/.journey/data/roadmap.json`.

| Environment | Setup Instructions |
|---|---|
| **Gemini CLI** | Reference [`GEMINI.md`](./GEMINI.md) in your session context. |
| **Claude Code** | Load [`AGENTS.md`](./AGENTS.md) at project workspace root. |
| **Cursor / Windsurf** | Add `~/.journey/data/roadmap.json` into `.cursorrules` or context window. |

---

## CLI Command Reference

| Command | Action |
|---|---|
| `journey` | Launches background portal process on port 6161 |
| `journey dev` | Runs development portal in foreground on port 3000 |
| `journey status` | Queries current background service state |
| `journey stop` | Terminates background portal service |
| `journey logs` | Displays real-time portal process logs |
| `journey-mcp` | Runs stdio Model Context Protocol server |

---

## Data Structure & Filesystem Layout

```
journey/
├── src/                    # Next.js 16 Web Portal Application
│   ├── app/                # Application routes (/ , /dashboard, /tree, /settings)
│   ├── components/         # Navigation bar, Footer, and SVG Logo components
│   ├── config/             # Theme metadata & default system configurations
│   ├── context/            # Global preference & theme context provider
│   └── lib/                # Roadmap normalizers & scoring algorithm
├── data/
│   └── roadmap.json        # Repository starter template (Do NOT write user data here)
├── scripts/
│   ├── journey-cli.js      # CLI service manager executable
│   └── mcp-server.js       # Model Context Protocol stdio server executable
└── ~/.journey/data/        # User storage location (roadmap.json)
```

> **Data Separation Policy**:
> - **User Roadmap**: Saved strictly to `~/.journey/data/roadmap.json` outside the source directory.
> - **Starter Template**: The repository file `data/roadmap.json` provides initial default schema structure for new installations.

---

## License

MIT © [ziuus](https://github.com/ziuus)