#!/bin/bash

# setup.sh - Robust installation script for Journey

set -e

echo "===================================================="
echo "🚀 Welcome to Journey (Unified Mastery Engine) Setup"
echo "===================================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js (v18+) and try again."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js version 18 or higher is required. You have v$NODE_VERSION."
    exit 1
fi
echo "✅ Node.js detected (v$NODE_VERSION)"

# Determine the best package manager
PM="npm"
if command -v bun &> /dev/null; then
    PM="bun"
elif command -v pnpm &> /dev/null; then
    PM="pnpm"
elif command -v yarn &> /dev/null; then
    PM="yarn"
fi
echo "✅ Using package manager: $PM"

echo ""
echo "📦 Installing dependencies..."
if [ "$PM" = "bun" ]; then
    bun install
elif [ "$PM" = "pnpm" ]; then
    pnpm install
elif [ "$PM" = "yarn" ]; then
    yarn install
else
    npm install
fi

echo ""
echo "🏗️  Building the project..."
if [ "$PM" = "bun" ]; then
    bun run build
elif [ "$PM" = "pnpm" ]; then
    pnpm run build
elif [ "$PM" = "yarn" ]; then
    yarn build
else
    npm run build
fi

echo ""
echo "===================================================="
echo "✨ Setup Complete!"
echo "===================================================="
echo ""
echo "To start the development server, run:"
echo "  $PM run dev"
echo ""
echo "To start the production server, run:"
echo "  $PM start"
echo ""
echo "Your roadmap data is located in data/roadmap.json"
echo "Happy building!"
