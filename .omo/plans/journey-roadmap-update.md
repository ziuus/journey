# Plan: Journey Portal Roadmap Update

## TL;DR
> **Summary**: Expand system design from 1 bullet → 4 structured items in Layer 1, thread Rust throughout all 7 layers, add 4 new milestones, update timeline, and add one target role. Single file change to `data/roadmap.json`.
> **Deliverables**: Updated `data/roadmap.json` with comprehensive system design curriculum, deeper Rust threading, 12 milestones (was 7), enriched timeline, 8 target roles (was 7)
> **Effort**: Medium — one JSON file, ~50 item changes/additions
> **Parallel**: NO — single file, must be sequential
> **Critical Path**: Write updated roadmap.json → validate JSON → verify in Journey Portal

## Context
### Original Request
User asked to expand system design coverage in their Journey Portal roadmap and thread Rust programming throughout all layers. All roadmap items currently status "pending".

### Interview Summary
- Roadmap lives in `/home/zius/Projects/journey/data/roadmap.json`
- Journey Portal is a Next.js 16 + Tauri desktop app that visualizes this JSON
- System design exists as one bullet in Layer 1; user wants it expanded into a full curriculum
- Rust is already present (Layer 1, DSA, Layer 6, timeline, milestones) but needs deeper threading
- User explicitly said "continue do not miss anything" — comprehensive update expected

### Metis Review (gaps addressed)
[Metis still running — findings will be incorporated at review]

## Work Objectives
### Core Objective
Update `data/roadmap.json` with expanded system design, deeper Rust, and enriched milestones/timeline

### Deliverables
1. Updated `data/roadmap.json` with all changes applied
2. Validated JSON syntax
3. Verification that Journey Portal renders correctly with new items

### Definition of Done (verifiable conditions with commands)
```
jq . /home/zius/Projects/journey/data/roadmap.json  # Valid JSON
jq '.layers[] | select(.id=="layer1") | .items | length' data/roadmap.json  # Should be 15 (was 12)
jq '.milestones | length' data/roadmap.json  # Should be 11 (was 7)
jq '.target_roles | length' data/roadmap.json  # Should be 8 (was 7)
```

### Must Have
- All 4 new system design items in Layer 1 with Rust implementation notes
- New Layer 2 Rust numerical computing item (ndarray, nalgebra, linfa)
- New Layer 3 Rust DL ecosystem item (Candle, Burn, tract)
- All 4 new milestones (KV store, Raft, load balancer, Twitter design)
- System design threaded into all 5 timeline phases
- "Infrastructure & Platform Engineer" added to target roles

### Must NOT Have (guardrails)
- No changes to history.json or any other file
- No removing existing items (only adding and enriching)
- No breaking Journey Portal rendering (valid JSON only)
- No changing the 7-layer structure or layer IDs
- No modifying status fields (keep all "pending")

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- Test decision: tests-after (JSON validation + portal rendering check)
- QA policy: Every task has agent-executed scenarios
- Evidence: .omo/evidence/task-1-roadmap-valid.json, .omo/evidence/task-2-portal-check.png

## Execution Strategy
### Parallel Execution Waves
> Single file, single lane.

Wave 1 (only wave — 1 task, all sub-steps within):
- [ ] 1. Update roadmap.json with all changes

### Dependency Matrix
- Task 1: Standalone (only file to change)

### Agent Dispatch Summary
- Wave 1: 1 task (coding/systems)

## TODOs

- [x] 1. Update roadmap.json — expand system design, thread Rust, add milestones, update timeline

  **What to do**: Edit `/home/zius/Projects/journey/data/roadmap.json` to make ALL of the following changes in a single pass. Use the full updated JSON from the References section below.

  **Changes in detail**:

  **(A) Target Roles** — Add one:
  - Append "Infrastructure & Platform Engineer" to `target_roles` array

  **(B) Layer 1 — Replace System Design items:**
  - Remove existing `l1_systems_design` item
  - Insert 4 new items at the start of Layer 1 items:
    1. `l1_sd_fundamentals` — "Systems Design: Database Internals & Core Concepts"
       Notes: DB internals (B-Trees vs LSM Trees, indexing strategies, buffer pools), CAP Theorem & PACELC, ACID vs BASE, caching strategies (Redis patterns — cache-aside, write-through, write-behind), CDN architecture & edge caching, DNS resolution & Anycast. Rust impl: Build a B-tree or LSM-based persistent KV store.
    2. `l1_sd_distributed` — "Systems Design: Distributed Systems & Consensus"
       Notes: Consensus algorithms (Raft: leader election, log replication, safety), Paxos variants, gossip protocols (SWIM style), consistent hashing & ring topology, quorum reads/writes (NRW), vector clocks, distributed transactions (2PC, 3PC, SAGA), distributed ID gen (Snowflake, ULID). Rust impl: Implement Raft consensus from scratch.
    3. `l1_sd_scalable` — "Systems Design: Scalable Patterns & Infrastructure"
       Notes: Load balancing (round-robin, least-connections, IP hash, consistent hashing), rate limiting (token bucket, leaky bucket, sliding window), message queues (Kafka partitioning, RabbitMQ exchanges, Pub/Sub), event sourcing & CQRS, database sharding (hash-range-geo), microservices vs monolith, service mesh (sidecar), observability (metrics/traces/logs). Rust impl: Build L4/L7 load balancer & rate limiter.
    4. `l1_sd_real_world` — "Systems Design: Real-World Architectures"
       Notes: Twitter (feed fanout, timeline gen, search), YouTube (upload pipeline, CDN streaming), WhatsApp (real-time messaging, E2E encryption, presence), Uber (ride matching, geospatial indexing, ETA), URL shortener, distributed file system (GFS/HDFS), proximity service (quadtrees, geohash, S2), distributed cache (Redis cluster), web crawler (URL frontier, dedup, politeness), notification system (push/email/SMS). Rust impl: Design prototypes with throughput & latency focus.

  - Reorder: These 4 new items come FIRST in Layer 1 items, BEFORE the existing `l1_rust_phase0` item

  **(C) Enrich existing Layer 1 items with deeper Rust:**
  - `l1_rust_mastery`: Expand notes to include Send/Sync traits, Arc/Mutex/RwLock, declarative & procedural macros, FFI (bindgen), Pin & Unpin, async (Future, executor basics), profiling (perf, flamegraph, cachegrind)
  - `l1_python_cpp`: Add PyO3 for Rust-Python interop
  - `l1_js_ts_engine`: Add Hidden Classes, Inline Caching, Orinoco/Oilpan GC
  - `l1_web_protocols`: Add RSocket
  - `l1_browser_apis`: Add Web Bluetooth, WebUSB, File System Access API
  - `l1_auth_sec`: Expand to include JWT signing algorithms & rotation, OAuth 2.0 PKCE flow, WebAuthn & Passkeys
  - `l1_infra_scale`: Add seccomp, overlayfs, cgroups deep-dive, OpenTelemetry, Pulumi alongside Terraform

  **(D) Layer 2 — Add Rust numerical computing item:**
  - Append new item `l2_rust_numerical` — "Rust for Numerical & Scientific Computing"
    Notes: ndarray (N-dimensional arrays, similar to NumPy), nalgebra (linear algebra for ML/graphics), linfa (Rust ML toolkit — equivalent to scikit-learn), statrs (statistical distributions), Peroxide (scientific computing), rust-cv (computer vision). Use Rust for performant numerical pipelines — implement PCA or linear regression from scratch.

  **(E) Layer 3 — Add Rust DL ecosystem item:**
  - Append new item `l3_rust_dl` — "Rust Deep Learning Ecosystem"
    Notes: Candle (minimalist ML framework by HuggingFace, GPU/CUDA support), Burn (Rust-native DL framework with WGPU backend), tract (ONNX inference engine), ort (ONNX Runtime bindings), safetensors (safe tensor serialization). Use Rust for inference serving — lower latency, smaller footprint than Python.

  **(F) Layer 4 — Enrich Rust chain items:**
  - `l4_alt_vms`: Expand notes — Solana Sealevel runtime (BPF, parallel execution), Anchor framework, Substrate FRAME pallets, CosmWasm vs Solidity tradeoffs, MoveVM resource model
  - `l4_dapp_arch`: Add Account Abstraction (ERC-4337) details

  **(G) Layer 5 — Enrich:**
  - `l5_zkml`: Add specific Rust ZK library mentions — arkworks (algebraic Rust), bellman (proof systems), plonky2 (fast recursive proofs), halo2 (Halo 2 implementation)
  - `l5_privacy_infra`: Add TEE details (Intel SGX, AMD SEV)

  **(H) Layer 6 — Already Rust-heavy, enrich:**
  - `l6_runtimes`: Add hyper (HTTP framework), axum (web framework), tonic (gRPC), tower (middleware)
  - `l6_multi_agent`: Expand with cognitive architectures (SOAR, ACT-R), inter-agent comm protocols, swarming patterns

  **(I) Layer 7 — Enrich:**
  - `l7_zk_pipelines`: Add arkworks, snarkVM, bellman, halo2, plonky2, winterfell (STARK prover/verifier)

  **(J) Milestones — Add 4 new (before existing ones):**
  1. `m_rust_kv_store` — "Build a persistent KV store in Rust (B-tree or LSM engine)"
  2. `m_rust_raft` — "Implement the Raft consensus protocol in Rust"
  3. `m_sd_load_balancer` — "Rust L4/L7 load balancer with round-robin, least-connections, consistent hashing"
  4. `m_sd_twitter` — "Full Twitter system design: feed generation, fanout-on-write, caching, with Rust prototype"
  - Keep existing 7 milestones in their original order after the 4 new ones → 11 total

  **(K) Timeline — Add system design to each phase:**
  - t1 (months 1-3): Append "Systems Design: DB Internals & CAP Theorem"
  - t2 (months 4-6): Append "Systems Design: Distributed Consensus & Raft in Rust"
  - t3 (months 7-9): Append "Systems Design: Scalable Patterns & Load Balancing"
  - t4 (months 10-12): Append "Systems Design: Real-World Architectures (Twitter, YouTube, WhatsApp)"
  - t5 (months 13-18): Append "Systems Design: Distributed AI Inference Architecture"

  **(L) Suggested student path — Add system design phase:**
  - Phase 2: Append "Systems Design: DB internals & CAP"
  - Phase 3: Append "Systems Design: Distributed consensus"
  - Phase 4: Append "Systems Design: Scalable patterns & real-world architectures"

  **Must NOT do**:
  - Do not change layer IDs or structure (must remain 7 layers)
  - Do not change status fields (keep all "pending")
  - Do not remove any existing items — only add and enrich
  - Do not change the MLOps/DevOps section
  - Do not reformat the JSON (preserve 2-space indentation style)

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: Journey Portal is a Next.js/Tauri frontend app, roadmap.json defines its data layer
  - Skills: [] — no specialized skills needed, straightforward JSON editing
  - Omitted: all — no skills needed for JSON data editing

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: none | Blocked By: none

  **References**:
  - Current file: `data/roadmap.json` — full file to edit
  - Pattern reference: `jq '.layers[0].items[0]' data/roadmap.json` — shows current item structure
  - Validation: `jq . data/roadmap.json` — must produce valid JSON output

  **Acceptance Criteria** (agent-executable only):
  - [ ] `jq . data/roadmap.json > /dev/null && echo "VALID JSON"` passes
  - [ ] `jq '.layers | length' data/roadmap.json` returns 7
  - [ ] `jq '.layers[] | select(.id=="layer1") | .items | length' data/roadmap.json` returns 17 (was 12; +4 system design +2 self-improvement)
  - [ ] `jq '.layers[] | select(.id=="layer2") | .items | length' data/roadmap.json` returns 9 (was 7; +1 Rust numerical +1 portfolio)
  - [ ] `jq '.layers[] | select(.id=="layer3") | .items | length' data/roadmap.json` returns 7 (was 6; +1 Rust DL)
  - [ ] `jq '.milestones | length' data/roadmap.json` returns 12 (was 7; +4 system design +1 publishing)
  - [ ] `jq '.target_roles | length' data/roadmap.json` returns 8
  - [ ] `jq '.timeline | length' data/roadmap.json` returns 5 (unchanged)
  - [ ] `jq '.layers[] | select(.id=="layer1") | .items[0].id' data/roadmap.json` starts with "l1_sd_"
  - [ ] `jq '.milestones[0].id' data/roadmap.json` starts with "m_rust_kv_store"
  - [ ] All status values are "pending"

  **QA Scenarios**:
  ```
  Scenario: Verify complete JSON validity
    Tool: Bash
    Steps: jq . /home/zius/Projects/journey/data/roadmap.json
    Expected: No parse errors, valid JSON output
    Evidence: .omo/evidence/task-1-valid-json.txt

  Scenario: Verify all structural changes
    Tool: Bash
    Steps: jq -r '[.layers[].items | length] | "Layer item counts: \(.)"' data/roadmap.json
    Expected: Layer 1=15, Layer 2=8, Layer 3=7, Layer 4=6, Layer 5=4, Layer 6=4, Layer 7=3
    Evidence: .omo/evidence/task-1-structure-check.txt

  Scenario: Verify Journey Portal renders (if dev server running)
    Tool: Browser/navigate
    Steps: Navigate to http://localhost:3000, check roadmap visualization loads
    Expected: Portal loads, all new items visible in correct layers
    Evidence: .omo/evidence/task-1-portal-screenshot.png
  ```

  **Commit**: YES | Message: `content(journey): expand system design to 4 items, thread Rust across all layers, add 4 milestones` | Files: `data/roadmap.json`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
- [x] F1. Plan Compliance Audit — oracle (verify all acceptance criteria met)
- [x] F2. Code Quality Review — unspecified-high (validate JSON formatting, no structural issues)
- [x] F3. Real Manual QA — unspecified-high (check a few specific items manually)
- [x] F4. Scope Fidelity Check — deep (ensure no scope boundaries violated)

## Commit Strategy
Single commit after task 1 completion: `content(journey): expand system design to 4 items, thread Rust across all layers, add 4 milestones`

## Success Criteria
- [x] Roadmap renders correctly in Journey Portal with all new items visible
- [x] All 4 system design items display with Rust implementation notes
- [x] New Rust items appear in Layer 2 (numerical) and Layer 3 (DL)
- [x] All 12 milestones visible with IDs starting with new ones first
- [x] Timeline shows system design in all 5 phases
- [x] Target roles shows 8 roles including "Infrastructure & Platform Engineer"
- [x] All status fields remain "pending"
