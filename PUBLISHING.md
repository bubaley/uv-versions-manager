# Publishing Instructions

## Prerequisites

1. Install the VS Code Extension Manager:
   ```bash
   npm install -g @vscode/vsce
   ```

2. Create a Personal Access Token on Azure DevOps:
   - Go to https://dev.azure.com/
   - Create a new organization if you don't have one
   - Go to User Settings > Personal Access Tokens
   - Create a new token with "Marketplace (manage)" scope
   - Save the token securely

## Publishing to VS Code Marketplace

1. Login to vsce:
   ```bash
   vsce login bubaley
   ```
   Enter your Personal Access Token when prompted.

2. Package the extension:
   ```bash
   npm run compile
   vsce package
   ```

3. Publish the extension:
   ```bash
   vsce publish
   ```

## Publishing to GitHub

1. Create a repository on GitHub:
   - Go to https://github.com/new
   - Repository name: `python-dependency-tracker`
   - Description: `VS Code extension that parses pyproject.toml and uv.lock to display dependency version information`
   - Make it public
   - Don't initialize with README (we already have one)

2. Push to GitHub:
   ```bash
   git branch -M main
   git push -u origin main
   ```

3. Create a release:
   - Go to your repository on GitHub
   - Click "Releases" > "Create a new release"
   - Tag version: `v0.0.3`
   - Release title: `Python Dependency Tracker v0.0.3`
   - Attach the `.vsix` file to the release

## Version Management

To update the version:

1. Update version in `package.json`
2. Update `CHANGELOG.md` with new changes
3. Commit changes:
   ```bash
   git add .
   git commit -m "Bump version to X.X.X"
   git tag vX.X.X
   git push origin main --tags
   ```
4. Publish new version:
   ```bash
   vsce publish
   ``` 