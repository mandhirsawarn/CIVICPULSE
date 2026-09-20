import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, MapPin, ChevronRight, ChevronLeft, Loader2, AlertTriangle, 
  Info, CheckCircle2, Crosshair, Mic, Languages, Layers3, Trash2, X, 
  Edit3, Square, RefreshCw, Construction, Lightbulb, Droplets, Wrench, Shield, HelpCircle,
  Sparkles, Image as ImageIcon 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../../store/useStore';
import { analyzeIssue, detectDuplicates } from '../../services/aiService';
import { AIAnalysis, IssueCategory, Issue, Urgency } from '../../types';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { compressImage } from '../../utils/imageCompression';
import { fetchNominatimSearch, reverseGeocodeCoordinates, SearchResultItem } from '../../services/locationService';
import { startNativeSpeechRecognition, SpeechRecognitionController, formatTranscript, detectLanguageFromText, clearOldWhisperCaches } from '../../services/transcriptionService';
import { VoiceErrorBoundary } from '../../components/citizen/VoiceErrorBoundary';

// Fix Leaflet default marker icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CATEGORIES = [
  { id: 'Pothole', icon: Construction, color: 'bg-amber-50 text-amber-600 border-amber-200/60' },
  { id: 'Garbage', icon: Trash2, color: 'bg-emerald-50 text-emerald-600 border-emerald-200/60' },
  { id: 'Streetlight', icon: Lightbulb, color: 'bg-yellow-50 text-yellow-600 border-yellow-200/60' },
  { id: 'Waterlogging', icon: Droplets, color: 'bg-blue-50 text-blue-600 border-blue-200/60' },
  { id: 'Road Damage', icon: Wrench, color: 'bg-orange-50 text-orange-600 border-orange-200/60' },
  { id: 'Traffic Sign', icon: AlertTriangle, color: 'bg-red-50 text-red-600 border-red-200/60' },
  { id: 'Public Safety', icon: Shield, color: 'bg-purple-50 text-purple-600 border-purple-200/60' },
  { id: 'Other', icon: HelpCircle, color: 'bg-slate-50 text-slate-600 border-slate-200/60' }
];

const STEPS = [
  { num: '01', title: 'Details' },
  { num: '02', title: 'Urgency' },
  { num: '03', title: 'Evidence' },
  { num: '04', title: 'Location' },
  { num: '05', title: 'Review' },
  { num: '06', title: 'Submit' }
];


const MapClickHandler = ({ onLocationSelect, active }: { onLocationSelect: (lat: number, lng: number) => void, active: boolean }) => {
  useMapEvents({
    click(e) {
      if (active) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
};

const MapViewport = ({ coordinates }: { coordinates: { lat: number; lng: number } }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([coordinates.lat, coordinates.lng], Math.max(map.getZoom(), 16), { animate: true });
  }, [coordinates.lat, coordinates.lng, map]);
  return null;
};

const ReportIssue = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { addIssue, currentUser, issues, reportDraft, updateReportDraft, clearReportDraft } = useStore();
  
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<Urgency | ''>('');
  const [photo, setPhoto] = useState<string | null>(null);
  
  // Location states
  const [locationStr, setLocationStr] = useState('Fetching location...');
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [locationSource, setLocationSource] = useState<'GPS' | 'Manual' | 'Search'>('GPS');
  const [isDropPinMode, setIsDropPinMode] = useState(false);
  const [mapMode, setMapMode] = useState<'street' | 'satellite'>('satellite');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<SearchResultItem[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [hasSearchedLocation, setHasSearchedLocation] = useState(false);
  const [searchLocationError, setSearchLocationError] = useState<string | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Contact info
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Voice Recording & Speech-to-Text Strict State Machine (100% Browser SpeechRecognition)
  // Strict States: 'IDLE' -> 'RECORDING' -> 'PROCESSING' -> 'TRANSCRIBED' -> 'IDLE'
  type VoiceState = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'TRANSCRIBED' | 'ERROR';
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [voiceErrorMessage, setVoiceErrorMessage] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [hasUsedVoice, setHasUsedVoice] = useState(false);
  const [isEditingReviewDesc, setIsEditingReviewDesc] = useState(false);

  // Speech Recognition & Mobile Touch Guards
  const speechControllerRef = useRef<SpeechRecognitionController | null>(null);
  const latestTranscriptRef = useRef<string>('');
  const durationTimerRef = useRef<any>(null);
  const isStartingRef = useRef(false);
  const isStoppingRef = useRef(false);
  const isActionLockedRef = useRef(false);
  const isMountedRef = useRef(true);
  const voiceStateRef = useRef<VoiceState>('IDLE');
  const recordingSessionIdRef = useRef<number>(0);
  const lastStopTimestampRef = useRef<number>(0);

  const updateVoiceState = (newState: VoiceState) => {
    voiceStateRef.current = newState;
    setVoiceState(newState);
  };

  // AI & Submission states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysis | null>(null);
  const [duplicateData, setDuplicateData] = useState<{isDuplicate: boolean, relatedIssues: { issue: Issue; distance: number; similarity: number }[]} | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [storageError, setStorageError] = useState(false);

  // Draft prompt & Offline state
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [showConfirmStartNew, setShowConfirmStartNew] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Purge any stale Whisper caches left from previous sessions on mount
  useEffect(() => {
    clearOldWhisperCaches().catch(() => {});
  }, []);

  // Check on mount if an existing draft exists
  useEffect(() => {
    if (reportDraft && (reportDraft.category || reportDraft.description || reportDraft.photo || reportDraft.photoId || (reportDraft.step && reportDraft.step > 1))) {
      setShowDraftPrompt(true);
    }
  }, []);

  // Resume draft handler
  const handleResumeDraft = () => {
    if (reportDraft) {
      if (reportDraft.category) setCategory(reportDraft.category);
      if (reportDraft.description) setDescription(reportDraft.description);
      if (reportDraft.urgency) setUrgency(reportDraft.urgency as Urgency);
      if (reportDraft.locationStr) setLocationStr(reportDraft.locationStr);
      if (reportDraft.coordinates) setCoordinates(reportDraft.coordinates);
      if (reportDraft.contactPhone) setContactPhone(reportDraft.contactPhone);
      if (reportDraft.contactEmail) setContactEmail(reportDraft.contactEmail);
      if (reportDraft.aiResult) setAiResult(reportDraft.aiResult);
      if (reportDraft.step) setStep(Math.min(reportDraft.step, 5));
      if (reportDraft.photo) {
        setPhoto(reportDraft.photo);
      } else {
        if ('indexedDB' in window) {
          import('../../utils/indexedDB').then(({ getMediaBlob }) => {
            getMediaBlob('current-report-photo').then((data) => {
              if (data && typeof data === 'string') setPhoto(data);
            }).catch(() => {});
          }).catch(() => {});
        }
      }
    }
    setShowDraftPrompt(false);
  };

  // Start fresh report handler (with confirmation)
  const handleConfirmStartNew = () => {
    clearReportDraft();
    setCategory('');
    setDescription('');
    setUrgency('');
    setPhoto(null);
    setCoordinates(null);
    setLocationStr('Fetching location...');
    setContactPhone('');
    setContactEmail('');
    setAiResult(null);
    setStep(1);
    setShowConfirmStartNew(false);
    setShowDraftPrompt(false);
  };

  // Update draft as user edits
  useEffect(() => {
    if (step < 6) {
      updateReportDraft({
        category,
        description,
        urgency,
        locationStr,
        coordinates,
        locationSource,
        contactPhone,
        contactEmail,
        step,
        photo
      });
    }
  }, [category, description, urgency, locationStr, coordinates, locationSource, contactPhone, contactEmail, step, photo]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const startVoiceRecording = (isRecordAgain = false) => {
    // Guard: never start duplicate sessions or start while processing/stopping
    if (isStartingRef.current || isStoppingRef.current || isActionLockedRef.current) {
      console.log('[VOICE] BLOCKED DUPLICATE START');
      return;
    }
    if (voiceStateRef.current === 'RECORDING' || voiceStateRef.current === 'PROCESSING') {
      console.log('[VOICE] BLOCKED DUPLICATE START (already active)');
      return;
    }

    // Cooldown check against mobile touch synthetic click race
    const now = Date.now();
    if (now - lastStopTimestampRef.current < 800) {
      console.log('[VOICE] BLOCKED RAPID TOUCH RE-TRIGGER (cooldown)');
      return;
    }

    // Guard: only start from IDLE or explicit Record Again
    if (voiceStateRef.current !== 'IDLE' && !isRecordAgain) {
      console.log('[VOICE] BLOCKED INVALID STATE START:', voiceStateRef.current);
      return;
    }

    console.log('[VOICE] EXPLICIT START');
    recordingSessionIdRef.current += 1;
    const currentSessionId = recordingSessionIdRef.current;
    console.log('[VOICE] SESSION START:', currentSessionId);

    isStartingRef.current = true;

    try {
      // Clear any previous controller
      if (speechControllerRef.current) {
        try {
          speechControllerRef.current.abort();
        } catch {}
        speechControllerRef.current = null;
      }
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      setVoiceErrorMessage('');
      setLiveTranscript('');
      latestTranscriptRef.current = '';

      const controller = startNativeSpeechRecognition({
        language: selectedLanguage,
        onStart: () => {
          if (!isMountedRef.current || recordingSessionIdRef.current !== currentSessionId) {
            console.log('[VOICE] OLD SESSION IGNORED (onStart):', currentSessionId);
            return;
          }
          updateVoiceState('RECORDING');
          setRecordingDuration(0);
          setHasUsedVoice(true);
          isStartingRef.current = false;
        },
        onInterim: (_interim, fullPreview) => {
          if (!isMountedRef.current || recordingSessionIdRef.current !== currentSessionId) {
            return;
          }
          setLiveTranscript(fullPreview);
          latestTranscriptRef.current = fullPreview;
        },
        onFinal: (finalText) => {
          if (!isMountedRef.current || recordingSessionIdRef.current !== currentSessionId) {
            return;
          }
          setLiveTranscript(finalText);
          latestTranscriptRef.current = finalText;
        },
        onError: (errMsg) => {
          if (!isMountedRef.current || recordingSessionIdRef.current !== currentSessionId) {
            console.log('[VOICE] OLD SESSION IGNORED (onError):', currentSessionId);
            return;
          }
          console.warn('[ReportIssue] Voice notice:', errMsg);
          isStartingRef.current = false;
          isStoppingRef.current = false;
          updateVoiceState('ERROR');
          setVoiceErrorMessage(errMsg);
          if (durationTimerRef.current) {
            clearInterval(durationTimerRef.current);
            durationTimerRef.current = null;
          }
          if (speechControllerRef.current) {
            speechControllerRef.current = null;
          }
        },
        onEnd: () => {
          console.log('[VOICE] RECOGNITION END:', currentSessionId);
          if (!isMountedRef.current || recordingSessionIdRef.current !== currentSessionId) {
            console.log('[VOICE] OLD SESSION IGNORED (onEnd):', currentSessionId);
            return;
          }
          isStartingRef.current = false;
          // Engine ended naturally (e.g. mobile pauses speech). STOP MEANS STOP - finalize gracefully.
          if (voiceStateRef.current === 'RECORDING' && !isStoppingRef.current) {
            stopVoiceRecording(currentSessionId);
          }
        }
      });

      if (!controller) {
        isStartingRef.current = false;
        return;
      }

      speechControllerRef.current = controller;

      // Start duration timer
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      const startTime = Date.now();
      durationTimerRef.current = setInterval(() => {
        if (!isMountedRef.current || recordingSessionIdRef.current !== currentSessionId) return;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(elapsed);
        // Automatically stop recording at 60 seconds (maximum limit)
        if (elapsed >= 60) {
          stopVoiceRecording(currentSessionId);
        }
      }, 1000);
    } catch (err: any) {
      console.error('[Voice] Error starting speech recognition:', err);
      isStartingRef.current = false;
      updateVoiceState('ERROR');
      setVoiceErrorMessage('Voice transcription could not start. Please check microphone permission.');
    }
  };

  const stopVoiceRecording = (targetSessionId?: number) => {
    if (targetSessionId && targetSessionId !== recordingSessionIdRef.current) {
      console.log('[VOICE] OLD SESSION IGNORED in stop:', targetSessionId);
      return;
    }

    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    lastStopTimestampRef.current = Date.now();
    console.log('[VOICE] USER STOP');

    const sessionId = recordingSessionIdRef.current;
    updateVoiceState('PROCESSING');

    // Clear duration timer
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    // Stop speech controller safely
    if (speechControllerRef.current) {
      try {
        speechControllerRef.current.stop();
      } catch {}
      speechControllerRef.current = null;
    }

    // Allow browser audio engine results to settle
    setTimeout(() => {
      if (!isMountedRef.current || recordingSessionIdRef.current !== sessionId) {
        console.log('[VOICE] OLD SESSION IGNORED in finalize:', sessionId);
        isStoppingRef.current = false;
        return;
      }

      const rawText = latestTranscriptRef.current.trim();
      if (!rawText) {
        updateVoiceState('ERROR');
        setVoiceErrorMessage('No speech was detected. Please try again.');
        isStoppingRef.current = false;
        return;
      }

      const formattedText = formatTranscript(rawText);
      const lang = detectLanguageFromText(formattedText);
      setDetectedLanguage(lang);

      const finalDescription = formattedText;

      if (description && description.trim() && description.trim() !== finalDescription) {
        setPendingTranscript(finalDescription);
        setShowMergeDialog(true);
        updateVoiceState('TRANSCRIBED');
      } else {
        setDescription(finalDescription);
        updateReportDraft({ description: finalDescription });
        updateVoiceState('TRANSCRIBED');
      }

      console.log('[VOICE] TRANSCRIPTION COMPLETE:', sessionId);

      // Direct AI analysis with the fresh transcript
      try {
        runAnalysis(finalDescription);
      } catch (aiErr) {
        console.warn('[ReportIssue] AI analysis notice:', aiErr);
      }

      isStoppingRef.current = false;
    }, 150);
  };

  // Record Again: Explicit user action only. Cleans up previous session before starting exactly ONE new session.
  const handleRecordAgain = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Check cooldown against mobile synthetic clicks
    const now = Date.now();
    if (now - lastStopTimestampRef.current < 800) {
      console.log('[VOICE] BLOCKED RAPID RECORD AGAIN (cooldown)');
      return;
    }

    if (isActionLockedRef.current || isStartingRef.current || isStoppingRef.current) {
      console.log('[VOICE] BLOCKED DUPLICATE START');
      return;
    }
    isActionLockedRef.current = true;
    console.log('[VOICE] EXPLICIT RECORD AGAIN');

    // Invalidate previous session ID immediately
    recordingSessionIdRef.current += 1;

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (speechControllerRef.current) {
      try {
        speechControllerRef.current.abort();
      } catch {}
      speechControllerRef.current = null;
    }

    updateVoiceState('IDLE');
    setVoiceErrorMessage('');
    setLiveTranscript('');
    latestTranscriptRef.current = '';

    // Wait until previous session has completely stopped before starting ONE new session
    setTimeout(() => {
      isActionLockedRef.current = false;
      if (isMountedRef.current) {
        startVoiceRecording(true);
      }
    }, 250);
  };

  // Centralized microphone button tap handler adhering to strict state machine
  const handleMicButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    if (now - lastStopTimestampRef.current < 800) {
      console.log('[VOICE] BLOCKED RAPID MIC TAP (cooldown)');
      return;
    }

    if (isActionLockedRef.current || isStartingRef.current || isStoppingRef.current) {
      console.log('[VOICE] BLOCKED DUPLICATE START');
      return;
    }

    if (voiceStateRef.current === 'IDLE') {
      startVoiceRecording();
    } else if (voiceStateRef.current === 'RECORDING') {
      stopVoiceRecording();
    } else if (voiceStateRef.current === 'PROCESSING') {
      // Ignore microphone action while processing
      return;
    } else if (voiceStateRef.current === 'TRANSCRIBED') {
      // In TRANSCRIBED state, do NOT start automatically.
      // Record Again is the only explicit button.
      return;
    } else if (voiceStateRef.current === 'ERROR') {
      handleRecordAgain(e);
    }
  };

  const handleMergeReplace = () => {
    if (pendingTranscript) {
      setDescription(pendingTranscript);
      updateReportDraft({ description: pendingTranscript });
    }
    setShowMergeDialog(false);
    setPendingTranscript(null);
  };

  const handleMergeAppend = () => {
    if (pendingTranscript) {
      const combined = `${description.trim()} ${pendingTranscript.trim()}`;
      setDescription(combined);
      updateReportDraft({ description: combined });
    }
    setShowMergeDialog(false);
    setPendingTranscript(null);
  };

  const handleMergeCancel = () => {
    setShowMergeDialog(false);
    setPendingTranscript(null);
  };

  const handleClearDescription = () => {
    setDescription('');
    updateReportDraft({ description: '' });
    updateVoiceState('IDLE');
    setLiveTranscript('');
    setPendingTranscript(null);
    setShowMergeDialog(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      isStartingRef.current = false;
      isStoppingRef.current = false;
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      if (speechControllerRef.current) {
        try {
          speechControllerRef.current.abort();
        } catch {}
        speechControllerRef.current = null;
      }
    };
  }, []);

  // Photo handlers with IndexedDB persistence
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        const compressedBase64 = await compressImage(file);
        setPhoto(compressedBase64);
        updateReportDraft({ photo: compressedBase64, photoId: 'current-report-photo' });
        try {
          if ('indexedDB' in window) {
            const { saveMediaBlob } = await import('../../utils/indexedDB');
            await saveMediaBlob('current-report-photo', compressedBase64);
          }
        } catch (idbErr) {
          console.warn("IndexedDB photo save notice:", idbErr);
        }
      } catch (error) {
        console.error("Failed to compress image:", error);
        alert("Failed to process image. Please try another one.");
      } finally {
        setIsCompressing(false);
      }
    }
    // Reset input value so taking/uploading the same photo again triggers change
    e.target.value = '';
  };

  const handleRemovePhoto = async () => {
    setPhoto(null);
    updateReportDraft({ photo: null, photoId: undefined });
    try {
      if ('indexedDB' in window) {
        const { deleteMediaBlob } = await import('../../utils/indexedDB');
        await deleteMediaBlob('current-report-photo');
      }
    } catch {
      // ignore
    }
  };

  // Geolocation & Map handlers
  const fetchLiveLocation = () => {
    setIsLocating(true);
    setLocationError(false);
    setLocationStr('Getting live GPS location...');
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoordinates({ lat, lng });
          setLocationSource('GPS');
          setIsLocating(false);
          reverseGeocode(lat, lng);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationStr('Location access denied. Use search or drop pin.');
          setCoordinates({ lat: 30.7333, lng: 76.7794 }); // Fallback to Chandigarh region
          setLocationError(false);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationStr('Geolocation not supported by this browser.');
      setCoordinates({ lat: 30.7333, lng: 76.7794 });
      setIsLocating(false);
    }
  };

  // Check URL params or initial GPS
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const paramLat = params.get('lat');
    const paramLng = params.get('lng');
    const paramAddr = params.get('address');
    
    if (paramLat && paramLng) {
      setCoordinates({ lat: parseFloat(paramLat), lng: parseFloat(paramLng) });
      setLocationStr(paramAddr || 'Selected location');
      setLocationSource('Search');
      if (step === 1) {
        setStep(4);
      }
    } else if (step === 4 && !coordinates && !isLocating) {
      fetchLiveLocation();
    }
  }, [step, routerLocation.search]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const addr = await reverseGeocodeCoordinates(lat, lng);
      setLocationStr(addr);
    } catch {
      setLocationStr(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
    }
  };

  const handleManualLocation = () => {
    setIsDropPinMode(true);
    if (!coordinates) {
      setCoordinates({ lat: 30.7333, lng: 76.7794 });
    }
    setLocationStr('Click anywhere on the map to drop a pin.');
    setLocationSource('Manual');
    setLocationError(false);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setCoordinates({ lat, lng });
    setLocationSource('Manual');
    setIsDropPinMode(false);
    setLocationStr('Fetching address...');
    const addr = await reverseGeocodeCoordinates(lat, lng);
    setLocationStr(addr);
  };

  // Debounced location search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchSuggestions([]);
      setIsSearchingLocation(false);
      setHasSearchedLocation(false);
      setSearchLocationError(null);
      setIsSuggestionsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }
      const controller = new AbortController();
      searchAbortRef.current = controller;

      setIsSearchingLocation(true);
      setSearchLocationError(null);
      setHasSearchedLocation(false);
      setIsSuggestionsOpen(true);
      setHighlightedIndex(-1);

      fetchNominatimSearch(trimmed, coordinates, controller.signal)
        .then((items) => {
          setSearchSuggestions(items);
          setIsSearchingLocation(false);
          setHasSearchedLocation(true);
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          console.error("Search error:", err);
          setIsSearchingLocation(false);
          setHasSearchedLocation(true);
          setSearchLocationError("Location search is temporarily unavailable. You can drop a pin manually.");
        });
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, coordinates]);

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) return;

    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setIsSearchingLocation(true);
    setSearchLocationError(null);
    setHasSearchedLocation(false);
    setIsSuggestionsOpen(true);
    setHighlightedIndex(-1);

    try {
      const items = await fetchNominatimSearch(trimmed, coordinates, controller.signal);
      setSearchSuggestions(items);
      setIsSearchingLocation(false);
      setHasSearchedLocation(true);
      if (items.length === 1) {
        handleSelectSuggestion(items[0]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setIsSearchingLocation(false);
      setHasSearchedLocation(true);
      setSearchLocationError("Location search is temporarily unavailable. You can drop a pin manually.");
    }
  };

  const handleSelectSuggestion = (suggestion: SearchResultItem) => {
    setCoordinates({ lat: suggestion.lat, lng: suggestion.lng });
    setLocationStr(suggestion.displayName);
    setLocationSource('Search');
    setLocationError(false);
    setIsDropPinMode(false);
    setIsSuggestionsOpen(false);
    setSearchSuggestions([]);
    setSearchQuery(suggestion.placeName);
    setHasSearchedLocation(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestionsOpen || searchSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < searchSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : searchSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < searchSuggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(searchSuggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSuggestionsOpen(false);
    }
  };

  // Run AI analysis
  const runAnalysis = async (customDescription?: string) => {
    setIsAnalyzing(true);
    const finalDescription = (typeof customDescription === 'string' ? customDescription : description).trim();
    
    try {
      const [analysis, dupes] = await Promise.all([
        analyzeIssue(photo, finalDescription, (urgency || 'MODERATE') as Urgency, (category || 'Other') as IssueCategory),
        detectDuplicates(coordinates?.lat || 0, coordinates?.lng || 0, (category || 'Other') as IssueCategory, finalDescription, issues)
      ]);
      
      setAiResult(analysis);
      setDuplicateData(dupes);
    } catch (err) {
      console.error("Error during analysis:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Final submit handler
  const handleSubmit = () => {
    if (contactPhone && contactPhone.length !== 10) {
      setPhoneError('Mobile number must contain 10 digits.');
      return;
    }
    const finalDescription = description.trim();
    const newId = `CP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    
    try {
      addIssue({
        id: newId,
        title: `${category || aiResult?.detectedCategory || 'Civic Issue'} at ${locationStr.split(',')[0]}`,
        description: finalDescription,
        category: (category || aiResult?.detectedCategory || 'Other') as IssueCategory,
        location: {
          lat: coordinates?.lat || 30.7333,
          lng: coordinates?.lng || 76.7794,
          address: locationStr + (locationSource !== 'GPS' ? ` (${locationSource})` : ''),
          ward: 'Ward 4',
          zone: 'Central'
        },
        photos: photo ? [photo] : [],
        status: 'REPORTED',
        priority: aiResult?.severity || 'MEDIUM',
        priorityScore: aiResult?.priorityScore || 50,
        citizenUrgency: (urgency || 'MODERATE') as Urgency,
        estimatedResolutionTime: aiResult?.estimatedResolutionTime || '2-5 days',
        reporterId: currentUser?.id || 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slaTarget: (() => {
          const severity = aiResult?.severity || 'MEDIUM';
          const hours = severity === 'CRITICAL' ? 4 : severity === 'HIGH' ? 12 : severity === 'MEDIUM' ? 24 : 72;
          return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        })(),
        aiAnalysis: aiResult || undefined,
        contactPhone: contactPhone || undefined,
        contactEmail: contactEmail || undefined,
        timeline: [
          { id: `tl-${Date.now()}`, status: 'REPORTED', timestamp: new Date().toISOString(), description: 'Issue reported by citizen', actor: 'Citizen' },
          ...(aiResult ? [{ id: `tl-${Date.now()+1}`, status: 'AI_VERIFIED' as const, timestamp: new Date().toISOString(), description: 'AI categorized and prioritized', actor: 'System AI' }] : [])
        ]
      });
      
      clearReportDraft();
      setStorageError(false);
      setStep(6);
    } catch (error) {
      console.error("Storage error when submitting issue:", error);
      setStorageError(true);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
  };

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-4 pb-24 md:pb-6 animate-fade-in">
      {/* Offline Status Alert */}
      {!isOnline && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-3.5 flex items-center gap-3 text-xs font-semibold shadow-xs animate-fade-in">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span className="flex-1">You’re offline. Your report is saved on this device.</span>
        </div>
      )}

      {/* Saved Draft Resume Prompt Banner */}
      {showDraftPrompt && step === 1 && (
        <div className="mb-5 bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={17} className="text-blue-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Continue your saved report?</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                You have an unfinished report saved on this device. Would you like to resume where you left off?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button 
              type="button" 
              size="sm" 
              onClick={handleResumeDraft} 
              className="text-xs font-bold bg-slate-900 text-white flex-1 sm:flex-initial"
            >
              Continue Draft
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              onClick={() => setShowConfirmStartNew(true)} 
              className="text-xs font-semibold text-slate-600 hover:text-red-600 border-slate-200 hover:border-red-200 flex-1 sm:flex-initial"
            >
              Start New Report
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Discard Saved Draft */}
      {showConfirmStartNew && (
        <div data-modal="confirm-start-new" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-center border border-slate-200/80 animate-scale-up">
            <div className="mx-auto w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 flex items-center justify-center mb-4">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Discard saved report?</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Starting a new report will permanently remove your currently saved draft progress.
            </p>
            <div className="flex flex-col gap-2.5">
              <Button 
                onClick={handleConfirmStartNew} 
                className="w-full h-11 text-sm font-bold bg-red-600 text-white hover:bg-red-700 rounded-xl shadow-xs"
              >
                Start New Report
              </Button>
              <Button 
                onClick={() => setShowConfirmStartNew(false)} 
                variant="outline" 
                className="w-full h-11 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl border-slate-200"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <div className="mb-6 flex justify-between items-center bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] overflow-x-auto hide-scrollbar">
        {STEPS.map((s, idx) => {
          const isCurrent = step === idx + 1;
          const isCompleted = step > idx + 1;
          return (
            <div key={s.num} className="flex items-center min-w-max">
              <div className={cn(
                "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold text-xs mr-2 transition-all duration-200",
                isCurrent ? "bg-slate-900 text-white shadow-xs" :
                isCompleted ? "bg-blue-50 text-blue-700 border border-blue-200/60" : "bg-slate-100 text-slate-400"
              )}>
                {isCompleted ? "✓" : s.num}
              </div>
              <span className={cn(
                "text-xs mr-3 sm:mr-6 transition-colors",
                isCurrent ? "text-slate-900 font-bold" :
                isCompleted ? "text-slate-700 font-semibold" : "text-slate-400 font-medium"
              )}>
                {s.title}
              </span>
              {idx < STEPS.length - 1 && <ChevronRight size={14} className="text-slate-300 mr-3 sm:mr-6 shrink-0" />}
            </div>
          );
        })}
      </div>

      <Card className="min-h-[500px] flex flex-col p-5 sm:p-7 bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] rounded-2xl relative">
        <AnimatePresence mode="wait">
          {/* STEP 1: DETAILS (Category + Description + Voice-to-Text) */}
          {step === 1 && (
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col h-full flex-1">
              <PageHeader 
                title="Issue Details" 
                description="Select an official category and describe the civic problem you observed." 
                className="mb-5"
              />
              
              <div className="mb-5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Select Category *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-180 hover:-translate-y-0.5 focus:outline-none cursor-pointer group",
                          isSelected 
                            ? "border-slate-900 bg-slate-50/90 shadow-xs ring-2 ring-slate-900" 
                            : "border-slate-200/80 hover:border-slate-300 hover:shadow-[0_4px_20px_rgba(15,23,42,0.04)] bg-white"
                        )}
                      >
                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-2 border transition-transform duration-180 group-hover:scale-105", cat.color)}>
                          <Icon size={20} />
                        </div>
                        <span className={cn("text-xs font-semibold transition-colors", isSelected ? "text-slate-900 font-bold" : "text-slate-700")}>
                          {cat.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 flex flex-col mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Description *</label>
                  <div className="flex items-center gap-2">
                    {description && (
                      <button 
                        type="button" 
                        onClick={handleClearDescription} 
                        className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Clear description"
                      >
                        <Trash2 size={13} /> Clear
                      </button>
                    )}
                    <span className="text-xs text-slate-400">{description.length} chars</span>
                  </div>
                </div>

                <textarea
                  id="issue-description-input"
                  placeholder="Describe the issue in detail, or click the microphone below to dictate your description..."
                  className="w-full p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm min-h-[100px] resize-none text-slate-900 placeholder:text-slate-400 bg-white transition-all duration-150"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                {/* VOICE INPUT SECTION (Protected by VoiceErrorBoundary) */}
                <VoiceErrorBoundary>
                  <div className="mt-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                  {/* Merge Dialog Prompt if manual text already exists */}
                  {showMergeDialog && pendingTranscript && (
                    <div className="mb-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm animate-fade-in">
                      <div className="flex items-start gap-2.5 mb-2">
                        <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Voice Transcript Ready</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            You already entered a description. Would you like to replace the current text or append the new voice transcript?
                          </p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 italic mb-3">
                        "{pendingTranscript}"
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" onClick={handleMergeReplace} size="sm" className="text-xs font-bold bg-slate-900 text-white">
                          Replace
                        </Button>
                        <Button type="button" onClick={handleMergeAppend} variant="outline" size="sm" className="text-xs font-bold">
                          Append
                        </Button>
                        <Button type="button" onClick={handleMergeCancel} variant="ghost" size="sm" className="text-xs text-slate-500">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Header: Controls and Language selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {voiceState === 'RECORDING' ? (
                        <button
                          type="button"
                          onClick={handleMicButtonClick}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md animate-pulse hover:bg-red-700 transition-all focus:outline-none cursor-pointer"
                          title="Stop Recording"
                        >
                          <Square size={16} className="fill-white" />
                        </button>
                      ) : voiceState === 'PROCESSING' ? (
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 shadow-2xs"
                          title="Processing speech..."
                        >
                          <Loader2 size={18} className="animate-spin text-blue-600" />
                        </div>
                      ) : voiceState === 'TRANSCRIBED' ? (
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-2xs select-none"
                          title="Voice converted to text"
                        >
                          <CheckCircle2 size={20} className="text-emerald-600" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleMicButtonClick}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all shadow-xs focus:outline-none bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5 cursor-pointer"
                          title="Record Voice"
                        >
                          <Mic size={18} />
                        </button>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          {voiceState === 'RECORDING' && (
                            <>
                              <span className="text-red-600 flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                                Listening...
                              </span>
                              <span className="font-mono text-xs bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-full font-bold">
                                {formatDuration(recordingDuration)}
                              </span>
                            </>
                          )}
                          {voiceState === 'PROCESSING' && (
                            <span className="text-blue-600 flex items-center gap-1.5">
                              <Loader2 size={15} className="animate-spin text-blue-600" />
                              Converting voice to text...
                            </span>
                          )}
                          {voiceState === 'TRANSCRIBED' && (
                            <span className="text-emerald-700 flex items-center gap-1.5">
                              <CheckCircle2 size={16} className="text-emerald-600" /> Voice converted to text
                            </span>
                          )}
                          {voiceState === 'ERROR' && (
                            <span className="text-red-600 flex items-center gap-1">
                              <AlertTriangle size={15} /> Voice Notice
                            </span>
                          )}
                          {voiceState === 'IDLE' && (
                            <span className="flex items-center gap-1.5">
                              Voice Description
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mt-0.5">
                          {voiceState === 'RECORDING' && "Speak clearly. Live transcript will appear below. Max 60 seconds."}
                          {voiceState === 'PROCESSING' && "Finalizing speech transcription..."}
                          {voiceState === 'TRANSCRIBED' && "Transcript populated in description above. You can edit it freely."}
                          {voiceState === 'ERROR' && (voiceErrorMessage || "Voice transcription is unavailable.")}
                          {voiceState === 'IDLE' && "Voice transcription uses your browser's speech recognition."}
                        </p>
                      </div>
                    </div>

                    {/* Language Dropdown Selector */}
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <Languages size={14} className="text-slate-400" />
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        disabled={voiceState === 'RECORDING' || voiceState === 'PROCESSING'}
                        className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-900 cursor-pointer disabled:opacity-60 font-semibold shadow-2xs"
                      >
                        <option value="auto">Auto Detect</option>
                        <option value="en">English (en-IN)</option>
                        <option value="hi">हिन्दी (Hindi, hi-IN)</option>
                        <option value="pa">ਪੰਜਾਬੀ (Punjabi, pa-IN)</option>
                      </select>
                    </div>
                  </div>

                  {/* Live Progressive Transcript Box */}
                  {voiceState === 'RECORDING' && (
                    <div className="mt-3 bg-white border border-blue-200/80 rounded-xl p-3 shadow-xs animate-fade-in">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Live Transcript</span>
                      </div>
                      <p className="text-sm text-slate-800 italic font-medium leading-relaxed">
                        "{liveTranscript || 'Listening for speech...'}"
                      </p>
                    </div>
                  )}

                  {/* Recording Live Action Bar */}
                  {voiceState === 'RECORDING' && (
                    <div className="mt-3 bg-red-50/80 border border-red-200 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-red-700">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
                        <span>Listening... ({formatDuration(recordingDuration)})</span>
                      </div>
                      <Button
                        type="button"
                        onClick={() => stopVoiceRecording()}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-8 px-3"
                      >
                        <Square size={12} className="mr-1 fill-white" /> Stop Recording
                      </Button>
                    </div>
                  )}

                  {/* Transcribed state */}
                  {voiceState === 'TRANSCRIBED' && (
                    <div className="mt-3 bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        {detectedLanguage && (
                          <span className="text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 px-2.5 py-1 rounded-full">
                            Detected: {detectedLanguage}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          Added to description field above. You can edit it freely before submitting.
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleRecordAgain(e)}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <RefreshCw size={12} /> Record Again
                      </button>
                    </div>
                  )}

                  {/* Error state options with Try Again and Type Manually */}
                  {voiceState === 'ERROR' && (
                    <div className="mt-3 bg-red-50/80 border border-red-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={15} className="text-red-600 shrink-0" />
                        <span className="text-xs text-red-700 font-medium">{voiceErrorMessage || "Voice transcription is unavailable."}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button 
                          type="button" 
                          onClick={(e) => handleRecordAgain(e)} 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-8 border-red-200 text-red-700 hover:bg-red-100 font-bold"
                        >
                          Try Again
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => {
                            updateVoiceState('IDLE');
                            setVoiceErrorMessage('');
                            const el = document.getElementById('issue-description-input');
                            if (el) el.focus();
                          }} 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs h-8 text-slate-500 hover:text-slate-900 font-semibold"
                        >
                          Type Manually
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Privacy / Engine Notice */}
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 bg-white border border-slate-200/70 rounded-lg px-2.5 py-1.5">
                    <Info size={13} className="text-blue-600 shrink-0" />
                    <span>Voice transcription uses your browser's speech recognition.</span>
                  </div>
                </div>
              </VoiceErrorBoundary>

                {!category && <p className="text-xs text-amber-600 mt-2 font-medium">Please select a category</p>}
                {!description.trim() && category && <p className="text-xs text-amber-600 mt-2 font-medium">Please enter or record an issue description</p>}
              </div>

              <div className="flex justify-end mt-auto pt-4 border-t border-slate-100">
                <Button 
                  onClick={() => {
                    if (voiceStateRef.current === 'RECORDING') stopVoiceRecording();
                    setStep(2);
                  }} 
                  disabled={!category || !description.trim() || description.trim().length < 5} 
                  size="lg" 
                  className="px-8 font-bold"
                >
                  Continue <ChevronRight size={18} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: URGENCY */}
          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col h-full flex-1">
              <div className="mb-4">
                <button onClick={() => setStep(1)} className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
                  <ChevronLeft size={16} className="mr-1" /> Back
                </button>
              </div>
              <PageHeader 
                title="Urgency Level" 
                description="How urgently should this civic issue be addressed?" 
                className="mb-6"
              />
              
              <div className="flex flex-col gap-3 flex-1 mb-8">
                {[
                  { id: 'URGENT', icon: '🚨', title: 'URGENT', desc: 'Immediate attention required — safety risk or serious public hazard', activeColor: 'border-red-500 bg-red-50/70 text-red-900 ring-2 ring-red-500/20' },
                  { id: 'HIGH', icon: '⚠️', title: 'HIGH', desc: 'Should be addressed as soon as possible', activeColor: 'border-amber-500 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/20' },
                  { id: 'MODERATE', icon: '⚡', title: 'MODERATE', desc: 'Needs attention but does not pose an immediate danger', activeColor: 'border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20' },
                  { id: 'LOW', icon: '🌱', title: 'LOW', desc: 'Minor issue that can be addressed during routine maintenance', activeColor: 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20' }
                ].map(u => {
                  const isSelected = urgency === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setUrgency(u.id as Urgency)}
                      className={cn(
                        "flex items-start text-left p-4 rounded-2xl border transition-all duration-180 hover:-translate-y-0.5 focus:outline-none cursor-pointer",
                        isSelected 
                          ? cn(u.activeColor, "shadow-xs font-semibold") 
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-[0_4px_20px_rgba(15,23,42,0.04)]"
                      )}
                    >
                      <span className="text-2xl mr-3.5 select-none">{u.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 mb-0.5 text-sm tracking-wide">{u.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{u.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep(1)} 
                  className="font-semibold text-slate-600"
                >
                  <ChevronLeft size={16} className="mr-1" /> Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!urgency} size="lg" className="px-8 font-bold">
                  Continue <ChevronRight size={18} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: EVIDENCE (Camera Capture + Gallery Upload + Image Controls) */}
          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col h-full flex-1">
              <div className="mb-4">
                <button onClick={() => setStep(2)} className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
                  <ChevronLeft size={16} className="mr-1" /> Back
                </button>
              </div>
              <PageHeader 
                title="Provide Evidence" 
                description="Take a live photo or upload from your device gallery to help AI verify the issue." 
                className="mb-6"
              />
              
              <div className="flex-1 flex flex-col items-center justify-center mb-8 w-full max-w-xl mx-auto">
                {photo ? (
                  <div className="w-full flex flex-col items-center">
                    {/* Responsive Image Preview Container */}
                    <div className="w-full relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-md bg-slate-900 aspect-video max-h-[320px] flex items-center justify-center">
                      <img 
                        src={photo} 
                        alt="Civic issue evidence" 
                        className="w-full h-full object-contain" 
                      />
                      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        <span>Evidence Attached</span>
                      </div>
                    </div>

                    {/* Explicit Accessible Preview Actions: [Retake Photo] [Replace from Gallery] [Remove] */}
                    <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4 w-full">
                      <label className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xs cursor-pointer transition-all duration-150">
                        <Camera size={14} className="text-blue-400" />
                        <span>Take Photo</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          capture="environment" 
                          onChange={handlePhotoUpload} 
                        />
                      </label>

                      <label className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-xs cursor-pointer transition-all duration-150">
                        <ImageIcon size={14} className="text-slate-600" />
                        <span>Replace</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handlePhotoUpload} 
                        />
                      </label>

                      <button 
                        type="button" 
                        onClick={handleRemovePhoto} 
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200/80 shadow-xs cursor-pointer transition-all duration-150"
                      >
                        <Trash2 size={14} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center">
                    {/* Dual Action Choices: Direct Camera vs Device Gallery */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      {/* 1. Take Photo with native camera environment capture */}
                      <label className="flex flex-col items-center justify-center p-6 sm:p-7 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-400 cursor-pointer transition-all duration-200 group text-center">
                        <div className="w-13 h-13 bg-white shadow-xs text-slate-900 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 border border-slate-200 transition-transform">
                          <Camera size={24} className="text-blue-600" />
                        </div>
                        <span className="font-bold text-slate-900 text-sm mb-1">Take Photo</span>
                        <span className="text-xs text-slate-500 mb-2">Capture with device camera</span>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60 uppercase tracking-wider">
                          Mobile Camera
                        </span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          capture="environment" 
                          onChange={handlePhotoUpload} 
                        />
                      </label>

                      {/* 2. Upload from Gallery */}
                      <label className="flex flex-col items-center justify-center p-6 sm:p-7 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-400 cursor-pointer transition-all duration-200 group text-center">
                        <div className="w-13 h-13 bg-white shadow-xs text-slate-900 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 border border-slate-200 transition-transform">
                          <ImageIcon size={24} className="text-slate-700" />
                        </div>
                        <span className="font-bold text-slate-900 text-sm mb-1">Upload from Gallery</span>
                        <span className="text-xs text-slate-500 mb-2">Select existing photo file</span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase tracking-wider">
                          JPG, PNG, WEBP
                        </span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handlePhotoUpload} 
                        />
                      </label>
                    </div>

                    {isCompressing && (
                      <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200/60 animate-pulse">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Optimizing evidence photo for AI triage...</span>
                      </div>
                    )}

                    {!photo && (
                      <p className="text-xs text-amber-600 mt-4 font-medium flex items-center gap-1.5">
                        <AlertTriangle size={14} />
                        <span>Please capture or upload a photo to proceed</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep(2)} 
                  className="font-semibold text-slate-600"
                >
                  <ChevronLeft size={16} className="mr-1" /> Back
                </Button>
                <Button 
                  onClick={() => setStep(4)} 
                  disabled={!photo || isCompressing} 
                  size="lg" 
                  className="px-8 font-bold"
                >
                  Continue <ChevronRight size={18} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: LOCATION (Interactive Leaflet Map + Satellite + Search) */}
          {step === 4 && (
            <motion.div key="step4" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col h-full flex-1">
              <div className="mb-4">
                <button onClick={() => setStep(3)} className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
                  <ChevronLeft size={16} className="mr-1" /> Back
                </button>
              </div>
              
              <div className="flex flex-col mb-4">
                <PageHeader 
                  title="Exact Location" 
                  description="Search a place, drop a pin, drag the marker, or use GPS to set the incident location." 
                  className="mb-4"
                />
                
                {/* Search Bar */}
                <form onSubmit={handleSearchLocation} className="flex bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden mb-2 relative focus-within:border-slate-900 transition-colors">
                  <div className="flex items-center pl-3 text-slate-400">
                    <MapPin size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search location (e.g. Omega City Kharar, Chandigarh University)..."
                    className="flex-1 px-3 py-2.5 text-xs sm:text-sm focus:outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (searchSuggestions.length > 0) setIsSuggestionsOpen(true);
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchSuggestions([]);
                        setIsSuggestionsOpen(false);
                      }}
                      className="px-2 text-slate-400 hover:text-slate-900 cursor-pointer"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <Button type="submit" disabled={isSearchingLocation} variant="ghost" className="rounded-none border-l border-slate-100 px-4 text-xs font-bold text-blue-600">
                    {isSearchingLocation ? <Loader2 size={14} className="animate-spin" /> : "Search"}
                  </Button>
                </form>
                
                {/* Live Loading Banner */}
                {isSearchingLocation && (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-xs mb-4 p-3 text-xs text-slate-500 flex items-center justify-center">
                    <Loader2 size={15} className="animate-spin mr-2 text-blue-600" /> Searching locations...
                  </div>
                )}
                
                {/* Search Error State */}
                {!isSearchingLocation && searchLocationError && (
                  <div className="bg-white border border-amber-200 rounded-xl shadow-xs mb-4 p-3 text-xs text-amber-700 text-center">
                    {searchLocationError}
                  </div>
                )}

                {/* No Locations Found State */}
                {!isSearchingLocation && !searchLocationError && hasSearchedLocation && searchQuery.trim().length >= 2 && searchSuggestions.length === 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-xs mb-4 p-3 text-xs text-slate-500 text-center">
                    No locations found. Try adding a city or landmark.
                  </div>
                )}

                {/* Suggestions Dropdown Card */}
                {!isSearchingLocation && isSuggestionsOpen && searchSuggestions.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-lg mb-4 max-h-56 overflow-y-auto divide-y divide-slate-100 z-50">
                    {searchSuggestions.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        className={cn(
                          "w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5 focus:outline-none cursor-pointer",
                          highlightedIndex === idx ? "bg-slate-50 ring-1 ring-inset ring-slate-900" : ""
                        )}
                        onClick={() => handleSelectSuggestion(item)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                      >
                        <MapPin size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {item.placeName}
                          </div>
                          {item.secondaryAddress && (
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {item.secondaryAddress}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Interactive Map Container */}
              <div className={cn("rounded-2xl border border-slate-200/80 h-72 mb-4 relative overflow-hidden bg-slate-100 shadow-xs", isDropPinMode ? "ring-2 ring-slate-900 cursor-crosshair" : "")}>
                {coordinates ? (
                  <>
                    <MapContainer 
                      center={[coordinates.lat, coordinates.lng]} 
                      zoom={16} 
                      maxZoom={21} 
                      style={{ height: '100%', width: '100%', zIndex: 1 }}
                    >
                      {mapMode === 'satellite' ? (
                        <TileLayer 
                          key="satellite" 
                          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                          maxZoom={21} 
                          attribution="Tiles &copy; Esri" 
                        />
                      ) : (
                        <TileLayer 
                          key="street" 
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                          maxZoom={19} 
                          attribution='&copy; OpenStreetMap' 
                        />
                      )}
                      
                      <MapViewport coordinates={coordinates} />
                      <MapClickHandler onLocationSelect={handleMapClick} active={isDropPinMode} />
                      
                      {/* Draggable Marker */}
                      <Marker 
                        position={[coordinates.lat, coordinates.lng]} 
                        draggable={true}
                        eventHandlers={{
                          dragend: (e) => {
                            const marker = e.target;
                            const position = marker.getLatLng();
                            setCoordinates({ lat: position.lat, lng: position.lng });
                            setLocationSource('Manual');
                            setLocationStr('Fetching address...');
                            reverseGeocode(position.lat, position.lng);
                          }
                        }}
                      />
                      <Circle center={[coordinates.lat, coordinates.lng]} radius={80} pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.15 }} />
                    </MapContainer>

                    {/* Satellite / Street Mode Switcher */}
                    <div className="absolute left-3 top-3 z-[500] flex overflow-hidden rounded-xl border border-white/80 bg-white/95 backdrop-blur-md shadow-md">
                      <button 
                        type="button" 
                        onClick={() => setMapMode('street')} 
                        className={cn("flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer", mapMode === 'street' ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100")}
                      >
                        Map
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setMapMode('satellite')} 
                        className={cn("flex items-center gap-1 border-l border-slate-200 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer", mapMode === 'satellite' ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100")}
                      >
                        <Layers3 size={13} /> Satellite
                      </button>
                    </div>

                    {/* Instruction Tag */}
                    <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded-lg bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 text-[11px] font-medium text-white shadow">
                      {isDropPinMode ? '📍 Tap anywhere on the map to place the pin' : '👆 Drag marker or tap Drop Pin to adjust'}
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
                    <Loader2 size={32} className="animate-spin mb-2 text-blue-600" />
                    <p className="text-sm font-medium">Acquiring Location...</p>
                  </div>
                )}
              </div>

              {/* Location Summary Box */}
              <div className="flex flex-col gap-2 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/60">
                    <MapPin size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{locationStr}</div>
                    {coordinates && (
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Lat: {coordinates.lat.toFixed(5)} • Lng: {coordinates.lng.toFixed(5)} ({locationSource})
                      </div>
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchLiveLocation} 
                    disabled={isLocating}
                    title="Get live GPS location"
                    className="flex items-center gap-1 text-xs font-bold"
                  >
                    {isLocating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />} GPS
                  </Button>
                </div>
              </div>
              
              <div className="mt-auto flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep(3)} 
                    className="font-semibold text-slate-600"
                  >
                    <ChevronLeft size={16} className="mr-1" /> Back
                  </Button>
                  <Button 
                    type="button" 
                    variant={isDropPinMode ? "primary" : "outline"} 
                    onClick={handleManualLocation} 
                    className={cn("font-bold text-xs", isDropPinMode ? "bg-amber-600 hover:bg-amber-700 text-white" : "")}
                  >
                    📍 {isDropPinMode ? "Click Map to Pin" : "Drop Pin"}
                  </Button>
                </div>
                <Button 
                  onClick={() => {
                    setStep(5);
                    runAnalysis();
                  }} 
                  disabled={!coordinates || isAnalyzing} 
                  size="lg" 
                  className="px-8 shadow-xs font-bold"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" /> Analyzing...
                    </div>
                  ) : (
                    <>Continue to Review <ChevronRight size={18} className="ml-1" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: REVIEW & AI ANALYSIS */}
          {step === 5 && (
            <motion.div key="step5" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col h-full flex-1">
              <div className="mb-4">
                <button onClick={() => setStep(4)} className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
                  <ChevronLeft size={16} className="mr-1" /> Back
                </button>
              </div>
              
              <PageHeader 
                title="Review & Contact" 
                description="Review your civic report details and add contact information for progress updates." 
                className="mb-4"
              />

              <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                {/* Issue Summary Card */}
                <div className="border border-slate-200/80 rounded-2xl p-5 bg-white shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold uppercase">{category}</span>
                    </span>
                    <PriorityBadge priority={urgency || 'MODERATE'} size="sm" />
                  </div>

                  {/* Photo & Description */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {photo && (
                      <div className="sm:col-span-1 h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={photo} alt="Report evidence" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className={cn(photo ? "sm:col-span-3" : "sm:col-span-4", "flex flex-col")}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Issue Description</span>
                        <div className="flex items-center gap-2">
                          {hasUsedVoice && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
                              <Mic size={11} /> Voice Transcribed
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setIsEditingReviewDesc(!isEditingReviewDesc)}
                            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                            title="Edit Description"
                          >
                            <Edit3 size={13} /> {isEditingReviewDesc ? 'Done Editing' : 'Edit Description'}
                          </button>
                        </div>
                      </div>

                      {isEditingReviewDesc ? (
                        <div className="space-y-2">
                          <textarea
                            value={description}
                            onChange={(e) => {
                              setDescription(e.target.value);
                              updateReportDraft({ description: e.target.value });
                            }}
                            placeholder="Description of the issue..."
                            className="w-full p-3 text-sm text-slate-900 border border-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 resize-y min-h-[95px] bg-white leading-relaxed font-normal shadow-inner"
                            autoFocus
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">Readable transcript. Fully editable.</span>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setIsEditingReviewDesc(false);
                                runAnalysis(description);
                              }}
                              className="text-xs h-7 px-3 font-bold"
                            >
                              Save & Re-analyze AI
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {description ? (
                            description
                          ) : (
                            <span className="italic text-slate-400">No description provided.</span>
                          )}
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        Transcript is the primary description used for AI triage and department routing.
                      </p>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="pt-3 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-500">
                    <MapPin size={15} className="mt-0.5 flex-shrink-0 text-blue-600" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 text-sm">{locationStr}</div>
                      {coordinates && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Coordinates: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)} ({locationSource})
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optional Contact Inputs */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Contact for Updates (Optional)</h4>
                    <span className="text-[10px] text-slate-400">Kept private & secure</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
                        <span className="text-[10px] text-slate-400">10 digits</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        className={cn(
                          "w-full p-2.5 border rounded-xl focus:outline-none focus:ring-1 text-sm bg-white font-mono",
                          phoneError ? "border-red-400 focus:ring-red-400 ring-1 ring-red-400" : "border-slate-200 focus:ring-slate-900"
                        )}
                        value={contactPhone}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setContactPhone(digitsOnly);
                          if (digitsOnly.length > 0 && digitsOnly.length < 10) {
                            setPhoneError('Mobile number must contain 10 digits.');
                          } else {
                            setPhoneError('');
                          }
                        }}
                        onBlur={() => {
                          if (contactPhone.length > 0 && contactPhone.length < 10) {
                            setPhoneError('Mobile number must contain 10 digits.');
                          } else {
                            setPhoneError('');
                          }
                        }}
                      />
                      {phoneError && (
                        <p className="text-xs text-red-600 mt-1 font-medium">{phoneError}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. citizen@example.com"
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 text-sm bg-white"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Storage Error Fallback */}
                {storageError && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <AlertTriangle className="text-red-600 mt-0.5" size={20} />
                      <div>
                        <h4 className="font-bold text-red-700 text-sm">Storage Limit Notice</h4>
                        <p className="text-sm text-slate-700 mt-1">
                          Local prototype storage is full. You can proceed without the attached image.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={() => { setPhoto(null); setStorageError(false); handleSubmit(); }} className="text-xs bg-red-600 hover:bg-red-700 text-white">
                        Submit Without Image
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep(4)} 
                  className="font-semibold text-slate-600 h-12 px-5"
                >
                  <ChevronLeft size={16} className="mr-1" /> Edit
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  size="lg" 
                  disabled={!isOnline}
                  className="flex-1 shadow-md h-12 text-sm font-bold bg-slate-900 text-white hover:bg-slate-800"
                >
                  Submit Report
                </Button>
              </div>
              {!isOnline && (
                <p className="text-center text-xs text-amber-600 font-medium mt-2">
                  Internet connection is required to submit. Your draft is safely saved locally.
                </p>
              )}
            </motion.div>
          )}

          {/* STEP 6: SUBMIT SUCCESS & AI VERIFICATION */}
          {step === 6 && (
            <motion.div key="step6" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col items-center justify-center h-full py-8 text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200/60 flex items-center justify-center mb-4 shadow-xs">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Issue Reported Successfully</h2>
              <p className="text-slate-500 mb-6 font-mono text-xs bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">
                Incident ID: CP-2026-{Math.floor(1000 + Math.random() * 9000)}
              </p>
              
              {aiResult && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 mb-8 w-full max-w-lg text-left shadow-[0_4px_20px_rgba(15,23,42,0.04)] overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-900"></div>
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="font-bold text-slate-900 text-sm tracking-wide uppercase flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-600" /> AI-Assisted Assessment
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded-full">
                      Automated Triage
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Detected Category</span>
                      <span className="font-bold text-slate-900 text-sm">{aiResult.detectedCategory}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Priority Level</span>
                      <PriorityBadge priority={aiResult.severity} score={aiResult.priorityScore} size="sm" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Citizen Urgency</span>
                      <span className="font-bold text-slate-900 text-sm">{urgency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Priority Score</span>
                      <span className="font-bold text-slate-900 text-sm tabular-nums">{aiResult.priorityScore}/100</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">AI Confidence</span>
                      <span className="font-bold text-slate-900 text-sm tabular-nums">{aiResult.confidence}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Status</span>
                      <span className="font-bold text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded-md inline-block">Assigned to Dept</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mb-4">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Priority Factor Reasoning</span>
                    <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      "Calculated based on {aiResult.priorityReasoning.map(r => r.factor.toLowerCase()).join(', ')} resulting in {aiResult.priorityScore} priority points."
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <div className="mb-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Assigned Department</span>
                      <span className="font-bold text-slate-900 text-sm">🏛️ {aiResult.suggestedDepartment}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Target SLA Resolution Time</span>
                      <span className="font-bold text-slate-900 text-xs bg-white px-2 py-1 rounded-md border border-slate-200 inline-block">
                        {aiResult.estimatedResolutionTime}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <Button onClick={() => navigate('/my-reports')} size="lg" className="w-full max-w-md shadow-xs font-bold">
                View My Reports
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};

export default ReportIssue;
