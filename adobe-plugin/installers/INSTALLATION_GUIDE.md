# Pixibot Adobe Plugin - Installation Guide

Complete guide for installing the Pixibot plugin on Mac and Windows.

## 📋 Requirements

### System Requirements
- **Mac:** macOS 10.13+ (High Sierra or later)
- **Windows:** Windows 10 or later

### Adobe Requirements
- Adobe Premiere Pro 2022+ (version 16.0+)
- Adobe After Effects 2022+ (version 18.0+)

### Account Requirements
- Pixibot account (sign up at https://pixibot.app)
- For Edit Agent feature: Premium subscription required

---

## 🍎 Mac Installation

### Method 1: Using .pkg Installer (Recommended)

1. **Download**
   - Download `Pixibot-Adobe-Plugin-Mac.pkg`

2. **Install**
   - Double-click the .pkg file
   - Click "Continue" through the installer
   - Enter your admin password when prompted
   - Click "Install"

3. **Restart Adobe App**
   - Quit and restart Premiere Pro or After Effects

4. **Open Plugin**
   - Go to `Window → Extensions → Pixibot`

### Method 2: Using .zxp File

1. **Install ZXPInstaller**
   - Download from: https://aescripts.com/learn/zxp-installer/

2. **Install Plugin**
   - Open ZXPInstaller
   - Drag `pixibot-adobe-plugin.zxp` onto ZXPInstaller
   - Wait for installation to complete

3. **Restart Adobe App**
   - Quit and restart Premiere Pro or After Effects

4. **Open Plugin**
   - Go to `Window → Extensions → Pixibot`

---

## 🪟 Windows Installation

### Method 1: Using .exe Installer (Recommended)

1. **Download**
   - Download `Pixibot-Adobe-Plugin-Windows.exe`

2. **Run as Administrator**
   - Right-click the .exe file
   - Select "Run as Administrator"
   - Click "Yes" on UAC prompt

3. **Follow Installer**
   - Click through the installer prompts
   - Wait for installation to complete

4. **Restart Adobe App**
   - Quit and restart Premiere Pro or After Effects

5. **Open Plugin**
   - Go to `Window → Extensions → Pixibot`

### Method 2: Using .zip File (Manual)

1. **Download and Extract**
   - Download `Pixibot-Adobe-Plugin-Windows.zip`
   - Extract to a temporary location

2. **Copy to CEP Directory**
   - Open File Explorer
   - Navigate to:
     ```
     C:\Users\[YourUsername]\AppData\Roaming\Adobe\CEP\extensions\
     ```
   - Copy the extracted `com.pixibot.adobe.plugin` folder here

3. **Enable CEP Debug Mode**
   - Open Command Prompt as Administrator
   - Run these commands:
     ```
     reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.10 /v PlayerDebugMode /t REG_SZ /d 1 /f
     reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.11 /v PlayerDebugMode /t REG_SZ /d 1 /f
     ```

4. **Restart Adobe App**
   - Quit and restart Premiere Pro or After Effects

5. **Open Plugin**
   - Go to `Window → Extensions → Pixibot`

### Method 3: Using .zxp File

1. **Install ZXPInstaller**
   - Download from: https://aescripts.com/learn/zxp-installer/

2. **Install Plugin**
   - Open ZXPInstaller
   - Drag `pixibot-adobe-plugin.zxp` onto ZXPInstaller
   - Wait for installation to complete

3. **Restart Adobe App**
   - Quit and restart Premiere Pro or After Effects

4. **Open Plugin**
   - Go to `Window → Extensions → Pixibot`

---

## 🔧 Post-Installation Setup

### First Launch

1. **Open Plugin Panel**
   - In Premiere/AE: `Window → Extensions → Pixibot`

2. **Sign In**
   - Enter your Pixibot email and password
   - Click "Sign In"

3. **Grant Permissions**
   - Allow plugin to access your projects
   - Allow plugin to make edits (for Edit Agent)

### Verify Installation

1. **Check Connection**
   - Plugin should show "Premiere Pro" or "After Effects" in header
   - Projects tab should be accessible

2. **Test Import**
   - Go to Projects tab
   - You should see your Pixibot projects
   - Try importing a small project

3. **Test Edit Agent** (Premium only)
   - Go to Edit Agent tab
   - Premium users: Try a simple command
   - Free users: Should see upgrade prompt

---

## ❓ Troubleshooting

### Plugin doesn't appear in Extensions menu

**Mac:**
```bash
# Enable CEP debug mode
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1

# Verify installation
ls ~/Library/Application\ Support/Adobe/CEP/extensions/com.pixibot.adobe.plugin
```

**Windows:**
```cmd
# Enable CEP debug mode (run as Admin)
reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.10 /v PlayerDebugMode /t REG_SZ /d 1 /f
reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.11 /v PlayerDebugMode /t REG_SZ /d 1 /f

# Verify installation
dir "%APPDATA%\Adobe\CEP\extensions\com.pixibot.adobe.plugin"
```

### "Package is damaged" (Mac only)

```bash
xattr -cr ~/Library/Application\ Support/Adobe/CEP/extensions/com.pixibot.adobe.plugin
```

### Login fails

1. Check internet connection
2. Verify credentials at https://pixibot.app
3. Try logging out and in again
4. Open DevTools (Right-click panel → Inspect) and check Console for errors

### Import doesn't work

1. Ensure you have projects in your Pixibot account
2. Check that files exist in the project
3. Verify sufficient disk space
4. Check DevTools Console for errors

### Edit Agent shows "Premium Feature"

- Edit Agent requires a paid subscription
- Upgrade at: https://pixibot.app/pricing
- Plans start at $49/month

### Panel is blank or not loading

1. Right-click panel → Inspect
2. Check Console tab for JavaScript errors
3. Try reloading: Cmd+R (Mac) or Ctrl+R (Windows)
4. Reinstall plugin if needed

---

## 🔄 Updating

### To update to a new version:

1. **Uninstall old version** (see below)
2. **Download new installer**
3. **Follow installation steps** above

### Uninstalling

**Mac:**
```bash
rm -rf ~/Library/Application\ Support/Adobe/CEP/extensions/com.pixibot.adobe.plugin
```

**Windows:**
```
rd /s /q "%APPDATA%\Adobe\CEP\extensions\com.pixibot.adobe.plugin"
```

---

## 📞 Support

- **Website:** https://pixibot.app
- **Email:** info@pixibot.app
- **Documentation:** Check README.md in plugin directory

## 🎬 Getting Started

Once installed:

1. **Import a Project**
   - Go to Projects tab
   - Click "Import" on any project
   - Files will download and import automatically

2. **Try Edit Agent** (Premium)
   - Go to Edit Agent tab
   - Type: "Add title 'Hello World' at 2 seconds"
   - Press Enter and watch the magic! ✨

Enjoy using Pixibot! 🚀
