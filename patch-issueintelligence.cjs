const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'pages', 'admin', 'IssueIntelligence.tsx');

let code = fs.readFileSync(file, 'utf8');

// Update imports
code = code.replace(/import \{ ShieldAlert, AlertTriangle, Activity, MapPin, Users, CheckCircle2, ChevronRight, X, Clock, BrainCircuit, ArrowRight \} from 'lucide-react';/,
"import { ShieldAlert, AlertTriangle, Activity, MapPin, Users, CheckCircle2, ChevronRight, X, Clock, BrainCircuit, ArrowRight, Flame } from 'lucide-react';");

// Update table header
code = code.replace(/<th className="px-6 py-4 font-semibold">AI Priority<\/th>/,
`<th className="px-6 py-4 font-semibold">AI Priority</th>
                <th className="px-6 py-4 font-semibold">Community Score</th>`);

// Update table row
code = code.replace(/<\/td>\s*<td className="px-6 py-4 truncate max-w-\[200px\] text-civic-muted">/g,
`</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center font-bold text-civic-primary text-xs">
                        {(issue.upvotes || 0) - (issue.downvotes || 0)}
                      </div>
                      {((issue.upvotes || 0) - (issue.downvotes || 0)) >= 10 && <Flame size={14} className="text-brand-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 truncate max-w-[200px] text-civic-muted">`);

// Update Drawer AI Priority Engine View
code = code.replace(/<div className="flex items-center gap-2 mb-4 text-civic-text">\s*<BrainCircuit size=\{18\} className="text-civic-primary" \/>\s*<h3 className="font-bold">AI Assessment<\/h3>\s*<\/div>/,
`<div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-civic-text">
                      <BrainCircuit size={18} className="text-civic-primary" />
                      <h3 className="font-bold">AI Assessment</h3>
                    </div>
                    <div className="flex items-center gap-2 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-200">
                      <Users size={14} className="text-civic-primary" />
                      <span className="text-xs font-bold text-civic-text">Community Score: <span className="text-brand-500">{(selectedIssue.upvotes || 0) - (selectedIssue.downvotes || 0)}</span></span>
                    </div>
                  </div>`);

fs.writeFileSync(file, code);
console.log('IssueIntelligence patched!');
