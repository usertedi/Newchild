// Dashboard JavaScript - SafeNet Guardian
class DashboardManager {
  constructor() {
    this.rules = null;
    this.blockLog = [];
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.updateUI();
    console.log('Dashboard initialized');
  }

  async loadData() {
    try {
      const data = await chrome.storage.local.get(['rules', 'blockLog', 'isEnabled']);
      this.rules = data.rules || this.getDefaultRules();
      this.blockLog = data.blockLog || [];
      
      // Update protection toggle
      const protectionToggle = document.getElementById('protectionToggle');
      if (protectionToggle) {
        protectionToggle.checked = data.isEnabled !== false;
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  setupEventListeners() {
    // Simple tab switching
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#dashboardTabs .nav-link').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const target = e.currentTarget.getAttribute('data-tab-target');
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        const el = document.querySelector(target);
        if (el) el.classList.add('active');
      });
    });

    // Language subtabs
    document.querySelectorAll('#languageTabs [data-tab-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#languageTabs .nav-link').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const target = e.currentTarget.getAttribute('data-tab-target');
        ['#en-keywords', '#am-keywords', '#ar-keywords'].forEach(id => {
          const pane = document.querySelector(id);
          if (pane) pane.classList.toggle('active', id === target);
        });
      });
    });

    // Modal open/close
    const openAddSite = document.getElementById('openAddSite');
    if (openAddSite) openAddSite.addEventListener('click', () => this.toggleModal('#addSiteModal', true));
    const openAddKeyword = document.getElementById('openAddKeyword');
    if (openAddKeyword) openAddKeyword.addEventListener('click', () => this.toggleModal('#addKeywordModal', true));
    document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', (e) => {
      const target = e.currentTarget.getAttribute('data-target');
      this.toggleModal(target, false);
    }));

    // Protection toggle
    const protectionToggle = document.getElementById('protectionToggle');
    if (protectionToggle) {
      protectionToggle.addEventListener('change', (e) => {
        this.toggleProtection(e.target.checked);
      });
    }

    // Add site button
    const saveSiteBtn = document.getElementById('saveSiteBtn');
    if (saveSiteBtn) {
      saveSiteBtn.addEventListener('click', () => this.addBlockedSite());
    }

    // Add keyword button
    const saveKeywordBtn = document.getElementById('saveKeywordBtn');
    if (saveKeywordBtn) {
      saveKeywordBtn.addEventListener('click', () => this.addBlockedKeyword());
    }

    // Update rules button
    const updateRulesBtn = document.getElementById('updateRulesBtn');
    if (updateRulesBtn) {
      updateRulesBtn.addEventListener('click', () => this.updateRules());
    }

    // Export/Import buttons
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportSettings());
    }

    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.importSettings());
    }

    // Initial loads for default tab
    this.loadBlockedSites();
    this.loadKeywords();
    this.loadActivityLog();
  }

  updateUI() {
    this.updateStats();
    this.loadRecentActivity();
  }

  toggleModal(selector, show) {
    const el = document.querySelector(selector);
    if (!el) return;
    if (show) {
      el.classList.add('show');
      el.style.display = 'block';
      document.body.style.overflow = 'hidden';
    } else {
      el.classList.remove('show');
      el.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  updateStats() {
    // Update statistics
    const totalBlocks = this.blockLog.length;
    const blockedSites = this.rules.blocked_sites ? this.rules.blocked_sites.length : 0;
    const blockedKeywords = this.getTotalKeywords();
    const protectionStatus = document.getElementById('protectionToggle')?.checked ? 'ON' : 'OFF';

    document.getElementById('totalBlocks').textContent = totalBlocks;
    document.getElementById('blockedSites').textContent = blockedSites;
    document.getElementById('blockedKeywords').textContent = blockedKeywords;
    document.getElementById('protectionStatus').textContent = protectionStatus;
  }

  getTotalKeywords() {
    let total = 0;
    if (this.rules.keywords) {
      Object.values(this.rules.keywords).forEach(lang => {
        total += lang.length;
      });
    }
    return total;
  }

  loadRecentActivity() {
    const recentActivity = document.getElementById('recentActivity');
    if (!recentActivity) return;

    const recent = this.blockLog.slice(0, 5);
    
    if (recent.length === 0) {
      recentActivity.innerHTML = '<p class="text-muted">No recent activity</p>';
      return;
    }

    let html = '';
    recent.forEach(entry => {
      const date = new Date(entry.timestamp).toLocaleString();
      html += `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div>
            <strong>${entry.type}</strong> - ${entry.url}
            <br><small class="text-muted">${entry.reason}</small>
          </div>
          <small class="text-muted">${date}</small>
        </div>
      `;
    });

    recentActivity.innerHTML = html;
  }

  loadBlockedSites() {
    const sitesList = document.getElementById('blockedSitesList');
    if (!sitesList || !this.rules.blocked_sites) return;

    let html = '';
    this.rules.blocked_sites.forEach((site, index) => {
      html += `
        <div class="rule-item">
          <div class="rule-text">${site}</div>
          <div class="rule-actions">
            <button class="btn btn-danger btn-sm" onclick="dashboard.removeBlockedSite(${index})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    });

    sitesList.innerHTML = html || '<p class="text-muted">No blocked sites</p>';
  }

  loadKeywords() {
    const languages = ['en', 'am', 'ar'];
    const languageNames = { en: 'English', am: 'Amharic', ar: 'Arabic' };

    languages.forEach(lang => {
      const listElement = document.getElementById(`${lang}KeywordsList`);
      if (!listElement || !this.rules.keywords || !this.rules.keywords[lang]) return;

      let html = '';
      this.rules.keywords[lang].forEach((keyword, index) => {
        html += `
          <div class="rule-item">
            <div class="rule-text">${keyword}</div>
            <div class="rule-actions">
              <button class="btn btn-danger btn-sm" onclick="dashboard.removeKeyword('${lang}', ${index})">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      });

      listElement.innerHTML = html || `<p class="text-muted">No ${languageNames[lang]} keywords</p>`;
    });
  }

  loadActivityLog() {
    const activityLog = document.getElementById('activityLog');
    if (!activityLog) return;

    if (this.blockLog.length === 0) {
      activityLog.innerHTML = '<p class="text-muted">No activity logged</p>';
      return;
    }

    let html = '';
    this.blockLog.forEach(entry => {
      const date = new Date(entry.timestamp).toLocaleString();
      const typeClass = entry.type === 'URL' ? 'text-primary' : 'text-warning';
      
      html += `
        <div class="border-bottom pb-2 mb-2">
          <div class="d-flex justify-content-between">
            <span class="badge ${typeClass}">${entry.type}</span>
            <small class="text-muted">${date}</small>
          </div>
          <div class="mt-1">
            <strong>${entry.url}</strong>
          </div>
          <div class="text-muted small">${entry.reason}</div>
        </div>
      `;
    });

    activityLog.innerHTML = html;
  }

  async toggleProtection(enabled) {
    try {
      await chrome.storage.local.set({ isEnabled: enabled });
      
      // Send message to background script
      await chrome.runtime.sendMessage({
        type: 'TOGGLE_ENABLED',
        enabled: enabled
      });

      // Update UI
      const statusText = document.getElementById('protectionStatusText');
      if (statusText) {
        statusText.textContent = enabled ? 'Protection is ON' : 'Protection is OFF';
      }

      this.updateStats();
      
      // Show notification
      this.showNotification(
        enabled ? 'Protection Enabled' : 'Protection Disabled',
        enabled ? 'SafeNet Guardian is now protecting your family.' : 'SafeNet Guardian protection is now disabled.',
        enabled ? 'success' : 'warning'
      );
    } catch (error) {
      console.error('Error toggling protection:', error);
    }
  }

  async addBlockedSite() {
    const urlInput = document.getElementById('newSiteUrl');
    const categorySelect = document.getElementById('siteCategory');
    
    if (!urlInput || !categorySelect) return;

    const url = urlInput.value.trim();
    const category = categorySelect.value;

    if (!url) {
      this.showNotification('Error', 'Please enter a valid URL', 'error');
      return;
    }

    try {
      if (!this.rules.blocked_sites) {
        this.rules.blocked_sites = [];
      }

      this.rules.blocked_sites.push(url);
      await this.saveRules();

      // Clear form and close modal
      urlInput.value = '';
      categorySelect.value = 'adult';
      
      this.toggleModal('#addSiteModal', false);

      this.showNotification('Success', 'Site added to blocked list', 'success');
      this.loadBlockedSites();
      this.updateStats();
    } catch (error) {
      console.error('Error adding blocked site:', error);
      this.showNotification('Error', 'Failed to add site', 'error');
    }
  }

  async addBlockedKeyword() {
    const languageSelect = document.getElementById('keywordLanguage');
    const keywordInput = document.getElementById('newKeyword');
    const categorySelect = document.getElementById('keywordCategory');
    
    if (!languageSelect || !keywordInput || !categorySelect) return;

    const language = languageSelect.value;
    const keyword = keywordInput.value.trim();
    const category = categorySelect.value;

    if (!keyword) {
      this.showNotification('Error', 'Please enter a valid keyword', 'error');
      return;
    }

    try {
      if (!this.rules.keywords) {
        this.rules.keywords = {};
      }
      if (!this.rules.keywords[language]) {
        this.rules.keywords[language] = [];
      }

      this.rules.keywords[language].push(keyword);
      await this.saveRules();

      // Clear form and close modal
      keywordInput.value = '';
      languageSelect.value = 'en';
      categorySelect.value = 'adult';
      
      this.toggleModal('#addKeywordModal', false);

      this.showNotification('Success', 'Keyword added to blocked list', 'success');
      this.loadKeywords();
      this.updateStats();
    } catch (error) {
      console.error('Error adding blocked keyword:', error);
      this.showNotification('Error', 'Failed to add keyword', 'error');
    }
  }

  async removeBlockedSite(index) {
    if (confirm('Are you sure you want to remove this blocked site?')) {
      try {
        this.rules.blocked_sites.splice(index, 1);
        await this.saveRules();
        this.loadBlockedSites();
        this.updateStats();
        this.showNotification('Success', 'Site removed from blocked list', 'success');
      } catch (error) {
        console.error('Error removing blocked site:', error);
        this.showNotification('Error', 'Failed to remove site', 'error');
      }
    }
  }

  async removeKeyword(language, index) {
    if (confirm('Are you sure you want to remove this keyword?')) {
      try {
        this.rules.keywords[language].splice(index, 1);
        await this.saveRules();
        this.loadKeywords();
        this.updateStats();
        this.showNotification('Success', 'Keyword removed from blocked list', 'success');
      } catch (error) {
        console.error('Error removing keyword:', error);
        this.showNotification('Error', 'Failed to remove keyword', 'error');
      }
    }
  }

  async saveRules() {
    try {
      await chrome.storage.local.set({ rules: this.rules });
      
      // Notify background script to reload rules
      await chrome.runtime.sendMessage({
        type: 'UPDATE_RULES'
      });
    } catch (error) {
      console.error('Error saving rules:', error);
      throw error;
    }
  }

  async updateRules() {
    try {
      const updateRulesBtn = document.getElementById('updateRulesBtn');
      if (updateRulesBtn) {
        updateRulesBtn.disabled = true;
        updateRulesBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
      }

      // Try to fetch updated rules from server
      const response = await fetch('https://api.safenetguardian.com/rules/latest');
      if (response.ok) {
        const newRules = await response.json();
        this.rules = newRules;
        await this.saveRules();
        this.showNotification('Success', 'Rules updated successfully', 'success');
      } else {
        throw new Error('Failed to fetch updated rules');
      }
    } catch (error) {
      console.error('Error updating rules:', error);
      this.showNotification('Error', 'Failed to update rules. Using local version.', 'warning');
    } finally {
      const updateRulesBtn = document.getElementById('updateRulesBtn');
      if (updateRulesBtn) {
        updateRulesBtn.disabled = false;
        updateRulesBtn.innerHTML = '<i class="fas fa-sync"></i> Update Rules';
      }
    }
  }

  exportSettings() {
    try {
      const data = {
        rules: this.rules,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `safenet-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showNotification('Success', 'Settings exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting settings:', error);
      this.showNotification('Error', 'Failed to export settings', 'error');
    }
  }

  importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.rules) {
          this.rules = data.rules;
          await this.saveRules();
          this.updateUI();
          this.showNotification('Success', 'Settings imported successfully', 'success');
        } else {
          throw new Error('Invalid settings file');
        }
      } catch (error) {
        console.error('Error importing settings:', error);
        this.showNotification('Error', 'Failed to import settings', 'error');
      }
    };

    input.click();
  }

  showNotification(title, message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
      top: 20px;
      right: 20px;
      z-index: 9999;
      min-width: 300px;
    `;
    
    notification.innerHTML = `
      <strong>${title}</strong><br>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  getDefaultRules() {
    return {
      blocked_sites: [
        "example-adult-site.com",
        "*.gambling.com",
        "scam-site.net"
      ],
      keywords: {
        en: ["porn", "gambling", "scam"],
        am: ["ወንጀለኛ", "ማሳለፊያ"],
        ar: ["إباحية", "قمار"]
      }
    };
  }
}

// Initialize dashboard
const dashboard = new DashboardManager();

