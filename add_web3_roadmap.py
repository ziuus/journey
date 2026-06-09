import json

filepath = "/home/zius/Projects/journey/data/roadmap.json"

with open(filepath, "r") as f:
    data = json.load(f)

new_layers = [
    {
        "id": "layer13",
        "title": "Layer 13 — Blockchain + Ethereum + Solidity",
        "description": "Mastering the EVM, smart contracts, and decentralized protocols.",
        "items": [
            {
                "id": "l13_evm_solidity",
                "title": "EVM Fundamentals & Solidity",
                "status": "pending",
                "notes": "Learn how Ethereum Virtual Machine works, storage vs memory, gas optimization, smart contract lifecycles."
            },
            {
                "id": "l13_dev_frameworks",
                "title": "Development Frameworks (Foundry/Hardhat)",
                "status": "pending",
                "notes": "Write, test, and deploy contracts using Foundry (Rust-based) or Hardhat."
            },
            {
                "id": "l13_contract_standards",
                "title": "Smart Contract Standards",
                "status": "pending",
                "notes": "Master OpenZeppelin ERC20, ERC721 (NFTs), ERC1155, Access Control, Upgradable Contracts."
            },
            {
                "id": "l13_defi_protocols",
                "title": "DeFi Protocols (Uniswap, Aave, Compound)",
                "status": "pending",
                "notes": "Study the mathematical models, AMM (Automated Market Makers), Liquidity Pools, and Flash Loans."
            }
        ]
    },
    {
        "id": "layer14",
        "title": "Layer 14 — DApp + Full-Stack Integration",
        "description": "Connecting the blockchain to modern web interfaces.",
        "items": [
            {
                "id": "l14_wallets_auth",
                "title": "Web3 Wallets & Authentication",
                "status": "pending",
                "notes": "Connect Metamask/WalletConnect, integrate NextAuth with SIWE (Sign In With Ethereum)."
            },
            {
                "id": "l14_ethers_viem",
                "title": "Ethers.js / Viem / Wagmi",
                "status": "pending",
                "notes": "Interact with smart contracts from frontend, listen to blockchain events, call state variables."
            },
            {
                "id": "l14_decentralized_storage",
                "title": "Decentralized Storage & Off-chain Data",
                "status": "pending",
                "notes": "IPFS, Arweave, Graph Protocol (Subgraphs) for querying indexed blockchain data."
            },
            {
                "id": "l14_fullstack_dapp",
                "title": "Full-Stack DApp Architecture",
                "status": "pending",
                "notes": "Build complete Next.js DApps integrating smart contracts, React Query for on-chain state, and Prisma/PostgreSQL for off-chain state."
            }
        ]
    },
    {
        "id": "layer15",
        "title": "Layer 15 — AI + Web3 Combination",
        "description": "Merging Artificial Intelligence with Decentralized Technologies.",
        "items": [
            {
                "id": "l15_ai_auditor",
                "title": "AI Smart Contract Auditor",
                "status": "pending",
                "notes": "Build a tool using LLMs to scan Solidity code, find vulnerabilities, and suggest optimizations."
            },
            {
                "id": "l15_ai_trading_bots",
                "title": "AI-Driven Trading Bots",
                "status": "pending",
                "notes": "Create algorithms predicting token prices and executing trades directly via DeFi APIs."
            },
            {
                "id": "l15_ai_dapp_builder",
                "title": "AI DApp Builder/Copilot",
                "status": "pending",
                "notes": "A specialized copilot helping developers write EVM contracts and frontend integration automatically."
            },
            {
                "id": "l15_zk_ml",
                "title": "ZK-ML (Zero-Knowledge Machine Learning)",
                "status": "pending",
                "notes": "Verify ML model inferences on-chain without revealing data or weights (advanced)."
            }
        ]
    },
    {
        "id": "layer16",
        "title": "Layer 16 — Security, Testing & Professional Depth",
        "description": "Securing applications and professional-grade testing.",
        "items": [
            {
                "id": "l16_contract_security",
                "title": "Smart Contract Security",
                "status": "pending",
                "notes": "Reentrancy, Front-Running, Oracle Manipulation, Flash Loan attacks, Slither, Mythril."
            },
            {
                "id": "l16_web_security",
                "title": "Web Security Fundamentals",
                "status": "pending",
                "notes": "OWASP Top 10, CORS, XSS, CSRF."
            },
            {
                "id": "l16_advanced_testing",
                "title": "Advanced Testing & CI/CD",
                "status": "pending",
                "notes": "Foundry fuzz testing, invariant testing, GitHub actions for Web3/AI projects."
            }
        ]
    }
]

data["layers"].extend(new_layers)

if "Applied AI + Web3 Full-Stack Engineer" not in data.get("target_roles", []):
    data["target_roles"].append("Applied AI + Web3 Full-Stack Engineer")

with open(filepath, "w") as f:
    json.dump(data, f, indent=2)

print("Updated roadmap.json successfully!")
