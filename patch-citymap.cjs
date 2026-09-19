const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'pages', 'citizen', 'CityMap.tsx');

let code = fs.readFileSync(file, 'utf8');

// 1. Replace Imports
code = code.replace(/import \{ MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents \} from 'react-leaflet';/,
`import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';`);

code = code.replace(/import 'leaflet\/dist\/leaflet.css';\n/, '');
code = code.replace(/import L from 'leaflet';\n/, '');

// 2. Remove leaflet icons
code = code.replace(/\/\/ Fix Leaflet default icon issue[\s\S]*?iconAnchor: \[8, 8\]\n  \}\);\n\};\n/g, '');

// 3. Remove MapController
code = code.replace(/function MapController\(\{ center, trigger \}: \{ center: \[number, number\] \| null, trigger: number \}\) \{[\s\S]*?\}\n/, '');

// 4. Update the CityMap Component
// We need to change [lat, lng] arrays to {lat, lng} objects in states
code = code.replace(/const \[position, setPosition\] = useState<\[number, number\]>\(\[20\.5937, 78\.9629\]\);/,
`const [position, setPosition] = useState<{lat: number, lng: number}>({lat: 20.5937, lng: 78.9629});`);
code = code.replace(/const \[userLocation, setUserLocation\] = useState<\[number, number\] \| null>\(null\);/,
`const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);`);

// 5. Update locateUser
code = code.replace(/const loc: \[number, number\] = \[pos\.coords\.latitude, pos\.coords\.longitude\];/,
`const loc = {lat: pos.coords.latitude, lng: pos.coords.longitude};`);

// 6. Map render replacement
let mapReplacement = `<div className="flex-1 relative z-0 h-full">
        <Map 
          defaultCenter={{ lat: 30.7333, lng: 76.7794 }} 
          center={position}
          defaultZoom={13}
          mapId="civicpulse_city_map"
          disableDefaultUI={true}
        >
          {filteredIssues.map((issue) => (
            <AdvancedMarker 
              key={issue.id} 
              position={{ lat: issue.location.lat, lng: issue.location.lng }}
            >
              <div 
                className="group relative cursor-pointer"
                title={issue.title}
              >
                <div style={{ backgroundColor: getStatusColor(issue.status), width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}></div>
              </div>
            </AdvancedMarker>
          ))}

          {userLocation && (
            <AdvancedMarker position={userLocation}>
               <div style={{ backgroundColor: '#3b82f6', width: '16px', height: '16px', borderRadius: '50%', border: '3px solid white', boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)' }}></div>
            </AdvancedMarker>
          )}

          {searchPin && (
            <AdvancedMarker position={{lat: searchPin.lat, lng: searchPin.lng}}>
               <div style={{ backgroundColor: '#eab308', width: '20px', height: '20px', borderRadius: '50%', border: '3px solid white', boxShadow: '0 0 10px rgba(234, 179, 8, 0.8)' }}></div>
            </AdvancedMarker>
          )}
        </Map>`;

code = code.replace(/<MapContainer[\s\S]*?<\/MapContainer>/, mapReplacement);

fs.writeFileSync(file, code);
console.log('CityMap patched!');
