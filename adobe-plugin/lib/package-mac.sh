#!/bin/bash
set -e

# Mac Installer (.pkg) Creation Script
echo "🍎 Creating Mac Installer for Pixibot Adobe Plugin..."

cd "$(dirname "$0")/.."

PLUGIN_NAME="Pixibot"
PLUGIN_VERSION="1.0.0"
PLUGIN_ID="com.pixibot.adobe.plugin"
PKG_NAME="Pixibot-Adobe-Plugin-Mac.pkg"

# Ensure dist exists
if [ ! -d "dist" ]; then
  echo "❌ dist/ folder not found! Run ./lib/build.sh first"
  exit 1
fi

# Create temp directory structure
TEMP_DIR=$(mktemp -d)
PKG_ROOT="$TEMP_DIR/root"
PLUGIN_DIR="$PKG_ROOT/Library/Application Support/Adobe/CEP/extensions/$PLUGIN_ID"
mkdir -p "$PLUGIN_DIR"

# Copy dist contents to plugin directory
echo "📦 Copying plugin files..."
cp -r dist/* "$PLUGIN_DIR/"

# Create postinstall script
SCRIPTS_DIR="$TEMP_DIR/scripts"
mkdir -p "$SCRIPTS_DIR"

cat > "$SCRIPTS_DIR/postinstall" << 'EOFPOST'
#!/bin/bash
set -e

echo "Configuring Pixibot Adobe Plugin..."

# Enable debug mode for CEP (for all users)
for user_home in /Users/*; do
  if [ -d "$user_home" ]; then
    user=$(basename "$user_home")

    # Skip system accounts
    if [[ "$user" == "Shared" ]] || [[ "$user" == "Guest" ]]; then
      continue
    fi

    # Enable CEP debug mode for this user
    sudo -u "$user" defaults write com.adobe.CSXS.9 PlayerDebugMode 1 2>/dev/null || true
    sudo -u "$user" defaults write com.adobe.CSXS.10 PlayerDebugMode 1 2>/dev/null || true
    sudo -u "$user" defaults write com.adobe.CSXS.11 PlayerDebugMode 1 2>/dev/null || true
  fi
done

echo "✅ Pixibot Adobe Plugin installed successfully!"
echo ""
echo "To use the plugin:"
echo "1. Restart Premiere Pro or After Effects"
echo "2. Go to Window → Extensions → Pixibot"
echo "3. Sign in with your Pixibot account"
EOFPOST

chmod +x "$SCRIPTS_DIR/postinstall"

# Create .pkg using pkgbuild
echo "🔨 Building .pkg installer..."
pkgbuild --root "$PKG_ROOT" \
         --identifier "$PLUGIN_ID" \
         --version "$PLUGIN_VERSION" \
         --scripts "$SCRIPTS_DIR" \
         "$PKG_NAME"

# Clean up
rm -rf "$TEMP_DIR"

echo "✅ Mac installer created: $PKG_NAME"
echo "   Size: $(du -h "$PKG_NAME" | cut -f1)"
echo ""
echo "To install:"
echo "  Double-click $PKG_NAME"
echo "  or run: sudo installer -pkg $PKG_NAME -target /"
