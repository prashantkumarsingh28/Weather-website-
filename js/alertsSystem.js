class AlertsSystem {
  static getAlertsForLocation(cityData) {
    const alerts = [];
    const temp = cityData.temp;
    const humidity = cityData.humidity;
    const aqi = cityData.aqi ? (cityData.aqi.value || cityData.aqi) : 100;
    const precip = cityData.precipitation || 0;
    const region = cityData.region || "";
    const cityName = cityData.city;
    const category = cityData.category || "cloudy";
    const windSpeed = cityData.windSpeed || 10;

    // 1. IMD Heatwave & High Thermal Stress Warning
    if (temp >= 38 || (region.includes("Desert") && temp >= 37)) {
      alerts.push({
        id: "heatwave",
        level: temp >= 42 ? "RED" : "ORANGE",
        type: "IMD Extreme Heatwave Advisory",
        title: `High Thermal Stress Warning in ${cityName}`,
        description: `Temperatures recorded at <strong>${temp}°C</strong>. Prolonged outdoor exposure increases risk of sunstroke and heat exhaustion.`,
        instructions: [
          "<strong class=\"bold-important\">Avoid direct sunlight</strong> between <strong>11:00 AM and 04:00 PM</strong>.",
          "<strong class=\"bold-important\">Drink at least 3-4 liters of water</strong>, coconut water, or ORS throughout the day.",
          "<strong class=\"bold-important\">Wear lightweight, light-colored, loose cotton clothing</strong> and UV-protective sunglasses."
        ],
        dos: [
          "<strong class=\"bold-important\">Drink water frequently</strong>, even if you do not feel thirsty.",
          "<strong class=\"bold-important\">Use wide-brim sun hats, UV sunglasses, and SPF 30+ sunscreen</strong> outdoors.",
          "<strong class=\"bold-important\">Keep indoor living spaces ventilated</strong> and use damp towels or fans.",
          "<strong class=\"bold-important\">Check on senior citizens and children</strong> for signs of dehydration."
        ],
        donts: [
          "<strong class=\"bold-important\">Do NOT step out in peak afternoon heat (12 PM - 4 PM)</strong> unshielded.",
          "<strong class=\"bold-important\">NEVER leave children or pets locked inside parked vehicles</strong>.",
          "<strong class=\"bold-important\">Avoid heavy physical workouts outdoors</strong> during hot afternoon hours.",
          "<strong class=\"bold-important\">Avoid caffeinated drinks, alcohol, or sugary soda</strong> that accelerate dehydration."
        ],
        doImage: "./images/do_sun.svg",
        dontImage: "./images/dont_sun.svg",
        icon: "sun"
      });
    }

    // 2. Heavy Monsoon Downpour & Flood Advisory
    if (precip >= 8 || category === "rainy" || (region.includes("Coastal") && humidity > 82 && precip > 2)) {
      alerts.push({
        id: "monsoon_flood",
        level: precip >= 25 ? "RED" : "ORANGE",
        type: "IMD Torrential Rain & Flood Advisory",
        title: `Heavy Downpour Alert for ${cityName}`,
        description: `Active monsoonal cloud surge bringing <strong>${precip} mm</strong> rainfall and local urban waterlogging.`,
        instructions: [
          "<strong class=\"bold-important\">Avoid flooded roads, low-lying underpasses, and open drains</strong>.",
          "<strong class=\"bold-important\">Fishermen advised to avoid venturing into open seas</strong> or rivers during high tide.",
          "<strong class=\"bold-important\">Keep emergency flashlights, power banks, and essential medicine fully charged and ready</strong>."
        ],
        dos: [
          "<strong class=\"bold-important\">Carry a sturdy waterproof umbrella or raincoat</strong> whenever stepping out.",
          "<strong class=\"bold-important\">Drive with low-beam headlights ON</strong> and maintain double braking distance.",
          "<strong class=\"bold-important\">Unplug sensitive electrical devices</strong> during severe rainstorms.",
          "<strong class=\"bold-important\">Keep emergency helpline numbers saved</strong> on your mobile device."
        ],
        donts: [
          "<strong class=\"bold-important\">Do NOT touch electric poles, sub-stations, or fallen wires</strong> in standing water.",
          "<strong class=\"bold-important\">Do NOT attempt to drive vehicles through submerged underpasses</strong>.",
          "<strong class=\"bold-important\">Do NOT seek shelter under weak structures or unstable trees</strong>.",
          "<strong class=\"bold-important\">Avoid standing close to swollen riverbanks or landslide-prone slopes</strong>."
        ],
        doImage: "./images/do_rain.svg",
        dontImage: "./images/dont_rain.svg",
        icon: "cloud-rain-wind"
      });
    }

    // 3. Severe Thunderstorm & Lightning Warning
    if (category === "storm") {
      alerts.push({
        id: "thunderstorm_lightning",
        level: "RED",
        type: "IMD Severe Thunderstorm & Lightning Watch",
        title: `Squall & Lightning Hazard in ${cityName}`,
        description: `Severe convective storm cells active with violent squally winds and atmospheric lightning discharges.`,
        instructions: [
          "<strong class=\"bold-important\">Stay inside sturdy concrete buildings</strong> and close all doors and windows.",
          "<strong class=\"bold-important\">Avoid using corded electrical devices or plumbing fixtures</strong> during lightning strikes.",
          "<strong class=\"bold-important\">Wait at least 30 minutes after the last thunder roar</strong> before stepping outside."
        ],
        dos: [
          "<strong class=\"bold-important\">Seek immediate indoor shelter</strong> inside a solid home or metal vehicle.",
          "<strong class=\"bold-important\">Disconnect non-essential power outlets and Wi-Fi routers</strong>.",
          "<strong class=\"bold-important\">Crouch down low with feet together</strong> if caught out in an open field."
        ],
        donts: [
          "<strong class=\"bold-important\">Do NOT take shelter under tall isolated trees</strong> or metal towers.",
          "<strong class=\"bold-important\">Do NOT stand near metal fences, wire gates, or flagpoles</strong>.",
          "<strong class=\"bold-important\">Avoid open bodies of water</strong>, lakes, or outdoor swimming pools during lightning."
        ],
        doImage: "./images/do_rain.svg",
        dontImage: "./images/dont_rain.svg",
        icon: "zap"
      });
    }

    // 4. Dense Fog & High Air Quality (AQI) Smog Warning
    if (category === "fog" || aqi >= 180) {
      alerts.push({
        id: "severe_fog_aqi",
        level: (aqi >= 250 || category === "fog") ? "RED" : "ORANGE",
        type: "IMD Dense Fog & Air Quality Safety Watch",
        title: `Low Visibility & Smog Advisory in ${cityName}`,
        description: `High PM2.5 concentrations (<strong>${aqi} AQI</strong>) combined with dense morning fog reducing highway visibility.`,
        instructions: [
          "<strong class=\"bold-important\">Wear N95 / FFP2 filter masks outdoors</strong> to protect respiratory airways.",
          "<strong class=\"bold-important\">Use vehicle fog lamps and low-beam headlights</strong> during early morning travel.",
          "<strong class=\"bold-important\">Avoid intense morning outdoor jogging or heavy cardio exercises</strong> in high smog."
        ],
        dos: [
          "<strong class=\"bold-important\">Wear a high-efficiency N95 mask</strong> when commuting outside.",
          "<strong class=\"bold-important\">Maintain slow speeds and large vehicle safety gaps</strong> on highways.",
          "<strong class=\"bold-important\">Use indoor HEPA air purifiers</strong> and keep windows closed during smog hours.",
          "<strong class=\"bold-important\">Sip warm herbal liquids and water</strong> to clear throat irritants."
        ],
        donts: [
          "<strong class=\"bold-important\">Do NOT use high-beam headlights in fog</strong> as light reflects back into your eyes.",
          "<strong class=\"bold-important\">Do NOT burn dry leaves, garbage, or wood outdoors</strong>.",
          "<strong class=\"bold-important\">Avoid high-intensity outdoor workouts</strong> during peak smog hours.",
          "<strong class=\"bold-important\">Do NOT overtake blindly</strong> on low-visibility single-lane roads."
        ],
        doImage: "./images/do_fog.svg",
        dontImage: "./images/dont_fog.svg",
        icon: "cloud-fog"
      });
    }

    // 5. Cold Wave & Alpine Chill Advisory
    if (temp <= 14 || (region.includes("Himalayas") && temp <= 10)) {
      alerts.push({
        id: "cold_wave",
        level: temp <= 5 ? "RED" : "ORANGE",
        type: "IMD Severe Cold Wave & Frost Advisory",
        title: `Cold Wave Alert for ${cityName}`,
        description: `Freezing Himalayan winds dropping local temperature to <strong>${temp}°C</strong> with severe wind chill.`,
        instructions: [
          "<strong class=\"bold-important\">Dress in multiple light thermal layers</strong> rather than a single heavy coat.",
          "<strong class=\"bold-important\">Cover head, ears, neck, hands, and feet</strong> to prevent frostnip and hypothermia.",
          "<strong class=\"bold-important\">Consume warm soups, hot tea, and nutrient-dense foods</strong> to generate body heat."
        ],
        dos: [
          "<strong class=\"bold-important\">Wear woolen hats, thermal gloves, and insulated socks</strong> outdoors.",
          "<strong class=\"bold-important\">Keep indoor room heaters safely ventilated</strong> to avoid carbon monoxide hazard.",
          "<strong class=\"bold-important\">Ensure elderly members and infants stay warm indoors</strong>."
        ],
        donts: [
          "<strong class=\"bold-important\">Do NOT stay outdoors in damp or wet clothing</strong> during freezing temperatures.",
          "<strong class=\"bold-important\">Avoid unventilated coal burning indoors</strong> overnight.",
          "<strong class=\"bold-important\">Do NOT ignore symptoms of shivering or numbness</strong> in fingers and toes."
        ],
        doImage: "./images/do_fog.svg",
        dontImage: "./images/dont_fog.svg",
        icon: "snowflake"
      });
    }

    // 6. High Wind & Gale Squall Watch
    if (windSpeed >= 28) {
      alerts.push({
        id: "high_wind",
        level: "ORANGE",
        type: "Squally Wind Advisory",
        title: `High Wind Gusts (${windSpeed} km/h) in ${cityName}`,
        description: `Strong surface wind squalls reported. Loose outdoor objects and hoardings pose overhead hazards.`,
        instructions: [
          "<strong class=\"bold-important\">Secure loose balcony flowerpots, outdoor furniture, and roof items</strong>.",
          "<strong class=\"bold-important\">Drive cautiously</strong> especially when passing high-profile trucks or bridges.",
          "<strong class=\"bold-important\">Stay away from large glass billboards and old trees</strong>."
        ],
        dos: [
          "<strong class=\"bold-important\">Keep windows and exterior balcony doors tightly shut</strong>.",
          "<strong class=\"bold-important\">Park motor vehicles away from trees, overhead wires, and signboards</strong>."
        ],
        donts: [
          "<strong class=\"bold-important\">Do NOT park under old or decaying trees</strong>.",
          "<strong class=\"bold-important\">Do NOT attempt roofing or balcony maintenance</strong> during gale gusts."
        ],
        doImage: "./images/do_rain.svg",
        dontImage: "./images/dont_rain.svg",
        icon: "wind"
      });
    }

    // Default Advisory if condition is pleasant/normal
    if (alerts.length === 0) {
      alerts.push({
        id: "normal_advisory",
        level: "GREEN",
        type: "Regional Weather Advisory",
        title: `Pleasant & Favorable Weather in ${cityName}`,
        description: `Moderate temperature (<strong>${temp}°C</strong>) with clear to partly cloudy skies. Excellent conditions for outdoor routines.`,
        instructions: [
          "<strong class=\"bold-important\">Enjoy outdoor walks and exercise</strong> during morning and evening hours.",
          "<strong class=\"bold-important\">Maintain regular daily hydration</strong> (2.5+ liters of water).",
          "<strong class=\"bold-important\">Keep a lightweight umbrella handy</strong> for sudden sun or light breezes."
        ],
        dos: [
          "<strong class=\"bold-important\">Take advantage of pleasant weather for outdoor sports and travel</strong>.",
          "<strong class=\"bold-important\">Stay comfortably hydrated throughout the day</strong>.",
          "<strong class=\"bold-important\">Wear UV sunglasses and light breathable outfits</strong>."
        ],
        donts: [
          "<strong class=\"bold-important\">Do NOT litter in municipal parks, rivers, or public places</strong>.",
          "<strong class=\"bold-important\">Do NOT neglect sun protection during extended outdoor stay</strong>."
        ],
        doImage: "./images/do_clear.svg",
        dontImage: "./images/dont_clear.svg",
        icon: "sun"
      });
    }

    return alerts;
  }
}
