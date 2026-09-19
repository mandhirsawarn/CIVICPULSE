---
marp: true
theme: default
size: 16:9
style: |
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
  section {
    background-color: #f8fafc;
    color: #1e293b;
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 60px;
    font-size: 22px;
  }
  h1 { color: #0f172a; font-weight: 800; font-size: 48px; margin-bottom: 10px; }
  h2 { color: #1e3a8a; font-weight: 700; font-size: 36px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
  h3 { color: #2563eb; font-weight: 600; font-size: 24px; margin-bottom: 10px; margin-top: 20px; }
  .subtitle { font-size: 24px; color: #3b82f6; font-weight: 600; margin-bottom: 30px; }
  .navy { color: #0f172a; }
  .emerald { color: #059669; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; }
  .card-navy { background: #0f172a; color: white; padding: 20px; border-radius: 12px; }
  .card-navy h3 { color: #60a5fa; border: none; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 18px; margin-top: 15px; }
  th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
  th { background-color: #1e3a8a; color: white; }
  td { background-color: white; }
  img { border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .flow { display: flex; align-items: center; justify-content: space-between; font-weight: 600; font-size: 16px; background: white; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1; }
  .arrow { color: #3b82f6; font-weight: 900; }
  .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 20px; font-size: 14px; font-weight: 700; }
---

<!-- SLIDE 1 -->
<br><br>
# 📍 CIVICPULSE
<div class="subtitle">"Turn citizen reports into coordinated action."</div>

<div class="grid-2">
  <div class="card">
    <h3>Problem Statement</h3>
    <p><strong>ID:</strong> SIH26043</p>
    <p>A digital platform to crowdsource societal challenges and facilitate collaborative problem solving through universities and industry partnerships.</p>
    <p><strong>Theme:</strong> Disaster Management <br> <strong>Category:</strong> Software</p>
  </div>
  <div class="card-navy" style="display:flex; flex-direction:column; justify-content:center;">
    <h3>Team Xieron</h3>
    <p style="font-size: 20px; opacity: 0.9;"><strong>Team Leader:</strong> Mandhir Sawarn</p>
    <br>
    <div style="font-size: 16px; opacity: 0.7;">TEKATHON 5.0 / SIH 2026 Submission</div>
  </div>
</div>

---

<!-- SLIDE 2 -->
<h2>CivicPulse — From Citizen Report to Coordinated Resolution</h2>

<div class="grid-2">
  <div>
    <h3>The Problem</h3>
    <p style="font-size: 18px;">Citizens encounter civic and societal problems daily, but reporting, prioritization, routing, and follow-up can be highly fragmented and opaque.</p>
    
    <h3>Why CivicPulse?</h3>
    <p style="font-size: 18px;"><strong>Not just complaint registration.</strong><br>Transforms scattered reports into structured, prioritized civic challenges.</p>
    
    <h3>Key Differentiators</h3>
    <ul style="font-size: 16px; line-height: 1.4;">
      <li><strong>AI-assisted analysis:</strong> Severity & classification</li>
      <li><strong>Geographic intelligence:</strong> Hotspot & cluster detection</li>
      <li><strong>Department routing:</strong> Automated assignments</li>
      <li><strong>Resolution verification:</strong> Citizen loop closure</li>
    </ul>
  </div>

  <div class="card" style="background: #f0fdf4; border-color: #bbf7d0;">
    <h3 style="color: #166534; margin-top: 0;">Resolution Workflow</h3>
    <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px; font-weight: 600;">
      <div style="background: white; padding: 10px; border-radius: 6px; text-align: center; border: 1px solid #dcfce7;">📱 REPORT (Citizen)</div>
      <div style="text-align: center; color: #166534;">↓</div>
      <div style="background: white; padding: 10px; border-radius: 6px; text-align: center; border: 1px solid #dcfce7;">🤖 AI ANALYZE (Severity & Category)</div>
      <div style="text-align: center; color: #166534;">↓</div>
      <div style="background: white; padding: 10px; border-radius: 6px; text-align: center; border: 1px solid #dcfce7;">📍 GEO-TAG & CLUSTER (GIS)</div>
      <div style="text-align: center; color: #166534;">↓</div>
      <div style="background: white; padding: 10px; border-radius: 6px; text-align: center; border: 1px solid #dcfce7;">🚦 ROUTE (Assign to Department)</div>
      <div style="text-align: center; color: #166534;">↓</div>
      <div style="background: white; padding: 10px; border-radius: 6px; text-align: center; border: 1px solid #dcfce7;">✅ RESOLVE & VERIFY</div>
    </div>
  </div>
</div>

---

<!-- SLIDE 3 -->
<h2>Technical Approach</h2>

<div class="grid-2">
  <div>
    <h3>Implementation Stack</h3>
    <p style="font-size: 16px; margin-bottom: 20px;">Built on a modern, modular, and extremely fast web architecture.</p>
    
    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
      <span class="badge">React 19</span>
      <span class="badge">TypeScript</span>
      <span class="badge">Vite</span>
      <span class="badge">Tailwind CSS</span>
      <span class="badge">Zustand</span>
      <span class="badge">React Leaflet</span>
      <span class="badge">Recharts</span>
      <span class="badge">Framer Motion</span>
    </div>

    <h3>Architecture & AI Layer</h3>
    <div style="font-size: 14px; background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 10px;">
      <strong>CITIZEN (React)</strong> <span class="arrow">→</span> <strong>API (Zustand Store)</strong> <span class="arrow">→</span> <strong>GIS (Leaflet)</strong> <span class="arrow">→</span> <strong>AUTHORITY (React)</strong>
    </div>
    
    <ul style="font-size: 16px;">
      <li><strong>AI Layer:</strong> Simulates issue classification and severity assessment.</li>
      <li><strong>GIS Layer:</strong> Real-time geographic clustering and field team routing.</li>
    </ul>
  </div>
  
  <div style="display: flex; flex-direction: column; gap: 10px;">
    <div style="position: relative;">
      <span style="position: absolute; top: -10px; left: -10px; z-index: 10;" class="badge">GIS COMMAND CENTER</span>
      <img src="gis_dashboard.png" style="width: 100%; height: auto; max-height: 200px; object-fit: cover;" alt="Admin Dashboard" />
    </div>
    <div style="position: relative;">
      <span style="position: absolute; top: -10px; left: -10px; z-index: 10;" class="badge">CITIZEN PORTAL</span>
      <img src="citizen_home.png" style="width: 100%; height: auto; max-height: 200px; object-fit: cover;" alt="Citizen Portal" />
    </div>
  </div>
</div>

---

<!-- SLIDE 4 -->
<h2>Feasibility & Viability</h2>

<div class="grid-2">
  <div>
    <h3>Technical Feasibility</h3>
    <ul style="font-size: 16px;">
      <li><strong>Web-based architecture:</strong> No installation required, high accessibility.</li>
      <li><strong>Modular frontend:</strong> Clean separation of Citizen and Admin portals.</li>
      <li><strong>GIS Integration:</strong> OpenStreetMap for zero-cost scalability.</li>
    </ul>
    
    <h3>Operational & Scalability</h3>
    <ul style="font-size: 16px;">
      <li><strong>Workflow:</strong> Seamless handoff from Citizen → Authority → Field Team.</li>
      <li><strong>Expansion Path:</strong> City <span class="arrow">→</span> Zone <span class="arrow">→</span> Ward <span class="arrow">→</span> Multiple Municipalities.</li>
    </ul>
  </div>

  <div>
    <h3>Risks & Mitigation</h3>
    <table style="font-size: 14px;">
      <tr>
        <th>Risk</th>
        <th>Mitigation</th>
      </tr>
      <tr>
        <td><strong>Duplicate reports</strong></td>
        <td>AI similarity + geographic clustering logic</td>
      </tr>
      <tr>
        <td><strong>Incorrect AI categorization</strong></td>
        <td>Human review / authority override capability</td>
      </tr>
      <tr>
        <td><strong>False / low-quality reports</strong></td>
        <td>Photo evidence + moderation + verification</td>
      </tr>
      <tr>
        <td><strong>Location inaccuracies</strong></td>
        <td>Device GPS + manual map correction</td>
      </tr>
      <tr>
        <td><strong>AI hallucination errors</strong></td>
        <td>Human-in-the-loop validation checkpoints</td>
      </tr>
    </table>
  </div>
</div>

---

<!-- SLIDE 5 -->
<h2>Impact & Benefits</h2>

<div class="flow" style="margin-bottom: 30px;">
  <span>Citizen</span> <span class="arrow">→</span> <span>CivicPulse Platform</span> <span class="arrow">→</span> <span>Authorities / Partners</span> <span class="arrow">→</span> <span class="emerald">Resolution</span>
</div>

<div class="grid-2" style="margin-bottom: 20px;">
  <div class="card">
    <h3 style="margin-top:0;">Citizens & Communities</h3>
    <ul style="font-size: 16px;">
      <li>Simple, geo-tagged reporting</li>
      <li>Transparent tracking & notifications</li>
      <li>Collective problem visibility</li>
      <li>Reduction of duplicate complaints</li>
    </ul>
  </div>
  <div class="card">
    <h3 style="margin-top:0;">Authorities</h3>
    <ul style="font-size: 16px;">
      <li>Prioritized workload & severity</li>
      <li>Geographic hotspot visibility</li>
      <li>Better resource/team allocation</li>
      <li>Clear SLA monitoring</li>
    </ul>
  </div>
</div>

<div class="grid-2">
  <div class="card">
    <h3 style="margin-top:0;">Universities</h3>
    <ul style="font-size: 16px;">
      <li>Access to real-world civic challenges</li>
      <li>Research & student innovation opportunities</li>
    </ul>
  </div>
  <div class="card">
    <h3 style="margin-top:0;">Industry</h3>
    <ul style="font-size: 16px;">
      <li>Technology partnerships & pilot solutions</li>
      <li>Implementation opportunities for smart cities</li>
    </ul>
  </div>
</div>

<div style="text-align: center; font-weight: 700; color: #1e3a8a; font-size: 20px; margin-top: 20px; background: #e0f2fe; padding: 15px; border-radius: 8px;">
  "CivicPulse creates a shared intelligence layer between citizens, authorities and solution partners."
</div>

---

<!-- SLIDE 6 -->
<h2>Research, References & Prototype</h2>

<div class="grid-2">
  <div>
    <h3>Research & References</h3>
    <ul style="font-size: 16px; line-height: 1.6;">
      <li><strong>Problem Statement SIH26043:</strong> Ministry directives on digital crowdsourcing.</li>
      <li><strong>Smart City Frameworks:</strong> Municipal digital governance best practices and open-data standards.</li>
      <li><strong>Spatial Intelligence:</strong> Academic research on GIS clustering and geographic hotspot detection for urban issues.</li>
      <li><strong>AI in Civic Tech:</strong> Methodologies for automated severity assessment and image-based issue classification.</li>
      <li><strong>Participatory Design:</strong> Studies on citizen engagement, loop-closure, and crowdsourcing platforms.</li>
    </ul>
  </div>
  
  <div class="card-navy" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; border: 4px solid #3b82f6;">
    <h3 style="color: white; font-size: 28px; margin-bottom: 20px;">PROTOTYPE DEMO</h3>
    <p style="font-size: 18px; color: #94a3b8; margin-bottom: 30px;">Watch the working CivicPulse prototype</p>
    
    <a href="https://youtu.be/ge4P2ygn7ZM" style="display: inline-block; background: #ef4444; color: white; padding: 15px 30px; border-radius: 30px; font-weight: 800; font-size: 20px; text-decoration: none; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);">
      ▶ WATCH PROTOTYPE VIDEO
    </a>
  </div>
</div>
