# Signal PH Frontend-Backend Integration

## Overview

This directory contains the API client and utilities for communicating with the Signal PH backend API.

## Files

### `api.ts`
Main API client module with typed functions for all backend endpoints.

**Available Functions:**
- `analyzeSignalLocation(request)` - Analyze signal quality at a location
- `getNearbyTowers(latitude, longitude, radius_km, limit)` - Get cell towers nearby
- `submitSignalReport(report)` - Submit a crowdsourced signal report
- `getNearbyReports(latitude, longitude, radius_km, limit)` - Get nearby signal reports
- `getApiBaseUrl()` - Get the configured API URL

**Types Exported:**
- `SignalAnalysisRequest`
- `CellTower`
- `SignalReport`
- `SignalAnalysisResponse`
- `NearbyTowersResponse`
- `ApiError`

### `useApi.ts`
Custom React hook for managing async API calls with loading and error states.

**Usage:**
```typescript
const { data, loading, error, execute, reset } = useApi(
  () => analyzeSignalLocation({ latitude, longitude })
);

// Call the API
await execute();
```

## Configuration

The API base URL is configured via environment variables:

**Frontend:**
- Create `.env.local` in the frontend directory
- Set `VITE_API_URL=http://localhost:8000` (development)

**Backend:**
- FastAPI CORS is configured to allow requests from `http://localhost:5173` (Vite dev server)
- In production, update the allowed origins in `backend/main.py`

## Getting Started

### 1. Start the Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Test the Connection
Use the `ApiTest` component to verify the connection is working:

```typescript
import ApiTest from './components/ApiTest';

// Use it in your router or directly
<ApiTest />
```

## Making API Calls

### Example 1: Analyze Signal at a Location
```typescript
import { analyzeSignalLocation } from './lib/api';

async function checkSignal() {
  try {
    const result = await analyzeSignalLocation({
      latitude: 14.5995,
      longitude: 120.9842,
      radius_km: 5.0
    });
    console.log('Signal Quality:', result.signal_quality);
    console.log('Nearby towers:', result.nearby_towers);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Example 2: Using in a React Component
```typescript
import { useApi } from './lib/useApi';
import { analyzeSignalLocation } from './lib/api';

function SignalChecker() {
  const api = useApi(() =>
    analyzeSignalLocation({ latitude: 14.5995, longitude: 120.9842 })
  );

  return (
    <div>
      <button onClick={() => api.execute()} disabled={api.loading}>
        {api.loading ? 'Checking...' : 'Check Signal'}
      </button>
      {api.error && <p>Error: {api.error.message}</p>}
      {api.data && <p>Quality: {api.data.signal_quality}</p>}
    </div>
  );
}
```

## Troubleshooting

### CORS Errors
- Ensure backend is running on `http://localhost:8000`
- Check `.env.local` has `VITE_API_URL=http://localhost:8000`
- Verify CORS middleware in `backend/main.py` allows your frontend URL

### 404 Errors
- Verify the endpoint path matches the backend routes
- Check backend is running: `GET http://localhost:8000/docs` (Swagger UI)

### Connection Refused
- Ensure backend is running: `python main.py` from the backend directory
- Check port 8000 is not blocked by firewall

## Next Steps

1. ✅ **API Client created** - `src/lib/api.ts`
2. ✅ **Environment configured** - `.env.local`
3. ✅ **Test component created** - `src/components/ApiTest.tsx`
4. **Integrate into pages** - Add API calls to existing pages (MapsPage, CoveragePage, etc.)
5. **Add authentication** - Implement auth tokens when backend auth is ready
6. **Error handling** - Add global error boundary for API errors
7. **Caching** - Add request caching for repeated queries

## API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/signals/analyze` | Analyze signal at location |
| GET | `/towers/nearby` | Get nearby cell towers |
| POST | `/reports` | Submit signal report |
| GET | `/reports/nearby` | Get nearby reports |

For more details, visit `http://localhost:8000/docs` (Swagger UI) when backend is running.
