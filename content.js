// Content Script - SafeNet Guardian
class ContentScanner {
  constructor() {
    this.isScanning = false;
    this.maxTextLength = 50000; // Limit scanning to prevent performance issues
    this.scanDelay = 1000; // Delay before scanning to let page load
    this.init();
  }

  async init() {
    try {
      // Check if extension is enabled first
      const data = await chrome.storage.local.get(['isEnabled']);
      if (data.isEnabled === false) {
        console.log('[SafeNet] Extension disabled, skipping initialization');
        return;
      }

      // Check if current URL should be blocked
      await this.checkUrlBlocking();
      
      // Only start scanning if page is not blocked
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.startScanning());
      } else {
        this.startScanning();
      }
    } catch (error) {
      console.error('[SafeNet] Initialization error:', error);
    }
  }

  async checkUrlBlocking() {
    try {
      const currentUrl = window.location.href;
      const domain = window.location.hostname.toLowerCase();
      
      // Get rules from storage
      const data = await chrome.storage.local.get(['rules', 'isEnabled']);
      if (!data.isEnabled) return;
      
      const rules = data.rules;
      if (!rules || !rules.blocked_sites) return;
      
      // Check exact domain match
      if (rules.blocked_sites.includes(domain)) {
        this.blockPage('Blocked domain: ' + domain);
        return;
      }
      
      // Check wildcard patterns
      for (const pattern of rules.blocked_sites) {
        if (pattern.includes('*')) {
          const regexPattern = pattern.replace(/\*/g, '.*');
          if (new RegExp(regexPattern).test(domain)) {
            this.blockPage('Blocked pattern: ' + pattern);
            return;
          }
        }
      }
    } catch (error) {
      console.error('[SafeNet] URL blocking error:', error);
    }
  }

  startScanning() {
    setTimeout(() => {
      this.scanPage();
    }, this.scanDelay);
  }

  async scanPage() {
    if (this.isScanning) return;
    this.isScanning = true;

    try {
      // Get page text content
      const textContent = this.extractTextContent();
      
      let textForScan = textContent;
      if (textForScan.length > this.maxTextLength) {
        // Scan a truncated sample instead of skipping
        textForScan = textForScan.slice(0, this.maxTextLength);
      }

      // Check with background script
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_CONTENT',
        text: textForScan,
        url: window.location.href
      });

      if (response && response.blocked) {
        this.blockPage(response.reason || 'Harmful content detected');
        return;
      }

    } catch (error) {
      console.error('[SafeNet] Content scan error:', error);
    } finally {
      this.isScanning = false;
    }
  }

  extractTextContent() {
    // Get text content from body without modifying DOM
    const body = document.body;
    if (!body) return '';

    // Create a temporary clone to work with
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = body.innerHTML;
    
    // Remove script and style elements from clone only
    const scripts = tempDiv.querySelectorAll('script, style, noscript');
    scripts.forEach(el => el.remove());

    // Extract text from common content areas
    const contentSelectors = [
      'article', 'main', '.content', '.post', '.entry',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'div', 'span'
    ];

    let textContent = '';
    
    // Get text from main content areas first
    contentSelectors.forEach(selector => {
      const elements = tempDiv.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent || el.innerText;
        if (text && text.trim().length > 10) { // Only meaningful content
          textContent += text + ' ';
        }
      });
    });

    // If no content found, get all text
    if (textContent.trim().length < 100) {
      textContent = tempDiv.textContent || tempDiv.innerText || '';
    }

    return textContent.trim();
  }

  blockPage(reason) {
    // Create blocking overlay
    const overlay = document.createElement('div');
    overlay.id = 'safenet-block-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
      color: white;
      text-align: center;
    `;

    overlay.innerHTML = `
      <div style="max-width: 600px; padding: 40px;">
        <div style="font-size: 48px; margin-bottom: 20px;">🛡️</div>
        <h1 style="font-size: 32px; margin-bottom: 20px; color: white;">
          Content Blocked
        </h1>
        <p style="font-size: 18px; margin-bottom: 30px; line-height: 1.6;">
          This page has been blocked by SafeNet Guardian because it contains inappropriate content.
        </p>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin-bottom: 30px;">
          <strong>Reason:</strong> ${reason}
        </div>
        <button id="safenet-go-back" style="
          background: white;
          color: #ff6b6b;
          border: none;
          padding: 15px 30px;
          font-size: 16px;
          border-radius: 25px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          Go Back
        </button>
      </div>
    `;

    // Add to page
    document.body.appendChild(overlay);

    // Handle go back button
    document.getElementById('safenet-go-back').addEventListener('click', () => {
      window.history.back();
    });

    // Prevent scrolling
    document.body.style.overflow = 'hidden';

    // Log the block
    console.log('[SafeNet] Page blocked:', window.location.href, 'Reason:', reason);
  }

  // Monitor for dynamic content changes
  observeContentChanges() {
    const observer = new MutationObserver((mutations) => {
      let shouldRescan = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if significant content was added
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const text = node.textContent || node.innerText;
              if (text && text.length > 50) {
                shouldRescan = true;
              }
            }
          });
        }
      });

      if (shouldRescan && !this.isScanning) {
        setTimeout(() => this.scanPage(), 2000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize content scanner
const contentScanner = new ContentScanner();

// Start observing for dynamic content
setTimeout(() => {
  contentScanner.observeContentChanges();
}, 3000);
