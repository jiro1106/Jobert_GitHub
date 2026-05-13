# SignalPH MCP Server

Model Context Protocol (MCP) server for the SignalPH signal analysis engine. Exposes signal analysis tools and database resources for AI agent integration.

## Overview

The MCP server provides AI agents with:
- **3 Tools** for analyzing signal coverage and submitting reports
- **4 Resources** for accessing tower, report, and anomaly data
- **Stdio-based protocol** compatible with Claude and other MCP-enabled AI systems

## Quick Start

```bash
# Start the MCP server
python run_mcp_server.py

# Run tests
python test_mcp_server.py
```

## Tools

### 1. analyze_point
Analyze signal coverage at a single geographic point.

**Input:**
```json
{
  "latitude": 14.5995,
  "longitude": 121.0437,
  "radius_km": 5.0
}
```

**Output:**
```json
{
  "best_provider": "Globe",
  "provider_scores": {
    "Globe": { "score": 75.2, "coverage_rate": 0.95, "matched_rate": 0.85 },
    "Smart": { "score": 62.1, "coverage_rate": 0.75, "matched_rate": 0.65 },
    "DITO": { "score": 48.3, "coverage_rate": 0.45, "matched_rate": 0.35 }
  },
  "closest_towers": [ ... ],
  "weak_segments": [ ... ],
  "nearby_reports_summary": { ... },
  "recommendation_text": "Globe is recommended for this location.",
  "explanation_text": "...",
  "offline_readiness_alerts": [ ... ]
}
```

### 2. analyze_route
Analyze signal coverage along a route from origin to destination.

**Input:**
```json
{
  "origin": {
    "latitude": 14.5995,
    "longitude": 121.0437,
    "name": "Start"
  },
  "destination": {
    "latitude": 14.6091,
    "longitude": 121.0537,
    "name": "End"
  },
  "route_points": [
    { "latitude": 14.6020, "longitude": 121.0480 }
  ],
  "radius_km": 5.0
}
```

**Output:**
Same structure as `analyze_point`, but includes weak segments detected along the entire route.

### 3. submit_signal_report
Submit a crowdsourced signal quality report.

**Input:**
```json
{
  "latitude": 14.5995,
  "longitude": 121.0437,
  "provider_name": "Globe",
  "signal_feedback": "good",
  "speed_feedback": "fast",
  "issue_type": null,
  "user_notes": "Coverage is reliable in this area"
}
```

**Output:**
```json
{
  "status": "saved",
  "report_id": 42
}
```

## Resources

### 1. signal://recent-reports
Latest crowdsourced signal quality reports from all users.

**URI:** `signal://recent-reports`

**Response:** Array of report objects, each with:
- `latitude`, `longitude` (location)
- `provider_name` (Globe, Smart, DITO)
- `signal_feedback`, `speed_feedback` (user ratings)
- `issue_type` (no_signal, slow_data, unstable, etc.)
- `user_notes` (additional context)
- `created_at` (timestamp)

### 2. signal://reports/near-point/{latitude}/{longitude}/{radius_km}
Signal reports submitted by users near a specific location.

**URI:** `signal://reports/near-point/14.5995/121.0437/5.0`

**Response:** Array of report objects near the point, within the search radius.

### 3. signal://towers/near-point/{latitude}/{longitude}/{radius_km}
Cell tower infrastructure data near a specific location.

**URI:** `signal://towers/near-point/14.5995/121.0437/5.0`

**Response:** Array of tower objects, each with:
- `tower_id` (unique identifier)
- `latitude`, `longitude` (location)
- `provider_name` (Globe, Smart, DITO)
- `radio` (NR, LTE, UMTS, GSM - radio technology)
- `range_meters` (estimated coverage radius)
- `samples` (sample count from crowdsourced data)

### 4. signal://anomalies/recent
Recent analysis anomalies - cases where predictions conflicted with user reports or confidence was low.

**URI:** `signal://anomalies/recent`

**Response:** Array of anomaly objects, each with:
- `latitude`, `longitude` (location)
- `reason` (why this was flagged as anomalous)
- `best_provider` (predicted provider)
- `best_score` (prediction confidence 0-100)
- `conflicting_reports` (user reports that contradicted the prediction)
- `created_at` (timestamp)

## Provider Mapping

- `Globe` (net=2)
- `Smart` (net=3)
- `DITO` (net=66)

## Integration with Claude / Claude API

To use this MCP server with Claude:

1. Start the server in stdio mode:
   ```bash
   python run_mcp_server.py
   ```

2. Configure in your Claude client (e.g., via Claude Desktop):
   ```json
   {
     "mcpServers": {
       "signalph": {
         "command": "python",
         "args": ["run_mcp_server.py"],
         "cwd": "/path/to/project"
       }
     }
   }
   ```

3. Claude will automatically discover the tools and resources.

## Architecture

### Server Files
- `server.py` - Main MCP protocol implementation
- `tools.py` - Tool definitions with JSON schemas
- `resources.py` - Resource definitions
- `__init__.py` - Module metadata

### Supporting Services
- `backend/services/route_service.py` - Core analysis logic
- `backend/services/tower_matching_service.py` - Geospatial tower matching
- `backend/services/scoring_service.py` - Provider scoring
- `backend/db/` - Database repositories for towers, reports, anomalies

## Testing

Run the comprehensive test suite:

```bash
python test_mcp_server.py
```

Tests include:
- Module imports and initialization
- Tool listing
- Resource listing
- **Tool execution:** Calls analyze_point, analyze_route, submit_signal_report
- **Resource reading:** Fetches recent-reports and other resources

## Protocol Details

The server uses the **Model Context Protocol (MCP)** specification:

### Request Format
```json
{
  "method": "tools/list",
  "params": {}
}
```

### Response Format
```json
{
  "tools": [
    {
      "name": "analyze_point",
      "description": "...",
      "inputSchema": { ... }
    }
  ]
}
```

### Supported Methods
- `tools/list` - List available tools
- `tools/call` - Execute a tool
- `resources/list` - List available resources
- `resources/read` - Read a resource by URI

## Performance Notes

- **Point analysis:** ~100-500ms depending on tower density and database state
- **Route analysis:** ~500ms-2s depending on route length and tower density
- **Caching:** 15-minute TTL on analysis results prevents redundant work
- **Database:** SQLite with bbox indexes for fast spatial queries

## Limitations

- Tower data is updated periodically (not real-time)
- User reports are crowdsourced and may have varying accuracy
- Anomaly detection is heuristic-based (low confidence or report conflicts)
- Coverage predictions are based on tower proximity and user feedback, not actual propagation modeling

## Development

### Adding New Tools

1. Edit `tools.py` to define the tool schema
2. Edit `server.py` to implement the tool handler in `handle_call_tool()`
3. Update tests in `test_mcp_server.py` to verify the new tool

### Adding New Resources

1. Edit `resources.py` to define the resource schema
2. Edit `server.py` to implement the resource handler in `handle_read_resource()`
3. Update tests to verify resource reading

## License

Part of the SignalPH project.
