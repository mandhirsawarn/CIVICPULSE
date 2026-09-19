import React, { useState } from 'react';
import { Map, AdvancedMarker, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { useStore } from '../../store/useStore';
import { ShieldAlert, Filter, ListFilter, MapPin, LocateFixed, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'RESOLVED': case 'CITIZEN_VERIFIED': return '#10b981'; // Green
    case 'IN_PROGRESS': return '#f59e0b'; // Amber
    default: return '#ef4444'; // Red
  }
};



const CityMap = () => {
  const { issues, hotspots } = useStore();
  const [activeFilter, setActiveFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPin, setSearchPin] = useState<{lat: number, lng: number, label: string, isManual?: boolean} | null>(null);
  
  // Default center (India center)
  const [position, setPosition] = useState<{lat: number, lng: number}>({lat: 20.5937, lng: 78.9629}); 
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [flyTrigger, setFlyTrigger] = useState(0);
  const [showAllReports, setShowAllReports] = useState(false);

  const geocodingLib = useMapsLibrary('geocoding');
  const placesLib = useMapsLibrary('places');
  const geocoder = React.useMemo(() => geocodingLib ? new geocodingLib.Geocoder() : null, [geocodingLib]);
  const autocompleteService = React.useMemo(() => placesLib ? new placesLib.AutocompleteService() : null, [placesLib]);
  const map = useMap();
  
  React.useEffect(() => {
    if (map && position && flyTrigger > 0) {
      map.panTo(position);
      map.setZoom(14);
    }
  }, [map, position, flyTrigger]);

  const locateUser = React.useCallback(() => {
    setIsLocating(true);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {lat: pos.coords.latitude, lng: pos.coords.longitude};
          setPosition(loc);
          setUserLocation(loc);
          setFlyTrigger(prev => prev + 1);
          setIsLocating(false);
        },
        (err) => {
          console.error("Could not get location", err);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!geocoder) return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results[0]) {
        return response.results[0].formatted_address;
      }
    } catch (e) {
      console.error(e);
    }
    return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  };

  React.useEffect(() => {
    locateUser();
  }, [locateUser]);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 3 && autocompleteService) {
        setIsSearching(true);
        try {
          const res = await autocompleteService.getPlacePredictions({ input: searchQuery, componentRestrictions: { country: 'in' } });
          const suggestions = res.predictions.map((p: any) => ({
            place_id: p.place_id,
            display_name: p.description
          }));
          setSearchSuggestions(suggestions);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
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
    setIsSearching(true);
    try {
      const res = await autocompleteService.getPlacePredictions({ input: searchQuery, componentRestrictions: { country: 'in' } });
      if (res.predictions && res.predictions.length > 0) {
        const suggestions = res.predictions.map((p: any) => ({
          place_id: p.place_id,
          display_name: p.description
        }));
        setSearchSuggestions(suggestions);
        if (suggestions.length === 1) {
          handleSelectSuggestion(suggestions[0]);
        }
      } else {
        alert("Location not found.");
      }
    } catch (e) {
      console.error(e);
      alert("Search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    if (!geocoder) return;
    geocoder.geocode({ placeId: suggestion.place_id }).then((response: any) => {
      if (response.results[0]) {
        const location = response.results[0].geometry.location;
        const newLat = location.lat();
        const newLng = location.lng();
        setPosition({lat: newLat, lng: newLng});
        setFlyTrigger(prev => prev + 1);
        setSearchSuggestions([]);
        const placeName = suggestion.display_name.split(',')[0];
        setSearchQuery(placeName);
        setSearchPin({ lat: newLat, lng: newLng, label: placeName });
      }
    });
  };

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

    // Distance filtering
    if (userLocation && !showAllReports) {
      // Calculate basic distance in degrees (approx) - roughly 50km radius
      const dist = Math.sqrt(Math.pow(issue.location.lat - userLocation.lat, 2) + Math.pow(issue.location.lng - userLocation.lng, 2));
      if (dist > 0.5) return false;
    }
    
    return true;
  });

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-180px)] md:h-[calc(100vh-120px)] w-full gap-4 relative animate-fade-in -mx-4 px-4 md:mx-0 md:px-0">
      
      {/* Sidebar Filter Panel */}
      <div className="w-full md:w-80 bg-white border border-civic-border rounded-xl shadow-sm flex flex-col overflow-hidden flex-shrink-0 z-20">
        <div className="p-4 border-b border-civic-border bg-brand-50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ListFilter size={18} className="text-civic-muted" />
            <h2 className="font-semibold text-civic-text">Map Filters</h2>
          </div>

        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-civic-muted uppercase tracking-wider mb-3">Status</h3>
            <div className="flex flex-wrap gap-2">
              {['All', 'Active', 'Resolved'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    activeFilter === filter ? "bg-civic-primary text-white" : "bg-brand-100 text-civic-text hover:bg-brand-200"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-civic-muted uppercase tracking-wider mb-3">Category</h3>
            <div className="flex flex-col gap-2">
              {['Pothole', 'Garbage', 'Waterlogging', 'Streetlight', 'Drainage', 'Water Leakage', 'Road Damage'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                    activeFilter === filter ? "bg-brand-100 text-civic-primary border border-brand-200" : "hover:bg-brand-50 text-civic-text border border-transparent"
                  )}
                >
                  {filter}
                  <span className="text-xs bg-white border border-brand-200 rounded-full px-2 py-0.5 text-civic-muted">
                    {issues.filter(i => i.category === filter).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-civic-muted uppercase tracking-wider mb-3">Priority</h3>
            <div className="flex flex-wrap gap-2">
              {['All', 'Urgent', 'High', 'Moderate', 'Low'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setPriorityFilter(filter)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    priorityFilter === filter ? "bg-civic-primary text-white" : "bg-brand-100 text-civic-text hover:bg-brand-200"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-civic-warning/10 border border-civic-warning/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={16} className="text-civic-warning" />
              <h4 className="text-sm font-bold text-civic-warning">Active Hotspot</h4>
            </div>
            <p className="text-xs text-civic-muted">High density of active reports detected in this sector.</p>
          </div>
        </div>
      </div>
      
      {/* Map Area */}
      <div className="flex-1 rounded-xl overflow-hidden shadow-sm border border-civic-border relative z-10">
        
        {/* Map Overlay Controls */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm px-4">
          <form onSubmit={handleSearchLocation} className="flex bg-white rounded-lg shadow-md border border-civic-border overflow-hidden mb-2">
            <input
              type="text"
              placeholder="Search map location..."
              className="flex-1 p-3 text-sm focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" variant="ghost" className="rounded-none border-l border-brand-100">Search</Button>
          </form>

          {isSearching && searchQuery.length >= 3 && searchSuggestions.length === 0 && (
            <div className="bg-white border border-brand-200 rounded-lg shadow-lg p-3 text-sm text-civic-muted flex items-center justify-center">
              <Loader2 size={16} className="animate-spin mr-2" /> Searching...
            </div>
          )}

          {!isSearching && searchQuery.length >= 3 && searchSuggestions.length === 0 && (
            <div className="bg-white border border-brand-200 rounded-lg shadow-lg p-4 text-sm text-center">
              <div className="font-bold text-civic-text mb-1">No exact matches found</div>
              <div className="text-xs text-civic-muted">Try a broader search (like the city name) or explore the map manually.</div>
            </div>
          )}

          {searchSuggestions.length > 0 && (
            <div className="bg-white border border-brand-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {searchSuggestions.map((sugg, idx) => {
                const parts = sugg.display_name.split(',');
                const placeName = parts[0];
                const address = parts.slice(1).join(',').trim();
                return (
                  <button
                    key={idx}
                    className="w-full text-left p-3 hover:bg-brand-50 border-b border-brand-100 last:border-b-0"
                    onClick={() => handleSelectSuggestion(sugg)}
                  >
                    <div className="font-bold text-civic-text text-sm truncate">{placeName}</div>
                    {address && <div className="text-xs text-civic-muted truncate">{address}</div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        <button 
          onClick={locateUser}
          disabled={isLocating}
          className="absolute top-4 right-4 z-[1000] bg-white text-civic-text p-2 rounded-lg shadow-md border border-civic-border hover:bg-brand-50 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-civic-primary"
          title="Locate Me"
        >
          {isLocating ? <Loader2 size={20} className="animate-spin text-civic-primary" /> : <LocateFixed size={20} className="text-civic-primary" />}
        </button>

        {/* Empty State Overlay */}
        {userLocation && filteredIssues.length === 0 && !isLocating && !showAllReports && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none p-4">
             <div className="bg-white/95 backdrop-blur shadow-xl border border-civic-border p-6 rounded-2xl max-w-sm text-center pointer-events-auto">
               <div className="w-12 h-12 bg-brand-100 text-civic-primary rounded-full flex items-center justify-center mx-auto mb-4">
                 <MapPin size={24} />
               </div>
               <h3 className="text-lg font-bold text-civic-text mb-2">No civic reports found near your current location.</h3>
               <p className="text-sm text-civic-muted mb-6">You're viewing your current live location.</p>
               <div className="flex flex-col gap-2">
                 <Button onClick={() => setShowAllReports(true)} className="w-full">
                   View All Reports
                 </Button>
               </div>
             </div>
          </div>
        )}

        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur rounded-lg p-3 shadow-md border border-civic-border">
          <h4 className="text-xs font-bold text-civic-muted uppercase tracking-wider mb-2">Legend</h4>
          <div className="flex flex-col gap-2 text-xs font-medium text-civic-text">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-[0_0_5px_rgba(59,130,246,0.8)] border border-white"></span> You are here</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ef4444]"></span> Reported</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span> In Progress</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#10b981]"></span> Resolved</div>
          </div>
        </div>

        <Map 
          defaultCenter={{ lat: 30.7333, lng: 76.7794 }} 
          center={position}
          defaultZoom={13}
          mapId="civicpulse_city_map"
          disableDefaultUI={true}
          onClick={async (e) => {
            if (e.detail.latLng) {
              const lat = e.detail.latLng.lat;
              const lng = e.detail.latLng.lng;
              setSearchPin({ lat, lng, label: 'Fetching address...', isManual: true });
              const address = await reverseGeocode(lat, lng);
              setSearchPin({ lat, lng, label: address, isManual: true });
            }
          }}
        >
          {hotspots.map(hotspot => (
            <AdvancedMarker 
              key={hotspot.id}
              position={{ lat: hotspot.location.lat, lng: hotspot.location.lng }}
            >
              <div 
                style={{
                  backgroundColor: hotspot.riskLevel === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                  width: `${Math.min(100, hotspot.location.radius / 10)}px`,
                  height: `${Math.min(100, hotspot.location.radius / 10)}px`,
                  borderRadius: '50%',
                  opacity: 0.3,
                  pointerEvents: 'none',
                  transform: 'translate(-50%, -50%)',
                  position: 'absolute'
                }}
              />
              <div style={{ backgroundColor: hotspot.riskLevel === 'CRITICAL' ? '#ef4444' : '#f59e0b', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
            </AdvancedMarker>
          ))}

          {/* User Location Pin */}
          {userLocation && (
            <AdvancedMarker position={userLocation}>
               <div style={{ backgroundColor: '#3b82f6', width: '16px', height: '16px', borderRadius: '50%', border: '3px solid white', boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)' }}></div>
            </AdvancedMarker>
          )}

          {/* Searched Location Pin */}
          {searchPin && (
            <AdvancedMarker position={{lat: searchPin.lat, lng: searchPin.lng}}>
               <div className="bg-white rounded-xl shadow-lg border border-brand-200 p-3 min-w-[200px] mb-2 transform -translate-y-full absolute left-1/2 -translate-x-1/2 bottom-full whitespace-nowrap">
                  <div className="font-bold text-civic-text text-sm mb-1">Location Details</div>
                  <div className="text-xs text-civic-muted mb-2 font-medium leading-tight whitespace-normal">{searchPin.label}</div>
                  <div className="text-[10px] text-brand-400 font-mono mb-3">
                    Lat: {searchPin.lat.toFixed(6)} | Lng: {searchPin.lng.toFixed(6)}
                  </div>
                  <Link to={`/report?lat=${searchPin.lat}&lng=${searchPin.lng}&address=${encodeURIComponent(searchPin.label)}`} className="block w-full">
                    <Button size="sm" className="w-full">Report Issue Here</Button>
                  </Link>
               </div>
               <div style={{ backgroundColor: '#eab308', width: '20px', height: '20px', borderRadius: '50%', border: '3px solid white', boxShadow: '0 0 10px rgba(234, 179, 8, 0.8)' }}></div>
            </AdvancedMarker>
          )}

          {filteredIssues.map(issue => (
            <AdvancedMarker 
              key={issue.id} 
              position={{ lat: issue.location.lat, lng: issue.location.lng }}
            >
              <Link to={`/issue/${issue.id}`} className="block">
                <div style={{ backgroundColor: getStatusColor(issue.status), width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
              </Link>
            </AdvancedMarker>
          ))}
        </Map>
      </div>
    </div>
  );
};

export default CityMap;
