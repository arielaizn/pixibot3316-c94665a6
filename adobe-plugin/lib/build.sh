#!/bin/bash
set -e

# Pixibot Adobe Plugin Build Script
echo "🚀 Building Pixibot Adobe Plugin..."

cd "$(dirname "$0")/.."

# Build React panel
echo "📦 Building React panel..."
cd client
npm install
npm run build
cd ..

# Create dist directory
echo "📂 Creating distribution directory..."
rm -rf dist
mkdir -p dist/client dist/host dist/icons dist/CSXS

# Copy files
echo "📋 Copying files..."
cp -r client/dist/* dist/client/
cp host/*.jsx dist/host/
cp manifest.xml dist/
cp .debug dist/
cp -r icons/* dist/icons/ 2>/dev/null || echo "⚠️  No icons found, skipping..."

# Create CSXS manifest symlink
ln -sf ../manifest.xml dist/CSXS/manifest.xml

echo "✅ Build complete: dist/"
echo ""
echo "Next steps:"
echo "  1. Run ./lib/sign.sh to create .zxp package"
echo "  2. Run ./lib/package-mac.sh to create Mac installer"
echo "  3. Run ./lib/package-windows.sh to create Windows installer"
