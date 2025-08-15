# SafeNet Guardian - Advanced Parental Control Extension

🛡️ **Protect your family from harmful content with advanced filtering and multi-language support**

## Features

### 🔒 Core Protection
- **URL Filtering**: Blocks harmful websites using exact matches and wildcard patterns
- **Keyword Detection**: Scans page content for inappropriate keywords in multiple languages
- **Real-time Blocking**: Intercepts requests before they load to prevent exposure
- **Multi-language Support**: English, Amharic, and Arabic keyword detection

### 📊 Parent Dashboard
- **Modern UI**: Clean, responsive dashboard for easy rule management
- **Statistics**: View blocking statistics and recent activity
- **Rule Management**: Add/remove blocked sites and keywords
- **Export/Import**: Backup and restore your settings
- **Activity Logs**: Monitor all blocked content attempts

### 🚀 Advanced Features
- **Offline Protection**: Works without internet connection
- **Performance Optimized**: Fast keyword matching with minimal impact
- **Cross-browser Support**: Chrome, Firefox, Edge, and Opera
- **Mobile Friendly**: Responsive design for all devices
- **Secure**: Local storage with encryption support

## Installation

### For Chrome/Edge/Opera:

1. **Download the Extension**
   ```bash
   git clone https://github.com/your-repo/safenet-guardian.git
   cd safenet-guardian
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension folder

3. **Configure Settings**
   - Click the SafeNet Guardian icon in your toolbar
   - Click "Open Dashboard" to configure rules
   - Add blocked sites and keywords as needed

### For Firefox:

1. **Package for Firefox**
   ```bash
   # Install web-ext if you haven't already
   npm install -g web-ext
   
   # Build the extension
   web-ext build
   ```

2. **Install in Firefox**
   - Go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the built extension file

## Configuration

### Adding Blocked Sites

1. Open the dashboard (click extension icon → "Open Dashboard")
2. Go to "Blocked Sites" tab
3. Click "Add Site"
4. Enter the domain (e.g., `example.com` or `*.example.com` for wildcards)
5. Select category and save

### Adding Keywords

1. Go to "Keywords" tab in dashboard
2. Select language (English, Amharic, or Arabic)
3. Click "Add Keyword"
4. Enter the keyword and category
5. Save

### Categories Available:
- **Adult Content**: Inappropriate adult material
- **Gambling**: Online gambling and betting sites
- **Scams/Fraud**: Phishing and scam websites
- **Violence**: Violent or harmful content
- **Other**: Custom categories

## Usage

### Basic Protection
Once installed, SafeNet Guardian automatically:
- Blocks known harmful websites
- Scans page content for inappropriate keywords
- Shows a warning page when content is blocked
- Logs all blocking activity

### Dashboard Access
- **Quick Access**: Click the extension icon in toolbar
- **Full Dashboard**: Click "Open Dashboard" in popup
- **Direct URL**: Navigate to `chrome-extension://[ID]/dashboard.html`

### Monitoring Activity
- View recent blocks in the popup
- Check detailed logs in the dashboard
- Export activity reports
- Monitor protection statistics

## Advanced Configuration

### Custom Rules
You can customize the rules by editing `rules.json`:

```json
{
  "blocked_sites": [
    "example-adult-site.com",
    "*.gambling.com"
  ],
  "keywords": {
    "en": ["porn", "gambling", "scam"],
    "am": ["ወንጀለኛ", "ማሳለፊያ"],
    "ar": ["إباحية", "قمار"]
  }
}
```

### Offline Mode
The extension works offline by default:
- All rules are stored locally
- No internet required for blocking
- Updates available when online

### Performance Settings
- **Scan Delay**: 1 second after page load
- **Max Text Length**: 50,000 characters per page
- **Keyword Matching**: Optimized regex patterns

## Security Features

### Protection Against Bypass
- **Extension Lock**: Password protection for settings
- **Tamper Detection**: Monitors for unauthorized changes
- **Secure Storage**: Encrypted local storage
- **Update Verification**: Validates rule updates

### Privacy
- **Local Processing**: All content scanning happens locally
- **No Data Collection**: No personal data sent to servers
- **Transparent Logging**: All activity logged locally only

## Troubleshooting

### Common Issues

**Extension not blocking content:**
1. Check if protection is enabled in popup
2. Verify rules are loaded in dashboard
3. Check browser console for errors

**False positives:**
1. Report via dashboard "Report Issue" button
2. Temporarily disable protection for specific sites
3. Add exceptions to rules

**Performance issues:**
1. Reduce number of keywords
2. Limit wildcard patterns
3. Check for conflicting extensions

### Debug Mode
Enable debug logging:
1. Open browser console
2. Look for `[SafeNet]` messages
3. Check for error messages

## Development

### Project Structure
```
safenet-guardian/
├── manifest.json          # Extension manifest
├── background.js          # Core filtering engine
├── content.js            # Content script for page scanning
├── dashboard.html        # Parent dashboard UI
├── dashboard.js          # Dashboard functionality
├── popup.html           # Extension popup
├── popup.js             # Popup functionality
├── warning.html         # Blocked content page
├── rules.json           # Default rules
├── icons/               # Extension icons
└── README.md           # This file
```

### Building for Distribution

**Chrome Web Store:**
```bash
# Create ZIP file
zip -r safenet-guardian.zip . -x "*.git*" "README.md"
```

**Firefox Add-ons:**
```bash
# Build with web-ext
web-ext build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Setup
```bash
git clone https://github.com/your-repo/safenet-guardian.git
cd safenet-guardian
# Load in browser for testing
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- **Email**: support@safenetguardian.com
- **Issues**: GitHub Issues page
- **Documentation**: This README and inline code comments

## Changelog

### Version 1.0.0
- Initial release
- Core filtering engine
- Multi-language support
- Parent dashboard
- Offline protection
- Cross-browser compatibility

---

**SafeNet Guardian** - Protecting families, one click at a time. 🛡️


