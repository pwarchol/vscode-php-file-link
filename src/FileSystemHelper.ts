import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Settings } from './Settings';

export class FileSystemHelper {

    context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public loadWsFiles(workspaces: vscode.Uri[]) {
        for (let [key, ws] of Object.entries(workspaces)) {
            let allWsFiles = FileSystemHelper.findFilesRecursiveSync(ws.fsPath);
            this.context.workspaceState.update(ws.fsPath, allWsFiles);
        }
    }

    public onChangeWorkspace(event: vscode.WorkspaceFoldersChangeEvent) {
        this.loadWsFiles(event.added.map((item) => item.uri));
        for (let [key, ws] of Object.entries(event.removed)) {
            this.context.workspaceState.update(ws.uri.fsPath, undefined);
        }
    }

    public getFromCache(ws: vscode.WorkspaceFolder) {
        let foundPaths: string[] | undefined = this.context.workspaceState.get(ws.uri.fsPath);
        if(!foundPaths) foundPaths = FileSystemHelper.findFilesRecursiveSync(ws.uri.fsPath);

        return foundPaths;
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

    public static findFilesRecursiveSync(dir: string, findList: string[] | undefined = undefined, filelist: string[] = []) {
        let lp = this;
        let files = fs.readdirSync(dir);
        filelist = filelist || [];
        files.forEach(function(file) {
            if (fs.statSync(path.join(dir, file)).isDirectory()) {
                if(!Settings.excludeScanFolders().includes(file)) filelist = lp.findFilesRecursiveSync(path.join(dir, file), findList, filelist);
            } else if(!findList || findList.includes(file)) 
                filelist.push(path.join(dir, file));
        });
        return filelist;
    }

}