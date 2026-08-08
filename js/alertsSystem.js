class AlertsSystem {
  static getAlertsForLocation(cityData) {
    const alerts = [];
    const temp = cityData.temp;
    const humidity = cityData.humidity;
    const aqi = cityData.aqi ? cityData.aqi.value : 100;
    const precip = cityData.precipitation;
    const region = cityData.region;
    const cityName = cityData.city;

    // 1. IMD Heatwave Warning
    if (temp >= 38 || (region.includes("Desert") && temp >= 37)) {
      alerts.push({
        id: "heatwave",
        level: temp >= 42 ? "RED" : "ORANGE",
        type: "IMD Heatwave Advisory",
        title: `Thermal Stress Warning in ${cityName}`,
        description: `Temperatures recorded at ${temp}°C. Prolonged exposure causes heat exhaustion.`,
        instructions: [
          "Avoid direct sunlight between 11:00 AM and 04:00 PM.",
          "Drink frequent water, ORS, or natural buttermilk.",
          "Wear lightweight, light-colored cotton clothing."
        ],
        icon: "sun"
      });
    }

    // 2. Heavy Monsoon Downpour & Flood Advisory
    if (precip >= 10 || cityData.category === "storm" || (region.includes("Coastal") && humidity > 85)) {
      alerts.push({
        id: "monsoon_flood",
        level: precip >= 25 ? "RED" : "ORANGE",
        type: "IMD Torrential Rain & Squall Advisory",
        title: `Heavy Downpour Alert for ${cityName}`,
        description: `Active monsoonal cloud surge bringing intense rainfall and local waterlogging.`,
        instructions: [
          "Avoid waterlogged roads and low-lying underpasses.",
          "Fishermen advised to avoid venturing into open seas.",
          "Keep emergency flashlights and power banks charged."
        ],
        icon: "cloud-rain-wind"
      });
    }

    // 3. Air Quality (AQI) Warning
    if (aqi >= 180) {
      alerts.push({
        id: "severe_aqi",
        level: aqi >= 250 ? "RED" : "ORANGE",
        type: "Air Pollution Advisory",
        title: `Elevated Air Pollution (${aqi} AQI)`,
        description: `High PM2.5 / PM10 concentrations detected across ${cityName}.`,
        instructions: [
          "Wear N95/N99 masks when stepping outdoors.",
          "Avoid intense physical exercise or morning jogging outdoors.",
          "Use indoor air purifiers where available."
        ],
        icon: "wind"
      });
    }

    // Default Advisory if condition is normal
    if (alerts.length === 0) {
      alerts.push({
        id: "normal_advisory",
        level: "GREEN",
        type: "Regional Weather Advisory",
        title: `Favorable Weather Conditions in ${cityName}`,
        description: `Moderate temperatures (${temp}°C) and clear/partly cloudy sky. Ideal for outdoor activities.`,
        instructions: [
          "Carry a light umbrella for sudden afternoon sun or light drizzle.",
          "Maintain daily hydration."
        ],
        icon: "sun"
      });
    }

    return alerts;
  }
}
