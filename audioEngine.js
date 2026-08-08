class WeatherAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.currentCategory = "sunny";
    this.gainNode = null;
    this.noiseNode = null;
    this.birdTimer = null;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start(this.currentCategory);
      return true;
    }
  }

  start(category = "sunny") {
    this.initContext();
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    
    this.stop(); // Clear previous active sounds
    this.currentCategory = category;
    this.isPlaying = true;

    // Buffer noise for atmospheric wind / rain
    const bufferSize = this.audioCtx.sampleRate * 2;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.whiteNoise = this.audioCtx.createBufferSource();
    this.whiteNoise.buffer = noiseBuffer;
    this.whiteNoise.loop = true;

    this.filter = this.audioCtx.createBiquadFilter();
    this.gainNode = this.audioCtx.createGain();

    if (category === "rainy" || category === "storm") {
      // Rain noise settings (Lowpass filter ~900Hz)
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 900;
      this.gainNode.gain.setValueAtTime(0.18, this.audioCtx.currentTime);

      // Add occasional thunder rumble for storm
      if (category === "storm") {
        this.scheduleThunder();
      }
    } else if (category === "sunny") {
      // Gentle sun breeze (~350Hz) + Bird chirps
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 350;
      this.gainNode.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      this.scheduleBirdChirps();
    } else {
      // Cloudy / Fog / Snow (Soft wind whistle ~500Hz)
      this.filter.type = 'bandpass';
      this.filter.frequency.value = 450;
      this.filter.Q.value = 3.0;
      this.gainNode.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
    }

    this.whiteNoise.connect(this.filter);
    this.filter.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);

    this.whiteNoise.start();
  }

  scheduleBirdChirps() {
    if (!this.isPlaying || this.currentCategory !== "sunny") return;

    // Synthesize procedural bird chirp using sine wave frequency sweep
    const playChirp = () => {
      if (!this.isPlaying || this.currentCategory !== "sunny" || !this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const chirpGain = this.audioCtx.createGain();

      osc.type = 'sine';
      const now = this.audioCtx.currentTime;

      // Frequency glide from 2000Hz to 3200Hz back to 2400Hz
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(3400, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(2600, now + 0.15);

      chirpGain.gain.setValueAtTime(0.05, now);
      chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(chirpGain);
      chirpGain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    };

    // Trigger bird chirps every 3 to 6 seconds randomly
    const interval = 3000 + Math.random() * 3000;
    this.birdTimer = setTimeout(() => {
      playChirp();
      this.scheduleBirdChirps();
    }, interval);
  }

  scheduleThunder() {
    if (!this.isPlaying || this.currentCategory !== "storm") return;

    const playThunder = () => {
      if (!this.isPlaying || !this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const thunderGain = this.audioCtx.createGain();

      osc.type = 'triangle';
      const now = this.audioCtx.currentTime;

      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 1.5);

      thunderGain.gain.setValueAtTime(0.25, now);
      thunderGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(thunderGain);
      thunderGain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 1.8);
    };

    setTimeout(() => {
      playThunder();
    }, 2000 + Math.random() * 4000);
  }

  setSoundType(category) {
    this.currentCategory = category;
    if (this.isPlaying) {
      this.start(category);
    }
  }

  stop() {
    if (this.birdTimer) clearTimeout(this.birdTimer);
    if (this.whiteNoise) {
      try {
        this.whiteNoise.stop();
        this.whiteNoise.disconnect();
      } catch (e) {}
      this.whiteNoise = null;
    }
    this.isPlaying = false;
  }
}
