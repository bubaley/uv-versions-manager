# UV Versions Manager

A VS Code extension that parses `pyproject.toml` and `uv.lock` files in your project and displays dependency version information.

## Features

- 📦 Parse `pyproject.toml` to extract dependencies
- 🔒 Parse `uv.lock` to determine installed versions
- 🌐 Check latest package versions via PyPI API
- 🔢 Support for all Python version formats:
  - Standard: `1.2.3`
  - Two-component: `25.1`, `2.0`
  - Single-component: `1`, `2`
  - Dev versions: `18.0.1.dev0`
  - Alpha versions: `1.2.3a1`
  - Beta versions: `2.0.0b2`
  - Release Candidate: `3.1.0rc1`
  - Post-release: `1.0.0.post1`
  - With local identifiers: `18.0.1.dev0+g1234567`
- ✅ Visual dependency status indicators:
  - ✅ Green checkmark - version is up to date
  - 🟢 Green circle - minor version is current
  - 🔴 Red circle - version is outdated
- 💡 Hover tooltips with version information
- ⚡ Automatic updates when files change

## Usage

1. Open a project with `pyproject.toml` and `uv.lock` files
2. The extension will automatically activate and start analyzing dependencies
3. Colored indicators will appear next to dependency lines in `pyproject.toml`
4. Hover over a dependency line to view detailed version information

## Commands

- `UV Versions Manager: Refresh dependency version information` - Force refresh
- `UV Versions Manager: Check outdated dependencies` - Show list of outdated packages
- `UV Versions Manager: Update to installed version` - Update dependency to installed version
- `UV Versions Manager: Update to latest version` - Update dependency to latest version

## Settings

- `pythonDependencyTracker.enableAutoCheck` - Automatically check for latest versions (default: true)
- `pythonDependencyTracker.checkInterval` - Check interval in milliseconds (default: 300000 = 5 minutes)
- `pythonDependencyTracker.showVersions` - Show dependency version information in CodeLens (default: true)

## Requirements

- VS Code 1.74.0 or newer
- Project with `pyproject.toml` and `uv.lock` files

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "UV Versions Manager"
4. Click Install

### Manual Installation
1. Clone the repository
2. Run `npm install`
3. Run `npm run compile`
4. Press F5 to run in development mode

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch
```

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have feature requests, please create an issue on [GitHub](https://github.com/bubaley/uv-versions-manager/issues). 