# VS Code Workspace Opener

A [Vicinae](https://github.com/vicinaehq/vicinae) extension to quickly browse and open your git repositories in VS Code.

## Features

- Automatically finds all git repositories in `~/work` directory
- Opens workspaces in new VS Code windows
- Copy repository paths to clipboard
- Open repositories in terminal
- Refresh repository list on-demand

## Installation

### Local Development

1. Clone or copy this extension to your local Vicinae extensions directory
2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

3. Build the extension:
   ```bash
   npm run build
   # or
   bun run build
   ```

4. The extension should now be available in Vicinae

## Usage

1. Open Vicinae launcher
2. Search for "Open VS Code Workspace"
3. Browse the list of available git repositories
4. Press Enter to open the selected repository in VS Code

### Keyboard Shortcuts

- **Enter** - Open in VS Code (new window)
- **Cmd+C** - Copy repository path
- **Cmd+T** - Open in terminal
- **Cmd+R** - Refresh repository list

## Configuration

### Preferences

You can customize the extension behavior in Vicinae preferences:

- **Workspace Directory**: Directory to search for git repositories (default: `~/work`)
- **Search Depth**: Maximum directory depth to search (default: `3`)

## Requirements

- VS Code must be installed and the `code` command must be available in PATH
- `xclip` for clipboard functionality (install with `sudo pacman -S xclip` on Arch)
- Works on Linux systems

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```
