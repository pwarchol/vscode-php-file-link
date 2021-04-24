# VS Code PHP File Link

## Creates links to other files declared as strings.
<br />

![](images/php-file-link.png)

## Extension Settings

* `phpFileLink.supportedExtensions`: 
    ### List of file extensions that can be linked
    ```json
    "default": ["php","ini","log"]
    ```

* `phpFileLink.linkMode`: 

    ### Method of resolving paths to files
    ```json
    "enum": [
        "active_document",
        "scan_workspace"
    ],
    "default": "scan_workspace"
    ```
    `active_document`: Resolving path based on active document directory<br />
    `scan_workspace`: Scanning all workspace files for match