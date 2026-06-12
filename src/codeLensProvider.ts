import * as vscode from "vscode";
import * as path from "path";
import { Dependency } from "./types";

export class DependencyCodeLensProvider implements vscode.CodeLensProvider {
  private dependencies: Dependency[] = [];
  private pyprojectPath?: string;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;
  private showVersions: boolean = true;

  constructor() {
    // Restore show/hide state from settings
    const config = vscode.workspace.getConfiguration("pythonDependencyTracker");
    this.showVersions = config.get<boolean>("showVersions", true);
  }

  updateDependencies(
    dependencies: Dependency[],
    pyprojectPath?: string
  ): void {
    this.dependencies = dependencies;
    this.pyprojectPath = pyprojectPath;
    console.log(
      "CodeLensProvider: Updating dependencies:",
      dependencies.length
    );
    this._onDidChangeCodeLenses.fire();
  }

  private async saveShowVersionsState(): Promise<void> {
    const config = vscode.workspace.getConfiguration("pythonDependencyTracker");
    await config.update(
      "showVersions",
      this.showVersions,
      vscode.ConfigurationTarget.Workspace
    );
  }

  async toggleShowVersions(): Promise<void> {
    this.showVersions = !this.showVersions;
    await this.saveShowVersionsState();
    this._onDidChangeCodeLenses.fire();
  }

  provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    if (!document.fileName.endsWith("pyproject.toml")) {
      return [];
    }

    if (
      this.pyprojectPath &&
      path.normalize(document.fileName) !== path.normalize(this.pyprojectPath)
    ) {
      return [];
    }

    console.log("CodeLensProvider: Providing CodeLens for:", document.fileName);
    console.log(
      "CodeLensProvider: Number of dependencies:",
      this.dependencies.length
    );
    console.log("CodeLensProvider: Show versions:", this.showVersions);

    const codeLenses: vscode.CodeLens[] = [];

    if (document.lineCount > 0) {
      const toggleCodeLens = this.createToggleCodeLens();
      if (toggleCodeLens) {
        codeLenses.push(toggleCodeLens);
      }

      // Добавляем массовые операции если есть что обновлять
      if (this.showVersions) {
        const massOperationsCodeLenses = this.createMassOperationsCodeLenses();
        codeLenses.push(...massOperationsCodeLenses);
      }
    }

    if (this.showVersions) {
      for (const dep of this.dependencies) {
        if (dep.line >= 0 && dep.line < document.lineCount) {
          const line = document.lineAt(dep.line);

          const depCodeLenses = this.createInfoCodeLens(dep, line);
          codeLenses.push(...depCodeLenses);
        } else {
          console.warn(
            `CodeLensProvider: Incorrect line number ${dep.line} for dependency ${dep.name}, total lines: ${document.lineCount}`
          );
        }
      }
    }

    console.log("CodeLensProvider: Created CodeLens:", codeLenses.length);
    return codeLenses;
  }

  private createToggleCodeLens(): vscode.CodeLens | null {
    const range = new vscode.Range(0, 0, 0, 0);
    const title = this.showVersions
      ? "🔽 Hide version information"
      : "🔼 Show version information";

    const command: vscode.Command = {
      title: title,
      command: "pythonDependencyTracker.toggleShowVersions",
    };

    return new vscode.CodeLens(range, command);
  }

  private createMassOperationsCodeLenses(): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];
    const range = new vscode.Range(0, 0, 0, 0);

    // Проверяем есть ли пакеты для bump (requestedVersion !== installedVersion)
    const needsBump = this.dependencies.filter(
      (dep) =>
        dep.installedVersion && dep.requestedVersion !== dep.installedVersion
    );

    // Проверяем есть ли пакеты для upgrade (installedVersion !== latestVersion)
    const needsUpgrade = this.dependencies.filter(
      (dep) => dep.latestVersion && dep.installedVersion !== dep.latestVersion
    );

    if (needsBump.length > 0) {
      // Текстовый CodeLens без команды
      codeLenses.push(
        new vscode.CodeLens(range, {
          title: `📦 Bump all (${needsBump.length})`,
          command: "pythonDependencyTracker.bumpAll",
        })
      );
    }

    if (needsUpgrade.length > 0) {
      // Текстовый CodeLens без команды
      codeLenses.push(
        new vscode.CodeLens(range, {
          title: `🚀 Upgrade all (${needsUpgrade.length})`,
          command: "pythonDependencyTracker.upgradeAll",
        })
      );
    }

    return codeLenses;
  }

  private createInfoCodeLens(
    dep: Dependency,
    line: vscode.TextLine
  ): vscode.CodeLens[] {
    const range = new vscode.Range(
      line.lineNumber,
      0,
      line.lineNumber,
      line.text.length
    );

    const commands: vscode.Command[] = [];

    if (
      dep.installedVersion === dep.latestVersion &&
      dep.requestedVersion === dep.latestVersion
    ) {
      // Все версии совпадают - показываем только latest (без действия)
      commands.push({
        title: `🟢 latest: ${dep.latestVersion}`,
        command: "",
        arguments: [dep],
      });
    } else {
      // Показываем текущую установленную версию
      const installedIsLatest = dep.installedVersion === dep.latestVersion;
      const label = installedIsLatest ? "🟢 latest" : "🟡 fixed";
      if (dep.installedVersion) {
        commands.push({
          title: `${label}: ${dep.installedVersion}`,
          command: "",
          arguments: [dep],
        });

        // Если requestedVersion !== installedVersion, показываем bump
        if (dep.requestedVersion !== dep.installedVersion) {
          commands.push({
            title: `▲ bump: ${dep.installedVersion}`,
            command: "pythonDependencyTracker.bumpToInstalled",
            arguments: [dep],
          });
        }
      }

      // Если installedVersion !== latestVersion, показываем upgrade
      if (dep.installedVersion !== dep.latestVersion) {
        commands.push({
          title: `▲ latest: ${dep.latestVersion}`,
          command: "pythonDependencyTracker.upgradeToLatest",
          arguments: [dep],
        });
      }
    }

    return commands.map((v) => new vscode.CodeLens(range, v));
  }
  dispose(): void {
    this._onDidChangeCodeLenses.dispose();
  }
}
