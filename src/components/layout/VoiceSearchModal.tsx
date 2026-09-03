import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Mic, X, Check } from "lucide-react";
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

export function VoiceSearchModal({ isOpen, onClose, onSearch }: VoiceSearchModalProps) {
  const { lang } = useLanguage();
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
      }, 300);
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

  const startListening = useCallback(() => {
    cleanUp();
    isSubmittedRef.current = false;
    setIsSearching(false);
    setErrorState(null);

    const SpeechConstructor = getSpeechRecognitionConstructor();
    if (!SpeechConstructor) {
      setErrorState(
        lang === "hi"
          ? "इस ब्राउज़र में वॉयस सर्च उपलब्ध नहीं है। कृपया Google Chrome का उपयोग करें।"
          : "Voice search not supported in this browser. Please use Chrome."
      );
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechConstructor();
      recognitionRef.current = recognition;

      // Enable continuous so it captures full multi-word phrases (e.g. "टाटा नमक", "फॉर्च्यून सरसों तेल")
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang === "hi" ? "hi-IN" : "en-IN";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorState(null);
      };

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        let fullText = "";

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res && res[0]) {
            fullText += res[0].transcript + " ";
          }
        }

        const trimmed = fullText.trim();
        if (trimmed) {
          setTranscript(trimmed);
          transcriptRef.current = trimmed;

          // Debounce: when user finishes speaking (750ms silence), automatically search and open products!
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          silenceTimerRef.current = setTimeout(() => {
            if (transcriptRef.current.trim() && !isSubmittedRef.current) {
              triggerSearch(transcriptRef.current.trim());
            }
          }, 750);
        }
      };

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        console.warn("Speech error:", event.error);
        if (event.error === "no-speech") {
          return;
        }

        setIsListening(false);

        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setErrorState(
            lang === "hi"
              ? "माइक्रोफ़ोन अनुमति बंद है। कृपया URL बार में 🔒 पर क्लिक करके Mic Allow करें।"
              : "Microphone blocked. Please allow mic access in your browser address bar."
          );
        } else if (event.error === "network") {
          setErrorState(
            lang === "hi"
              ? "इंटरनेट कनेक्शन में समस्या है।"
              : "Network error. Please check internet."
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // If speech ended and we captured words, auto-search immediately
        if (transcriptRef.current.trim() && !isSubmittedRef.current) {
          triggerSearch(transcriptRef.current.trim());
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Speech start error:", err);
      setIsListening(false);
      setErrorState(
        lang === "hi"
          ? "माइक चालू करने के लिए नीचे माइक पर टैप करें।"
          : "Tap the microphone below to start speaking."
      );
    }
  }, [lang, cleanUp, triggerSearch]);

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

    startListening();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
      cleanUp();
    };
  }, [isOpen, startListening, cleanUp]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-7 sm:p-8 shadow-2xl border border-[#EAE6DC] text-center animate-in zoom-in-95 duration-200 cursor-default my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-[#FAF8F2] hover:bg-[#EAE6DC] text-[#5A655F] hover:text-[#16201A] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Big Central Animated Microphone Icon */}
        <div className="relative my-6 flex items-center justify-center">
          {isListening && !isSearching && (
            <>
              <div className="absolute size-32 rounded-full bg-[#145A45]/15 animate-ping duration-1000 pointer-events-none" />
              <div className="absolute size-26 rounded-full bg-[#145A45]/25 animate-pulse duration-700 pointer-events-none" />
            </>
          )}

          <button
            type="button"
            onClick={startListening}
            className={`relative z-10 flex size-24 items-center justify-center rounded-full shadow-xl transition-all active:scale-95 cursor-pointer ${
              isSearching
                ? "bg-[#15803D] text-white ring-4 ring-emerald-200"
                : isListening
                ? "bg-gradient-to-tr from-[#145A45] to-[#1D7A5E] text-white ring-4 ring-[#E6EFE8]"
                : "bg-[#FAF8F2] text-[#5A655F] border-2 border-[#EAE6DC] hover:border-[#145A45] hover:text-[#145A45]"
            }`}
            title={lang === "hi" ? "बोलने के लिए दबाएं" : "Tap to speak"}
          >
            {isSearching ? (
              <Check className="size-10 text-white animate-bounce" />
            ) : (
              <Mic className={`size-10 ${isListening ? "animate-pulse" : ""}`} />
            )}
          </button>
        </div>

        {/* Dynamic Sound Wave Bars */}
        {isListening && !isSearching && (
          <div className="my-3 flex items-center justify-center gap-1.5 h-6">
            <span className="w-1.5 bg-[#145A45] rounded-full animate-bounce [animation-delay:0ms] h-4" />
            <span className="w-1.5 bg-[#145A45] rounded-full animate-bounce [animation-delay:150ms] h-7" />
            <span className="w-1.5 bg-[#145A45] rounded-full animate-bounce [animation-delay:300ms] h-5" />
            <span className="w-1.5 bg-[#145A45] rounded-full animate-bounce [animation-delay:450ms] h-6" />
            <span className="w-1.5 bg-[#145A45] rounded-full animate-bounce [animation-delay:200ms] h-3.5" />
          </div>
        )}

        {/* Live Status & Transcription Display (Direct Auto-Search, No Extra Button!) */}
        <div className="mt-4 min-h-[5rem] flex flex-col items-center justify-center px-2">
          {errorState ? (
            <div className="flex flex-col items-center gap-2 text-red-600 animate-in fade-in duration-150">
              <p className="text-xs font-semibold leading-relaxed">{errorState}</p>
              <button
                type="button"
                onClick={startListening}
                className="mt-1 rounded-full bg-red-50 hover:bg-red-100 text-red-700 px-4 py-1.5 text-xs font-bold transition-all cursor-pointer border border-red-200"
              >
                {lang === "hi" ? "पुनः बोलें" : "Try Again"}
              </button>
            </div>
          ) : transcript ? (
            <div className="space-y-1.5 animate-in fade-in duration-150 w-full">
              <p className="text-xs font-bold text-[#8C827A]">
                {isSearching
                  ? lang === "hi"
                    ? "खोजा जा रहा है..."
                    : "Searching..."
                  : lang === "hi"
                  ? "पहचाना गया:"
                  : "Recognized:"}
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#145A45] leading-snug break-words">
                “{transcript}”
              </p>
              <p className="text-[11px] text-emerald-700 font-bold animate-pulse">
                {lang === "hi" ? "उत्पाद खोले जा रहे हैं..." : "Opening products..."}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-base font-black text-[#16201A]">
                {lang === "hi" ? "सुन रहे हैं... बोलिए" : "Listening... Speak now"}
              </p>
              <p className="text-xs text-[#5A655F]">
                {lang === "hi"
                  ? "जैसे: 'टाटा नमक', 'फॉर्च्यून तेल', 'आशीर्वाद आटा'"
                  : "e.g. 'Tata Salt', 'Fortune Oil', 'Aashirvaad Atta'"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
