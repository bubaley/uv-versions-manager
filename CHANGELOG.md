# Change Log

All notable changes to the "UV Versions Manager" extension will be documented in this file.

## [0.0.5] - 2024-12-19

### Fixed
- Fixed extension not working when installed from VSIX package
- Resolved dependency loading issues by implementing webpack bundling
- Improved package size and performance with single bundled file

### Changed
- Migrated from TypeScript compilation to webpack bundling
- Updated build process to include all dependencies in bundle
- Optimized package size from 512KB to 354KB

## [0.0.3] - 2024-01-XX

### Added
- Initial release
- Parse `pyproject.toml` to extract dependencies
- Parse `uv.lock` to determine installed versions
- Check latest package versions via PyPI API
- Support for all Python version formats (standard, dev, alpha, beta, RC, post-release, with local identifiers)
- Visual dependency status indicators (green checkmark, green circle, red circle)
- Hover tooltips with version information
- Automatic updates when files change
- Commands for refreshing version information and checking outdated dependencies
- Commands for updating dependencies to installed or latest versions
- Configuration options for auto-check, check interval, and showing versions

### Features
- ✅ Visual indicators for dependency status
- 💡 Hover tooltips with detailed version information
- ⚡ Automatic file change detection
- 🔢 Comprehensive Python version format support
- 🌐 Real-time PyPI API integration

## [Unreleased]

### Planned
- Icon for the extension
- Enhanced error handling
- Performance optimizations
- Additional configuration options 