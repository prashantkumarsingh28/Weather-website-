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

  // Populate Cities List & News Feed
  renderCitiesList(INDIAN_CITIES);
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

  // Default to Introduction view on page load
  switchNavTab('intro');

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

  // Control top nav speaker button visibility (ONLY visible on Weather tab)
  const navSpeakerBtn = document.getElementById('speaker-nav-btn');
  if (navSpeakerBtn) {
    navSpeakerBtn.style.display = (tabName === 'weather') ? 'flex' : 'none';
  }

  // Stop active speech if user leaves weather tab
  if (tabName !== 'weather' && weatherSpeaker) {
    weatherSpeaker.stop();
  }

  if (tabName === 'climate') {
    updateCityClimateProfile(currentCity);
  }
}

// Render Side List of Cities
function renderCitiesList(cities) {
  const container = document.getElementById('cities-list');
  if (!container) return;

  container.innerHTML = cities.map(city => `
    <div class="city-row ${city.name === currentCity.name ? 'active' : ''}" onclick="selectCityByName('${city.name}')">
      <div class="city-info">
        <h4>${city.name}</h4>
        <p>${city.state}</p>
      </div>
      <div class="city-temp-tag" id="city-temp-${city.name.replace(/[^a-zA-Z0-9]/g, '')}">--°C</div>
    </div>
  `).join('');
}

function selectCityByName(cityName) {
  const city = INDIAN_CITIES.find(c => c.name === cityName);
  if (city) selectCity(city);
}

// Main City Selection Routine
async function selectCity(city) {
  currentCity = city;

  // Persist selected city to cookies & local storage
  setCookie('last_searched_city', city.name, 365);

  // Highlight active city
  document.querySelectorAll('.city-row').forEach(row => row.classList.remove('active'));
  document.querySelectorAll('.city-row').forEach(row => {
    if (row.querySelector('h4') && row.querySelector('h4').textContent === city.name) {
      row.classList.add('active');
    }
  });

  // Fetch live weather data
  const data = await WeatherAPI.fetchCityWeather(city);

  // Update Dashboard Widgets
  updateHeroDashboard(data);
  updateHourlyCards(data.hourly);
  updateAQIWidget(data.aqi);
  updateHourlyChart(data.hourly);
  update7DayForecast(data.daily, data.city);
  renderWeatherNewsFeed(data);

  // Update 3D Sky Visuals & Procedural Audio
  scene3D.setWeatherCategory(data.category);
  if (audioEngine) audioEngine.setSoundType(data.category);

  // Update Advisory & Precautions
  currentAlerts = AlertsSystem.getAlertsForLocation(data);
  updateAdvisoryPrecautions(currentAlerts[0]);
  updateAlertsBanner(currentAlerts[0]);

  // Update Sidebar Temp Tag
  const tagId = `city-temp-${city.name.replace(/[^a-zA-Z0-9]/g, '')}`;
  const tagEl = document.getElementById(tagId);
  if (tagEl) tagEl.textContent = `${data.temp}°C`;

  // Update Weather Voice Speaker Widget Data
  currentWeatherData = data;
  if (weatherSpeaker) {
    weatherSpeaker.updateWidgetData(data);
  }

  // Update Climate Tab if active
  updateCityClimateProfile(city);
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
  document.getElementById('current-city-name').textContent = data.city;
  document.getElementById('current-state-name').textContent = `${data.state} • India`;
  document.getElementById('current-temp').textContent = `${data.temp}°C`;
  document.getElementById('current-condition').textContent = data.condition;
  document.getElementById('feels-like-temp').textContent = `${data.feelsLike}°C`;

  document.getElementById('stat-humidity').textContent = `${data.humidity}%`;
  document.getElementById('stat-wind').textContent = `${data.windSpeed} km/h`;
  document.getElementById('stat-pressure').textContent = `${data.pressure} hPa`;

  const lastUpdatedEl = document.getElementById('last-updated-text');
  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = data.lastUpdated || new Date().toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
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
  if (!aqi) return;
  const valEl = document.getElementById('aqi-val');
  const labelEl = document.getElementById('aqi-label');
  const dotEl = document.getElementById('aqi-indicator-dot');

  valEl.textContent = aqi.value;
  labelEl.textContent = aqi.status.label;
  labelEl.style.color = aqi.status.color;

  const percentage = Math.min(100, Math.max(0, (aqi.value / 400) * 100));
  dotEl.style.left = `${percentage}%`;

  document.getElementById('aqi-pm25').textContent = `${aqi.pm25} µg/m³`;
  document.getElementById('aqi-pm10').textContent = `${aqi.pm10} µg/m³`;
  document.getElementById('aqi-no2').textContent = `${aqi.no2} ppb`;
  document.getElementById('aqi-o3').textContent = `${aqi.o3} ppb`;
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

// Search Engine
function setupSearchEngine() {
  const input = document.getElementById('city-search-input');
  const results = document.getElementById('search-results');

  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query.length < 1) {
      results.classList.remove('active');
      return;
    }

    const matches = INDIAN_CITIES.filter(c => 
      c.name.toLowerCase().includes(query) || c.state.toLowerCase().includes(query) || c.region.toLowerCase().includes(query)
    ).slice(0, 10);

    if (matches.length > 0) {
      results.innerHTML = matches.map(c => `
        <div class="result-item" onclick="selectCityFromSearch('${c.name}')">
          <span class="city-name" style="font-weight: 600;">${c.name}</span>
          <span class="state-tag" style="font-size: 0.75rem; color: var(--text-muted);">${c.state}</span>
        </div>
      `).join('');
      results.classList.add('active');
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
  document.getElementById('city-search-input').value = '';
  document.getElementById('search-results').classList.remove('active');
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

