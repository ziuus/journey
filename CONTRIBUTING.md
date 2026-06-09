# Contributing to Journey (Unified Mastery Engine)

First off, thank you for considering contributing to Journey! This tool is designed to be the ultimate syllabus and progress tracker for ambitious engineers, and community contributions are what make it truly great.

## What is Journey?
Journey is a roadmap tracking system built on Next.js 16 (Turbopack), Firebase, and GSAP. It visualizes learning paths using a calm, usability-first "liquid glass" UI.

## How Can I Contribute?

### 1. Adding New Roadmaps
The heart of Journey is `data/roadmap.json`. If you have a structured learning path for a specific role or technology (e.g., Data Engineer, Game Developer), you can add it here!
- Add new goals under the `layers` array.
- Prefix your layer ID with `layer` (e.g., `layer17`). 
- **Note:** Journey automatically places any layer starting with `layer` into the "Career & Tech" section (except layers 8-11, which are reserved for Health & Fitness).

### 2. UI & UX Improvements
We use CSS Modules and a strict usability-first design philosophy based on the PAI `master-ui-ux-design` principles.
- **Do not use Tailwind.** We write pure CSS in `.module.css` files.
- Keep the UI calm. Avoid distracting neon glows, excessive hover animations, and dense layouts. 
- Use the Halo effect, cognitive fluency, and deep parallax sparingly and intentionally.

### 3. Bug Fixes & Features
- Check the Issues tab for anything labeled `good first issue` or `help wanted`.
- If you find a bug, open an issue first before submitting a PR.

## Development Setup

The easiest way to get started is using the provided setup script:

```bash
git clone https://github.com/ziuus/journey.git
cd journey
./setup.sh
```

Or manually:
1. Ensure you have Node.js 18+ installed.
2. Run `npm install` (or `pnpm install` / `bun install`).
3. Run `npm run dev`.

## Pull Request Process

1. Fork the repo and create your branch from `main`.
2. Keep your PR focused on a single change.
3. Explain **what** you changed and **why**.
4. Link the related issue if there is one.
5. Ensure the build passes (`npm run build`).

Thanks for helping us build the best mastery engine out there!