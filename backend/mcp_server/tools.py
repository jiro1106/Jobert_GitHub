from __future__ import annotations
from typing import Any

TOOLS = [
    {
        "name": "analyze_point",
        "description": "Analyzes cellular signal coverage at a single geographic point. Returns coverage scores for all providers (Globe, Smart, DITO) at that location, recommends the best provider, and provides detailed explanation including nearby tower information and offline readiness alerts.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "latitude": {
                    "type": "number",
                    "description": "Latitude of the point to analyze (e.g., 14.5994 for Manila)"
                },
                "longitude": {
                    "type": "number",
                    "description": "Longitude of the point to analyze (e.g., 120.9842 for Manila)"
                },
                "radius_km": {
                    "type": "number",
                    "description": "Search radius in kilometers for nearby towers (default: 5.0, range: 0.1-50.0)",
                    "default": 5.0
                }
            },
            "required": ["latitude", "longitude"]
        }
    },
    {
        "name": "analyze_route",
        "description": "Analyzes cellular signal coverage along a route between two locations. Evaluates coverage for every point along the path, identifies weak signal segments, provides per-provider scores across the route, and recommends the best provider for travel.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "origin": {
                    "type": "object",
                    "description": "Starting point of the route",
                    "properties": {
                        "latitude": {"type": "number", "description": "Origin latitude"},
                        "longitude": {"type": "number", "description": "Origin longitude"},
                        "name": {"type": "string", "description": "Optional origin name (e.g., 'Manila City Hall')"}
                    },
                    "required": ["latitude", "longitude"]
                },
                "destination": {
                    "type": "object",
                    "description": "Ending point of the route",
                    "properties": {
                        "latitude": {"type": "number", "description": "Destination latitude"},
                        "longitude": {"type": "number", "description": "Destination longitude"},
                        "name": {"type": "string", "description": "Optional destination name"}
                    },
                    "required": ["latitude", "longitude"]
                },
                "route_points": {
                    "type": "array",
                    "description": "Optional array of waypoints to follow (if not provided, will use OSRM routing)",
                    "items": {
                        "type": "object",
                        "properties": {
                            "latitude": {"type": "number"},
                            "longitude": {"type": "number"}
                        },
                        "required": ["latitude", "longitude"]
                    }
                },
                "radius_km": {
                    "type": "number",
                    "description": "Search radius around route for towers (default: 5.0, range: 0.1-50.0)",
                    "default": 5.0
                }
            },
            "required": ["origin", "destination"]
        }
    },
    {
        "name": "submit_signal_report",
        "description": "Submits a crowdsourced signal quality report for a specific location and provider. This helps build a community dataset of actual user experiences and improves recommendations over time.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "latitude": {
                    "type": "number",
                    "description": "Latitude where signal was experienced"
                },
                "longitude": {
                    "type": "number",
                    "description": "Longitude where signal was experienced"
                },
                "provider_name": {
                    "type": "string",
                    "description": "Provider name (Globe, Smart, DITO, or other)",
                    "enum": ["Globe", "Smart", "DITO", "Other"]
                },
                "signal_feedback": {
                    "type": "string",
                    "description": "Signal quality feedback (e.g., 'excellent', 'good', 'poor', 'no signal')"
                },
                "speed_feedback": {
                    "type": "string",
                    "description": "Data speed feedback (e.g., 'fast', 'slow', 'unstable')"
                },
                "issue_type": {
                    "type": "string",
                    "description": "Type of issue if applicable (e.g., 'no_signal', 'slow_data', 'dropped_calls', 'interference')"
                },
                "user_notes": {
                    "type": "string",
                    "description": "Additional user notes or context about the signal experience"
                }
            },
            "required": ["latitude", "longitude", "provider_name"]
        }
    }
]
