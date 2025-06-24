const productiveSites = ["leetcode.com", "github.com", "w3schools.com", "stackoverflow.com", "developer.mozilla.org"];
const unproductiveSites = ["instagram.com", "youtube.com", "facebook.com", "twitter.com", "tiktok.com"];

// Function to format time in hours and minutes
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// Function to get current date in YYYY-MM-DD format
function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

// Function to sort sites by time spent
function sortSitesByTime(data) {
  return Object.entries(data).sort(([,a], [,b]) => b - a);
}

chrome.storage.local.get(["trackingData", "lastResetDate"], (result) => {
  const data = result.trackingData || {};
  const lastResetDate = result.lastResetDate || getCurrentDate();
  const currentDate = getCurrentDate();
  
  // Reset data if it's a new day
  if (lastResetDate !== currentDate) {
    chrome.storage.local.set({ 
      trackingData: {},
      lastResetDate: currentDate 
    });
    return;
  }

  let output = "";
  let totalProductive = 0, totalUnproductive = 0;
  let siteStats = [];

  // Process and sort sites by time spent
  for (let [site, seconds] of sortSitesByTime(data)) {
    const time = Math.round(seconds / 60); // in minutes
    const category = productiveSites.includes(site) ? "✅ Productive" :
                     unproductiveSites.includes(site) ? "❌ Unproductive" : "⚪ Neutral";

    if (category === "✅ Productive") totalProductive += time;
    if (category === "❌ Unproductive") totalUnproductive += time;

    siteStats.push({ site, time, category });
  }

  // Generate HTML for each site
  siteStats.forEach(({ site, time, category }) => {
    output += `
      <div class="site-entry">
        <div class="site-info">
          <strong>${site}</strong>
          <span class="category">${category}</span>
        </div>
        <div class="time-spent">${formatTime(time)}</div>
      </div>
    `;
  });

  // Add summary section
  output += `
    <div class="summary-section">
      <div class="summary-item productive">
        <span class="summary-label">Total Productive</span>
        <span class="summary-value">${formatTime(totalProductive)}</span>
      </div>
      <div class="summary-item unproductive">
        <span class="summary-label">Total Unproductive</span>
        <span class="summary-value">${formatTime(totalUnproductive)}</span>
      </div>
    </div>
  `;

  // Update the UI
  document.getElementById("data").innerHTML = output;
  document.getElementById("productive-time").textContent = formatTime(totalProductive);
  document.getElementById("unproductive-time").textContent = formatTime(totalUnproductive);

  // Add event listener for reset button
  document.getElementById("reset-btn").addEventListener("click", () => {
    chrome.storage.local.set({ 
      trackingData: {},
      lastResetDate: currentDate 
    }, () => {
      location.reload();
    });
  });
});
