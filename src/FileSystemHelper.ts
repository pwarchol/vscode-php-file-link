import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Settings } from './Settings';
import { ExtState } from './types';

let defaultState: ExtState = {
    cache: {
        sessionId: vscode.env.sessionId,
        workspaces: {}
    }
};

export class FileSystemHelper {

    context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public getExtensionState() {
        let state = this.context.workspaceState.get(Settings.appName, defaultState);
        if(state.cache.sessionId === vscode.env.sessionId) return state;
        else {
            this.context.workspaceState.update(Settings.appName, defaultState);
            return defaultState;
        }
    }

    public updateExtWsState(fsPath: string, value: string[] | undefined) {
        let curr = this.getExtensionState();
        if(value) curr.cache.workspaces[fsPath] = {lastUpdate: Math.floor(Date.now()/1000), files: value};
        else delete curr.cache.workspaces[fsPath];
        this.context.workspaceState.update(Settings.appName, curr);
    }

    public clearExtWsState(workspaces: vscode.Uri[]) {
        for (let [key, ws] of Object.entries(workspaces)) {
            this.updateExtWsState(ws.fsPath, undefined);
        }
    }

    public clearExtState() {
        this.context.workspaceState.update(Settings.appName, defaultState);
    }

    public async getWsFiles(currentWs: vscode.WorkspaceFolder) {
        let foundPaths: string[] | undefined;

        if(Settings.cacheWorkspaceFiles()) {
            let state = this.getExtensionState();
            let currentWsCache = state.cache.workspaces[currentWs.uri.fsPath];
            if(currentWsCache && currentWsCache.lastUpdate > Math.floor(Date.now()/1000)-Settings.refreshCacheEvery()) foundPaths = currentWsCache.files!;
        }

        if(!foundPaths) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                cancellable: false,
                title: ' '+Settings.appName
            }, async () => {
                foundPaths = await FileSystemHelper.findWsFiles(currentWs);
            });

            if(Settings.cacheWorkspaceFiles()) this.updateExtWsState(currentWs.uri.fsPath, foundPaths);
        }

        return foundPaths ? foundPaths : [];
    }

    public static getTouchedWs(files: readonly vscode.Uri[]) {
        let touched: vscode.Uri[] = [];
        for (let [key, file] of Object.entries(files)) {
            let wsFolder = vscode.workspace.getWorkspaceFolder(file);
            if(wsFolder && touched.findIndex(x => x.fsPath===wsFolder?.uri.fsPath) === -1) touched.push(wsFolder.uri);
        }
        return touched;
    };

    public static userPathSplit(value: string) {
        return path.posix.normalize(value.replace(/\\/g, '/')).split(path.posix.sep).filter(obj => !['.','..',''].includes(obj));
    }

    public static getFileName(value: string) {
        return path.posix.basename(value.replace(/\\/g, '/'));
    }

    public static fileExists(_path: string): boolean {
        if(fs.existsSync(_path)) return fs.lstatSync(_path).isFile();
        else return false;
    }

    public static async findWsFiles(currentWs: vscode.WorkspaceFolder) {
        let glob = '**/*.{'+Settings.supportedExtensions().join(',')+'}';
        let files = await vscode.workspace.findFiles(new vscode.RelativePattern(currentWs, glob));
        return files.map((item) => item.fsPath);
    }

}