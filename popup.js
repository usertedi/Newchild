// Popup JavaScript - SafeNet Guardian
class PopupManager {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadData() {
    try {
      const data = await chrome.storage.local.get(['rules', 'blockLog', 'isEnabled']);
      this.rules = data.rules || {};
      this.blockLog = data.blockLog || [];
      this.isEnabled = data.isEnabled !== false;
    } catch (error) {
      console.error('Error loading popup data:', error);
    }
  }

  setupEventListeners() {
    // Protection toggle
    const protectionToggle = document.getElementById('protectionToggle');
    if (protectionToggle) {
      protectionToggle.checked = this.isEnabled;
      protectionToggle.addEventListener('change', (e) => {
        this.toggleProtection(e.target.checked);
      });
    }

    // Dashboard button
    const openDashboardBtn = document.getElementById('openDashboardBtn');
    if (openDashboardBtn) {
      openDashboardBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
        window.close();
      });
    }

    // View logs button
    const viewLogsBtn = document.getElementById('viewLogsBtn');
    if (viewLogsBtn) {
      viewLogsBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html#logs') });
        window.close();
      });
    }
  }

  updateUI() {
    this.updateStatus();
    this.updateStats();
    this.loadRecentActivity();
  }

  updateStatus() {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const protectionToggle = document.getElementById('protectionToggle');

    if (this.isEnabled) {
      statusIndicator.className = 'status-indicator status-active';
      statusText.textContent = 'Protection Active';
      if (protectionToggle) protectionToggle.checked = true;
    } else {
      statusIndicator.className = 'status-indicator status-inactive';
      statusText.textContent = 'Protection Disabled';
      if (protectionToggle) protectionToggle.checked = false;
    }
  }

  updateStats() {
    // Calculate today's blocks
    const today = new Date().toDateString();
    const todayBlocks = this.blockLog.filter(entry => 
      new Date(entry.timestamp).toDateString() === today
    ).length;

    // Get total blocked sites
    const totalSites = this.rules.blocked_sites ? this.rules.blocked_sites.length : 0;

    document.getElementById('todayBlocks').textContent = todayBlocks;
    document.getElementById('totalSites').textContent = totalSites;
  }

  loadRecentActivity() {
    const recentActivity = document.getElementById('recentActivity');
    if (!recentActivity) return;

    const recent = this.blockLog.slice(0, 3); // Show last 3 entries

    if (recent.length === 0) {
      recentActivity.innerHTML = '<p style="text-align: center; opacity: 0.7; padding: 20px;">No recent activity</p>';
      return;
    }

    let html = '';
    recent.forEach(entry => {
      const date = new Date(entry.timestamp);
      const timeAgo = this.getTimeAgo(date);
      const shortUrl = this.shortenUrl(entry.url);
      
      html += `
        <div class="activity-item">
          <div class="activity-url">${shortUrl}</div>
          <div class="activity-time">${timeAgo} • ${entry.type}</div>
        </div>
      `;
    });

    recentActivity.innerHTML = html;
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  }

  shortenUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url.length > 30 ? url.substring(0, 30) + '...' : url;
    }
  }

  async toggleProtection(enabled) {
    try {
      this.isEnabled = enabled;
      await chrome.storage.local.set({ isEnabled: enabled });
      
      // Send message to background script
      await chrome.runtime.sendMessage({
        type: 'TOGGLE_ENABLED',
        enabled: enabled
      });

      this.updateStatus();
      
      // Show notification
      this.showNotification(enabled ? 'Protection Enabled' : 'Protection Disabled');
    } catch (error) {
      console.error('Error toggling protection:', error);
    }
  }

  showNotification(message) {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #4CAF50;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }
}

// Initialize popup
const popup = new PopupManager();

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);


