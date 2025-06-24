let activeTabId = null;
let startTime = null;
let lastActiveTime = null;
let isIdle = false;
const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

// Track tab activation
chrome.tabs.onActivated.addListener(activeInfo => {
  updateTimeSpent();
  activeTabId = activeInfo.tabId;
  startTime = Date.now();
  lastActiveTime = Date.now();
  isIdle = false;
});

// Track tab removal
chrome.tabs.onRemoved.addListener(tabId => {
  if (tabId === activeTabId) updateTimeSpent();
});

// Track window focus changes
chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Window lost focus
    updateTimeSpent();
    isIdle = true;
  } else {
    // Window gained focus
    isIdle = false;
    lastActiveTime = Date.now();
  }
});

// Check for idle state periodically
setInterval(() => {
  if (!isIdle && (Date.now() - lastActiveTime > IDLE_THRESHOLD)) {
    isIdle = true;
    updateTimeSpent();
  }
}, 60000); // Check every minute

function updateTimeSpent() {
  if (activeTabId && startTime && !isIdle) {
    const duration = Math.floor((Date.now() - startTime) / 1000); // in seconds
    chrome.tabs.get(activeTabId, (tab) => {
      if (!tab || !tab.url) return;
      
      const url = new URL(tab.url).hostname;
      const currentDate = new Date().toISOString().split('T')[0];
      
      chrome.storage.local.get(["trackingData", "dailyStats"], (result) => {
        const data = result.trackingData || {};
        const dailyStats = result.dailyStats || {};
        
        // Update total time spent
        data[url] = (data[url] || 0) + duration;
        
        // Update daily statistics
        if (!dailyStats[currentDate]) {
          dailyStats[currentDate] = {
            totalTime: 0,
            productiveTime: 0,
            unproductiveTime: 0
          };
        }
        
        dailyStats[currentDate].totalTime += duration;
        
        // Update productive/unproductive time based on site category
        const productiveSites = ["leetcode.com", "github.com", "w3schools.com", "stackoverflow.com", "developer.mozilla.org"];
        const unproductiveSites = ["instagram.com", "youtube.com", "facebook.com", "twitter.com", "tiktok.com"];
        
        if (productiveSites.includes(url)) {
          dailyStats[currentDate].productiveTime += duration;
        } else if (unproductiveSites.includes(url)) {
          dailyStats[currentDate].unproductiveTime += duration;
        }
        
        chrome.storage.local.set({ 
          trackingData: data,
          dailyStats: dailyStats
        });
      });
    });
  }
  startTime = Date.now();
}
