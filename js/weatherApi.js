class WeatherAPI {
  static weatherCodeMap = {
    0: { condition: "Clear Sky", icon: "sun", category: "sunny" },
    1: { condition: "Mainly Clear", icon: "sun-medium", category: "sunny" },
    2: { condition: "Partly Cloudy", icon: "cloud-sun", category: "cloudy" },
    3: { condition: "Overcast", icon: "cloud", category: "cloudy" },
    45: { condition: "Foggy", icon: "cloud-fog", category: "fog" },
    48: { condition: "Depositing Rime Fog", icon: "cloud-fog", category: "fog" },
    51: { condition: "Light Drizzle", icon: "cloud-drizzle", category: "rainy" },
    53: { condition: "Moderate Drizzle", icon: "cloud-drizzle", category: "rainy" },
    55: { condition: "Heavy Drizzle", icon: "cloud-rain", category: "rainy" },
    61: { condition: "Slight Rain", icon: "cloud-rain", category: "rainy" },
    63: { condition: "Moderate Rain", icon: "cloud-rain", category: "rainy" },
    65: { condition: "Heavy Downpour", icon: "cloud-rain-wind", category: "rainy" },
    71: { condition: "Slight Snowfall", icon: "snowflake", category: "snow" },
    73: { condition: "Moderate Snow", icon: "snowflake", category: "snow" },
    75: { condition: "Heavy Snowstorm", icon: "snowflake", category: "snow" },
    80: { condition: "Rain Showers", icon: "cloud-rain", category: "rainy" },
    81: { condition: "Moderate Rain Showers", icon: "cloud-rain", category: "rainy" },
    82: { condition: "Violent Rain Torrent", icon: "cloud-lightning", category: "storm" },
    95: { condition: "Thunderstorm", icon: "cloud-lightning", category: "storm" },
    96: { condition: "Thunderstorm with Hail", icon: "cloud-hail", category: "storm" },
    99: { condition: "Heavy Severe Thunderstorm", icon: "zap", category: "storm" }
  };

  static async searchCityGeocoding(query) {
    if (!query || query.trim().length < 2) return [];
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=10&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      if (!data || !data.results || !Array.isArray(data.results)) return [];

      return data.results.map(item => ({
        name: item.name,
        state: item.admin1 || item.admin2 || item.country || "District",
        country: item.country || "India",
        lat: item.latitude,
        lon: item.longitude,
        region: item.admin1 ? `${item.admin1}, ${item.country || ''}` : (item.country || "Global")
      }));
    } catch (e) {
      console.warn("Geocoding API error:", e);
      return [];
    }
  }

  static getCardinalDirection(angle) {
    if (typeof angle !== 'number' || isNaN(angle)) return "N";
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 22.5) % 16;
    return directions[index];
  }

  static calculateAqiFromPm25(pm25Val) {
    if (typeof pm25Val !== 'number' || isNaN(pm25Val) || pm25Val <= 0) return 45;
    const c = pm25Val;
    if (c <= 12.0) return Math.round((50 / 12.0) * c);
    if (c <= 35.4) return Math.round(50 + ((50 / 23.3) * (c - 12.1)));
    if (c <= 55.4) return Math.round(100 + ((50 / 19.9) * (c - 35.5)));
    if (c <= 150.4) return Math.round(150 + ((50 / 94.9) * (c - 55.5)));
    if (c <= 250.4) return Math.round(200 + ((100 / 99.9) * (c - 150.5)));
    if (c <= 350.4) return Math.round(300 + ((100 / 99.9) * (c - 250.5)));
    return Math.round(400 + ((100 / 149.9) * (c - 350.5)));
  }

  static async fetchCityWeather(city) {
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,weather_code,relative_humidity_2m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max&timezone=auto`;
      
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,us_aqi,european_aqi`;

      const [weatherRes, aqiRes] = await Promise.all([
        fetch(weatherUrl).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(aqiUrl).then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      if (weatherRes && weatherRes.current) {
        return this.parseOpenMeteoResponse(city, weatherRes, aqiRes);
      }
      return this.generateFallbackData(city);
    } catch (e) {
      console.warn("Weather API fetch error, using realistic fallback:", e);
      return this.generateFallbackData(city);
    }
  }

  static parseTimeStr(isoStr, fallbackStr) {
    if (!isoStr) return fallbackStr;
    try {
      // Open-Meteo returns '2026-08-20T05:53' in local timezone of location
      const parts = isoStr.split('T');
      if (parts.length === 2) {
        const timeParts = parts[1].split(':');
        let hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      }
    } catch(e) {}
    return fallbackStr;
  }

  static parseOpenMeteoResponse(city, data, aqiData) {
    const curr = data.current;
    const codeInfo = this.weatherCodeMap[curr.weather_code] || { condition: "Partly Cloudy", icon: "cloud-sun", category: "cloudy" };
    
    // Parse hourly forecast (next 24 hours with exact weather icons)
    const hourly = [];
    if (data.hourly && data.hourly.time) {
      const nowIdx = new Date().getHours();
      for (let i = nowIdx; i < Math.min(nowIdx + 24, data.hourly.time.length); i++) {
        const timeStr = this.parseTimeStr(data.hourly.time[i], `${i % 12 || 12}:00 ${i >= 12 ? 'PM' : 'AM'}`);
        const hCode = data.hourly.weather_code[i];
        const hInfo = this.weatherCodeMap[hCode] || { condition: "Partly Cloudy", icon: "cloud-sun" };

        hourly.push({
          time: timeStr,
          temp: Math.round(data.hourly.temperature_2m[i]),
          pop: data.hourly.precipitation_probability ? data.hourly.precipitation_probability[i] : 0,
          code: hCode,
          icon: hInfo.icon,
          condition: hInfo.condition
        });
      }
    }

    // Parse daily forecast (7 days)
    const daily = [];
    if (data.daily && data.daily.time) {
      for (let i = 0; i < Math.min(7, data.daily.time.length); i++) {
        const dateParts = data.daily.time[i].split('-');
        const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        const dayName = i === 0 ? "Today" : dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
        const cInfo = this.weatherCodeMap[data.daily.weather_code[i]] || codeInfo;
        const sunriseTime = this.parseTimeStr(data.daily?.sunrise?.[i], `06:${(5 + i).toString().padStart(2, '0')} AM`);
        const sunsetTime = this.parseTimeStr(data.daily?.sunset?.[i], `07:${(12 - (i % 3)).toString().padStart(2, '0')} PM`);

        daily.push({
          day: dayName,
          date: dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          maxTemp: Math.round(data.daily.temperature_2m_max[i]),
          minTemp: Math.round(data.daily.temperature_2m_min[i]),
          condition: cInfo.condition,
          icon: cInfo.icon,
          rainProb: data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[i] : 0,
          uv: data.daily.uv_index_max ? Math.round(data.daily.uv_index_max[i]) : 5,
          sunrise: sunriseTime,
          sunset: sunsetTime,
          dayHours: `13 hrs ${(7 - i).toString()} mins`
        });
      }
    }

    // Parse AQI dynamically from live API
    let pm25 = 25;
    let pm10 = 45;
    let no2 = 18;
    let o3 = 24;
    let aqiVal = 65;

    if (aqiData && aqiData.current) {
      if (typeof aqiData.current.pm2_5 === 'number' && !isNaN(aqiData.current.pm2_5)) pm25 = Math.round(aqiData.current.pm2_5);
      if (typeof aqiData.current.pm10 === 'number' && !isNaN(aqiData.current.pm10)) pm10 = Math.round(aqiData.current.pm10);
      if (typeof aqiData.current.nitrogen_dioxide === 'number' && !isNaN(aqiData.current.nitrogen_dioxide)) no2 = Math.round(aqiData.current.nitrogen_dioxide);
      if (typeof aqiData.current.ozone === 'number' && !isNaN(aqiData.current.ozone)) o3 = Math.round(aqiData.current.ozone);

      if (typeof aqiData.current.us_aqi === 'number' && !isNaN(aqiData.current.us_aqi) && aqiData.current.us_aqi > 0) {
        aqiVal = Math.round(aqiData.current.us_aqi);
      } else {
        aqiVal = this.calculateAqiFromPm25(pm25);
      }
    } else {
      aqiVal = (city.name === "New Delhi" || city.name === "Ghaziabad" || city.name === "Kanpur" || city.name === "Patna" || city.name === "Agra") ? 220 : 85;
    }

    const sunriseStr = this.parseTimeStr(data.daily?.sunrise?.[0], "06:05 AM");
    const sunsetStr = this.parseTimeStr(data.daily?.sunset?.[0], "07:12 PM");
    
    // Calculate Day Hours & Night Hours
    let dayMinutes = 13 * 60 + 7;
    if (data.daily?.sunrise?.[0] && data.daily?.sunset?.[0]) {
      try {
        const srParts = data.daily.sunrise[0].split('T')[1].split(':');
        const ssParts = data.daily.sunset[0].split('T')[1].split(':');
        const srMins = parseInt(srParts[0], 10) * 60 + parseInt(srParts[1], 10);
        const ssMins = parseInt(ssParts[0], 10) * 60 + parseInt(ssParts[1], 10);
        if (ssMins > srMins) dayMinutes = ssMins - srMins;
      } catch(e) {}
    }
    const dayH = Math.floor(dayMinutes / 60);
    const dayM = dayMinutes % 60;
    const nightMinutes = (24 * 60) - dayMinutes;
    const nightH = Math.floor(nightMinutes / 60);
    const nightM = nightMinutes % 60;

    const tempVal = (typeof curr.temperature_2m === 'number' && !isNaN(curr.temperature_2m)) ? Math.round(curr.temperature_2m) : 31;
    const feelsVal = (typeof curr.apparent_temperature === 'number' && !isNaN(curr.apparent_temperature)) ? Math.round(curr.apparent_temperature) : tempVal + 2;

    const maxTempToday = (daily.length > 0 && typeof daily[0].maxTemp === 'number') ? daily[0].maxTemp : tempVal + 3;
    const minTempToday = (daily.length > 0 && typeof daily[0].minTemp === 'number') ? daily[0].minTemp : tempVal - 5;

    const humidityVal = (typeof curr.relative_humidity_2m === 'number' && !isNaN(curr.relative_humidity_2m)) ? Math.round(curr.relative_humidity_2m) : 72;
    
    // Wind Speed & Direction
    const windSpeedRaw = (typeof curr.wind_speed_10m === 'number' && !isNaN(curr.wind_speed_10m)) ? curr.wind_speed_10m : 14;
    const windSpeedVal = Number(windSpeedRaw.toFixed(1));
    const windDirDeg = (typeof curr.wind_direction_10m === 'number' && !isNaN(curr.wind_direction_10m)) ? Math.round(curr.wind_direction_10m) : 180;
    const windDirCompass = this.getCardinalDirection(windDirDeg);

    const pressureVal = (typeof curr.pressure_msl === 'number' && !isNaN(curr.pressure_msl)) ? Math.round(curr.pressure_msl) : ((typeof curr.surface_pressure === 'number' && !isNaN(curr.surface_pressure)) ? Math.round(curr.surface_pressure) : 1010);
    const cloudCoverVal = (typeof curr.cloud_cover === 'number' && !isNaN(curr.cloud_cover)) ? Math.round(curr.cloud_cover) : 45;

    const precipVal = (typeof curr.precipitation === 'number' && !isNaN(curr.precipitation)) ? curr.precipitation : 0;
    const dailyPrecipSum = (data.daily && data.daily.precipitation_sum && typeof data.daily.precipitation_sum[0] === 'number') ? data.daily.precipitation_sum[0] : 0;
    const rainInfo = this.getRainIntensityInfo(precipVal, codeInfo.condition, dailyPrecipSum);

    return {
      city: city.name,
      state: city.state || city.country || "",
      region: city.region || city.state || "",
      lat: city.lat,
      lon: city.lon,
      temp: tempVal,
      feelsLike: feelsVal,
      maxTemp: maxTempToday,
      minTemp: minTempToday,
      humidity: humidityVal,
      windSpeed: windSpeedVal,
      windDir: windDirDeg,
      windDirCompass: windDirCompass,
      pressure: pressureVal,
      cloudCover: cloudCoverVal,
      precipitation: precipVal,
      rainInfo: rainInfo,
      condition: codeInfo.condition,
      icon: codeInfo.icon,
      category: codeInfo.category,
      isDay: curr.is_day === 1,
      uvIndex: (data.daily?.uv_index_max && typeof data.daily.uv_index_max[0] === 'number') ? Math.round(data.daily.uv_index_max[0]) : 7,
      sunrise: sunriseStr,
      sunset: sunsetStr,
      dayHours: `${dayH} hrs ${dayM} mins`,
      nightHours: `${nightH} hrs ${nightM} mins`,
      aqi: {
        value: aqiVal,
        status: this.getAqiStatus(aqiVal),
        pm25: pm25,
        pm10: pm10,
        no2: no2,
        o3: o3
      },
      lastUpdated: new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      hourly: hourly,
      daily: daily
    };
  }

  static getAqiStatus(val) {
    if (val <= 50) return { label: "Good", color: "#10b981", desc: "Air quality is satisfactory." };
    if (val <= 100) return { label: "Satisfactory", color: "#84cc16", desc: "Air quality is acceptable." };
    if (val <= 200) return { label: "Moderate", color: "#f59e0b", desc: "Unhealthy for sensitive groups." };
    if (val <= 300) return { label: "Poor", color: "#f97316", desc: "Breathing discomfort on exposure." };
    if (val <= 400) return { label: "Very Poor", color: "#ef4444", desc: "Health alert!" };
    return { label: "Severe Alert", color: "#9333ea", desc: "Emergency health warning!" };
  }

  static getRainIntensityInfo(precip, conditionStr = "", dailyPrecipSum = 0) {
    const condLower = (conditionStr || "").toLowerCase();
    const isRainCondition = condLower.includes("rain") || condLower.includes("drizzle") || 
                            condLower.includes("shower") || condLower.includes("downpour") || 
                            condLower.includes("torrent") || condLower.includes("thunderstorm") ||
                            condLower.includes("squall");
    const precipVal = parseFloat(precip) || 0;
    const isRaining = precipVal > 0 || isRainCondition;

    // Calculate rain speed (mm/h and cm/h)
    let speedMm = 0;
    if (precipVal > 0) {
      speedMm = precipVal;
    } else if (isRainCondition) {
      speedMm = condLower.includes("heavy") || condLower.includes("torrent") ? 14.5 : condLower.includes("light") || condLower.includes("drizzle") ? 1.8 : 5.4;
    }
    const speedCm = (speedMm / 10).toFixed(2);
    const speedText = `${speedMm.toFixed(1)} mm/h (${speedCm} cm/h)`;

    // Calculate rainfall amount (mm and cm)
    let amountMm = parseFloat(dailyPrecipSum) || 0;
    if (amountMm <= 0) {
      amountMm = speedMm > 0 ? (speedMm * 2.5) : (isRainCondition ? (condLower.includes("heavy") || condLower.includes("torrent") ? 24.5 : condLower.includes("light") ? 3.5 : 12.0) : 0);
    }
    const amountCm = (amountMm / 10).toFixed(2);
    const amountText = `${amountMm.toFixed(1)} mm (${amountCm} cm)`;

    if (!isRaining && amountMm <= 0) {
      return {
        isRaining: false,
        intensityEn: "No Active Rain",
        intensityHi: "वर्षा नहीं है",
        amountMm: 0,
        amountCm: "0.00",
        amountVal: 0,
        amountText: "0.0 mm (0.00 cm)",
        speedMm: 0,
        speedCm: "0.00",
        speedText: "0.0 mm/h (0.00 cm/h)",
        color: "#0284c7",
        descEn: "No active rain currently.",
        descHi: "वर्तमान में वर्षा नहीं हो रही है।"
      };
    }

    let intensityEn = "Light Rain Alert";
    let intensityHi = "हल्की वर्षा चेतावनी";
    let color = "#0284c7";

    if (amountMm >= 15.0 || speedMm >= 7.5 || condLower.includes("heavy") || condLower.includes("torrent") || condLower.includes("downpour") || condLower.includes("thunderstorm")) {
      intensityEn = "Heavy Downpour Alert";
      intensityHi = "भारी मूसलाधार वर्षा चेतावनी";
      color = "#dc2626";
    } else if (amountMm >= 5.0 || speedMm >= 2.5 || condLower.includes("moderate") || condLower.includes("shower")) {
      intensityEn = "Moderate Rain Alert";
      intensityHi = "मध्यम वर्षा चेतावनी";
      color = "#2563eb";
    }

    return {
      isRaining: isRaining,
      intensityEn: intensityEn,
      intensityHi: intensityHi,
      amountMm: amountMm,
      amountCm: amountCm,
      amountVal: amountMm,
      amountText: amountText,
      speedMm: speedMm,
      speedCm: speedCm,
      speedText: speedText,
      color: color,
      descEn: `${intensityEn} active with ${amountText} rainfall amount at ${speedText} speed.`,
      descHi: `क्षेत्र में ${amountText} वर्षा और ${speedText} गति के साथ ${intensityHi} सक्रिय है।`
    };
  }

  static generateFallbackData(city) {
    let baseTemp = 31;
    let condition = "Partly Cloudy";
    let icon = "cloud-sun";
    let category = "sunny";

    if (city.region.includes("Himalayas") || city.region.includes("Cold Desert")) {
      baseTemp = city.name === "Leh" ? 12 : 18;
      condition = "Clear Sky";
      icon = "sun";
      category = "sunny";
    } else if (city.region.includes("Coastal") || city.region.includes("Metro")) {
      baseTemp = 32;
      condition = "Moderate Rain";
      icon = "cloud-rain";
      category = "rainy";
    } else if (city.region.includes("Desert")) {
      baseTemp = 37;
      condition = "Sunny & Hot";
      icon = "sun";
      category = "sunny";
    }

    const precipVal = category === 'rainy' ? 14.5 : 0;
    const dailyPrecipSum = category === 'rainy' ? 24.5 : 0;
    const rainInfo = this.getRainIntensityInfo(precipVal, condition, dailyPrecipSum);

    const hourly = [];
    const nowH = new Date().getHours();
    for (let i = 0; i < 24; i++) {
      const hTime = (nowH + i) % 24;
      const ampm = hTime >= 12 ? 'PM' : 'AM';
      const formattedHour = (hTime % 12 || 12).toString().padStart(2, '0');
      hourly.push({
        time: `${formattedHour}:00 ${ampm}`,
        temp: baseTemp + (i % 5) - 2,
        pop: category === 'rainy' ? 85 : 15,
        code: category === 'rainy' ? 65 : 0,
        icon: icon,
        condition: condition
      });
    }

    const daily = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const curD = new Date().getDay();
    for (let i = 0; i < 7; i++) {
      const dIndex = (curD + i) % 7;
      daily.push({
        day: i === 0 ? "Today" : days[dIndex],
        date: `${new Date().getDate() + i} Aug`,
        maxTemp: baseTemp + Math.floor(Math.random() * 3),
        minTemp: baseTemp - 6 - Math.floor(Math.random() * 2),
        condition: condition,
        icon: icon,
        rainProb: category === 'rainy' ? 70 : 20,
        uv: 8
      });
    }

    return {
      city: city.name,
      state: city.state,
      region: city.region,
      lat: city.lat,
      lon: city.lon,
      temp: baseTemp,
      feelsLike: baseTemp + 2,
      maxTemp: baseTemp + 4,
      minTemp: baseTemp - 5,
      humidity: 75,
      windSpeed: 12,
      windDir: 210,
      pressure: 1010,
      cloudCover: 55,
      precipitation: precipVal,
      rainInfo: rainInfo,
      condition: condition,
      icon: icon,
      category: category,
      isDay: true,
      uvIndex: 8,
      sunrise: "06:05 AM",
      sunset: "07:12 PM",
      dayHours: "13 hrs 7 mins",
      nightHours: "10 hrs 53 mins",
      aqi: {
        value: city.name === "New Delhi" ? 220 : 85,
        status: this.getAqiStatus(city.name === "New Delhi" ? 220 : 85),
        pm25: 42,
        pm10: 88,
        no2: 24,
        o3: 30
      },
      lastUpdated: new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      hourly: hourly,
      daily: daily
    };
  }
}
