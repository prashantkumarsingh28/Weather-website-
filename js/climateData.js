const OFFICIAL_CLIMATE_SOURCES = {
  primaryAgency: "India Meteorological Department (IMD)",
  researchCenter: "Centre for Climate Change Research (CCCR) - IITM Pune / MoES",
  globalDatabase: "WMO State of the Climate in Asia & Copernicus ERA5 Reanalysis",
  methodology: "30-Year Climatological Standard Normals (1991–2020) & Annual State of Climate Bulletins (1901–2025)"
};

const INDIA_CLIMATE_TRENDS = {
  years: ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026 (YTD)"],
  tempAnomaly: [0.38, 0.42, 0.29, 0.44, 0.51, 0.65, 0.72, 0.81, 0.84], // °C above baseline (IMD/MoES Data)
  monsoonRainfall: [91, 110, 109, 99, 106, 94, 108, 103, 102], // % of Long Period Average (LPA)
  extremeEvents: [112, 145, 132, 168, 204, 235, 260, 278, 285], // Annual severe weather events count
  sourceCitation: "IMD Climate Data Service Portal & MoES Annual Climate Reports"
};

const CITY_CLIMATE_PROFILES = {
  "New Delhi": {
    type: "Semi-Arid / Monsoonal Subtropical",
    annualRainfall: "790 mm",
    avgSummerMax: "41.5 °C",
    avgWinterMin: "6.8 °C",
    vulnerability: "High Heatwave & Winter Smog Hazard",
    monthlyTemps: [14, 18, 24, 30, 34, 34, 31, 30, 29, 26, 20, 15],
    monthlyRain: [18, 21, 15, 12, 28, 75, 210, 240, 125, 14, 5, 8],
    climateInsight: "Experiencing intensifying urban heat island effect during summer months and high AQI winter inversions."
  },
  "Mumbai": {
    type: "Tropical Wet and Dry",
    annualRainfall: "2,200 mm",
    avgSummerMax: "34.0 °C",
    avgWinterMin: "18.5 °C",
    vulnerability: "High Coastal Flooding & Extreme Downpour Hazard",
    monthlyTemps: [24, 24, 26, 28, 30, 29, 27, 27, 27, 28, 27, 25],
    monthlyRain: [1, 1, 1, 2, 12, 520, 840, 580, 340, 90, 10, 2],
    climateInsight: "Western Ghats monsoonal surge brings torrential 24-hour rainfall spikes leading to urban waterlogging."
  },
  "Bengaluru": {
    type: "Tropical Savanna / Deccan Plateau",
    annualRainfall: "970 mm",
    avgSummerMax: "34.5 °C",
    avgWinterMin: "15.2 °C",
    vulnerability: "Moderate Urban Heat & Seasonal Dry Spells",
    monthlyTemps: [21, 23, 26, 28, 27, 24, 23, 23, 23, 23, 22, 20],
    monthlyRain: [2, 7, 18, 45, 110, 80, 115, 140, 180, 170, 60, 15],
    climateInsight: "High elevation provides pleasant micro-climate, though rapid urbanization has increased convective summer thunder showers."
  },
  "Kolkata": {
    type: "Tropical Wet-and-Dry / Sundarbans Delta",
    annualRainfall: "1,800 mm",
    avgSummerMax: "36.8 °C",
    avgWinterMin: "13.5 °C",
    vulnerability: "Bay of Bengal Cyclonic Surge & Tidal Flooding",
    monthlyTemps: [20, 23, 28, 31, 31, 30, 29, 29, 29, 28, 24, 20],
    monthlyRain: [12, 22, 34, 52, 140, 300, 390, 340, 290, 140, 18, 6],
    climateInsight: "High humidity amplifies heat stress; highly sensitive to tropical cyclones originating in the Bay of Bengal."
  },
  "Chennai": {
    type: "Tropical Wet and Dry / Coromandel Coast",
    annualRainfall: "1,400 mm",
    avgSummerMax: "38.2 °C",
    avgWinterMin: "20.8 °C",
    vulnerability: "Northeast Monsoon Cyclones & Reservoir Water Stress",
    monthlyTemps: [25, 26, 28, 31, 33, 32, 30, 30, 29, 28, 26, 25],
    monthlyRain: [25, 12, 10, 15, 42, 55, 100, 140, 140, 320, 370, 180],
    climateInsight: "Receives peak annual precipitation during the October-December Northeast Monsoon, subject to coastal sea surges."
  },
  "Shimla": {
    type: "Subtropical Highland / Himalayan",
    annualRainfall: "1,480 mm",
    avgSummerMax: "24.0 °C",
    avgWinterMin: "-1.5 °C",
    vulnerability: "Himalayan Landslides & Decreasing Snow Cover Trend",
    monthlyTemps: [5, 6, 11, 15, 19, 20, 19, 18, 17, 14, 10, 7],
    monthlyRain: [60, 65, 60, 45, 60, 170, 420, 380, 150, 30, 15, 35],
    climateInsight: "Himalayan warming trends have led to delayed winter snowfall and increased localized cloudburst events."
  }
};

const DEFAULT_CLIMATE_PROFILE = {
  type: "Subtropical Monsoonal Climate",
  annualRainfall: "1,100 mm",
  avgSummerMax: "36.0 °C",
  avgWinterMin: "12.0 °C",
  vulnerability: "Seasonal Rainfall Anomaly & Thermal Variations",
  monthlyTemps: [18, 21, 26, 30, 32, 31, 29, 28, 28, 26, 22, 18],
  monthlyRain: [15, 20, 20, 25, 50, 180, 310, 280, 160, 40, 10, 10],
  climateInsight: "Regulated by South-West and North-East monsoonal wind patterns across the Indian subcontinent."
};
