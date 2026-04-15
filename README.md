# allegro-classic-view

This repository contains two extension variants:

- `firefox/` - Firefox version
- `chrome/` - Chrome version

## Packaging - Firefox

1. Go to the project directory.
2. Run the script:

```bat
build-firefox.bat
```

3. Or package the contents of the `firefox` folder manually into zip (without an extra parent directory):

4. Rename the file extension to `.xpi` (optional for local usage).  
In AMO, you can also upload ZIP and Mozilla will sign the add-on.

## Packaging - Chrome

1. Go to the project directory.
2. Run the script:

```bat
build-chrome.bat
```

3. Or package the contents of the `chrome` folder manually into zip (without an extra parent directory)
