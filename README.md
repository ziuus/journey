# 🌌 Personamaxing Hub

> **Unified Mastery Engine — Mastering the transition from 2013 fundamentals to 2030 autonomous performance.**

Personamaxing Hub is a high-fidelity engine for technical mastery and biological optimization. It visualizes the path from legacy software patterns to frontier technologies like **Rust-based runtimes**, **Agentic AI (RAG)**, and **Verifiable Compute (ZK-ML)**, integrated with a foundations of a **Biological Stack** (Nutrition, Fitness, Grooming).

## ⚡ Core Features

- **Progression Intelligence**: Real-time metrics dashboard featuring skill radar vectors and phase-completion tracking.
- **Unified Mastery**: A structured roadmap spanning Systems Design, Cryptographic AI, and Biological Performance.
- **MCP Integration**: Direct tool-based access for AI agents to interact with and update the roadmap.
- **Clean Premium Aesthetic**: Minimalist, glassmorphic UI built for high-performance focus.

## 🛠 Tech Stack

- **Framework**: Next.js 16+ (Turbopack)
- **Styling**: Vanilla CSS Modules (Glassmorphism / Antigravity Master UI)
- **Intelligence**: Google Gemini-2.0 via Gemini CLI Bridge
- **Animations**: GSAP & Framer Motion for kinetic physics
- **Scrolling**: Lenis Smooth Scroll

## 🚀 Getting Started

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Ensure the **OpenCode** or **Gemini CLI** is installed and authenticated in your local environment.

3. **Run Development**:
   ```bash
   npm run dev
   ```

## 🌐 Production & Vercel Deployment

Personamaxing Hub is designed to be production-grade. To deploy on Vercel:

1. **Persistence**: The current system uses local `fs` storage (`data/roadmap.json`). For Vercel production, it is recommended to integrate a database like **Firebase** or **Vercel KV**. 
2. **Environment**: Add necessary API keys (Google Gemini, etc.) to your Vercel project environment variables.
3. **Build**: Run `npm run build` to ensure project integrity.

## 📂 Project Structure

- `src/app`: Next.js App Router logic and cinematic views.
- `src/app/api`: Local bridge endpoints for roadmap manipulation and history.
- `data/`: Local JSON-based persistent storage (Roadmap & History).
- `mcp/`: Personamaxing Hub MCP Engine for cross-agent roadmap interaction.

## 🛠 MCP Integration

The Hub includes a built-in MCP server for direct interaction with AI agents.
- **Server**: `mcp/server.py`
- **Capabilities**: `get_roadmap`, `update_goal_status`, `add_goal`, `get_summary`.
- **Registration**: Ensure it's registered in your `opencode.json` for agentic autonomy.

---
*Built for the 2030 Engineering Frontier.*
