#!/usr/bin/env python3
"""
Reclassify the personal roadmap with real metadata:

- learning_depth: master | working | awareness
- priority: critical | high | medium | low
- horizon: 3_months | 6_months | 12_months | 2_years | 5_years
- career_roi: very_high | high | medium | low
- interview_value: 1-10
- engineering_value: 1-10
- track assignment

Also creates top-level domains[], goals[], tracks[].
"""

import json
import os
import re

DATA_PATH = os.path.expanduser("~/.journey/data/roadmap.json")

with open(DATA_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

# ── Track definitions ──────────────────────────────────────────

TRACKS = [
    {"id": "skills", "title": "Skills", "icon": "book", "color": "#22c55e"},
    {"id": "projects", "title": "Projects", "icon": "rocket", "color": "#3b82f6"},
    {"id": "dsa_interviews", "title": "DSA & Interviews", "icon": "code", "color": "#f97316"},
    {"id": "system_design", "title": "System Design", "icon": "server", "color": "#8b5cf6"},
    {"id": "ai_engineering", "title": "AI Engineering", "icon": "brain", "color": "#ec4899"},
    {"id": "backend_cloud_infra", "title": "Backend / Cloud / Infra", "icon": "cloud", "color": "#06b6d4"},
    {"id": "portfolio_resume", "title": "Portfolio / GitHub / Resume", "icon": "target", "color": "#eab308"},
    {"id": "applications_networking", "title": "Applications / Networking", "icon": "users", "color": "#6366f1"},
    {"id": "health_fitness", "title": "Health & Fitness", "icon": "heart", "color": "#ef4444"},
]

GOALS = [
    {
        "id": "goal_career_50lpa",
        "title": "Reach Top-Tier AI / Software Engineering Role (₹50LPA+ Target)",
        "description": "Master systems design, AI engineering, and backend infrastructure. Build a standout portfolio. Ace interviews at top tech companies for a ₹50LPA+ role.",
        "domain": "career",
        "target_date": "2027-07",
        "status": "active",
        "horizon": "12_months",
        "icon": "target",
        "tracks": ["skills", "projects", "dsa_interviews", "system_design", "ai_engineering", "backend_cloud_infra", "portfolio_resume", "applications_networking"],
    },
    {
        "id": "goal_health_physical",
        "title": "Build Peak Physical & Mental Condition",
        "description": "Optimize nutrition, calisthenics, recovery, and aesthetics for sustained high performance.",
        "domain": "health",
        "target_date": "2027-07",
        "status": "active",
        "horizon": "12_months",
        "icon": "heart",
        "tracks": ["health_fitness"],
    },
]

DOMAINS = [
    {"id": "career", "title": "Career", "icon": "briefcase", "color": "#3b82f6"},
    {"id": "health", "title": "Health & Fitness", "icon": "heart", "color": "#ef4444"},
    {"id": "finance", "title": "Finance", "icon": "wallet", "color": "#22c55e"},
    {"id": "personal", "title": "Personal Growth", "icon": "compass", "color": "#8b5cf6"},
]

# ── Classification map: item_id → metadata overrides ──────────
# Only set explicit values; items not listed get defaults below.

CLASSIFICATION: dict[str, dict] = {
    # ═══════════════════════════════════════════════════════════
    # Critical / Master / 3M-12M — highest priority, deep mastery
    # ═══════════════════════════════════════════════════════════

    # DSA
    "l1_dsa_rust_arrays": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 10, "engineering_value": 8, "track": "dsa_interviews"},
    "l1_dsa_rust_logic": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 10, "engineering_value": 8, "track": "dsa_interviews"},
    "l2_dsa_rust_complex": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 10, "engineering_value": 8, "track": "dsa_interviews"},

    # System Design
    "l1_sd_fundamentals": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 9, "engineering_value": 9, "track": "system_design"},
    "l1_sd_distributed": {"learning_depth": "master", "priority": "critical", "horizon": "6_months", "career_roi": "very_high", "interview_value": 9, "engineering_value": 9, "track": "system_design"},
    "l1_sd_scalable": {"learning_depth": "master", "priority": "critical", "horizon": "6_months", "career_roi": "very_high", "interview_value": 9, "engineering_value": 9, "track": "system_design"},
    "l1_sd_real_world": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "high", "interview_value": 8, "engineering_value": 8, "track": "system_design"},

    # Python (master)
    "l1_python_cpp": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 8, "engineering_value": 8, "track": "skills"},

    # TypeScript/JS
    "js_ts_core": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 7, "engineering_value": 7, "track": "skills"},
    "js_react_next": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "high", "interview_value": 6, "engineering_value": 7, "track": "skills"},
    "js_browser_deep": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 5, "engineering_value": 6, "track": "skills"},
    "js_ts_eco": {"learning_depth": "working", "priority": "high", "horizon": "6_months", "career_roi": "high", "interview_value": 6, "engineering_value": 7, "track": "skills"},

    # Rust
    "l1_rust_phase0": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 8, "engineering_value": 9, "track": "skills"},
    "l1_rust_mastery": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "high", "interview_value": 7, "engineering_value": 9, "track": "skills"},
    "l2_rust_numerical": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 5, "engineering_value": 7, "track": "skills"},
    "l3_rust_dl": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 4, "engineering_value": 8, "track": "ai_engineering"},

    # Backend engineering
    "l1_project_discipline": {"learning_depth": "master", "priority": "high", "horizon": "3_months", "career_roi": "very_high", "interview_value": 6, "engineering_value": 7, "track": "backend_cloud_infra"},
    "l1_communication_skills": {"learning_depth": "working", "priority": "high", "horizon": "6_months", "career_roi": "high", "interview_value": 8, "engineering_value": 4, "track": "applications_networking"},
    "l1_infra_scale": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "high", "interview_value": 7, "engineering_value": 8, "track": "backend_cloud_infra"},

    # Databases
    "l17_cs_databases": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 8, "engineering_value": 8, "track": "skills"},

    # Linux / OS / Networking
    "l17_cs_os": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "high", "interview_value": 7, "engineering_value": 8, "track": "skills"},
    "l17_cs_networking": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 8, "engineering_value": 8, "track": "skills"},

    # Web protocols & security
    "l1_web_protocols": {"learning_depth": "working", "priority": "high", "horizon": "6_months", "career_roi": "high", "interview_value": 7, "engineering_value": 7, "track": "backend_cloud_infra"},
    "l1_auth_sec": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "very_high", "interview_value": 8, "engineering_value": 7, "track": "backend_cloud_infra"},

    # AI Engineering
    "l3_nn_theory": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 8, "engineering_value": 8, "track": "ai_engineering"},
    "l3_transformers": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 8, "engineering_value": 8, "track": "ai_engineering"},
    "l3_frameworks": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "very_high", "interview_value": 7, "engineering_value": 7, "track": "ai_engineering"},
    "l3_nlp_llm": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 8, "engineering_value": 8, "track": "ai_engineering"},
    "l3_agentic": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 9, "engineering_value": 8, "track": "ai_engineering"},
    "l3_computer_vision": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 5, "engineering_value": 6, "track": "ai_engineering"},

    # Math/ML foundations
    "l2_linear_algebra": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "high", "interview_value": 7, "engineering_value": 8, "track": "ai_engineering"},
    "l2_calculus": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 5, "engineering_value": 7, "track": "ai_engineering"},
    "l2_prob_stat": {"learning_depth": "working", "priority": "high", "horizon": "6_months", "career_roi": "high", "interview_value": 7, "engineering_value": 7, "track": "ai_engineering"},
    "l2_ml_core": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "very_high", "interview_value": 7, "engineering_value": 7, "track": "ai_engineering"},
    "l2_ml_theory": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 5, "engineering_value": 7, "track": "ai_engineering"},
    "l2_data_eng": {"learning_depth": "working", "priority": "high", "horizon": "6_months", "career_roi": "high", "interview_value": 6, "engineering_value": 6, "track": "ai_engineering"},

    # Cloud / Docker / Infra
    "l7_cloud_platforms": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "very_high", "interview_value": 7, "engineering_value": 7, "track": "backend_cloud_infra"},

    # Go (Working, not Master)
    "l1_golang": {"learning_depth": "working", "priority": "high", "horizon": "6_months", "career_roi": "high", "interview_value": 6, "engineering_value": 7, "track": "skills"},

    # Browser APIs (Awareness for deep, Working for basics)
    "l1_browser_apis": {"learning_depth": "awareness", "priority": "low", "horizon": "2_years", "career_roi": "low", "interview_value": 3, "engineering_value": 5, "track": "skills"},

    # Portfolio / Resume / Career prep
    "l2_portfolio_building": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 5, "engineering_value": 5, "track": "portfolio_resume"},
    "l17_resume_impact": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 5, "engineering_value": 3, "track": "portfolio_resume"},
    "l17_oss_projects": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 7, "engineering_value": 8, "track": "projects"},

    # Interview prep (all critical)
    "l17_sd_primer": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 9, "engineering_value": 8, "track": "dsa_interviews"},
    "l17_sd_alex_xu": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 9, "engineering_value": 8, "track": "dsa_interviews"},
    "l17_bytebytego": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "very_high", "interview_value": 8, "engineering_value": 7, "track": "dsa_interviews"},
    "l17_ood_practice": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "high", "interview_value": 7, "engineering_value": 6, "track": "dsa_interviews"},
    "l17_mock_interviews": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "very_high", "interview_value": 9, "engineering_value": 4, "track": "dsa_interviews"},
    "l17_comm_mastery": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "very_high", "interview_value": 9, "engineering_value": 3, "track": "dsa_interviews"},
    "l17_star_method": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "high", "interview_value": 8, "engineering_value": 2, "track": "dsa_interviews"},
    "l17_leadership_principles": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 6, "engineering_value": 2, "track": "dsa_interviews"},
    "l17_project_deep_dives": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "very_high", "interview_value": 8, "engineering_value": 6, "track": "dsa_interviews"},
    "l17_career_myths": {"learning_depth": "master", "priority": "high", "horizon": "3_months", "career_roi": "very_high", "interview_value": 6, "engineering_value": 2, "track": "applications_networking"},
    "l17_dsa_ai_myths": {"learning_depth": "master", "priority": "high", "horizon": "3_months", "career_roi": "very_high", "interview_value": 7, "engineering_value": 3, "track": "dsa_interviews"},

    # ═══════════════════════════════════════════════════════════
    # Working / 6M-12M — good to know, practical
    # ═══════════════════════════════════════════════════════════

    # Web3 / Blockchain (Working, not Master - secondary focus)
    "l4_eth_evm": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 4, "engineering_value": 6, "track": "projects"},
    "l4_solidity_sec": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 4, "engineering_value": 6, "track": "projects"},
    "l4_l2_scaling": {"learning_depth": "working", "priority": "low", "horizon": "2_years", "career_roi": "medium", "interview_value": 3, "engineering_value": 5, "track": "projects"},
    "l4_alt_vms": {"learning_depth": "working", "priority": "low", "horizon": "12_months", "career_roi": "medium", "interview_value": 3, "engineering_value": 6, "track": "projects"},
    "l4_dapp_arch": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 4, "engineering_value": 5, "track": "projects"},
    "l4_defi_primitives": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 4, "engineering_value": 6, "track": "projects"},

    # Layer 12: JS/TS for dApps (Working, practical)
    # Already handled above

    # Layer 13: Blockchain + Ethereum + Solidity
    "l13_evm_solidity": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 4, "engineering_value": 6, "track": "projects"},
    "l13_dev_frameworks": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 4, "engineering_value": 5, "track": "projects"},
    "l13_contract_standards": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 4, "engineering_value": 6, "track": "projects"},
    "l13_defi_protocols": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 4, "engineering_value": 6, "track": "projects"},

    # Layer 14: DApp + Full-Stack Integration
    "l14_wallets_auth": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 4, "engineering_value": 5, "track": "projects"},
    "l14_ethers_viem": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 4, "engineering_value": 5, "track": "projects"},
    "l14_decentralized_storage": {"learning_depth": "working", "priority": "low", "horizon": "2_years", "career_roi": "low", "interview_value": 3, "engineering_value": 5, "track": "projects"},
    "l14_fullstack_dapp": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 4, "engineering_value": 6, "track": "projects"},

    # Layer 15: AI + Web3 Combination
    "l15_ai_auditor": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 4, "engineering_value": 6, "track": "ai_engineering"},
    "l15_ai_trading_bots": {"learning_depth": "working", "priority": "low", "horizon": "12_months", "career_roi": "low", "interview_value": 3, "engineering_value": 6, "track": "projects"},
    "l15_ai_dapp_builder": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 4, "engineering_value": 6, "track": "projects"},
    "l15_zk_ml": {"learning_depth": "awareness", "priority": "low", "horizon": "2_years", "career_roi": "medium", "interview_value": 3, "engineering_value": 7, "track": "ai_engineering"},

    # Layer 16: Security, Testing & Professional Depth
    "l16_contract_security": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 4, "engineering_value": 6, "track": "backend_cloud_infra"},
    "l16_web_security": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "high", "interview_value": 7, "engineering_value": 7, "track": "backend_cloud_infra"},
    "l16_advanced_testing": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 5, "engineering_value": 6, "track": "backend_cloud_infra"},

    # ═══════════════════════════════════════════════════════════
    # Awareness / 2Y-5Y — long-term exploration
    # ═══════════════════════════════════════════════════════════

    # AI x Web3 frontier
    "l5_zkml": {"learning_depth": "awareness", "priority": "low", "horizon": "2_years", "career_roi": "medium", "interview_value": 3, "engineering_value": 8, "track": "ai_engineering"},
    "l5_decent_compute": {"learning_depth": "awareness", "priority": "low", "horizon": "2_years", "career_roi": "medium", "interview_value": 2, "engineering_value": 7, "track": "ai_engineering"},
    "l5_tee_fhe": {"learning_depth": "awareness", "priority": "low", "horizon": "2_years", "career_roi": "low", "interview_value": 2, "engineering_value": 7, "track": "ai_engineering"},
    "l5_ai_oracles": {"learning_depth": "awareness", "priority": "low", "horizon": "2_years", "career_roi": "medium", "interview_value": 3, "engineering_value": 6, "track": "ai_engineering"},

    # Autonomous agents / high-performance runtimes
    "l6_runtimes": {"learning_depth": "awareness", "priority": "low", "horizon": "2_years", "career_roi": "medium", "interview_value": 3, "engineering_value": 8, "track": "ai_engineering"},
    "l6_multi_agent": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "high", "interview_value": 5, "engineering_value": 7, "track": "ai_engineering"},
    "l6_cuda_opt": {"learning_depth": "awareness", "priority": "low", "horizon": "2_years", "career_roi": "low", "interview_value": 3, "engineering_value": 9, "track": "ai_engineering"},

    # Post-state / cryptographic AI
    "l7_zk_pipelines": {"learning_depth": "awareness", "priority": "low", "horizon": "5_years", "career_roi": "low", "interview_value": 2, "engineering_value": 8, "track": "ai_engineering"},
    "l7_privacy_infra": {"learning_depth": "awareness", "priority": "low", "horizon": "5_years", "career_roi": "low", "interview_value": 2, "engineering_value": 7, "track": "ai_engineering"},

    # ═══════════════════════════════════════════════════════════
    # Health & Fitness layers (under health domain)
    # ═══════════════════════════════════════════════════════════

    "l8_nutrition_surplus": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "high", "interview_value": 1, "engineering_value": 1, "track": "health_fitness"},
    "l8_macro_optimization": {"learning_depth": "working", "priority": "high", "horizon": "6_months", "career_roi": "medium", "interview_value": 1, "engineering_value": 1, "track": "health_fitness"},
    "l8_hydration_electrolytes": {"learning_depth": "working", "priority": "high", "horizon": "3_months", "career_roi": "medium", "interview_value": 1, "engineering_value": 1, "track": "health_fitness"},
    "l8_gut_health": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 1, "engineering_value": 1, "track": "health_fitness"},

    "l9_calisthenics_v_taper": {"learning_depth": "master", "priority": "critical", "horizon": "3_months", "career_roi": "medium", "interview_value": 1, "engineering_value": 2, "track": "health_fitness"},
    "l9_mobility_flexibility": {"learning_depth": "working", "priority": "high", "horizon": "6_months", "career_roi": "medium", "interview_value": 1, "engineering_value": 1, "track": "health_fitness"},
    "l9_posture_alignment": {"learning_depth": "working", "priority": "high", "horizon": "6_months", "career_roi": "medium", "interview_value": 1, "engineering_value": 1, "track": "health_fitness"},
    "l9_recovery_protocols": {"learning_depth": "working", "priority": "high", "horizon": "6_months", "career_roi": "medium", "interview_value": 1, "engineering_value": 1, "track": "health_fitness"},

    "l10_medicated_treatment": {"learning_depth": "master", "priority": "high", "horizon": "6_months", "career_roi": "low", "interview_value": 1, "engineering_value": 1, "track": "health_fitness"},
    "l10_scalp_microcirculation": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "low", "interview_value": 1, "engineering_value": 1, "track": "health_fitness"},
    "l10_nutrient_support": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "low", "interview_value": 1, "engineering_value": 1, "track": "health_fitness"},
    "l10_stress_management": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "low", "interview_value": 1, "engineering_value": 1, "track": "health_fitness"},

    "l11_facial_architecture": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 1, "engineering_value": 1, "track": "health_fitness"},
    "l11_hair_volume_styling": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 1, "engineering_value": 1, "track": "health_fitness"},
    "l11_skin_health_complexion": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 1, "engineering_value": 1, "track": "health_fitness"},
    "l11_wardrobe_personal_branding": {"learning_depth": "working", "priority": "medium", "horizon": "12_months", "career_roi": "medium", "interview_value": 1, "engineering_value": 1, "track": "health_fitness"},
}

# ── Apply classifications ──────────────────────────────────────

def set_meta(item: dict, key: str, val):
    """Set both flat field and metadata block."""
    item[key] = val
    if "metadata" not in item:
        item["metadata"] = {}
    item["metadata"][key] = val

for layer in data["layers"]:
    for item in layer["items"]:
        iid = item["id"]
        if iid in CLASSIFICATION:
            cls = CLASSIFICATION[iid]
            # Set the new-style fields
            set_meta(item, "learning_depth", cls.get("learning_depth", "working"))
            set_meta(item, "priority", cls.get("priority", "medium"))
            set_meta(item, "horizon", cls.get("horizon", "12_months"))
            set_meta(item, "career_roi", cls.get("career_roi", "medium"))
            set_meta(item, "interview_value", cls.get("interview_value", 5))
            set_meta(item, "engineering_value", cls.get("engineering_value", 5))
            item["track"] = cls.get("track", "skills")
        else:
            # Default for unclassified items
            set_meta(item, "learning_depth", "working")
            set_meta(item, "priority", "medium")
            set_meta(item, "horizon", "12_months")
            set_meta(item, "career_roi", "medium")
            set_meta(item, "interview_value", 5)
            set_meta(item, "engineering_value", 5)
            item["track"] = "skills"

# ── Clean up old metadata fields ───────────────────────────────
# Remove stale old-format `priority` from metadata (the old "master"/"working"/"awareness")
# since we now have learning_depth for that concept and a new priority type.
# We keep `priority` in flat fields (as the new critical/high/medium/low).

for layer in data["layers"]:
    for item in layer["items"]:
        meta = item.get("metadata", {})
        # The old `priority` in metadata meant learning_depth — rename it if it still uses old values
        if meta.get("priority") in ("master", "working", "awareness"):
            # Already superseded by new `learning_depth` and `priority`
            if "learning_depth" not in meta:
                meta["learning_depth"] = meta["priority"]
            del meta["priority"]

# ── Set tracks on layer level too ──────────────────────────────

LAYER_TRACKS = {
    "layer1": "skills",
    "layer2": "ai_engineering",
    "layer3": "ai_engineering",
    "layer4": "projects",
    "layer5": "ai_engineering",
    "layer6": "ai_engineering",
    "layer7": "ai_engineering",
    "layer8": "health_fitness",
    "layer9": "health_fitness",
    "layer10": "health_fitness",
    "layer11": "health_fitness",
    "layer12": "skills",
    "layer13": "projects",
    "layer14": "projects",
    "layer15": "ai_engineering",
    "layer16": "backend_cloud_infra",
    "layer17": "dsa_interviews",
}

for layer in data["layers"]:
    ltrack = LAYER_TRACKS.get(layer["id"], "skills")
    layer["track"] = ltrack

# ── Write top-level structures ─────────────────────────────────

data["domains"] = DOMAINS
data["goals"] = GOALS
data["tracks"] = TRACKS
data["version"] = "v3"

# ── Write output ───────────────────────────────────────────────

with open(DATA_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"✓ Reclassified {sum(len(l['items']) for l in data['layers'])} items across {len(data['layers'])} layers")
print(f"  Domains: {len(DOMAINS)}")
print(f"  Goals: {len(GOALS)}")
print(f"  Tracks: {len(TRACKS)}")

# Stats
for depth in ["master", "working", "awareness"]:
    count = sum(1 for l in data["layers"] for i in l["items"] if i.get("learning_depth") == depth)
    print(f"  {depth}: {count} items")
for pri in ["critical", "high", "medium", "low"]:
    count = sum(1 for l in data["layers"] for i in l["items"] if i.get("priority") == pri)
    print(f"  priority={pri}: {count} items")
