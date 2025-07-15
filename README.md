# 🖼️ Image Downloader Chrome Extension

A lightweight Chrome extension for downloading images from any webpage using intuitive drag-and-drop or right-click functionality.

## ✨ Features

- 🎯 **Drag & Drop**: Drag any image to instantly download with visual feedback
- 🖱️ **Context Menu**: Right-click images for quick download option
- � **Smart Interface**: View download status and recent history
- 📁 **Auto-Organization**: Files saved to dedicated "Image_Downloader" folder
- ⚡ **Fast & Lightweight**: No bloat, just essential functionality

## 🚀 Quick Start

### Installation
1. **Download** - Clone this repository or download ZIP
2. **Chrome Extensions** - Navigate to `chrome://extensions/`
3. **Developer Mode** - Enable in top right corner
4. **Load Extension** - Click "Load unpacked" and select the folder
5. **Ready!** - Pin the extension for easy access

### Usage
| Method | Steps |
|--------|-------|
| **🎯 Drag & Drop** | Drag any image → Drop on floating zone → Downloaded! |
| **🖱️ Right-Click** | Right-click image → "Download with Image Downloader" |
| **📊 Popup** | Click extension icon → View status & history |

## Troubleshooting

### Context Menu Not Showing
If "Download with Image Downloader" doesn't appear when right-clicking images:

1. **Reload the Extension**
   - Go to `chrome://extensions/`
   - Find "Image Downloader" and click the refresh button (🔄)
   - Make sure the extension is enabled (toggle should be blue)

2. **Check Extension Errors**
   - In `chrome://extensions/`, look for any error messages on the extension card
   - Click "Inspect views: service worker" to check for console errors

3. **Verify Permissions**
   - Make sure you're on an `http://` or `https://` website
   - The extension doesn't work on `chrome://` or `file://` pages

### Drag & Drop Errors
If dragging images shows errors or doesn't work:

1. **Extension Context Issues**
   - Reload the extension in `chrome://extensions/`
   - Refresh the webpage you're testing on
   - Look for "Extension context invalidated" errors in browser console (F12)

2. **Image Compatibility**
   - Make sure you're dragging actual images (JPG, PNG, GIF, etc.)
   - Some images may be CSS backgrounds (use right-click instead)
   - Avoid dragging images from other extensions or special pages

3. **Test File Available**
   - Open the included `test.html` file to verify both features work
   - This file has test images and diagnostic tools

### Downloads Not Working
If downloads don't start:

1. **Check Download Permissions**
   - Chrome may ask for download permission on first use
   - Make sure "Ask where to save each file" is disabled in Chrome settings
   - Check if popup blockers are interfering

2. **File Location**
   - Downloads are saved to your default Downloads folder
   - Look for a subfolder called "Image_Downloader"

## 📁 Project Structure

```
Image_Downloader/
├── 📄 manifest.json           # Extension configuration
├── 🎨 icons/                 # Extension icons (16-128px)
├── 📱 popup/                 # Extension popup interface
│   ├── popup.html            # Popup layout
│   ├── popup.js              # Popup functionality
│   └── popup.css             # Popup styling
├── ⚙️ background/            # Background service worker
│   └── background.js         # Core download logic
├── 🌐 content/               # Content script injection
│   ├── content.js            # Page interaction
│   └── content.css           # Drag zone styling
└── 🛠️ test.html              # Development testing page
```

## 🔧 Technical Details

- **Manifest Version**: V3 (Latest Chrome standard)
- **Required Permissions**: `activeTab`, `downloads`, `storage`, `contextMenus`
- **Browser Support**: Chrome 88+ (Manifest V3 compatible)
- **File Types**: Supports all image formats (PNG, JPG, GIF, SVG, WebP)

## 🛠️ Development

### Local Setup
```bash
# Clone & Navigate
git clone https://github.com/pratikmtele/Image-Downloader-Extension.git
cd Image_Downloader

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select this folder
```

### Testing
- Use `test.html` for feature testing
- Monitor console for error debugging
- Reload extension after code changes

## 🎨 Icons
Custom-designed green circular icons with download arrow:
- `16px` - Extension management
- `32px` - Extension management  
- `48px` - Toolbar display
- `128px` - Chrome Web Store

## 🤝 Contributing
1. Fork repository
2. Create feature branch
3. Test thoroughly
4. Submit pull request


## 🔒 Privacy
- No data collection or transmission
- Local storage only (Chrome API)
- No external services required
- Current tab access only when needed
