/* ==========================================================================
   SAVDOGAR DAFTARI — Robust Audio & Speech Engine
   Clean Web Speech API lifecycle, zero hardware conflicts, realtime visualizer
   ========================================================================== */

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.micStream = null;
    this.recognition = null;
    this.isRecording = false;
    this.soundEnabled = true;
    this.animFrameId = null;
    this.currentLang = 'uz-UZ'; // 'uz-UZ' or 'ru-RU'

    this.checkSupport();
  }

  checkSupport() {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  setLanguage(langCode) {
    this.currentLang = langCode;
  }

  /* -------------------------------------------------------------
     1. Web Speech API Recognition
  ------------------------------------------------------------- */
  startListening(callbacks = {}) {
    const { onStart, onResult, onEnd, onError } = callbacks;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onError) onError("Brauzeringiz ovozli tanishni qo'llab-quvvatlamaydi. Iltimos, Google Chrome yoki Microsoft Edge orqali oching.");
      return false;
    }

    // Abort any existing instance to ensure fresh clean state
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
      this.recognition = null;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = this.currentLang || 'uz-UZ';
      this.recognition.continuous = false; // Single clean utterance (most reliable on desktop & mobile)
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.isRecording = true;
      let finalResultString = '';

      this.recognition.onstart = () => {
        this.playPop();
        if (onStart) onStart();
      };

      this.recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalResultString += ' ' + trans;
          } else {
            interim += trans;
          }
        }

        const fullText = (finalResultString + ' ' + interim).trim();
        if (onResult) {
          onResult({
            interim: interim,
            final: finalResultString.trim(),
            text: fullText
          });
        }
      };

      this.recognition.onerror = (event) => {
        console.warn("Speech error event:", event.error);
        if (event.error === 'not-allowed') {
          if (onError) onError("Mikrofonga ruxsat berilmadi. Iltimos, brauzeringizda mikrofonga ruxsat bering.");
        } else if (event.error === 'network') {
          if (onError) onError("Internetga ulanishda xatolik. Brauzer nutq serveriga ulanolmadi.");
        } else if (event.error === 'no-speech') {
          if (onError) onError("Ovoz eshitilmadi. Qaytadan gapiring.");
        } else {
          if (onError) onError(`Xatolik: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        if (onEnd) onEnd(finalResultString.trim());
      };

      this.recognition.start();
      return true;
    } catch (err) {
      console.error("SpeechRecognition start exception:", err);
      this.isRecording = false;
      if (onError) onError(err.message);
      return false;
    }
  }

  stopListening() {
    this.isRecording = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.stopVisualizer();
  }

  /* -------------------------------------------------------------
     2. Canvas Waveform Audio Visualizer
  ------------------------------------------------------------- */
  startVisualizer(canvasElement) {
    if (!canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    const width = canvasElement.width = canvasElement.offsetWidth * 2;
    const height = canvasElement.height = canvasElement.offsetHeight * 2;

    const draw = () => {
      this.animFrameId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      const barCount = 32;
      const barWidth = (width / barCount) * 0.6;
      const barSpacing = (width / barCount) * 0.4;
      const time = Date.now() * 0.007;

      for (let i = 0; i < barCount; i++) {
        // Smooth organic audio wave animation
        const sinVal = Math.sin(time + i * 0.28) * 0.5 + 0.5;
        const barHeight = Math.max(10, sinVal * (height * 0.75));

        const x = i * (barWidth + barSpacing) + barSpacing / 2;
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#10b981');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 6);
        ctx.fill();
      }
    };

    draw();
  }

  stopVisualizer() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /* -------------------------------------------------------------
     3. Web Audio API Sounds
  ------------------------------------------------------------- */
  playChimeSuccess() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.28);

      gainNode.gain.setValueAtTime(0.18, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.12);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch (e) {
      console.warn("Sound error", e);
    }
  }

  playCashPaid() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);

      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn("Sound error", e);
    }
  }

  playPop() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      console.warn("Sound error", e);
    }
  }

  playWarning() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn("Sound error", e);
    }
  }
}

// Global instance
window.AudioEngine = new AudioEngine();
