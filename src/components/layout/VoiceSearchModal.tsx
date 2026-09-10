import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Mic, X, Check, RefreshCw, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
  stop: () => void;
}

function getSpeechRecognitionConstructor(): (new () => ISpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    SpeechRecognition?: new () => ISpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => ISpeechRecognitionInstance;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

const STORE_SUGGESTIONS = [
  { hi: "बैल कोल्हू तेल", en: "Bail Kolhu Oil" },
  { hi: "गुड़ और चीनी", en: "Gud & Chini" },
  { hi: "चायपत्ती", en: "Chaypatti" },
  { hi: "बासमती चावल", en: "Basmati Chawal" },
  { hi: "अमूल दूध", en: "Amul Doodh" },
];

export function VoiceSearchModal({ isOpen, onClose, onSearch }: VoiceSearchModalProps) {
  const { lang: appLang } = useLanguage();
  const [activeLang, setActiveLang] = useState<"hi" | "en">(appLang === "hi" ? "hi" : "en");
  const [mounted, setMounted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittedRef = useRef<boolean>(false);
  const transcriptRef = useRef<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronize active language with app language when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveLang(appLang === "hi" ? "hi" : "en");
    }
  }, [isOpen, appLang]);

  const triggerSearch = useCallback(
    (queryToSearch: string) => {
      const clean = queryToSearch.trim();
      if (!clean || isSubmittedRef.current) return;
      isSubmittedRef.current = true;
      setIsSearching(true);
      setIsListening(false);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      // Small delay so user sees full recognized words with checkmark before redirect
      setTimeout(() => {
        onSearch(clean);
        onClose();
      }, 450);
    },
    [onSearch, onClose]
  );

  const cleanUp = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  const startListening = useCallback(
    (overrideLang?: "hi" | "en") => {
      cleanUp();
      isSubmittedRef.current = false;
      setIsSearching(false);
      setErrorState(null);

      const targetLang = overrideLang || activeLang;
      const SpeechConstructor = getSpeechRecognitionConstructor();

      if (!SpeechConstructor) {
        setErrorState(
          targetLang === "hi"
            ? "इस ब्राउज़र में वॉयस सर्च की सुविधा उपलब्ध नहीं है। कृपया Google Chrome या Edge का उपयोग करें।"
            : "Voice search is not supported in this browser. Please use Chrome or Edge."
        );
        setIsListening(false);
        return;
      }

      try {
        const recognition = new SpeechConstructor();
        recognitionRef.current = recognition;

        // Use continuous = false for maximum mobile Chrome compatibility
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = targetLang === "hi" ? "hi-IN" : "en-IN";
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          setIsListening(true);
          setErrorState(null);
        };

        recognition.onresult = (event: ISpeechRecognitionEvent) => {
          let interimText = "";
          let finalDetected = false;

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res && res[0]) {
              interimText += res[0].transcript;
              if (res.isFinal) {
                finalDetected = true;
              }
            }
          }

          const trimmed = interimText.trim();
          if (trimmed) {
            setTranscript(trimmed);
            transcriptRef.current = trimmed;

            if (finalDetected) {
              // Once recognition flags final utterance, trigger search promptly
              triggerSearch(trimmed);
            } else {
              // For streaming interim words, wait 1200ms of silence before submitting
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
              }
              silenceTimerRef.current = setTimeout(() => {
                if (transcriptRef.current.trim() && !isSubmittedRef.current) {
                  triggerSearch(transcriptRef.current.trim());
                }
              }, 1200);
            }
          }
        };

        recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
          console.warn("Speech recognition event error:", event.error);

          if (event.error === "no-speech") {
            // User was quiet, don't show red error, let onend handle graceful prompt
            return;
          }

          setIsListening(false);

          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setErrorState(
              targetLang === "hi"
                ? "माइक्रोफ़ोन अनुमति बंद है। कृपया अपने ब्राउज़र में ऊपर 🔒 या Settings पर क्लिक करके Mic Allow करें।"
                : "Microphone blocked. Please allow microphone permission in your browser address bar."
            );
          } else if (event.error === "network") {
            setErrorState(
              targetLang === "hi"
                ? "इंटरनेट कनेक्शन में समस्या है। कृपया नेटवर्क चेक करें।"
                : "Network error. Please check your internet connection."
            );
          } else if (event.error === "audio-capture") {
            setErrorState(
              targetLang === "hi"
                ? "माइक्रोफ़ोन नहीं मिला या किसी अन्य ऐप द्वारा उपयोग हो रहा है।"
                : "No microphone detected or it is in use by another app."
            );
          } else {
            setErrorState(
              targetLang === "hi"
                ? "आवाज़ नहीं पहचान सके। कृपया दोबारा बोलें।"
                : "Couldn't recognize voice. Please try again."
            );
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          // If speech finished and we captured words, auto-search
          if (transcriptRef.current.trim() && !isSubmittedRef.current) {
            triggerSearch(transcriptRef.current.trim());
          }
        };

        recognition.start();
      } catch (err) {
        console.error("Speech recognition startup error:", err);
        setIsListening(false);
        setErrorState(
          targetLang === "hi"
            ? "माइक चालू करने के लिए नीचे गोल बटन पर दोबारा टैप करें।"
            : "Tap the microphone button below to start speaking."
        );
      }
    },
    [activeLang, cleanUp, triggerSearch]
  );

  // Manage modal lifecycle
  useEffect(() => {
    if (!isOpen) {
      cleanUp();
      setTranscript("");
      transcriptRef.current = "";
      isSubmittedRef.current = false;
      setIsSearching(false);
      setErrorState(null);
      setIsListening(false);
      return;
    }

    // Auto-start listening on open
    startListening();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
      cleanUp();
    };
  }, [isOpen, startListening, cleanUp]);

  function switchLang(newLang: "hi" | "en") {
    setActiveLang(newLang);
    setTranscript("");
    transcriptRef.current = "";
    startListening(newLang);
  }

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#E5E0D5] text-center animate-in zoom-in-95 duration-200 cursor-default my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-[#FAF8F2] hover:bg-[#EAE6DC] text-[#5A655F] hover:text-[#16201A] transition-colors cursor-pointer shadow-2xs"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Language Switcher Pill */}
        <div className="flex items-center justify-center gap-1 mb-4">
          <div className="inline-flex rounded-full bg-[#FAF8F2] p-1 border border-[#E5E0D5]">
            <button
              type="button"
              onClick={() => switchLang("hi")}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                activeLang === "hi"
                  ? "bg-[#145A45] text-white shadow-xs"
                  : "text-[#5A655F] hover:text-[#16201A]"
              }`}
            >
              हिन्दी (Hindi)
            </button>
            <button
              type="button"
              onClick={() => switchLang("en")}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                activeLang === "en"
                  ? "bg-[#145A45] text-white shadow-xs"
                  : "text-[#5A655F] hover:text-[#16201A]"
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Big Animated Microphone Button */}
        <div className="relative my-5 flex items-center justify-center">
          {isListening && !isSearching && (
            <>
              <div className="absolute size-36 rounded-full bg-[#145A45]/15 animate-ping duration-1000 pointer-events-none" />
              <div className="absolute size-28 rounded-full bg-[#145A45]/25 animate-pulse duration-700 pointer-events-none" />
            </>
          )}

          <button
            type="button"
            onClick={() => startListening()}
            className={`relative z-10 flex size-24 items-center justify-center rounded-full shadow-xl transition-all active:scale-95 cursor-pointer ${
              isSearching
                ? "bg-[#15803D] text-white ring-4 ring-emerald-200"
                : isListening
                ? "bg-gradient-to-tr from-[#145A45] via-[#1A6E55] to-[#248A6C] text-white ring-4 ring-[#E6EFE8]"
                : "bg-[#FAF8F2] text-[#145A45] border-2 border-[#145A45]/30 hover:border-[#145A45] hover:bg-white"
            }`}
            title={activeLang === "hi" ? "बोलने के लिए दबाएं" : "Tap to speak"}
          >
            {isSearching ? (
              <Check className="size-11 text-white animate-bounce" />
            ) : (
              <Mic className={`size-11 ${isListening ? "animate-pulse" : ""}`} />
            )}
          </button>
        </div>

        {/* Dynamic Sound Wave Bars */}
        {isListening && !isSearching && (
          <div className="my-2 flex items-center justify-center gap-1.5 h-6">
            <span className="w-1.5 bg-[#145A45] rounded-full animate-bounce [animation-delay:0ms] h-4" />
            <span className="w-1.5 bg-[#145A45] rounded-full animate-bounce [animation-delay:150ms] h-7" />
            <span className="w-1.5 bg-[#145A45] rounded-full animate-bounce [animation-delay:300ms] h-5" />
            <span className="w-1.5 bg-[#145A45] rounded-full animate-bounce [animation-delay:450ms] h-6" />
            <span className="w-1.5 bg-[#145A45] rounded-full animate-bounce [animation-delay:200ms] h-3.5" />
          </div>
        )}

        {/* Live Status & Transcription Display */}
        <div className="mt-3 min-h-[5.5rem] flex flex-col items-center justify-center px-1">
          {errorState ? (
            <div className="flex flex-col items-center gap-2 text-red-600 animate-in fade-in duration-150">
              <AlertCircle className="size-5 text-red-500" />
              <p className="text-xs font-semibold leading-relaxed max-w-xs">{errorState}</p>
              <button
                type="button"
                onClick={() => startListening()}
                className="mt-1 flex items-center gap-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-700 px-4 py-1.5 text-xs font-bold transition-all cursor-pointer border border-red-200"
              >
                <RefreshCw className="size-3.5" />
                <span>{activeLang === "hi" ? "दोबारा बोलें" : "Try Again"}</span>
              </button>
            </div>
          ) : transcript ? (
            <div className="space-y-2 animate-in fade-in duration-150 w-full">
              <p className="text-xs font-bold text-[#5A655F]">
                {isSearching
                  ? activeLang === "hi"
                    ? "खोजा जा रहा है..."
                    : "Searching..."
                  : activeLang === "hi"
                  ? "पहचाना गया शब्द:"
                  : "Recognized:"}
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#145A45] leading-snug break-words">
                “{transcript}”
              </p>

              {/* Instant Search Button */}
              {!isSearching && (
                <button
                  type="button"
                  onClick={() => triggerSearch(transcript)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#145A45] hover:bg-[#0A3628] text-white px-5 py-2 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <span>{activeLang === "hi" ? "अभी खोजें" : "Search Now"}</span>
                  <ArrowRight className="size-3.5" />
                </button>
              )}

              {isSearching && (
                <p className="text-[11px] text-emerald-700 font-bold animate-pulse">
                  {activeLang === "hi" ? "दुकान में सामान देखा जा रहा है..." : "Opening products..."}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-base font-black text-[#16201A]">
                {isListening
                  ? activeLang === "hi"
                    ? "सुन रहे हैं... बोलिए"
                    : "Listening... Speak now"
                  : activeLang === "hi"
                  ? "बोलने के लिए माइक पर टैप करें"
                  : "Tap microphone to speak"}
              </p>
              <p className="text-xs text-[#5A655F]">
                {activeLang === "hi"
                  ? "जैसे: 'बैल कोल्हू तेल', 'चायपत्ती', 'गुड़ और चीनी'"
                  : "e.g. 'Bail Kolhu Oil', 'Chaypatti', 'Sugar'"}
              </p>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips from Real Store Inventory */}
        <div className="mt-4 pt-3 border-t border-[#E5E0D5]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A655F] mb-1.5 flex items-center justify-center gap-1">
            <Sparkles className="size-3 text-[#D97706]" />
            <span>{activeLang === "hi" ? "या इनमें से किसी पर टैप करें:" : "Or tap any item:"}</span>
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {STORE_SUGGESTIONS.map((item) => {
              const label = activeLang === "hi" ? item.hi : item.en;
              return (
                <button
                  key={item.en}
                  type="button"
                  onClick={() => triggerSearch(label)}
                  className="rounded-full border border-[#E5E0D5] bg-[#FAF8F2] px-2.5 py-1 text-[11px] font-semibold text-[#16201A] hover:bg-[#145A45] hover:text-white hover:border-[#145A45] transition-all cursor-pointer shadow-2xs"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
