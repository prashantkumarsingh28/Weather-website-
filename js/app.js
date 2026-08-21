let currentCity = INDIAN_CITIES[0]; // Default: New Delhi
let scene3D = null;
let audioEngine = null;
let weatherSpeaker = null;
let currentWeatherData = null;
let forecastChart = null;
let climateTrendChart = null;
let monsoonRainChart = null;
let cityMonthlyChart = null;
let currentAlerts = [];

// COOKIE HELPER FUNCTIONS (Save searched/selected cities)
function setCookie(name, value, days = 365) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`;
  try {
    localStorage.setItem(name, value);
  } catch(e) {}
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  try {
    const localVal = localStorage.getItem(name);
    if (localVal) return localVal;
  } catch(e) {}
  return null;
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize 3D Light Sky & Volumetric Clouds
  try { scene3D = new Weather3DScene('canvas-container'); } catch(e) {}

  // Initialize Web Audio Engine & Weather Voice Speaker
  try { audioEngine = new WeatherAudioEngine(); } catch(e) {}
  try { weatherSpeaker = new WeatherSpeaker(); } catch(e) {}

  // Bind Direct Click Event Listeners to Nav Tabs for guaranteed responsive tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = btn.id || '';
      const tabName = tabId.replace('tab-btn-', '');
      if (tabName) {
        switchNavTab(tabName);
      }
    });
  });

  // Render Search History & Weather News Feed
  renderSearchHistory();
  renderWeatherNewsFeed();

  // Setup Search Engine
  setupSearchEngine();

  // Load Saved City from Cookie if available
  const savedCityName = getCookie('last_searched_city');
  if (savedCityName) {
    const foundCity = INDIAN_CITIES.find(c => c.name.toLowerCase() === savedCityName.toLowerCase());
    if (foundCity) {
      currentCity = foundCity;
    }
  }

  // Determine Target Tab for Persistence: First-time vs Page Refresh
  const hasVisited = localStorage.getItem('weather_app_has_visited');
  const savedTab = localStorage.getItem('weather_app_active_tab');

  let targetTab = 'intro';
  if (!hasVisited) {
    // First time opening website -> land on Introduction page
    localStorage.setItem('weather_app_has_visited', 'true');
    targetTab = 'intro';
  } else if (savedTab && ['intro', 'weather', 'climate', 'feedback'].includes(savedTab)) {
    // Page refresh / return visit -> restore exact previous tab
    targetTab = savedTab;
  } else {
    targetTab = 'intro';
  }

  // Switch to target tab immediately so UI displays page right away
  switchNavTab(targetTab);

  // Initialize Network Connectivity Indicator
  initNetworkMonitor();

  // Load Initial Weather & Climate Data asynchronously (autoSwitchTab = false to preserve targetTab)
  selectCity(currentCity, false).catch(e => console.warn("selectCity error:", e));

  // Render Climate Tab Visuals
  try { initClimateCharts(); } catch(e) {}
});

// TOP NAVIGATION TABS SWITCHER WITH STORAGE PERSISTENCE
function switchNavTab(tabName) {
  if (!tabName) return;

  // Update Tab Buttons UI
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeTabBtn = document.getElementById(`tab-btn-${tabName}`);
  if (activeTabBtn) activeTabBtn.classList.add('active');

  // Update View Sections with clean active class toggling
  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.remove('active');
    view.removeAttribute('style');
  });

  const activeView = document.getElementById(`view-${tabName}`);
  if (activeView) {
    activeView.classList.add('active');
  }

  // Save active tab in localStorage for page refresh persistence
  try {
    localStorage.setItem('weather_app_active_tab', tabName);
  } catch(e) {}

  const isWeatherTab = (tabName === 'weather');

  // Control Weather-only top buttons and IMD Banner (ONLY visible on Weather tab)
  const navSpeakerBtn = document.getElementById('speaker-nav-btn');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const alertsBanner = document.getElementById('alerts-banner');

  if (navSpeakerBtn) navSpeakerBtn.style.display = isWeatherTab ? 'flex' : 'none';
  if (audioToggleBtn) audioToggleBtn.style.display = isWeatherTab ? 'flex' : 'none';
  if (alertsBanner) alertsBanner.style.display = isWeatherTab ? 'flex' : 'none';

  // Stop active speech and ambient soundscape if user leaves weather tab
  if (!isWeatherTab) {
    if (typeof weatherSpeaker !== 'undefined' && weatherSpeaker) weatherSpeaker.stop();
    if (typeof audioEngine !== 'undefined' && audioEngine && audioEngine.isPlaying) {
      audioEngine.stop();
      if (audioToggleBtn) audioToggleBtn.classList.remove('active');
    }
    closeAlertModal();
  }

  if (tabName === 'climate' && typeof updateCityClimateProfile === 'function') {
    updateCityClimateProfile(currentCity);
  }

  // Refresh Lucide icons for active view
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

// Expose switchNavTab globally on window so inline onclick="switchNavTab('...')" ALWAYS works
window.switchNavTab = switchNavTab;



// SEARCH HISTORY MANAGEMENT
function getSearchHistory() {
  try {
    const saved = localStorage.getItem('weather_search_history');
    return saved ? JSON.parse(saved) : [];
  } catch(e) {
    return [];
  }
}

function addToSearchHistory(cityData) {
  if (!cityData) return;
  try {
    let history = getSearchHistory();
    // Filter out existing item with same city name
    history = history.filter(item => item.name.toLowerCase() !== cityData.city.toLowerCase());
    // Prepend new item
    history.unshift({
      name: cityData.city,
      state: cityData.state,
      temp: cityData.temp,
      icon: cityData.icon,
      condition: cityData.condition
    });
    // Keep max 8 items
    history = history.slice(0, 8);
    localStorage.setItem('weather_search_history', JSON.stringify(history));
    renderSearchHistory();
  } catch(e) {}
}

function removeFromSearchHistory(cityName, event) {
  if (event) event.stopPropagation();
  try {
    let history = getSearchHistory();
    history = history.filter(item => item.name.toLowerCase() !== cityName.toLowerCase());
    localStorage.setItem('weather_search_history', JSON.stringify(history));
    renderSearchHistory();
  } catch(e) {}
}

function renderSearchHistory() {
  const container = document.getElementById('search-history-list');
  if (!container) return;

  const history = getSearchHistory();
  if (history.length === 0) {
    container.innerHTML = `<div style="text-align: center; font-size: 0.82rem; color: var(--text-muted); padding: 1rem 0;">No recent searches yet. Search any city above!</div>`;
    return;
  }

  container.innerHTML = history.map(item => `
    <div class="history-item ${item.name === currentCity.name ? 'active' : ''}" onclick="selectCityByName('${item.name}')">
      <div class="history-info">
        <i data-lucide="clock" class="history-clock-icon"></i>
        <div>
          <h4>${item.name}</h4>
          <p>${item.state}</p>
        </div>
      </div>
      <div class="history-actions">
        <div class="history-temp-badge">
          <i data-lucide="${item.icon || 'sun'}"></i>
          <span>${item.temp}°C</span>
        </div>
        <button class="delete-history-item-btn" title="Remove from history" onclick="removeFromSearchHistory('${item.name}', event)">
          <i data-lucide="x"></i>
        </button>
      </div>
    </div>
  `).join('');

  lucide.createIcons();
}

function clearSearchHistory() {
  try {
    localStorage.removeItem('weather_search_history');
    renderSearchHistory();
  } catch(e) {}
}

// CLEAR SEARCH INPUT CROSS BUTTON ROUTINE
function clearCitySearch() {
  const input = document.getElementById('city-search-input');
  const clearBtn = document.getElementById('clear-search-btn');
  const results = document.getElementById('search-results');

  if (input) {
    input.value = '';
    input.focus();
  }
  if (clearBtn) clearBtn.classList.add('hidden');
  if (results) results.classList.remove('active');
}

function updateSearchClearButton() {
  const input = document.getElementById('city-search-input');
  const clearBtn = document.getElementById('clear-search-btn');
  if (input && clearBtn) {
    if (input.value.trim().length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }
}

async function selectCityByName(cityName) {
  if (!cityName) return;
  const city = INDIAN_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
  if (city) {
    selectCity(city);
    return;
  }
  // If not found in static list, try live Geocoding API
  try {
    const geoResults = await WeatherAPI.searchCityGeocoding(cityName);
    if (geoResults && geoResults.length > 0) {
      selectCity(geoResults[0]);
    }
  } catch(e) {
    console.warn("Geocoding lookup error:", e);
  }
}

// Main City Selection Routine
async function selectCity(city, autoSwitchTab = true) {
  if (!city) return;
  currentCity = city;

  try {
    // Persist selected city to cookies & local storage
    setCookie('last_searched_city', city.name, 365);

    // Set Search Input box text and show clear button
    const searchInput = document.getElementById('city-search-input');
    if (searchInput) {
      searchInput.value = city.name;
      updateSearchClearButton();
    }

    // Fetch live weather data cleanly without flashing temporary 31°C fallback
    let data;
    try {
      data = await WeatherAPI.fetchCityWeather(city);
    } catch(e) {
      console.warn("Weather API fetch error, using fallback data:", e);
      data = WeatherAPI.generateFallbackData(city);
    }

    if (!data) {
      data = WeatherAPI.generateFallbackData(city);
    }

    currentWeatherData = data;

    // Add to Search History
    addToSearchHistory(data);

    // Update Dashboard Widgets cleanly with live API data directly
    try { updateHeroDashboard(data); } catch(e) { console.error("updateHeroDashboard error:", e); }
    try { update7DaySunCycle(data); } catch(e) { console.error("update7DaySunCycle error:", e); }
    try { updateHourlyCards(data.hourly || []); } catch(e) { console.error("updateHourlyCards error:", e); }
    try { updateAQIWidget(data.aqi); } catch(e) { console.error("updateAQIWidget error:", e); }
    try { updateHourlyChart(data.hourly || []); } catch(e) { console.error("updateHourlyChart error:", e); }
    try { update7DayForecast(data.daily || [], data.city); } catch(e) { console.error("update7DayForecast error:", e); }
    try { renderWeatherNewsFeed(data); } catch(e) { console.error("renderWeatherNewsFeed error:", e); }

    // Update 3D Sky Visuals & Procedural Audio
    if (scene3D && data.category) scene3D.setWeatherCategory(data.category);
    if (audioEngine && data.category) audioEngine.setSoundType(data.category);

    // Update Advisory & Precautions
    try {
      currentAlerts = AlertsSystem.getAlertsForLocation(data);
      if (currentAlerts && currentAlerts.length > 0) {
        updateAdvisoryPrecautions(currentAlerts[0]);
        updateAlertsBanner(currentAlerts[0]);
      }
    } catch(e) {
      console.error("AlertsSystem error:", e);
    }

    // Update Weather Voice Speaker Widget Data
    if (!weatherSpeaker) {
      try { weatherSpeaker = new WeatherSpeaker(); } catch(e) {}
    }
    if (weatherSpeaker) {
      weatherSpeaker.updateWidgetData(data);
    }

    // Automatically switch tab only if autoSwitchTab is true
    if (autoSwitchTab) {
      switchNavTab('weather');
    }

    // Update Climate Tab if active
    try { updateCityClimateProfile(city); } catch(e) {}
  } catch(err) {
    console.error("Fatal error in selectCity:", err);
  }
}

// "Update Weather Now" Button Routine
async function updateWeatherNow() {
  const btnIcon = document.getElementById('update-btn-icon');
  const btn = document.getElementById('update-weather-btn');
  if (btnIcon) btnIcon.classList.add('spinning');
  if (btn) btn.disabled = true;

  try {
    if (currentCity) {
      // Direct live fetch without temporary fallback flashing
      let data;
      try {
        data = await WeatherAPI.fetchCityWeather(currentCity);
      } catch(e) {
        data = WeatherAPI.generateFallbackData(currentCity);
      }
      if (!data) data = WeatherAPI.generateFallbackData(currentCity);

      // Force update timestamp to exact current time
      const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      data.lastUpdated = `Just now (${nowStr})`;

      currentWeatherData = data;

      // Directly update dashboard with updated live data
      try { updateHeroDashboard(data); } catch(e) {}
      try { update7DaySunCycle(data); } catch(e) {}
      try { updateHourlyCards(data.hourly || []); } catch(e) {}
      try { updateAQIWidget(data.aqi); } catch(e) {}
      try { updateHourlyChart(data.hourly || []); } catch(e) {}
      try { update7DayForecast(data.daily || [], data.city); } catch(e) {}
      try { renderWeatherNewsFeed(data); } catch(e) {}

      if (scene3D && data.category) scene3D.setWeatherCategory(data.category);
      if (audioEngine && data.category) audioEngine.setSoundType(data.category);

      try {
        currentAlerts = AlertsSystem.getAlertsForLocation(data);
        if (currentAlerts && currentAlerts.length > 0) {
          updateAdvisoryPrecautions(currentAlerts[0]);
          updateAlertsBanner(currentAlerts[0]);
        }
      } catch(e) {}

      if (weatherSpeaker) weatherSpeaker.updateWidgetData(data);
    }
  } catch(e) {
    console.warn("Weather update failed:", e);
  } finally {
    setTimeout(() => {
      if (btnIcon) btnIcon.classList.remove('spinning');
      if (btn) btn.disabled = false;
    }, 600);
  }
}

// Hero Weather Dashboard Updater
function updateHeroDashboard(data) {
  if (!data) return;
  const cityNameEl = document.getElementById('current-city-name');
  const stateNameEl = document.getElementById('current-state-name');
  const tempEl = document.getElementById('current-temp');
  const conditionEl = document.getElementById('current-condition');
  const feelsLikeEl = document.getElementById('feels-like-temp');

  const humidityEl = document.getElementById('stat-humidity');
  const windEl = document.getElementById('stat-wind');
  const pressureEl = document.getElementById('stat-pressure');

  const tempVal = (typeof data.temp === 'number' && !isNaN(data.temp)) ? data.temp : 31;
  const feelsVal = (typeof data.feelsLike === 'number' && !isNaN(data.feelsLike)) ? data.feelsLike : tempVal + 2;

  if (cityNameEl) cityNameEl.textContent = data.city || "New Delhi";
  if (stateNameEl) stateNameEl.textContent = `${data.state || "Delhi NCR"} • India`;
  if (tempEl) tempEl.textContent = `${tempVal}°C`;
  if (conditionEl) conditionEl.textContent = data.condition || "Clear Sky";
  if (feelsLikeEl) feelsLikeEl.textContent = `${feelsVal}°C`;

  const humidityVal = (typeof data.humidity === 'number' && !isNaN(data.humidity)) ? data.humidity : 72;
  const windVal = (typeof data.windSpeed === 'number' && !isNaN(data.windSpeed)) ? data.windSpeed : 14;
  const windCompass = data.windDirCompass ? ` (${data.windDirCompass})` : '';
  const pressureVal = (typeof data.pressure === 'number' && !isNaN(data.pressure)) ? data.pressure : 1010;

  if (humidityEl) humidityEl.textContent = `${humidityVal}%`;
  if (windEl) windEl.textContent = `${windVal} km/h${windCompass}`;
  if (pressureEl) pressureEl.textContent = `${pressureVal} hPa`;

  // Apply Vibrant Theme Background Gradients to Hero Weather Box
  const heroCard = document.querySelector('.hero-weather-card');
  if (heroCard) {
    heroCard.classList.remove('theme-sunny', 'theme-rainy', 'theme-storm', 'theme-fog', 'theme-heatwave');
    let themeClass = 'theme-sunny';
    const cat = data.category || 'cloudy';

    if (tempVal >= 38) themeClass = 'theme-heatwave';
    else if (cat === 'storm') themeClass = 'theme-storm';
    else if (cat === 'rainy') themeClass = 'theme-rainy';
    else if (cat === 'fog') themeClass = 'theme-fog';
    else if (cat === 'cloudy') themeClass = 'theme-rainy';
    
    heroCard.classList.add(themeClass);
  }

  // Sun & Daylight Cycle Widget Fields
  const sunriseEl = document.getElementById('stat-sunrise');
  const sunsetEl = document.getElementById('stat-sunset');
  const dayHoursEl = document.getElementById('stat-day-hours');
  const nightHoursEl = document.getElementById('stat-night-hours');
  const maxTempEl = document.getElementById('stat-max-temp');
  const minTempEl = document.getElementById('stat-min-temp');

  const maxVal = (typeof data.maxTemp === 'number' && !isNaN(data.maxTemp)) ? data.maxTemp : tempVal + 3;
  const minVal = (typeof data.minTemp === 'number' && !isNaN(data.minTemp)) ? data.minTemp : tempVal - 5;

  if (sunriseEl) sunriseEl.textContent = data.sunrise || "06:05 AM";
  if (sunsetEl) sunsetEl.textContent = data.sunset || "07:12 PM";
  if (dayHoursEl) dayHoursEl.textContent = data.dayHours || "13 hrs 7 mins";
  if (nightHoursEl) nightHoursEl.textContent = data.nightHours || "10 hrs 53 mins";
  if (maxTempEl) maxTempEl.textContent = `${maxVal}°C`;
  if (minTempEl) minTempEl.textContent = `${minVal}°C`;

  const lastUpdatedEl = document.getElementById('last-updated-text');
  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = data.lastUpdated || new Date().toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  // Live Rain Intensity & Precipitation Alert Card
  const rainAlertCard = document.getElementById('rain-intensity-alert');
  const rInfo = data.rainInfo || (typeof WeatherAPI !== 'undefined' ? WeatherAPI.getRainIntensityInfo(data.precipitation || 0, data.condition) : null);
  const accStatus = (typeof WeatherAPI !== 'undefined' && WeatherAPI.getAccurateRainStatus) ? WeatherAPI.getAccurateRainStatus(data) : null;

  if (rainAlertCard && rInfo) {
    rainAlertCard.classList.remove('hidden');
    const badgeEl = document.getElementById('rain-intensity-badge');
    const titleEl = document.getElementById('rain-alert-title');
    const amountEl = document.getElementById('rain-amount-val');
    const speedEl = document.getElementById('rain-speed-val');
    const chanceEl = document.getElementById('rain-chance-val');
    const timeEl = document.getElementById('rain-time-val');
    const timeTextEl = document.getElementById('rain-time-text');
    const liveDotEl = document.getElementById('rain-live-dot');
    const rainAlertIcon = document.getElementById('rain-alert-icon');

    const isRaining = rInfo.isRaining;
    const hasDailyRain = (rInfo.amountMm > 0);

    const rainTimeStr = accStatus ? accStatus.statusText : (isRaining ? "Currently Raining" : (hasDailyRain ? "Rain Stopped" : "No Active Rain"));
    const dotColor = accStatus ? accStatus.dotColor : (isRaining ? "#ef4444" : (hasDailyRain ? "#f59e0b" : "#10b981"));
    const isPulsing = accStatus ? accStatus.isPulsing : isRaining;

    if (badgeEl) {
      badgeEl.textContent = accStatus ? accStatus.badgeText : (isRaining ? (rInfo.intensityEn || 'Rain Alert') : (hasDailyRain ? 'Rain Stopped' : 'No Active Rain'));
      badgeEl.style.backgroundColor = accStatus ? accStatus.badgeBg : (isRaining ? (rInfo.color || '#dc2626') : (hasDailyRain ? '#f59e0b' : '#0284c7'));
    }

    if (titleEl) {
      titleEl.textContent = accStatus ? accStatus.titleText : (isRaining ? `${rInfo.intensityEn || 'Rain Alert'} Active (${data.city})` : (hasDailyRain ? `Rain Stopped - Cleared in ${data.city}` : `Live Rain & Precipitation Status (${data.city})`));
    }

    if (rainAlertIcon && accStatus && accStatus.icon) {
      rainAlertIcon.setAttribute('data-lucide', accStatus.icon);
    }

    if (amountEl) {
      amountEl.textContent = rInfo.amountText || "0.0 mm (0.00 cm)";
    }
    if (speedEl) {
      speedEl.textContent = rInfo.speedText || "0.0 mm/h";
    }
    if (chanceEl) {
      const popVal = (data.hourly && data.hourly.length > 0 && typeof data.hourly[0].pop === 'number') ? data.hourly[0].pop : (isRaining ? 85 : (hasDailyRain ? 15 : 5));
      chanceEl.textContent = `${popVal}%`;
    }

    if (timeTextEl) {
      timeTextEl.textContent = rainTimeStr;
    } else if (timeEl) {
      timeEl.textContent = rainTimeStr;
    }

    if (liveDotEl) {
      liveDotEl.style.backgroundColor = dotColor;
      if (isPulsing) {
        liveDotEl.classList.add('pulsing');
      } else {
        liveDotEl.classList.remove('pulsing');
      }
    }
  }

  const iconEl = document.getElementById('current-weather-icon');
  if (iconEl) {
    iconEl.setAttribute('data-lucide', data.icon);
    lucide.createIcons();
  }
}

// 7-Day Sun & Daylight Cycle Forecast Carousel Updater
function update7DaySunCycle(data) {
  const container = document.getElementById('sun-7day-list');
  if (!container || !data) return;

  const daily = data.daily || [];
  if (daily.length === 0) return;

  container.innerHTML = daily.map((d, idx) => {
    const sunrise = d.sunrise || data.sunrise || "06:05 AM";
    const sunset = d.sunset || data.sunset || "07:12 PM";
    const dayHours = d.dayHours || data.dayHours || "13 hrs 7 mins";
    const isToday = idx === 0;

    return `
      <div class="sun-day-chip ${isToday ? 'active-day' : ''}">
        <div class="sun-day-name">${d.day}</div>
        <div class="sun-day-date">${d.date || ''}</div>
        <div class="sun-times-row">
          <span class="s-time rise"><i data-lucide="sunrise"></i> ${sunrise}</span>
          <span class="s-time set"><i data-lucide="sunset"></i> ${sunset}</span>
        </div>
        <div class="sun-dur-tag">
          <i data-lucide="clock"></i> ${dayHours}
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// Condition Advisory & Precautions Box Updater
function updateAdvisoryPrecautions(alert) {
  if (!alert) return;
  document.getElementById('advisory-title').innerHTML = `${alert.type}: <strong>${alert.title}</strong>`;
  document.getElementById('advisory-desc').innerHTML = alert.description;

  const precautionsContainer = document.getElementById('precautions-list');
  if (precautionsContainer && alert.instructions) {
    precautionsContainer.innerHTML = alert.instructions.map(inst => `
      <div class="precaution-item">
        <i data-lucide="shield-check" style="color: var(--accent-cyan);"></i>
        <span>${inst}</span>
      </div>
    `).join('');
  }

  // Render Visual Do's & Don'ts Advisory Grid with Animated Illustrations
  const visualContainer = document.getElementById('visual-precautions-container');
  if (visualContainer) {
    const dosList = alert.dos || [
      "<strong class=\"bold-important\">Drink plenty of water, coconut water, or ORS frequently</strong>.",
      "<strong class=\"bold-important\">Wear lightweight, loose-fitting cotton clothing</strong>.",
      "<strong class=\"bold-important\">Check daily weather forecasts</strong> before travelling outdoors."
    ];
    const dontsList = alert.donts || [
      "<strong class=\"bold-important\">Do NOT step out in direct sun</strong> during peak afternoon hours.",
      "<strong class=\"bold-important\">Do NOT ignore local weather warnings</strong> or flood advisories."
    ];
    const doImg = alert.doImage || "./images/do_clear.svg";
    const dontImg = alert.dontImage || "./images/dont_clear.svg";

    visualContainer.innerHTML = `
      <!-- DO'S COLUMN (GREEN) -->
      <div class="visual-dos-card">
        <div class="dos-header">
          <i data-lucide="check-circle" style="color: #059669;"></i> DO'S (क्या करें - आवश्यक सुरक्षा नियम)
        </div>
        <div class="dos-body">
          <div class="visual-img-box">
            <img src="${doImg}" alt="Do's Weather Guidelines" class="visual-advisory-img">
          </div>
          <ul class="dos-ul">
            ${dosList.map(item => `<li><i data-lucide="check-circle-2" class="check-icon"></i> <span>${item}</span></li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- DON'TS COLUMN (RED) -->
      <div class="visual-donts-card">
        <div class="donts-header">
          <i data-lucide="alert-triangle" style="color: #dc2626;"></i> DON'TS (क्या न करें - सावधानियां)
        </div>
        <div class="donts-body">
          <div class="visual-img-box">
            <img src="${dontImg}" alt="Don'ts Weather Guidelines" class="visual-advisory-img">
          </div>
          <ul class="donts-ul">
            ${dontsList.map(item => `<li><i data-lucide="x-circle" class="cross-icon"></i> <span>${item}</span></li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

// Hourly Weather Cards Carousel Updater with Icons
function updateHourlyCards(hourly) {
  const container = document.getElementById('hourly-cards-wrap');
  if (!container) return;

  container.innerHTML = hourly.map(h => `
    <div class="hourly-card" title="${h.condition}">
      <div class="h-time">${h.time}</div>
      <i data-lucide="${h.icon}"></i>
      <div class="h-temp">${h.temp}°C</div>
      <div style="font-size: 0.72rem; color: var(--accent-cyan); display: flex; align-items: center; gap: 0.2rem;">
        <i data-lucide="droplets" style="font-size: 0.7rem;"></i> ${h.pop}%
      </div>
    </div>
  `).join('');

  lucide.createIcons();
}

// AQI Widget Updater
function updateAQIWidget(aqi) {
  const valEl = document.getElementById('aqi-val');
  const labelEl = document.getElementById('aqi-label');
  const dotEl = document.getElementById('aqi-indicator-dot');

  const defaultVal = (currentCity && (currentCity.name === "New Delhi" || currentCity.name === "Ghaziabad" || currentCity.name === "Kanpur" || currentCity.name === "Patna")) ? 220 : 85;
  const aqiVal = (aqi && typeof aqi.value === 'number' && !isNaN(aqi.value) && aqi.value > 0) ? aqi.value : defaultVal;

  let statusObj;
  if (aqi && aqi.status && typeof aqi.status === 'object' && aqi.status.label) {
    statusObj = aqi.status;
  } else if (typeof WeatherAPI !== 'undefined' && typeof WeatherAPI.getAqiStatus === 'function') {
    statusObj = WeatherAPI.getAqiStatus(aqiVal);
  } else {
    statusObj = { label: aqiVal > 200 ? "Poor" : (aqiVal > 100 ? "Moderate" : "Satisfactory"), color: aqiVal > 200 ? "#f97316" : "#f59e0b" };
  }

  if (valEl) valEl.textContent = aqiVal;
  if (labelEl) {
    labelEl.textContent = statusObj.label || 'Moderate';
    labelEl.style.color = statusObj.color || '#f59e0b';
  }

  if (dotEl) {
    const percentage = Math.min(100, Math.max(0, (aqiVal / 400) * 100));
    dotEl.style.left = `${percentage}%`;
  }

  const pm25El = document.getElementById('aqi-pm25');
  const pm10El = document.getElementById('aqi-pm10');
  const no2El = document.getElementById('aqi-no2');
  const o3El = document.getElementById('aqi-o3');

  const pm25 = (aqi && typeof aqi.pm25 === 'number' && !isNaN(aqi.pm25)) ? aqi.pm25 : (aqiVal > 200 ? 75 : 35);
  const pm10 = (aqi && typeof aqi.pm10 === 'number' && !isNaN(aqi.pm10)) ? aqi.pm10 : (aqiVal > 200 ? 140 : 65);
  const no2 = (aqi && typeof aqi.no2 === 'number' && !isNaN(aqi.no2)) ? aqi.no2 : 22;
  const o3 = (aqi && typeof aqi.o3 === 'number' && !isNaN(aqi.o3)) ? aqi.o3 : 28;

  if (pm25El) pm25El.textContent = `${pm25} µg/m³`;
  if (pm10El) pm10El.textContent = `${pm10} µg/m³`;
  if (no2El) no2El.textContent = `${no2} ppb`;
  if (o3El) o3El.textContent = `${o3} ppb`;
}

// 24-Hour Temperature Chart Updater
function updateHourlyChart(hourly) {
  if (!hourly || !Array.isArray(hourly) || hourly.length === 0) return;
  const canvas = document.getElementById('forecastChart');
  if (!canvas || typeof Chart === 'undefined') return;

  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels = hourly.map(h => h.time);
    const temps = hourly.map(h => h.temp);
    const pops = hourly.map(h => h.pop);

    if (forecastChart) {
      try { forecastChart.destroy(); } catch(e) {}
    }

    forecastChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Temperature (°C)',
            data: temps,
            borderColor: '#0284c7',
            backgroundColor: 'rgba(2, 132, 199, 0.12)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Rain Chance (%)',
            data: pops,
            borderColor: '#2563eb',
            borderDash: [4, 4],
            fill: false,
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } },
          y: { position: 'left', grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#0284c7' } },
          y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#2563eb' }, min: 0, max: 100 }
        }
      }
    });
  } catch(e) {
    console.warn("forecastChart error:", e);
  }
}

// 7-Day Forecast Updater
function update7DayForecast(daily, cityName = "") {
  const container = document.getElementById('forecast-7day-container');
  const titleEl = document.getElementById('forecast-7day-title');

  if (titleEl && cityName) {
    titleEl.textContent = `7-Day Weather Forecast for ${cityName}`;
  }

  if (!container || !daily) return;

  container.innerHTML = daily.map(d => `
    <div class="forecast-day-card">
      <div class="f-day-header">
        <span class="f-day-name">${d.day}</span>
        <span class="f-date-tag">${d.date || ''}</span>
      </div>
      <div class="f-icon-box">
        <i data-lucide="${d.icon}"></i>
      </div>
      <div class="f-condition-text">${d.condition || ''}</div>
      <div class="f-temp-range">
        <span class="f-max">${d.maxTemp}°</span>
        <span class="f-min">${d.minTemp}°</span>
      </div>
      <div class="f-rain-badge">
        <i data-lucide="droplets"></i> ${d.rainProb}% Rain
      </div>
    </div>
  `).join('');

  lucide.createIcons();
}

// Render Weather News Feed Cards
function renderWeatherNewsFeed(cityData = null) {
  const container = document.getElementById('news-grid-container');
  const newsCityTitle = document.getElementById('news-city-name');
  if (!container) return;

  let newsList = [];
  if (cityData && typeof getCityWeatherNews === 'function') {
    if (newsCityTitle) newsCityTitle.textContent = `${cityData.city}, ${cityData.state}`;
    newsList = getCityWeatherNews(cityData.city, cityData.state, cityData.condition);
  } else if (typeof WEATHER_NEWS !== 'undefined') {
    if (newsCityTitle) newsCityTitle.textContent = 'All Cities';
    newsList = WEATHER_NEWS;
  }

  container.innerHTML = newsList.map(n => `
    <div class="news-card">
      <div>
        <div class="news-meta">
          <span class="news-tag" style="background: ${n.tagColor}">${n.category}</span>
          <span class="news-date"><i data-lucide="calendar" style="width: 13px; height: 13px; vertical-align: middle;"></i> ${n.date}</span>
        </div>
        <h4 class="news-title">${n.title}</h4>
        <p class="news-summary">${n.summary}</p>
      </div>
      <div class="news-publisher-bar">
        <i data-lucide="building-2"></i>
        <span>Publisher: <strong>${n.source}</strong></span>
      </div>
    </div>
  `).join('');

  lucide.createIcons();
}

// INITIALIZE CLIMATE TAB CHARTS & CITY CLIMATE PROFILES
function initClimateCharts() {
  if (typeof Chart === 'undefined' || typeof INDIA_CLIMATE_TRENDS === 'undefined') return;

  // 1. India Temperature Anomaly Trend (2018-2026)
  try {
    const canvasTrend = document.getElementById('climateTrendChart');
    if (canvasTrend) {
      const ctxTrend = canvasTrend.getContext('2d');
      if (ctxTrend) {
        if (climateTrendChart) { try { climateTrendChart.destroy(); } catch(e) {} }
        climateTrendChart = new Chart(ctxTrend, {
          type: 'line',
          data: {
            labels: INDIA_CLIMATE_TRENDS.years,
            datasets: [{
              label: 'Temp Anomaly (°C above baseline)',
              data: INDIA_CLIMATE_TRENDS.tempAnomaly,
              borderColor: '#dc2626',
              backgroundColor: 'rgba(220, 38, 38, 0.15)',
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: 'rgba(0,0,0,0.05)' } },
              y: { grid: { color: 'rgba(0,0,0,0.05)' } }
            }
          }
        });
      }
    }
  } catch(e) {
    console.warn("climateTrendChart error:", e);
  }

  // 2. Monsoon Rainfall Chart (% LPA)
  try {
    const canvasMonsoon = document.getElementById('monsoonRainChart');
    if (canvasMonsoon) {
      const ctxMonsoon = canvasMonsoon.getContext('2d');
      if (ctxMonsoon) {
        if (monsoonRainChart) { try { monsoonRainChart.destroy(); } catch(e) {} }
        monsoonRainChart = new Chart(ctxMonsoon, {
          type: 'bar',
          data: {
            labels: INDIA_CLIMATE_TRENDS.years,
            datasets: [{
              label: 'Monsoon Rainfall (% LPA)',
              data: INDIA_CLIMATE_TRENDS.monsoonRainfall,
              backgroundColor: '#0284c7',
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false } },
              y: { grid: { color: 'rgba(0,0,0,0.05)' }, min: 80, max: 120 }
            }
          }
        });
      }
    }
  } catch(e) {
    console.warn("monsoonRainChart error:", e);
  }
}

// Update Searched City Climate Profile Deep-Dive
function updateCityClimateProfile(city) {
  if (!city) return;
  const profile = (typeof CITY_CLIMATE_PROFILES !== 'undefined' && CITY_CLIMATE_PROFILES[city.name])
    ? CITY_CLIMATE_PROFILES[city.name]
    : (typeof DEFAULT_CLIMATE_PROFILE !== 'undefined' ? DEFAULT_CLIMATE_PROFILE : { type: "Semi-Arid Monsoonal", annualRainfall: "790 mm", avgSummerMax: "41.5 °C", vulnerability: "Heatwave & Smog", monthlyTemps: [15,18,24,30,34,34,31,30,29,26,21,16], monthlyRain: [15,20,15,10,25,75,210,230,120,25,10,10] });

  const titleEl = document.getElementById('climate-city-title');
  if (titleEl) titleEl.textContent = `${city.name}, ${city.state}`;

  const zoneEl = document.getElementById('c-zone-type');
  if (zoneEl) zoneEl.textContent = profile.type;

  const rainEl = document.getElementById('c-annual-rain');
  if (rainEl) rainEl.textContent = profile.annualRainfall;

  const maxEl = document.getElementById('c-summer-max');
  if (maxEl) maxEl.textContent = profile.avgSummerMax;

  const vulEl = document.getElementById('c-vulnerability');
  if (vulEl) vulEl.textContent = profile.vulnerability;

  const canvas = document.getElementById('cityMonthlyChart');
  if (!canvas || typeof Chart === 'undefined') return;

  try {
    const ctxMonthly = canvas.getContext('2d');
    if (!ctxMonthly) return;

    if (cityMonthlyChart) { try { cityMonthlyChart.destroy(); } catch(e) {} }

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    cityMonthlyChart = new Chart(ctxMonthly, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            type: 'line',
            label: 'Avg Temp (°C)',
            data: profile.monthlyTemps,
            borderColor: '#d97706',
            yAxisID: 'y'
          },
          {
            type: 'bar',
            label: 'Rainfall (mm)',
            data: profile.monthlyRain,
            backgroundColor: 'rgba(2, 132, 199, 0.7)',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { type: 'linear', display: true, position: 'left' },
          y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } }
        }
      }
    });
  } catch(e) {
    console.warn("cityMonthlyChart error:", e);
  }
}

// FEEDBACK FORM & 500-CHARACTER LIMIT HANDLER
function updateCharCounter() {
  const textarea = document.getElementById('fb-message');
  const counter = document.getElementById('char-counter');
  if (!textarea || !counter) return;

  const remaining = 500 - textarea.value.length;
  counter.textContent = `${remaining} characters remaining`;

  if (remaining < 50) {
    counter.style.color = 'var(--accent-red)';
  } else {
    counter.style.color = 'var(--text-muted)';
  }
}

function handleFeedbackSubmit(event) {
  event.preventDefault();

  // Hide form card, display THANK YOU view card
  document.getElementById('feedback-form-card').style.display = 'none';
  document.getElementById('thank-you-card').classList.add('active');
  lucide.createIcons();
}

function resetFeedbackForm() {
  document.getElementById('feedback-form').reset();
  updateCharCounter();
  document.getElementById('thank-you-card').classList.remove('active');
  document.getElementById('feedback-form-card').style.display = 'block';
}

// Alert Banner & Modal Window
function updateAlertsBanner(alert) {
  if (!alert) return;
  document.getElementById('alert-type-text').textContent = alert.type;
  document.getElementById('alert-summary-text').innerHTML = `<strong>${alert.title}</strong> — ${alert.description}`;
}

function openAlertModal() {
  // Only open safety advisory modal if on the Weather page
  const weatherView = document.getElementById('view-weather');
  if (!weatherView || !weatherView.classList.contains('active')) return;

  const alert = (currentAlerts && currentAlerts.length > 0) ? currentAlerts[0] : null;
  if (!alert) return;

  document.getElementById('modal-alert-title').innerHTML = `<i data-lucide="alert-triangle"></i> ${alert.type}`;
  document.getElementById('modal-alert-desc').innerHTML = `<strong style="font-size: 1.05rem; color: #1e293b;">${alert.title}</strong><br><span style="margin-top: 0.3rem; display: inline-block;">${alert.description}</span>`;
  
  const listEl = document.getElementById('modal-alert-list');
  listEl.innerHTML = (alert.instructions || []).map(inst => `<li style="margin-bottom: 0.4rem;">${inst}</li>`).join('');

  document.getElementById('alert-modal').classList.add('active');
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function closeAlertModal() {
  document.getElementById('alert-modal').classList.remove('active');
}

// Optimized Instant Search Engine with Live Geocoding API & Enter Key Support
let currentSearchResultsMap = new Map();

function setupSearchEngine() {
  const input = document.getElementById('city-search-input');
  const results = document.getElementById('search-results');

  if (!input) return;

  // Pre-index cities for ultra-fast lookup
  const searchIndex = INDIAN_CITIES.map(c => ({
    city: c,
    nameLower: c.name.toLowerCase(),
    stateLower: c.state.toLowerCase(),
    regionLower: c.region.toLowerCase()
  }));

  let searchTimeout = null;

  const performSearch = async (query) => {
    updateSearchClearButton();
    const cleanQuery = query.toLowerCase().trim();
    if (cleanQuery.length < 1) {
      results.classList.remove('active');
      return;
    }

    // 1. Local index matches
    const startsWithMatches = [];
    const includesMatches = [];

    for (let i = 0; i < searchIndex.length; i++) {
      const item = searchIndex[i];
      if (item.nameLower.startsWith(cleanQuery)) {
        startsWithMatches.push(item.city);
      } else if (item.nameLower.includes(cleanQuery) || item.stateLower.includes(cleanQuery) || item.regionLower.includes(cleanQuery)) {
        includesMatches.push(item.city);
      }
      if (startsWithMatches.length + includesMatches.length >= 8) break;
    }

    let combinedMatches = [...startsWithMatches, ...includesMatches].slice(0, 8);
    currentSearchResultsMap.clear();

    combinedMatches.forEach(c => {
      currentSearchResultsMap.set(c.name.toLowerCase(), c);
    });

    // 2. Fetch Live Geocoding API for Indian locations if query length >= 2
    if (cleanQuery.length >= 2) {
      try {
        const geoResults = await WeatherAPI.searchCityGeocoding(cleanQuery);
        if (geoResults && geoResults.length > 0) {
          geoResults.forEach(g => {
            const isIndian = !g.country || g.country.toLowerCase() === 'india';
            if (isIndian && !currentSearchResultsMap.has(g.name.toLowerCase())) {
              currentSearchResultsMap.set(g.name.toLowerCase(), g);
              combinedMatches.push(g);
            }
          });
        }
      } catch(e) {}
    }

    combinedMatches = combinedMatches.slice(0, 8);

    if (combinedMatches.length > 0) {
      results.innerHTML = combinedMatches.map(c => `
        <div class="result-item" onclick="selectCityFromObj('${encodeURIComponent(JSON.stringify(c))}')">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="map-pin" style="width: 14px; height: 14px; color: var(--accent-cyan);"></i>
            <span class="city-name" style="font-weight: 600;">${c.name}</span>
          </div>
          <span class="state-tag" style="font-size: 0.75rem; color: var(--text-muted);">${c.state || c.country || ''}</span>
        </div>
      `).join('');
      results.classList.add('active');
      if (window.lucide) lucide.createIcons();
    } else {
      results.classList.remove('active');
    }
  };

  input.addEventListener('input', (e) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(e.target.value), 180);
  });

  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;

      results.classList.remove('active');

      // Check if top result exists in map
      const topResult = Array.from(currentSearchResultsMap.values())[0];
      if (topResult) {
        selectCity(topResult);
      } else {
        await selectCityByName(val);
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !results.contains(e.target)) {
      results.classList.remove('active');
    }
  });
}

async function triggerSearchNow() {
  const input = document.getElementById('city-search-input');
  const results = document.getElementById('search-results');
  if (results) results.classList.remove('active');
  if (input && input.value.trim()) {
    const val = input.value.trim();
    const topResult = Array.from(currentSearchResultsMap.values())[0];
    if (topResult && topResult.name.toLowerCase() === val.toLowerCase()) {
      selectCity(topResult);
    } else {
      await selectCityByName(val);
    }
  }
}
window.triggerSearchNow = triggerSearchNow;

function selectCityFromObj(encodedObj) {
  try {
    const city = JSON.parse(decodeURIComponent(encodedObj));
    selectCity(city);
    const searchInput = document.getElementById('city-search-input');
    if (searchInput) {
      searchInput.value = city.name;
      updateSearchClearButton();
    }
  } catch(e) {}
  const results = document.getElementById('search-results');
  if (results) results.classList.remove('active');
}

function selectCityFromSearch(name) {
  selectCityByName(name);
  const searchInput = document.getElementById('city-search-input');
  if (searchInput) {
    searchInput.value = name;
    updateSearchClearButton();
  }
  const results = document.getElementById('search-results');
  if (results) results.classList.remove('active');
}

function filterByRegion(region) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');

  let filtered = INDIAN_CITIES;
  if (region !== 'All') {
    filtered = INDIAN_CITIES.filter(c => c.region.includes(region));
  }
  renderCitiesList(filtered);
}

function toggleAudioSoundscape() {
  if (!audioEngine) return;
  const isPlaying = audioEngine.toggle();
  const btn = document.getElementById('audio-toggle-btn');
  btn.classList.toggle('active', isPlaying);
}

function toggleWeatherSpeaker() {
  if (!weatherSpeaker) {
    try {
      weatherSpeaker = new WeatherSpeaker();
    } catch(e) {
      console.error("WeatherSpeaker initialization error:", e);
    }
  }

  if (weatherSpeaker) {
    const data = (typeof currentWeatherData !== 'undefined' && currentWeatherData && currentWeatherData.city) ? currentWeatherData : weatherSpeaker.getCurrentData();

    if (weatherSpeaker.isSpeaking) {
      weatherSpeaker.stop();
    } else if (data) {
      weatherSpeaker.speak(data);
    }
  }
}
window.toggleWeatherSpeaker = toggleWeatherSpeaker;

function setSpeakerLanguage(lang) {
  if (!weatherSpeaker) {
    try {
      weatherSpeaker = new WeatherSpeaker();
    } catch(e) {}
  }
  if (weatherSpeaker) {
    weatherSpeaker.setLanguage(lang);
    const data = (typeof currentWeatherData !== 'undefined' && currentWeatherData && currentWeatherData.city) ? currentWeatherData : weatherSpeaker.getCurrentData();
    if (data) {
      weatherSpeaker.updateWidgetData(data);
    }
  }
}
window.setSpeakerLanguage = setSpeakerLanguage;

function changeSpeakerVoice(voiceURI) {
  if (!weatherSpeaker) {
    try {
      weatherSpeaker = new WeatherSpeaker();
    } catch(e) {}
  }
  if (weatherSpeaker) {
    weatherSpeaker.setSelectedVoice(voiceURI);
  }
}
window.changeSpeakerVoice = changeSpeakerVoice;

function detectUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;

        let closestCity = INDIAN_CITIES[0];
        let minDist = Infinity;

        INDIAN_CITIES.forEach(c => {
          const dist = Math.hypot(c.lat - userLat, c.lon - userLon);
          if (dist < minDist) {
            minDist = dist;
            closestCity = c;
          }
        });

        selectCity(closestCity);
      },
      () => { alert("Location access denied. Defaulting to New Delhi."); }
    );
  }
}

// Introduction Language Switcher (EN / HI)
function setIntroLanguage(lang) {
  const enBtn = document.getElementById('intro-lang-en');
  const hiBtn = document.getElementById('intro-lang-hi');

  if (lang === 'en') {
    if (enBtn) enBtn.classList.add('active');
    if (hiBtn) hiBtn.classList.remove('active');

    document.querySelectorAll('.text-en').forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('.text-hi').forEach(el => el.classList.add('hidden'));

    document.querySelectorAll('[data-en]').forEach(el => {
      const val = el.getAttribute('data-en');
      if (val) {
        const icon = el.querySelector('i');
        if (icon) {
          const iconHTML = icon.outerHTML;
          el.innerHTML = `${iconHTML} ${val}`;
        } else {
          el.textContent = val;
        }
      }
    });
  } else {
    if (hiBtn) hiBtn.classList.add('active');
    if (enBtn) enBtn.classList.remove('active');

    document.querySelectorAll('.text-hi').forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('.text-en').forEach(el => el.classList.add('hidden'));

    document.querySelectorAll('[data-hi]').forEach(el => {
      const val = el.getAttribute('data-hi');
      if (val) {
        const icon = el.querySelector('i');
        if (icon) {
          const iconHTML = icon.outerHTML;
          el.innerHTML = `${iconHTML} ${val}`;
        } else {
          el.textContent = val;
        }
      }
    });
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}
window.setIntroLanguage = setIntroLanguage;


// HINDI WEATHER SHAYARI & QUOTES SYSTEM (FOOTER)
const HINDI_WEATHER_SHAYARIS = [
  { quote: '"काली घटाओं में छुपी ठंडी फुहार है, इस मौसम में खुशियों की बहार है..."', author: '— मौसम और कुदरत की ख़ूबसूरती' },
  { quote: '"बरसात की भीगी रातों में, हवाओं की मीठी बातों में, मौसम का जादू छाया है..."', author: '— सावन का सुहाना पैगाम' },
  { quote: '"हवाओं में खुशबू मिट्टी की सोंधी सोंधी, बारिश की बूंदों में छुपी जिंदगी नई नई..."', author: '— वर्षा ऋतु का अहसास' },
  { quote: '"कभी धूप तो कभी छांव है मौसम, कुदरत का सबसे हसीन रंग है मौसम..."', author: '— प्रकृति का अनुपम मिजाज' },
  { quote: '"बादलों की आगोश में सिमटा है आसमां, मौसम का मिजाज आज फिर से है सुहाना..."', author: '— गगन और बादलों की दास्तान' },
  { quote: '"सर्द हवाओं का रुख बदला, सूरज की किरणों ने मन मोहा, कुदरत की इस सुहानी छांव में नया राग छेड़ा..."', author: '— मौसम का सुरमई एहसास' },
  { quote: '"रिमझिम गिरती बारिश की बूँदें, हवाओं संग थिरकते पत्ते, मौसम जब मुस्कुराता है, तो हर दिल झूम उठता है..."', author: '— रिमझिम बारिश' },
  { quote: '"सावन की पहली फुहार में, मिट्टी की महकती खुशबू में, मौसम कह रहा है एक नई कहानी..."', author: '— मिट्टी की सोंधी महक' },
  { quote: '"धूप छांव का अनोखा खेल, नीले आसमां में बादलों का मेल, मौसम का यह सुंदर रूप मन को हर लेता है..."', author: '— आसमां का सुहाना दृश्य' },
  { quote: '"ठंडी हवा का झोंका और आसमां में छाये बादल, मौसम की यह ख़ूबसूरत अदा बनाती है हर पल यादगार..."', author: '— सुहानी फुहार' }
];

let currentShayariIndex = 0;

function nextWeatherShayari() {
  currentShayariIndex = (currentShayariIndex + 1) % HINDI_WEATHER_SHAYARIS.length;
  const item = HINDI_WEATHER_SHAYARIS[currentShayariIndex];

  const textEl = document.getElementById('footer-shayari-text');
  const authorEl = document.getElementById('footer-shayari-author');

  if (textEl && authorEl) {
    textEl.style.transition = 'opacity 0.25s ease';
    textEl.style.opacity = '0';
    setTimeout(() => {
      textEl.textContent = item.quote;
      authorEl.textContent = item.author;
      textEl.style.opacity = '1';
    }, 250);
  }
}

// REAL-TIME NETWORK CONNECTIVITY MONITORING SYSTEM
function initNetworkMonitor() {
  const badge = document.getElementById('net-status-badge');
  const icon = document.getElementById('net-status-icon');
  const text = document.getElementById('net-status-text');

  function updateStatus() {
    if (!badge || !text) return;

    if (!navigator.onLine) {
      // Offline State
      badge.className = 'net-status-badge net-offline';
      text.textContent = 'Internet Off - Turn on Wi-Fi/Data';
      if (icon) icon.setAttribute('data-lucide', 'wifi-off');
    } else {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      let isWeak = false;

      if (conn) {
        if (conn.saveData || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || (conn.rtt && conn.rtt > 800) || (conn.downlink && conn.downlink < 0.5)) {
          isWeak = true;
        }
      }

      if (isWeak) {
        // Weak / Slow Connection
        badge.className = 'net-status-badge net-weak';
        text.textContent = 'Weak Connection';
        if (icon) icon.setAttribute('data-lucide', 'wifi');
      } else {
        // Good Connection
        badge.className = 'net-status-badge net-good';
        text.textContent = 'Internet Good';
        if (icon) icon.setAttribute('data-lucide', 'wifi');
      }
    }

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);

  if (navigator.connection) {
    navigator.connection.addEventListener('change', updateStatus);
  }

  updateStatus();
  setInterval(updateStatus, 8000);
}

