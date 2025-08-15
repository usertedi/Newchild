// Core Filtering Engine - SafeNet Guardian
class SafeNetFilter {
  constructor() {
    this.rules = null;
    this.isEnabled = true;
    this.blockedSites = new Set();
    this.keywords = {
      en: new Set(),
      am: new Set(),
      ar: new Set()
    };
    this.ahoCorasick = null;
    // Register listeners immediately so we don't miss early messages
    this.setupEventListeners();
    // Perform async initialization (load rules and build matchers)
    this.init();
  }

  async init() {
    await this.loadRules();
    this.buildAhoCorasick();
    console.log('SafeNet Guardian initialized');
  }

  async loadRules() {
    try {
      // Load from local storage first
      const stored = await chrome.storage.local.get(['rules', 'isEnabled']);
      if (stored.rules) {
        this.rules = stored.rules;
        this.isEnabled = stored.isEnabled !== false;
      } else {
        // Load default rules
        const response = await fetch(chrome.runtime.getURL('rules.json'));
        this.rules = await response.json();
        await chrome.storage.local.set({ rules: this.rules, isEnabled: true });
      }

      // Process rules for fast lookup
      this.processRules();
    } catch (error) {
      console.error('Error loading rules:', error);
      // Fallback to basic rules
      this.rules = this.getDefaultRules();
    }
  }

  processRules() {
    // Process blocked sites
    this.blockedSites.clear();
    if (this.rules.blocked_sites) {
      this.rules.blocked_sites.forEach(site => {
        this.blockedSites.add(site.toLowerCase());
      });
    }

    // Process keywords
    this.keywords.en.clear();
    this.keywords.am.clear();
    this.keywords.ar.clear();

    if (this.rules.keywords) {
      Object.keys(this.rules.keywords).forEach(lang => {
        if (this.rules.keywords[lang]) {
          this.rules.keywords[lang].forEach(keyword => {
            this.keywords[lang].add(this.normalizeText(keyword));
          });
        }
      });
    }
  }

  normalizeText(text) {
    // Keep normalization simple to preserve non-Latin scripts
    return (text || '').toLowerCase().trim();
  }

  buildAhoCorasick() {
    // Simple keyword matching for now - can be optimized with Aho-Corasick
    this.ahoCorasick = {
      patterns: [],
      build: function(patterns) {
        const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        this.patterns = patterns
          .filter(Boolean)
          .map(p => new RegExp(escapeRegex(p), 'iu'));
      },
      search: function(text) {
        const matches = [];
        this.patterns.forEach(pattern => {
          const found = text.match(pattern);
          if (found) {
            matches.push(...found);
          }
        });
        return matches;
      }
    };

    // Build patterns from all keywords
    const allPatterns = [];
    Object.values(this.keywords).forEach(langSet => {
      langSet.forEach(keyword => {
        if (keyword.length > 2) { // Only meaningful keywords
          allPatterns.push(keyword);
        }
      });
    });
    this.ahoCorasick.build(allPatterns);
  }

  setupEventListeners() {
    // URL filtering - using declarativeNetRequest for Manifest V3
    // Note: For Manifest V3, we'll handle URL blocking in content script
    // since webRequestBlocking is not available

    // Listen for rule updates
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'UPDATE_RULES') {
        this.loadRules().then(() => this.buildAhoCorasick());
        sendResponse({ success: true });
      } else if (message.type === 'TOGGLE_ENABLED') {
        this.isEnabled = message.enabled;
        chrome.storage.local.set({ isEnabled: this.isEnabled });
        sendResponse({ success: true });
      } else if (message.type === 'OPEN_DASHBOARD') {
        try {
          chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
          sendResponse({ success: true });
        } catch (e) {
          console.error('[SafeNet] Failed to open dashboard:', e);
          sendResponse({ success: false, error: String(e) });
        }
      } else if (message.type === 'CHECK_CONTENT') {
        // Ensure matchers are ready
        this.ensureReady().then(() => this.checkContent(message.text, message.url)).then(isBlocked => {
          sendResponse({ blocked: isBlocked, reason: isBlocked ? 'Harmful content detected' : null });
        });
        return true; // Keep message channel open for async response
      }
    });
  }

  async ensureReady() {
    if (!this.rules) {
      await this.loadRules();
    }
    if (!this.ahoCorasick || !this.ahoCorasick.patterns || this.ahoCorasick.patterns.length === 0) {
      this.buildAhoCorasick();
    }
  }

  handleUrlRequest(details) {
    if (!this.isEnabled) return { cancel: false };

    const url = new URL(details.url);
    const domain = url.hostname.toLowerCase();

    // Check exact domain match
    if (this.blockedSites.has(domain)) {
      this.logBlock('URL', domain, 'Exact match');
      return { redirectUrl: chrome.runtime.getURL('warning.html') };
    }

    // Check wildcard patterns
    for (const pattern of this.blockedSites) {
      if (pattern.includes('*')) {
        const regexPattern = pattern.replace(/\*/g, '.*');
        if (new RegExp(regexPattern).test(domain)) {
          this.logBlock('URL', domain, 'Pattern match: ' + pattern);
          return { redirectUrl: chrome.runtime.getURL('warning.html') };
        }
      }
    }

    return { cancel: false };
  }

  async checkContent(text, url) {
    if (!this.isEnabled) return false;

    const normalizedText = this.normalizeText(text);
    
    // Check for harmful keywords
    const matches = this.ahoCorasick.search(normalizedText);
    
    if (matches.length > 0) {
      this.logBlock('Content', url, 'Keywords found: ' + matches.join(', '));
      return true;
    }

    return false;
  }

  logBlock(type, url, reason) {
    console.log(`[SafeNet] Blocked ${type}: ${url} - ${reason}`);
    
    // Store in local storage for dashboard
    chrome.storage.local.get(['blockLog'], (result) => {
      const log = result.blockLog || [];
      log.unshift({
        timestamp: Date.now(),
        type: type,
        url: url,
        reason: reason
      });
      
      // Keep only last 100 entries
      if (log.length > 100) {
        log.splice(100);
      }
      
      chrome.storage.local.set({ blockLog: log });
    });
  }

  getDefaultRules() {
    return {
      blocked_sites: [
        "example-adult-site.com",
        "*.gambling.com",
        "scam-site.net"
      ],
      keywords: {
        en: [
          "porn", "sex", "adult", "gambling", "casino", "bet",
          "scam", "fraud", "hack", "crack", "warez"
        ],
        am: [
          "ወንጀለኛ", "ማሳለፊያ", "ውሸት", "ማስታለቂያ"
        ],
        ar: [
          "إباحية", "قمار", "احتيال", "مخدرات"
        ]
      }
    };
  }
}

// Initialize the filter
const safeNetFilter = new SafeNetFilter();
