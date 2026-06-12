import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

function isProjectManifestDocument(document: vscode.TextDocument): boolean {
  const baseName = path.basename(document.fileName);
  return baseName === "pyproject.toml" || baseName === "uv.lock";
}

export function getProjectRootFromDocument(
  document: vscode.TextDocument
): string | undefined {
  if (!isProjectManifestDocument(document)) {
    return undefined;
  }

  const projectRoot = path.dirname(document.fileName);
  if (fs.existsSync(path.join(projectRoot, "pyproject.toml"))) {
    return projectRoot;
  }

  return undefined;
}

function getProjectRootFromEditors(): string | undefined {
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    const projectRoot = getProjectRootFromDocument(activeEditor.document);
    if (projectRoot) {
      return projectRoot;
    }
  }

  for (const editor of vscode.window.visibleTextEditors) {
    const projectRoot = getProjectRootFromDocument(editor.document);
    if (projectRoot) {
      return projectRoot;
    }
  }

  return undefined;
}

function getProjectRootFromWorkspaceFolders(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return undefined;
  }

  for (const folder of workspaceFolders) {
    const pyprojectPath = path.join(folder.uri.fsPath, "pyproject.toml");
    if (fs.existsSync(pyprojectPath)) {
      return folder.uri.fsPath;
    }
  }

  return undefined;
}

async function findProjectRootInWorkspace(): Promise<string | undefined> {
  const pyprojectFiles = await vscode.workspace.findFiles(
    "**/pyproject.toml",
    "{**/node_modules/**,**/.venv/**,**/.git/**}",
    1
  );

  if (pyprojectFiles.length === 0) {
    return undefined;
  }

  return path.dirname(pyprojectFiles[0].fsPath);
}

export async function resolveProjectRoot(): Promise<string | undefined> {
  const fromEditors = getProjectRootFromEditors();
  if (fromEditors) {
    return fromEditors;
  }

  const fromWorkspaceRoot = getProjectRootFromWorkspaceFolders();
  if (fromWorkspaceRoot) {
    return fromWorkspaceRoot;
  }

  return findProjectRootInWorkspace();
}
