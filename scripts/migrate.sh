#!/usr/bin/env bash

# backup-migration.sh - Safe migration for Journey roadmaps

set -e

JOURNEY_HOME="$HOME/.journey"
DATA_DIR="$JOURNEY_HOME/data"
LOCAL_DATA_DIR="$(dirname "$0")/../data"

echo "🌌 Journey Data Migration Utility"
echo "---------------------------------"

# Create target dir
mkdir -p "$DATA_DIR"

if [ -f "$LOCAL_DATA_DIR/roadmap.json" ]; then
    echo "📦 Found local roadmap at $LOCAL_DATA_DIR/roadmap.json"
    
    if [ -f "$DATA_DIR/roadmap.json" ]; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        echo "⚠️  Global roadmap already exists. Backing up existing global data to roadmap.json.bak_$TIMESTAMP"
        cp "$DATA_DIR/roadmap.json" "$DATA_DIR/roadmap.json.bak_$TIMESTAMP"
    fi
    
    echo "🚚 Migrating local roadmap to $DATA_DIR/roadmap.json..."
    cp "$LOCAL_DATA_DIR/roadmap.json" "$DATA_DIR/roadmap.json"
    echo "✅ Migration successful!"
else
    echo "ℹ️  No local roadmap found in $LOCAL_DATA_DIR. Nothing to migrate."
fi

echo ""
echo "Your roadmap is now safely stored in: $JOURNEY_HOME"
echo "Package updates will no longer overwrite your progress."
