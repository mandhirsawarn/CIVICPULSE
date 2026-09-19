const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'pages', 'citizen', 'CommunityPulse.tsx');

let code = fs.readFileSync(file, 'utf8');

// 1. Replace Imports
code = code.replace(/import \{ MapContainer, TileLayer, Marker, Popup \} from 'react-leaflet';/,
`import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';`);

code = code.replace(/import 'leaflet\/dist\/leaflet.css';\n/, '');
code = code.replace(/import L from 'leaflet';\n/, '');

// 2. Remove leaflet icons
code = code.replace(/\/\/ Fix Leaflet default icon issue[\s\S]*?iconAnchor: \[8, 8\]\n  \}\);\n\};\n/, '');

// 3. Replace Map render
let mapReplacement = `<div className="h-[600px] rounded-xl overflow-hidden shadow-sm border border-brand-200 relative z-0">
            <Map 
              defaultCenter={{ lat: 30.7333, lng: 76.7794 }} 
              defaultZoom={13} 
              mapId="civicpulse_community_pulse_map"
              disableDefaultUI={true}
            >
              {sortedIssues.map((issue) => (
                <AdvancedMarker 
                  key={issue.id} 
                  position={{ lat: issue.location.lat, lng: issue.location.lng }}
                >
                  <Link to={\`/issue/\${issue.id}\`} className="group relative cursor-pointer block">
                    <div style={{ backgroundColor: getStatusColor(issue.status), width: '24px', height: '24px', borderRadius: '50%', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                      {getCategoryIcon(issue.category)}
                    </div>
                  </Link>
                </AdvancedMarker>
              ))}
            </Map>
          </div>`;

code = code.replace(/<div className="h-\[600px\] rounded-xl overflow-hidden shadow-sm border border-brand-200 relative z-0">[\s\S]*?<\/MapContainer>\s*<\/div>/, mapReplacement);

fs.writeFileSync(file, code);
console.log('CommunityPulse patched!');
