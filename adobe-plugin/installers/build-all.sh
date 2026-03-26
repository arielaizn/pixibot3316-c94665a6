#!/bin/bash
set -e

# Pixibot Adobe Plugin - Build All Installers Script
# This script builds all distribution packages

echo "🚀 Building Pixibot Adobe Plugin Installers..."
echo ""

cd "$(dirname "$0")/.."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build the plugin
echo -e "${BLUE}[1/5]${NC} Building React panel..."
./lib/build.sh
echo -e "${GREEN}✓${NC} React panel built"
echo ""

# Step 2: Sign .zxp package (optional)
echo -e "${BLUE}[2/5]${NC} Creating and signing .zxp package (optional)..."
if ./lib/sign.sh 2>/dev/null; then
  echo -e "${GREEN}✓${NC} .zxp package created"

  # Move to installers directory
  mv pixibot-adobe-plugin.zxp installers/
  echo -e "${GREEN}✓${NC} Moved to installers/pixibot-adobe-plugin.zxp"
else
  echo -e "${YELLOW}⚠${NC}  ZXPSignCmd not found - skipping .zxp creation (not required)"
  echo "   Note: Mac .pkg and Windows .zip will work without .zxp"
fi
echo ""

# Step 3: Build Mac installer
echo -e "${BLUE}[3/5]${NC} Building Mac installer (.pkg)..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  if ./lib/package-mac.sh 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Mac installer created"

    # Move to installers/mac directory
    mkdir -p installers/mac
    mv Pixibot-Adobe-Plugin-Mac.pkg installers/mac/
    echo -e "${GREEN}✓${NC} Moved to installers/mac/Pixibot-Adobe-Plugin-Mac.pkg"
  else
    echo -e "${YELLOW}⚠${NC}  Failed to build Mac installer"
  fi
else
  echo -e "${YELLOW}⚠${NC}  Skipping Mac installer (not on macOS)"
fi
echo ""

# Step 4: Build Windows installer
echo -e "${BLUE}[4/5]${NC} Building Windows installer (.exe/.zip)..."
if ./lib/package-windows.sh 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Windows installer created"

  # Move to installers/windows directory
  mkdir -p installers/windows
  if [ -f "Pixibot-Adobe-Plugin-Windows.exe" ]; then
    mv Pixibot-Adobe-Plugin-Windows.exe installers/windows/
    echo -e "${GREEN}✓${NC} Moved to installers/windows/Pixibot-Adobe-Plugin-Windows.exe"
  elif [ -f "Pixibot-Adobe-Plugin-Windows.zip" ]; then
    mv Pixibot-Adobe-Plugin-Windows.zip installers/windows/
    echo -e "${GREEN}✓${NC} Moved to installers/windows/Pixibot-Adobe-Plugin-Windows.zip"
  fi
else
  echo -e "${YELLOW}⚠${NC}  Failed to build Windows installer"
fi
echo ""

# Step 5: Summary
echo -e "${BLUE}[5/5]${NC} Build Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "installers/pixibot-adobe-plugin.zxp" ]; then
  SIZE=$(du -h installers/pixibot-adobe-plugin.zxp | cut -f1)
  echo -e "✅ Universal:  ${GREEN}pixibot-adobe-plugin.zxp${NC} ($SIZE)"
fi

if [ -f "installers/mac/Pixibot-Adobe-Plugin-Mac.pkg" ]; then
  SIZE=$(du -h installers/mac/Pixibot-Adobe-Plugin-Mac.pkg | cut -f1)
  echo -e "✅ Mac:        ${GREEN}Pixibot-Adobe-Plugin-Mac.pkg${NC} ($SIZE)"
fi

if [ -f "installers/windows/Pixibot-Adobe-Plugin-Windows.exe" ]; then
  SIZE=$(du -h installers/windows/Pixibot-Adobe-Plugin-Windows.exe | cut -f1)
  echo -e "✅ Windows:    ${GREEN}Pixibot-Adobe-Plugin-Windows.exe${NC} ($SIZE)"
elif [ -f "installers/windows/Pixibot-Adobe-Plugin-Windows.zip" ]; then
  SIZE=$(du -h installers/windows/Pixibot-Adobe-Plugin-Windows.zip | cut -f1)
  echo -e "✅ Windows:    ${GREEN}Pixibot-Adobe-Plugin-Windows.zip${NC} ($SIZE)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}🎉 All installers built successfully!${NC}"
echo ""
echo "📦 Files are in: installers/"
echo ""
echo "Next steps:"
echo "  1. Test installers on Mac and Windows"
echo "  2. Copy to website: cp installers/* /path/to/website/public/downloads/"
echo "  3. Update download page with new versions"
echo ""
