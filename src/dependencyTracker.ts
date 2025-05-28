import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { PyProjectParser } from "./parsers/pyProjectParser";
import { UvLockParser } from "./parsers/uvLockParser";
import { VersionChecker } from "./versionChecker";
import { DependencyCodeLensProvider } from "./codeLensProvider";
import { DependencyHoverProvider } from "./hoverProvider";
import { Dependency } from "./types";

export class DependencyTracker {
  private disposables: vscode.Disposable[] = [];
  private dependencies: Dependency[] = [];
  private refreshTimer?: NodeJS.Timer;

  constructor(
    private pyProjectParser: PyProjectParser,
    private uvLockParser: UvLockParser,
    private versionChecker: VersionChecker,
    private codeLensProvider: DependencyCodeLensProvider,
    private hoverProvider: DependencyHoverProvider
  ) {}

  getDependencies(): Dependency[] {
    return this.dependencies;
  }

  start(): void {
    console.log("DependencyTracker: Starting dependency tracking");
    this.refreshVersions();
    this.setupEditorListeners();
    this.setupAutoRefresh();
  }

  async refreshVersions(): Promise<void> {
    console.log("DependencyTracker: Starting version information update");
    const workspaceFolders = vscode.workspace.workspaceFolders;
    console.log(
      "DependencyTracker: Workspace folders:",
      workspaceFolders?.map((f) => f.uri.fsPath)
    );

    if (!workspaceFolders || workspaceFolders.length === 0) {
      console.log("DependencyTracker: No workspace folders, exiting");
      return;
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;
    console.log("DependencyTracker: Using workspace folder:", workspacePath);

    // Parse pyproject.toml
    console.log("DependencyTracker: Parsing pyproject.toml");
    this.dependencies = this.pyProjectParser.parseDependencies(workspacePath);
    console.log(
      "DependencyTracker: Found dependencies in pyproject.toml:",
      this.dependencies.length
    );

    // Parse uv.lock
    console.log("DependencyTracker: Parsing uv.lock");
    const installedPackages =
      this.uvLockParser.parseInstalledPackages(workspacePath);
    console.log(
      "DependencyTracker: Found installed packages in uv.lock:",
      installedPackages.size
    );

    // Merge dependency data
    console.log("DependencyTracker: Merging dependency data");

    for (const dep of this.dependencies) {
      dep.installedVersion = installedPackages.get(dep.name.toLowerCase());
      try {
        const versionInfo = await this.versionChecker.getLatestVersion(
          dep.name,
          dep.installedVersion || dep.requestedVersion
        );
        if (versionInfo) {
          Object.assign(dep, versionInfo);
        }
      } catch (error) {
        console.error(`Error checking version for ${dep.name}:`, error);
      }
    }

    console.log(
      "DependencyTracker: Processed dependencies:",
      this.dependencies.length
    );

    // Update CodeLens for open editors
    console.log("DependencyTracker: Updating CodeLens for open editors");
    this.updateCodeLens();
  }

  async checkOutdated(): Promise<void> {
    const outdated = this.dependencies.filter((dep) => dep.isOutdated);

    if (outdated.length === 0) {
      vscode.window.showInformationMessage("All dependencies are up-to-date!");
      return;
    }

    const items = outdated.map((dep) => ({
      label: dep.name,
      description: `${dep.installedVersion || dep.requestedVersion} → ${
        dep.latestVersion
      }`,
      detail: dep.isOutdated ? "Update available" : "Up-to-date",
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: "Outdated dependencies",
      canPickMany: false,
    });

    if (selected) {
      vscode.env.openExternal(
        vscode.Uri.parse(`https://pypi.org/project/${selected.label}/`)
      );
    }
  }

  private setupEditorListeners(): void {
    console.log("DependencyTracker: Setting up editor listeners");

    const onDidChangeActiveEditor = vscode.window.onDidChangeActiveTextEditor(
      (editor) => {
        if (editor) {
          console.log(
            "DependencyTracker: Active editor changed in setupEditorListeners:",
            editor.document.fileName
          );
          // CodeLens is updated automatically when active editor changes
        }
      }
    );

    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(
      (event) => {
        console.log(
          "DependencyTracker: Document changed:",
          event.document.fileName
        );
        if (event.document.fileName.endsWith("pyproject.toml")) {
          console.log(
            "DependencyTracker: pyproject.toml changed, updating in 1 second"
          );
          setTimeout(() => this.refreshVersions(), 1000);
        }
      }
    );

    this.disposables.push(onDidChangeActiveEditor, onDidChangeTextDocument);
  }

  private setupAutoRefresh(): void {
    const config = vscode.workspace.getConfiguration("pythonDependencyTracker");
    const enableAutoCheck = config.get<boolean>("enableAutoCheck", true);
    const checkInterval = config.get<number>("checkInterval", 300000);

    if (enableAutoCheck) {
      this.refreshTimer = setInterval(() => {
        this.refreshVersions();
      }, checkInterval);
    }
  }

  private updateCodeLens(): void {
    this.codeLensProvider.updateDependencies(this.dependencies);
    this.hoverProvider.updateDependencies(this.dependencies);
  }

  async toggleShowVersions(): Promise<void> {
    await this.codeLensProvider.toggleShowVersions();
  }

  async updateToInstalled(dependency: Dependency): Promise<void> {
    if (!dependency || !dependency.installedVersion) {
      return;
    }
    await this.updateVersionInFile(
      dependency
    );
  }

  async updateToLatest(dependency: Dependency): Promise<void> {
    if (!dependency || !dependency.latestVersion) {
      return;
    }
    await this.updateVersionInFile(dependency);
  }

  async bumpToInstalled(dependency: Dependency): Promise<void> {
    if (!dependency || !dependency.installedVersion) {
      return;
    }
    await this.updateVersionInFile(dependency);
  }

  async upgradeToLatest(dependency: Dependency[]): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    const terminal = vscode.window.createTerminal("UV Upgrade");
    terminal.sendText(`cd "${workspaceFolders[0].uri.fsPath}"`);
    
    // Group dependencies by their group
    const groupedDeps = new Map<string | undefined, string[]>();
    dependency.forEach(dep => {
      const group = dep.group;
      if (!groupedDeps.has(group)) {
        groupedDeps.set(group, []);
      }
      groupedDeps.get(group)!.push(dep.name);
    });

    // Execute upgrade commands for each group
    for (const [group, deps] of groupedDeps) {
      const packageNames = deps.join(" ");
      const groupFlag = group ? ` --group ${group}` : "";
      terminal.sendText(`uv add --upgrade${groupFlag} ${packageNames}`);
    }
    
    terminal.show();

    setTimeout(() => this.refreshVersions(), 1000);
  }

  async bumpAll(): Promise<void> {
    const needsBump = this.dependencies.filter(
      (dep) =>
        dep.installedVersion && dep.requestedVersion !== dep.installedVersion
    );

    if (needsBump.length === 0) {
      vscode.window.showInformationMessage(
        "Нет пакетов для обновления до установленной версии"
      );
      return;
    }

    for (const dep of needsBump) {
      await this.updateVersionInFile(dep);
    }

    vscode.window.showInformationMessage(
      `Обновлено ${needsBump.length} пакетов до установленной версии`
    );
  }

  async upgradeAll(): Promise<void> {
    const needsUpgrade = this.dependencies.filter(
      (dep) => dep.latestVersion && dep.installedVersion !== dep.latestVersion
    );

    if (needsUpgrade.length === 0) {
      vscode.window.showInformationMessage(
        "Нет пакетов для обновления до последней версии"
      );
      return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    const terminal = vscode.window.createTerminal("UV Upgrade All");
    terminal.sendText(`cd "${workspaceFolders[0].uri.fsPath}"`);

    // Group dependencies by their group
    const groupedDeps = new Map<string | undefined, string[]>();
    needsUpgrade.forEach(dep => {
      const group = dep.group;
      if (!groupedDeps.has(group)) {
        groupedDeps.set(group, []);
      }
      groupedDeps.get(group)!.push(dep.name);
    });

    // Execute upgrade commands for each group
    for (const [group, deps] of groupedDeps) {
      const packageNames = deps.join(" ");
      const groupFlag = group ? ` --group ${group}` : "";
      terminal.sendText(`uv add --upgrade${groupFlag} ${packageNames}`);
    }

    terminal.show();

    // Обновляем информацию о зависимостях после небольшой задержки
    setTimeout(() => this.refreshVersions(), 3000);
  }

  private async updateVersionInFile(dependency: Dependency): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    const pyprojectPath = path.join(
      workspaceFolders[0].uri.fsPath,
      "pyproject.toml"
    );

    try {
      const content = fs.readFileSync(pyprojectPath, "utf8");
      const lines = content.split("\n");
      console.log(lines[dependency.line], dependency.name);
      let line = lines[dependency.line];
      if (dependency.installedVersion)
        line = line.replace(dependency.requestedVersion, dependency.installedVersion);

      lines[dependency.line] = line;

      fs.writeFileSync(pyprojectPath, lines.join("\n"), "utf8");

      vscode.window.showInformationMessage(
        `Updated ${dependency.name} to version ${dependency.installedVersion}`
      );

      // Update dependency information after a small delay
      setTimeout(() => this.refreshVersions(), 500);
    } catch (error) {
      console.error(`Error updating version for ${dependency.name}:`, error);
      vscode.window.showErrorMessage(`Error updating ${dependency.name}: ${error}`);
    }
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.codeLensProvider.dispose();
    this.hoverProvider.dispose();
  }
}
