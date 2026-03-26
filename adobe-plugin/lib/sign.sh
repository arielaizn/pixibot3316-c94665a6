#!/bin/bash
set -e

# ZXP Signing Script
echo "🔐 Signing Pixibot Adobe Plugin..."

cd "$(dirname "$0")/.."

# Check if ZXPSignCmd is installed
if ! command -v ZXPSignCmd &> /dev/null; then
  echo "❌ ZXPSignCmd not found!"
  echo "Install from: https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD"
  exit 1
fi

# Generate self-signed certificate (first time only)
if [ ! -f "cert.p12" ]; then
  echo "📜 Generating self-signed certificate..."
  ZXPSignCmd -selfSignedCert US CA SF Pixibot Pixibot info@pixibot.app pixibot2026 cert.p12
fi

# Sign the extension
echo "✍️  Signing extension..."
ZXPSignCmd -sign dist/ pixibot-adobe-plugin.zxp cert.p12 pixibot2026 -tsa http://timestamp.digicert.com

echo "✅ ZXP package created: pixibot-adobe-plugin.zxp"
echo "   Size: $(du -h pixibot-adobe-plugin.zxp | cut -f1)"
