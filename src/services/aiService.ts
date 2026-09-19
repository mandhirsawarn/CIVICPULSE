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
  'Pothole': 'Roads & Infrastructure Department',
  'Road Damage': 'Roads & Infrastructure Department',
  'Broken Footpath': 'Roads & Infrastructure Department',
  'Garbage': 'Sanitation Department',
  'Illegal Dumping': 'Sanitation Department',
  'Streetlight': 'Electrical / Street Lighting Department',
  'Waterlogging': 'Drainage & Sewerage Department',
  'Drainage': 'Drainage & Sewerage Department',
  'Water Leakage': 'Water Supply Department',
  'Traffic Sign': 'Traffic / Road Safety Department',
  'Obstruction': 'Traffic / Road Safety Department',
  'Public Safety': 'Traffic / Road Safety Department',
  'Other': 'General Administration'
};

export const analyzeIssue = async (
  photoData: string | null, 
  description: string, 
  citizenUrgency: Urgency, 
  citizenCategory: IssueCategory
): Promise<AIAnalysis> => {
  await delay(800); // Simulate processing

  const text = description.toLowerCase();
  
  // 1. Detect Category & Keywords deterministically
  let detectedCategory: IssueCategory = 'Other';
  let maxScore = 0;
  const foundKeywords: string[] = [];
  
  Object.entries(CATEGORY_DICTIONARY).forEach(([cat, data]) => {
    let score = 0;
    if (data.negative.some(neg => text.includes(neg))) return;

    data.keywords.forEach(word => {
      if (text.includes(word)) {
        score += 2;
        foundKeywords.push(word);
      }
    });

    data.severityWords.forEach(word => {
      if (text.includes(word)) {
        score += 3;
        foundKeywords.push(word);
      }
    });

    if (score > maxScore) {
      maxScore = score;
      detectedCategory = cat as IssueCategory;
    }
  });

  // Respect citizen category if AI didn't find anything stronger
  let finalCategory = citizenCategory;
  let categoryMismatch = false;
  if (maxScore > 3 && detectedCategory !== citizenCategory && (citizenCategory as string) !== 'Other') {
    categoryMismatch = true; // AI strongly disagrees with citizen
    finalCategory = detectedCategory; 
  }

  // 2. Deterministic Priority Score & Reasoning
  const reasoning: { factor: string; score: number }[] = [];
  let priorityScore = 0;

  // A. Citizen Urgency
  let urgencyScore = 10;
  if (citizenUrgency === 'URGENT') urgencyScore = 40;
  else if (citizenUrgency === 'HIGH') urgencyScore = 30;
  else if (citizenUrgency === 'MODERATE') urgencyScore = 20;
  
  priorityScore += urgencyScore;
  reasoning.push({ factor: `Citizen Urgency (${citizenUrgency})`, score: urgencyScore });

  // B. Safety Indicators
  let safetyScore = 5;
  let safetyRisk: Severity = 'LOW';
  let severity: Severity = 'LOW';

  if (SEVERITY_INDICATORS.CRITICAL.some(w => text.includes(w))) {
    safetyScore = 25;
    safetyRisk = 'HIGH';
    severity = 'HIGH';
  } else if (SEVERITY_INDICATORS.HIGH.some(w => text.includes(w))) {
    safetyScore = 15;
    safetyRisk = 'MEDIUM';
    severity = 'MEDIUM';
  } else if (SEVERITY_INDICATORS.MEDIUM.some(w => text.includes(w))) {
    safetyScore = 5;
    safetyRisk = 'LOW';
    severity = 'MEDIUM';
  }
  priorityScore += safetyScore;
  reasoning.push({ factor: safetyScore === 25 ? 'Critical safety keyword' : safetyScore === 15 ? 'Potential safety concern' : 'Normal safety context', score: safetyScore });

  // C. Location Context
  let locationScore = 5;
  if (['school', 'hospital', 'market', 'traffic', 'highway', 'public', 'main road'].some(w => text.includes(w))) {
    locationScore = 15;
  }
  priorityScore += locationScore;
  reasoning.push({ factor: locationScore === 15 ? 'High-traffic/public area' : 'Normal area', score: locationScore });

  // D. Description Evidence
  let evidenceScore = 0;
  if (foundKeywords.length >= 3) evidenceScore = 10;
  else if (foundKeywords.length > 0) evidenceScore = 5;
  
  priorityScore += evidenceScore;
  reasoning.push({ factor: evidenceScore === 10 ? 'Strong issue-specific evidence' : evidenceScore === 5 ? 'Moderate evidence' : 'Basic description', score: evidenceScore });

  // Clamp priority score
  priorityScore = Math.min(100, Math.max(0, priorityScore));

  // Determine Final Severity based on priority score deterministically
  if (priorityScore >= 80) severity = 'HIGH';
  else if (priorityScore >= 50) severity = 'MEDIUM';
  else severity = 'LOW';

  // 3. Deterministic Confidence
  let confidence = 75; // Limited info
  if (foundKeywords.length >= 2 && !categoryMismatch) {
    confidence = 85; // Good description + category match
    if (photoData) {
      confidence = 92; // Strong description + category match + image
    }
  } else if (foundKeywords.length >= 2 && photoData) {
    confidence = 88;
  }

  // 4. Deterministic Resolution Time
  let estimatedResolutionTime = '5-10 days';
  if (citizenUrgency === 'URGENT') estimatedResolutionTime = '6-24 hours';
  else if (citizenUrgency === 'HIGH') estimatedResolutionTime = '24-48 hours';
  else if (citizenUrgency === 'MODERATE') estimatedResolutionTime = '2-5 days';
  else estimatedResolutionTime = '5-10 days';

  const matchedSignals = [
    ...(foundKeywords.length > 0 ? ['Keywords Matched'] : []),
    ...(photoData ? ['Image Evidence'] : []),
    ...(categoryMismatch ? ['Category Review Suggested'] : [])
  ];

  return {
    confidence,
    detectedCategory: finalCategory,
    severity,
    safetyRisk,
    suggestedDepartment: DEPARTMENT_ROUTING[finalCategory] || 'General Administration',
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
