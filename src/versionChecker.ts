import fetch from 'node-fetch';
import { Dependency } from './types';

export class VersionChecker {
    private cache = new Map<string, { info: Partial<Dependency>; timestamp: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    async getLatestVersion(packageName: string, currentVersion?: string): Promise<Partial<Dependency> | null> {
        // Check cache
        const cached = this.cache.get(packageName);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.info;
        }

        try {
            const response = await fetch(`https://pypi.org/pypi/${packageName}/json`);
            
            if (!response.ok) {
                return null;
            }

            const data = await response.json() as any;
            const latest = data.info.version;
            
            let isUpToDate = true;

            if (currentVersion) {
                // Simple string comparison for exact version match
                // This handles all version formats including dev versions like 18.0.1.dev0
                isUpToDate = currentVersion === latest;
            }

            const versionInfo: Partial<Dependency> = {
                latestVersion: latest,
                isUpToDate,
                isOutdated: !isUpToDate,
                packageUrl: data.info.package_url || `https://pypi.org/project/${packageName}/`,
                summary: data.info.summary || '',
                homePage: data.info.home_page || data.info.project_url || ''
            };

            // Save to cache
            this.cache.set(packageName, {
                info: versionInfo,
                timestamp: Date.now()
            });

            return versionInfo;
        } catch (error) {
            console.error(`Error getting version for ${packageName}:`, error);
            return null;
        }
    }

    clearCache(): void {
        this.cache.clear();
    }
} 