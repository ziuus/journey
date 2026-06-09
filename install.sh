#!/usr/bin/env bash

set -e

echo "🚀 Installing Journey..."

# Ensure we are in the project directory
cd "$(dirname "$0")"

echo "📦 Installing dependencies..."
pnpm install

echo "🏗️ Building the portal..."
pnpm run build

echo "🔗 Linking CLI commands globally..."
npm link

echo "✅ Installation complete!"
echo ""
echo "You can now use the following commands from anywhere:"
echo "  start-roadmap   - Launches the Journey portal on port 6060"
echo "  journey-mcp     - Starts the MCP server for agentic control"
echo ""
echo "To start the portal now, run: start-roadmap"
