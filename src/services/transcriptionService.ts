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
 * Normalizes cumulative interim/final repetition artifacts produced by mobile speech engines
 * without removing legitimate user repetition (e.g. "very very important").
 */
export function cleanCumulativeSpeechRepetition(text: string): string {
  if (!text || !text.trim()) return '';

  let words = text.trim().split(/\s+/);
  let changed = true;

  while (changed && words.length >= 4) {
    changed = false;

    // Check for cumulative prefix repetitions from the start (k >= 2 words)
    for (let k = Math.floor(words.length / 2); k >= 2; k--) {
      let match = true;
      for (let j = 0; j < k; j++) {
        const w1 = words[j].toLowerCase().replace(/[.,!?;:]/g, '');
        const w2 = words[k + j].toLowerCase().replace(/[.,!?;:]/g, '');
        if (w1 !== w2) {
          match = false;
          break;
        }
      }

      if (match) {
        words = words.slice(k);
        changed = true;
        break;
      }
    }

    if (!changed) {
      // Check mid-sentence cumulative repetitions (k >= 2 words)
      for (let start = 1; start <= words.length - 4; start++) {
        const remaining = words.length - start;
        for (let k = Math.floor(remaining / 2); k >= 2; k--) {
          let match = true;
          for (let j = 0; j < k; j++) {
            const w1 = words[start + j].toLowerCase().replace(/[.,!?;:]/g, '');
            const w2 = words[start + k + j].toLowerCase().replace(/[.,!?;:]/g, '');
            if (w1 !== w2) {
              match = false;
              break;
            }
          }
          if (match) {
            words.splice(start, k);
            changed = true;
            break;
          }
        }
        if (changed) break;
      }
    }
  }

  return words.join(' ');
}

/**
 * Formats transcript with proper sentence capitalization and terminal punctuation.
 */
export function formatTranscript(text: string): string {
  if (!text) return '';
  const cleaned = cleanCumulativeSpeechRepetition(text);
  let trimmed = cleaned.trim();
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

  let persistentFinalTranscript = '';
  let lastFinalSegment = '';
  let lastProcessedFinalIndex = -1;
  let lastInterim = '';
  let userStopped = false;

  recognition.onstart = () => {
    if (options.onStart) options.onStart();
  };

  recognition.onresult = (event: any) => {
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const res = event.results[i];
      const rawSegment = res[0]?.transcript || '';
      const segment = rawSegment.trim();
      if (!segment) continue;

      console.log(`[VOICE RESULT] resultIndex: ${event.resultIndex} isFinal: ${res.isFinal} text: "${segment}"`);

      if (res.isFinal) {
        // Guarantee previously finalized indices in event.results are never re-added
        if (i > lastProcessedFinalIndex) {
          if (segment !== lastFinalSegment) {
            // If segment is a cumulative expansion of persistentFinalTranscript, replace it
            if (persistentFinalTranscript && segment.toLowerCase().startsWith(persistentFinalTranscript.toLowerCase())) {
              persistentFinalTranscript = segment;
            } else if (persistentFinalTranscript && persistentFinalTranscript.toLowerCase().endsWith(segment.toLowerCase())) {
              // Already contained
            } else {
              persistentFinalTranscript = persistentFinalTranscript
                ? `${persistentFinalTranscript} ${segment}`
                : segment;
            }
            lastFinalSegment = segment;
          }
          lastProcessedFinalIndex = i;
        }
      } else {
        // Interim text strictly REPLACES previous interim text within this unfinalized segment
        interimTranscript = segment;
      }
    }

    lastInterim = interimTranscript;

    console.log(`[VOICE RESULT] finalTranscript: "${persistentFinalTranscript}" interimTranscript: "${interimTranscript}"`);

    // Live preview during recording: permanent finalized text + current interim phrase
    const livePreview = interimTranscript
      ? (persistentFinalTranscript ? `${persistentFinalTranscript} ${interimTranscript}` : interimTranscript)
      : persistentFinalTranscript;

    options.onInterim(interimTranscript, livePreview);

    if (persistentFinalTranscript) {
      options.onFinal(persistentFinalTranscript);
    }
  };

  recognition.onerror = (event: any) => {
    if (userStopped) return;
    const errorType = event?.error;
    if (errorType === 'aborted') return;

    if (errorType === 'no-speech') {
      if (!persistentFinalTranscript && !lastInterim) {
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
    const finalResult = (persistentFinalTranscript || lastInterim).trim();
    if (finalResult) {
      options.onFinal(finalResult);
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
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.stop();
      } catch {}
      const finalResult = (persistentFinalTranscript || lastInterim).trim();
      if (finalResult) {
        options.onFinal(finalResult);
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
