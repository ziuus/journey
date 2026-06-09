# 🌌 Journey: Universal Goal Engine

> **Universal Mastery Engine — Achieving any goal through structured layers, milestones, and AI assistance.**

Journey is a high-fidelity platform for tracking and achieving any type of goal—whether it's technical mastery, biological optimization, personal projects, or life milestones. It breaks down massive ambitions into structured **Layers** and actionable **Sub-tasks (Milestones)**, designed to be accomplished with the help of AI agents. 

## ⚡ Core Features

- **Universal Goal Tracking**: Create custom layers for any domain (Career, Health, Personal, etc.) and track progress through actionable sub-tasks.
- **AI-Assisted Execution**: Built from the ground up to integrate with AI agents (like OpenCode or Gemini) that can dynamically create, update, and manage your goals based on conversation.
- **Progression Intelligence**: Real-time metrics dashboard featuring category radar vectors and phase-completion tracking.
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

Journey is production-ready with a multi-user architecture. To enable persistent storage on Vercel:

1.  **Persistence**: The system is pre-configured for **Firebase Firestore via REST API**.
    - Firebase project: `projects-fff6a`
    - Firestore collection: `journ_roadmaps` by default
    - If Firebase environment variables are missing, the app falls back to the local `data/roadmap.json` template.
2.  **Required Environment Variables**:
    - `FIREBASE_PROJECT_ID`
    - `FIREBASE_WEB_API_KEY`
    - `FIREBASE_COLLECTION_PREFIX` (optional, defaults to `journ`)
    - Copy `.env.example` to `.env.local` for local development.
3.  **Multi-User**: Users identify via a `userId` stored in `localStorage`. Each user gets an isolated roadmap document in Firestore.
4.  **Privacy**: Personal health and roadmap data should live in Firestore per user. The repository keeps only a generic public template in `data/roadmap.json`.
5.  **Build**: Run `npm run build` to verify project integrity before deploy.

## 📂 Project Structure

- `src/app`: Next.js App Router logic and cinematic views.
- `src/app/api`: Local bridge endpoints for roadmap manipulation and history.
- `data/`: Local JSON-based persistent storage (Roadmap & History).
- `mcp/`: Journey MCP Engine for cross-agent roadmap interaction.

## 🤖 AI Agent Integration (Skills)

Users can connect their own AI agents (like OpenCode) to Journey so the agent can dynamically create and manage their roadmaps based on conversations.

1. Tell your AI Agent to read the skill instructions located at:
   `agent-skills/journey/SKILL.md`
2. The agent will learn the API structure and use the app's REST API (`/api/roadmap?userId=...`) to autonomously update your goals as you chat.

---
*Built for the 2030 Engineering Frontier.*
