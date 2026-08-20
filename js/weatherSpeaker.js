class WeatherSpeaker {
  constructor() {
    this.synth = window.speechSynthesis;
    this.lang = 'en'; // 'en' or 'hi'
    this.isSpeaking = false;
    this.currentData = null;
    this.voices = [];
    this.audioFallback = null;
    this.pauseTimer = null;
    this.activeUtterances = [];

    this.hiConditionMap = {
      "Clear Sky": "साफ़ धूप",
      "Mainly Clear": "मुख्यतः साफ़",
      "Partly Cloudy": "आंशिक रूप से बादल",
      "Overcast": "छाए हुए बादल",
      "Foggy": "कोहरा",
      "Depositing Rime Fog": "सघन कोहरा",
      "Light Drizzle": "हल्की बूंदाबांदी",
      "Moderate Drizzle": "बूंदाबांदी",
      "Heavy Drizzle": "तेज बूंदाबांदी",
      "Slight Rain": "हल्की बारिश",
      "Moderate Rain": "बारिश",
      "Heavy Downpour": "भारी मूसलाधार बारिश",
      "Slight Snowfall": "हल्की बर्फबारी",
      "Moderate Snow": "बर्फबारी",
      "Heavy Snowstorm": "भारी बर्फबारी",
      "Rain Showers": "बारिश की फुहारें",
      "Moderate Rain Showers": "तेज फुहारें",
      "Violent Rain Torrent": "भीषण बारिश",
      "Thunderstorm": "गर्जन के साथ तूफान",
      "Thunderstorm with Hail": "ओलावृष्टि और तूफान",
      "Heavy Severe Thunderstorm": "भीषण गर्जन और तूफान",
      "Sunny & Clear": "साफ़ धूप"
    };

    this.hiCityMap = {
      "New Delhi": "नई दिल्ली",
      "Mumbai": "मुंबई",
      "Kolkata": "कोलकाता",
      "Bengaluru": "बेंगलुरु",
      "Chennai": "चेन्नई",
      "Hyderabad": "हैदराबाद",
      "Ahmedabad": "अहमदाबाद",
      "Pune": "पुणे",
      "Jaipur": "जयपुर",
      "Lucknow": "लखनऊ",
      "Surat": "सूरत",
      "Kanpur": "कानपुर",
      "Nagpur": "नागपुर",
      "Indore": "इंदौर",
      "Thane": "ठाणे",
      "Bhopal": "भोपाल",
      "Visakhapatnam": "विशाखापट्टनम",
      "Patna": "पटना",
      "Vadodara": "वड़ोदरा",
      "Ghaziabad": "गाजियाबाद",
      "Ludhiana": "लुधियाना",
      "Agra": "आगरा",
      "Nashik": "नासिक",
      "Ranchi": "राँची",
      "Faridabad": "फरीदाबाद",
      "Meerut": "मेरठ",
      "Rajkot": "राजकोट",
      "Varanasi": "वाराणसी",
      "Srinagar": "श्रीनगर",
      "Aurangabad": "औरंगाबाद",
      "Dhanbad": "धनबाद",
      "Amritsar": "अमृतसर",
      "Navi Mumbai": "नवी मुंबई",
      "Allahabad": "प्रयागराज",
      "Prayagraj": "प्रयागराज",
      "Howrah": "हावड़ा",
      "Gwalior": "ग्वालियर",
      "Jabalpur": "जबलपुर",
      "Coimbatore": "कोयंबटूर",
      "Vijayawada": "विजयवाड़ा",
      "Jodhpur": "जोधपुर",
      "Madurai": "मदुरै",
      "Raipur": "रायपुर",
      "Kota": "कोटा",
      "Guwahati": "गुवाहाटी",
      "Chandigarh": "चंडीगढ़",
      "Solapur": "सोलापुर",
      "Hubli": "हुबली",
      "Bareilly": "बरेली",
      "Mysore": "मैसूर",
      "Moradabad": "मुरादाबाद",
      "Gurgaon": "गुरुग्राम",
      "Gurugram": "गुरुग्राम",
      "Aligarh": "अलीगढ़",
      "Jalandhar": "जालंधर",
      "Tiruchirappalli": "तिरुचिरापल्ली",
      "Bhubaneswar": "भुवनेश्वर",
      "Salem": "सेलम",
      "Mira-Bhayandar": "मीरा-भायंदर",
      "Warangal": "वरंगल",
      "Thiruvananthapuram": "तिरुवनंतपुरम",
      "Dehradun": "देहरादून",
      "Shimla": "शिमला",
      "Nainital": "नैनीताल",
      "Gangtok": "गंगटोक",
      "Leh": "लेह",
      "Ladakh": "लद्दाख",
      "Jaisalmer": "जैसलमेर",
      "Udaipur": "उदयपुर",
      "Manali": "मनाली",
      "Dharamshala": "धर्मशाला",
      "Puducherry": "पुडुचेरी",
      "Goa": "गोवा",
      "Panaji": "पणजी"
    };

    this.hiStateMap = {
      "Delhi NCR": "दिल्ली एनसीआर",
      "Maharashtra": "महाराष्ट्र",
      "Rajasthan": "राजस्थान",
      "Himachal Pradesh": "हिमाचल प्रदेश",
      "Tamil Nadu": "तमिलनाडु",
      "Karnataka": "कर्नाटक",
      "West Bengal": "पश्चिम बंगाल",
      "Uttar Pradesh": "उत्तर प्रदेश",
      "Gujarat": "गुजरात",
      "Punjab": "पंजाब",
      "Bihar": "बिहार",
      "Assam": "असम",
      "Odisha": "ओडिशा",
      "Telangana": "तेलंगाना",
      "Kerala": "केरल",
      "Madhya Pradesh": "मध्य प्रदेश",
      "Haryana": "हरियाणा",
      "Uttarakhand": "उत्तराखंड",
      "Jammu & Kashmir": "जम्मू और कश्मीर",
      "Ladakh": "लद्दाख",
      "Goa": "गोवा",
      "Chhattisgarh": "छत्तीसगढ़",
      "Jharkhand": "झारखंड"
    };

    this.selectedVoiceURI = 'auto';

    if (this.synth) {
      this.loadVoices();
      if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }

    // Auto-populate widget data chips immediately on instantiation
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.updateWidgetData(null);
        this.populateVoiceDropdown();
      }, 50);
    }
  }

  loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices() || [];
    }
    this.populateVoiceDropdown();
  }

  populateVoiceDropdown() {
    const selectEl = document.getElementById('speaker-voice-select');
    if (!selectEl) return;

    const availableVoices = this.voices || [];
    let filteredVoices = [];

    if (this.lang === 'hi') {
      filteredVoices = availableVoices.filter(v => 
        (v.lang && (v.lang.toLowerCase().includes('hi') || v.lang.toLowerCase().includes('hindi'))) || 
        (v.name && (v.name.toLowerCase().includes('hindi') || v.name.includes('हिन्दी') || v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('madhur') || v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('hemant')))
      );
    } else {
      filteredVoices = availableVoices.filter(v => 
        v.lang && v.lang.toLowerCase().includes('en')
      );
    }

    let optionsHTML = `<option value="auto">✨ Perfect Auto Voice (${this.lang === 'hi' ? 'हिंदी Neural / Stream' : 'English Neural'})</option>`;

    if (this.lang === 'hi' && filteredVoices.length === 0) {
      optionsHTML += `<option value="tts_stream">🇮🇳 High-Clarity Native Hindi Speaker (Stream)</option>`;
    }

    filteredVoices.forEach(v => {
      const isSelected = this.selectedVoiceURI === v.voiceURI ? 'selected' : '';
      optionsHTML += `<option value="${v.voiceURI}" ${isSelected}>${v.name} (${v.lang})</option>`;
    });

    selectEl.innerHTML = optionsHTML;
  }

  setSelectedVoice(voiceURI) {
    this.selectedVoiceURI = voiceURI;
    if (this.isSpeaking) {
      const data = this.currentData;
      this.stop();
      setTimeout(() => this.speak(data), 120);
    }
  }

  setLanguage(lang) {
    if (this.lang === lang) return;
    this.lang = lang;
    this.selectedVoiceURI = 'auto';
    
    // Update language buttons active state in UI
    const enBtn = typeof document !== 'undefined' ? document.getElementById('speaker-lang-en') : null;
    const hiBtn = typeof document !== 'undefined' ? document.getElementById('speaker-lang-hi') : null;
    if (enBtn && hiBtn && enBtn.classList && hiBtn.classList) {
      if (lang === 'en') {
        enBtn.classList.add('active');
        hiBtn.classList.remove('active');
      } else {
        hiBtn.classList.add('active');
        enBtn.classList.remove('active');
      }
    }

    this.populateVoiceDropdown();

    const data = this.currentData || (typeof currentWeatherData !== 'undefined' && currentWeatherData ? currentWeatherData : null);
    this.updateTranscriptPreview(data);
    this.updateWidgetData(data);

    if (this.isSpeaking) {
      this.stop();
      setTimeout(() => this.speak(data), 120);
    } else {
      this.updateUIState(false);
    }
  }

  getHindiAqiLabel(statusLabel) {
    const map = {
      "Good": "अच्छा",
      "Satisfactory": "संतोषजनक",
      "Moderate": "मध्यम",
      "Poor": "खराब",
      "Very Poor": "बहुत खराब",
      "Severe Alert": "गंभीर"
    };
    return map[statusLabel] || statusLabel;
  }

  getHindiCondition(conditionStr) {
    if (!conditionStr) return "साफ़ मौसम";
    for (const [key, val] of Object.entries(this.hiConditionMap)) {
      if (conditionStr.toLowerCase().includes(key.toLowerCase())) {
        return val;
      }
    }
    return conditionStr;
  }

  getHindiCityName(cityName) {
    return this.hiCityMap[cityName] || cityName;
  }

  getHindiStateName(stateName) {
    if (!stateName) return "";
    for (const [key, val] of Object.entries(this.hiStateMap)) {
      if (stateName.toLowerCase().includes(key.toLowerCase())) {
        return val;
      }
    }
    return stateName;
  }

  formatTimeHindi(timeStr) {
    if (!timeStr) return "";
    let clean = timeStr.trim();
    let hours = 0;
    let minutes = 0;

    if (clean.toUpperCase().includes('AM') || clean.toUpperCase().includes('PM')) {
      const parts = clean.split(/\s+/);
      const timeParts = parts[0].split(':');
      hours = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1] || '0', 10);
      const period = parts[1].toUpperCase();

      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
    } else {
      const timeParts = clean.split(':');
      hours = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1] || '0', 10);
    }

    let dayPart = "सुबह"; // default morning
    if (hours >= 12 && hours < 16) {
      dayPart = "दोपहर"; // afternoon
    } else if (hours >= 16 && hours < 20) {
      dayPart = "शाम"; // evening
    } else if (hours >= 20 || hours < 4) {
      dayPart = "रात"; // night
    } else {
      dayPart = "सुबह"; // morning
    }

    let displayHours = hours % 12;
    if (displayHours === 0) displayHours = 12;

    if (minutes === 0) {
      return `${dayPart} ${displayHours} बजे`;
    } else {
      return `${dayPart} ${displayHours} बजकर ${minutes} मिनट पर`;
    }
  }

  formatPointForSpeech(text, lang = this.lang) {
    if (!text) return "";
    if (lang === 'hi') {
      return text.replace(/(\d+)\.(\d+)/g, "$1 पॉइंट $2");
    } else {
      return text.replace(/(\d+)\.(\d+)/g, "$1 point $2");
    }
  }

  getRainInfo(data, lang) {
    const rInfo = data.rainInfo || (typeof WeatherAPI !== 'undefined' ? WeatherAPI.getRainIntensityInfo(data.precipitation || 0, data.condition) : null);

    let rainTimeHi = "आज वर्षा की संभावना कम है";
    let rainTimeEn = "No active rain expected currently";
    let isRaining = rInfo ? rInfo.isRaining : false;
    const amountMmVal = rInfo ? (typeof rInfo.amountMm === 'number' ? rInfo.amountMm : (rInfo.amountVal || 0)) : 0;
    let hasDailyRain = amountMmVal > 0;

    if (isRaining) {
      rainTimeHi = "वर्तमान समय में वर्षा जारी है";
      rainTimeEn = "Currently Raining";
    } else if (hasDailyRain) {
      rainTimeHi = "वर्षा रुक गई है और मौसम साफ़ हो रहा है";
      rainTimeEn = "Rain has stopped and sky is clearing";
    } else if (data.hourly && Array.isArray(data.hourly)) {
      const rainHour = data.hourly.find(h => h && (h.pop >= 30 || (h.condition && h.condition.toLowerCase().includes('rain'))));
      if (rainHour) {
        rainTimeHi = `${this.formatTimeHindi(rainHour.time)} वर्षा का अनुमान है`;
        rainTimeEn = `Rain expected around ${rainHour.time}`;
      }
    }

    const amountCmVal = rInfo ? (rInfo.amountCm || (amountMmVal / 10).toFixed(2)) : "0.00";

    const speedMmVal = rInfo ? (typeof rInfo.speedMm === 'number' ? rInfo.speedMm : (data.precipitation || 0)) : 0;
    const speedCmVal = rInfo ? (rInfo.speedCm || (speedMmVal / 10).toFixed(2)) : "0.00";

    if (lang === 'hi') {
      const speedMmStr = speedMmVal.toFixed(1);
      const speedCmStr = speedCmVal.toString();
      const speedSpokenHi = `${speedMmStr} मिलीमीटर प्रति घंटा यानी ${speedCmStr} सेंटिमीटर प्रति घंटा`;

      const amountMmStr = amountMmVal.toFixed(1);
      const amountCmStr = amountCmVal.toString();
      const amountSpokenHi = `${amountMmStr} मिलीमीटर यानी ${amountCmStr} सेंटिमीटर`;

      if (isRaining) {
        return `विशेष वर्षा चेतावनी: ${this.getHindiCityName(data.city)} में ${rInfo.intensityHi} सक्रिय है। वर्षा का समय: ${rainTimeHi}। वर्षा की गति: ${speedSpokenHi}। कुल वर्षा की मात्रा: ${amountSpokenHi} दर्ज की गई है।`;
      } else {
        return `वर्षा की जानकारी: ${rainTimeHi}। वर्षा की गति: ${speedSpokenHi} और दर्ज वर्षा की मात्रा: ${amountSpokenHi} है।`;
      }
    } else {
      const speedMmStr = speedMmVal.toFixed(1);
      const speedCmStr = speedCmVal.toString();
      const speedSpokenEn = `${speedMmStr} millimeter per hour, or ${speedCmStr} centimeter per hour`;

      const amountMmStr = amountMmVal.toFixed(1);
      const amountCmStr = amountCmVal.toString();
      const amountSpokenEn = `${amountMmStr} millimeter, or ${amountCmStr} centimeter`;

      if (isRaining) {
        return `Rain Alert: ${rInfo.intensityEn} active in ${data.city}. Rain time: ${rainTimeEn}. Rain speed: ${speedSpokenEn}. Total rainfall volume: ${amountSpokenEn}.`;
      } else {
        return `Rain Details: ${rainTimeEn}. Current rain speed: ${speedSpokenEn} and recorded rainfall amount: ${amountSpokenEn}.`;
      }
    }
  }

  getRomanizedCondition(conditionStr) {
    const map = {
      "Clear Sky": "saaf dhoop",
      "Mainly Clear": "mukhya roop se saaf",
      "Partly Cloudy": "aanshik roop se baadal",
      "Overcast": "chhaaye hue baadal",
      "Foggy": "kohra",
      "Depositing Rime Fog": "saghan kohra",
      "Light Drizzle": "halki boondabaandi",
      "Moderate Drizzle": "boondabaandi",
      "Heavy Drizzle": "tej boondabaandi",
      "Slight Rain": "halki baarish",
      "Moderate Rain": "baarish",
      "Heavy Downpour": "bhaari mooslaadhaar baarish",
      "Slight Snowfall": "halki barfbaari",
      "Moderate Snow": "barfbaari",
      "Heavy Snowstorm": "bhaari barfbaari",
      "Rain Showers": "baarish ki fuharein",
      "Moderate Rain Showers": "tej fuharein",
      "Violent Rain Torrent": "bheeshan baarish",
      "Thunderstorm": "garjan ke saath toofan",
      "Thunderstorm with Hail": "ola vrishti aur toofan",
      "Heavy Severe Thunderstorm": "bheeshan garjan aur toofan",
      "Sunny & Clear": "saaf dhoop"
    };
    if (!conditionStr) return "saaf mausam";
    for (const [key, val] of Object.entries(map)) {
      if (conditionStr.toLowerCase().includes(key.toLowerCase())) return val;
    }
    return conditionStr;
  }

  getRomanizedAqiLabel(statusLabel) {
    const map = {
      "Good": "achha",
      "Satisfactory": "santoshjanak",
      "Moderate": "madhyam",
      "Poor": "kharaab",
      "Very Poor": "bahut kharaab",
      "Severe Alert": "gambheer"
    };
    return map[statusLabel] || statusLabel;
  }

  formatTimeRomanized(timeStr) {
    if (!timeStr) return "";
    let clean = timeStr.trim();
    let hours = 0;
    let minutes = 0;

    if (clean.toUpperCase().includes('AM') || clean.toUpperCase().includes('PM')) {
      const parts = clean.split(/\s+/);
      const timeParts = parts[0].split(':');
      hours = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1] || '0', 10);
      const period = parts[1].toUpperCase();

      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
    } else {
      const timeParts = clean.split(':');
      hours = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1] || '0', 10);
    }

    let dayPart = "subah";
    if (hours >= 12 && hours < 16) dayPart = "dopahar";
    else if (hours >= 16 && hours < 20) dayPart = "shaam";
    else if (hours >= 20 || hours < 4) dayPart = "raat";

    let displayHours = hours % 12;
    if (displayHours === 0) displayHours = 12;

    if (minutes === 0) {
      return `${dayPart} ${displayHours} baje`;
    } else {
      return `${dayPart} ${displayHours} bajkar ${minutes} minute par`;
    }
  }

  getRainInfoRomanized(data) {
    const rInfo = data.rainInfo || (typeof WeatherAPI !== 'undefined' ? WeatherAPI.getRainIntensityInfo(data.precipitation || 0, data.condition) : null);

    let rainTimeRom = "aaj varsha ki sambhavna kam hai";
    let isRaining = rInfo ? rInfo.isRaining : false;

    if (isRaining) {
      rainTimeRom = "vartaman samay me varsha jaari hai";
    } else if (data.hourly && Array.isArray(data.hourly)) {
      const rainHour = data.hourly.find(h => h && (h.pop >= 30 || (h.condition && h.condition.toLowerCase().includes('rain'))));
      if (rainHour) {
        rainTimeRom = `${this.formatTimeRomanized(rainHour.time)} varsha ka anumaan hai`;
      }
    }

    const amountMmVal = rInfo ? (typeof rInfo.amountMm === 'number' ? rInfo.amountMm : (rInfo.amountVal || 0)) : 0;
    const amountCmVal = rInfo ? (rInfo.amountCm || (amountMmVal / 10).toFixed(2)) : "0.00";

    const speedMmVal = rInfo ? (typeof rInfo.speedMm === 'number' ? rInfo.speedMm : (data.precipitation || 0)) : 0;
    const speedCmVal = rInfo ? (rInfo.speedCm || (speedMmVal / 10).toFixed(2)) : "0.00";

    const speedMmStr = speedMmVal.toFixed(1).replace('.', ' point ');
    const speedCmStr = speedCmVal.toString().replace('.', ' point ');
    const speedSpokenRom = `${speedMmStr} millimeter prati ghanta yani ${speedCmStr} centimeter prati ghanta`;

    const amountMmStr = amountMmVal.toFixed(1).replace('.', ' point ');
    const amountCmStr = amountCmVal.toString().replace('.', ' point ');
    const amountSpokenRom = `${amountMmStr} millimeter yani ${amountCmStr} centimeter`;

    if (isRaining) {
      return `Vishesh varsha chetavani: ${data.city} me varsha sakriya hai. Varsha ka samay: ${rainTimeRom}. Varsha ki gati: ${speedSpokenRom}. Kul varsha ki matra: ${amountSpokenRom} darj ki gayi hai.`;
    } else {
      return `Varsha ki jaankari: ${rainTimeRom}. Varsha ki gati: ${speedSpokenRom} aur darj varsha ki matra: ${amountSpokenRom} hai.`;
    }
  }

  generateRomanizedHindiSpeechText(data) {
    if (!data) return "";

    const cityName = data.city || "New Delhi";
    const stateName = data.state || "";
    const temp = data.temp ?? 30;
    const feelsLike = data.feelsLike ?? temp;
    const maxTemp = data.maxTemp ?? (temp + 3);
    const minTemp = data.minTemp ?? (temp - 5);
    const windSpeed = (typeof data.windSpeed === 'number' ? data.windSpeed : 12).toString().replace('.', ' point ');
    const condition = data.condition || "Sunny & Clear";
    const sunrise = data.sunrise || "06:05 AM";
    const sunset = data.sunset || "07:12 PM";
    const aqiVal = data.aqi ? (data.aqi.value ?? "--") : "--";
    const aqiLabel = data.aqi ? (typeof data.aqi.status === 'object' ? (data.aqi.status.label || 'Moderate') : (data.aqi.status || 'Moderate')) : "Moderate";

    const conditionRom = this.getRomanizedCondition(condition);
    const aqiLabelRom = this.getRomanizedAqiLabel(aqiLabel);
    const sunriseRom = this.formatTimeRomanized(sunrise);
    const sunsetRom = this.formatTimeRomanized(sunset);
    const rainTextRom = this.getRainInfoRomanized(data);

    const tempStr = temp.toString().replace('.', ' point ');
    const feelsStr = feelsLike.toString().replace('.', ' point ');

    return `${cityName} ${stateName} ke liye taaza mausam samachar. Vartaman tapman ${tempStr} degree Celsius hai, jo ${feelsStr} degree Celsius jaisa mehsus ho raha hai. Aaj ka adhiktam tapman ${maxTemp} degree aur nyuntam tapman ${minTemp} degree Celsius rahega. Mausam ${conditionRom} hai. Suryoday ${sunriseRom} aur suryast ${sunsetRom} hoga. Hawa ki gati ${windSpeed} kilometer prati ghanta hai. Vayu gunvatta suchkank ${aqiVal} yani ${aqiLabelRom} sthiti me hai. ${rainTextRom}`;
  }

  generateSpeechText(data, lang = this.lang) {
    if (!data) data = this.currentData || (typeof currentWeatherData !== 'undefined' && currentWeatherData ? currentWeatherData : null);
    if (!data && typeof WeatherAPI !== 'undefined') {
      const activeCity = (typeof currentCity !== 'undefined' && currentCity) ? currentCity : { name: "New Delhi", state: "Delhi NCR", region: "Capital Metro", lat: 28.6139, lon: 77.2090 };
      data = WeatherAPI.generateFallbackData(activeCity);
    }
    if (!data) return "";

    const cityName = data.city || "New Delhi";
    const stateName = data.state || "";
    const temp = (typeof data.temp === 'number' && !isNaN(data.temp)) ? data.temp : 32;
    const feelsLike = (typeof data.feelsLike === 'number' && !isNaN(data.feelsLike)) ? data.feelsLike : temp + 2;
    const maxTemp = (typeof data.maxTemp === 'number' && !isNaN(data.maxTemp)) ? data.maxTemp : temp + 3;
    const minTemp = (typeof data.minTemp === 'number' && !isNaN(data.minTemp)) ? data.minTemp : temp - 5;
    const windSpeed = (typeof data.windSpeed === 'number' && !isNaN(data.windSpeed)) ? data.windSpeed : 14;
    const condition = data.condition || "Sunny & Clear";
    const sunrise = data.sunrise || "06:05 AM";
    const sunset = data.sunset || "07:12 PM";

    const aqiObj = data.aqi || {};
    const defaultAqi = (cityName === "New Delhi" || cityName === "Ghaziabad" || cityName === "Kanpur" || cityName === "Patna") ? 220 : 85;
    const aqiVal = (typeof aqiObj.value === 'number' && !isNaN(aqiObj.value) && aqiObj.value > 0) ? aqiObj.value : defaultAqi;
    const aqiLabel = (typeof aqiObj.status === 'object' && aqiObj.status !== null) ? (aqiObj.status.label || 'Moderate') : (typeof aqiObj.status === 'string' ? aqiObj.status : (aqiVal > 200 ? 'Poor' : 'Moderate'));

    if (lang === 'hi') {
      const cityHi = this.getHindiCityName(cityName);
      const stateHi = this.getHindiStateName(stateName);
      const conditionHi = this.getHindiCondition(condition);
      const aqiLabelHi = this.getHindiAqiLabel(aqiLabel);
      const sunriseHi = this.formatTimeHindi(sunrise);
      const sunsetHi = this.formatTimeHindi(sunset);
      const rainTextHi = this.getRainInfo(data, 'hi');
      
      return `${cityHi} ${stateHi} के लिए ताज़ा मौसम समाचार। वर्तमान तापमान ${temp} डिग्री सेल्सियस है, जो ${feelsLike} डिग्री सेल्सियस जैसा महसूस हो रहा है। आज का अधिकतम तापमान ${maxTemp} डिग्री और न्यूनतम तापमान ${minTemp} डिग्री सेल्सियस रहेगा। मौसम ${conditionHi} है। सूर्योदय ${sunriseHi} और सूर्यास्त ${sunsetHi} होगा। हवा की गति ${windSpeed} किलोमीटर प्रति घंटा है। वायु गुणवत्ता सूचकांक ${aqiVal} यानी ${aqiLabelHi} स्थिति में है। ${rainTextHi}`;
    } else {
      const rainTextEn = this.getRainInfo(data, 'en');
      return `Live weather report for ${cityName}, ${stateName}. Current temperature is ${temp} degrees Celsius, feeling like ${feelsLike} degrees Celsius with ${condition}. Today's maximum temperature is ${maxTemp} degrees Celsius and minimum temperature is ${minTemp} degrees Celsius. Sunrise at ${sunrise} and sunset at ${sunset}. Wind speed is ${windSpeed} kilometers per hour. AQI is ${aqiVal}, ${aqiLabel}. ${rainTextEn}`;
    }
  }

  numberToHindiWord(val, isRoman = false) {
    const num = Math.round(Number(val));
    if (isNaN(num)) return val;

    const hindiWords = {
      0: "शून्य", 1: "एक", 2: "दो", 3: "तीन", 4: "चार", 5: "पांच", 6: "छह", 7: "सात", 8: "आठ", 9: "नौ", 10: "दस",
      11: "ग्यारह", 12: "बारह", 13: "तेरह", 14: "चौदह", 15: "पंद्रह", 16: "सोलह", 17: "सत्रह", 18: "अठारह", 19: "उन्नीस", 20: "बीस",
      21: "इक्कीस", 22: "बाईस", 23: "तेईस", 24: "चौबीस", 25: "पच्चीस", 26: "छब्बीस", 27: "सत्ताइस", 28: "अट्ठाईस", 29: "उनतीस", 30: "तीस",
      31: "इकतलीस", 32: "बत्तीस", 33: "तैंतीस", 34: "चौंतीस", 35: "पैंतीस", 36: "छत्तीस", 37: "सैंतीस", 38: "अड़तीस", 39: "उनतालीस", 40: "चालिस",
      41: "इकतालीस", 42: "बयालीस", 43: "तैंतालीस", 44: "चौवालिस", 45: "पैंतालीस", 46: "छियालीस", 47: "सैंतालीस", 48: "अड़तालीस", 49: "उंचास", 50: "पचास",
      51: "इक्कावन", 52: "बावन", 53: "तिरपन", 54: "चौवन", 55: "पचपन", 56: "छप्पन", 57: "सत्तावन", 58: "अट्टावन", 59: "उनसठ", 60: "साठ",
      61: "इकसठ", 62: "बासठ", 63: "तिरसठ", 64: "चौंसठ", 65: "पैंसठ", 66: "छियासठ", 67: "सरसठ", 68: "अड़सठ", 69: "उनहत्तर", 70: "सत्तर",
      71: "इकहत्तर", 72: "बहत्तर", 73: "तिहत्तर", 74: "चौहत्तर", 75: "पचहत्तर", 76: "छहत्तर", 77: "सतहत्तर", 78: "अठहत्तर", 79: "उनासी", 80: "अस्सी",
      81: "इक्यासी", 82: "बयासी", 83: "तिरासी", 84: "चौरासी", 85: "पचासी", 86: "छियासी", 87: "सत्तासी", 88: "अट्ठासी", 89: "नवासी", 90: "नब्बे",
      91: "इक्यान्वे", 92: "बान्वे", 93: "तिरान्वे", 94: "चौरान्वे", 95: "पञ्चान्वे", 96: "छियान्वे", 97: "सत्तान्वे", 98: "अट्ठान्वे", 99: "निन्यान्वे", 100: "सौ"
    };

    const romanWords = {
      0: "shoonya", 1: "ek", 2: "do", 3: "teen", 4: "chaar", 5: "paanch", 6: "chhah", 7: "saat", 8: "aath", 9: "nau", 10: "das",
      11: "gyarah", 12: "baarah", 13: "terah", 14: "chaudah", 15: "pandrah", 16: "solah", 17: "satrah", 18: "atharah", 19: "unnees", 20: "bees",
      21: "ikkees", 22: "baais", 23: "teeis", 24: "chaubees", 25: "pachchees", 26: "chhabbees", 27: "sattaais", 28: "atthaais", 29: "unatees", 30: "tees",
      31: "ikatees", 32: "battees", 33: "taintees", 34: "chauntees", 35: "paintees", 36: "chhattees", 37: "saintees", 38: "adatees", 39: "unataalees", 40: "chaalees",
      41: "ikataalees", 42: "bayaalees", 43: "taintaalees", 44: "chauvaalees", 45: "paintaalees", 46: "chhiyaalees", 47: "saintaalees", 48: "adataalees", 49: "unchaas", 50: "pachaas",
      51: "ikkavan", 52: "baavan", 53: "tirapan", 54: "chauvan", 55: "pachapan", 56: "chhappan", 57: "sattavan", 58: "attavan", 59: "unasath", 60: "saath",
      61: "ikasath", 62: "baasath", 63: "tirasath", 64: "chaunsath", 65: "painsath", 66: "chhiyaasath", 67: "sarasath", 68: "adasath", 69: "unahattar", 70: "sattar",
      71: "ikahattar", 72: "bahattar", 73: "tihattar", 74: "chauhattar", 75: "pachahattar", 76: "chhahattar", 77: "satahattar", 78: "athahattar", 79: "unaasee", 80: "assee",
      81: "ikyaasee", 82: "bayaasee", 83: "tiraasee", 84: "chauraasee", 85: "pachaasee", 86: "chhiyaasee", 87: "sattaasee", 88: "atthaasee", 89: "navaasee", 90: "nabbe",
      91: "ikyaanve", 92: "baanve", 93: "tiraanve", 94: "chauraanve", 95: "panchaanve", 96: "chhiyaanve", 97: "sattaanve", 98: "atthanve", 99: "ninyaanve", 100: "sau"
    };

    if (isRoman) {
      return romanWords[num] || num.toString();
    }
    return hindiWords[num] || num.toString();
  }

  replaceNumbersWithHindiWords(text, isRoman = false) {
    if (!text) return "";

    // Replace decimal numbers like 4.5 -> "चार दशमलव पांच" / "chaar dashamlav paanch"
    let result = text.replace(/(\d+)\.(\d+)/g, (match, p1, p2) => {
      const w1 = this.numberToHindiWord(p1, isRoman);
      const w2 = this.numberToHindiWord(p2, isRoman);
      return isRoman ? `${w1} dashamlav ${w2}` : `${w1} दशमलव ${w2}`;
    });

    // Replace standalone digits like 32, 35, 14, 85
    result = result.replace(/\b(\d+)\b/g, (match, p1) => {
      return this.numberToHindiWord(p1, isRoman);
    });

    return result;
  }

  formatContinuousSpeech(text, lang = this.lang) {
    if (!text) return "";
    let clean = text.trim();

    if (lang === 'hi') {
      // Replace Purna Viram (।) with a single soft comma for a very short sentence pause
      clean = clean.replace(/।\s*/g, ", ");
      // Remove any extraneous commas inside sentences to prevent mid-sentence word pauses
      clean = clean.replace(/(?<!,)\s*,\s*(?!,)/g, " ");
      // Clean up multiple spaces
      clean = clean.replace(/\s+/g, " ");
    } else {
      // English: replace full stops at sentence ends with soft comma
      clean = clean.replace(/\.(?=\s+[A-Z]|$)/g, ", ");
      clean = clean.replace(/\s+/g, " ");
    }

    return clean;
  }

  getBestVoice(lang) {
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }

    if (this.selectedVoiceURI && this.selectedVoiceURI !== 'auto' && this.selectedVoiceURI !== 'tts_stream') {
      const customVoice = this.voices.find(v => v.voiceURI === this.selectedVoiceURI);
      if (customVoice) return customVoice;
    }
    
    if (lang === 'hi') {
      // Prioritize high quality Natural/Neural Hindi voices (Microsoft Swara, Microsoft Madhur, Google हिन्दी, Kalpana, Hemant)
      const naturalHi = this.voices.find(v => (v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('madhur') || v.name.toLowerCase().includes('natural')) && (v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi')));
      if (naturalHi) return naturalHi;

      const googleHi = this.voices.find(v => (v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.includes('हिन्दी')) && v.name.toLowerCase().includes('google'));
      if (googleHi) return googleHi;

      const msHi = this.voices.find(v => (v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('hemant')));
      if (msHi) return msHi;

      const hiInVoice = this.voices.find(v => (v.lang.toLowerCase().includes('hi-in') || v.lang.toLowerCase().includes('hi_in') || v.lang.toLowerCase() === 'hi') && !v.lang.toLowerCase().includes('en'));
      if (hiInVoice) return hiInVoice;
    } else {
      // Prioritize authentic Indian English (en-IN) neural and natural voices
      const googleEnIn = this.voices.find(v => v.lang.toLowerCase().includes('en-in') && v.name.toLowerCase().includes('google'));
      if (googleEnIn) return googleEnIn;

      const msEnIn = this.voices.find(v => (v.name.toLowerCase().includes('prabhat') || v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('ravi') || v.name.toLowerCase().includes('neerja') || v.name.toLowerCase().includes('india')) && v.lang.toLowerCase().includes('en'));
      if (msEnIn) return msEnIn;

      const enIndVoice = this.voices.find(v => v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('en_in'));
      if (enIndVoice) return enIndVoice;

      const enVoice = this.voices.find(v => v.lang.toLowerCase().includes('en'));
      if (enVoice) return enVoice;
    }
    return null;
  }

  speak(data) {
    if (!data) data = this.currentData || (typeof currentWeatherData !== 'undefined' && currentWeatherData ? currentWeatherData : null);
    if (!data && typeof WeatherAPI !== 'undefined') {
      const activeCity = (typeof currentCity !== 'undefined' && currentCity) ? currentCity : { name: "New Delhi", state: "Delhi NCR", region: "Capital Metro", lat: 28.6139, lon: 77.2090 };
      data = WeatherAPI.generateFallbackData(activeCity);
    }
    if (!data) return;

    this.currentData = data;
    this.stop(); // Stop any running speech or audio stream

    if (!this.synth && typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
    }

    if (this.synth) {
      try { this.synth.resume(); } catch(e) {}
      this.loadVoices();
    }

    const writtenText = this.generateSpeechText(data, this.lang);
    this.updateTranscriptPreview(data);

    if (!writtenText) return;

    if (this.lang === 'hi') {
      const rawDevanagari = this.generateSpeechText(data, 'hi');
      const devanagariText = this.replaceNumbersWithHindiWords(rawDevanagari, false);

      if (this.selectedVoiceURI === 'tts_stream') {
        this.speakAudioFallback(devanagariText, 'hi');
        return;
      }

      const bestHiVoice = this.getBestVoice('hi');
      if (bestHiVoice) {
        const sentences = this.splitIntoSentences(devanagariText);
        this.speakWebSpeechAPIQueue(sentences, 'hi');
      } else {
        // High quality native Hindi TTS audio stream (tl=hi)
        this.speakAudioFallback(devanagariText, 'hi');
      }
    } else {
      const textToSpeak = this.formatPointForSpeech(writtenText, 'en');
      const sentences = this.splitIntoSentences(textToSpeak);
      if (sentences.length === 0) return;
      this.speakWebSpeechAPIQueue(sentences, 'en');
    }
  }

  splitIntoSentences(text) {
    if (!text) return [];
    // Normalize ASCII pipe '|' to Devanagari Purna Viram '।' for Hindi puranviram compatibility
    const normalizedText = text.replace(/\|/g, '।');
    // Match sentence blocks ending with full stop (.), puranviram (।), !, or ?
    const matches = normalizedText.match(/[^.।!?]+[.।!?]*/g) || [];
    return matches.map(s => s.trim()).filter(s => s.length > 0);
  }

  speakWebSpeechAPIQueue(sentences, lang = this.lang) {
    this.stop();

    if (!sentences || sentences.length === 0) return;

    if (!this.synth && typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
    }

    if (this.synth) {
      try {
        this.synth.cancel();
        this.synth.resume();
      } catch (e) {}
    }

    this.isSpeaking = true;
    this.updateUIState(true);

    let idx = 0;
    this.loadVoices();
    const voice = this.getBestVoice(lang);
    const PAUSE_DURATION_MS = 80; // Decreased pause after puranviram (। / |) for fast, continuous speech flow

    // Store utterances in array to prevent Chrome V8 Garbage Collection mid-speech!
    this.activeUtterances = [];

    const speakNextSentence = () => {
      if (!this.isSpeaking) return;
      if (idx >= sentences.length) {
        this.isSpeaking = false;
        this.activeUtterances = [];
        this.updateUIState(false);
        return;
      }

      const sentenceText = sentences[idx++];
      const utterance = new SpeechSynthesisUtterance(sentenceText);
      this.activeUtterances.push(utterance); // Prevent GC
      
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || (lang === 'hi' ? 'hi' : 'en');
      } else {
        utterance.lang = (lang === 'hi') ? 'hi' : 'en';
      }

      utterance.rate = 1.0; // Strict constant speaking speed
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        if (!this.isSpeaking) return;
        this.pauseTimer = setTimeout(() => {
          if (this.isSpeaking) {
            speakNextSentence();
          }
        }, PAUSE_DURATION_MS);
      };

      utterance.onerror = (e) => {
        console.warn("Web Speech API sentence error:", e);
        if (!this.isSpeaking) return;
        this.pauseTimer = setTimeout(() => {
          if (this.isSpeaking) {
            speakNextSentence();
          }
        }, PAUSE_DURATION_MS);
      };

      try {
        this.synth.speak(utterance);
        if (this.synth.paused) {
          this.synth.resume();
        }
      } catch (e) {
        console.error("Speech Synthesis exception:", e);
        this.speakAudioFallback(sentences.join(' '), lang);
      }
    };

    setTimeout(() => {
      if (this.isSpeaking) {
        speakNextSentence();
      }
    }, 40);
  }

  speakAudioFallback(text, lang = 'hi') {
    this.stop();
    if (!text) return;

    const sentences = this.splitIntoSentences(text);
    if (sentences.length === 0) return;

    this.isSpeaking = true;
    this.updateUIState(true);

    const targetLang = (lang === 'hi') ? 'hi' : 'en';
    let idx = 0;
    const PAUSE_DURATION_MS = 80; // Decreased pause for audio stream fallback

    const playNext = () => {
      if (!this.isSpeaking) return;
      if (idx >= sentences.length) {
        this.isSpeaking = false;
        this.updateUIState(false);
        return;
      }

      const sentenceText = sentences[idx++];
      const encoded = encodeURIComponent(sentenceText);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${targetLang}&client=tw-ob&q=${encoded}`;

      this.audioFallback = new Audio();
      this.audioFallback.src = url;
      this.audioFallback.playbackRate = 1.0; // Strict constant playback rate

      this.audioFallback.onended = () => {
        if (!this.isSpeaking) return;
        this.pauseTimer = setTimeout(() => {
          if (this.isSpeaking) playNext();
        }, PAUSE_DURATION_MS);
      };

      this.audioFallback.onerror = () => {
        if (!this.isSpeaking) return;
        this.pauseTimer = setTimeout(() => {
          if (this.isSpeaking) playNext();
        }, PAUSE_DURATION_MS);
      };

      const p = this.audioFallback.play();
      if (p !== undefined) {
        p.catch(e => {
          console.warn("Audio fallback error:", e);
          if (this.isSpeaking) playNext();
        });
      }
    };

    playNext();
  }

  stop() {
    this.isSpeaking = false;
    this.activeUtterances = [];

    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }

    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }

    if (this.audioFallback) {
      try {
        this.audioFallback.onended = null;
        this.audioFallback.onerror = null;
        this.audioFallback.pause();
        this.audioFallback.currentTime = 0;
      } catch (e) {}
      this.audioFallback = null;
    }

    this.updateUIState(false);
  }

  toggle(data = this.currentData) {
    if (this.isSpeaking) {
      this.stop();
    } else if (data) {
      this.speak(data);
    }
  }

  updateTranscriptPreview(data) {
    const transcriptEl = document.getElementById('speaker-transcript-text');
    if (!data) data = this.currentData || (typeof currentWeatherData !== 'undefined' ? currentWeatherData : null);
    if (transcriptEl && data) {
      transcriptEl.textContent = this.generateSpeechText(data, this.lang);
    }
  }

  updateUIState(speaking) {
    const playBtn = document.getElementById('speaker-play-btn');
    const btnIcon = document.getElementById('speaker-btn-icon');
    const btnText = document.getElementById('speaker-btn-text');
    const waveAnim = document.getElementById('speaker-wave-anim');
    const pulseIcon = document.getElementById('speaker-pulse-icon');
    const navSpeakerBtn = document.getElementById('speaker-nav-btn');

    if (speaking) {
      if (playBtn) playBtn.classList.add('speaking');
      if (btnIcon) btnIcon.setAttribute('data-lucide', 'square');
      if (btnText) btnText.textContent = this.lang === 'hi' ? 'रोकें (Stop Speech)' : 'Stop Weather Report';
      if (waveAnim) waveAnim.classList.remove('hidden');
      if (pulseIcon) pulseIcon.classList.add('pulsing');
      if (navSpeakerBtn) navSpeakerBtn.classList.add('active');
    } else {
      if (playBtn) playBtn.classList.remove('speaking');
      if (btnIcon) btnIcon.setAttribute('data-lucide', 'volume-2');
      if (btnText) btnText.textContent = this.lang === 'hi' ? 'मौसम रिपोर्ट सुनें (Speak Report)' : 'Speak Weather Report';
      if (waveAnim) waveAnim.classList.add('hidden');
      if (pulseIcon) pulseIcon.classList.remove('pulsing');
      if (navSpeakerBtn) navSpeakerBtn.classList.remove('active');
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  updateWidgetData(data) {
    if (!data) data = this.currentData || (typeof currentWeatherData !== 'undefined' && currentWeatherData ? currentWeatherData : null);
    if (!data && typeof WeatherAPI !== 'undefined') {
      const activeCity = (typeof currentCity !== 'undefined' && currentCity) ? currentCity : { name: "New Delhi", state: "Delhi NCR", region: "Capital Metro", lat: 28.6139, lon: 77.2090 };
      data = WeatherAPI.generateFallbackData(activeCity);
    }
    if (!data) return;

    this.currentData = data;
    const tempEl = document.getElementById('speaker-chip-temp');
    const windEl = document.getElementById('speaker-chip-wind');
    const aqiEl = document.getElementById('speaker-chip-aqi');
    const rainTimeEl = document.getElementById('speaker-chip-rain-time') || document.getElementById('speaker-chip-rain');
    const rainSpeedEl = document.getElementById('speaker-chip-rain-speed');
    const rainAmountEl = document.getElementById('speaker-chip-rain-amount');

    const rInfo = data.rainInfo || (typeof WeatherAPI !== 'undefined' ? WeatherAPI.getRainIntensityInfo(data.precipitation || 0, data.condition) : null);

    const tempVal = (typeof data.temp === 'number' && !isNaN(data.temp)) ? data.temp : 31;
    const windVal = (typeof data.windSpeed === 'number' && !isNaN(data.windSpeed)) ? data.windSpeed : 14;

    if (tempEl) tempEl.textContent = `${tempVal}°C`;
    if (windEl) windEl.textContent = `${windVal} km/h`;

    const aqiObj = data.aqi || {};
    const cityName = data.city || "New Delhi";
    const defaultAqi = (cityName === "New Delhi" || cityName === "Ghaziabad" || cityName === "Kanpur" || cityName === "Patna") ? 220 : 85;
    const aqiVal = (typeof aqiObj.value === 'number' && !isNaN(aqiObj.value) && aqiObj.value > 0) ? aqiObj.value : defaultAqi;
    const statusLabel = (typeof aqiObj.status === 'object' && aqiObj.status !== null) ? (aqiObj.status.label || 'Moderate') : (typeof aqiObj.status === 'string' ? aqiObj.status : (aqiVal > 200 ? 'Poor' : 'Moderate'));
    
    if (aqiEl) {
      aqiEl.textContent = `${aqiVal} (${statusLabel})`;
    }

    if (rainTimeEl) {
      let shortRain = "No Active Rain";
      if (rInfo && rInfo.isRaining) {
        shortRain = "Raining Now";
      } else if (rInfo && rInfo.amountMm > 0) {
        shortRain = "Rain Stopped";
      } else if (data.hourly && Array.isArray(data.hourly)) {
        const rHour = data.hourly.find(h => h && (h.pop >= 30 || (h.condition && h.condition.toLowerCase().includes('rain'))));
        if (rHour) {
          shortRain = `${rHour.time}`;
        }
      }
      rainTimeEl.textContent = shortRain;
    }

    if (rainSpeedEl) {
      rainSpeedEl.textContent = rInfo ? (rInfo.speedText || `${(data.precipitation || 0).toFixed(1)} mm/h`) : "0.0 mm/h";
    }

    if (rainAmountEl) {
      rainAmountEl.textContent = rInfo ? (rInfo.amountText || "0.0 mm (0.00 cm)") : "0.0 mm (0.00 cm)";
    }

    this.updateTranscriptPreview(data);

    if (this.isSpeaking) {
      this.speak(data);
    }
  }
}
