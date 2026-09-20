/**
 * CivicPulse Voice Transcription Service
 * 
 * 100% Browser-Native Speech Recognition.
 * Powered by window.SpeechRecognition / window.webkitSpeechRecognition.
 * 
 * - SpeechRecognition.start() directly on record
 * - Real-time interim live preview
 * - Zero Whisper models (no WASM, no WebGPU, no Out-of-Memory)
 * - Zero server transcription endpoints (/api/transcribe removed from voice flow)
 * - Zero API keys (no Groq, OpenAI, Deepgram keys needed)
 */

export interface SpeechRecognitionController {
  stop: () => void;
  abort: () => void;
}

export interface SpeechRecognitionOptions {
  language: string; // 'auto' | 'en' | 'hi' | 'pa'
  onInterim: (interimText: string, fullPreview: string) => void;
  onFinal: (finalText: string) => void;
  onError: (errorMessage: string, isUnsupported?: boolean) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Checks if the browser natively supports the Web Speech API.
 */
export function isBrowserSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

/**
 * Maps app language selector choices to standard BCP-47 speech recognition codes.
 * English -> en-IN
 * Hindi -> hi-IN
 * Punjabi -> pa-IN
 * Auto Detect -> en-IN (or browser configured default)
 */
export function getSpeechLanguageCode(langHint: string = 'auto'): string {
  const lower = (langHint || '').toLowerCase().trim();
  if (lower === 'hi' || lower === 'hindi') return 'hi-IN';
  if (lower === 'pa' || lower === 'punjabi' || lower === 'panjabi') return 'pa-IN';
  if (lower === 'en' || lower === 'english') return 'en-IN';
  // Default to English (India) for optimal Indian subcontinent accent & Hinglish recognition
  return 'en-IN';
}

/**
 * Detects the language family from transcribed text without forcing translation.
 * Distinguishes English, Hindi, Punjabi, and Mixed (Hinglish/Punjabi-English).
 */
export function detectLanguageFromText(text: string): string {
  if (!text || !text.trim()) return 'English';
  
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  const gurmukhiCount = (text.match(/[\u0A00-\u0A7F]/g) || []).length;
  const latinWords = (text.match(/[a-zA-Z]+/g) || []);
  
  // Script mixed detection: Native script + Latin words
  if (devanagariCount > 0 && latinWords.length >= 2) {
    return 'Mixed';
  }
  if (gurmukhiCount > 0 && latinWords.length >= 2) {
    return 'Mixed';
  }
  
  if (gurmukhiCount > devanagariCount && gurmukhiCount > 1) {
    return 'Punjabi';
  }
  if (devanagariCount > 1) {
    return 'Hindi';
  }
  
  // Romanized Hindi / Hinglish and Punjabi vocabulary detection using word boundaries
  const lower = text.toLowerCase();
  const hindiRomanPatterns = [
    /\bke paas\b/, /\bke pass\b/, /\bbahut\b/, /\bbada\b/, /\bgaddha\b/, /\bgadda\b/,
    /\btoot\b/, /\btoot gayi\b/, /\bhai\b/, /\broad pe\b/, /\bsadak\b/, /\bpani\b/,
    /\bkachra\b/, /\bbijli\b/, /\bkhamba\b/, /\bgali\b/, /\bnaali\b/, /\bpaas\b/,
    /\bkharab\b/, /\bbadi\b/, /\bchhota\b/, /\bjaldi\b/
  ];
  const punjabiRomanPatterns = [
    /\bde kol\b/, /\bbahut vadda\b/, /\bvadda\b/, /\bkhadda\b/, /\bsadak te\b/,
    /\bte\b/, /\bhunda\b/, /\bpainda\b/, /\bchahida\b/, /\bkareyo\b/, /\bkol\b/,
    /\bpinda\b/, /\bgaadi\b/, /\btheek\b/, /\bkaro\b/, /\bdangerous hai\b/,
    /\bdasso\b/, /\bpothole hai\b/
  ];
  
  const hasHindiRoman = hindiRomanPatterns.some(regex => regex.test(lower));
  const hasPunjabiRoman = punjabiRomanPatterns.some(regex => regex.test(lower));
  const englishCivicPatterns = [
    /\bpothole\b/, /\bstreetlight\b/, /\blight\b/, /\bgate\b/, /\broad\b/,
    /\bgarbage\b/, /\bwire\b/, /\bwater\b/, /\bpipe\b/, /\baccident\b/,
    /\bdanger\b/, /\bproblem\b/, /\bvehicle\b/, /\bfootpath\b/
  ];
  const hasEnglishCivicTerms = englishCivicPatterns.some(regex => regex.test(lower));

  if ((hasHindiRoman || hasPunjabiRoman) && hasEnglishCivicTerms) {
    return 'Mixed';
  }
  if (hasPunjabiRoman) {
    return 'Punjabi';
  }
  if (hasHindiRoman) {
    return 'Hindi';
  }
  
  return 'English';
}

/**
 * Formats transcript with proper sentence capitalization and terminal punctuation.
 */
export function formatTranscript(text: string): string {
  if (!text) return '';
  let trimmed = text.trim();
  if (!trimmed) return '';
  
  // Capitalize first character if Latin
  if (/^[a-z]/.test(trimmed)) {
    trimmed = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  
  // Natural terminal punctuation if missing
  if (!/[.!?।॥]$/.test(trimmed)) {
    if (/[\u0900-\u097F]/.test(trimmed)) {
      trimmed += '।';
    } else if (/[\u0A00-\u0A7F]/.test(trimmed)) {
      trimmed += '।';
    } else {
      trimmed += '.';
    }
  }
  
  return trimmed;
}

/**
 * Initializes and starts native browser SpeechRecognition session with progressive live transcription.
 */
export function startNativeSpeechRecognition(
  options: SpeechRecognitionOptions
): SpeechRecognitionController | null {
  const SpeechRecognitionClass =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  if (!SpeechRecognitionClass) {
    options.onError(
      'Voice transcription is not supported in this browser. Please use Chrome or Edge, or type the description manually.',
      true
    );
    return null;
  }

  let recognition: any;
  try {
    recognition = new SpeechRecognitionClass();
  } catch {
    options.onError(
      'Voice transcription is not available in this browser. Please use Chrome or Edge, or type the description manually.',
      true
    );
    return null;
  }

  const langCode = getSpeechLanguageCode(options.language);
  recognition.lang = langCode;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;

  let accumulatedFinal = '';
  let currentInterim = '';
  let userStopped = false;

  recognition.onstart = () => {
    if (options.onStart) options.onStart();
  };

  recognition.onresult = (event: any) => {
    currentInterim = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const res = event.results[i];
      const segment = (res[0]?.transcript || '').trim();
      if (!segment) continue;

      if (res.isFinal) {
        accumulatedFinal = accumulatedFinal ? `${accumulatedFinal} ${segment}` : segment;
      } else {
        currentInterim = currentInterim ? `${currentInterim} ${segment}` : segment;
      }
    }

    const livePreview = currentInterim
      ? (accumulatedFinal ? `${accumulatedFinal} ${currentInterim}` : currentInterim)
      : accumulatedFinal;

    options.onInterim(currentInterim, livePreview);

    if (accumulatedFinal) {
      options.onFinal(accumulatedFinal);
    }
  };

  recognition.onerror = (event: any) => {
    if (userStopped) return;
    const errorType = event?.error;
    if (errorType === 'aborted') return;

    if (errorType === 'no-speech') {
      if (!accumulatedFinal && !currentInterim) {
        options.onError('No speech was detected. Please try again.');
      }
      return;
    }

    if (errorType === 'not-allowed' || errorType === 'permission-denied') {
      options.onError('Microphone permission was denied. Please allow microphone access.');
      return;
    }

    if (errorType === 'audio-capture') {
      options.onError('Microphone could not be accessed. Please check your audio settings.');
      return;
    }

    // Network / service-not-allowed / Brave privacy block
    if (errorType === 'network' || errorType === 'service-not-allowed') {
      options.onError(
        'Voice transcription is not available in this browser. Please use Chrome or Edge, or type the description manually.',
        true
      );
      return;
    }

    options.onError(
      'Voice transcription could not complete. Please speak clearly or type manually.'
    );
  };

  recognition.onend = () => {
    if (userStopped) return;
    if (options.onEnd) options.onEnd();
    const finalTrimmed = (accumulatedFinal || currentInterim).trim();
    if (finalTrimmed) {
      options.onFinal(finalTrimmed);
    }
  };

  try {
    recognition.start();
  } catch {
    options.onError(
      'Voice transcription is not available in this browser. Please use Chrome or Edge, or type the description manually.',
      true
    );
    return null;
  }

  return {
    stop: () => {
      userStopped = true;
      try {
        recognition.stop();
      } catch {}
      const finalTrimmed = (accumulatedFinal || currentInterim).trim();
      if (finalTrimmed) {
        options.onFinal(finalTrimmed);
      }
    },
    abort: () => {
      userStopped = true;
      try {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
      } catch {}
    }
  };
}

/**
 * Purges old Whisper and ONNX model caches from browser Cache Storage and IndexedDB
 * to immediately free disk and RAM space from the previous implementation.
 * Never touches citizen reports or user auth data.
 */
export async function clearOldWhisperCaches(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if ('caches' in window) {
      const cacheNames = await window.caches.keys();
      for (const name of cacheNames) {
        const lower = name.toLowerCase();
        if (
          lower.includes('transformers') ||
          lower.includes('onnx') ||
          lower.includes('whisper') ||
          lower.includes('huggingface')
        ) {
          console.log('[CivicPulse] Removing old speech model cache:', name);
          await window.caches.delete(name);
        }
      }
    }
  } catch (err) {
    console.warn('[CivicPulse] Could not clean CacheStorage:', err);
  }

  try {
    if ('indexedDB' in window) {
      const request = indexedDB.open('CivicPulseVoiceDB');
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        try {
          if (db.objectStoreNames.contains('audio_cache')) {
            const tx = db.transaction('audio_cache', 'readwrite');
            tx.objectStore('audio_cache').clear();
          }
        } catch {
          // Ignored
        }
      };
    }
  } catch {
    // Ignored
  }
}
