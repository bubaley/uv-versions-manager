export interface Dependency {
    name: string;
    requestedVersion: string;
    installedVersion?: string;
    latestVersion?: string;
    isOutdated?: boolean;
    line: number;
    packageUrl?: string;
    summary?: string;
    homePage?: string;
    originalLine: string;
    isUpToDate?: boolean;
    lineText: string;
    group?: string;
} 