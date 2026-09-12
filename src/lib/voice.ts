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

/**
 * Deduplicates speech recognition results, eliminating:
 * 1. Mobile Chrome cumulative interim/final repetition ("aata aata daal")
 * 2. Overlapping phrases between speech segments
 * 3. Exact repeating sentences or phrases
 */
export function cleanDeduplicateSpeech(existing: string, incomingChunk: string): string {
  const normExisting = existing.trim();
  const normNew = incomingChunk.trim();

  if (!normExisting) return removeStutteredWords(normNew);
  if (!normNew) return removeStutteredWords(normExisting);

  // If new chunk is identical to existing
  if (normExisting.toLowerCase() === normNew.toLowerCase()) {
    return removeStutteredWords(normExisting);
  }

  // Android Chrome cumulative interim bug: incoming is a superset that starts with existing
  if (normNew.toLowerCase().startsWith(normExisting.toLowerCase())) {
    return removeStutteredWords(normNew);
  }

  // If existing already ends with incoming
  if (normExisting.toLowerCase().endsWith(normNew.toLowerCase())) {
    return removeStutteredWords(normExisting);
  }

  // If existing already contains incoming as a distinct phrase
  if (normExisting.toLowerCase().includes(normNew.toLowerCase())) {
    return removeStutteredWords(normExisting);
  }

  // Check word-level overlap at the seam
  const existingWords = normExisting.split(/\s+/);
  const newWords = normNew.split(/\s+/);

  let maxOverlap = 0;
  for (let len = 1; len <= Math.min(existingWords.length, newWords.length); len++) {
    const tail = existingWords.slice(-len).join(" ").toLowerCase();
    const head = newWords.slice(0, len).join(" ").toLowerCase();
    if (tail === head) {
      maxOverlap = len;
    }
  }

  let merged = "";
  if (maxOverlap > 0) {
    const remaining = newWords.slice(maxOverlap).join(" ");
    merged = remaining ? `${normExisting} ${remaining}` : normExisting;
  } else {
    // Check if ends with punctuation
    const sep = /[,।\n.]$/.test(normExisting) ? " " : ", ";
    merged = `${normExisting}${sep}${normNew}`;
  }

  return removeStutteredWords(merged);
}

/**
 * Removes immediate consecutive duplicate words/tokens (e.g. "चीनी चीनी" -> "चीनी", "kilo kilo" -> "kilo")
 */
export function removeStutteredWords(text: string): string {
  if (!text) return "";
  const tokens = text.split(/\s+/);
  const cleaned: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const curr = tokens[i]!;
    if (!curr) continue;
    const prev = cleaned[cleaned.length - 1];

    // Normalize for comparison (remove basic trailing punctuation like commas for equality check)
    const currClean = curr.replace(/[,।.!]/g, "").toLowerCase();
    const prevClean = prev ? prev.replace(/[,।.!]/g, "").toLowerCase() : "";

    if (prevClean && currClean === prevClean) {
      // Skip identical consecutive stutter
      continue;
    }
    cleaned.push(curr);
  }

  return cleaned.join(" ");
}

/**
 * Formats a raw spoken grocery string into individual clean product lines/chips.
 * Splits on commas, newlines, full stops (।), and conjunctions ("और", "and", "evam").
 */
export function formatSpokenGroceryList(text: string): string[] {
  if (!text || !text.trim()) return [];

  const rawParts = text
    .split(/[\n,|।]+|\s+(?:aur|और|एवं|and|\+)\s+/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 1);

  const uniqueItems: string[] = [];
  const seen = new Set<string>();

  for (const part of rawParts) {
    const key = part.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(part);
    }
  }

  return uniqueItems;
}

