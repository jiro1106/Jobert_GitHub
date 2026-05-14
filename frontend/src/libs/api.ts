/**
 * API Client for Signal PH Backend
 * Handles all communication with the backend API
 */

/** Backend mounts landing + signal routes under `/api` (see backend/main.py). Port matches backend/config/settings.py default. */
const _rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
const API_BASE_URL = _rawApiUrl
  ? _rawApiUrl.replace(/\/api$/, '') + '/api'
  : 'http://localhost:8001/api';

// ---------------------------------------------------------------------------
// Session-level TTL cache — prevents redundant fetches for the same route
// within a 2-minute window (e.g. scope toggles, back-navigation).
// ---------------------------------------------------------------------------
const _cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 2 * 60 * 1000;

function _key(...parts: (string | number)[]): string {
  return parts.map((p) => (typeof p === 'number' ? p.toFixed(3) : p)).join(':');
}

function _get<T>(key: string): T | null {
  const entry = _cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function _set(key: string, data: unknown): void {
  _cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Signal Analysis Request Data
 */
export interface SignalAnalysisRequest {
  latitude: number;
  longitude: number;
  radius_km?: number;
}

/**
 * Cell Tower Data
 */
export interface CellTower {
  id: string;
  latitude: number;
  longitude: number;
  provider: string;
  signal_strength?: number;
  distance_km?: number;
  /** Raw OpenCellID range in metres — undefined when not available. */
  range_meters?: number;
}

/**
 * Signal Report Data
 */
export interface SignalReport {
  id?: string;
  latitude: number;
  longitude: number;
  signal_strength: number;
  network_type: string;
  provider: string;
  timestamp?: string;
  user_id?: string;
}

/**
 * Signal Analysis Response (matches backend `SignalAnalysisResponse.model_dump()`).
 */
export interface SignalAnalysisResponse {
  location_lat: number;
  location_lng: number;
  signal_score: number;
  nearby_towers: number;
  recent_reports: number;
  recommendations: string[];
}

/**
 * Nearby Towers Response
 */
export interface NearbyTowersResponse {
  towers: CellTower[];
  center: {
    latitude: number;
    longitude: number;
  };
  search_radius_km: number;
}

/**
 * Route Endpoint for RouteForecast
 */
export interface RouteEndpoint {
  label: string;
  lat: number;
  lng: number;
}

/**
 * Trip Summary
 */
export interface TripSummary {
  distanceKm: number;
  drivingTimeMin: number;
  strongSignalPct: number;
  deadZoneCount: number;
}

/**
 * Signal Gap
 */
export interface SignalGap {
  id: string;
  km: number;
  level: 'dead' | 'patchy';
  name: string;
  description: string;
}

/**
 * Provider Score
 */
export interface ProviderScore {
  provider: 'globe' | 'smart' | 'dito';
  name: string;
  fullName: string;
  score: number;
  delta: number;
  network: '5G' | '4G LTE' | '3G';
  avgSpeedMbps: number;
  strongSignalPct: number;
  confidencePct: number;
  sparklineData: number[];
}

/**
 * SIM Recommendation
 */
export interface SimRecommendation {
  provider: 'globe' | 'smart' | 'dito';
  name: string;
  reason: string;
  score: number;
}

/**
 * Route Forecast (landing page main data structure)
 */
export interface RouteForecast {
  origin: RouteEndpoint;
  destination: RouteEndpoint;
  summary: TripSummary;
  recommendation: SimRecommendation;
  gaps: SignalGap[];
  providers: ProviderScore[];
}

/**
 * Stats Cell
 */
export interface StatCell {
  value: string;
  label: string;
  sublabel: string;
}

/**
 * Stats Response
 */
export interface StatsResponse {
  stats: StatCell[];
}

/**
 * Chat Message
 */
export interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  citation?: string;
}

/**
 * Chat Request
 */
export interface ChatRequest {
  message: string;
  context?: Record<string, any>;
}

/**
 * Chat Response
 */
export interface ChatResponseData {
  message: ChatMessage;
  conversation_id: string;
}

/**
 * Backend wraps payloads as `{ message, data, timestamp }` (see backend/utils/helpers.success_response).
 */
export type ApiSuccessEnvelope<T> = {
  message?: string;
  data: T;
  timestamp?: string;
};

async function readEnvelope<T>(response: Response): Promise<T> {
  const envelope = await handleResponse<ApiSuccessEnvelope<T>>(response);
  if (envelope.data === undefined || envelope.data === null) {
    throw new Error(
      typeof envelope.message === 'string' ? envelope.message : 'API returned empty data'
    );
  }
  return envelope.data;
}

/**
 * Helper function to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `HTTP Error: ${response.status}`;
    try {
      const body = (await response.json()) as Record<string, unknown>;
      if (typeof body.detail === 'string') {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        message = JSON.stringify(body.detail);
      } else if (typeof body.error === 'string') {
        message = body.error;
      } else if (typeof body.message === 'string') {
        message = body.message;
      }
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

/**
 * Analyze signal quality at a specific location
 */
export async function analyzeSignalLocation(
  request: SignalAnalysisRequest
): Promise<SignalAnalysisResponse> {
  const params = new URLSearchParams({
    latitude: request.latitude.toString(),
    longitude: request.longitude.toString(),
    radius_km: (request.radius_km || 5.0).toString(),
  });

  const response = await fetch(
    `${API_BASE_URL}/signals/analyze?${params}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return readEnvelope<SignalAnalysisResponse>(response);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

type TowerApiRow = {
  tower_id: number;
  latitude: number;
  longitude: number;
  provider_name?: string | null;
  average_signal?: number | null;
  /** Signal coverage radius from OpenCellID (may be null/0 for some records). */
  range_meters?: number | null;
};

type ReportApiRow = {
  report_id?: number;
  latitude?: number;
  longitude?: number;
  provider_name?: string | null;
  issue_type?: string | null;
  created_at?: string;
};

/**
 * Get cell towers near a specific location
 */
export async function getNearbyTowers(
  latitude: number,
  longitude: number,
  radius_km: number = 5.0,
  limit: number = 50
): Promise<NearbyTowersResponse> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radius_km: radius_km.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(
    `${API_BASE_URL}/towers/nearby?${params}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const rows = await readEnvelope<TowerApiRow[]>(response);
  return {
    towers: rows.map((t) => ({
      id: String(t.tower_id),
      latitude: t.latitude,
      longitude: t.longitude,
      provider: t.provider_name ?? 'Unknown',
      signal_strength: t.average_signal ?? undefined,
      distance_km: haversineKm(latitude, longitude, t.latitude, t.longitude),
      range_meters: t.range_meters ?? undefined,
    })),
    center: { latitude, longitude },
    search_radius_km: radius_km,
  };
}

/**
 * Submit a crowdsourced signal report (maps frontend shape → backend `SignalReportCreate`).
 */
export async function submitSignalReport(
  report: Omit<SignalReport, 'id' | 'timestamp'>
): Promise<{ report_id: number }> {
  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      latitude: report.latitude,
      longitude: report.longitude,
      provider_name: report.provider,
      issue_type: report.network_type,
      signal_feedback: `Estimated RSSI ${report.signal_strength} dBm (user-submitted).`,
    }),
  });

  return readEnvelope<{ report_id: number }>(response);
}

/**
 * Get nearby signal reports
 */
export async function getNearbyReports(
  latitude: number,
  longitude: number,
  radius_km: number = 1.0,
  limit: number = 100
): Promise<SignalReport[]> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radius_km: radius_km.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(
    `${API_BASE_URL}/reports/nearby?${params}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const rows = await readEnvelope<ReportApiRow[]>(response);
  return rows.map((r) => ({
    id: String(r.report_id ?? ''),
    latitude: Number(r.latitude ?? 0),
    longitude: Number(r.longitude ?? 0),
    signal_strength: -90,
    network_type: String(r.issue_type ?? 'unknown'),
    provider: String(r.provider_name ?? 'Unknown'),
    timestamp: r.created_at ? String(r.created_at) : undefined,
  }));
}

/**
 * =================== NEW LANDING PAGE ENDPOINTS ===================
 */

/**
 * Get route forecast with provider recommendations and signal gaps
 * Used by: MapSection, ProviderScoreboardSection
 */
export async function getRouteForecast(
  originLat: number,
  originLng: number,
  originName: string,
  destLat: number,
  destLng: number,
  destName: string,
  routePoints?: { latitude: number; longitude: number; name?: string }[],
  options?: { signal?: AbortSignal }
): Promise<RouteForecast> {
  const cacheKey = _key('forecast', originLat, originLng, destLat, destLng);
  const cached = _get<RouteForecast>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${API_BASE_URL}/route/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { latitude: originLat, longitude: originLng, name: originName },
      destination: { latitude: destLat, longitude: destLng, name: destName },
      route_points: routePoints,
      radius_km: 10.0,
    }),
    signal: options?.signal,
  });

  const result = await readEnvelope<RouteForecast>(response);
  _set(cacheKey, result);
  return result;
}

/**
 * Get provider scores for a route or specific area
 * Used by: ProviderScoreboardSection
 */
export async function getProviderScores(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  scope: 'route' | 'origin' | 'dest' = 'route',
  options?: { signal?: AbortSignal }
): Promise<{ providers: ProviderScore[] }> {
  const cacheKey = _key('scores', originLat, originLng, destLat, destLng, scope);
  const cached = _get<{ providers: ProviderScore[] }>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    origin_lat: originLat.toString(),
    origin_lon: originLng.toString(),
    dest_lat: destLat.toString(),
    dest_lon: destLng.toString(),
    scope,
  });

  const response = await fetch(`${API_BASE_URL}/providers/scores?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal: options?.signal,
  });

  const result = await readEnvelope<{ providers: ProviderScore[] }>(response);
  _set(cacheKey, result);
  return result;
}

/**
 * Get platform statistics (provinces, reports, providers, accuracy)
 * Used by: StatsSection
 */
export async function getPlatformStats(): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE_URL}/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return readEnvelope<StatsResponse>(response);
}

/**
 * Submit a chat message and get AI agent response
 * Used by: FloatingChatbot
 */
export async function submitChatMessage(
  message: string,
  conversationId?: string
): Promise<ChatResponseData> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      context: conversationId ? { conversation_id: conversationId } : undefined,
    }),
  });

  return readEnvelope<ChatResponseData>(response);
}

/**
 * Get API base URL (useful for debugging)
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
