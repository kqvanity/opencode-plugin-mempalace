# opencode-plugin-mempalace

A community open-source plugin that integrates [MemPalace](https://github.com/milla-jovovich/mempalace)'s "lifetime memory" (L0-L3 memory stack, AAAK compression, auto context saving) into the OpenCode terminal assistant.

This plugin ensures your AI assistant has a long-term memory across sessions by seamlessly hooking into OpenCode's lifecycle events to fetch, inject, and save contexts related to your specific workspace.

## Features
- **Auto-Injection**: Automatically wakes up MemPalace on session initialization to inject L0 and L1 critical facts.
- **Pre-Compaction Preservation**: Adds your core memory context back right before OpenCode compresses the conversation, ensuring crucial details are never lost.
- **Silent Background Mining**: Quietly exports and saves your conversational history into your MemPalace database as you chat, preserving decisions for future usage.

## Requirements
- OpenCode AI Terminal
- Python 3.9+
- MemPalace installed globally (`pip install mempalace`)

## Installation

1. Install MemPalace:
   ```bash
   pip install mempalace
   mempalace init ~/projects/my-app
   ```

2. Add this plugin to your OpenCode configuration. Open `~/.opencode/config.json` and add:

   ```json
   {
     "plugin_origins": {
       "opencode-plugin-mempalace": "npm:opencode-plugin-mempalace"
     },
     "plugins": {
       "opencode-plugin-mempalace": {
         "threshold": 15
       }
     }
   }
   ```

## Development
This project is built with TypeScript and relies on a TDD approach.

```bash
npm install
npm run test
npm run build
```

## How It Works
- The plugin wraps the `mempalace` CLI via the `execa` package.
- Hooks used:
  - `experimental.session.compacting`
  - `experimental.chat.system.transform`
  - `chat.message`
- Wing Name Inference: It infers the wing name intelligently from the workspace path `input.worktree` (e.g. `/projects/my-app` -> `wing_my-app`).

## License
MIT
