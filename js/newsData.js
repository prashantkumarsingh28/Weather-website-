const WEATHER_NEWS = [
  {
    id: 1,
    city: "Mumbai",
    state: "Maharashtra",
    category: "FLOOD WATCH",
    tagColor: "#ef4444",
    title: "Monsoon Downpour Triggers Waterlogging Alert in Suburbs & Coastal Areas",
    date: "August 9, 2026",
    summary: "IMD regional center has issued an alert for Mumbai and coastal Konkan as persistent rain sweeps across the region. Emergency disaster response teams are stationed along coastal sectors.",
    source: "India Meteorological Department (IMD)",
    icon: "cloud-rain-wind"
  },
  {
    id: 2,
    city: "New Delhi",
    state: "Delhi NCR",
    category: "AIR QUALITY & HEAT",
    tagColor: "#f59e0b",
    title: "High Humidity & Moderate Air Quality Index Reported Across Delhi NCR",
    date: "August 9, 2026",
    summary: "Partly cloudy skies with high humidity levels prevailing over Delhi NCR. Air Quality Index recorded at Moderate levels. Residents advised to stay hydrated during afternoon hours.",
    source: "Central Pollution Control Board (CPCB)",
    icon: "sun"
  },
  {
    id: 3,
    city: "Guwahati",
    state: "Assam",
    category: "MONSOON FLOOD",
    tagColor: "#dc2626",
    title: "Brahmaputra Basin Monitored as Heavy Upstream Precipitation Continues",
    date: "August 8, 2026",
    summary: "Disaster management authorities issue advisories for low-lying districts in Assam as river levels stay elevated. River embankments remain under active 24x7 surveillance.",
    source: "Assam State Disaster Management Authority",
    icon: "droplet"
  },
  {
    id: 4,
    city: "Jaisalmer",
    state: "Rajasthan",
    category: "DROUGHT & TEMP",
    tagColor: "#d97706",
    title: "Thar Desert Region Monitors Monsoon Spells & Crop Irrigation Requirements",
    date: "August 8, 2026",
    summary: "Elevated afternoon temperatures recorded across western Rajasthan with scattered cloud cover. Agricultural departments issue water conservation protocols for farming sectors.",
    source: "Rajasthan Agricultural Weather Desk",
    icon: "flame"
  },
  {
    id: 5,
    city: "Shimla",
    state: "Himachal Pradesh",
    category: "HILL SLOPES ALERT",
    tagColor: "#0284c7",
    title: "Himalayan Slopes Advisory Issued for Travelers Following Mountain Showers",
    date: "August 9, 2026",
    summary: "Himachal Pradesh Disaster Management Authority clears national highway corridors following localized showers. Highway patrols recommend caution along high-altitude mountain passes.",
    source: "HP Disaster Management Bureau",
    icon: "mountain"
  },
  {
    id: 6,
    city: "Chennai",
    state: "Tamil Nadu",
    category: "COASTAL SURGE",
    tagColor: "#2563eb",
    title: "Coromandel Coastal Sector Experiences High Tidal Swells & Offshore Winds",
    date: "August 8, 2026",
    summary: "Fishermen along the Bay of Bengal advisory zone are advised to check sea state reports as coastal wind gusts reach 40 km/h. Coastal radar systems are actively tracking monsoon pulses.",
    source: "INCOIS Coastal Hazard Warning Centre",
    icon: "waves"
  }
];

// DYNAMIC CITY-SPECIFIC NEWS GENERATOR FOR SEARCHED CITIES
function getCityWeatherNews(cityName, stateName, condition = "Partly Cloudy") {
  const currentDateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Check if exact city already has curated news
  const curated = WEATHER_NEWS.filter(n => n.city.toLowerCase() === cityName.toLowerCase());
  if (curated.length >= 2) {
    return curated;
  }

  // Publishers pool
  const publishers = [
    "India Meteorological Department (IMD)",
    "Press Trust of India (PTI Weather Bureau)",
    "Central Pollution Control Board (CPCB)",
    "Regional Climate Intelligence Network",
    "Times Weather & Environment Bureau",
    "National Disaster Management Authority (NDMA)"
  ];

  const p1 = publishers[Math.abs(cityName.length * 3) % publishers.length];
  const p2 = publishers[Math.abs(cityName.length * 7 + 1) % publishers.length];

  const condLower = (condition || "").toLowerCase();
  let category1 = "LOCAL WEATHER BULLETIN";
  let tagColor1 = "#0284c7";
  let title1 = `${cityName} Weather Update: ${condition} Conditions Active Across Sector`;
  let summary1 = `Official meteorological observations in ${cityName}, ${stateName} record ${condition.toLowerCase()} atmospheric conditions. Citizens are advised to plan outdoor activities according to hourly weather forecasts.`;

  if (condLower.includes('rain') || condLower.includes('drizzle') || condLower.includes('shower')) {
    category1 = "MONSOON RAIN ADVISORY";
    tagColor1 = "#2563eb";
    title1 = `Rainfall Reported in ${cityName}: Drainage & Traffic Monitoring Active`;
    summary1 = `Monsoonal rain showers sweep through ${cityName} and surrounding areas. Civic authorities advise drivers to exercise caution on wet roads during commuting hours.`;
  } else if (condLower.includes('thunder') || condLower.includes('storm') || condLower.includes('lightning')) {
    category1 = "SEVERE WEATHER ALERT";
    tagColor1 = "#dc2626";
    title1 = `Thunderstorm Watch Issued for ${cityName} & Nearby Districts`;
    summary1 = `Squally winds and thunder activity reported near ${cityName}. Disaster management teams recommend staying indoors and unplugging sensitive electronics.`;
  } else if (condLower.includes('sun') || condLower.includes('clear')) {
    category1 = "HEAT & UV WATCH";
    tagColor1 = "#f59e0b";
    title1 = `Clear Sunny Skies Prevail Over ${cityName}: Peak UV Index Alert`;
    summary1 = `High daytime radiation and clear skies recorded over ${cityName}. Health advisories urge residents to wear protective sunwear and stay hydrated during midday hours.`;
  }

  const category2 = "ENVIRONMENT & AQI UPDATE";
  const tagColor2 = "#059669";
  const title2 = `Air Quality & Seasonal Trends Observed Across ${cityName}, ${stateName}`;
  const summary2 = `Environmental monitoring stations in ${cityName} record steady air quality parameters. Atmospheric pressure and humidity indicators remain within expected seasonal ranges.`;

  const generatedNews = [
    {
      id: `gen-1-${cityName}`,
      city: cityName,
      state: stateName,
      category: category1,
      tagColor: tagColor1,
      title: title1,
      date: currentDateStr,
      summary: summary1,
      source: p1,
      icon: "cloud-sun"
    },
    {
      id: `gen-2-${cityName}`,
      city: cityName,
      state: stateName,
      category: category2,
      tagColor: tagColor2,
      title: title2,
      date: currentDateStr,
      summary: summary2,
      source: p2,
      icon: "activity"
    }
  ];

  // Mix curated items if available or append standard national highlight
  return [...curated, ...generatedNews].slice(0, 3);
}

