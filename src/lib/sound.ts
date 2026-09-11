/**
 * Sound Alert Utility for Store Order Notifications
 * Store: Arun Gopal Traders, Maharajganj
 * Uses Web Audio API to synthesize a clean, dual-tone cash/bell chime
 * completely offline with zero external audio assets.
 */

const SOUND_STORAGE_KEY = "agt_order_sound_enabled";

export function isOrderSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const val = window.localStorage.getItem(SOUND_STORAGE_KEY);
    return val !== "false";
  } catch {
    return true;
  }
}

export function setOrderSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "true" : "false");
    window.dispatchEvent(
      new CustomEvent("agt:order-sound-changed", { detail: { enabled } })
    );
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Synthesizes a crisp, friendly 2-tone melodic chime (G5: 784Hz -> C6: 1046.5Hz).
 * Safe against autoplay restrictions by checking AudioContext state.
 */
export function playNewOrderChime(): void {
  if (typeof window === "undefined") return;

  if (!isOrderSoundEnabled()) return;

  try {
    // Trigger subtle vibration on mobile devices
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // Vibration not allowed or unsupported
      }
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    // Tone 1: High G (784 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(784, now);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Tone 2: Melodic High C (1046.5 Hz) for bright notification feel
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1046.5, now + 0.14);
    gain2.gain.setValueAtTime(0.32, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.85);

    // Auto close context after chime finishes to release hardware audio channel
    setTimeout(() => {
      try {
        void ctx.close();
      } catch {
        // Context already closed
      }
    }, 1200);
  } catch (err) {
    console.warn("[Sound] Could not play notification chime:", err);
  }
}
