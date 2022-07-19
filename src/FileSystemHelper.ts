import * as path from 'path';
import * as vscode from 'vscode';
import { Settings } from './Settings';
import { ExtState } from './types';

let defaultState: ExtState = {
    lastUpdate: 0, 
    findInProgress: false,
    files: []
};

let progressParams = {
    location: vscode.ProgressLocation.Window,
    cancellable: false,
    title: ' '+Settings.appName
};

export class FileSystemHelper {

    context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public getState(ws: vscode.WorkspaceFolder, returnDefaultState: boolean = true): ExtState | undefined {
        let defaultReturn = returnDefaultState ? {...defaultState} : undefined;
        return this.context.workspaceState.get(Settings.appName+ws.uri.fsPath, defaultReturn);
    }

    public async updateState(ws: vscode.WorkspaceFolder, progress: boolean, value: string[], updateTime?: number) {
        let state: ExtState = this.getState(ws)!;
        state.findInProgress = progress;
        state.files = value;
        state.lastUpdate = updateTime !== undefined ? updateTime : Math.floor(Date.now()/1000);
        await this.context.workspaceState.update(Settings.appName+ws.uri.fsPath, state);
    }

    public async reloadCacheFiles(touchedWs: vscode.WorkspaceFolder[]) {
        vscode.window.withProgress(progressParams, async () => {
            for (let [key, ws] of Object.entries(touchedWs)) {
                let state = this.getState(ws, false);
                if(state !== undefined && state.findInProgress === false) {
                    await this.updateState(ws, true, state.files);
                    let newPaths = await FileSystemHelper.findWsFiles(ws) ?? [];
                    await this.updateState(ws, false, newPaths);
                }
            }
        });
    }

    public async getWsFiles(ws: vscode.WorkspaceFolder, token: vscode.CancellationToken): Promise<string[]> {
        if(!Settings.cacheWorkspaceFiles()) {
            return await vscode.window.withProgress(progressParams, async () => {
                return await FileSystemHelper.findWsFiles(ws, token) ?? [];
            });
        }

        let cachePaths: string[] = [];
        let state: ExtState = this.getState(ws)!;
        cachePaths = state.files!;
        let oldUpdateTime = state.lastUpdate;
        if(state.findInProgress || state.lastUpdate > Math.floor(Date.now()/1000)-Settings.refreshCacheAfter()) {
            return cachePaths;
        }

        this.updateState(ws, true, cachePaths);
        token.onCancellationRequested(async () => {
            await this.updateState(ws, false, cachePaths, oldUpdateTime);
        });

        if(cachePaths.length > 0) {
            vscode.window.withProgress(progressParams, async () => {
                let newPaths = await FileSystemHelper.findWsFiles(ws, token) ?? [];
                await this.updateState(ws, false, newPaths);
            });
            return cachePaths;
        }

        cachePaths = await vscode.window.withProgress(progressParams, async () => {
            return await FileSystemHelper.findWsFiles(ws, token) ?? [];
        });
        if(!token.isCancellationRequested) {
            await this.updateState(ws, false, cachePaths);
        }
        return cachePaths;
    }

    public static getTouchedWs(files: readonly vscode.Uri[]): vscode.WorkspaceFolder[] {
        let touched: vscode.WorkspaceFolder[] = [];
        for (let [key, file] of Object.entries(files)) {
            let wsFolder = vscode.workspace.getWorkspaceFolder(file);
            if(wsFolder && touched.findIndex(x => x.uri.fsPath===wsFolder?.uri.fsPath) === -1) touched.push(wsFolder);
        }
        return touched;
    };

    public static userPathSplit(value: string) {
        return path.posix.normalize(value.replace(/\\/g, '/')).split(path.posix.sep).filter(obj => !['.','..',''].includes(obj));
    }

    public static getFileName(value: string) {
        return path.posix.basename(value.replace(/\\/g, '/'));
    }

    public static async fileExists(_path: string): Promise<boolean> {
        try {
            let fileStat = await vscode.workspace.fs.stat(vscode.Uri.file(_path));
            return fileStat && fileStat.type === vscode.FileType.File;
        } catch (error) {
            return false;
        }
    }

    public static async findWsFiles(ws: vscode.WorkspaceFolder, token?: vscode.CancellationToken) {
        let glob = '**/*.{'+Settings.supportedExtensions().join(',')+'}';
        let files = await vscode.workspace.findFiles(new vscode.RelativePattern(ws, glob), undefined, undefined, token);
        return files.map((item) => item.fsPath);
    }

}