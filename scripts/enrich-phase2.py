#!/usr/bin/env python3
"""
Add Phase 2 fields to roadmap data:
- next_action for every pending/active item
- depends_on for sequential relationships
- target_date, last_worked_on, created_at for overdue/stale detection
- actual_hours for selected items
"""

import json, os
from datetime import datetime, timedelta

path = os.path.expanduser('~/.journey/data/roadmap.json')
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

today = datetime.now()

# ─── Dependency chain add relationships ─────────────────────

# Build id->item map
item_map = {}
for layer in data['layers']:
    for item in layer['items']:
        item_map[item['id']] = item

# Clear existing deps
for layer in data['layers']:
    for item in layer['items']:
        if 'depends_on' in item:
            del item['depends_on']

# DSA progression
items_by_id = {}
for layer in data['layers']:
    for item in layer['items']:
        items_by_id[item['id']] = item

# Sequential dependencies (realistic)
deps = {
    # DSA chain
    'l1_dsa_rust_logic': ['l1_dsa_rust_arrays'],
    'l2_dsa_rust_complex': ['l1_dsa_rust_logic'],
    # ML chain
    'l3_nn_theory': ['l2_linear_algebra', 'l2_calculus', 'l2_prob_stat'],
    'l3_transformers': ['l3_nn_theory'],
    'l3_agentic': ['l3_transformers'],
    'l3_computer_vision': ['l3_nn_theory'],
    'l3_nlp_llm': ['l3_transformers'],
    # Rust chain
    'l1_rust_mastery': ['l1_rust_phase0'],
    'l2_rust_numerical': ['l1_rust_phase0'],
    'l3_rust_dl': ['l1_rust_phase0'],
    # System Design chain
    'l1_sd_scalable': ['l1_sd_fundamentals', 'l1_sd_distributed'],
    'l1_sd_real_world': ['l1_sd_scalable'],
    # Interview chain
    'nl17_sd_primer': ['l1_sd_fundamentals'],
    'nl17_alex_xu': ['nl17_sd_primer'],
    'nl17_bytebytego': ['nl17_sd_primer'],
    'nl17_mock_interviews': ['nl17_sd_primer', 'nl17_ood_practice'],
    'nl17_ood_practice': ['nl17_sd_primer'],
    # Fullstack chain
    'js_react_next': ['js_ts_core'],
    'js_browser_deep': ['js_ts_core'],
    # Web3 chain
    'l13_evm_solidity': ['l4_eth_evm'],
    'l13_dev_frameworks': ['l13_evm_solidity'],
    'l13_contract_standards': ['l13_evm_solidity'],
    'l13_defi_protocols': ['l13_contract_standards'],
    'l14_ethers_viem': ['l13_evm_solidity'],
    'l14_fullstack_dapp': ['l14_ethers_viem', 'js_react_next'],
    # AI-Web3 chain
    'l15_ai_trading_bots': ['l14_fullstack_dapp'],
    'l15_ai_dapp_builder': ['l14_fullstack_dapp'],
    'l15_ai_auditor': ['l13_contract_standards'],
    'l15_zk_ml': ['l4_eth_evm', 'l5_zkml'],
    # Security chain
    'l16_contract_security': ['l13_contract_standards'],
    'l16_web_security': ['l1_auth_sec'],
    'l16_advanced_testing': ['l16_contract_security', 'l16_web_security'],
    # ZK chain
    'l5_decent_compute': ['l5_zkml'],
    'l5_tee_fhe': ['l5_decent_compute'],
    'l5_ai_oracles': ['l5_decent_compute'],
    'l7_zk_pipelines': ['l5_zkml'],
    'l7_privacy_infra': ['l7_zk_pipelines'],
    # Agent chain
    'l6_multi_agent': ['l3_agentic'],
    'l6_cuda_opt': ['l3_nn_theory'],
    # Portfolio
    'nl17_resume_impact': ['l2_portfolio_building'],
    'nl17_oss_projects': ['l2_portfolio_building'],
    # Health progression
    'l9_calisthenics_v_taper': ['l8_nutrition_surplus'],
    'l9_mobility_flexibility': ['l8_nutrition_surplus'],
    'l9_posture_alignment': ['l9_calisthenics_v_taper'],
    'l9_recovery_protocols': ['l9_calisthenics_v_taper'],
    'l10_medicated_treatment': ['l8_nutrition_surplus'],
    'l11_facial_architecture': ['l9_calisthenics_v_taper'],
    'l11_hair_volume_styling': ['l9_calisthenics_v_taper'],
}

for child_id, parent_ids in deps.items():
    if child_id in items_by_id:
        items_by_id[child_id]['depends_on'] = parent_ids

# ─── next_action for pending items ──────────────────────────────

next_actions = {
    'l1_sd_distributed': 'Implement Raft consensus in Rust — build the leader election + log replication module',
    'l1_sd_scalable': 'Study AWS DynamoDB paper — compare with Cassandra for sharding patterns',
    'l1_project_discipline': 'Write a personal execution protocol doc: how you scope, build, ship, and reflect',
    'l1_rust_phase0': 'Build a Rust CLI tool that parses CSV files and generates summary statistics',
    'l1_python_cpp': 'Solve 5 LeetCode Medium/Hard problems in Python — focus on DP and graphs',
    'l1_dsa_rust_arrays': 'Solve 5 sliding window problems (LC 3, 424, 567, 239, 76) in Rust',
    'l1_dsa_rust_logic': 'Solve 5 sorting + two-pointer problems (LC 15, 75, 347, 215, 973) in Rust',
    'nl17_sd_primer': 'Read Alex Xu System Design Interview Vol 1 — chapters 1-4 today',
    'nl17_alex_xu': 'Read chapters 5-8 of Alex Xu Vol 1, draw diagrams for each pattern',
    'nl17_mock_interviews': 'Schedule one mock interview on Pramp for this weekend',
    'nl17_resume_impact': 'Rewrite top 3 resume bullets with quantified metrics',
    'l8_nutrition_surplus': 'Plan today\'s meals: 3000+ kcal, 150g+ protein, track in app',
    'l9_calisthenics_v_taper': 'Morning: 3×12 pull-ups, 3×15 dips, 3×20 push-ups. Record max set.',
    'l3_nn_theory': 'Read Chapter 6 of Goodfellow\'s Deep Learning — MLP backprop derivation',
    'l3_transformers': 'Implement a single-head attention mechanism from scratch in PyTorch',
    'l3_agentic': 'Build a simple ReAct agent loop: LLM call → tool selection → observe → repeat',
    'nl17_ood_practice': 'Solve 3 OOD problems: Design a parking lot, a vending machine, a chess game',
    'l4_eth_evm': 'Deploy a simple ERC-20 contract to Sepolia testnet and verify on Etherscan',
    'js_ts_core': 'Complete 5 TypeScript type challenges from type-challenges repo',
    'js_react_next': 'Build a small Next.js app with SSR, ISR, and static generation — compare performance',
    'l1_auth_sec': 'Implement OAuth 2.0 flow + JWT refresh token rotation in FastAPI',
    'l14_fullstack_dapp': 'Connect your deployed contract to a Next.js frontend with wagmi + viem',
}

for item_id, action in next_actions.items():
    if item_id in items_by_id:
        items_by_id[item_id]['next_action'] = action

# ─── dates: target_date, created_at, last_worked_on ────────────

now = datetime.now()
date_data = {
    # Created dates (some old for stale detection)
    'l1_sd_fundamentals': {'created': '2026-04-15', 'last': '2026-06-20'},
    'l1_sd_distributed': {'created': '2026-04-20', 'target': (now + timedelta(days=14)).strftime('%Y-%m-%d')},
    'l1_sd_scalable': {'created': '2026-04-25'},
    'l1_rust_phase0': {'created': '2026-05-01', 'target': (now + timedelta(days=7)).strftime('%Y-%m-%d')},
    'l1_dsa_rust_arrays': {'created': '2026-05-10'},
    'l1_dsa_rust_logic': {'created': '2026-05-10'},
    'nl17_sd_primer': {'created': '2026-06-01', 'target': (now + timedelta(days=21)).strftime('%Y-%m-%d')},
    'nl17_mock_interviews': {'created': '2026-06-15', 'target': (now + timedelta(days=60)).strftime('%Y-%m-%d')},
    'l8_nutrition_surplus': {'created': '2026-05-20', 'last': '2026-07-01'},
    'l9_calisthenics_v_taper': {'created': '2026-06-01'},
    'l3_nn_theory': {'created': '2026-06-05'},
    'js_ts_core': {'created': '2026-06-10'},
    'l1_auth_sec': {'created': '2026-06-12'},
    'l4_eth_evm': {'created': '2026-06-01'},
    # Stale items (created long ago, never worked on)
    'l5_zkml': {'created': '2026-02-15'},
    'l6_runtimes': {'created': '2026-03-01'},
    'l6_cuda_opt': {'created': '2026-03-15'},
    # Overdue items (target in past)
    'l1_infra_scale': {'created': '2026-04-01', 'target': '2026-06-15'},
    'l3_computer_vision': {'created': '2026-05-01', 'target': '2026-06-20'},
    'l9_recovery_protocols': {'created': '2026-05-15', 'target': '2026-06-25'},
    'js_browser_deep': {'created': '2026-04-10', 'target': '2026-06-01'},
    'nl17_bytebytego': {'created': '2026-05-20', 'target': '2026-06-30'},
}

for item_id, dates in date_data.items():
    if item_id in items_by_id:
        item = items_by_id[item_id]
        if 'created' in dates:
            item['created_at'] = dates['created']
        if 'target' in dates:
            item['target_date'] = dates['target']
        if 'last' in dates:
            item['last_worked_on'] = dates['last']

# ─── some actual_hours for realism ──────────────────────────────

hours = {
    'l1_sd_fundamentals': 8,
    'l1_rust_phase0': 3,
    'l1_dsa_rust_arrays': 2,
    'l8_nutrition_surplus': 5,
    'l9_calisthenics_v_taper': 1,
}
for item_id, h in hours.items():
    if item_id in items_by_id:
        items_by_id[item_id]['actual_hours'] = h

# ─── mark a couple items as 'active' (currently working on) ────

active_items = ['l1_dsa_rust_arrays', 'l8_nutrition_surplus', 'nl17_sd_primer', 'l1_sd_distributed', 'js_ts_core']
for item_id in active_items:
    if item_id in items_by_id:
        items_by_id[item_id]['status'] = 'active'

# ─── Save ─────────────────────────────────────────────────────

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Done. Enriched data with depends_on, next_action, dates, active status.")
print(f"Dependency chains: {len(deps)}")
print(f"Next actions set: {len(next_actions)}")
print(f"Items with dates: {len(date_data)}")
