# Draft: Journey Roadmap Update

## Requirements (confirmed)
- **Expand system design** from one bullet into a structured curriculum
- **Thread Rust** throughout all layers (it already exists but needs stronger presence)
- Include system design as Rust-based implementation milestones
- Leave nothing out — comprehensive update

## Current State Analysis
- **Rust**: Already in Layer 1 (Phase 0, Advanced mastery), DSA entries, Layer 6 (Runtimes), timeline, milestones
- **System Design**: Single `l1_systems_design` item with decent notes but needs expansion
- **Timeline**: 5 phases over 18 months, mostly Rust/DL/Web3 focused

## Technical Decisions
- **System Design structure**: Split into 4 focused items within Layer 1 (fundamentals, distributed systems, scalable patterns, real-world architectures) — keeps everything in one layer rather than creating a separate layer
- **Rust threading**:
  - Layer 1: Add Rust impl notes to all 4 SD items (KV store, Raft, load balancer, prototypes)
  - Layer 2: New item `l2_rust_numerical` for ndarray/nalgebra/linfa
  - Layer 3: New items `l3_rust_dl` for Candle/Burn/tract ecosystem
  - Layer 4: Already has Solana/Substrate — enriched notes
  - Layer 6: Already heavy Rust — enriched notes
  - Layer 7: Added Rust ZK libraries (arkworks, bellman, plonky2, halo2)
- **New milestones**: 4 new (KV store, Raft, load balancer, Twitter design) = 11 total
- **Timeline**: System design woven into all 5 phases
- **Target roles**: Added "Infrastructure & Platform Engineer"

## Research Findings
- Current roadmap.json has: 7 target roles, 7 layers (52 items total), 7 milestones, 3 MLOps items, 5 timeline phases, 4 suggested student phases
- Journey Portal is Next.js 16 + Tauri, uses this JSON for its roadmap visualization

## Open Questions
- None — user said "continue do not miss anything" so proceeding with full update

## Scope Boundaries
- INCLUDE: System design expansion, Rust threading, new milestones, timeline updates, target role add
- EXCLUDE: UI changes to Journey Portal itself, history.json changes, Gemini CLI bridge updates
