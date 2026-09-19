import { AIAnalysis, IssueCategory, Severity, Issue, Urgency } from '../types';

// Simulate network delay for demo feel
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CATEGORY_DICTIONARY: Record<IssueCategory, { keywords: string[], negative: string[], severityWords: string[] }> = {
  'Pothole': {
    keywords: ['pothole', 'crater', 'hole', 'road damage', 'broken asphalt', 'deep hole', 'uneven road', 'bump'],
    negative: ['manhole'],
    severityWords: ['large', 'deep', 'dangerous', 'accident', 'bike slipped', 'vehicle damage', 'injury', 'traffic']
  },
  'Garbage': {
    keywords: ['garbage', 'trash', 'waste', 'dump', 'litter', 'overflowing bin', 'illegal dumping', 'rubbish', 'smell'],
    negative: [],
    severityWords: ['rotting', 'smell', 'health', 'overflowing', 'large pile', 'disease', 'rats']
  },
  'Waterlogging': {
    keywords: ['waterlogging', 'flooded', 'flood', 'standing water', 'water accumulation', 'rainwater', 'submerged'],
    negative: ['leak'],
    severityWords: ['deep', 'blocked road', 'vehicles stranded', 'traffic blocked', 'entering house']
  },
  'Streetlight': {
    keywords: ['light', 'dark', 'bulb', 'pole', 'streetlamp', 'broken light', 'no light', 'pitch black'],
    negative: ['traffic light'],
    severityWords: ['unsafe', 'accidents', 'crime', 'scary', 'sparks']
  },
  'Broken Footpath': {
    keywords: ['footpath', 'sidewalk', 'pavement', 'walkway', 'pedestrian', 'tiles broken'],
    negative: ['road'],
    severityWords: ['trip', 'fall', 'elderly', 'wheelchair', 'injury']
  },
  'Traffic Sign': {
    keywords: ['sign', 'signal', 'traffic light', 'stop sign', 'board', 'red light'],
    negative: ['streetlight'],
    severityWords: ['crash', 'confusing', 'accident', 'blind spot']
  },
  'Public Safety': {
    keywords: ['unsafe', 'danger', 'hazard', 'wire', 'electric', 'crime', 'suspicious'],
    negative: [],
    severityWords: ['live wire', 'shock', 'fire', 'weapon', 'emergency']
  },
  'Road Damage': {
    keywords: ['crack', 'cave', 'surface', 'tar', 'sinkhole'],
    negative: ['pothole'],
    severityWords: ['collapsing', 'huge', 'vehicle stuck', 'accident']
  },
  'Drainage': {
    keywords: ['sewer', 'manhole', 'drain', 'block', 'clog', 'gutter'],
    negative: [],
    severityWords: ['overflowing', 'foul smell', 'open manhole', 'falling']
  },
  'Obstruction': {
    keywords: ['block', 'tree', 'fallen', 'debris', 'parked', 'encroachment'],
    negative: [],
    severityWords: ['blocking ambulance', 'traffic jam', 'falling']
  },
  'Illegal Dumping': {
    keywords: ['dumping', 'construction', 'debris', 'unauthorized', 'malba'],
    negative: [],
    severityWords: ['toxic', 'chemical', 'huge pile', 'blocking road']
  },
  'Water Leakage': {
    keywords: ['leak', 'pipe', 'burst', 'drinking', 'supply', 'wasting'],
    negative: ['rain'],
    severityWords: ['gushing', 'high pressure', 'wastage', 'no water']
  },
  'Other': {
    keywords: [],
    negative: [],
    severityWords: []
  }
};

const SEVERITY_INDICATORS = {
  'CRITICAL': ['emergency', 'accident', 'fire', 'electric', 'live wire', 'death', 'casualty', 'disaster', 'open manhole'],
  'HIGH': ['urgent', 'danger', 'huge', 'deep', 'severe', 'slipping', 'crash', 'risk', 'injury', 'blood', 'gushing', 'collapsing'],
  'MEDIUM': ['bad', 'smell', 'annoying', 'inconvenient', 'broken', 'issue', 'problem', 'stagnant'],
  'LOW': ['minor', 'small', 'dirty', 'ugly', 'paint', 'slight']
};

const DEPARTMENT_ROUTING: Record<IssueCategory, string> = {
  'Pothole': 'Road Maintenance',
  'Road Damage': 'Road Maintenance',
  'Broken Footpath': 'Road Maintenance',
  'Garbage': 'Sanitation Department',
  'Illegal Dumping': 'Sanitation Department',
  'Streetlight': 'Electrical Department',
  'Waterlogging': 'Water & Sewerage',
  'Drainage': 'Water & Sewerage',
  'Water Leakage': 'Water Supply',
  'Traffic Sign': 'Traffic & Road Safety',
  'Obstruction': 'Traffic & Road Safety',
  'Public Safety': 'Public Safety & Police',
  'Other': 'General Administration'
};

export const analyzeIssue = async (photoData: string | null, description: string, citizenUrgency: Urgency): Promise<AIAnalysis> => {
  await delay(1500); // Simulate processing

  const text = description.toLowerCase();
  
  // 1. Detect Category & Keywords
  let detectedCategory: IssueCategory = 'Other';
  let maxScore = 0;
  const foundKeywords: string[] = [];

  Object.entries(CATEGORY_DICTIONARY).forEach(([cat, data]) => {
    let score = 0;
    
    // Check negatives
    if (data.negative.some(neg => text.includes(neg))) {
      return; // Skip this category
    }

    data.keywords.forEach(word => {
      if (text.includes(word)) {
        score += 2; // Base keyword match
        foundKeywords.push(word);
      }
    });

    data.severityWords.forEach(word => {
      if (text.includes(word)) {
        score += 3; // Severity words weigh more
        foundKeywords.push(word);
      }
    });

    if (score > maxScore) {
      maxScore = score;
      detectedCategory = cat as IssueCategory;
    }
  });

  // 2. Detect Severity & Safety Risk
  let severity: Severity = 'LOW';
  let safetyRisk: Severity = 'LOW';
  let severityScore = 10;
  
  for (const [sev, words] of Object.entries(SEVERITY_INDICATORS)) {
    if (words.some(w => text.includes(w))) {
      severity = sev as Severity;
      if (sev === 'CRITICAL') severityScore = 90;
      if (sev === 'HIGH') severityScore = 70;
      if (sev === 'MEDIUM') severityScore = 40;
      break; // Pick the highest severity found (assuming they are ordered CRITICAL -> LOW)
    }
  }
  
  if (severity === 'CRITICAL' || severity === 'HIGH') {
    safetyRisk = 'HIGH';
  } else if (severity === 'MEDIUM') {
    safetyRisk = 'MEDIUM';
  }

  // 3. Priority Scoring (Explainable)
  const reasoning: { factor: string; score: number }[] = [];
  let priorityScore = severityScore;
  
  reasoning.push({ factor: `Base severity (${severity})`, score: severityScore });

  if (safetyRisk === 'HIGH') {
    priorityScore += 15;
    reasoning.push({ factor: 'High safety risk detected', score: 15 });
  }

  if (text.includes('school') || text.includes('hospital') || text.includes('university') || text.includes('market') || text.includes('traffic')) {
    priorityScore += 12;
    reasoning.push({ factor: 'High traffic/sensitive location', score: 12 });
  }

  if (foundKeywords.length > 2) {
    priorityScore += 5;
    reasoning.push({ factor: 'Detailed descriptive report', score: 5 });
  }

  if (citizenUrgency === 'URGENT') {
    priorityScore += 20;
    reasoning.push({ factor: 'Citizen flagged as URGENT', score: 20 });
  } else if (citizenUrgency === 'HIGH') {
    priorityScore += 10;
    reasoning.push({ factor: 'Citizen flagged as HIGH', score: 10 });
  }

  priorityScore = Math.min(100, priorityScore);

  // 4. Confidence Score
  // Base confidence on keyword density and presence of a photo
  const confidence = Math.min(98, 50 + (foundKeywords.length * 8) + (photoData ? 15 : 0));

  const matchedSignals = [
    ...(foundKeywords.length > 0 ? ['Keywords Matched'] : []),
    ...(photoData ? ['Image Evidence'] : []),
    ...(safetyRisk === 'HIGH' ? ['High Safety Risk'] : [])
  ];

  let estimatedResolutionTime = '5-10 days';
  if (citizenUrgency === 'URGENT' || priorityScore > 85) {
    estimatedResolutionTime = '6-24 hours';
  } else if (citizenUrgency === 'HIGH' || priorityScore > 70) {
    estimatedResolutionTime = '24-48 hours';
  } else if (citizenUrgency === 'MODERATE' || priorityScore > 40) {
    estimatedResolutionTime = '2-5 days';
  }

  return {
    confidence: Math.round(confidence),
    detectedCategory,
    severity,
    safetyRisk,
    suggestedDepartment: DEPARTMENT_ROUTING[detectedCategory] || 'General Administration',
    priorityScore,
    priorityReasoning: reasoning,
    keywords: [...new Set(foundKeywords)],
    matchedSignals,
    estimatedResolutionTime
  };
};

// Haversine formula for distance in kilometers
const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
};

export const detectDuplicates = async (
  lat: number, 
  lng: number, 
  category: IssueCategory, 
  description: string,
  existingIssues: Issue[]
): Promise<{ isDuplicate: boolean; similarityScore: number; relatedIssues: { issue: Issue; distance: number; similarity: number }[]; matchReasons: string[] }> => {
  await delay(800);
  
  const RADIUS_KM = 0.5; // 500 meters
  
  const text = description.toLowerCase();

  const related = existingIssues.map(issue => {
    // Check status (only open issues)
    if (['RESOLVED', 'CITIZEN_VERIFIED'].includes(issue.status)) return null;
    
    // Check distance
    const distance = getDistanceFromLatLonInKm(lat, lng, issue.location.lat, issue.location.lng);
    if (distance > RADIUS_KM) return null;

    let similarity = 0;

    // Distance (max 40 points)
    const distScore = Math.max(0, 40 * (1 - (distance / RADIUS_KM)));
    similarity += distScore;

    // Category match (max 30 points)
    const catScore = issue.category === category ? 30 : 0;
    similarity += catScore;

    // Keyword overlap (max 15 points)
    let keywordScore = 0;
    if (issue.aiAnalysis?.keywords) {
       const overlap = issue.aiAnalysis.keywords.filter(kw => text.includes(kw.toLowerCase())).length;
       if (overlap > 0) {
         keywordScore = Math.min(15, overlap * 7.5);
         similarity += keywordScore;
       }
    }

    // Time proximity (max 15 points, based on 7 days)
    const issueDate = new Date(issue.createdAt).getTime();
    const daysDiff = (Date.now() - issueDate) / (1000 * 60 * 60 * 24);
    const timeScore = Math.max(0, 15 * (1 - (daysDiff / 7)));
    similarity += timeScore;

    if (similarity > 50) {
      return {
        issue,
        distance,
        similarity: Math.round(similarity)
      };
    }
    return null;
  }).filter(Boolean) as { issue: Issue; distance: number; similarity: number }[];

  // Sort by similarity descending
  related.sort((a, b) => b.similarity - a.similarity);

  const topMatch = related[0];
  const matchReasons: string[] = [];
  
  if (topMatch) {
    if (topMatch.distance < 0.1) matchReasons.push('Very close geographic proximity (< 100m)');
    if (topMatch.issue.category === category) matchReasons.push('Exact category match');
    const issueDate = new Date(topMatch.issue.createdAt).getTime();
    if ((Date.now() - issueDate) < 24 * 60 * 60 * 1000) matchReasons.push('Reported within the last 24 hours');
  }

  return { 
    isDuplicate: related.length > 0, 
    similarityScore: topMatch ? topMatch.similarity : 0,
    relatedIssues: related,
    matchReasons
  };
};
