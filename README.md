# UV Versions Manager

VS Code extension for tracking Python dependency versions in projects with `pyproject.toml` and `uv.lock`.

![Extension Demo](https://github.com/user-attachments/assets/dc835ecb-8813-4396-8ba5-b1c8347960cf)

## Features

- 📦 Parse dependencies from `pyproject.toml`
- 🔒 Detect installed versions from `uv.lock`
- 🌐 Check latest versions via PyPI API
- 💡 Hover tooltips with version information
- ✅ Visual status indicators:
  - 🟢 Green - version is up-to-date
  - 🟡 Yellow - updates available

## Usage

1. Open a project with `pyproject.toml` and `uv.lock` files
2. Extension activates automatically
3. Hover over dependencies to view version information

## Commands

- **Refresh dependency version information** - Refresh version data
- **Bump all** - Update all dependencies to installed versions
- **Upgrade all** - Update all dependencies to latest versions

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "UV Versions Manager"
4. Click Install

## Requirements

- VS Code 1.74.0+
- Project with `pyproject.toml` and `uv.lock`

## License

MIT 
