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
  scene3D = new Weather3DScene('canvas-container');

  // Initialize Web Audio Engine & Weather Voice Speaker
  audioEngine = new WeatherAudioEngine();
  weatherSpeaker = new WeatherSpeaker();

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

  // Load Initial Weather & Climate Data
  selectCity(currentCity);

  // Initialize Network Connectivity Indicator
  initNetworkMonitor();

  // Default to Weather view on page load so all details are visible immediately
  switchNavTab('weather');

  // Render Climate Tab Visuals
  initClimateCharts();
});

// TOP NAVIGATION TABS SWITCHER
function switchNavTab(tabName) {
  // Update Tab Buttons UI
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeTabBtn = document.getElementById(`tab-btn-${tabName}`);
  if (activeTabBtn) activeTabBtn.classList.add('active');

  // Update View Sections
  document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
  const activeView = document.getElementById(`view-${tabName}`);
  if (activeView) activeView.classList.add('active');

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
    if (weatherSpeaker) weatherSpeaker.stop();
    if (audioEngine && audioEngine.isPlaying) {
      audioEngine.stop();
      if (audioToggleBtn) audioToggleBtn.classList.remove('active');
    }
    closeAlertModal();
  }

  if (tabName === 'climate') {
    updateCityClimateProfile(currentCity);
  }
}

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

function selectCityByName(cityName) {
  const city = INDIAN_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
  if (city) selectCity(city);
}

// Main City Selection Routine
async function selectCity(city) {
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

    // Fetch live weather data with guaranteed fallback object
    let data;
    try {
      data = await WeatherAPI.fetchCityWeather(city);
    } catch(e) {
      console.warn("Weather API fetch error, generating fallback data:", e);
      data = WeatherAPI.generateFallbackData(city);
    }

    if (!data) {
      data = WeatherAPI.generateFallbackData(city);
    }

    currentWeatherData = data;

    // Add to Search History
    addToSearchHistory(data);

    // Update Dashboard Widgets safely
    try { updateHeroDashboard(data); } catch(e) { console.error("updateHeroDashboard error:", e); }
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
    if (weatherSpeaker) {
      weatherSpeaker.updateWidgetData(data);
    }

    // Automatically switch to Weather View tab to present all weather details
    switchNavTab('weather');

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
      await selectCity(currentCity);
    }
  } catch(e) {
    console.warn("Weather update failed:", e);
  } finally {
    setTimeout(() => {
      if (btnIcon) btnIcon.classList.remove('spinning');
      if (btn) btn.disabled = false;
    }, 500);
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

  if (cityNameEl) cityNameEl.textContent = data.city || "New Delhi";
  if (stateNameEl) stateNameEl.textContent = `${data.state || "Delhi NCR"} • India`;
  if (tempEl) tempEl.textContent = `${data.temp ?? 32}°C`;
  if (conditionEl) conditionEl.textContent = data.condition || "Clear Sky";
  if (feelsLikeEl) feelsLikeEl.textContent = `${data.feelsLike ?? data.temp ?? 34}°C`;

  if (humidityEl) humidityEl.textContent = `${data.humidity ?? 70}%`;
  if (windEl) windEl.textContent = `${data.windSpeed ?? 12} km/h`;
  if (pressureEl) pressureEl.textContent = `${data.pressure ?? 1010} hPa`;

  // Sun & Daylight Cycle Widget Fields
  const sunriseEl = document.getElementById('stat-sunrise');
  const sunsetEl = document.getElementById('stat-sunset');
  const dayHoursEl = document.getElementById('stat-day-hours');
  const nightHoursEl = document.getElementById('stat-night-hours');
  const maxTempEl = document.getElementById('stat-max-temp');
  const minTempEl = document.getElementById('stat-min-temp');

  if (sunriseEl) sunriseEl.textContent = data.sunrise || "06:05 AM";
  if (sunsetEl) sunsetEl.textContent = data.sunset || "07:12 PM";
  if (dayHoursEl) dayHoursEl.textContent = data.dayHours || "13 hrs 7 mins";
  if (nightHoursEl) nightHoursEl.textContent = data.nightHours || "10 hrs 53 mins";
  if (maxTempEl) maxTempEl.textContent = `${data.maxTemp ?? ((data.temp ?? 30) + 3)}°C`;
  if (minTempEl) minTempEl.textContent = `${data.minTemp ?? ((data.temp ?? 30) - 5)}°C`;
  if (dayHoursEl) dayHoursEl.textContent = data.dayHours || "13 hrs 7 mins";
  if (nightHoursEl) nightHoursEl.textContent = data.nightHours || "10 hrs 53 mins";
  if (maxTempEl) maxTempEl.textContent = `${data.maxTemp || data.temp + 3}°C`;
  if (minTempEl) minTempEl.textContent = `${data.minTemp || data.temp - 5}°C`;

  const lastUpdatedEl = document.getElementById('last-updated-text');
  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = data.lastUpdated || new Date().toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  // Live Rain Intensity & Precipitation Alert Card
  const rainAlertCard = document.getElementById('rain-intensity-alert');
  const rInfo = data.rainInfo || (typeof WeatherAPI !== 'undefined' ? WeatherAPI.getRainIntensityInfo(data.precipitation || 0, data.condition) : null);

  if (rainAlertCard) {
    if (rInfo && rInfo.isRaining) {
      rainAlertCard.classList.remove('hidden');
      const badgeEl = document.getElementById('rain-intensity-badge');
      const titleEl = document.getElementById('rain-alert-title');
      const amountEl = document.getElementById('rain-amount-val');
      const chanceEl = document.getElementById('rain-chance-val');
      
      if (badgeEl) {
        badgeEl.textContent = rInfo.intensityEn;
        badgeEl.style.background = rInfo.color;
      }
      if (titleEl) {
        titleEl.textContent = `Active Precipitation in ${data.city} (${data.condition})`;
      }
      if (amountEl) {
        amountEl.textContent = rInfo.amountText;
      }
      if (chanceEl) {
        chanceEl.textContent = `${data.hourly && data.hourly[0] ? data.hourly[0].pop : 80}%`;
      }
    } else {
      rainAlertCard.classList.add('hidden');
    }
  }

  const iconEl = document.getElementById('current-weather-icon');
  if (iconEl) {
    iconEl.setAttribute('data-lucide', data.icon);
    lucide.createIcons();
  }
}

// Condition Advisory & Precautions Box Updater
function updateAdvisoryPrecautions(alert) {
  if (!alert) return;
  document.getElementById('advisory-title').textContent = `${alert.type}: ${alert.title}`;
  document.getElementById('advisory-desc').textContent = alert.description;

  const precautionsContainer = document.getElementById('precautions-list');
  if (precautionsContainer && alert.instructions) {
    precautionsContainer.innerHTML = alert.instructions.map(inst => `
      <div class="precaution-item">
        <i data-lucide="check-circle-2" style="color: var(--accent-gold);"></i>
        <span>${inst}</span>
      </div>
    `).join('');
  }

  // Render Visual Do's & Don'ts Advisory Grid with Animated Illustrations
  const visualContainer = document.getElementById('visual-precautions-container');
  if (visualContainer) {
    const dosList = alert.dos || [
      "Drink plenty of water, coconut water, or ORS frequently.",
      "Wear lightweight, loose-fitting cotton clothing.",
      "Check daily weather forecasts before travelling outdoors."
    ];
    const dontsList = alert.donts || [
      "Do NOT step out in direct sun during peak afternoon hours.",
      "Do NOT ignore local weather warnings or flood advisories."
    ];
    const doImg = alert.doImage || "./images/do_clear.svg";
    const dontImg = alert.dontImage || "./images/dont_clear.svg";

    visualContainer.innerHTML = `
      <!-- DO'S COLUMN (GREEN) -->
      <div class="dos-card">
        <div class="dos-header">
          <div class="dos-badge"><i data-lucide="check-circle"></i> DO'S (क्या करें)</div>
        </div>
        <div class="dos-body">
          <div class="visual-img-box">
            <img src="${doImg}" alt="Do's Weather Guidelines" class="visual-advisory-img">
          </div>
          <ul class="dos-ul">
            ${dosList.map(item => `<li><i data-lucide="check" class="check-icon"></i> <span>${item}</span></li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- DON'TS COLUMN (RED) -->
      <div class="donts-card">
        <div class="donts-header">
          <div class="donts-badge"><i data-lucide="x-circle"></i> DON'TS (क्या न करें)</div>
        </div>
        <div class="donts-body">
          <div class="visual-img-box">
            <img src="${dontImg}" alt="Don'ts Weather Guidelines" class="visual-advisory-img">
          </div>
          <ul class="donts-ul">
            ${dontsList.map(item => `<li><i data-lucide="x" class="cross-icon"></i> <span>${item}</span></li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  lucide.createIcons();
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
  if (!aqi) return;
  const valEl = document.getElementById('aqi-val');
  const labelEl = document.getElementById('aqi-label');
  const dotEl = document.getElementById('aqi-indicator-dot');

  const aqiVal = aqi.value ?? 85;
  const statusObj = (typeof aqi.status === 'object' && aqi.status !== null) ? aqi.status : { label: (aqi.status || 'Moderate'), color: '#f59e0b' };

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

  if (pm25El) pm25El.textContent = `${aqi.pm25 ?? 35} µg/m³`;
  if (pm10El) pm10El.textContent = `${aqi.pm10 ?? 65} µg/m³`;
  if (no2El) no2El.textContent = `${aqi.no2 ?? 20} ppb`;
  if (o3El) o3El.textContent = `${aqi.o3 ?? 28} ppb`;
}

// 24-Hour Temperature Chart Updater
function updateHourlyChart(hourly) {
  const ctx = document.getElementById('forecastChart').getContext('2d');
  const labels = hourly.map(h => h.time);
  const temps = hourly.map(h => h.temp);
  const pops = hourly.map(h => h.pop);

  if (forecastChart) forecastChart.destroy();

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
  // 1. India Temperature Anomaly Trend (2018-2026)
  const ctxTrend = document.getElementById('climateTrendChart').getContext('2d');
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

  // 2. Monsoon Rainfall Chart (% LPA)
  const ctxMonsoon = document.getElementById('monsoonRainChart').getContext('2d');
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

// Update Searched City Climate Profile Deep-Dive
function updateCityClimateProfile(city) {
  const profile = CITY_CLIMATE_PROFILES[city.name] || DEFAULT_CLIMATE_PROFILE;

  const titleEl = document.getElementById('climate-city-title');
  if (titleEl) titleEl.textContent = `${city.name}, ${city.state}`;

  document.getElementById('c-zone-type').textContent = profile.type;
  document.getElementById('c-annual-rain').textContent = profile.annualRainfall;
  document.getElementById('c-summer-max').textContent = profile.avgSummerMax;
  document.getElementById('c-vulnerability').textContent = profile.vulnerability;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const ctxMonthly = document.getElementById('cityMonthlyChart').getContext('2d');

  if (cityMonthlyChart) cityMonthlyChart.destroy();

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
          label: 'Avg Rainfall (mm)',
          data: profile.monthlyRain,
          backgroundColor: 'rgba(2, 132, 199, 0.7)',
          borderRadius: 4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { position: 'left', grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#d97706' } },
        y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#0284c7' } }
      }
    }
  });
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
  document.getElementById('alert-summary-text').textContent = `${alert.title} — ${alert.description}`;
}

function openAlertModal() {
  const alert = currentAlerts[0];
  if (!alert) return;

  document.getElementById('modal-alert-title').innerHTML = `<i data-lucide="alert-triangle"></i> ${alert.type}`;
  document.getElementById('modal-alert-desc').textContent = `${alert.title}: ${alert.description}`;
  
  const listEl = document.getElementById('modal-alert-list');
  listEl.innerHTML = alert.instructions.map(inst => `<li>${inst}</li>`).join('');

  document.getElementById('alert-modal').classList.add('active');
  lucide.createIcons();
}

function closeAlertModal() {
  document.getElementById('alert-modal').classList.remove('active');
}

// Optimized Instant Search Engine
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

  input.addEventListener('input', (e) => {
    updateSearchClearButton();
    const query = e.target.value.toLowerCase().trim();
    if (query.length < 1) {
      results.classList.remove('active');
      return;
    }

    // High priority: prefix match on city name, then state/region match
    const startsWithMatches = [];
    const includesMatches = [];

    for (let i = 0; i < searchIndex.length; i++) {
      const item = searchIndex[i];
      if (item.nameLower.startsWith(query)) {
        startsWithMatches.push(item.city);
      } else if (item.nameLower.includes(query) || item.stateLower.includes(query) || item.regionLower.includes(query)) {
        includesMatches.push(item.city);
      }
      if (startsWithMatches.length + includesMatches.length >= 10) break;
    }

    const matches = [...startsWithMatches, ...includesMatches].slice(0, 8);

    if (matches.length > 0) {
      results.innerHTML = matches.map(c => `
        <div class="result-item" onclick="selectCityFromSearch('${c.name}')">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="map-pin" style="width: 14px; height: 14px; color: var(--accent-cyan);"></i>
            <span class="city-name" style="font-weight: 600;">${c.name}</span>
          </div>
          <span class="state-tag" style="font-size: 0.75rem; color: var(--text-muted);">${c.state}</span>
        </div>
      `).join('');
      results.classList.add('active');
      lucide.createIcons();
    } else {
      results.classList.remove('active');
    }
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !results.contains(e.target)) {
      results.classList.remove('active');
    }
  });
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
  if (weatherSpeaker && currentWeatherData) {
    weatherSpeaker.toggle(currentWeatherData);
  }
}

function setSpeakerLanguage(lang) {
  if (weatherSpeaker) {
    weatherSpeaker.setLanguage(lang);
  }
}

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
      el.textContent = el.getAttribute('data-en');
    });
  } else {
    if (hiBtn) hiBtn.classList.add('active');
    if (enBtn) enBtn.classList.remove('active');

    document.querySelectorAll('.text-hi').forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('.text-en').forEach(el => el.classList.add('hidden'));

    document.querySelectorAll('[data-hi]').forEach(el => {
      el.textContent = el.getAttribute('data-hi');
    });
  }
}

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

