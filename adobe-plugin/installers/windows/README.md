# Windows Installer

## Installation

### Option 1: Installer (.exe)

1. Download `Pixibot-Adobe-Plugin-Windows.exe`
2. Right-click and select "Run as Administrator"
3. Follow the installer prompts
4. Restart Premiere Pro or After Effects
5. Go to Window → Extensions → Pixibot

### Option 2: Manual (.zip)

1. Download `Pixibot-Adobe-Plugin-Windows.zip`
2. Extract to:
   ```
   C:\Users\[YourUsername]\AppData\Roaming\Adobe\CEP\extensions\
   ```
3. Rename extracted folder to `com.pixibot.adobe.plugin`
4. Enable CEP debug mode (see below)
5. Restart Premiere Pro or After Effects

## What gets installed

- Plugin files: `C:\Users\[YourUsername]\AppData\Roaming\Adobe\CEP\extensions\com.pixibot.adobe.plugin\`
- CEP debug mode registry keys

## Requirements

- Windows 10 or later
- Adobe Premiere Pro 2022+ or After Effects 2022+

## Uninstallation

1. Go to Add/Remove Programs
2. Uninstall "Pixibot Adobe Plugin"

Or manually:
```
rd /s /q "%APPDATA%\Adobe\CEP\extensions\com.pixibot.adobe.plugin"
```

## Troubleshooting

### Plugin doesn't appear

1. Check if installed:
   ```
   dir "%APPDATA%\Adobe\CEP\extensions\com.pixibot.adobe.plugin"
   ```

2. Enable CEP debug mode (run as Administrator):
   ```
   reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.10 /v PlayerDebugMode /t REG_SZ /d 1 /f
   reg add HKEY_CURRENT_USER\Software\Adobe\CSXS.11 /v PlayerDebugMode /t REG_SZ /d 1 /f
   ```

3. Restart Premiere Pro or After Effects

4. Check Window → Extensions menu

### "Not installed correctly" error

- Make sure you ran installer as Administrator
- Check that folder name is exactly: `com.pixibot.adobe.plugin`
- Verify CEP debug mode is enabled
