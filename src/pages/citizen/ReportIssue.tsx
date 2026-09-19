import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, ChevronRight, ChevronLeft, Loader2, AlertTriangle, Info, CheckCircle2, Crosshair, Check } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../../store/useStore';
import { analyzeIssue, detectDuplicates } from '../../services/aiService';
import { AIAnalysis, IssueCategory, Issue, Urgency } from '../../types';
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
  { num: '02', title: 'Urgency' },
  { num: '03', title: 'Evidence' },
  { num: '04', title: 'Location' },
  { num: '05', title: 'Review' },
  { num: '06', title: 'Submit' }
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
  const [locationSource, setLocationSource] = useState<'GPS' | 'Manual' | 'Search'>('GPS');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<Urgency | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  
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
    if (step === 4 && !isLocating && !coordinates && !locationError) {
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

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLocating(true);
    setSearchSuggestions([]);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      if (data && data.length > 0) {
        setSearchSuggestions(data);
      } else {
        alert("Location not found. Try a different search term.");
      }
    } catch (e) {
      console.error(e);
      alert("Search failed.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    const newLat = parseFloat(suggestion.lat);
    const newLng = parseFloat(suggestion.lon);
    setCoordinates({ lat: newLat, lng: newLng });
    setLocationStr(suggestion.display_name);
    setLocationSource('Search');
    setLocationError(false);
    setSearchSuggestions([]);
    setSearchQuery('');
  };

  const runAnalysis = async () => {
    setStep(5);
    setIsAnalyzing(true);
    
    const [analysis, dupes] = await Promise.all([
      analyzeIssue(photo, description, urgency as Urgency, (category || 'Other') as IssueCategory),
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
      
      setStorageError(false);
      setStep(6);
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
      {step < 6 && (
        <div className="mb-8">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-brand-200 -z-10 rounded-full"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-civic-primary -z-10 rounded-full transition-all duration-300"
              style={{ width: `${((step - 1) / 4) * 100}%` }}
            ></div>
            
            {STEPS.slice(0, 5).map((s, idx) => {
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
                <label className="block text-sm font-semibold text-civic-text mb-2">Description *</label>
                <textarea
                  className={cn("w-full p-3 border rounded-lg bg-brand-50 text-civic-text focus:border-civic-primary focus:ring-1 focus:ring-civic-primary outline-none transition-colors resize-none h-24 mb-1", !description.trim() ? "border-red-300" : "border-brand-200")}
                  placeholder="Provide additional details... e.g. 'Large pothole near university gate.'"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
                {!description.trim() && <p className="text-xs text-red-500 mb-5">Description is required</p>}
                
                <div className="flex justify-end mt-4">
                  <Button onClick={() => setStep(2)} disabled={!category || !description.trim() || description.trim().length < 5} size="lg" className="px-8">
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
                <Button onClick={() => setStep(3)} disabled={!urgency} size="lg" className="px-8">
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
                    <span className="font-bold text-civic-text mb-1">Take Photo / Upload *</span>
                    <span className="text-sm text-civic-muted">JPG, PNG, WEBP (Max 5MB)</span>
                    {isCompressing ? (
                      <Loader2 className="animate-spin text-civic-primary mt-2" size={24} />
                    ) : (
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    )}
                  </label>
                )}
                {!photo && <p className="text-xs text-red-500 mt-2 font-medium">Please upload a photo of the issue</p>}
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
              <div className="flex flex-col mb-4">
                <PageHeader 
                  title="Location" 
                  description="Pinpoint where the issue is on the map." 
                  className="mb-4"
                />
                
                <form onSubmit={handleSearchLocation} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Search location... e.g. Sector 17 Chandigarh"
                    className="flex-1 p-3 border border-brand-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-civic-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" disabled={isLocating}>Search</Button>
                </form>
                
                {searchSuggestions.length > 0 && (
                  <div className="bg-white border border-brand-200 rounded-lg shadow-lg mb-4 max-h-48 overflow-y-auto z-50">
                    {searchSuggestions.map((sugg, idx) => (
                      <button
                        key={idx}
                        className="w-full text-left p-3 hover:bg-brand-50 border-b border-brand-100 last:border-b-0 text-sm text-civic-text"
                        onClick={() => handleSelectSuggestion(sugg)}
                      >
                        {sugg.display_name}
                      </button>
                    ))}
                  </div>
                )}
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
                    <p className="text-sm text-civic-muted mb-6">Location access is required to report an issue.</p>
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                      <Button onClick={fetchLiveLocation} className="w-full">Allow GPS</Button>
                      <Button onClick={handleManualLocation} variant="outline" className="w-full">Drop Pin Manually</Button>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-civic-primary">
                    <Loader2 size={32} className="animate-spin mb-2" />
                    <p className="text-sm font-medium">Acquiring Geolocation via Browser API...</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 p-3 bg-brand-50 border border-brand-200 rounded-lg mb-8">
                <div className="flex items-center gap-3">
                  <MapPin className="text-civic-primary flex-shrink-0" size={20} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-civic-text truncate">{locationStr}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchLiveLocation} disabled={isLocating}>
                    {isLocating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
                  </Button>
                </div>
                {coordinates && (
                  <div className="text-xs text-civic-muted pl-8">
                    Latitude: {coordinates.lat.toFixed(4)} | Longitude: {coordinates.lng.toFixed(4)}
                  </div>
                )}
              </div>
              
              <div className="mt-auto flex justify-between">
                <Button variant="outline" onClick={handleManualLocation} size="lg">
                  📍 Drop Pin
                </Button>
                <Button onClick={() => setStep(5)} disabled={!coordinates} size="lg" className="px-8 w-full sm:w-auto">
                  Continue <ChevronRight size={18} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step4" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col h-full flex-1">
              <div className="mb-4">
                <button onClick={() => setStep(4)} className="flex items-center text-sm font-medium text-civic-muted hover:text-civic-primary transition-colors">
                  <ChevronLeft size={16} className="mr-1" /> Back
                </button>
              </div>
              <PageHeader 
                title="Review Report" 
                description="Please review your details and optionally provide contact information before submitting." 
                className="mb-6"
              />
              
              <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-6">
                
                <div className="bg-white border border-brand-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-start border-b border-brand-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block mb-1">Issue Category</span>
                      <span className="font-semibold text-civic-text">{category}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block mb-1 text-right">Urgency</span>
                      <span className={cn(
                        "font-bold text-xs px-2 py-1 rounded-md inline-block",
                        urgency === 'URGENT' ? 'bg-red-50 text-red-700' :
                        urgency === 'HIGH' ? 'bg-orange-50 text-orange-700' :
                        urgency === 'MODERATE' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'
                      )}>
                        {urgency}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-b border-brand-100 pb-3">
                    <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block mb-1">Description</span>
                    <p className="text-sm text-civic-text whitespace-pre-wrap">{description}</p>
                  </div>
                  
                  <div className="border-b border-brand-100 pb-3">
                    <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block mb-1">Location</span>
                    <p className="text-sm text-civic-text flex items-start gap-1">
                      <MapPin size={16} className="text-civic-primary shrink-0 mt-0.5" />
                      {locationStr}
                    </p>
                  </div>

                  {photo && (
                    <div>
                      <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block mb-1">Photo Evidence</span>
                      <img src={photo} alt="Preview" className="h-32 object-cover rounded-lg border border-brand-200" />
                    </div>
                  )}
                </div>

                <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 shadow-sm">
                  <h4 className="font-bold text-civic-text text-sm mb-1">Contact Information (Optional)</h4>
                  <p className="text-xs text-civic-muted mb-4">Provide your contact details if you would like updates about this report. This information is kept private.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-civic-text mb-1">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="e.g., 9876543210"
                        className="w-full p-3 border border-brand-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-civic-primary text-sm"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-civic-text mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g., citizen@example.com"
                        className="w-full p-3 border border-brand-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-civic-primary text-sm"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {storageError && (
                  <div className="bg-civic-danger/10 border border-civic-danger/30 rounded-xl p-4">
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
                        onClick={() => { setPhoto(null); setStorageError(false); runAnalysis(); }} 
                        className="flex-1 text-xs bg-civic-danger hover:bg-civic-danger/90"
                      >
                        Continue Without Image
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-brand-100 pb-2">
                <Button onClick={runAnalysis} disabled={isAnalyzing} size="lg" className="w-full shadow-lg h-14 relative overflow-hidden">
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" /> Submitting & Analyzing...
                    </div>
                  ) : (
                    "Submit Report"
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="step6" variants={pageVariants} initial="initial" animate="in" exit="out" className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-civic-text mb-2">Your issue has been successfully reported.</h2>
              <p className="text-civic-muted mb-8 font-mono bg-brand-50 px-4 py-2 rounded border border-brand-200">Issue ID: CP-XXXX</p>
              
              {aiResult && (
                <div className="bg-white border-2 border-brand-200 rounded-xl p-6 mb-8 w-full max-w-md text-left shadow-lg overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-civic-primary"></div>
                  <h4 className="font-black text-civic-primary text-sm tracking-wider uppercase mb-5 flex items-center gap-2">
                    <CheckCircle2 size={16} /> AI-Assisted Analysis
                  </h4>
                  
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
                      <span className="text-[10px] text-civic-muted uppercase font-bold tracking-wider block mb-1">Citizen Urgency</span>
                      <span className="font-semibold text-civic-text text-sm">{urgency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-civic-muted uppercase font-bold tracking-wider block mb-1">Priority</span>
                      <span className="font-black text-civic-primary text-sm">{aiResult.priorityScore}/100</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-civic-muted uppercase font-bold tracking-wider block mb-1">Confidence</span>
                      <span className="font-semibold text-civic-text text-sm">{aiResult.confidence}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-civic-muted uppercase font-bold tracking-wider block mb-1">Status</span>
                      <span className="font-bold text-civic-primary text-xs">Reported to Department</span>
                    </div>
                  </div>

                  <div className="border-t border-brand-100 pt-4 mb-4">
                    <span className="text-[10px] text-civic-muted uppercase font-bold tracking-wider block mb-1">Reason</span>
                    <p className="text-xs text-civic-text italic bg-brand-50 p-2 rounded">
                      "Calculated based on {aiResult.priorityReasoning.map(r => r.factor.toLowerCase()).join(', ')} resulting in {aiResult.priorityScore} priority points."
                    </p>
                  </div>

                  <div className="bg-brand-50 p-4 rounded-lg border border-brand-200">
                    <div className="mb-2">
                      <span className="text-[10px] text-civic-muted uppercase font-bold tracking-wider block mb-1">Department</span>
                      <span className="font-semibold text-civic-text text-sm flex items-center gap-1">🏢 {aiResult.suggestedDepartment}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-civic-muted uppercase font-bold tracking-wider block mb-1">Estimated Resolution</span>
                      <span className="font-bold text-civic-primary text-sm bg-white px-2 py-1 rounded border border-brand-200 inline-block">{aiResult.estimatedResolutionTime}</span>
                      <p className="text-[10px] text-civic-muted mt-2 leading-tight">Estimate only — actual resolution may vary based on field verification and workload.</p>
                    </div>
                  </div>
                </div>
              )}
              
              <Button onClick={() => navigate('/my-reports')} size="lg" className="w-full max-w-md">
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
