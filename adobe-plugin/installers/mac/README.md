# Mac Installer

## Installation

1. Download `Pixibot-Adobe-Plugin-Mac.pkg`
2. Double-click to install
3. Follow the installer prompts
4. Restart Premiere Pro or After Effects
5. Go to Window → Extensions → Pixibot

## What gets installed

- Plugin files: `~/Library/Application Support/Adobe/CEP/extensions/com.pixibot.adobe.plugin/`
- CEP debug mode is automatically enabled

## Requirements

- macOS 10.13 (High Sierra) or later
- Adobe Premiere Pro 2022+ or After Effects 2022+

## Uninstallation

```bash
rm -rf ~/Library/Application\ Support/Adobe/CEP/extensions/com.pixibot.adobe.plugin
```

## Troubleshooting

### "Package is damaged" error

```bash
xattr -cr ~/Library/Application\ Support/Adobe/CEP/extensions/com.pixibot.adobe.plugin
```

### Plugin doesn't appear

1. Check if installed:
   ```bash
   ls ~/Library/Application\ Support/Adobe/CEP/extensions/com.pixibot.adobe.plugin
   ```

2. Enable CEP debug mode:
   ```bash
   defaults write com.adobe.CSXS.10 PlayerDebugMode 1
   defaults write com.adobe.CSXS.11 PlayerDebugMode 1
   ```

3. Restart Premiere Pro or After Effects

4. Check Window → Extensions menu
