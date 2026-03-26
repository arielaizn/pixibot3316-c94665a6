# Pixibot Adobe Plugin

Adobe Premiere Pro and After Effects plugin for importing projects from Pixibot and AI-powered editing.

## Features

- 🎬 **Import Projects** - Import entire folders and projects from Pixibot directly into Premiere/AE
- 🤖 **Edit Agent** (Premium) - AI-powered editing with individual commands and autonomous mode
- ⚡ **Cross-Platform** - Works on Mac and Windows
- 🔒 **Secure** - JWT authentication with your Pixibot account

## Requirements

- Adobe Premiere Pro 2022+ (version 16.0+)
- Adobe After Effects 2022+ (version 18.0+)
- Pixibot account (free or premium)
- Mac or Windows

## Installation

### Mac

1. Download `Pixibot-Adobe-Plugin-Mac.pkg`
2. Double-click to install
3. Restart Premiere Pro or After Effects
4. Go to Window → Extensions → Pixibot

### Windows

1. Download and run `Pixibot-Adobe-Plugin-Windows.exe`
2. Follow the installer instructions
3. Restart Premiere Pro or After Effects
4. Go to Window → Extensions → Pixibot

### Manual Installation (.zxp)

1. Download `pixibot-adobe-plugin.zxp`
2. Install using Adobe Extension Manager or ZXPInstaller
3. Restart host application

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Adobe Creative Cloud with Premiere Pro and/or After Effects
- ZXPSignCmd (for signing)

### Setup

```bash
# Install dependencies
cd client
npm install

# Build plugin
cd ..
./lib/build.sh

# Sign .zxp package
./lib/sign.sh

# Create installers
./lib/package-mac.sh      # Mac .pkg
./lib/package-windows.sh  # Windows .exe

# Or deploy directly for development
./lib/deploy.sh
```

### Project Structure

```
adobe-plugin/
├── manifest.xml              # CEP manifest
├── .debug                    # Debug configuration
├── client/                   # React panel
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── lib/              # JSX bridge, Supabase
│   │   └── hooks/            # React hooks
│   └── package.json
├── host/                     # ExtendScript
│   ├── premiere.jsx          # Premiere automation
│   ├── aftereffects.jsx      # After Effects automation
│   └── common.jsx            # Shared utilities
├── icons/                    # Plugin icons
└── lib/                      # Build scripts
    ├── build.sh              # Build plugin
    ├── sign.sh               # Sign .zxp
    ├── package-mac.sh        # Create Mac installer
    ├── package-windows.sh    # Create Windows installer
    └── deploy.sh             # Deploy for development
```

### Debugging

1. Build and deploy:
   ```bash
   ./lib/deploy.sh
   ```

2. Open Premiere/AE and load the extension

3. Right-click on the panel → Inspect (opens Chrome DevTools)

4. View logs in the Console tab

### Making Changes

1. Edit React components in `client/src/`
2. Edit ExtendScript in `host/*.jsx`
3. Run `./lib/build.sh` to rebuild
4. Run `./lib/deploy.sh` to test
5. Restart host application to see changes

## API Endpoints

The plugin communicates with these Supabase Edge Functions:

- `pixi-plugin-projects` - List user projects
- `pixi-plugin-download` - Generate signed download URLs
- `pixi-agent-streaming` - AI editing commands

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Bridge**: JSX Bridge (React ↔ ExtendScript communication)
- **Backend**: Supabase (auth, database, storage)
- **Automation**: ExtendScript (Premiere/AE scripting)

## Security

- JWT tokens stored in CEP's sandboxed localStorage
- All API calls authenticated with Bearer token
- Premium features check subscription status
- Signed URLs with 1-hour expiration

## Troubleshooting

### Plugin doesn't appear in Window → Extensions

1. Check if plugin is installed:
   - Mac: `~/Library/Application Support/Adobe/CEP/extensions/com.pixibot.adobe.plugin`
   - Windows: `%APPDATA%\Adobe\CEP\extensions\com.pixibot.adobe.plugin`

2. Enable debug mode:
   - Mac: Run `defaults write com.adobe.CSXS.10 PlayerDebugMode 1`
   - Windows: Add registry key `HKEY_CURRENT_USER\Software\Adobe\CSXS.10\PlayerDebugMode=1`

3. Restart host application

### Login fails

- Check internet connection
- Verify Pixibot credentials
- Open DevTools (Inspect) and check Console for errors

### Import doesn't work

- Ensure you have projects in your Pixibot account
- Check DevTools Console for API errors
- Verify authentication token is valid

## License

Copyright (c) 2026 Pixibot. All rights reserved.

## Support

- Email: info@pixibot.app
- Website: https://pixibot.app
- GitHub Issues: [Report a bug](https://github.com/pixibot/adobe-plugin/issues)
