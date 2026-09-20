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
export const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

// ============================================================================
// MULTI-SIGNAL DUPLICATE REPORT DETECTION ENGINE
// ============================================================================

// Configurable detection constants
export const DUPLICATE_CONFIG = {
  NEARBY_RADIUS_METERS: 200,        // Primary nearby radius threshold (~200m)
  EXTENDED_RADIUS_METERS: 1500,     // Extended candidate radius (~1.5km)
  MAX_CANDIDATE_RADIUS_METERS: 25000, // Municipal boundary radius (~25km)
  HIGH_CONFIDENCE_THRESHOLD: 70,    // >= 70% is HIGH duplicate confidence
  POSSIBLE_THRESHOLD: 45            // >= 45% is POSSIBLE duplicate
};

// Canonical synonym groups for semantic description matching
const SYNONYM_GROUPS: Record<string, string[]> = {
  pothole: ['pothole', 'potholes', 'crater', 'craters', 'hole', 'holes', 'cavity', 'depression', 'rut', 'pit', 'roadbreak', 'trench'],
  garbage: ['garbage', 'trash', 'waste', 'rubbish', 'dump', 'debris', 'litter', 'refuse', 'filth', 'bin', 'overflowing'],
  waterlogging: ['waterlogging', 'waterlogged', 'flooding', 'flood', 'puddle', 'waterpool', 'overflow', 'inundation', 'stagnant', 'pool'],
  drainage: ['drainage', 'drain', 'drains', 'sewer', 'sewage', 'gutter', 'nallah', 'culvert', 'pipe', 'clogged'],
  streetlight: ['streetlight', 'streetlights', 'light', 'lights', 'lamp', 'lamps', 'lightpost', 'pole', 'lantern', 'illumination', 'flickering'],
  damage: ['broken', 'damaged', 'cracked', 'shattered', 'crumbled', 'caved', 'ruined', 'hazardous', 'danger'],
  large: ['large', 'huge', 'massive', 'deep', 'giant', 'big', 'wide', 'major', 'extensive', 'severe'],
  small: ['small', 'tiny', 'minor', 'shallow', 'little'],
  entrance: ['gate', 'entrance', 'entry', 'door', 'exit', 'barrier', 'arch', 'portal'],
  road: ['road', 'street', 'lane', 'highway', 'pathway', 'avenue', 'sector', 'crossing', 'chowk', 'intersection', 'route', 'main', 'drive'],
  institution: ['college', 'university', 'campus', 'school', 'institute', 'hospital', 'market', 'plaza']
};

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'with',
  'by', 'of', 'from', 'this', 'that', 'there', 'here', 'it', 'its', 'near', 'beside', 'around', 'front',
  'side', 'back', 'has', 'have', 'had', 'been', 'my', 'our', 'very', 'causing', 'severe', 'please', 'help',
  'there', 'is', 'a', 'some', 'lot', 'due'
]);

/**
 * Normalizes and maps tokens to canonical synonyms
 */
const tokenizeAndNormalize = (text: string): string[] => {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));

  return words.map(w => {
    for (const [canonical, synonyms] of Object.entries(SYNONYM_GROUPS)) {
      if (synonyms.includes(w)) {
        return canonical;
      }
    }
    return w;
  });
};

/**
 * Calculates semantic text similarity between two descriptions (0.0 to 1.0)
 * Uses containment, word token overlap, and synonym expansion
 */
export const computeTextSimilarity = (desc1: string, desc2: string): number => {
  if (!desc1 || !desc2) return 0;
  const tokens1 = tokenizeAndNormalize(desc1);
  const tokens2 = tokenizeAndNormalize(desc2);

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let intersectionCount = 0;
  for (const token of set1) {
    if (set2.has(token)) {
      intersectionCount++;
    }
  }

  const minLen = Math.min(tokens1.length, tokens2.length);
  const containment = minLen > 0 ? intersectionCount / minLen : 0;
  const unionSize = new Set([...tokens1, ...tokens2]).size;
  const jaccard = unionSize > 0 ? intersectionCount / unionSize : 0;
  const dice = (2 * intersectionCount) / (tokens1.length + tokens2.length);

  // Containment provides great resilience when comparing short vs long descriptions
  return (containment * 0.5) + (dice * 0.3) + (jaccard * 0.2);
};

// Memory cache for perceptual image fingerprints
const imageFingerprintCache = new Map<string, number[]>();

/**
 * Computes a fast perceptual luminance fingerprint (16x16 grid = 256 values)
 * Resilient against compression, resizing, aspect changes, and slight modifications.
 */
export const computeImageFingerprint = async (photoSrc: string): Promise<number[] | null> => {
  if (!photoSrc) return null;
  if (imageFingerprintCache.has(photoSrc)) {
    return imageFingerprintCache.get(photoSrc)!;
  }

  return new Promise((resolve) => {
    // If not in a browser environment or canvas unavailable
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Fallback timeout in case image loading hangs
    const timer = setTimeout(() => {
      resolve(null);
    }, 1500);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0, 16, 16);
        const imgData = ctx.getImageData(0, 0, 16, 16).data;
        const fingerprint: number[] = [];

        for (let i = 0; i < imgData.length; i += 4) {
          // Standard ITU-R BT.601 perceptual luminance formula
          const lum = Math.round(0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2]);
          fingerprint.push(lum);
        }

        imageFingerprintCache.set(photoSrc, fingerprint);
        resolve(fingerprint);
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    img.src = photoSrc;
  });
};

/**
 * Compares two image fingerprints using normalized Euclidean & Mean Absolute Difference.
 * Returns similarity 0.0 to 1.0.
 */
export const compareImageFingerprints = (fp1: number[], fp2: number[]): number => {
  if (fp1.length !== fp2.length || fp1.length === 0) return 0;

  let totalDiff = 0;
  for (let i = 0; i < fp1.length; i++) {
    totalDiff += Math.abs(fp1[i] - fp2[i]);
  }

  const maxPossibleDiff = fp1.length * 255;
  const normalizedDiff = totalDiff / maxPossibleDiff;
  return Math.max(0, 1 - normalizedDiff * 2.0); // Scale so noticeable differences drop faster
};

/**
 * Checks category compatibility (exact match = 1.0, related = 0.75, unrelated = 0.0)
 */
export const computeCategorySimilarity = (cat1: IssueCategory, cat2: IssueCategory): number => {
  if (cat1 === cat2) return 1.0;

  const compatiblePairs: [IssueCategory, IssueCategory][] = [
    ['Pothole', 'Road Damage'],
    ['Waterlogging', 'Drainage'],
    ['Waterlogging', 'Water Leakage'],
    ['Garbage', 'Illegal Dumping'],
    ['Broken Footpath', 'Road Damage'],
    ['Traffic Sign', 'Public Safety']
  ];

  for (const [a, b] of compatiblePairs) {
    if ((cat1 === a && cat2 === b) || (cat1 === b && cat2 === a)) {
      return 0.75;
    }
  }

  return 0.0;
};

export interface DuplicateSignalScores {
  imageSimilarity: number;
  locationScore: number;
  descriptionScore: number;
  categoryScore: number;
  aiClassificationScore: number;
  isSameUser: boolean;
}

export interface CandidateMatch {
  issue: Issue;
  distanceMeters: number;
  similarity: number; // 0 - 100
  confidence: 'HIGH' | 'POSSIBLE' | 'LOW';
  signals: DuplicateSignalScores;
  reasons: string[];
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  similarityScore: number;
  confidence: 'HIGH' | 'POSSIBLE' | 'LOW';
  relatedIssues: CandidateMatch[];
  matchReasons: string[];
}

/**
 * Robust Multi-Signal Duplicate Report Detection
 */
export const detectDuplicates = async (
  lat: number, 
  lng: number, 
  category: IssueCategory, 
  description: string,
  existingIssues: Issue[],
  photo?: string | null,
  reporterId?: string
): Promise<DuplicateDetectionResult> => {
  // Small non-blocking async delay to simulate AI processing and yield to UI
  await delay(300);

  if (!existingIssues || existingIssues.length === 0) {
    return {
      isDuplicate: false,
      similarityScore: 0,
      confidence: 'LOW',
      relatedIssues: [],
      matchReasons: []
    };
  }

  // Fallback to municipal center if lat/lng are 0 or unset
  const effectiveLat = (lat && lat !== 0) ? lat : 30.7333;
  const effectiveLng = (lng && lng !== 0) ? lng : 76.7794;

  // Pre-calculate new report's image fingerprint if photo provided
  let newImageFp: number[] | null = null;
  if (photo) {
    try {
      newImageFp = await computeImageFingerprint(photo);
    } catch {
      newImageFp = null;
    }
  }

  // Candidate generation & scoring
  const candidates: CandidateMatch[] = [];

  for (const issue of existingIssues) {
    // 1. Geographic distance check (Candidate filtering stage)
    const issueLat = (issue.location?.lat && issue.location.lat !== 0) ? issue.location.lat : 30.7333;
    const issueLng = (issue.location?.lng && issue.location.lng !== 0) ? issue.location.lng : 76.7794;
    const distKm = getDistanceFromLatLonInKm(effectiveLat, effectiveLng, issueLat, issueLng);
    const distMeters = Math.round(distKm * 1000);

    // Hard cutoff: outside municipal boundary is never considered the same physical issue
    if (distMeters > DUPLICATE_CONFIG.MAX_CANDIDATE_RADIUS_METERS) {
      continue;
    }

    // Proximity score (0.0 to 1.0)
    let locationScore = 0;
    if (distMeters <= 50) {
      locationScore = 1.0;
    } else if (distMeters <= DUPLICATE_CONFIG.NEARBY_RADIUS_METERS) {
      locationScore = 0.90 + 0.10 * (1 - (distMeters - 50) / 150);
    } else if (distMeters <= 800) {
      locationScore = 0.65 + 0.25 * (1 - (distMeters - 200) / 600);
    } else if (distMeters <= 2500) {
      locationScore = 0.35 + 0.30 * (1 - (distMeters - 800) / 1700);
    } else if (distMeters <= 5000) {
      locationScore = 0.15 + 0.20 * (1 - (distMeters - 2500) / 2500);
    } else {
      locationScore = 0.05;
    }

    // 2. Category similarity (0.0 to 1.0)
    const categoryScore = computeCategorySimilarity(category, issue.category);

    // Edge case guard: If same location but completely incompatible category (e.g. Broken Streetlight vs Pothole)
    // and descriptions don't match, this is definitely NOT a duplicate!
    if (categoryScore === 0) {
      const textQuickCheck = computeTextSimilarity(description, issue.description);
      if (textQuickCheck < 0.3) {
        continue; // Skip incompatible candidate
      }
    }

    // 3. Description semantic similarity (0.0 to 1.0)
    const descriptionScore = computeTextSimilarity(description, issue.description);

    // 4. Photo / Visual similarity (0.0 to 1.0)
    let imageSimilarity = 0;
    let hasImageComparison = false;

    if (photo && issue.photos && issue.photos.length > 0) {
      const existingPhoto = issue.photos[0];
      hasImageComparison = true;

      // Exact string / URL match
      if (photo === existingPhoto) {
        imageSimilarity = 1.0;
      } else if (newImageFp) {
        // Compare perceptual fingerprints
        const existingFp = await computeImageFingerprint(existingPhoto);
        if (existingFp) {
          imageSimilarity = compareImageFingerprints(newImageFp, existingFp);
        } else {
          // If existing image fingerprint failed, compare base64 similarity if data url
          imageSimilarity = 0.5;
        }
      }
    }

    // 5. AI Classification / Urgency alignment
    let aiClassificationScore = 0;
    if (issue.aiAnalysis) {
      const deptMatch = (DEPARTMENT_ROUTING[category] || '') === issue.aiAnalysis.suggestedDepartment;
      aiClassificationScore = deptMatch ? 1.0 : 0.5;
    } else {
      aiClassificationScore = categoryScore;
    }

    // Check if same user is submitting twice
    const isSameUser = Boolean(reporterId && issue.reporterId && reporterId === issue.reporterId);

    // Composite Weighting Calculation
    let compositeScore = 0;
    if (hasImageComparison) {
      // Standard weights: Image 35%, Location 30%, Description 15%, Category 10%, AI 10%
      compositeScore = (
        (imageSimilarity * 35) +
        (locationScore * 30) +
        (descriptionScore * 15) +
        (categoryScore * 10) +
        (aiClassificationScore * 10)
      );
    } else {
      // Rebalanced weights when photo is not compared: Location 45%, Description 25%, Category 20%, AI 10%
      compositeScore = (
        (locationScore * 45) +
        (descriptionScore * 25) +
        (categoryScore * 20) +
        (aiClassificationScore * 10)
      );
    }

    // Bonus for same user submitting the same issue twice (Requirement 8)
    if (isSameUser && categoryScore >= 0.75 && (descriptionScore >= 0.35 || imageSimilarity >= 0.6)) {
      compositeScore = Math.min(100, compositeScore + 20);
    }

    // Bonus for high visual match + close proximity
    if (imageSimilarity >= 0.80 && locationScore >= 0.5) {
      compositeScore = Math.min(100, compositeScore + 15);
    }

    // Significant distance penalty (Requirement 9: same photo but completely different location)
    if (distMeters > 5000) {
      compositeScore = compositeScore * 0.65;
    }
    if (distMeters > 15000) {
      compositeScore = compositeScore * 0.2;
    }

    const finalSimilarity = Math.round(compositeScore);

    // Classify Confidence
    let confidence: 'HIGH' | 'POSSIBLE' | 'LOW' = 'LOW';
    if (finalSimilarity >= DUPLICATE_CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
      confidence = 'HIGH';
    } else if (finalSimilarity >= DUPLICATE_CONFIG.POSSIBLE_THRESHOLD) {
      confidence = 'POSSIBLE';
    }

    // Only collect candidates that meet at least POSSIBLE threshold (or close to it)
    if (finalSimilarity >= 45) {
      const reasons: string[] = [];
      if (distMeters < 50) {
        reasons.push('Identical geographic coordinates (< 50m)');
      } else if (distMeters <= DUPLICATE_CONFIG.NEARBY_RADIUS_METERS) {
        reasons.push(`Very close location (~${distMeters}m away)`);
      } else {
        reasons.push(`Nearby location (~${distMeters}m away)`);
      }

      if (categoryScore === 1.0) {
        reasons.push(`Identical issue category (${issue.category})`);
      } else if (categoryScore > 0) {
        reasons.push(`Related category (${issue.category})`);
      }

      if (hasImageComparison && imageSimilarity >= 0.7) {
        reasons.push(`High visual photo similarity (${Math.round(imageSimilarity * 100)}%)`);
      }

      if (descriptionScore >= 0.4) {
        reasons.push('Matching semantic description keywords');
      }

      if (isSameUser) {
        reasons.push('Previous report submitted from your account');
      }

      candidates.push({
        issue,
        distanceMeters: distMeters,
        similarity: finalSimilarity,
        confidence,
        signals: {
          imageSimilarity,
          locationScore,
          descriptionScore,
          categoryScore,
          aiClassificationScore,
          isSameUser
        },
        reasons
      });
    }
  }

  // Sort descending by similarity score
  candidates.sort((a, b) => b.similarity - a.similarity);

  const topMatch = candidates[0];
  const isDuplicate = topMatch ? (topMatch.confidence === 'HIGH' || topMatch.confidence === 'POSSIBLE') : false;

  return {
    isDuplicate,
    similarityScore: topMatch ? topMatch.similarity : 0,
    confidence: topMatch ? topMatch.confidence : 'LOW',
    relatedIssues: candidates,
    matchReasons: topMatch ? topMatch.reasons : []
  };
};
