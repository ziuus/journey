# Learn Journey (Unified Mastery Engine)

Welcome to Journey! This guide will help you understand the core concepts behind the project and how to get the most out of it.

## The Core Concept

Journey is not a course or a tutorial; it's a **Mastery Engine**. It acts as your single source of truth for your learning path. 

The intended workflow is:
1. **Discover:** Open Journey to see your overarching roadmap (e.g., Applied AI + Web3 Full-Stack Engineer).
2. **Select:** Pick a specific node you need to master (e.g., "Build a Rust-based KV store").
3. **Execute:** Take that topic to ChatGPT, Claude, or documentation to actually learn it, practice it, and build it.
4. **Complete:** Return to Journey and check it off. Watch your progress vectors grow.

## Architecture & Stack

- **Framework:** Next.js 16.2 (Turbopack)
- **Styling:** CSS Modules (No Tailwind) + GSAP for fluid, usability-first animations.
- **Database:** Firebase (Multi-user architecture supported via `userId`, though defaults to local).
- **Data Source:** `data/roadmap.json` acts as the definitive schema for layers, milestones, and target roles.

## Understanding the Roadmap Schema (`data/roadmap.json`)

The JSON structure is designed to be easily extensible. 

- `target_roles`: High-level titles you are aiming for (e.g., "Infrastructure & Platform Engineer").
- `timeline`: High-level phases spanning semesters or years.
- `layers`: The core groups of skills. 
  - Layers 1-7 and 12+ are grouped into **"Career & Tech"**.
  - Layers 8-11 are reserved for **"Health & Fitness"**.
  - Layers missing a specific hardcoded mapping fall into **"Other"**.
- `milestones`: Concrete, buildable projects (e.g., "Implement Raft Consensus").

## Customizing Your Journey

You can easily adapt Journey for your own goals by editing `data/roadmap.json`. Just follow the existing JSON structure to add new layers or milestones. The UI will automatically render your new goals based on the category logic in `src/app/page.tsx`.

Happy building!