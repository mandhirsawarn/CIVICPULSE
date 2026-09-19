import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../../store/useStore';
import { ListFilter, MapPin, LocateFixed, Loader2, Layers3, Crosshair, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';
import { fetchNominatimSearch, SearchResultItem } from '../../services/locationService';

// Fix Leaflet default icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icon for CivicPulse Issues
const createCustomIcon = (color: string) => {
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'RESOLVED': case 'CITIZEN_VERIFIED': return '#10b981';
    case 'IN_PROGRESS': return '#f59e0b';
    default: return '#ef4444';
  }
};

const createUserIcon = () => {
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

// Map click handler using useMapEvents from reference
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

// Map viewport controller using useMap from reference
const MapViewport = ({ coordinates }: { coordinates: { lat: number; lng: number } }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([coordinates.lat, coordinates.lng], Math.max(map.getZoom(), 17), { animate: true });
  }, [coordinates.lat, coordinates.lng, map]);
  return null;
};

const CityMap = () => {
  const { issues, hotspots } = useStore();
  const [activeFilter, setActiveFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Exact reference state names & behavior
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({ lat: 30.7333, lng: 76.7794 });
  const [locationStr, setLocationStr] = useState('Chandigarh, Punjab, India');
  const [locationSource, setLocationSource] = useState<'GPS' | 'Manual' | 'Search'>('Search');
  const [isDropPinMode, setIsDropPinMode] = useState(false);
  const [mapMode, setMapMode] = useState<'street' | 'satellite'>('satellite'); // Default: satellite
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<SearchResultItem[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Exact reverse geocode function from reference
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { 'User-Agent': 'CivicPulse-App/1.0' }
      });
      const data = await res.json();
      if (data && data.display_name) {
        setLocationStr(data.display_name);
      } else {
        setLocationStr(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
      }
    } catch {
      setLocationStr(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
    }
  };

  // Exact manual drop pin toggle from reference
  const handleManualLocation = () => {
    setIsDropPinMode(true);
    setLocationStr('Click anywhere on the map to drop a pin.');
    setLocationSource('Manual');
  };

  // Exact map click handler from reference
  const handleMapClick = (lat: number, lng: number) => {
    setCoordinates({ lat, lng });
    setLocationSource('Manual');
    setIsDropPinMode(false);
    setLocationStr('Fetching address...');
    reverseGeocode(lat, lng);
  };

  // Exact GPS current location from reference
  const fetchLiveLocation = () => {
    setIsLocating(true);
    setLocationStr('Getting live GPS location...');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoordinates({ lat, lng });
          setUserLocation([lat, lng]);
          setLocationStr(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
          setLocationSource('GPS');
          setIsLocating(false);
          reverseGeocode(lat, lng);
        },
        (error) => {
          console.error("Error getting location", error);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
    }
  };

  // Live typing search effect with multi-tier search, normalization, deduplication, and viewport bias
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchSuggestions([]);
      setIsSuggestionsOpen(false);
      setHasSearched(false);
      setSearchError(null);
      setIsLocating(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLocating(true);
      setSearchError(null);
      setHasSearched(false);
      setIsSuggestionsOpen(true);

      try {
        const results = await fetchNominatimSearch(q, coordinates, controller.signal);
        setSearchSuggestions(results);
        setHasSearched(true);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error("Search error:", err);
        setSearchError("Location search is temporarily unavailable. You can drop a pin manually.");
        setHasSearched(true);
      } finally {
        setIsLocating(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, coordinates]);

  // Search submit handler
  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q || q.length < 2) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLocating(true);
    setSearchError(null);
    setHasSearched(false);
    setIsSuggestionsOpen(true);

    try {
      const results = await fetchNominatimSearch(q, coordinates, controller.signal);
      setSearchSuggestions(results);
      setHasSearched(true);
      if (results.length === 1) {
        handleSelectSuggestion(results[0]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Search error:", err);
      setSearchError("Location search is temporarily unavailable. You can drop a pin manually.");
      setHasSearched(true);
    } finally {
      setIsLocating(false);
    }
  };

  // Suggestion click handler
  const handleSelectSuggestion = (suggestion: SearchResultItem) => {
    setCoordinates({ lat: suggestion.lat, lng: suggestion.lng });
    setLocationStr(suggestion.displayName);
    setLocationSource('Search');
    setIsDropPinMode(false);
    setSearchSuggestions([]);
    setIsSuggestionsOpen(false);
    setSearchQuery(suggestion.placeName);
  };

  // CivicPulse issue filters
  const filteredIssues = issues.filter(issue => {
    if (activeFilter !== 'All') {
      if (['Pothole', 'Garbage', 'Waterlogging', 'Streetlight', 'Drainage', 'Water Leakage', 'Road Damage'].includes(activeFilter) && issue.category !== activeFilter) return false;
      if (activeFilter === 'Resolved' && issue.status !== 'RESOLVED' && issue.status !== 'CITIZEN_VERIFIED') return false;
      if (activeFilter === 'Active' && (issue.status === 'RESOLVED' || issue.status === 'CITIZEN_VERIFIED')) return false;
    }

    if (priorityFilter !== 'All') {
      if (priorityFilter === 'Urgent' && issue.citizenUrgency !== 'URGENT') return false;
      if (priorityFilter === 'High' && issue.citizenUrgency !== 'HIGH') return false;
      if (priorityFilter === 'Moderate' && issue.citizenUrgency !== 'MODERATE') return false;
      if (priorityFilter === 'Low' && issue.citizenUrgency !== 'LOW') return false;
    }

    return true;
  });

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-160px)] md:h-[calc(100vh-110px)] w-full gap-4 relative animate-fade-in -mx-4 px-4 md:mx-0 md:px-0">
      
      {/* Sidebar Filter Panel (Preserving CivicPulse Layout) */}
      <div className="w-full md:w-80 bg-white border border-civic-border rounded-xl shadow-sm flex flex-col overflow-hidden flex-shrink-0 z-20">
        <div className="p-4 border-b border-civic-border bg-brand-50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ListFilter size={18} className="text-civic-muted" />
            <h2 className="font-semibold text-civic-text text-sm">Map Filters</h2>
          </div>
          <button 
            type="button" 
            onClick={() => { setActiveFilter('All'); setPriorityFilter('All'); }}
            className="text-xs font-semibold text-civic-primary hover:underline"
          >
            Reset
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          {/* Status Filters */}
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-civic-muted uppercase tracking-wider mb-2.5">Status</h3>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Active', 'Resolved'].map(filter => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    activeFilter === filter ? "bg-civic-primary text-white" : "bg-brand-100 text-civic-text hover:bg-brand-200"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          {/* Category Filters */}
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-civic-muted uppercase tracking-wider mb-2.5">Category</h3>
            <div className="flex flex-col gap-1.5">
              {['Pothole', 'Garbage', 'Waterlogging', 'Streetlight', 'Drainage', 'Water Leakage', 'Road Damage'].map(filter => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(activeFilter === filter ? 'All' : filter)}
                  className={cn(
                    "flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left",
                    activeFilter === filter ? "bg-brand-100 text-civic-primary border border-brand-200" : "hover:bg-brand-50 text-civic-text border border-transparent"
                  )}
                >
                  {filter}
                  <span className="text-[10px] bg-white border border-brand-200 rounded-full px-2 py-0.5 text-civic-muted">
                    {issues.filter(i => i.category === filter).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Priority Filters */}
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-civic-muted uppercase tracking-wider mb-2.5">Urgency</h3>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Urgent', 'High', 'Moderate', 'Low'].map(filter => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setPriorityFilter(filter)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    priorityFilter === filter ? "bg-civic-primary text-white" : "bg-brand-100 text-civic-text hover:bg-brand-200"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Drop Pin Action */}
          <div className="border-t border-brand-100 pt-4">
            <Button
              type="button"
              variant={isDropPinMode ? "primary" : "outline"}
              onClick={() => {
                if (isDropPinMode) {
                  setIsDropPinMode(false);
                } else {
                  handleManualLocation();
                }
              }}
              className={cn("w-full text-xs flex items-center justify-center gap-1.5", isDropPinMode ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600" : "")}
            >
              <Crosshair size={14} />
              {isDropPinMode ? "Cancel Pin Mode" : "Drop Pin on Map"}
            </Button>
            {isDropPinMode && (
              <p className="text-[11px] text-amber-600 mt-1.5 text-center font-medium animate-pulse">
                📍 Click anywhere on the map to drop a pin.
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Right Side: Reference Map Implementation from ReportIssue.tsx */}
      <div className="flex-1 rounded-xl overflow-hidden shadow-sm border border-civic-border relative z-10 flex flex-col bg-white">
        
        {/* Top Floating Search & Suggestion Bar (Exact reference style) */}
        <div ref={searchContainerRef} className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4">
          <form onSubmit={handleSearchLocation} className="flex bg-white rounded-xl shadow-lg border border-civic-border overflow-hidden mb-1">
            <div className="flex items-center pl-3 text-civic-muted">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search any landmark, road, city, or country"
              className="flex-1 px-3 py-2.5 text-xs sm:text-sm focus:outline-none bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                className="px-2 text-civic-muted hover:text-civic-text"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
            <Button type="submit" disabled={isLocating} variant="ghost" className="rounded-none border-l border-brand-100 px-4 text-xs font-bold text-civic-primary">
              {isLocating ? <Loader2 size={14} className="animate-spin" /> : "Search"}
            </Button>
          </form>

          {/* Search suggestions dropdown */}
          {isLocating && searchQuery.length >= 2 && searchSuggestions.length === 0 && (
            <div className="bg-white border border-brand-200 rounded-xl shadow-xl p-3 text-xs text-civic-muted flex items-center justify-center">
              <Loader2 size={15} className="animate-spin mr-2 text-civic-primary" /> Searching locations...
            </div>
          )}

          {!isLocating && searchError && (
            <div className="bg-white border border-amber-200 rounded-xl shadow-xl p-3 text-xs text-amber-700 text-center">
              {searchError}
            </div>
          )}

          {!isLocating && !searchError && hasSearched && searchQuery.trim().length >= 2 && searchSuggestions.length === 0 && (
            <div className="bg-white border border-brand-200 rounded-xl shadow-xl p-3.5 text-xs text-center text-civic-muted">
              No matching locations found. Try adding a city, locality, or landmark.
            </div>
          )}

          {isSuggestionsOpen && searchSuggestions.length > 0 && (
            <div className="bg-white border border-brand-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-brand-100">
              {searchSuggestions.map((sugg) => (
                <button
                  key={sugg.id}
                  type="button"
                  className="w-full text-left p-3 hover:bg-brand-50 transition-colors flex items-start gap-2.5 focus:outline-none"
                  onClick={() => handleSelectSuggestion(sugg)}
                >
                  <MapPin size={16} className="text-civic-primary flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-civic-text text-xs sm:text-sm truncate">{sugg.placeName}</div>
                    {sugg.secondaryAddress && (
                      <div className="text-[11px] text-civic-muted truncate mt-0.5">{sugg.secondaryAddress}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Top-Right Control: GPS Locate Button */}
        <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
          <button 
            type="button"
            onClick={fetchLiveLocation}
            disabled={isLocating}
            className="bg-white text-civic-text p-2 rounded-lg shadow-md border border-civic-border hover:bg-brand-50 transition-colors flex items-center justify-center focus:outline-none"
            title="My GPS Location"
          >
            {isLocating ? <Loader2 size={18} className="animate-spin text-civic-primary" /> : <LocateFixed size={18} className="text-civic-primary" />}
          </button>
        </div>

        {/* Drop Pin Notice Banner */}
        {isDropPinMode && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-amber-600 text-white text-xs px-4 py-1.5 rounded-full shadow-lg font-medium animate-pulse">
            📍 Click anywhere on the map to drop a pin.
          </div>
        )}

        {/* Map Legend Overlay */}
        <div className="absolute bottom-16 right-4 z-[500] bg-white/95 backdrop-blur rounded-xl p-3 shadow-md border border-civic-border">
          <h4 className="text-[10px] font-bold text-civic-muted uppercase tracking-wider mb-2">Map Legend</h4>
          <div className="flex flex-col gap-1.5 text-xs font-medium text-civic-text">
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shadow-[0_0_5px_rgba(59,130,246,0.8)] border border-white"></span> You are here</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span> Reported</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span> In Progress</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span> Resolved</div>
          </div>
        </div>

        {/* The Leaflet Map Container (Exact reference implementation) */}
        <div className={cn("h-full w-full relative", isDropPinMode ? "cursor-crosshair" : "")}>
          <MapContainer 
            center={[coordinates.lat, coordinates.lng]} 
            zoom={locationSource === 'Manual' ? 18 : 16} 
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

            {/* Selected Location Draggable Marker (Exact reference behavior) */}
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
            >
              <Popup className="rounded-xl overflow-hidden border-0 shadow-lg p-3.5 min-w-[250px]">
                <div className="font-bold text-civic-text text-sm mb-1">{locationStr.split(',')[0]}</div>
                <div className="text-xs text-civic-muted mb-2 line-clamp-2 leading-relaxed">{locationStr}</div>
                <div className="text-[11px] text-civic-muted mb-3 font-mono bg-brand-50 p-1.5 rounded border border-brand-100">
                  Lat: {coordinates.lat.toFixed(5)}, Lng: {coordinates.lng.toFixed(5)}
                </div>
                <Link 
                  to={`/report?lat=${coordinates.lat}&lng=${coordinates.lng}&address=${encodeURIComponent(locationStr)}`} 
                  className="block w-full"
                >
                  <Button size="sm" className="w-full font-semibold shadow">Report Issue Here</Button>
                </Link>
              </Popup>
            </Marker>

            {/* Exact Circle from reference */}
            <Circle 
              center={[coordinates.lat, coordinates.lng]} 
              radius={100} 
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }} 
            />

            {/* User GPS Location Marker if available */}
            {userLocation && (
              <Marker position={userLocation} icon={createUserIcon()}>
                <Popup className="rounded-xl overflow-hidden border-0 shadow-lg p-3">
                  <div className="font-bold text-civic-text text-sm">You are here</div>
                  <div className="text-xs text-civic-muted mt-1 font-mono">
                    {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Dynamic Hotspots */}
            {hotspots.map(hotspot => (
              <Circle 
                key={hotspot.id}
                center={[hotspot.location.lat, hotspot.location.lng]} 
                radius={hotspot.location.radius} 
                pathOptions={{ 
                  fillColor: hotspot.riskLevel === 'CRITICAL' ? '#ef4444' : '#f59e0b', 
                  color: hotspot.riskLevel === 'CRITICAL' ? '#ef4444' : '#f59e0b', 
                  fillOpacity: 0.15, 
                  weight: 1,
                  className: 'hotspot-pulse'
                }}
              >
                <Popup className="rounded-xl overflow-hidden border-0 shadow-lg p-0">
                  <div className="p-3 min-w-[200px]">
                    <h4 className="font-bold text-sm text-civic-text mb-2">Active Hotspot</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-civic-muted">Reports:</span>
                        <span className="font-semibold text-civic-text">{hotspot.reportCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-civic-muted">Dominant Category:</span>
                        <span className="font-semibold text-civic-text">{hotspot.topCategory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-civic-muted">Risk Level:</span>
                        <span className={cn("font-semibold", hotspot.riskLevel === 'CRITICAL' ? "text-civic-danger" : "text-civic-warning")}>{hotspot.riskLevel}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* CivicPulse Issue Markers */}
            {filteredIssues.map(issue => (
              <Marker 
                key={issue.id} 
                position={[issue.location.lat, issue.location.lng]} 
                icon={createCustomIcon(getStatusColor(issue.status))}
              >
                <Popup className="rounded-xl overflow-hidden border-0 shadow-lg p-0">
                  <div className="p-3.5 min-w-[230px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-civic-muted uppercase">{issue.id}</span>
                      <Badge variant={
                        issue.status === 'RESOLVED' ? 'success' : 
                        issue.status === 'IN_PROGRESS' ? 'warning' : 'outline'
                      } className="text-[10px] px-1.5 py-0">
                        {issue.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-sm text-civic-text mb-1">{issue.title}</h4>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2 text-xs border-y border-brand-100 py-2 my-2">
                      <div>
                        <span className="block text-civic-muted font-bold uppercase tracking-wider text-[10px]">Urgency</span>
                        <span className={cn("font-semibold", issue.citizenUrgency === 'URGENT' ? "text-civic-danger" : "text-civic-text")}>
                          {issue.citizenUrgency || 'MODERATE'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-civic-muted font-bold uppercase tracking-wider text-[10px]">Department</span>
                        <span className="font-semibold text-civic-primary line-clamp-1">{issue.assignedDepartmentId}</span>
                      </div>
                    </div>

                    <div className="text-xs text-civic-muted mb-3 flex items-start gap-1">
                      <MapPin size={12} className="mt-0.5 flex-shrink-0 text-civic-primary" />
                      <span className="line-clamp-2">{issue.location.address}</span>
                    </div>
                    <Link to={`/issue/${issue.id}`} className="block w-full">
                      <Button size="sm" variant="outline" className="w-full text-xs">View Details</Button>
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Reference Map Mode Switcher (Street / Satellite) */}
          <div className="absolute left-3 top-3 z-[500] flex overflow-hidden rounded-lg border border-white/70 bg-white shadow-lg">
            <button 
              type="button" 
              onClick={() => setMapMode('street')} 
              className={cn("flex items-center gap-1 px-3 py-2 text-xs font-bold transition-colors", mapMode === 'street' ? "bg-civic-primary text-white" : "text-civic-text hover:bg-brand-50")}
            >
              Map
            </button>
            <button 
              type="button" 
              onClick={() => setMapMode('satellite')} 
              className={cn("flex items-center gap-1 border-l border-brand-200 px-3 py-2 text-xs font-bold transition-colors", mapMode === 'satellite' ? "bg-civic-primary text-white" : "text-civic-text hover:bg-brand-50")}
            >
              <Layers3 size={13} /> Satellite
            </button>
          </div>

          {/* Reference Pin / Tap Instruction Overlay */}
          <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
            {isDropPinMode ? 'Tap the map to place the exact point' : 'Drag the pin or choose Drop Pin to refine location'}
          </div>
        </div>

        {/* Selected Location Summary Bar below map */}
        <div className="p-3 bg-brand-50 border-t border-brand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 z-20">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <MapPin className="text-civic-primary flex-shrink-0" size={18} />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-civic-text truncate">{locationStr}</div>
              <div className="text-[11px] text-civic-muted font-mono">
                {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)} ({locationSource})
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleManualLocation} className="text-xs">
              📍 Drop Pin
            </Button>
            <Link to={`/report?lat=${coordinates.lat}&lng=${coordinates.lng}&address=${encodeURIComponent(locationStr)}`}>
              <Button size="sm" className="text-xs font-semibold">
                Report Issue Here →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityMap;
