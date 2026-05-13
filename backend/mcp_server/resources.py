from __future__ import annotations

RESOURCES = [
    {
        "uri": "signal://recent-reports",
        "name": "Recent Signal Reports",
        "description": (
            "Retrieves the latest crowdsourced signal quality reports submitted by users. "
            "Useful for understanding recent service issues and user experiences across providers."
        ),
        "mimeType": "application/json",
    },
    {
        "uri": "signal://reports/near-point/{latitude}/{longitude}/{radius_km}",
        "name": "Reports Near Point",
        "description": (
            "Retrieves crowdsourced signal quality reports near a specific geographic point. "
            "Useful when the agent needs community feedback near the selected location."
        ),
        "mimeType": "application/json",
    },
    {
        "uri": "signal://towers/near-point/{latitude}/{longitude}/{radius_km}",
        "name": "Towers Near Point",
        "description": (
            "Retrieves raw cell tower records near a specific location. "
            "This is an agent/backend evidence resource, not the final user-facing map layer. "
            "Use analyze_point or analyze_route when the agent needs scored closest tower matches, "
            "provider scores, weak segments, and recommendation output."
        ),
        "mimeType": "application/json",
    },
    {
        "uri": "signal://anomalies/recent",
        "name": "Recent Anomalies",
        "description": (
            "Retrieves recent analysis anomalies where predictions conflicted with user reports "
            "or confidence was low."
        ),
        "mimeType": "application/json",
    },
    {
        "uri": "signal://anomalies/near-point/{latitude}/{longitude}/{radius_km}",
        "name": "Anomalies Near Point",
        "description": (
            "Retrieves anomaly logs near a specific geographic point. "
            "Useful when the agent needs to explain unreliable, suspicious, or conflicting signal predictions."
        ),
        "mimeType": "application/json",
    },
]