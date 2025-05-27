import * as vscode from "vscode";
import { DependencyTracker } from "./dependencyTracker";
import { PyProjectParser } from "./parsers/pyProjectParser";
import { UvLockParser } from "./parsers/uvLockParser";
import { VersionChecker } from "./versionChecker";
import { DependencyCodeLensProvider } from "./codeLensProvider";
import { DependencyHoverProvider } from "./hoverProvider";

let dependencyTracker: DependencyTracker;

export function activate(context: vscode.ExtensionContext) {
  console.log("Python Dependency Tracker activated");

  const pyProjectParser = new PyProjectParser();
  const uvLockParser = new UvLockParser();
  const versionChecker = new VersionChecker();
  const codeLensProvider = new DependencyCodeLensProvider();
  const hoverProvider = new DependencyHoverProvider();

  dependencyTracker = new DependencyTracker(
    pyProjectParser,
    uvLockParser,
    versionChecker,
    codeLensProvider,
    hoverProvider
  );

  // Register CodeLens provider
  const codeLensDisposable = vscode.languages.registerCodeLensProvider(
    { language: "toml", pattern: "**/pyproject.toml" },
    codeLensProvider
  );

  // Register Hover provider
  const hoverDisposable = vscode.languages.registerHoverProvider(
    { language: "toml", pattern: "**/pyproject.toml" },
    hoverProvider
  );

  // Register commands
  const refreshCommand = vscode.commands.registerCommand(
    "pythonDependencyTracker.refreshVersions",
    () => dependencyTracker.refreshVersions()
  );

  const toggleShowVersionsCommand = vscode.commands.registerCommand(
    "pythonDependencyTracker.toggleShowVersions",
    () => dependencyTracker.toggleShowVersions()
  );

  const bumpToInstalledCommand = vscode.commands.registerCommand(
    "pythonDependencyTracker.bumpToInstalled",
    (dependency: any) => dependencyTracker.bumpToInstalled(dependency)
  );

  const upgradeToLatestCommand = vscode.commands.registerCommand(
    "pythonDependencyTracker.upgradeToLatest",
    (dependency: any) => dependencyTracker.upgradeToLatest([dependency])
  );

  const bumpAllCommand = vscode.commands.registerCommand(
    "pythonDependencyTracker.bumpAll",
    () => dependencyTracker.bumpAll()
  );

  const upgradeAllCommand = vscode.commands.registerCommand(
    "pythonDependencyTracker.upgradeAll",
    () => dependencyTracker.upgradeAll()
  );

  const openPackagePageCommand = vscode.commands.registerCommand(
    "pythonDependencyTracker.openPackagePage",
    (dependency: any) => {
      const url = dependency.homePage || dependency.packageUrl;
      if (url) {
        vscode.env.openExternal(vscode.Uri.parse(url));
      }
    }
  );

  context.subscriptions.push(
    codeLensDisposable,
    hoverDisposable,
    refreshCommand,
    toggleShowVersionsCommand,
    bumpToInstalledCommand,
    upgradeToLatestCommand,
    bumpAllCommand,
    upgradeAllCommand,
    openPackagePageCommand
  );

  const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument(
    (document) => {
      if (
        document.fileName.endsWith("pyproject.toml") ||
        document.fileName.endsWith("uv.lock")
      ) {
        dependencyTracker.refreshVersions();
      }
    }
  );

  const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      if (
        editor &&
        (editor.document.fileName.endsWith("pyproject.toml") ||
          editor.document.fileName.endsWith("uv.lock"))
      ) {
        dependencyTracker.refreshVersions();
      }
    }
  );

  context.subscriptions.push(
    onDidOpenTextDocument,
    onDidChangeActiveTextEditor
  );

  // Check already opened documents on activation
  vscode.window.visibleTextEditors.forEach((editor) => {
    if (
      editor.document.fileName.endsWith("pyproject.toml") ||
      editor.document.fileName.endsWith("uv.lock")
    ) {
      dependencyTracker.refreshVersions();
    }
  });

  dependencyTracker.start();

  // File system watcher for dependency files
  const fileWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(
      vscode.workspace.workspaceFolders?.[0] || "",
      "{pyproject.toml,uv.lock}"
    )
  );

  fileWatcher.onDidChange(() => dependencyTracker.refreshVersions());
  fileWatcher.onDidCreate(() => dependencyTracker.refreshVersions());
  fileWatcher.onDidDelete(() => dependencyTracker.refreshVersions());

  context.subscriptions.push(fileWatcher);
}

export function deactivate() {
  if (dependencyTracker) {
    dependencyTracker.dispose();
  }
}
