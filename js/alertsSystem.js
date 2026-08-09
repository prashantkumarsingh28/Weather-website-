class AlertsSystem {
  static getAlertsForLocation(cityData) {
    const alerts = [];
    const temp = cityData.temp;
    const humidity = cityData.humidity;
    const aqi = cityData.aqi ? cityData.aqi.value : 100;
    const precip = cityData.precipitation;
    const region = cityData.region;
    const cityName = cityData.city;
    const category = cityData.category || "cloudy";

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
        dos: [
          "Drink plenty of water, coconut water, or ORS frequently.",
          "Wear lightweight, loose-fitting, light-colored cotton clothes.",
          "Use a wide-brim sun hat, UV sunglasses, or umbrella outdoors.",
          "Keep indoor rooms well-ventilated and cool."
        ],
        donts: [
          "Do NOT step out in direct sun during peak hours (12 PM - 4 PM).",
          "Do NOT leave children or pets inside parked vehicles.",
          "Avoid heavy physical exertion during hot afternoon hours.",
          "Avoid alcohol, tea, and carbonated soft drinks that dehydrate."
        ],
        doImage: "./images/do_sun.svg",
        dontImage: "./images/dont_sun.svg",
        icon: "sun"
      });
    }

    // 2. Heavy Monsoon Downpour & Flood Advisory
    if (precip >= 10 || category === "storm" || (region.includes("Coastal") && humidity > 85)) {
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
        dos: [
          "Carry a sturdy waterproof umbrella or raincoat when stepping out.",
          "Drive slowly with low-beam headlights on wet roads.",
          "Unplug electrical appliances during lightning or thunderstorms.",
          "Keep emergency phone numbers, flashlights, and power banks ready."
        ],
        donts: [
          "Do NOT touch electric poles, transformers, or fallen power lines.",
          "Do NOT drive or walk through flooded underpasses or waterlogged roads.",
          "Do NOT take shelter under tall trees during lightning or thunder.",
          "Avoid standing near swollen river banks or unstable slopes."
        ],
        doImage: "./images/do_rain.svg",
        dontImage: "./images/dont_rain.svg",
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
        dos: [
          "Wear an N95 or N99 mask when stepping outdoors.",
          "Use indoor air purifiers and keep windows closed during smog hours.",
          "Drink warm water and herbal tea to soothe respiratory airways."
        ],
        donts: [
          "Do NOT perform strenuous outdoor workouts during high AQI hours.",
          "Do NOT burn garbage, dry leaves, or wood outdoors.",
          "Avoid smoking or using unventilated indoor stoves."
        ],
        doImage: "./images/do_fog.svg",
        dontImage: "./images/dont_fog.svg",
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
        dos: [
          "Enjoy outdoor activities and outdoor walks in pleasant weather.",
          "Maintain healthy daily hydration and balanced nutrition.",
          "Keep a compact folding umbrella handy for sudden weather shifts."
        ],
        donts: [
          "Avoid littering in public parks or water bodies.",
          "Do NOT neglect hydration during prolonged outdoor trips."
        ],
        doImage: "./images/do_clear.svg",
        dontImage: "./images/dont_clear.svg",
        icon: "sun"
      });
    }

    return alerts;
  }
}
