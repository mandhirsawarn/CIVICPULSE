import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'civicpulse_db.json');

// Memory cache of issues & active SSE clients
let cachedIssues: any[] | null = null;
const sseClients = new Set<ServerResponse>();

function ensureDatabase(): any[] {
  if (cachedIssues) return cachedIssues;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      cachedIssues = JSON.parse(raw);
      return cachedIssues || [];
    }

    cachedIssues = [];
    fs.writeFileSync(DB_FILE, '[]', 'utf-8');
    return cachedIssues;
  } catch (err) {
    console.error('[CivicPulse DB] Error accessing database file, using in-memory store:', err);
    cachedIssues = [];
    return cachedIssues;
  }
}

function saveDatabase(issues: any[]) {
  cachedIssues = issues;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(issues, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CivicPulse DB] Failed to write database file:', err);
  }
}

function broadcastEvent(event: { type: string; issue?: any; id?: string }) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) { // 50MB limit for base64 photo
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export function civicpulseApiPlugin(): Plugin {
  return {
    name: 'civicpulse-api-server',
    configureServer(server) {
      // Ensure DB is initialized on boot
      ensureDatabase();

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // Only handle /api/ endpoints
        if (!url.startsWith('/api/')) {
          return next();
        }

        // Set standard CORS headers for multi-device LAN testing (phone <-> laptop)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        // 1. Server-Sent Events (SSE) Stream: GET /api/events
        if (url === '/api/events' && req.method === 'GET') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
          });

          res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);
          sseClients.add(res);

          const keepAlive = setInterval(() => {
            try {
              res.write(': ping\n\n');
            } catch {
              clearInterval(keepAlive);
              sseClients.delete(res);
            }
          }, 15000);

          req.on('close', () => {
            clearInterval(keepAlive);
            sseClients.delete(res);
          });
          return;
        }

        // 2. All Issues: GET /api/issues
        if ((url === '/api/issues' || url.startsWith('/api/issues?')) && req.method === 'GET') {
          const issues = ensureDatabase();
          res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          });
          res.end(JSON.stringify({ success: true, count: issues.length, issues }));
          return;
        }

        // 3. Create Issue: POST /api/issues
        if (url === '/api/issues' && req.method === 'POST') {
          try {
            const newIssue: any = await readJsonBody(req);
            if (!newIssue || !newIssue.id || !newIssue.title) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Invalid issue payload' }));
              return;
            }

            const current = ensureDatabase();
            // Prevent duplicate ID collision
            const filtered = current.filter(i => i.id !== newIssue.id);
            let updatedList = [newIssue, ...filtered];

            // If duplicate of existing issue, update duplicate count & relatedReportIds on original
            if (newIssue.isDuplicate && newIssue.duplicateOf) {
              updatedList = updatedList.map(existing => {
                if (existing.id === newIssue.duplicateOf) {
                  const prev = existing.relatedReportIds || [];
                  const nextRelated = prev.includes(newIssue.id) ? prev : [...prev, newIssue.id];
                  return {
                    ...existing,
                    duplicateCount: (existing.duplicateCount || 0) + 1,
                    relatedReportIds: nextRelated,
                    timeline: [
                      ...existing.timeline,
                      {
                        id: `tl-dup-${Date.now()}`,
                        status: existing.status,
                        timestamp: new Date().toISOString(),
                        description: `Citizen corroboration report (${newIssue.id}) linked to this issue`,
                        actor: 'AI Corroboration Engine'
                      }
                    ]
                  };
                }
                return existing;
              });
            }

            saveDatabase(updatedList);

            // Broadcast real-time event to all connected devices (Authority Portal + Citizens)
            broadcastEvent({ type: 'ISSUE_CREATED', issue: newIssue });

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, issue: newIssue }));
            return;
          } catch (err: any) {
            console.error('[CivicPulse API] Error creating issue:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err?.message || 'Server error' }));
            return;
          }
        }

        // 4. Update Issue: PATCH /api/issues/:id or POST /api/issues/:id
        const issueMatch = url.match(/^\/api\/issues\/([^/?]+)/);
        if (issueMatch && (req.method === 'PATCH' || req.method === 'POST' || req.method === 'PUT')) {
          const issueId = decodeURIComponent(issueMatch[1]);
          try {
            const updates: any = await readJsonBody(req);
            const current = ensureDatabase();
            const index = current.findIndex(i => i.id === issueId);

            if (index === -1) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: `Issue ${issueId} not found` }));
              return;
            }

            const existing = current[index];
            const nowIso = new Date().toISOString();
            const updatedIssue: any = {
              ...existing,
              ...updates,
              createdAt: existing.createdAt, // ALWAYS PRESERVE ORIGINAL CREATED AT
              lastUpdatedAt: nowIso,
              updatedAt: nowIso
            };

            if (updates.status === 'RESOLVED') {
              updatedIssue.resolvedAt = updates.resolvedAt || existing.resolvedAt || nowIso;
              if (!updatedIssue.resolutionDate) updatedIssue.resolutionDate = updatedIssue.resolvedAt;
            } else if (updates.status === 'REOPENED') {
              updatedIssue.reopenedAt = updates.reopenedAt || existing.reopenedAt || nowIso;
            }

            current[index] = updatedIssue;
            saveDatabase(current);

            // Broadcast real-time event to all connected devices
            broadcastEvent({ type: 'ISSUE_UPDATED', issue: updatedIssue });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, issue: updatedIssue }));
            return;
          } catch (err: any) {
            console.error(`[CivicPulse API] Error updating issue ${issueId}:`, err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err?.message || 'Server error' }));
            return;
          }
        }

        // 5. Single Issue: GET /api/issues/:id
        if (issueMatch && req.method === 'GET') {
          const issueId = decodeURIComponent(issueMatch[1]);
          const current = ensureDatabase();
          const issue = current.find(i => i.id === issueId);
          if (!issue) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Issue not found' }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, issue }));
          return;
        }

        next();
      });
    }
  };
}
