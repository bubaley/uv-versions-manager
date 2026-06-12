import * as fs from 'fs';
import * as path from 'path';
import * as toml from '@iarna/toml';

export class UvLockParser {
    
    parseInstalledPackages(projectRoot: string): Map<string, string> {
        const uvLockPath = path.join(projectRoot, 'uv.lock');
        
        if (!fs.existsSync(uvLockPath)) {
            return new Map();
        }

        try {
            const content = fs.readFileSync(uvLockPath, 'utf-8');
            const parsed = toml.parse(content) as any;
            
            const packages = new Map<string, string>();
            
            if (parsed.package && Array.isArray(parsed.package)) {
                parsed.package.forEach((pkg: any) => {
                    if (pkg.name && pkg.version) {
                        packages.set(pkg.name.toLowerCase(), pkg.version);
                    }
                });
            }

            return packages;
        } catch (error) {
            console.error('Error parsing uv.lock:', error);
            return new Map();
        }
    }
} 