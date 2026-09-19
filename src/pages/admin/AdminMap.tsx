import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../../store/useStore';
import { ShieldAlert, ListFilter, MapPin, Truck, LocateFixed, Loader2, Activity, Zap, ChevronRight, Calendar, Layers3, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { cn } from '../../utils/cn';

// Fix Leaflet default marker icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icon for Issues
const createCustomIcon = (color: string, size = 16) => {
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'RESOLVED': case 'CITIZEN_VERIFIED': return '#10b981'; // Green
    case 'IN_PROGRESS': return '#f59e0b'; // Amber
    default: return '#ef4444'; // Red
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

const createTeamIcon = () => {
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(59, 130, 246, 0.8); display: flex; align-items: center; justify-content: center;"><div style="width: 4px; height: 4px; background: white; border-radius: 50%;"></div></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

function MapController({ center, trigger }: { center: [number, number] | null, trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (center && trigger > 0) {
      map.flyTo(center, Math.max(map.getZoom(), 14), { duration: 1.5 });
    }
  }, [center, trigger, map]);
  return null;
}

const AdminMap = () => {
  const { issues, fieldTeams, hotspots, departments } = useStore();
  const [activeFilter, setActiveFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'street' | 'satellite'>('street');
  
  // Default center (Chandigarh / Mohali Region)
  const [position, setPosition] = useState<[number, number]>([30.7052, 76.7465]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [flyTrigger, setFlyTrigger] = useState(0);

  const locateUser = useCallback(() => {
    setIsLocating(true);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(loc);
          setUserLocation(loc);
          setFlyTrigger(prev => prev + 1);
          setIsLocating(false);
        },
        (err) => {
          console.warn("Could not get user position:", err);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    locateUser();
  }, [locateUser]);

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      let matchStatusAndCategory = true;
      if (activeFilter !== 'All') {
        if (['Pothole', 'Garbage', 'Waterlogging', 'Streetlight', 'Drainage', 'Water Leakage', 'Road Damage'].includes(activeFilter)) {
          matchStatusAndCategory = issue.category === activeFilter;
        } else if (activeFilter === 'Resolved') {
          matchStatusAndCategory = issue.status === 'RESOLVED' || issue.status === 'CITIZEN_VERIFIED';
        } else if (activeFilter === 'Active') {
          matchStatusAndCategory = issue.status !== 'RESOLVED' && issue.status !== 'CITIZEN_VERIFIED';
        }
      }
      
      let matchPriority = priorityFilter === 'All' || (issue.aiAnalysis?.severity === priorityFilter.toUpperCase() || issue.priority === priorityFilter.toUpperCase());
      let matchDepartment = departmentFilter === 'All' || issue.assignedDepartmentId === departmentFilter;
      
      let matchSearch = true;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        matchSearch = issue.title.toLowerCase().includes(query) || issue.id.toLowerCase().includes(query) || issue.location.address.toLowerCase().includes(query);
      }

      return matchStatusAndCategory && matchPriority && matchDepartment && matchSearch;
    });
  }, [issues, activeFilter, priorityFilter, departmentFilter, searchQuery]);

  // Dynamic summary stats
  const activeCount = issues.filter(i => i.status !== 'RESOLVED' && i.status !== 'CITIZEN_VERIFIED').length;
  const highPriorityCount = issues.filter(i => i.aiAnalysis?.severity === 'HIGH' || i.aiAnalysis?.severity === 'CRITICAL' || i.priority === 'HIGH' || i.priority === 'CRITICAL').length;
  const hotspotsCount = hotspots.length;
  const slaPercentage = departments.length > 0 
    ? Math.round(departments.reduce((acc, curr) => acc + curr.slaComplianceRate, 0) / departments.length)
    : 100;

  const topHotspot = [...hotspots].sort((a, b) => b.reportCount - a.reportCount)[0];
  const selectedIssue = useMemo(() => issues.find(i => i.id === selectedIssueId), [issues, selectedIssueId]);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col relative animate-fade-in max-w-[1600px] mx-auto overflow-hidden">
      <div className="mb-4 flex-shrink-0">
        <PageHeader 
          title="GIS Dashboard" 
          description="Spatial intelligence for municipal civic issues and field operations." 
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 z-10 relative flex-shrink-0">
        <Card className="p-3.5 flex items-center gap-3 bg-white/90 backdrop-blur border-brand-200">
          <div className="p-2.5 bg-brand-50 rounded-lg text-civic-primary">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-xs text-civic-muted font-medium">Active Incidents</p>
            <p className="text-lg font-bold text-civic-text">{activeCount}</p>
          </div>
        </Card>
        
        <Card className="p-3.5 flex items-center gap-3 bg-white/90 backdrop-blur border-brand-200">
          <div className="p-2.5 bg-red-50 rounded-lg text-civic-danger">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-xs text-civic-muted font-medium">Critical/High Priority</p>
            <p className="text-lg font-bold text-civic-danger">{highPriorityCount}</p>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3 bg-white/90 backdrop-blur border-brand-200">
          <div className="p-2.5 bg-amber-50 rounded-lg text-civic-warning">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-xs text-civic-muted font-medium">Identified Hotspots</p>
            <p className="text-lg font-bold text-civic-warning">{hotspotsCount}</p>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3 bg-white/90 backdrop-blur border-brand-200">
          <div className="p-2.5 bg-green-50 rounded-lg text-civic-success">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-xs text-civic-muted font-medium">SLA Compliance</p>
            <p className="text-lg font-bold text-civic-success">{slaPercentage}%</p>
          </div>
        </Card>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 relative min-h-0">
        {/* Left Filter & Info Panel */}
        <div className="w-full md:w-80 bg-white border border-civic-border rounded-xl shadow-sm flex flex-col overflow-hidden flex-shrink-0 z-20">
          <div className="p-3.5 border-b border-civic-border bg-brand-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListFilter size={16} className="text-civic-muted" />
              <h2 className="font-semibold text-civic-text text-sm">Filters & Teams</h2>
            </div>
            <button 
              type="button" 
              onClick={() => { setActiveFilter('All'); setPriorityFilter('All'); setDepartmentFilter('All'); setSearchQuery(''); }}
              className="text-xs font-semibold text-civic-primary hover:underline"
            >
              Reset
            </button>
          </div>
          
          <div className="p-3.5 overflow-y-auto flex-1 text-xs">
            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Filter by title, ID, address..."
                className="w-full p-2 border border-brand-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-civic-primary text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="mb-4">
              <h3 className="font-semibold text-civic-muted uppercase tracking-wider mb-2 text-[10px]">Status</h3>
              <div className="flex flex-wrap gap-1.5">
                {['All', 'Active', 'Resolved'].map(filter => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      activeFilter === filter ? "bg-civic-primary text-white" : "bg-brand-100 text-civic-text hover:bg-brand-200"
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="mb-4">
              <h3 className="font-semibold text-civic-muted uppercase tracking-wider mb-2 text-[10px]">Category</h3>
              <div className="flex flex-col gap-1">
                {['Pothole', 'Garbage', 'Waterlogging', 'Streetlight', 'Drainage', 'Water Leakage', 'Road Damage'].map(filter => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(activeFilter === filter ? 'All' : filter)}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors text-left",
                      activeFilter === filter ? "bg-brand-100 text-civic-primary border border-brand-200" : "hover:bg-brand-50 text-civic-text border border-transparent"
                    )}
                  >
                    {filter}
                    <span className="bg-white border border-brand-200 rounded-full px-2 py-0.5 text-civic-muted text-[10px]">
                      {issues.filter(i => i.category === filter).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="mb-4">
              <h3 className="font-semibold text-civic-muted uppercase tracking-wider mb-2 text-[10px]">Severity</h3>
              <div className="flex flex-wrap gap-1.5">
                {['All', 'Critical', 'High', 'Medium', 'Low'].map(filter => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setPriorityFilter(filter)}
                    className={cn(
                      "px-2.5 py-1 rounded-full font-medium transition-colors",
                      priorityFilter === filter ? "bg-civic-primary text-white" : "bg-brand-100 text-civic-text hover:bg-brand-200"
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Department Filter */}
            <div className="mb-4">
              <h3 className="font-semibold text-civic-muted uppercase tracking-wider mb-2 text-[10px]">Department</h3>
              <select 
                className="w-full text-xs border border-civic-border rounded-lg p-2 focus:ring-civic-primary focus:border-civic-primary bg-brand-50 text-civic-text outline-none"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="All">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Top Hotspot Banner */}
            {topHotspot && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-1.5 mb-1 text-amber-800 font-bold">
                  <ShieldAlert size={15} />
                  <span>Active Hotspot</span>
                </div>
                <p className="font-semibold text-civic-text">{topHotspot.name}</p>
                <p className="text-[11px] text-civic-muted mt-0.5">{topHotspot.reportCount} incidents • {topHotspot.topCategory}</p>
              </div>
            )}

            {/* Field Teams */}
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2.5">
                <Truck size={15} className="text-civic-primary" />
                <h4 className="font-bold text-civic-text uppercase tracking-wider text-[10px]">Field Operations</h4>
              </div>
              <div className="space-y-2">
                {fieldTeams.map(team => (
                  <div key={team.id} className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0 shadow-sm",
                        team.status === 'AVAILABLE' ? 'bg-civic-success' : 
                        team.status === 'WORKING' ? 'bg-civic-warning' : 'bg-civic-primary'
                      )}></span>
                      <span className="font-medium text-civic-text truncate">{team.name}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-civic-muted flex-shrink-0">{team.status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Map View */}
        <div className="flex-1 rounded-xl overflow-hidden shadow-sm border border-civic-border relative z-10 flex flex-col min-h-[400px]">
          
          {/* Map Top Controls: Satellite Toggle & GPS */}
          <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-white/70 bg-white shadow-md">
              <button 
                type="button" 
                onClick={() => setMapMode('street')} 
                className={cn("px-2.5 py-1.5 text-xs font-bold transition-colors", mapMode === 'street' ? "bg-civic-primary text-white" : "text-civic-text hover:bg-brand-50")}
              >
                Map
              </button>
              <button 
                type="button" 
                onClick={() => setMapMode('satellite')} 
                className={cn("flex items-center gap-1 border-l border-brand-200 px-2.5 py-1.5 text-xs font-bold transition-colors", mapMode === 'satellite' ? "bg-civic-primary text-white" : "text-civic-text hover:bg-brand-50")}
              >
                <Layers3 size={13} /> Satellite
              </button>
            </div>

            <button 
              type="button"
              onClick={locateUser}
              disabled={isLocating}
              className="bg-white text-civic-text p-2 rounded-lg shadow-md border border-civic-border hover:bg-brand-50 transition-colors flex items-center justify-center focus:outline-none"
              title="Center on My Location"
            >
              {isLocating ? <Loader2 size={18} className="animate-spin text-civic-primary" /> : <LocateFixed size={18} className="text-civic-primary" />}
            </button>
          </div>

          <div className="flex-1 relative w-full h-full">
            <MapContainer center={position} zoom={13} maxZoom={21} style={{ height: '100%', width: '100%' }}>
              <MapController center={position} trigger={flyTrigger} />
              
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
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
              )}
              
              {/* Hotspots */}
              {hotspots.map(hotspot => (
                <Circle 
                  key={hotspot.id}
                  center={[hotspot.location.lat, hotspot.location.lng]} 
                  radius={hotspot.location.radius} 
                  pathOptions={{ 
                    fillColor: hotspot.riskLevel === 'HIGH' ? '#ef4444' : '#f59e0b', 
                    color: hotspot.riskLevel === 'HIGH' ? '#ef4444' : '#f59e0b', 
                    fillOpacity: 0.15, 
                    weight: 1,
                    className: 'hotspot-pulse'
                  }}
                >
                  <Popup className="rounded-xl overflow-hidden shadow-md">
                    <div className="font-bold text-sm text-civic-text">{hotspot.name}</div>
                    <div className="text-xs text-civic-muted mt-1">{hotspot.reportCount} incidents • {hotspot.topCategory}</div>
                  </Popup>
                </Circle>
              ))}

              {/* User Location */}
              {userLocation && (
                <Marker position={userLocation} icon={createUserIcon()}>
                  <Popup className="rounded-xl overflow-hidden border-0 shadow-lg p-3">
                    <span className="font-bold text-civic-text text-sm">Field HQ / Command Station</span>
                  </Popup>
                </Marker>
              )}
              
              {/* Field Teams */}
              {fieldTeams.map(team => (
                <Marker
                  key={`team-${team.id}`}
                  position={[team.location.lat, team.location.lng]}
                  icon={createTeamIcon()}
                >
                  <Popup className="rounded-xl overflow-hidden border-0 shadow-lg p-2.5">
                    <div className="text-sm font-bold text-civic-text">{team.name}</div>
                    <div className="text-xs text-civic-muted capitalize mt-0.5">{team.status.replace('_', ' ').toLowerCase()}</div>
                  </Popup>
                </Marker>
              ))}

              {/* Filtered Incidents */}
              {filteredIssues.map(issue => (
                <Marker 
                  key={issue.id} 
                  position={[issue.location.lat, issue.location.lng]}
                  icon={createCustomIcon(getStatusColor(issue.status), (issue.aiAnalysis?.severity === 'HIGH' || issue.aiAnalysis?.severity === 'CRITICAL') ? 20 : 16)}
                  eventHandlers={{
                    click: () => {
                      setSelectedIssueId(issue.id);
                    },
                  }}
                />
              ))}
            </MapContainer>

            {/* Issue Detail Drawer Overlay */}
            {selectedIssue && (
              <div className="absolute top-0 right-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-[2000] flex flex-col animate-slide-up sm:animate-fade-in border-l border-civic-border">
                <div className="p-4 border-b border-civic-border flex items-center justify-between bg-brand-50">
                  <h3 className="font-semibold text-civic-text flex items-center gap-2 text-sm">
                    <Activity size={18} className="text-civic-primary" />
                    Incident Details
                  </h3>
                  <button 
                    type="button"
                    onClick={() => setSelectedIssueId(null)}
                    className="p-1.5 rounded-md text-civic-muted hover:bg-brand-200 hover:text-civic-text transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs font-mono">{selectedIssue.id}</Badge>
                    <Badge variant={
                      selectedIssue.status === 'RESOLVED' ? 'success' : 
                      selectedIssue.status === 'IN_PROGRESS' ? 'warning' : 'outline'
                    }>
                      {selectedIssue.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <h2 className="text-base font-bold text-civic-text mb-3">{selectedIssue.title}</h2>
                  
                  {selectedIssue.photos && selectedIssue.photos.length > 0 && (
                    <div className="w-full h-40 rounded-xl overflow-hidden mb-4 border border-brand-200">
                      <img src={selectedIssue.photos[0]} alt="Incident Evidence" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="space-y-3 mb-5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <MapPin size={16} className="text-civic-muted mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-civic-text">{selectedIssue.location.address}</p>
                        <p className="text-civic-muted">{selectedIssue.location.ward}, {selectedIssue.location.zone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Calendar size={16} className="text-civic-muted mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-civic-text">Reported on</p>
                        <p className="text-civic-muted">{new Date(selectedIssue.createdAt).toLocaleDateString()} at {new Date(selectedIssue.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-50 rounded-xl p-3.5 mb-5 border border-brand-200">
                    <h4 className="text-xs font-bold text-civic-text mb-1.5 flex items-center gap-1.5">
                      <Zap size={14} className="text-civic-primary" /> AI Assessment
                    </h4>
                    <p className="text-xs text-civic-muted mb-3">{selectedIssue.description}</p>
                    {selectedIssue.aiAnalysis && (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-civic-muted">Confidence:</span>
                          <span className="font-semibold text-civic-text">{selectedIssue.aiAnalysis.confidence}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-civic-muted">Severity:</span>
                          <span className="font-semibold text-civic-text">{selectedIssue.aiAnalysis.severity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-civic-muted">Suggested Dept:</span>
                          <span className="font-semibold text-civic-primary">{selectedIssue.aiAnalysis.suggestedDepartment}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 border-t border-civic-border bg-white flex gap-2">
                  <Link to={`/admin/issues`} className="flex-1">
                    <Button className="w-full flex items-center justify-center gap-2 text-xs">
                      Issue Intelligence <ChevronRight size={14} />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white border-t border-civic-border p-3 flex flex-wrap gap-4 items-center text-xs z-[1000]">
            <span className="font-bold text-civic-text mr-1">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ef4444] border-2 border-white shadow-sm inline-block"></span>
              <span className="text-civic-muted">High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#f59e0b] border-2 border-white shadow-sm inline-block"></span>
              <span className="text-civic-muted">Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#10b981] border-2 border-white shadow-sm inline-block"></span>
              <span className="text-civic-muted">Resolved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#3b82f6] border-2 border-white shadow-sm inline-block"></span>
              <span className="text-civic-muted">Field Team</span>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-[#ef4444] flex items-center justify-center inline-flex">
                <span className="w-1 h-1 bg-[#ef4444] rounded-full"></span>
              </span>
              <span className="text-civic-muted">Hotspot</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminMap;
