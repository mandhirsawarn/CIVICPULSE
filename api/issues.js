// Serverless function for /api/issues on Vercel / Node
import fs from 'fs';
import path from 'path';

let inMemoryIssues = null;

function getDbFilePath() {
  // In Vercel, /tmp is the only writable directory
  if (process.env.VERCEL) {
    return path.join('/tmp', 'civicpulse_db.json');
  }
  return path.resolve(process.cwd(), 'data', 'civicpulse_db.json');
}

function loadIssues() {
  if (inMemoryIssues) return inMemoryIssues;
  const dbFile = getDbFilePath();
  try {
    if (fs.existsSync(dbFile)) {
      const data = fs.readFileSync(dbFile, 'utf-8');
      inMemoryIssues = JSON.parse(data);
      return inMemoryIssues;
    }
  } catch {
    // fallback
  }
  inMemoryIssues = [];
  return inMemoryIssues;
}

function saveIssues(issues) {
  inMemoryIssues = issues;
  try {
    const dbFile = getDbFilePath();
    const dir = path.dirname(dbFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dbFile, JSON.stringify(issues, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db file:', err);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const issues = loadIssues();

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, count: issues.length, issues });
  }

  if (req.method === 'POST') {
    const newIssue = req.body;
    if (!newIssue || !newIssue.id) {
      return res.status(400).json({ success: false, error: 'Invalid issue payload' });
    }
    const filtered = issues.filter(i => i.id !== newIssue.id);
    const updated = [newIssue, ...filtered];
    saveIssues(updated);
    return res.status(201).json({ success: true, issue: newIssue });
  }

  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body || {};
    const idx = issues.findIndex(i => i.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }
    issues[idx] = { ...issues[idx], ...updates, updatedAt: new Date().toISOString() };
    saveIssues(issues);
    return res.status(200).json({ success: true, issue: issues[idx] });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
