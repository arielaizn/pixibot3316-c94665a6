#!/bin/bash
set -e

# Windows Installer Creation Script
echo "🪟 Creating Windows Installer for Pixibot Adobe Plugin..."

cd "$(dirname "$0")/.."

PLUGIN_NAME="Pixibot Adobe Plugin"
PLUGIN_VERSION="1.0.0"
PLUGIN_ID="com.pixibot.adobe.plugin"
OUTPUT_ZIP="Pixibot-Adobe-Plugin-Windows.zip"

# Ensure dist exists
if [ ! -d "dist" ]; then
  echo "❌ dist/ folder not found! Run ./lib/build.sh first"
  exit 1
fi

# Create temp directory
TEMP_DIR=$(mktemp -d)
PACKAGE_DIR="$TEMP_DIR/$PLUGIN_ID"
mkdir -p "$PACKAGE_DIR"

# Copy dist contents
echo "📦 Copying plugin files..."
cp -r dist/* "$PACKAGE_DIR/"

# Create batch install script for Windows
cat > "$TEMP_DIR/INSTALL.bat" << 'EOFBAT'
@echo off
echo ========================================
echo  Pixibot Adobe Plugin Installer
echo ========================================
echo.

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This installer requires Administrator privileges
    echo Please right-click and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo Installing Pixibot Adobe Plugin...
echo.

:: Get user's AppData directory
set APPDATA_DIR=%APPDATA%
set CEP_DIR=%APPDATA_DIR%\Adobe\CEP\extensions
set PLUGIN_DIR=%CEP_DIR%\com.pixibot.adobe.plugin

:: Create CEP directory if it doesn't exist
if not exist "%CEP_DIR%" (
    echo Creating CEP extensions directory...
    mkdir "%CEP_DIR%"
)

:: Remove old installation if exists
if exist "%PLUGIN_DIR%" (
    echo Removing old installation...
    rmdir /s /q "%PLUGIN_DIR%"
)

:: Copy plugin files
echo Copying plugin files...
xcopy /E /I /Y "%~dp0com.pixibot.adobe.plugin" "%PLUGIN_DIR%"

:: Enable CEP debug mode
echo Enabling CEP debug mode...
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.9" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1

echo.
echo ========================================
echo  ✓ Installation Complete!
echo ========================================
echo.
echo To use the plugin:
echo 1. Restart Premiere Pro or After Effects
echo 2. Go to Window ^> Extensions ^> Pixibot
echo 3. Sign in with your Pixibot account
echo.
echo Installation location:
echo %PLUGIN_DIR%
echo.
pause
EOFBAT

# Create README
cat > "$TEMP_DIR/README.txt" << 'EOFREADME'
Pixibot Adobe Plugin - Windows Installation
============================================

INSTALLATION INSTRUCTIONS:
1. Right-click "INSTALL.bat"
2. Select "Run as Administrator"
3. Follow the on-screen instructions
4. Restart Premiere Pro or After Effects

MANUAL INSTALLATION (Alternative):
1. Copy the "com.pixibot.adobe.plugin" folder to:
   C:\Users\[YourUsername]\AppData\Roaming\Adobe\CEP\extensions\

2. Enable CEP debug mode (run as Administrator):
   reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.10 /v PlayerDebugMode /t REG_SZ /d 1 /f
   reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.11 /v PlayerDebugMode /t REG_SZ /d 1 /f

3. Restart Premiere Pro or After Effects

USAGE:
1. Open Premiere Pro or After Effects
2. Go to Window → Extensions → Pixibot
3. Sign in with your Pixibot account

REQUIREMENTS:
- Windows 10 or later
- Adobe Premiere Pro 2022+ or After Effects 2022+

SUPPORT:
Website: https://pixibot.app
Email: info@pixibot.app

UNINSTALL:
Delete the folder:
C:\Users\[YourUsername]\AppData\Roaming\Adobe\CEP\extensions\com.pixibot.adobe.plugin
EOFREADME

# Create zip package
echo "🗜️  Creating ZIP package..."
cd "$TEMP_DIR"
zip -r "$OUTPUT_ZIP" . -x "*.DS_Store"
mv "$OUTPUT_ZIP" "$OLDPWD/"
cd "$OLDPWD"

# Clean up
rm -rf "$TEMP_DIR"

echo "✅ Windows package created: $OUTPUT_ZIP"
echo "   Size: $(du -h "$OUTPUT_ZIP" | cut -f1)"
echo ""
echo "To install on Windows:"
echo "  1. Extract $OUTPUT_ZIP"
echo "  2. Right-click INSTALL.bat"
echo "  3. Select 'Run as Administrator'"
