import * as vscode from 'vscode';

/**
 * Settings as functions for always actual information.
 */
export class Settings {

    static appName = 'phpFileLink';

    static supportedExtensions = (): string[] => {
        return vscode.workspace.getConfiguration().get(Settings.appName+'.supportedExtensions', ['php','ini','log']);
    };

    static showLinksForFilesThatDoNotExist = (): boolean => {
        return false;
    };

    static cacheWorkspaceFiles = (): boolean => {
        return vscode.workspace.getConfiguration().get(Settings.appName+'.cacheWorkspaceFiles', true);
    };

    static refreshCacheAfter = (): number => {
        return vscode.workspace.getConfiguration().get(Settings.appName+'.refreshCacheAfter', 120);
    };

}