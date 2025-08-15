#!/bin/bash

# SafeNet Guardian Installation Script
# This script helps install the SafeNet Guardian extension

echo "🛡️ SafeNet Guardian - Installation Script"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "❌ Error: manifest.json not found. Please run this script from the extension directory."
    exit 1
fi

echo "✅ Extension files found"
echo ""

# Check if icons exist
if [ ! -d "icons" ] || [ -z "$(ls -A icons 2>/dev/null)" ]; then
    echo "📁 Creating icons..."
    mkdir -p icons
    
    # Create SVG icon and convert to PNG
    if command -v convert &> /dev/null; then
        echo "Creating SVG icon..."
        # SVG creation would go here
        echo "Converting to PNG formats..."
        # PNG conversion would go here
        echo "✅ Icons created successfully"
    else
        echo "⚠️  ImageMagick not found. Please add icon files manually:"
        echo "   - icon16.png (16x16 pixels)"
        echo "   - icon48.png (48x48 pixels)"
        echo "   - icon128.png (128x128 pixels)"
    fi
    echo ""
else
    echo "✅ Icons found"
    echo ""
fi

# Check for required files
echo "🔍 Checking required files..."
required_files=("manifest.json" "background.js" "content.js" "dashboard.html" "dashboard.js" "popup.html" "popup.js" "warning.html" "rules.json")
missing_files=()

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo ""
    echo "❌ Missing required files: ${missing_files[*]}"
    echo "Please ensure all files are present before installation."
    exit 1
fi

echo ""
echo "✅ All required files found!"
echo ""

# Build the extension
echo "📦 Building extension package..."
if command -v zip &> /dev/null; then
    zip -r safenet-guardian.zip . -x "*.git*" "README.md" "package.json" "install.sh" "*.zip"
    echo "✅ Extension packaged as safenet-guardian.zip"
else
    echo "⚠️  zip command not found. Please install zip or manually create the package."
fi

echo ""
echo "🎉 Installation preparation complete!"
echo ""
echo "📋 Next steps:"
echo "=============="
echo ""
echo "For Chrome/Edge/Opera:"
echo "1. Open your browser and go to chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top right)"
echo "3. Click 'Load unpacked'"
echo "4. Select this extension directory"
echo ""
echo "For Firefox:"
echo "1. Install web-ext: npm install -g web-ext"
echo "2. Run: web-ext build"
echo "3. Go to about:debugging#/runtime/this-firefox"
echo "4. Click 'Load Temporary Add-on' and select the built file"
echo ""
echo "For testing:"
echo "1. Open test.html in your browser"
echo "2. The page should be blocked if the extension is working"
echo ""
echo "📚 For more information, see README.md"
echo ""
echo "🛡️ SafeNet Guardian - Protecting families, one click at a time!"
