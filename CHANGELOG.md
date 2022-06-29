# Change Log

## 1.0.0

- DocBlock support

## 0.3.2

- Fix parsing php short tags #5

## 0.3.1

- Multiple files to pick, fix for path match

## 0.3.0

- Switch to built-in vscode findFiles
- fs to vscode.workspace.fs
- Changed cache logic + refresh time
- Added config `refreshCacheAfter`
- Removed config `excludeScanFolders`, no needed with vscode findFiles
- Changed file picker quickOpen to showQuickPick
- Fix Issue #3

## 0.2.8

- Removed `linkMode` - this extension always need list of all workspace files to work.
- Added config `excludeScanFolders` and `cacheWorkspaceFiles`
- Added php-parser (removed regex and line by line loop)
- Added experimental cache workspace files list

## 0.2.0

- Scaning all workspace files for match
- New config option `linkMode`
- Performance optimization

## 0.1.2

- Improved quotes regex