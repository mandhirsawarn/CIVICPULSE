const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'pages', 'citizen', 'ReportIssue.tsx');

let code = fs.readFileSync(file, 'utf8');

// 1. Replace Imports
code = code.replace(/import \{ MapContainer, TileLayer, Marker, useMapEvents, useMap \} from 'react-leaflet';/,
`import { Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';`);

code = code.replace(/import 'leaflet\/dist\/leaflet.css';\n/, '');
code = code.replace(/import L from 'leaflet';\n/, '');

// 2. Remove createCustomIcon (Leaflet specific)
code = code.replace(/const createCustomIcon[\s\S]*?iconAnchor: \[10, 10\]\n  \}\);\n\};\n/, '');

// 3. Replace MapPicker
const mapPickerReplacement = `const MapPicker = ({ position, onLocationSelect, active }: { position: {lat: number, lng: number} | null, onLocationSelect: (lat: number, lng: number) => void, active: boolean }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map && position) {
      map.panTo(position);
      map.setZoom(16);
    }
  }, [map, position?.lat, position?.lng]);

  return position ? (
    <AdvancedMarker 
      position={position} 
      draggable={true}
      onDragEnd={(e) => {
        if (e.latLng) {
          onLocationSelect(e.latLng.lat(), e.latLng.lng());
        }
      }}
    >
      <div style={{ backgroundColor: '#3b82f6', width: '20px', height: '20px', borderRadius: '50%', border: '3px solid white', boxShadow: '0 0 4px rgba(0,0,0,0.4)' }} />
    </AdvancedMarker>
  ) : null;
};`;

code = code.replace(/const MapPicker[\s\S]*?return position \? \([\s\S]*?\) : null;\n\};/, mapPickerReplacement);

// 4. Update ReportIssue Component
code = code.replace(/const ReportIssue = \(\) => \{/, `const ReportIssue = () => {\n  const geocodingLib = useMapsLibrary('geocoding');\n  const placesLib = useMapsLibrary('places');\n  const geocoder = React.useMemo(() => geocodingLib ? new geocodingLib.Geocoder() : null, [geocodingLib]);\n  const autocompleteService = React.useMemo(() => placesLib ? new placesLib.AutocompleteService() : null, [placesLib]);\n`);

// 5. Update reverseGeocode
code = code.replace(/const reverseGeocode = async \(lat: number, lng: number\) => \{[\s\S]*?\} catch \(e\) \{[\s\S]*?\}\n  \};/,
`const reverseGeocode = async (lat: number, lng: number) => {
    if (!geocoder) {
      setLocationStr(\`Lat: \${lat.toFixed(4)}, Lng: \${lng.toFixed(4)}\`);
      return;
    }
    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results[0]) {
        setLocationStr(response.results[0].formatted_address);
      } else {
        setLocationStr(\`Lat: \${lat.toFixed(4)}, Lng: \${lng.toFixed(4)}\`);
      }
    } catch (e) {
      setLocationStr(\`Lat: \${lat.toFixed(4)}, Lng: \${lng.toFixed(4)}\`);
    }
  };`);

// 6. Update Autocomplete Search Effect
code = code.replace(/useEffect\(\(\) => \{[\s\S]*?nominatim\.openstreetmap\.org\/search[\s\S]*?return \(\) => clearTimeout\(timer\);\n  \}, \[searchQuery\]\);/,
`useEffect(() => {
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
  }, [searchQuery, autocompleteService]);`);

// 7. Update handleSearchLocation Form Submit
code = code.replace(/const handleSearchLocation = async \(e: React\.FormEvent\) => \{[\s\S]*?nominatim\.openstreetmap\.org\/search[\s\S]*?finally \{[\s\S]*?\}\n  \};/,
`const handleSearchLocation = async (e: React.FormEvent) => {
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
  };`);

// 8. Update handleSelectSuggestion
code = code.replace(/const handleSelectSuggestion = \(suggestion: any\) => \{[\s\S]*?setSearchQuery\(''\);\n  \};/,
`const handleSelectSuggestion = (suggestion: any) => {
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
  };`);

// 9. Update the Map Render Block
const mapRenderReplacement = `<div className="h-64 rounded-xl overflow-hidden border border-brand-200 bg-brand-50 relative z-0">
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
                  
                  {isDropPinMode && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-civic-primary text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 animate-bounce z-10 pointer-events-none">
                      <MapPin size={16} /> Click anywhere to drop pin
                    </div>
                  )}
                </div>`;

code = code.replace(/<div className="h-64 rounded-xl overflow-hidden border border-brand-200 bg-brand-50 relative z-0">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
  mapRenderReplacement + `\n              </div>\n            </div>`);

// I noticed the original div might have had a different structure. Let's make it more precise.
// Actually, I can just find `<MapContainer` and replace it with `<Map`

let regexMap = /<MapContainer[\s\S]*?<\/MapContainer>/;
let newMap = `<Map 
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
                  </Map>`;
                  
code = code.replace(regexMap, newMap);


fs.writeFileSync(file, code);
console.log('ReportIssue patched!');
