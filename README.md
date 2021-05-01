# VS Code PHP File Link


![](images/php-file-link.png)

This extension assigns links to files declared as strings in the active PHP document.<br />
In case there are many matching files, the extension will give you a list to choose from.

<br />

## Extension Settings

* `phpFileLink.supportedExtensions`: 
    List of file extensions that can be linked
    ```json
    "default": ["php","ini","log"]
    ```

* `phpFileLink.excludeScanFolders`: 
    Excluding directories/files in workspace from being scanned
    ```json
    "default": ["node_modules",".git"]
    ```

* `phpFileLink.cacheWorkspaceFiles`: 
    Caching list of workspace files for larger projects for better performance
    ```json
    "default": false
    ```
