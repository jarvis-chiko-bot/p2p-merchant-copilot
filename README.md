# P2P Merchant Copilot

A Chrome extension for P2P merchants with a profit calculator and quick chat templates.

## Features

### Profit Calculator
- **Buy Price** - Enter your purchase price
- **Sell Price** - Enter your selling price  
- **Amount** - Enter the trade amount
- **Fee %** - Set your platform fee percentage
- **Real-time calculations** showing:
  - Gross Profit
  - Fee Amount
  - Net Profit
  - Profit Margin

### Chat Templates
- **5 customizable templates** stored in chrome.storage.sync
- **One-click copy** to clipboard
- **Quick paste** into any focused input field
- **Keyboard shortcuts** for instant access

### UI Features
- **Draggable widget** - Position anywhere on screen
- **Resizable** - Adjust to your preference
- **Minimize/Maximize** - Collapse to save space
- **Auto theme** - Dark/light mode based on system preference
- **Clean, minimal design** - No clutter, maximum efficiency

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` | Show/Hide widget |
| `Ctrl+Shift+1-5` | Paste template 1-5 into focused input |

## Installation

### Method 1: Load Unpacked (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select this folder (the one containing `manifest.json`)
6. The extension is now installed and active!

### Package as ZIP

```bash
./scripts/build-zip.sh
# outputs dist/p2p-merchant-copilot-vX.Y.Z.zip
```

### Method 2: From Chrome Web Store (Coming Soon)

Once published, you can install directly from the Chrome Web Store.

## Usage

### Opening the Widget
- Click the extension icon in your toolbar
- Use `Ctrl+Shift+P` keyboard shortcut
- The widget will appear on every page you visit

### Using the Calculator
1. Open the widget (Calculator tab is active by default)
2. Enter your buy price, sell price, amount, and fee %
3. Profit calculations update automatically

### Using Templates
1. Switch to the **Templates** tab
2. Click **Copy** to copy to clipboard
3. Click **Paste** to insert into the currently focused input field
4. Or use `Ctrl+Shift+1-5` to paste directly from keyboard

### Customizing Templates
1. Click **Settings** in the popup or right-click the extension icon
2. Edit your 5 templates
3. Set your default fee percentage
4. Click **Save Changes**

## File Structure

```
.
├── manifest.json        # Extension manifest (MV3)
├── background.js        # Service worker
├── content.js           # Content script (widget injection)
├── styles.css           # Widget styles
├── popup.html           # Extension popup
├── popup.js             # Popup script
├── options.html         # Settings page
├── options.js           # Options script
├── options.css          # Options styles
├── icons/               # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

## Permissions

- **storage** - Save templates and settings
- **clipboardWrite** - Copy templates to clipboard
- **activeTab** - Interact with current page
- **<all_urls>** - Widget available on all websites

## Customization

### Default Templates
The extension comes with 5 pre-written templates (CRC/SINPE-friendly) and supports quick placeholders:
- `{monto}` `{banco}` `{minutos}` `{ref}`

You can insert placeholders quickly from the widget (Templates tab → Vars) and customize everything in the Options page.

Edit these in the Options page to match your communication style.

### Default Fee
Set your platform's default fee percentage (e.g., 1%) in the Options page. This will be pre-filled in the calculator.

## References

- Binance C2C Quick Start (summary): `docs/binance-c2c-quick-start.md`
- Official doc: https://developers.binance.com/docs/c2c/quick-start

## Troubleshooting

### Widget not appearing?
- Refresh the page
- Check if extension is enabled in `chrome://extensions/`
- Try clicking the extension icon and "Show Widget"

### Keyboard shortcuts not working?
- Make sure you're focused on a text input field for paste shortcuts
- Some websites may override shortcuts - use the widget buttons instead

### Settings not saving?
- Ensure you're signed into Chrome (sync settings require account)
- Check if Chrome sync is enabled in `chrome://settings/syncSetup`

## Technical Details

- **Manifest Version**: 3
- **Language**: Vanilla JavaScript (ES6+)
- **Styling**: CSS with CSS Variables for theming
- **Storage**: Chrome Storage Sync API
- **No external dependencies** - Pure vanilla JS/HTML/CSS

## Contributing

This extension is built with simplicity in mind. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - Feel free to use and modify as needed.

## Support

For issues or feature requests, please open an issue on the repository.

---

**Happy Trading! 📊**
