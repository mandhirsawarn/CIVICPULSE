import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, ChevronRight, ChevronLeft, Loader2, AlertTriangle, Info, CheckCircle2, Crosshair, Check } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../../store/useStore';
import { analyzeIssue, detectDuplicates } from '../../services/aiService';
import { AIAnalysis, IssueCategory, Issue } from '../../types';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { compressImage } from '../../utils/imageCompression';

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
  { num: '01', title: 'Details' },
  { num: '02', title: 'Evidence' },
  { num: '03', title: 'Location' },
  { num: '04', title: 'AI Review' },
  { num: '05', title: 'Submit' }
];

const ReportIssue = () => {
  const navigate = useNavigate();
  const { addIssue, currentUser, issues } = useStore();
  
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<string>('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [locationStr, setLocationStr] = useState('Fetching location...');
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [locationSource, setLocationSource] = useState<'GPS' | 'Manual'>('GPS');
  const [description, setDescription] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysis | null>(null);
  const [duplicateData, setDuplicateData] = useState<{isDuplicate: boolean, relatedIssues: { issue: Issue; distance: number; similarity: number }[]} | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        const compressedBase64 = await compressImage(file);
        setPhoto(compressedBase64);
      } catch (error) {
        console.error("Failed to compress image:", error);
        alert("Failed to process image. Please try another one.");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
  };

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
          setLocationStr(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
          setLocationSource('GPS');
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location", error);
          setLocationStr('Location access is required to show nearby civic issues.');
          setCoordinates(null);
          setLocationError(true);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationStr('Geolocation not supported by this browser.');
      setCoordinates(null);
      setLocationError(true);
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (step === 3 && !isLocating && !coordinates && !locationError) {
      fetchLiveLocation();
    }
  }, [step]);

  const handleManualLocation = () => {
    // Default center for manual picking (India center)
    setCoordinates({ lat: 20.5937, lng: 78.9629 });
    setLocationStr('Manual Location Selected (Drag to adjust)');
    setLocationSource('Manual');
    setLocationError(false);
  };

  const runAnalysis = async () => {
    setStep(4);
    setIsAnalyzing(true);
    
    const [analysis, dupes] = await Promise.all([
      analyzeIssue(photo, description),
      detectDuplicates(coordinates?.lat || 0, coordinates?.lng || 0, (category || 'Other') as IssueCategory, description, issues)
    ]);
    
    setAiResult(analysis);
    setDuplicateData(dupes);
    setIsAnalyzing(false);
  };

  const [storageError, setStorageError] = useState(false);

  const handleSubmit = () => {
    const newId = `CP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    
    try {
      addIssue({
        id: newId,
        title: `${category || aiResult?.detectedCategory} at ${locationStr}`,
        description,
        category: (category || aiResult?.detectedCategory) as IssueCategory,
        location: {
          lat: coordinates?.lat || 0,
          lng: coordinates?.lng || 0,
          address: locationStr + (locationSource === 'Manual' ? ' (Manual)' : ''),
          ward: 'Ward 4',
          zone: 'Central'
        },
        photos: photo ? [photo] : [],
        status: 'REPORTED',
        priority: aiResult?.severity || 'MEDIUM',
        priorityScore: aiResult?.priorityScore || 50,
        reporterId: currentUser?.id || 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slaTarget: (() => {
          const severity = aiResult?.severity || 'MEDIUM';
          const hours = severity === 'CRITICAL' ? 4 : severity === 'HIGH' ? 12 : severity === 'MEDIUM' ? 24 : 72;
          return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        })(),
        aiAnalysis: aiResult || undefined,
        timeline: [
          { id: `tl-${Date.now()}`, status: 'REPORTED', timestamp: new Date().toISOString(), description: 'Issue reported by citizen', actor: 'Citizen' },
          ...(aiResult ? [{ id: `tl-${Date.now()+1}`, status: 'AI_VERIFIED' as const, timestamp: new Date().toISOString(), description: 'AI categorized and prioritized', actor: 'System AI' }] : [])
        ]
      });
      
      setStorageError(false);
      setStep(5);
      setTimeout(() => {
        navigate(`/my-reports`);
      }, 2500);
    } catch (error) {
      console.error("Storage error:", error);
      setStorageError(true);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 10 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -10 }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 md:py-8">
      {/* Step Indicator */}
      {step < 5 && (
        <div className="mb-8">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-brand-200 -z-10 rounded-full"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-civic-primary -z-10 rounded-full transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>
            
            {STEPS.slice(0, 4).map((s, idx) => {
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
                    "text-xs font-medium hidden sm:block",
                    isActive || isPast ? "text-civic-primary" : "text-brand-400"
                  )}>{s.title}</span>
                </div>
              );
            })}
          </div>
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
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 mb-8">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-civic-primary",
                      category === cat.id ? "border-civic-primary bg-brand-50 shadow-sm" : "border-brand-200 bg-white hover:border-brand-300 hover:bg-brand-50"
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3", cat.color)}>
                      <cat.icon size={24} />
                    </div>
                    <span className="font-semibold text-sm text-civic-text text-center">{cat.id}</span>
                  </button>
                ))}
              </div>

              <div className="mt-auto">
                <label className="block text-sm font-semibold text-civic-text mb-2">Description (Optional)</label>
                <textarea
                  className="w-full p-3 border border-brand-200 rounded-lg bg-brand-50 text-civic-text focus:border-civic-primary focus:ring-1 focus:ring-civic-primary outline-none transition-colors resize-none h-24 mb-6"
                  placeholder="Provide additional details... e.g. 'Large pothole near university gate.'"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
                
                <div className="flex justify-end">
                  <Button onClick={() => setStep(2)} disabled={!category} size="lg" className="px-8">
                    Continue <ChevronRight size={18} className="ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col h-full flex-1">
              <div className="mb-4">
                <button onClick={() => setStep(1)} className="flex items-center text-sm font-medium text-civic-muted hover:text-civic-primary transition-colors">
                  <ChevronLeft size={16} className="mr-1" /> Back
                </button>
              </div>
              <PageHeader 
                title="Provide Evidence" 
                description="Upload a photo to help AI assess severity." 
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
                  <label className="flex flex-col items-center justify-center w-full max-w-md h-64 border-2 border-dashed border-brand-300 rounded-xl bg-brand-50 hover:bg-brand-100 hover:border-civic-primary cursor-pointer transition-all">
                    <div className="w-16 h-16 bg-white shadow-sm text-civic-primary rounded-full flex items-center justify-center mb-4">
                      <Camera size={32} />
                    </div>
                    <span className="font-bold text-civic-text mb-1">Click to upload real photo</span>
                    <span className="text-sm text-civic-muted">Will be analyzed locally</span>
                    {isCompressing ? (
                      <Loader2 className="animate-spin text-civic-primary mt-2" size={24} />
                    ) : (
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    )}
                  </label>
                )}
              </div>
              
              <div className="mt-auto flex justify-between items-center">
                <Button variant="ghost" onClick={() => setStep(3)}>Skip this step</Button>
                <Button onClick={() => setStep(3)} size="lg" className="px-8">
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
              <div className="flex justify-between items-start mb-6">
                <PageHeader 
                  title="Location" 
                  description="Pinpoint where the issue is on the map." 
                  className="mb-0"
                />
              </div>
              
              <div className="rounded-xl border border-brand-200 h-64 mb-4 relative overflow-hidden bg-brand-50">
                {coordinates ? (
                  <MapContainer center={[coordinates.lat, coordinates.lng]} zoom={locationSource === 'Manual' ? 5 : 15} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                    <Marker 
                      position={[coordinates.lat, coordinates.lng]} 
                      draggable={true}
                      eventHandlers={{
                        dragend: (e) => {
                          const marker = e.target;
                          const position = marker.getLatLng();
                          setCoordinates({ lat: position.lat, lng: position.lng });
                          setLocationStr(`Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)}`);
                          setLocationSource('Manual');
                        }
                      }}
                    />
                    <Circle center={[coordinates.lat, coordinates.lng]} radius={100} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }} />
                  </MapContainer>
                ) : locationError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 text-center z-10">
                    <MapPin size={48} className="text-civic-muted mb-4" />
                    <h3 className="text-lg font-bold text-civic-text mb-2">Location Required</h3>
                    <p className="text-sm text-civic-muted mb-6">Location access is required to show nearby civic issues.</p>
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                      <Button onClick={fetchLiveLocation} className="w-full">Allow Location</Button>
                      <Button onClick={handleManualLocation} variant="outline" className="w-full">Choose Location Manually</Button>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-civic-primary">
                    <Loader2 size={32} className="animate-spin mb-2" />
                    <p className="text-sm font-medium">Acquiring Geolocation via Browser API...</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 bg-brand-50 border border-brand-200 rounded-lg mb-8">
                <MapPin className="text-civic-primary flex-shrink-0" size={20} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-civic-text truncate">{locationStr}</div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchLiveLocation} disabled={isLocating}>
                  {isLocating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
                </Button>
              </div>
              
              <div className="mt-auto flex justify-end">
                <Button onClick={runAnalysis} disabled={!coordinates} size="lg" className="px-8 w-full sm:w-auto">
                  Run AI Analysis <ChevronRight size={18} className="ml-1" />
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
                title="Edge Intelligence" 
                description="Review local heuristic categorization before submission." 
                className="mb-6"
              />
              
              {isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-12">
                  <div className="relative">
                    <Loader2 size={48} className="text-civic-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-civic-text mb-1">Running Local Intelligence</h3>
                    <div className="space-y-2 text-sm text-civic-muted">
                      <p className="flex items-center justify-center gap-2"><Check size={14} className="text-civic-accent"/> Checking description keywords</p>
                      <p className="flex items-center justify-center gap-2"><Check size={14} className="text-civic-accent"/> Identifying geographic clusters</p>
                      <p className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin"/> Calculating severity & priority</p>
                    </div>
                  </div>
                </div>
              ) : aiResult ? (
                <div className="flex-1 flex flex-col overflow-y-auto pr-2 pb-4">
                  
                  <div className="bg-white border border-brand-200 rounded-xl shadow-sm mb-4 overflow-hidden shrink-0">
                    <div className="bg-brand-50 px-5 py-3 border-b border-brand-200 flex justify-between items-center">
                      <span className="text-sm font-bold text-civic-text tracking-wider uppercase">AI-Assisted Local Analysis</span>
                      <span className="text-xs font-semibold text-civic-primary bg-civic-primary/10 px-2 py-1 rounded-full">
                        {aiResult.confidence}% Confidence
                      </span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-civic-muted block mb-1">Category</span>
                          <span className="font-semibold text-civic-text text-sm">{aiResult.detectedCategory}</span>
                        </div>
                        <div>
                          <span className="text-xs text-civic-muted block mb-1">Recommended Dept</span>
                          <span className="font-semibold text-civic-primary text-sm">{aiResult.suggestedDepartment}</span>
                        </div>
                        <div>
                          <span className="text-xs text-civic-muted block mb-1">Severity</span>
                          <span className={cn(
                            "font-bold text-xs px-2 py-1 rounded-md inline-block",
                            aiResult.severity === 'HIGH' || aiResult.severity === 'CRITICAL' ? 'bg-civic-danger/10 text-civic-danger' : 'bg-civic-warning/10 text-civic-warning'
                          )}>
                            {aiResult.severity}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-civic-muted block mb-1">Safety Risk</span>
                          <span className={cn(
                            "font-bold text-xs px-2 py-1 rounded-md inline-block",
                            aiResult.safetyRisk === 'HIGH' ? 'bg-civic-danger/10 text-civic-danger' : 'bg-brand-100 text-brand-600'
                          )}>
                            {aiResult.safetyRisk}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-brand-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-civic-muted uppercase tracking-wider block mb-1">Priority</span>
                          <div className="flex items-baseline gap-2">
                            <span className={cn("text-2xl font-black", aiResult.priorityScore > 75 ? "text-civic-danger" : "text-civic-warning")}>
                              {aiResult.priorityScore}
                            </span>
                            <span className="text-xs font-bold text-civic-muted">/ 100</span>
                          </div>
                        </div>
                        <div className="flex-1 ml-6 space-y-1">
                          <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block mb-1">Factors</span>
                          {aiResult.priorityReasoning.map((reason, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-civic-muted truncate mr-2">{reason.factor}</span>
                              <span className="font-bold text-civic-text">+{reason.score}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {aiResult.matchedSignals && aiResult.matchedSignals.length > 0 && (
                        <div className="pt-4 border-t border-brand-100">
                          <span className="text-xs font-bold text-civic-muted uppercase tracking-wider block mb-2">Matched Signals</span>
                          <div className="flex flex-wrap gap-2">
                            {aiResult.matchedSignals.map((signal, i) => (
                              <span key={i} className="text-[10px] font-semibold bg-brand-50 text-civic-text px-2 py-1 rounded border border-brand-200 flex items-center gap-1">
                                <Check size={10} className="text-civic-accent" /> {signal}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {duplicateData?.isDuplicate && duplicateData.relatedIssues.length > 0 && (
                    <div className="bg-civic-warning/10 border-2 border-civic-warning rounded-xl p-5 flex flex-col gap-3 mb-4 shrink-0 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-civic-warning"></div>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="text-civic-warning flex-shrink-0 mt-0.5" size={24} />
                        <div>
                          <h4 className="font-black text-civic-warning text-sm uppercase tracking-wider mb-1">⚠ Possible Related Issue</h4>
                          <p className="text-sm text-civic-text font-medium mb-3">{duplicateData.relatedIssues.length} nearby report(s) may refer to the same issue.</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {duplicateData.relatedIssues.slice(0, 1).map(rel => (
                          <div key={rel.issue.id} className="text-xs bg-white rounded-lg border border-civic-warning/30 flex flex-col overflow-hidden shadow-sm">
                            <div className="p-4">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-civic-text text-sm">{rel.issue.id}</span>
                                  {rel.issue.id.startsWith('CP-1') && (
                                    <span className="bg-brand-100 text-civic-primary px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Sample Data</span>
                                  )}
                                </div>
                                <span className="font-black text-civic-warning text-sm bg-civic-warning/10 px-2 py-0.5 rounded">{rel.similarity}% Match</span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                  <span className="text-[10px] text-civic-muted uppercase font-bold tracking-wider block">Distance</span>
                                  <span className="font-semibold text-civic-text">{(rel.distance * 1000).toFixed(0)}m away</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-civic-muted uppercase font-bold tracking-wider block">Category</span>
                                  <span className="font-semibold text-civic-text">{rel.issue.category}</span>
                                </div>
                              </div>
                              
                              <div className="bg-brand-50 rounded p-2">
                                <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block mb-1">Matched because:</span>
                                <ul className="space-y-1 text-xs">
                                  {rel.issue.category === category && <li className="flex items-center gap-1"><Check size={12} className="text-civic-accent"/> Same category</li>}
                                  {rel.distance < 0.5 && <li className="flex items-center gap-1"><Check size={12} className="text-civic-accent"/> Nearby location</li>}
                                  {rel.similarity > 75 && <li className="flex items-center gap-1"><Check size={12} className="text-civic-accent"/> Similar severity & context</li>}
                                </ul>
                              </div>
                            </div>
                            {/* Small map visualization */}
                            <div className="h-24 w-full bg-brand-50 relative border-t border-brand-200">
                               <MapContainer 
                                 center={[((coordinates?.lat || 0) + rel.issue.location.lat)/2, ((coordinates?.lng || 0) + rel.issue.location.lng)/2]} 
                                 zoom={15} 
                                 style={{ height: '100%', width: '100%' }}
                                 zoomControl={false}
                                 dragging={false}
                               >
                                 <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                 <Marker position={[coordinates?.lat || 0, coordinates?.lng || 0]} />
                                 <Marker position={[rel.issue.location.lat, rel.issue.location.lng]} opacity={0.6} />
                                 <Polyline 
                                   positions={[
                                     [coordinates?.lat || 0, coordinates?.lng || 0],
                                     [rel.issue.location.lat, rel.issue.location.lng]
                                   ]} 
                                   pathOptions={{ color: '#ef4444', weight: 2, dashArray: '5, 5' }} 
                                 />
                               </MapContainer>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {storageError && (
                    <div className="bg-civic-danger/10 border border-civic-danger/30 rounded-xl p-4 mb-4">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertTriangle className="text-civic-danger mt-0.5" size={20} />
                        <div>
                          <h4 className="font-bold text-civic-danger text-sm">Storage Capacity Reached</h4>
                          <p className="text-sm text-civic-text mt-1">
                            Image is too large for local prototype storage. Please choose an action below to proceed.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 mt-2">
                        <Button 
                          onClick={() => { setPhoto(null); setStorageError(false); }} 
                          variant="outline" 
                          className="flex-1 text-xs border-civic-danger/50 text-civic-danger hover:bg-civic-danger/10"
                        >
                          Remove Image
                        </Button>
                        <Button 
                          onClick={() => { setPhoto(null); setStorageError(false); handleSubmit(); }} 
                          className="flex-1 text-xs bg-civic-danger hover:bg-civic-danger/90"
                        >
                          Continue Without Image
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 pt-4 border-t border-brand-100 pb-2">
                    <Button onClick={handleSubmit} size="lg" className="w-full shadow-lg">
                      Confirm & Submit
                    </Button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-20 h-20 bg-civic-accent/10 text-civic-accent rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-civic-text mb-2">Report Submitted</h2>
              <p className="text-civic-muted mb-8">Thank you for improving your community. Priority processing initiated.</p>
              
              <div className="bg-brand-50 border border-brand-200 px-6 py-3 rounded-lg mb-8">
                <span className="text-xs text-civic-muted block mb-1">Local Edge Intelligence</span>
                <span className="font-mono font-bold text-civic-primary text-lg">Routing to Dept...</span>
              </div>
              
              <p className="text-sm text-civic-muted flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Returning to dashboard...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};

export default ReportIssue;
