import React, { useState, useMemo } from 'react';
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useStore } from '../../store/useStore';
import { ShieldAlert, Filter, ListFilter, MapPin, Truck, AlertTriangle, LocateFixed, Loader2, Activity, Zap, Target, CheckCircle, Search, X, ChevronRight, Calendar, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { cn } from '../../utils/cn';
const getStatusColor = (status: string) => {
  switch (status) {
    case 'RESOLVED': case 'CITIZEN_VERIFIED': return '#10b981'; // Green
    case 'IN_PROGRESS': return '#f59e0b'; // Amber
    default: return '#ef4444'; // Red
  }
};

function MapController({ position, flyTrigger }: { position: {lat: number, lng: number}, flyTrigger: number }) {
  const map = useMap();
  React.useEffect(() => {
    if (map && position && flyTrigger > 0) {
      map.panTo(position);
      map.setZoom(14);
    }
  }, [map, position, flyTrigger]);
  return null;
}const AdminMap = () => {
  const { issues, fieldTeams, hotspots, departments } = useStore();
  const [activeFilter, setActiveFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  
  // Default center
  const [position, setPosition] = useState<{lat: number, lng: number}>({lat: 20.5937, lng: 78.9629});
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [flyTrigger, setFlyTrigger] = useState(0);


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

  React.useEffect(() => {
    locateUser();
  }, [locateUser]);

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      let matchStatusAndCategory = true;
      if (activeFilter !== 'All') {
        if (['Pothole', 'Garbage', 'Waterlogging', 'Streetlight'].includes(activeFilter)) {
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

  // Calculate summary stats dynamically
  const activeCount = issues.filter(i => i.status !== 'RESOLVED' && i.status !== 'CITIZEN_VERIFIED').length;
  const highPriorityCount = issues.filter(i => i.aiAnalysis?.severity === 'HIGH' || i.aiAnalysis?.severity === 'CRITICAL' || i.priority === 'HIGH' || i.priority === 'CRITICAL').length;
  const hotspotsCount = hotspots.length;
  const slaPercentage = departments.length > 0 
    ? Math.round(departments.reduce((acc, curr) => acc + curr.slaComplianceRate, 0) / departments.length)
    : 100;

  // Active Hotspot for sidebar (highest risk/report count)
  const topHotspot = [...hotspots].sort((a, b) => b.reportCount - a.reportCount)[0];
  
  const selectedIssue = useMemo(() => issues.find(i => i.id === selectedIssueId), [issues, selectedIssueId]);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col relative animate-fade-in max-w-[1600px] mx-auto overflow-hidden">
      <div className="mb-6 flex-shrink-0">
        <PageHeader 
          title="GIS Dashboard" 
          description="Spatial intelligence for civic issues and field operations." 
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 z-10 relative flex-shrink-0">
        <Card className="p-4 flex items-center gap-4 bg-white/80 backdrop-blur border-civic-primary/20">
          <div className="p-3 bg-brand-50 rounded-lg text-civic-primary">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-civic-muted">Active Issues</p>
            <h3 className="text-2xl font-bold text-civic-text">{activeCount}</h3>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-white/80 backdrop-blur border-civic-danger/20">
          <div className="p-3 bg-red-50 rounded-lg text-civic-danger">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-civic-muted">High Priority</p>
            <h3 className="text-2xl font-bold text-civic-text">{highPriorityCount}</h3>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-white/80 backdrop-blur border-civic-warning/20">
          <div className="p-3 bg-orange-50 rounded-lg text-civic-warning">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-civic-muted">Hotspots</p>
            <h3 className="text-2xl font-bold text-civic-text">{hotspotsCount}</h3>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-white/80 backdrop-blur border-civic-success/20">
          <div className="p-3 bg-green-50 rounded-lg text-civic-success">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-civic-muted">SLA Compliance</p>
            <h3 className="text-2xl font-bold text-civic-text">{slaPercentage}%</h3>
          </div>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-4 relative animate-fade-in min-h-0">
        
        {/* Sidebar Filter Panel */}
        <div className="w-full lg:w-80 bg-white border border-civic-border rounded-xl shadow-sm flex flex-col overflow-hidden flex-shrink-0 z-20 h-full">
          <div className="p-4 border-b border-civic-border bg-brand-50 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListFilter size={18} className="text-civic-muted" />
                <h2 className="font-semibold text-civic-text">Spatial Filters</h2>
              </div>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-civic-muted" />
              </div>
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 bg-white border border-civic-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-civic-primary/50 transition-shadow"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-civic-muted hover:text-civic-text"
                >
                  <X size={14} />
                </button>
              )}
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
                {['Pothole', 'Garbage', 'Waterlogging', 'Streetlight'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                      activeFilter === filter ? "bg-brand-100 text-civic-primary border border-brand-200" : "hover:bg-brand-50 text-civic-text border border-transparent"
                    )}
                  >
                    {filter}
                    <span className="text-xs bg-white/50 border border-brand-200 rounded-full px-2 py-0.5 text-civic-muted">
                      {issues.filter(i => i.category === filter).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-semibold text-civic-muted uppercase tracking-wider mb-3">Priority</h3>
              <div className="flex flex-wrap gap-2">
                {['All', 'Critical', 'High', 'Medium', 'Low'].map(filter => (
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

            <div className="mb-6">
              <h3 className="text-xs font-semibold text-civic-muted uppercase tracking-wider mb-3">Department</h3>
              <select 
                className="w-full text-sm border border-civic-border rounded-lg p-2 focus:ring-civic-primary focus:border-civic-primary bg-brand-50 text-civic-text outline-none"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="All">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {topHotspot && (
              <div className="bg-civic-warning/10 border border-civic-warning/20 rounded-lg p-3 mb-4 transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert size={16} className="text-civic-warning" />
                  <h4 className="text-sm font-bold text-civic-warning uppercase">Active Hotspot</h4>
                </div>
                <p className="text-sm font-medium text-civic-text">{topHotspot.name}</p>
                <p className="text-xs text-civic-muted mt-1">{topHotspot.reportCount} reports • {topHotspot.topCategory}</p>
              </div>
            )}

            <div className="bg-brand-50 border border-brand-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <Truck size={16} className="text-civic-primary" />
                <h4 className="text-sm font-bold text-civic-text uppercase">Field Teams</h4>
              </div>
              <div className="space-y-3">
                {fieldTeams.map(team => (
                   <div key={team.id} className="flex items-center gap-2 text-sm justify-between">
                     <div className="flex items-center gap-2">
                       <span className={cn(
                         "w-2 h-2 rounded-full flex-shrink-0 shadow-sm",
                         team.status === 'AVAILABLE' ? 'bg-civic-success' : 
                         team.status === 'WORKING' ? 'bg-civic-warning' : 'bg-civic-primary'
                       )}></span>
                       <span className="font-medium text-civic-text line-clamp-1">{team.name}</span>
                     </div>
                     <span className="text-[10px] uppercase font-bold text-civic-muted">{team.status.replace('_', ' ')}</span>
                   </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Map Area */}
        <div className="flex-1 rounded-xl overflow-hidden shadow-sm border border-civic-border relative z-10 flex flex-col min-h-[400px]">
          {/* Map Overlay Controls */}
          <button 
            onClick={locateUser}
            disabled={isLocating}
            className="absolute top-4 right-4 z-[1000] bg-white text-civic-text p-2 rounded-lg shadow-md border border-civic-border hover:bg-brand-50 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-civic-primary"
            title="Locate Me"
          >
            {isLocating ? <Loader2 size={20} className="animate-spin text-civic-primary" /> : <LocateFixed size={20} className="text-civic-primary" />}
          </button>

          {/* Empty State Overlay */}
          {filteredIssues.length === 0 && !isLocating && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none p-4">
               <div className="bg-white/95 backdrop-blur shadow-xl border border-civic-border p-6 rounded-2xl max-w-sm text-center pointer-events-auto">
                 <div className="w-12 h-12 bg-brand-100 text-civic-primary rounded-full flex items-center justify-center mx-auto mb-4">
                   <MapPin size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-civic-text mb-2">No issues match current filters.</h3>
                 <p className="text-sm text-civic-muted mb-6">Adjust your spatial filters to see more reports.</p>
                 <div className="flex flex-col gap-2">
                   <Button onClick={() => { setActiveFilter('All'); setPriorityFilter('All'); setDepartmentFilter('All'); }} className="w-full">
                     Clear Filters
                   </Button>
                 </div>
               </div>
            </div>
          )}
          
          <div className="flex-1 relative w-full h-full">
            <Map 
              defaultCenter={{ lat: 30.7333, lng: 76.7794 }} 
              defaultZoom={13}
              mapId="civicpulse_admin_map"
              mapTypeControl={true}
              streetViewControl={true}
              fullscreenControl={true}
              zoomControl={true}
            >
              <MapController position={position} flyTrigger={flyTrigger} />
              {hotspots.map(hotspot => (
                <AdvancedMarker 
                  key={hotspot.id}
                  position={{ lat: hotspot.location.lat, lng: hotspot.location.lng }}
                >
                  <div 
                    style={{
                      backgroundColor: hotspot.riskLevel === 'HIGH' ? '#ef4444' : '#f59e0b',
                      width: `${Math.min(100, hotspot.location.radius / 10)}px`,
                      height: `${Math.min(100, hotspot.location.radius / 10)}px`,
                      borderRadius: '50%',
                      opacity: 0.3,
                      pointerEvents: 'none',
                      transform: 'translate(-50%, -50%)',
                      position: 'absolute'
                    }}
                  />
                  <div className="relative">
                    <div style={{ backgroundColor: hotspot.riskLevel === 'HIGH' ? '#ef4444' : '#f59e0b', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
                  </div>
                </AdvancedMarker>
              ))}

              {userLocation && (
                <AdvancedMarker position={userLocation}>
                   <div style={{ backgroundColor: '#3b82f6', width: '16px', height: '16px', borderRadius: '50%', border: '3px solid white', boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)' }}></div>
                </AdvancedMarker>
              )}

              {fieldTeams.map((team: any) => (
                <AdvancedMarker 
                  key={team.id} 
                  position={{ lat: team.currentLocation.lat, lng: team.currentLocation.lng }}
                >
                  <div style={{ backgroundColor: '#3b82f6', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '4px', height: '4px', background: 'white', borderRadius: '50%' }}></div>
                  </div>
                </AdvancedMarker>
              ))}

              {/* Filtered Issues */}
              {filteredIssues.map(issue => (
                <AdvancedMarker 
                  key={issue.id} 
                  position={{ lat: issue.location.lat, lng: issue.location.lng }}
                  onClick={() => setSelectedIssueId(issue.id)}
                >
                  <div style={{ 
                    backgroundColor: getStatusColor(issue.status), 
                    width: selectedIssueId === issue.id ? '24px' : '16px', 
                    height: selectedIssueId === issue.id ? '24px' : '16px', 
                    borderRadius: '50%', 
                    border: '2px solid white', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s ease-in-out'
                  }}></div>
                </AdvancedMarker>
              ))}
            </Map>
            
            {/* Issue Detail Drawer Overlay */}
            {selectedIssue && (
              <div className="absolute top-0 right-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-[2000] flex flex-col animate-slide-up sm:animate-fade-in border-l border-civic-border">
                <div className="p-4 border-b border-civic-border flex items-center justify-between bg-brand-50">
                  <h3 className="font-semibold text-civic-text flex items-center gap-2">
                    <Activity size={18} className="text-civic-primary" />
                    Issue Details
                  </h3>
                  <button 
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
                      selectedIssue.status === 'IN_PROGRESS' ? 'warning' : 'default'
                    }>
                      {selectedIssue.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <h2 className="text-xl font-bold text-civic-text mb-4">{selectedIssue.title}</h2>
                  
                  {selectedIssue.photos && selectedIssue.photos.length > 0 && (
                    <div className="w-full h-40 rounded-xl overflow-hidden mb-5">
                      <img src={selectedIssue.photos[0]} alt="Issue" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-civic-muted mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-civic-text">{selectedIssue.location.address}</p>
                        <p className="text-xs text-civic-muted">{selectedIssue.location.ward}, {selectedIssue.location.zone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <ListFilter size={18} className="text-civic-muted mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-civic-text">{selectedIssue.category}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar size={18} className="text-civic-muted mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-civic-text">Reported on</p>
                        <p className="text-xs text-civic-muted">{new Date(selectedIssue.createdAt).toLocaleDateString()} at {new Date(selectedIssue.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-50 rounded-xl p-4 mb-6 border border-brand-200">
                    <h4 className="text-sm font-semibold text-civic-text mb-2 flex items-center gap-2">
                      <Zap size={16} className="text-civic-primary" /> AI Analysis
                    </h4>
                    <p className="text-sm text-civic-muted mb-3">{selectedIssue.description}</p>
                    {selectedIssue.aiAnalysis && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-civic-muted">Confidence:</span>
                          <span className="font-medium text-civic-text">{selectedIssue.aiAnalysis.confidence}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-civic-muted">Severity:</span>
                          <span className="font-medium text-civic-text">{selectedIssue.aiAnalysis.severity}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedIssue.timeline && selectedIssue.timeline.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-civic-text mb-3">Timeline</h4>
                      <div className="space-y-4 pl-2 border-l-2 border-brand-200 ml-2">
                        {selectedIssue.timeline.map((event, index) => (
                          <div key={event.id} className="relative pl-4">
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-civic-primary ring-4 ring-white" />
                            <p className="text-sm font-medium text-civic-text">{event.status.replace('_', ' ')}</p>
                            <p className="text-xs text-civic-muted">{event.description}</p>
                            <p className="text-[10px] text-civic-muted/70 mt-1">{new Date(event.timestamp).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
                
                <div className="p-4 border-t border-civic-border bg-white flex gap-2">
                  <Link to={`/admin/issues/${selectedIssue.id}`} className="flex-1">
                    <Button className="w-full flex items-center justify-center gap-2">
                      Full Triage <ChevronRight size={16} />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white border-t border-civic-border p-3 flex flex-wrap gap-4 items-center text-sm z-[1000]">
            <span className="font-bold text-civic-text mr-2">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#ef4444] border-2 border-white shadow-sm inline-block"></span>
              <span className="text-civic-muted font-medium">High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#f59e0b] border-2 border-white shadow-sm inline-block"></span>
              <span className="text-civic-muted font-medium">Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#10b981] border-2 border-white shadow-sm inline-block"></span>
              <span className="text-civic-muted font-medium">Resolved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#3b82f6] border-2 border-white shadow-sm inline-block flex items-center justify-center">
                <span className="w-1 h-1 bg-white rounded-full inline-block"></span>
              </span>
              <span className="text-civic-muted font-medium">Team</span>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="w-4 h-4 rounded-full border-2 border-[#ef4444] flex items-center justify-center inline-flex">
                <span className="w-1 h-1 bg-[#ef4444] rounded-full"></span>
              </span>
              <span className="text-civic-muted font-medium">Hotspot</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminMap;
