# Allegro Clean View

A plugin for Firefox and Chrome browsers that improves the Allegro.pl website's user experience:
- Restores product descriptions and parameters
- Removes all ads/recommendations from the product page
- Removes recommendations from the Cart page
- Removes recommendations from the Favorites page
- Moves the new 'Combine Shipments' button to the top next to the 'Create List' button and removes the entire section presenting it so it doesn't take up additional space on the item list

### Project structure
This repository contains three extension variants:

- `firefox/` - Firefox version
- `chrome/` - Chrome version
- `userscript/` - UserScript version (without control panel)

### Get the extension

- Firefox (AMO): https://addons.mozilla.org/en-US/firefox/addon/allegro-clean-view
- Chrome (Chrome Web Store): https://chromewebstore.google.com/detail/allegro-clean-view/bdbgeihjandpdlaekgjfhbomjfphdian

### UserScript version

You can also use a standalone UserScript version: `userscript/allegro-clean-view.user.js`

Configuration:
- Edit the `CONFIG` object at the top of the script:
  - `pageSettings.product` - enable/disable product page features
  - `pageSettings.cart` - enable/disable cart cleanup
  - `pageSettings.favorites` - enable/disable favorites cleanup
