# SignalPH MCP Server

A Model Context Protocol (MCP) server that exposes cellular signal analysis tools and database resources to AI agents.

## Overview

The SignalPH MCP Server allows AI agents to:
- Analyze signal coverage at specific geographic points
- Analyze signal coverage along routes
- Submit crowdsourced signal quality reports
- Query recent reports, towers, and anomalies

## Quick Start

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run the Server

```bash
python run_mcp_server.py
```

The server will start in stdio mode, ready to receive MCP requests.

## Available Tools

### 1. analyze_point
Analyzes cellular signal coverage at a single geographic point.

**Parameters:**
- `latitude` (number, required): Latitude of the point
- `longitude` (number, required): Longitude of the point
- `radius_km` (number, optional): Search radius in kilometers (default: 5.0, range: 0.1-50.0)

**Returns:**
- Best provider recommendation
- Per-provider coverage scores (0-100)
- Closest towers and distances
- Offline readiness alerts
- Explanation text

**Example:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "analyze_point",
    "arguments": {
      "latitude": 14.5994,
      "longitude": 120.9842,
      "radius_km": 5.0
    }
  }
}
```

### 2. analyze_route
Analyzes cellular signal coverage along a route between two locations.

**Parameters:**
- `origin` (object, required): Starting point with latitude, longitude, and optional name
- `destination` (object, required): Ending point with latitude, longitude, and optional name
- `route_points` (array, optional): Array of waypoints (if not provided, uses OSRM routing)
- `radius_km` (number, optional): Search radius around route (default: 5.0)

**Returns:**
- Per-provider scores across the route
- Weak signal segments (locations with poor coverage)
- Route context and waypoints
- Recommendations and explanations

**Example:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "analyze_route",
    "arguments": {
      "origin": {
        "latitude": 14.5994,
        "longitude": 120.9842,
        "name": "Manila"
      },
      "destination": {
        "latitude": 13.1939,
        "longitude": 123.7437,
        "name": "Tagaytay"
      },
      "radius_km": 5.0
    }
  }
}
```

### 3. submit_signal_report
Submits a crowdsourced signal quality report for a specific location and provider.

**Parameters:**
- `latitude` (number, required): Latitude where signal was experienced
- `longitude` (number, required): Longitude where signal was experienced
- `provider_name` (string, required): Provider name (Globe, Smart, DITO, Other)
- `signal_feedback` (string, optional): Signal quality (excellent, good, poor, no signal)
- `speed_feedback` (string, optional): Data speed feedback (fast, slow, unstable)
- `issue_type` (string, optional): Issue type (no_signal, slow_data, dropped_calls, interference)
- `user_notes` (string, optional): Additional context

**Example:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "submit_signal_report",
    "arguments": {
      "latitude": 14.5994,
      "longitude": 120.9842,
      "provider_name": "Globe",
      "signal_feedback": "excellent",
      "speed_feedback": "fast",
      "user_notes": "Great coverage in this area"
    }
  }
}
```

## Available Resources

### 1. signal://recent-reports
Latest crowdsourced signal quality reports (limit: 20)

**Example:**
```json
{
  "method": "resources/read",
  "params": {
    "uri": "signal://recent-reports"
  }
}
```

### 2. signal://reports/near-point/{latitude}/{longitude}/{radius_km}
Signal reports near a specific location

**Example:**
```json
{
  "method": "resources/read",
  "params": {
    "uri": "signal://reports/near-point/14.5994/120.9842/5.0"
  }
}
```

### 3. signal://towers/near-point/{latitude}/{longitude}/{radius_km}
Cell tower infrastructure near a specific location

**Example:**
```json
{
  "method": "resources/read",
  "params": {
    "uri": "signal://towers/near-point/14.5994/120.9842/5.0"
  }
}
```

### 4. signal://anomalies/recent
Recent analysis anomalies (predictions that conflicted with user reports)

**Example:**
```json
{
  "method": "resources/read",
  "params": {
    "uri": "signal://anomalies/recent"
  }
}
```

## Protocol Methods

### List Available Tools
```json
{
  "method": "tools/list"
}
```

### Call a Tool
```json
{
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": { /* tool arguments */ }
  }
}
```

### List Available Resources
```json
{
  "method": "resources/list"
}
```

### Read a Resource
```json
{
  "method": "resources/read",
  "params": {
    "uri": "resource://uri"
  }
}
```

## Response Format

All responses follow the MCP protocol:

### Success Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "JSON result data"
    }
  ]
}
```

### Error Response
```json
{
  "error": "Error description"
}
```

## Architecture

- **Tools Layer**: High-level analysis functions (`analyze_point`, `analyze_route`, `submit_signal_report`)
- **Resources Layer**: Database queries and data access (`reports`, `towers`, `anomalies`)
- **Server Layer**: MCP protocol handling and request routing
- **Service Layer**: Signal analysis logic and scoring
- **Database Layer**: SQLite persistence for towers, reports, and anomalies

## Database

The server uses SQLite with three main tables:
- `cell_towers`: Tower locations and metadata
- `crowdsourced_reports`: User-submitted signal feedback
- `anomaly_logs`: Flagged analysis results for investigation

## Integration with AI Agents

To integrate this MCP server with an AI agent:

1. Start the server: `python run_mcp_server.py`
2. Configure your AI agent to connect to stdin/stdout of this process
3. The agent can now call any of the three tools or read any resources
4. All results are returned as formatted JSON for easy parsing

## Example Agent Conversation

```
User: "Check signal coverage in Makati"
  ↓
Agent calls: analyze_point(14.5500, 121.0200, radius_km=5)
  ↓
Server returns: {
  "best_provider": "Globe",
  "provider_scores": {"Globe": 82.5, "Smart": 71.2, "DITO": 45.8},
  ...
}
  ↓
Agent responds: "Globe has the best coverage in Makati with a score of 82.5/100.
  Smart is a close second at 71.2. The nearest tower is about 800m away."
```

## Configuration

### Increasing Search Radius

By default, the analysis uses a 5km search radius. To expand coverage area analysis, increase `radius_km` up to 50km.

### Customizing Responses

The service layer can be extended to customize scoring, weak segment detection, and recommendations.

## Troubleshooting

**No towers found in area**: Ensure tower CSV data has been imported via the REST API

**Reports not showing**: Check that reports were submitted with `POST /reports`

**Anomalies not detected**: Anomalies are logged when predictions conflict with reports or confidence is low

## Next Steps

1. Import tower data via the FastAPI `/admin/towers` endpoint
2. Submit signal reports using `/reports` endpoint or `submit_signal_report` tool
3. Monitor anomalies to identify areas needing investigation
4. Integrate with AI agents for conversational coverage analysis
