import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, ChevronRight, ChevronLeft, Loader2, AlertTriangle, Info, CheckCircle2, Crosshair, Check, Mic, Square, Play, Trash2, PhoneCall, Edit2, FileText, Users } from 'lucide-react';
import { Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useStore } from '../../store/useStore';
import { analyzeIssue, detectDuplicates } from '../../services/aiService';
import { AIAnalysis, IssueCategory, Urgency } from '../../types';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { compressImage } from '../../utils/imageCompression';
import { saveMediaBlob, getMediaBlob, deleteMediaBlob } from '../../utils/indexedDB';


const CATEGORIES = [
  { id: 'Pothole', icon: AlertTriangle, color: 'bg-civic-warning/10 text-civic-warning border-civic-warning/20' },
  { id: 'Garbage', icon: AlertTriangle, color: 'bg-civic-accent/10 text-civic-accent border-civic-accent/20' },
  { id: 'Streetlight', icon: AlertTriangle, color: 'bg-brand-100 text-brand-600 border-brand-200' },
  { id: 'Waterlogging', icon: AlertTriangle, color: 'bg-civic-secondary/10 text-civic-secondary border-civic-secondary/20' },
  { id: 'Road Damage', icon: AlertTriangle, color: 'bg-orange-100 text-orange-600 border-orange-200' },
  { id: 'Traffic Sign', icon: AlertTriangle, color: 'bg-civic-danger/10 text-civic-danger border-civic-danger/20' },
  { id: 'Public Safety', icon: AlertTriangle, color: 'bg-purple-100 text-purple-600 border-purple-200' },
  { id: 'Other', icon: Info, color: 'bg-brand-100 text-brand-600 border-brand-200' }
];

const STEPS = [
  { num: '01', title: 'Category' },
  { num: '02', title: 'Description' },
  { num: '03', title: 'Evidence' },
  { num: '04', title: 'Urgency' },
  { num: '05', title: 'Location' },
  { num: '06', title: 'Contact' },
  { num: '07', title: 'Review' },
  { num: '08', title: 'Submit' }
];

const MapPicker = ({ position, onLocationSelect, active }: { position: {lat: number, lng: number} | null, onLocationSelect: (lat: number, lng: number) => void, active: boolean }) => {
  const map = useMap();
  
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 3 && autocompleteService) {
        setIsLocating(true);
        try {
          const res = await autocompleteService.getPlacePredictions({ input: searchQuery, componentRestrictions: { country: 'in' } });
          const suggestions = res.predictions.map(p => ({
            place_id: p.place_id,
            display_name: p.description,
            is_google: true
          }));
          setSearchSuggestions(suggestions);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLocating(false);
        }
      } else {
        setSearchSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, autocompleteService]);

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !autocompleteService) return;
    setIsLocating(true);
    try {
      const res = await autocompleteService.getPlacePredictions({ input: searchQuery, componentRestrictions: { country: 'in' } });
      if (res.predictions && res.predictions.length > 0) {
        const suggestions = res.predictions.map(p => ({
          place_id: p.place_id,
          display_name: p.description,
          is_google: true
        }));
        setSearchSuggestions(suggestions);
        if (suggestions.length === 1) {
          handleSelectSuggestion(suggestions[0]);
        }
      } else {
        alert("No locations found. Try a nearby landmark, road, sector or full address.");
      }
    } catch (e) {
      console.error(e);
      alert("Location search is temporarily unavailable. You can still use Current Location or Drop Pin.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    if (suggestion.is_google && geocoder) {
      geocoder.geocode({ placeId: suggestion.place_id }).then((response) => {
        if (response.results[0]) {
          const location = response.results[0].geometry.location;
          setCoordinates({ lat: location.lat(), lng: location.lng() });
          setLocationStr(suggestion.display_name);
          setLocationSource('Search');
          setLocationError(false);
          setIsDropPinMode(false);
          setSearchSuggestions([]);
          setSearchQuery('');
        }
      });
    } else {
       // fallback if somehow needed
       setSearchSuggestions([]);
       setSearchQuery('');
    }
  };

  const getAIAnalysis = async () => {
    setStep('AI_LOADING' as any);
    setIsAnalyzing(true);
    const analysisText = description.trim() ? description : voiceTranscript;
    const [analysis, dupes] = await Promise.all([
      analyzeIssue(photo, analysisText, urgency as Urgency, (category || 'Other') as IssueCategory),
      detectDuplicates(coordinates?.lat || 0, coordinates?.lng || 0, (category || 'Other') as IssueCategory, analysisText, issues)
    ]);
    setAiResult(analysis);
    setDuplicateData(dupes);
    setIsAnalyzing(false);
    setStep('AI_REVIEW' as any);
  };

  const handleSubmit = async () => {
    const newId = `CP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    
    let voiceRecordingData = undefined;
    if (voiceBlob && voiceRecordingId) {
      voiceRecordingData = {
        id: voiceRecordingId,
        duration: recordingTime,
        mimeType: voiceBlob.type || 'audio/webm',
        transcript: voiceTranscript || undefined
      };
    }
    
    try {
      addIssue({
        id: newId,
        title: `${category || aiResult?.detectedCategory} at ${locationStr}`,
        description,
        category: (category || aiResult?.detectedCategory) as IssueCategory,
        location: {
          lat: coordinates?.lat || 0,
          lng: coordinates?.lng || 0,
          address: locationStr + (locationSource !== 'GPS' ? ` (${locationSource})` : ''),
          ward: 'Ward 4',
          zone: 'Central'
        },
        photos: photo ? [photo] : [],
        status: 'REPORTED',
        priority: aiResult?.severity || 'MEDIUM',
        priorityScore: aiResult?.priorityScore || 50,
        citizenUrgency: urgency as Urgency,
        estimatedResolutionTime: aiResult?.estimatedResolutionTime || '2-5 days',
        reporterId: currentUser?.id || 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slaTarget: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        aiAnalysis: aiResult || undefined,
        contactPhone: contactPhone || undefined,
        contactEmail: contactEmail || undefined,
        voiceRecording: voiceRecordingData,
        timeline: [
          { id: `tl-${Date.now()}`, status: 'REPORTED', timestamp: new Date().toISOString(), description: 'Issue reported by citizen', actor: 'Citizen' },
          ...(aiResult ? [{ id: `tl-${Date.now()+1}`, status: 'AI_VERIFIED' as const, timestamp: new Date().toISOString(), description: 'AI categorized and prioritized', actor: 'System AI' }] : [])
        ]
      });
      
      setStorageError(false);
      clearReportDraft(); // Clear draft on successful submission
      setStep(8);
    } catch (error) {
      console.error("Storage error:", error);
      setStorageError(true);
      setStep(7); // Go back to review on error
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 10 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -10 }
  };

  const canProceedStep2 = description.trim().length >= 5 || voiceBlob !== null;

  if (showDraftPrompt) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-xl text-center border border-civic-border">
        <div className="w-16 h-16 bg-civic-primary/10 text-civic-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText size={32} />
        </div>
        <h2 className="text-2xl font-bold text-civic-text mb-2">Continue your unfinished report?</h2>
        <p className="text-civic-muted mb-6">
          You have an unfinished report draft.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={restoreDraft} className="w-full h-12 text-md">
            Continue Draft
          </Button>
          <Button onClick={discardDraft} variant="outline" className="w-full h-12 text-md text-red-500 border-red-200 hover:bg-red-50">
            Start New Report
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 md:py-8">
      {/* Draft Indicator */}
      {reportDraft && step < 8 && step !== ('AI_LOADING' as any) && step !== ('AI_REVIEW' as any) && (
        <div className="flex items-center justify-end mb-2">
          <span className="text-xs text-brand-500 bg-brand-100 px-2 py-1 rounded flex items-center gap-1">
            <Check size={12} /> Draft saved
          </span>
        </div>
      )}

      {/* Step Indicator */}
      {typeof step === 'number' && step < 8 && (
        <div className="mb-8 overflow-x-auto pb-4">
          <div className="flex justify-between items-center relative min-w-[500px]">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-brand-200 -z-10 rounded-full"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-civic-primary -z-10 rounded-full transition-all duration-300"
              style={{ width: `${((step - 1) / 6) * 100}%` }}
            ></div>
            
            {STEPS.slice(0, 7).map((s, idx) => {
              const isActive = step === idx + 1;
              const isPast = step > idx + 1;
              return (
                <div key={s.num} className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                    isActive ? "bg-civic-primary text-white ring-4 ring-civic-primary/20" : 
                    isPast ? "bg-civic-primary text-white" : "bg-brand-100 text-brand-500"
                  )}>
                    {isPast ? <Check size={16} /> : s.num}
                  </div>
                  <span className={cn(
                    "text-xs font-medium hidden sm:block whitespace-nowrap",
                    isActive || isPast ? "text-civic-primary" : "text-brand-400"
                  )}>{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {nearbyIssues.length > 0 && step >= 5 && step < 8 && (
        <div className="mb-4 bg-brand-50 border border-brand-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Users size={24} className="text-civic-primary mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-civic-text text-sm">People in your area are also reporting this issue.</h4>
              <p className="text-xs text-civic-muted mt-1">
                {nearbyIssues.length} nearby reports • {nearbyIssues.reduce((acc, iss) => acc + (iss.upvotes || 0), 0)} community upvotes
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={() => navigate('/community-pulse')}>
            View Community Reports
          </Button>
        </div>
      )}

      <Card className="min-h-[500px] flex flex-col relative overflow-hidden bg-white shadow-sm border-civic-border">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col h-full flex-1">
              <PageHeader 
                title="What's the issue?" 
                description="Select a category that best describes the problem." 
                className="mb-6"
              />
              
              {showEmergencyWarning ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-red-50 rounded-xl border border-red-200">
                  <AlertTriangle className="text-red-500 mb-4" size={48} />
                  <h3 className="text-xl font-bold text-red-700 mb-2">Is this an immediate emergency?</h3>
                  <p className="text-red-600 mb-8 max-w-md">
                    CivicPulse is designed for civic issue reporting and tracking. For immediate emergencies or danger, contact the appropriate emergency service directly.
                  </p>
                  <div className="flex flex-col w-full gap-3 max-w-xs">
                    <a href="tel:112" className="w-full">
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 h-14 text-lg border-0">
                        <PhoneCall size={20} /> Yes — Call 112
                      </Button>
                    </a>
                    <Button variant="outline" className="w-full" onClick={() => { setShowEmergencyWarning(false); setStep(2); }}>
                      No — Continue Report
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 mb-8">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setCategory(cat.id);
                          if (cat.id === 'Public Safety') setShowEmergencyWarning(true);
                          else setStep(2);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-civic-primary bg-white hover:border-brand-300 hover:bg-brand-50",
                          category === cat.id ? "border-civic-primary" : "border-brand-200"
                        )}
                      >
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3", cat.color)}>
                          <cat.icon size={24} />
                        </div>
                        <span className="font-semibold text-sm text-civic-text text-center">{cat.id}</span>
                      </button>
                    ))}
                  </div>
                  {category && (
                    <div className="flex justify-end mt-auto pt-4 border-t border-brand-100">
                      <Button onClick={() => setStep(2)} size="lg" className="px-8">
                        Continue <ChevronRight size={18} className="ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col h-full flex-1">
              <div className="mb-4">
                <button onClick={() => { setShowEmergencyWarning(false); setStep(1); }} className="flex items-center text-sm font-medium text-civic-muted hover:text-civic-primary transition-colors">
                  <ChevronLeft size={16} className="mr-1" /> Back
                </button>
              </div>
              <PageHeader 
                title="Description" 
                description="Describe the issue or record a voice message." 
                className="mb-6"
              />
              
              <div className="flex-1 flex flex-col gap-6">
                <div>
                  <label className="block text-sm font-semibold text-civic-text mb-2">Text Description</label>
                  <textarea
                    className={cn("w-full p-3 border rounded-lg bg-brand-50 text-civic-text focus:border-civic-primary focus:ring-1 focus:ring-civic-primary outline-none transition-colors resize-none h-24 mb-1", !canProceedStep2 ? "border-red-300" : "border-brand-200")}
                    placeholder="Provide details... e.g. 'Large pothole near university gate.'"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-center">
                  <div className="h-px bg-brand-200 flex-1"></div>
                  <span className="px-4 text-xs font-bold text-civic-muted uppercase tracking-wider">OR</span>
                  <div className="h-px bg-brand-200 flex-1"></div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-civic-text mb-2">Can't type? Record your issue</label>
                  {!voiceBlob ? (
                    <div className="bg-brand-50 border border-brand-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                      {!isRecording ? (
                        <button onClick={startRecording} className="w-16 h-16 rounded-full bg-civic-primary text-white flex items-center justify-center shadow-lg hover:bg-civic-primary/90 transition-transform hover:scale-105 mb-3">
                          <Mic size={28} />
                        </button>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="text-red-500 font-bold mb-3 animate-pulse flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Recording... 00:${recordingTime.toString().padStart(2, '0')}
                          </div>
                          <button onClick={stopRecording} className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center shadow-md hover:bg-red-200 transition-transform hover:scale-105 mb-3">
                            <Square size={24} fill="currentColor" />
                          </button>
                        </div>
                      )}
                      <p className="text-sm text-civic-muted">Max 60 seconds</p>
                    </div>
                  ) : (
                    <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-civic-text">Voice recording ready</p>
                          <p className="text-xs text-civic-muted">00:${recordingTime.toString().padStart(2, '0')} duration</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <audio src={voiceUrl!} controls className="hidden" id="audioPlayer" />
                        <button onClick={() => {
                          const audio = document.getElementById('audioPlayer') as HTMLAudioElement;
                          audio.play();
                        }} className="p-2 rounded-lg bg-white border border-brand-200 text-civic-text hover:bg-brand-50">
                          <Play size={18} />
                        </button>
                        <button onClick={deleteRecording} className="p-2 rounded-lg bg-white border border-red-200 text-red-500 hover:bg-red-50">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                  {voiceTranscript && (
                    <div className="mt-3 bg-white border border-brand-100 p-3 rounded-lg">
                      <span className="text-[10px] uppercase font-bold text-civic-muted block mb-1">Live Transcript:</span>
                      <p className="text-sm text-civic-text italic">"${voiceTranscript}"</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end mt-6 pt-4 border-t border-brand-100">
                <Button onClick={() => setStep(3)} disabled={!canProceedStep2} size="lg" className="px-8">
                  Continue <ChevronRight size={18} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col h-full flex-1">
              <div className="mb-4">
                <button onClick={() => setStep(2)} className="flex items-center text-sm font-medium text-civic-muted hover:text-civic-primary transition-colors">
                  <ChevronLeft size={16} className="mr-1" /> Back
                </button>
              </div>
              <PageHeader 
                title="Provide Evidence" 
                description="Upload a mandatory photo to help AI assess severity." 
                className="mb-6"
              />
              
              <div className="flex-1 flex flex-col items-center justify-center mb-8">
                {photo ? (
                  <div className="w-full max-w-md mx-auto relative group">
                    <img src={photo} alt="Issue evidence" className="w-full h-64 object-cover rounded-xl border border-brand-200" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 rounded-xl">
                      <label className="bg-white text-civic-text px-4 py-2 rounded-lg font-medium cursor-pointer hover:bg-brand-50">
                        Replace
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                      </label>
                      <button onClick={handleRemovePhoto} className="bg-civic-danger text-white px-4 py-2 rounded-lg font-medium hover:bg-civic-danger/90">
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="w-full max-w-md mx-auto h-64 border-2 border-dashed border-brand-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-brand-50 transition-colors bg-white group">
                    <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 transition-transform group-hover:bg-civic-primary group-hover:text-white">
                      {isCompressing ? <Loader2 className="animate-spin" size={32} /> : <Camera size={32} />}
                    </div>
                    <span className="font-bold text-civic-text mb-1">
                      {isCompressing ? 'Processing image...' : 'Tap to upload photo'}
                    </span>
                    <span className="text-xs text-civic-muted text-center max-w-[200px]">
                      Mandatory evidence required.
                    </span>
                    <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handlePhotoUpload} disabled={isCompressing} />
                  </label>
                )}
              </div>
              
              <div className="flex justify-end mt-auto pt-4 border-t border-brand-100">
                <Button onClick={() => setStep(4)} disabled={!photo} size="lg" className="px-8">
                  Continue <ChevronRight size={18} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col h-full flex-1">
              <div className="mb-4">
                <button onClick={() => setStep(3)} className="flex items-center text-sm font-medium text-civic-muted hover:text-civic-primary transition-colors">
                  <ChevronLeft size={16} className="mr-1" /> Back
                </button>
              </div>
              <PageHeader 
                title="Urgency" 
                description="How urgently should this issue be addressed?" 
                className="mb-6"
              />
              
              <div className="flex flex-col gap-3 flex-1 mb-8">
                {[
                  { id: 'URGENT', icon: '🔴', title: 'URGENT', desc: 'Immediate attention required — safety risk or serious public impact', color: 'border-red-200 bg-red-50 text-red-700' },
                  { id: 'HIGH', icon: '🟠', title: 'HIGH', desc: 'Should be addressed as soon as possible', color: 'border-orange-200 bg-orange-50 text-orange-700' },
                  { id: 'MODERATE', icon: '🟡', title: 'MODERATE', desc: 'Needs attention but does not require immediate action', color: 'border-yellow-200 bg-yellow-50 text-yellow-700' },
                  { id: 'LOW', icon: '🟢', title: 'LOW', desc: 'Minor issue that can be addressed during routine maintenance', color: 'border-green-200 bg-green-50 text-green-700' }
                ].map(u => (
                  <button
                    key={u.id}
                    onClick={() => setUrgency(u.id as Urgency)}
                    className={cn(
                      "flex items-start text-left p-4 rounded-xl border-2 transition-all hover:-translate-y-1 focus:outline-none",
                      urgency === u.id ? cn(u.color, "border-opacity-100 shadow-sm") : "border-brand-200 bg-white hover:bg-brand-50"
                    )}
                  >
                    <span className="text-2xl mr-3">{u.icon}</span>
                    <div>
                      <h4 className="font-bold text-civic-text mb-1">{u.title}</h4>
                      <p className="text-sm text-civic-muted">{u.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end mt-auto pt-4 border-t border-brand-100">
                <Button onClick={() => setStep(5)} disabled={!urgency} size="lg" className="px-8">
                  Continue <ChevronRight size={18} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col h-full flex-1">
              <div className="mb-4">
                <button onClick={() => setStep(4)} className="flex items-center text-sm font-medium text-civic-muted hover:text-civic-primary transition-colors">
                  <ChevronLeft size={16} className="mr-1" /> Back
                </button>
              </div>
              <PageHeader 
                title="Location" 
                description="Where is this issue located?" 
                className="mb-6"
              />
              
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex gap-2 mb-4">
                  <button onClick={fetchLiveLocation} className={cn("flex-1 py-2 px-3 rounded-lg text-sm font-medium border flex items-center justify-center gap-2 transition-colors", locationSource === 'GPS' ? "bg-civic-primary text-white border-civic-primary" : "bg-white text-civic-text border-brand-200 hover:bg-brand-50")}>
                    <MapPin size={16} /> Current Location
                  </button>
                  <button onClick={handleManualLocation} className={cn("flex-1 py-2 px-3 rounded-lg text-sm font-medium border flex items-center justify-center gap-2 transition-colors", isDropPinMode ? "bg-civic-primary text-white border-civic-primary animate-pulse" : locationSource === 'Manual' ? "bg-civic-primary text-white border-civic-primary" : "bg-white text-civic-text border-brand-200 hover:bg-brand-50")}>
                    <Crosshair size={16} /> Drop Pin
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSearchLocation(e); }} className="relative mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for an address or landmark..."
                    className="w-full p-3 pr-10 border border-brand-200 rounded-lg text-sm focus:outline-none focus:border-civic-primary bg-white"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-brand-400 hover:text-civic-primary">
                    <Loader2 size={16} className={cn(isLocating && searchQuery ? "animate-spin" : "hidden")} />
                    {!isLocating && <MapPin size={16} />}
                  </button>

                  {searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-brand-200 rounded-lg shadow-xl z-[1000] max-h-48 overflow-y-auto">
                      {searchSuggestions.map((s, i) => (
                        <div key={i} onClick={() => handleSelectSuggestion(s)} className="p-3 border-b border-brand-50 last:border-0 hover:bg-brand-50 cursor-pointer text-sm">
                          {s.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </form>

                {isDropPinMode && (
                  <div className="bg-civic-primary/10 border border-civic-primary/20 text-civic-primary text-sm font-medium p-3 rounded-lg mb-4 flex items-center justify-center animate-pulse text-center">
                    Drop Pin Mode: Click anywhere on the map to select the issue location.
                  </div>
                )}

                <div className="w-full h-[250px] bg-brand-100 rounded-xl overflow-hidden relative border border-brand-200 mb-4 z-0">
                  <Map 
                    defaultCenter={{ lat: 30.7333, lng: 76.7794 }} 
                    defaultZoom={12} 
                    mapId="civicpulse_report_map"
                    onClick={(e) => {
                      if (isDropPinMode && e.detail.latLng) {
                        handleMapClick(e.detail.latLng.lat, e.detail.latLng.lng);
                      }
                    }}
                    disableDefaultUI={true}
                  >
                    <MapPicker position={coordinates} onLocationSelect={(lat, lng) => {
                      setCoordinates({ lat, lng });
                      setLocationSource('Manual');
                      reverseGeocode(lat, lng);
                    }} active={true} />
                  </Map>
                  
                  {isLocating && !searchQuery && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-[400] flex flex-col items-center justify-center">
                      <Loader2 className="animate-spin text-civic-primary mb-2" size={32} />
                      <span className="font-bold text-civic-primary">Fetching location...</span>
                    </div>
                  )}
                </div>

                <div className="bg-brand-50 p-4 rounded-xl border border-brand-200 flex items-start gap-3 mt-auto">
                  <MapPin className="text-civic-primary shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-bold text-civic-text text-sm">Selected Location</h4>
                    <p className="text-sm text-civic-muted leading-tight mt-1">{locationStr}</p>
                    {coordinates && (
                      <p className="text-xs text-brand-400 mt-2 font-mono">Lat: {coordinates.lat.toFixed(6)} | Lng: {coordinates.lng.toFixed(6)}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-4 pt-4 border-t border-brand-100">
                <Button onClick={() => setStep(6)} disabled={!coordinates} size="lg" className="px-8">
                  Continue <ChevronRight size={18} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="step6" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col h-full flex-1">
              <div className="mb-4">
                <button onClick={() => setStep(5)} className="flex items-center text-sm font-medium text-civic-muted hover:text-civic-primary transition-colors">
                  <ChevronLeft size={16} className="mr-1" /> Back
                </button>
              </div>
              <PageHeader 
                title="Contact Info (Optional)" 
                description="Allow departments to reach you for updates." 
                className="mb-6"
              />
              
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-civic-text mb-2">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full p-3 border border-brand-200 rounded-lg bg-white text-civic-text focus:border-civic-primary focus:ring-1 focus:ring-civic-primary outline-none"
                    placeholder="+91 98765 43210"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-civic-text mb-2">Email Address</label>
                  <input
                    type="email"
                    className="w-full p-3 border border-brand-200 rounded-lg bg-white text-civic-text focus:border-civic-primary focus:ring-1 focus:ring-civic-primary outline-none"
                    placeholder="citizen@example.com"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-auto pt-4 border-t border-brand-100">
                <Button onClick={() => setStep(7)} size="lg" className="px-8">
                  Review Report <ChevronRight size={18} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 7 && (
            <motion.div key="step7" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col h-full flex-1 overflow-y-auto pr-2">
              <PageHeader 
                title="Review Your Report" 
                description="Please verify the details before AI analysis." 
                className="mb-6"
              />
              
              <div className="space-y-4 mb-8">
                <div className="bg-brand-50 p-4 rounded-xl border border-brand-200 flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-civic-text text-sm uppercase tracking-wider mb-1">Issue Category</h4>
                    <p className="font-medium text-civic-text">{category}</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-civic-primary hover:text-brand-600 flex items-center text-sm font-medium transition-colors p-2 -m-2">
                    <Edit2 size={14} className="mr-1" /> Edit
                  </button>
                </div>

                <div className="bg-brand-50 p-4 rounded-xl border border-brand-200 flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-civic-text text-sm uppercase tracking-wider mb-2">Description</h4>
                    {description.trim() ? (
                      <p className="text-sm text-civic-muted italic">"{description}"</p>
                    ) : (
                      <p className="text-sm text-civic-muted italic flex items-center gap-2">
                        <Mic size={16} /> Voice Recording Attached
                        {voiceTranscript && <span className="block mt-1 text-xs text-brand-500">Transcript: "{voiceTranscript}"</span>}
                      </p>
                    )}
                  </div>
                  <button onClick={() => setStep(2)} className="text-civic-primary hover:text-brand-600 flex items-center text-sm font-medium transition-colors p-2 -m-2">
                    <Edit2 size={14} className="mr-1" /> Edit
                  </button>
                </div>

                <div className="bg-brand-50 p-4 rounded-xl border border-brand-200 flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-civic-text text-sm uppercase tracking-wider mb-2">Photo</h4>
                    {photo ? (
                      <img src={photo} className="h-20 w-32 object-cover rounded-lg border border-brand-200" alt="Preview" />
                    ) : (
                      <p className="text-sm font-medium text-red-500">Missing</p>
                    )}
                  </div>
                  <button onClick={() => setStep(3)} className="text-civic-primary hover:text-brand-600 flex items-center text-sm font-medium transition-colors p-2 -m-2">
                    <Edit2 size={14} className="mr-1" /> Edit
                  </button>
                </div>

                <div className="bg-brand-50 p-4 rounded-xl border border-brand-200 flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-civic-text text-sm uppercase tracking-wider mb-2">Location</h4>
                    <p className="text-sm text-civic-muted font-medium mb-1 line-clamp-2">{locationStr}</p>
                    {coordinates && <p className="text-[10px] text-brand-400 font-mono">LAT: {coordinates.lat.toFixed(6)} | LNG: {coordinates.lng.toFixed(6)}</p>}
                  </div>
                  <button onClick={() => setStep(5)} className="text-civic-primary hover:text-brand-600 flex items-center text-sm font-medium transition-colors p-2 -m-2">
                    <Edit2 size={14} className="mr-1" /> Edit
                  </button>
                </div>
                
                <div className="bg-brand-50 p-4 rounded-xl border border-brand-200 flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-civic-text text-sm uppercase tracking-wider mb-1">Urgency</h4>
                    <p className="text-sm font-bold text-civic-primary">{urgency}</p>
                  </div>
                  <button onClick={() => setStep(4)} className="text-civic-primary hover:text-brand-600 flex items-center text-sm font-medium transition-colors p-2 -m-2">
                    <Edit2 size={14} className="mr-1" /> Edit
                  </button>
                </div>

                <div className="bg-brand-50 p-4 rounded-xl border border-brand-200 flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-civic-text text-sm uppercase tracking-wider mb-2">Contact Info</h4>
                    <p className="text-sm text-civic-muted">{contactPhone ? `Phone: ${contactPhone}` : 'Phone: Not provided'}</p>
                    <p className="text-sm text-civic-muted">{contactEmail ? `Email: ${contactEmail}` : 'Email: Not provided'}</p>
                  </div>
                  <button onClick={() => setStep(6)} className="text-civic-primary hover:text-brand-600 flex items-center text-sm font-medium transition-colors p-2 -m-2">
                    <Edit2 size={14} className="mr-1" /> Edit
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-brand-100 pb-2">
                <Button onClick={getAIAnalysis} disabled={isAnalyzing} size="lg" className="w-full shadow-lg h-14 relative overflow-hidden">
                  Run AI Analysis & Verify
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'AI_LOADING' as any && (
            <motion.div key="ai_loading" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col items-center justify-center h-full py-16 text-center">
               <Loader2 className="animate-spin text-civic-primary mb-6" size={48} />
               <h3 className="text-xl font-bold text-civic-text">Analyzing Report...</h3>
               <p className="text-civic-muted mt-2">Our AI is verifying category, severity, and checking for duplicates.</p>
            </motion.div>
          )}

          {step === 'AI_REVIEW' as any && aiResult && (
            <motion.div key="ai_review" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col h-full flex-1">
              <PageHeader 
                title="AI Analysis Complete" 
                description="Please review the automated assessment before final submission." 
                className="mb-6"
              />
              
              <div className="bg-white border-2 border-brand-200 rounded-xl p-6 mb-8 w-full text-left shadow-lg overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-civic-primary"></div>
                
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-4">
                  <div>
                    <span className="text-[10px] text-civic-muted uppercase font-bold tracking-wider block mb-1">Category</span>
                    <span className="font-semibold text-civic-text text-sm">{aiResult.detectedCategory}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-civic-muted uppercase font-bold tracking-wider block mb-1">Severity</span>
                    <span className={cn(
                      "font-bold text-xs px-2 py-1 rounded inline-block",
                      aiResult.severity === 'HIGH' || aiResult.severity === 'CRITICAL' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                    )}>
                      {aiResult.severity}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-civic-muted uppercase font-bold tracking-wider block mb-1">Priority Score</span>
                    <span className="font-black text-civic-primary text-sm">{aiResult.priorityScore}/100</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-civic-muted uppercase font-bold tracking-wider block mb-1">Suggested Dept</span>
                    <span className="font-semibold text-civic-text text-sm">{aiResult.suggestedDepartment}</span>
                  </div>
                </div>

                <div className="border-t border-brand-100 pt-4 mb-4">
                  <span className="text-[10px] text-civic-muted uppercase font-bold tracking-wider block mb-1">Reasoning</span>
                  <p className="text-xs text-civic-text italic bg-brand-50 p-2 rounded">
                    "Calculated based on {aiResult.priorityReasoning.map(r => r.factor.toLowerCase()).join(', ')} resulting in {aiResult.priorityScore} priority points."
                  </p>
                </div>
                
                {duplicateData?.isDuplicate && (
                  <div className="bg-red-50 p-3 rounded border border-red-200 mb-4">
                    <span className="text-[10px] text-red-600 uppercase font-bold tracking-wider block mb-1 flex items-center gap-1"><AlertTriangle size={12}/> Possible Duplicate Found</span>
                    <p className="text-xs text-red-800">This issue appears very similar to {duplicateData.relatedIssues.length} nearby report(s). It will be linked for authority review.</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-4 border-t border-brand-100">
                <Button onClick={() => setStep(7)} variant="outline" className="flex-1 text-brand-600 border-brand-200">
                  Edit Report
                </Button>
                <Button onClick={handleSubmit} className="flex-1">
                  Submit Final Report
                </Button>
              </div>
            </motion.div>
          )}

          {step === 8 && (
            <motion.div key="step8" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-civic-text mb-2">Civic issue submitted successfully.</h2>
              <p className="text-civic-muted mb-8 font-mono bg-brand-50 px-4 py-2 rounded border border-brand-200">Issue ID: CP-XXXX</p>
              
              <div className="flex flex-col gap-3 w-full max-w-sm">
                <Button onClick={() => navigate('/my-reports')} size="lg" className="w-full">
                  Track Report
                </Button>
                <Button onClick={() => navigate('/')} variant="outline" size="lg" className="w-full">
                  Back to Home
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};

export default ReportIssue;
