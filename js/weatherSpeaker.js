class WeatherSpeaker {
  constructor() {
    this.synth = window.speechSynthesis;
    this.lang = 'en'; // 'en' or 'hi'
    this.isSpeaking = false;
    this.currentData = null;
    this.voices = [];
    this.audioFallback = null;

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

    if (this.synth) {
      this.loadVoices();
      if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  setLanguage(lang) {
    if (this.lang === lang) return;
    this.lang = lang;
    
    // Update language buttons active state in UI
    const enBtn = document.getElementById('speaker-lang-en');
    const hiBtn = document.getElementById('speaker-lang-hi');
    if (enBtn && hiBtn) {
      if (lang === 'en') {
        enBtn.classList.add('active');
        hiBtn.classList.remove('active');
      } else {
        hiBtn.classList.add('active');
        enBtn.classList.remove('active');
      }
    }

    if (this.isSpeaking) {
      this.stop();
      if (this.currentData) {
        setTimeout(() => this.speak(this.currentData), 100);
      }
    } else if (this.currentData) {
      this.updateTranscriptPreview(this.currentData);
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

  getRainInfo(data, lang) {
    const isRainingNow = data.precipitation > 0 || 
      (data.condition && (
        data.condition.toLowerCase().includes('rain') || 
        data.condition.toLowerCase().includes('drizzle') ||
        data.condition.toLowerCase().includes('storm') ||
        data.condition.toLowerCase().includes('downpour')
      ));

    if (isRainingNow) {
      return lang === 'hi' ? "अभी बारिश जारी है।" : "Rain active.";
    }

    if (data.hourly && data.hourly.length > 0) {
      const rainHour = data.hourly.find(h => h.pop >= 30 || (h.condition && h.condition.toLowerCase().includes('rain')));
      if (rainHour) {
        if (lang === 'hi') {
          return `${rainHour.time} बजे बारिश का अनुमान है।`;
        } else {
          return `Rain likely around ${rainHour.time}.`;
        }
      }
    }

    return lang === 'hi' ? "आज बारिश की संभावना कम है।" : "No heavy rain expected today.";
  }

  generateSpeechText(data, lang = this.lang) {
    if (!data) return "";

    const cityName = data.city;
    const temp = data.temp;
    const windSpeed = data.windSpeed;
    const condition = data.condition || "";
    const aqiVal = data.aqi ? data.aqi.value : "--";
    const aqiLabel = data.aqi ? data.aqi.status.label : "Moderate";

    if (lang === 'hi') {
      const cityHi = this.getHindiCityName(cityName);
      const conditionHi = this.getHindiCondition(condition);
      const aqiLabelHi = this.getHindiAqiLabel(aqiLabel);
      const rainTextHi = this.getRainInfo(data, 'hi');
      
      // Brief, crisp Hindi speech without duplicate words
      return `${cityHi} में तापमान ${temp} डिग्री सेल्सियस है। ${conditionHi}। हवा की गति ${windSpeed} किलोमीटर प्रति घंटा है। वायु गुणवत्ता सूचकांक ${aqiVal} यानी ${aqiLabelHi} है। ${rainTextHi}`;
    } else {
      const rainTextEn = this.getRainInfo(data, 'en');
      // Brief, crisp English speech
      return `In ${cityName}, temperature is ${temp}°C with ${condition}. Wind speed ${windSpeed} km/h. AQI is ${aqiVal}, ${aqiLabel}. ${rainTextEn}`;
    }
  }

  getBestVoice(lang) {
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }
    
    if (lang === 'hi') {
      const hiVoice = this.voices.find(v => 
        v.lang.toLowerCase().includes('hi') || 
        v.name.toLowerCase().includes('hindi') ||
        v.name.toLowerCase().includes('hi-in')
      );
      if (hiVoice) return hiVoice;
    } else {
      const enIndVoice = this.voices.find(v => v.lang.toLowerCase() === 'en-in' || v.lang.toLowerCase().includes('en-in'));
      if (enIndVoice) return enIndVoice;
      const enVoice = this.voices.find(v => v.lang.toLowerCase().includes('en'));
      if (enVoice) return enVoice;
    }
    return null;
  }

  speak(data) {
    this.currentData = data;
    this.stop(); // Thoroughly clear any running audio / synth queue

    const text = this.generateSpeechText(data, this.lang);
    this.updateTranscriptPreview(data);

    const voice = this.getBestVoice(this.lang);

    // If Hindi and no native browser voice is installed, use Google TTS Web Audio Stream fallback
    if (this.lang === 'hi' && !voice) {
      this.speakAudioFallback(text, 'hi');
      return;
    }

    if (!this.synth) {
      this.speakAudioFallback(text, this.lang);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 1.05; // Natural speech rate
    utterance.pitch = 1.0;

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.updateUIState(true);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.updateUIState(false);
    };

    utterance.onerror = (err) => {
      console.warn("SpeechSynthesis error, falling back to Web Audio TTS:", err);
      this.isSpeaking = false;
      this.updateUIState(false);
      this.speakAudioFallback(text, this.lang);
    };

    try {
      this.synth.speak(utterance);
    } catch (e) {
      this.speakAudioFallback(text, this.lang);
    }
  }

  speakAudioFallback(text, lang = 'hi') {
    this.stop();

    // Split text into distinct sentences for streaming audio chunks
    const chunks = text.split(/[।.]+/).map(s => s.trim()).filter(s => s.length > 0);
    if (chunks.length === 0) return;

    this.isSpeaking = true;
    this.updateUIState(true);

    let currentIndex = 0;

    const playNextChunk = () => {
      if (!this.isSpeaking) return;
      if (currentIndex >= chunks.length) {
        this.isSpeaking = false;
        this.updateUIState(false);
        return;
      }

      const chunk = chunks[currentIndex++];
      const encoded = encodeURIComponent(chunk);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encoded}`;

      this.audioFallback = new Audio(url);
      
      this.audioFallback.onended = () => {
        if (this.isSpeaking) playNextChunk();
      };

      this.audioFallback.onerror = () => {
        console.warn("Audio stream error for chunk:", chunk);
        if (this.isSpeaking) playNextChunk();
      };

      this.audioFallback.play().catch(e => {
        console.warn("Audio play prevented:", e);
        this.isSpeaking = false;
        this.updateUIState(false);
      });
    };

    playNextChunk();
  }

  stop() {
    this.isSpeaking = false;

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
    this.currentData = data;
    const tempEl = document.getElementById('speaker-chip-temp');
    const windEl = document.getElementById('speaker-chip-wind');
    const aqiEl = document.getElementById('speaker-chip-aqi');
    const rainEl = document.getElementById('speaker-chip-rain');

    if (tempEl) tempEl.textContent = `${data.temp}°C`;
    if (windEl) windEl.textContent = `${data.windSpeed} km/h`;
    if (aqiEl) {
      const statusLabel = data.aqi ? data.aqi.status.label : "--";
      aqiEl.textContent = `${data.aqi ? data.aqi.value : "--"} (${statusLabel})`;
    }
    if (rainEl) {
      let shortRain = "No Rain";
      if (data.precipitation > 0) {
        shortRain = "Raining Now";
      } else if (data.hourly) {
        const rHour = data.hourly.find(h => h.pop >= 30);
        if (rHour) {
          shortRain = `${rHour.time} (${rHour.pop}%)`;
        }
      }
      rainEl.textContent = shortRain;
    }

    this.updateTranscriptPreview(data);

    if (this.isSpeaking) {
      this.speak(data);
    }
  }
}
