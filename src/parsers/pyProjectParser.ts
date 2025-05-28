import * as fs from 'fs';
import * as path from 'path';
import * as toml from '@iarna/toml';
import { Dependency } from '../types';

export class PyProjectParser {
    
    parseDependencies(workspacePath: string): Dependency[] {
        const pyprojectPath = path.join(workspacePath, 'pyproject.toml');
        console.log('PyProjectParser: Checking file:', pyprojectPath);
        
        if (!fs.existsSync(pyprojectPath)) {
            console.log('PyProjectParser: pyproject.toml file not found');
            return [];
        }
        
        console.log('PyProjectParser: pyproject.toml file found, starting parsing');

        try {
            const content = fs.readFileSync(pyprojectPath, 'utf-8');
            const lines = content.split('\n');
            const dependencies: Dependency[] = [];

            const parsed = toml.parse(content) as any;
            
            // Parse project dependencies
            this.parseProjectDependencies(parsed, lines, dependencies);

            // Parse dependency-groups
            this.parseDependencyGroups(parsed, lines, dependencies);

            console.log('PyProjectParser: Parsing completed, found dependencies:', dependencies.length);
            return dependencies;
        } catch (error) {
            console.error('PyProjectParser: Error parsing pyproject.toml:', error);
            return [];
        }
    }

    private parseProjectDependencies(parsed: any, lines: string[], dependencies: Dependency[]): void {
        if (parsed.project && parsed.project.dependencies) {
            console.log('PyProjectParser: Found project.dependencies section with', parsed.project.dependencies.length, 'dependencies');
            this.parseDependencyList(parsed.project.dependencies, 'project.dependencies', lines, dependencies);
        } else {
            console.log('PyProjectParser: project.dependencies section not found');
        }
    }

    private parseDependencyGroups(parsed: any, lines: string[], dependencies: Dependency[]): void {
        if (parsed['dependency-groups']) {
            console.log('PyProjectParser: Found dependency-groups section with groups:', Object.keys(parsed['dependency-groups']));
            
            for (const [groupName, groupDeps] of Object.entries(parsed['dependency-groups'])) {
                if (Array.isArray(groupDeps)) {
                    console.log(`PyProjectParser: Processing group ${groupName} with ${groupDeps.length} dependencies`);
                    this.parseDependencyList(groupDeps, `dependency-groups.${groupName}`, lines, dependencies);
                }
            }
        } else {
            console.log('PyProjectParser: dependency-groups section not found');
        }
    }

    private parseDependencyList(depList: string[], source: string, lines: string[], dependencies: Dependency[]): void {
        depList.forEach((depString, index) => {
            console.log(`PyProjectParser: Processing dependency from ${source}:`, depString);
            const dependency = this.parseDependencyString(depString, source, index, lines);
            if (dependency) {
                // Extract group from source (e.g., "dependency-groups.dev" -> "dev")
                if (source.startsWith('dependency-groups.')) {
                    dependency.group = source.split('.')[1];
                }
                console.log(`PyProjectParser: Dependency from ${source} parsed:`, dependency);
                dependencies.push(dependency);
            }
        });
    }

    private parseDependencyString(depString: string, source: string, index: number, lines: string[]): Dependency | null {
        // Parse dependency string
        const match = depString.match(/^([a-zA-Z0-9\-_]+)(\[[^\]]+\])?(.*)/);
        
        if (!match) {
            return null;
        }

        const name = match[1];
        const versionPart = match[3] || '';
        
        // Extract version from version string (>=, ==, ~=, etc.)
        // Updated regex to handle all Python version formats:
        // - Standard: 1.2.3
        // - Two-part: 25.1
        // - Dev versions: 18.0.1.dev0
        // - Pre-releases: 1.2.3a1, 1.2.3b2, 1.2.3rc1
        // - Post releases: 1.0.0.post1
        // - Local versions: 1.2.3+abc123
        const versionMatch = versionPart.match(/[><=~!]+\s*([\d]+(?:\.[\d]+)*(?:[a-zA-Z]+[\d]*)*(?:\.[\w]+)*(?:\+[\w]+)*)/);
        const requestedVersion = versionMatch ? versionMatch[1].trim() : '';

        // Find line number in original file
        const lineIndex = this.findDependencyLine(lines, depString);

        return {
            name,
            requestedVersion,
            line: lineIndex,
            originalLine: depString.trim(),
            lineText: lines[lineIndex],
        };
    }

    private findDependencyLine(lines: string[], depString: string): number {
        // Search for exact match of dependency
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check if line contains our dependency
            if (line.includes(`"${depString}"`) || line.includes(`'${depString}'`)) {
                return i; // Return 0-based index for VS Code
            }
            
            // Also check without quotes for cases when dependency is written without them
            if (line.includes(depString) && (line.includes('=') || line.includes('>') || line.includes('<') || line.includes('~'))) {
                return i;
            }
        }
        
        // If exact match not found, search by package name
        const packageName = depString.match(/^([a-zA-Z0-9\-_]+)/)?.[1];
        if (packageName) {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.includes(`"${packageName}"`) || line.includes(`'${packageName}'`)) {
                    return i;
                }
            }
        }
        
        return 0; // Return 0 if not found
    }
} 