#!/bin/bash
set -e

# Development Deployment Script
# Installs the plugin directly to CEP extensions folder for testing

echo "🚀 Deploying Pixibot Plugin for Development..."

cd "$(dirname "$0")/.."

# Build first
./lib/build.sh

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
  # Mac
  CEP_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
  # Windows
  CEP_DIR="$APPDATA/Adobe/CEP/extensions"
else
  echo "❌ Unsupported OS: $OSTYPE"
  exit 1
fi

PLUGIN_DIR="$CEP_DIR/com.pixibot.adobe.plugin"

echo "📂 Installing to: $PLUGIN_DIR"

# Create CEP directory if needed
mkdir -p "$CEP_DIR"

# Remove old installation
if [ -d "$PLUGIN_DIR" ]; then
  echo "🗑️  Removing old installation..."
  rm -rf "$PLUGIN_DIR"
fi

# Copy plugin
echo "📋 Copying plugin files..."
cp -r dist "$PLUGIN_DIR"

# Enable debug mode
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "🔧 Enabling CEP debug mode..."
  defaults write com.adobe.CSXS.9 PlayerDebugMode 1
  defaults write com.adobe.CSXS.10 PlayerDebugMode 1
  defaults write com.adobe.CSXS.11 PlayerDebugMode 1
fi

echo "✅ Plugin deployed successfully!"
echo ""
echo "To test:"
echo "  1. Restart Premiere Pro or After Effects"
echo "  2. Window → Extensions → Pixibot"
echo "  3. Open DevTools: Right-click panel → Inspect"
