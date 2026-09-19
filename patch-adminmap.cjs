const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'pages', 'admin', 'AdminMap.tsx');

let code = fs.readFileSync(file, 'utf8');

// 1. Replace Imports
code = code.replace(/import \{ MapContainer, TileLayer, Marker, Popup, Circle, useMap \} from 'react-leaflet';/,
`import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';`);

code = code.replace(/import 'leaflet\/dist\/leaflet.css';\n/, '');
code = code.replace(/import L from 'leaflet';\n/, '');

// 2. Remove leaflet icons
code = code.replace(/\/\/ Fix Leaflet default icon issue[\s\S]*?iconAnchor: \[7, 7\]\n  \}\);\n\};\n/g, '');

// 3. Remove MapController
code = code.replace(/function MapController\(\{ center, trigger \}: \{ center: \[number, number\] \| null, trigger: number \}\) \{[\s\S]*?\}\n/, '');

// 4. Update the AdminMap Component
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
          mapId="civicpulse_admin_map"
          disableDefaultUI={true}
        >
          {filteredIssues.map((issue) => {
            const isSelected = selectedIssueId === issue.id;
            const size = isSelected ? 24 : 16;
            return (
              <AdvancedMarker 
                key={issue.id} 
                position={{ lat: issue.location.lat, lng: issue.location.lng }}
                onClick={() => setSelectedIssueId(issue.id)}
              >
                <div style={{ backgroundColor: getStatusColor(issue.status), width: \`\${size}px\`, height: \`\${size}px\`, borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}></div>
              </AdvancedMarker>
            );
          })}

          {filteredTeams.map(team => (
            <AdvancedMarker 
              key={team.id} 
              position={{ lat: team.currentLocation.lat, lng: team.currentLocation.lng }}
            >
              <div style={{ backgroundColor: '#3b82f6', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '4px', height: '4px', background: 'white', borderRadius: '50%' }}></div>
              </div>
            </AdvancedMarker>
          ))}

          {userLocation && (
            <AdvancedMarker position={userLocation}>
               <div style={{ backgroundColor: '#3b82f6', width: '16px', height: '16px', borderRadius: '50%', border: '3px solid white', boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)' }}></div>
            </AdvancedMarker>
          )}
        </Map>`;

code = code.replace(/<MapContainer[\s\S]*?<\/MapContainer>/, mapReplacement);

fs.writeFileSync(file, code);
console.log('AdminMap patched!');
