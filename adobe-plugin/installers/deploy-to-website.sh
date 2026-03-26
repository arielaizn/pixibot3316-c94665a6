#!/bin/bash
set -e

# Deploy installers to Pixibot website
echo "📤 Deploying installers to Pixibot website..."

WEBSITE_DIR="/Users/a1234/pixibot3316/public/downloads"

# Create downloads directory if it doesn't exist
mkdir -p "$WEBSITE_DIR"

# Copy installers
if [ -f "pixibot-adobe-plugin.zxp" ]; then
  cp pixibot-adobe-plugin.zxp "$WEBSITE_DIR/"
  echo "✓ Copied pixibot-adobe-plugin.zxp"
fi

if [ -f "mac/Pixibot-Adobe-Plugin-Mac.pkg" ]; then
  cp mac/Pixibot-Adobe-Plugin-Mac.pkg "$WEBSITE_DIR/"
  echo "✓ Copied Pixibot-Adobe-Plugin-Mac.pkg"
fi

if [ -f "windows/Pixibot-Adobe-Plugin-Windows.exe" ]; then
  cp windows/Pixibot-Adobe-Plugin-Windows.exe "$WEBSITE_DIR/"
  echo "✓ Copied Pixibot-Adobe-Plugin-Windows.exe"
elif [ -f "windows/Pixibot-Adobe-Plugin-Windows.zip" ]; then
  cp windows/Pixibot-Adobe-Plugin-Windows.zip "$WEBSITE_DIR/"
  echo "✓ Copied Pixibot-Adobe-Plugin-Windows.zip"
fi

echo ""
echo "✅ Deployment complete!"
echo "Files deployed to: $WEBSITE_DIR"
echo ""
echo "Access via:"
echo "  https://pixibot.app/downloads/pixibot-adobe-plugin.zxp"
echo "  https://pixibot.app/downloads/Pixibot-Adobe-Plugin-Mac.pkg"
echo "  https://pixibot.app/downloads/Pixibot-Adobe-Plugin-Windows.exe"
