import * as vscode from 'vscode';
import { Dependency } from './types';

export class DependencyHoverProvider implements vscode.HoverProvider {
    private dependencies: Dependency[] = [];

    updateDependencies(dependencies: Dependency[]): void {
        this.dependencies = dependencies;
    }

    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        if (!document.fileName.endsWith('pyproject.toml')) {
            return null;
        }

        const line = document.lineAt(position.line);
        const lineText = line.text;

        // Find dependency in current line
        const dependency = this.findDependencyInLine(lineText, position.character);
        
        if (!dependency) {
            return null;
        }

        return this.createHover(dependency);
    }

    private findDependencyInLine(lineText: string, character: number): Dependency | null {
        // Find package name in line
        const packageMatch = lineText.match(/["']([a-zA-Z0-9\-_]+)(\[[^\]]+\])?[><=~!]*/);
        
        if (!packageMatch) {
            return null;
        }

        const packageName = packageMatch[1];
        const startPos = lineText.indexOf(packageMatch[0]);
        const endPos = startPos + packageName.length;

        // Check if cursor is over package name
        if (character >= startPos && character <= endPos) {
            return this.dependencies.find(dep => dep.name.toLowerCase() === packageName.toLowerCase()) || null;
        }

        return null;
    }

    private createHover(dependency: Dependency): vscode.Hover {
        const contents = new vscode.MarkdownString();
        contents.isTrusted = true;

        // Header with package name
        contents.appendMarkdown(`## 📦 ${dependency.name}\n\n`);

        // Package description
        if (dependency.summary) {
            contents.appendMarkdown(`**Description:** ${dependency.summary}\n\n`);
        }

        // Version information
        contents.appendMarkdown(`**Versions:**\n`);
        contents.appendMarkdown(`- Requested: \`${dependency.requestedVersion}\`\n`);
        
        if (dependency.installedVersion) {
            contents.appendMarkdown(`- Installed: \`${dependency.installedVersion}\`\n`);
        }
        
        if (dependency.latestVersion) {
            contents.appendMarkdown(`- Latest: \`${dependency.latestVersion}\`\n`);
        }

        // Update status
        if (dependency.isOutdated === false) {
            contents.appendMarkdown(`\n✅ **Package is up-to-date**\n`);
        } else if (dependency.isOutdated === true) {
            contents.appendMarkdown(`\n🔴 **Update available**\n`);
        }

        // Links
        const links: string[] = [];
        
        if (dependency.homePage) {
            links.push(`[Homepage](${dependency.homePage})`);
        }
        
        if (dependency.packageUrl) {
            links.push(`[PyPI](${dependency.packageUrl})`);
        }

        if (links.length > 0) {
            contents.appendMarkdown(`\n**Links:** ${links.join(' • ')}\n`);
        }

        return new vscode.Hover(contents);
    }

    dispose(): void {
        // Hover provider doesn't require special resource cleanup
    }
} 