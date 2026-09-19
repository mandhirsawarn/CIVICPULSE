export interface SearchResultItem {
  id: string | number;
  displayName: string;
  placeName: string;
  secondaryAddress: string;
  lat: number;
  lng: number;
  type?: string;
  category?: string;
  address?: any;
  score?: number;
}

export interface NominatimRawItem {
  place_id: number;
  osm_type?: string;
  osm_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  namedetails?: Record<string, string>;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
  class: string;
  type: string;
  importance?: number;
}

const STOP_WORDS_SET = new Set([
  'city', 'colony', 'enclave', 'nagar', 'township', 'phase', 'sector',
  'road', 'street', 'near', 'at', 'in', 'civil', 'block', 'ward', 'lane'
]);

/**
 * Normalizes query string for uniform matching (lowercase, no punctuation/hyphens, collapsed spaces).
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[,;:\-_/\\#()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates a relevance score for ranking results based on:
 * 1. Exact phrase match
 * 2. All query words present
 * 3. Place name match
 * 4. Namedetails match
 * 5. Address match
 * 6. POI relevance
 * 7. Nominatim importance
 * 8. Current map proximity bias
 */
export function computeRelevanceScore(
  item: NominatimRawItem,
  query: string,
  currentCoords?: { lat: number; lng: number } | null
): number {
  const normQuery = normalizeQuery(query);
  const queryTokens = normQuery.split(' ').filter(t => t.length > 0);
  if (queryTokens.length === 0) return 0;

  let score = 0;
  const primaryName = (item.name || item.namedetails?.name || item.display_name.split(',')[0] || '').trim().toLowerCase();
  const fullDisplay = item.display_name.toLowerCase();

  const namedetailValues = item.namedetails ? Object.values(item.namedetails).map(v => String(v).toLowerCase()) : [];
  const addressValues = item.address ? Object.values(item.address).map(v => String(v).toLowerCase()) : [];
  const extratagValues = item.extratags ? Object.values(item.extratags).map(v => String(v).toLowerCase()) : [];

  const allSearchable = [
    primaryName,
    fullDisplay,
    ...namedetailValues,
    ...addressValues,
    ...extratagValues
  ].join(' ');

  // 1. Exact phrase match
  if (primaryName === normQuery) {
    score += 160;
  } else if (primaryName.startsWith(normQuery)) {
    score += 110;
  } else if (primaryName.includes(normQuery)) {
    score += 75;
  } else if (fullDisplay.includes(normQuery)) {
    score += 50;
  }

  // 2. Query words matching with extra weight for prominent (non-generic) tokens
  let matchedTokensInName = 0;
  let matchedTokensInAll = 0;
  let matchedProminentTokens = 0;
  let prominentCount = 0;

  for (const token of queryTokens) {
    const isProminent = !STOP_WORDS_SET.has(token);
    if (isProminent) prominentCount++;

    if (primaryName.includes(token)) {
      matchedTokensInName++;
      matchedTokensInAll++;
      if (isProminent) matchedProminentTokens++;
    } else if (allSearchable.includes(token)) {
      matchedTokensInAll++;
      if (isProminent) matchedProminentTokens++;
    }
  }

  score += (matchedTokensInName / queryTokens.length) * 60;
  score += (matchedTokensInAll / queryTokens.length) * 40;

  if (prominentCount > 0) {
    score += (matchedProminentTokens / prominentCount) * 80;
  }

  if (matchedTokensInAll === queryTokens.length) {
    score += 40;
  }

  // 3. POI relevance
  const isPoi = [
    'amenity', 'tourism', 'leisure', 'shop', 'historic', 'office',
    'healthcare', 'aeroway', 'railway', 'highway'
  ].includes(item.class) || [
    'university', 'college', 'school', 'hospital', 'mall', 'supermarket',
    'station', 'lake', 'park', 'attraction', 'stadium'
  ].includes(item.type);

  if (isPoi) {
    score += 20;
  }

  // 4. Nominatim importance
  const importance = parseFloat(String(item.importance)) || 0;
  score += importance * 20;

  // 5. Current map proximity bias (viewport bias without hard filtering)
  if (currentCoords && item.lat && item.lon) {
    const itemLat = parseFloat(item.lat);
    const itemLng = parseFloat(item.lon);
    if (!isNaN(itemLat) && !isNaN(itemLng)) {
      const dLat = (itemLat - currentCoords.lat) * 111;
      const dLng = (itemLng - currentCoords.lng) * 111 * Math.cos((currentCoords.lat * Math.PI) / 180);
      const distKm = Math.sqrt(dLat * dLat + dLng * dLng);

      if (distKm < 15) {
        score += 35; // Close proximity
      } else if (distKm < 50) {
        score += 20; // District proximity
      } else if (distKm < 150) {
        score += 10;
      }
    }
  }

  return score;
}

/**
 * Performs a single Nominatim search request with complete Indian parameters.
 */
async function queryNominatimSingle(
  query: string,
  signal?: AbortSignal
): Promise<NominatimRawItem[]> {
  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      addressdetails: '1',
      namedetails: '1',
      extratags: '1',
      limit: '15',
      countrycodes: 'in',
      'accept-language': 'en-IN',
      q: query
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CivicPulse-App/1.0 (contact@civicpulse.org)'
        }
      }
    );

    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    return [];
  }
}

/**
 * Multi-query location search with query normalization, controlled fallbacks,
 * deduplication, and client-side relevance ranking.
 */
export async function fetchNominatimSearch(
  rawQuery: string,
  currentCoords?: { lat: number; lng: number } | null,
  signal?: AbortSignal
): Promise<SearchResultItem[]> {
  const norm = normalizeQuery(rawQuery);
  if (norm.length < 2) return [];

  // Generate controlled query variants (max 3)
  const variants: string[] = [norm];

  // Variant 2: strip generic descriptors (city, colony, township, etc.)
  const cleaned = norm
    .replace(/\b(city|colony|enclave|nagar|township|road|phase|sector|civil|block|ward|lane)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned && cleaned !== norm && cleaned.length >= 3) {
    variants.push(cleaned);
  }

  // Variant 3: use prominent geographic anchor token
  const words = norm.split(' ');
  const prominent = words.filter(w => !STOP_WORDS_SET.has(w) && w.length >= 3);
  if (prominent.length > 0) {
    const anchor = prominent[0];
    if (anchor && !variants.includes(anchor)) {
      variants.push(anchor);
    }
  }

  const merged: NominatimRawItem[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < variants.length; i++) {
    const q = variants[i];
    const results = await queryNominatimSingle(q, signal);
    for (const r of results) {
      const key = r.osm_type && r.osm_id ? `${r.osm_type}_${r.osm_id}` : String(r.place_id || `${r.lat}_${r.lon}`);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(r);
      }
    }
    // If primary query already gave 4+ relevant results, do not make extra fallback requests
    if (merged.length >= 4) break;
  }

  // Rank merged results
  const scored = merged.map(item => ({
    item,
    score: computeRelevanceScore(item, rawQuery, currentCoords)
  }));

  scored.sort((a, b) => b.score - a.score);

  // Return formatted results
  return scored.slice(0, 10).map(({ item, score }) => {
    const rawDisplayName = item.display_name || '';
    const parts = rawDisplayName.split(',');
    const placeName = item.name || item.namedetails?.name || parts[0]?.trim() || 'Location';
    const secondaryAddress = parts.slice(1, 4).join(',').trim() || parts.slice(1).join(',').trim();

    return {
      id: item.place_id || `${item.lat}-${item.lon}`,
      displayName: rawDisplayName,
      placeName,
      secondaryAddress,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      category: item.class,
      address: item.address,
      score
    };
  });
}

/**
 * Reverse geocodes coordinates to a clean, readable address.
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<string> {
  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      addressdetails: '1',
      lat: String(lat),
      lon: String(lng)
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        signal,
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'en-IN',
          'User-Agent': 'CivicPulse-App/1.0 (contact@civicpulse.org)'
        }
      }
    );

    if (!response.ok) return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    const data = await response.json();
    return data.display_name || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  }
}
