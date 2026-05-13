from __future__ import annotations

TOOLS = [
    {
        "name": "analyze_point",
        "description": (
            "Analyzes cellular signal coverage at a single geographic point. "
            "The backend builds a bounding box around the selected point, retrieves candidate towers, "
            "calculates point-to-tower haversine distances, selects closest tower matches, "
            "checks whether the point falls within each tower's estimated range, computes provider scores, "
            "and returns the best provider, provider_scores, closest_towers, weak_segments, "
            "nearby_reports_summary, recommendation_text, explanation_text, and offline_readiness_alerts."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "latitude": {
                    "type": "number",
                    "description": "Latitude of the point to analyze. Example: 14.6175",
                },
                "longitude": {
                    "type": "number",
                    "description": "Longitude of the point to analyze. Example: 120.9900",
                },
                "radius_km": {
                    "type": "number",
                    "description": (
                        "Search radius in kilometers for candidate towers and nearby reports. "
                        "Default is 5.0."
                    ),
                    "default": 5.0,
                },
            },
            "required": ["latitude", "longitude"],
        },
    },
    {
        "name": "analyze_route",
        "description": (
            "Analyzes cellular signal coverage along a route between two locations. "
            "If route_points are provided, the backend evaluates those points directly. "
            "If route_points are not provided, the backend attempts to generate route geometry using OSRM. "
            "The backend builds one bounding box around the full route, retrieves candidate towers, "
            "then evaluates closest tower matches per route point. "
            "The same tower may appear multiple times if it is relevant to multiple route points. "
            "Use closest_towers as raw per-point evidence. Deduplicate separately only for map display."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "origin": {
                    "type": "object",
                    "description": "Starting point of the route.",
                    "properties": {
                        "latitude": {
                            "type": "number",
                            "description": "Origin latitude.",
                        },
                        "longitude": {
                            "type": "number",
                            "description": "Origin longitude.",
                        },
                        "name": {
                            "type": "string",
                            "description": "Optional origin name. Example: UST Espana.",
                        },
                    },
                    "required": ["latitude", "longitude"],
                },
                "destination": {
                    "type": "object",
                    "description": "Ending point of the route.",
                    "properties": {
                        "latitude": {
                            "type": "number",
                            "description": "Destination latitude.",
                        },
                        "longitude": {
                            "type": "number",
                            "description": "Destination longitude.",
                        },
                        "name": {
                            "type": "string",
                            "description": "Optional destination name. Example: SM Mall of Asia.",
                        },
                    },
                    "required": ["latitude", "longitude"],
                },
                "route_points": {
                    "type": "array",
                    "description": (
                        "Optional array of route coordinates. "
                        "If provided, these points are evaluated directly. "
                        "If not provided, the backend uses OSRM routing from origin to destination."
                    ),
                    "items": {
                        "type": "object",
                        "properties": {
                            "latitude": {
                                "type": "number",
                                "description": "Route point latitude.",
                            },
                            "longitude": {
                                "type": "number",
                                "description": "Route point longitude.",
                            },
                        },
                        "required": ["latitude", "longitude"],
                    },
                },
                "radius_km": {
                    "type": "number",
                    "description": (
                        "Search radius in kilometers around the route for candidate towers and reports. "
                        "Default is 5.0."
                    ),
                    "default": 5.0,
                },
            },
            "required": ["origin", "destination"],
        },
    },
    {
        "name": "submit_signal_report",
        "description": (
            "Submits a crowdsourced signal quality report for a specific location and provider. "
            "This helps build a community dataset of actual user experiences and can influence "
            "future recommendations through report adjustments and anomaly detection."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "latitude": {
                    "type": "number",
                    "description": "Latitude where the signal experience occurred.",
                },
                "longitude": {
                    "type": "number",
                    "description": "Longitude where the signal experience occurred.",
                },
                "provider_name": {
                    "type": "string",
                    "description": "Provider name.",
                    "enum": ["Globe", "Smart", "DITO", "Other"],
                },
                "signal_feedback": {
                    "type": "string",
                    "description": "Signal quality feedback. Example: excellent, good, poor, no signal.",
                },
                "speed_feedback": {
                    "type": "string",
                    "description": "Data speed feedback. Example: fast, slow, unstable.",
                },
                "issue_type": {
                    "type": "string",
                    "description": (
                        "Issue type if applicable. Example: no_signal, slow_data, dropped_calls, interference."
                    ),
                },
                "user_notes": {
                    "type": "string",
                    "description": "Additional user notes or context about the signal experience.",
                },
            },
            "required": ["latitude", "longitude", "provider_name"],
        },
    },
]