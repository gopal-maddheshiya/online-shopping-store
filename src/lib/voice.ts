/**
 * Voice Assistant & Speech Synthesis (TTS) Engine
 * Store: Arun Gopal Traders, Ramnagar Chauraha, Adda Bazar
 * 
 * Provides natural Hindi / English voice responses and speech recognition
 * so rural and elderly shoppers receive spoken audio feedback.
 */

// Voice Audio Chime using Web Audio API
export function playMicTone(type: "start" | "success" | "stop"): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "start") {
      // Pleasant rising blip (C5 -> G5)
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "stop") {
      // Soft descending blip
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(440.0, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else {
      // Success bell
      osc.type = "triangle";
      osc.frequency.setValueAtTime(784.0, now);
      osc.frequency.setValueAtTime(1046.5, now + 0.1);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    // Ignore audio context restrictions
  }
}

/**
 * Speaks message to the customer using Web Speech Synthesis.
 */
export function speakVoiceConfirmation(
  type: "task_done" | "items_matched" | "listening" | string,
  lang: "hi" | "en" = "hi",
  onEnd?: () => void
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    // Cancel any previous utterance to avoid overlap
    window.speechSynthesis.cancel();

    let spokenText = type;
    if (type === "task_done") {
      spokenText =
        lang === "hi"
          ? "आपके कहे अनुसार यह काम हो गया! सारा सामान आपके थैले में जोड़ दिया गया है।"
          : "As requested, all items have been successfully added to your cart!";
    } else if (type === "items_matched") {
      spokenText =
        lang === "hi"
          ? "आपके कहे अनुसार सामान की लिस्ट तैयार कर दी गई है। कृपया जांच लें।"
          : "As requested, your grocery list has been prepared. Please review.";
    } else if (type === "listening") {
      spokenText =
        lang === "hi"
          ? "बोलिए, मैं सुन रहा हूँ..."
          : "Please speak, I am listening...";
    }

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.95; // Friendly, clear pace
    utterance.pitch = 1.0;

    // Pick a natural Hindi / Indian English voice if present in system
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      if (lang === "hi") {
        const hindiVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith("hi") ||
            v.lang.toLowerCase().includes("hin") ||
            v.name.toLowerCase().includes("hindi")
        );
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        const enVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith("en-in") ||
            v.name.toLowerCase().includes("india")
        );
        if (enVoice) utterance.voice = enVoice;
      }
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis error:", err);
    if (onEnd) onEnd();
  }
}

/**
 * Returns whether SpeechRecognition is available in the current browser.
 */
export function isSpeechRecognitionAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );
}
