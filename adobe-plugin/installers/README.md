# Pixibot Adobe Plugin - Installers

This directory contains all installation packages for Mac and Windows.

## 📦 Available Installers

### Mac
- `mac/Pixibot-Adobe-Plugin-Mac.pkg` - Mac installer package
- Double-click to install
- Compatible with macOS 10.13+

### Windows
- `windows/Pixibot-Adobe-Plugin-Windows.exe` - Windows installer (requires NSIS)
- `windows/Pixibot-Adobe-Plugin-Windows.zip` - Manual installation package
- Run as Administrator
- Compatible with Windows 10+

### Manual Installation
- `pixibot-adobe-plugin.zxp` - Adobe Extension package
- Install using Adobe Extension Manager or ZXPInstaller
- Works on both Mac and Windows

---

## 🔨 Building Installers

To build all installers from source:

```bash
# From the adobe-plugin directory
cd /Users/a1234/pixibot3316/adobe-plugin

# Build everything
./installers/build-all.sh
```

This will:
1. Build the React panel (`client/`)
2. Create the distribution package (`dist/`)
3. Sign the .zxp package
4. Create Mac installer (.pkg)
5. Create Windows installer (.exe or .zip)

---

## 📋 Prerequisites

### For Building

**All Platforms:**
- Node.js 18+
- npm

**For .zxp Signing:**
- ZXPSignCmd ([Download](https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD))

**For Mac .pkg:**
- macOS with `pkgbuild` (pre-installed on Mac)

**For Windows .exe:**
- NSIS ([Download](https://nsis.sourceforge.io/))
- Or create .zip instead (automatic fallback)

---

## 📤 Distribution

### Upload to Pixibot Website

1. Build all installers
2. Copy files to website:
   ```bash
   cp installers/mac/Pixibot-Adobe-Plugin-Mac.pkg /Users/a1234/pixibot3316/public/downloads/
   cp installers/windows/Pixibot-Adobe-Plugin-Windows.exe /Users/a1234/pixibot3316/public/downloads/
   cp installers/pixibot-adobe-plugin.zxp /Users/a1234/pixibot3316/public/downloads/
   ```

3. Users download from: `https://pixibot.app/plugin/download`

---

## 🧪 Testing

### Mac Testing
```bash
# Install locally
sudo installer -pkg installers/mac/Pixibot-Adobe-Plugin-Mac.pkg -target /

# Verify installation
ls ~/Library/Application\ Support/Adobe/CEP/extensions/com.pixibot.adobe.plugin
```

### Windows Testing
```
1. Run Pixibot-Adobe-Plugin-Windows.exe as Administrator
2. Check installation:
   C:\Users\[username]\AppData\Roaming\Adobe\CEP\extensions\com.pixibot.adobe.plugin
```

### Manual Testing (.zxp)
1. Download ZXPInstaller
2. Drag .zxp file onto ZXPInstaller
3. Restart Premiere/After Effects

---

## 📊 File Sizes

Approximate sizes:
- .zxp: ~5-10 MB
- Mac .pkg: ~10-15 MB
- Windows .exe: ~10-15 MB
- Windows .zip: ~5-10 MB

---

## 🔐 Code Signing (Optional)

For production distribution:

### Mac
```bash
# Sign with Apple Developer certificate
productsign --sign "Developer ID Installer: Your Name" \
  installers/mac/Pixibot-Adobe-Plugin-Mac.pkg \
  installers/mac/Pixibot-Adobe-Plugin-Mac-Signed.pkg

# Notarize with Apple
xcrun notarytool submit installers/mac/Pixibot-Adobe-Plugin-Mac-Signed.pkg \
  --apple-id your@email.com \
  --password app-specific-password \
  --team-id TEAMID
```

### Windows
```bash
# Sign with Windows certificate
signtool sign /f certificate.pfx /p password \
  /t http://timestamp.digicert.com \
  installers/windows/Pixibot-Adobe-Plugin-Windows.exe
```

---

## 📝 Version History

- v1.0.0 (2026-03-24) - Initial release
  - Import projects from Pixibot
  - Edit Agent AI commands
  - Premium features

---

## 🆘 Troubleshooting

### "Package is damaged" (Mac)
```bash
# Remove quarantine attribute
xattr -cr "/Applications/Adobe Premiere Pro 2024/Plug-ins/com.pixibot.adobe.plugin"
```

### "Not installed correctly" (Windows)
- Run as Administrator
- Check CEP debug mode is enabled
- Restart Adobe application

### Plugin doesn't appear
1. Check installation path
2. Enable CEP debug mode
3. Check manifest.xml compatibility
4. View Console for errors (Right-click panel → Inspect)

---

## 📞 Support

- Website: https://pixibot.app
- Email: info@pixibot.app
- Issues: Check README.md in main plugin directory
