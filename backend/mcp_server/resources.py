from __future__ import annotations
from typing import Any

RESOURCES = [
    {
        "uri": "signal://recent-reports",
        "name": "Recent Signal Reports",
        "description": "Retrieves the latest crowdsourced signal quality reports submitted by users. Useful for understanding recent service issues and user experiences across all providers and locations.",
        "mimeType": "application/json"
    },
    {
        "uri": "signal://reports/near-point/{latitude}/{longitude}/{radius_km}",
        "name": "Reports Near Point",
        "description": "Retrieves signal quality reports submitted by other users near a specific geographic point. Helps the agent understand community feedback about a location's coverage.",
        "mimeType": "application/json"
    },
    {
        "uri": "signal://towers/near-point/{latitude}/{longitude}/{radius_km}",
        "name": "Towers Near Point",
        "description": "Retrieves cell tower information near a specific location, including tower ID, provider, radio type (4G/5G), and estimated coverage range. Useful for understanding infrastructure around a location.",
        "mimeType": "application/json"
    },
    {
        "uri": "signal://anomalies/recent",
        "name": "Recent Anomalies",
        "description": "Retrieves recent analysis anomalies - cases where predicted signal scores conflicted with user-reported experiences or confidence was low. Useful for identifying areas with unreliable predictions.",
        "mimeType": "application/json"
    }
]
