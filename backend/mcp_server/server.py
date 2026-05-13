from __future__ import annotations

import json
import sys
from typing import Any

from ..db.anomaly_repository import get_anomalies_near_point, get_recent_anomalies
from ..db.report_repository import (
    get_recent_reports,
    get_reports_near_point,
    insert_report,
)
from ..db.tower_repository import get_towers_near_point
from ..services.route_service import analyze_point, analyze_route
from .resources import RESOURCES
from .tools import TOOLS


class MCPServer:
    # handles MCP protocol: tools/list, tools/call, resources/list, resources/read

    def __init__(self):
        self.tools = TOOLS
        self.resources = RESOURCES

    def handle_list_tools(self) -> dict[str, Any]:
        return {
            "tools": self.tools
        }

    def handle_list_resources(self) -> dict[str, Any]:
        return {
            "resources": self.resources
        }

    def handle_call_tool(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        # execute tool and return json response
        try:
            if name == "analyze_point":
                result = analyze_point(
                    latitude=arguments["latitude"],
                    longitude=arguments["longitude"],
                    radius_km=arguments.get("radius_km", 5.0)
                )
                return {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(result, indent=2)
                        }
                    ]
                }

            elif name == "analyze_route":
                route_points = None
                if "route_points" in arguments and arguments["route_points"]:
                    route_points = [
                        {
                            "latitude": p["latitude"],
                            "longitude": p["longitude"]
                        }
                        for p in arguments["route_points"]
                    ]

                result = analyze_route(
                    origin={
                        "latitude": arguments["origin"]["latitude"],
                        "longitude": arguments["origin"]["longitude"],
                        "name": arguments["origin"].get("name", "Origin")
                    },
                    destination={
                        "latitude": arguments["destination"]["latitude"],
                        "longitude": arguments["destination"]["longitude"],
                        "name": arguments["destination"].get("name", "Destination")
                    },
                    route_points=route_points,
                    radius_km=arguments.get("radius_km", 5.0)
                )
                return {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(result, indent=2)
                        }
                    ]
                }

            elif name == "submit_signal_report":
                report_id = insert_report({
                    "latitude": arguments["latitude"],
                    "longitude": arguments["longitude"],
                    "provider_name": arguments.get("provider_name"),
                    "signal_feedback": arguments.get("signal_feedback"),
                    "speed_feedback": arguments.get("speed_feedback"),
                    "issue_type": arguments.get("issue_type"),
                    "user_notes": arguments.get("user_notes"),
                    "source_type": "agent_submission"
                })
                return {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps({
                                "status": "saved",
                                "report_id": report_id,
                                "message": f"Signal report #{report_id} submitted successfully."
                            }, indent=2)
                        }
                    ]
                }

            else:
                return {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps({"error": f"Unknown tool: {name}"})
                        }
                    ]
                }

        except Exception as e:
            return {
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps({"error": str(e)})
                    }
                ]
            }

    def handle_read_resource(self, uri: str) -> dict[str, Any]:
        # fetch resource by uri
        try:
            if uri == "signal://recent-reports":
                reports = get_recent_reports(limit=20)
                return {
                    "contents": [
                        {
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": json.dumps(reports, indent=2)
                        }
                    ]
                }

            elif uri.startswith("signal://reports/near-point/"):
                parts = uri.replace("signal://reports/near-point/", "").split("/")
                if len(parts) >= 3:
                    latitude = float(parts[0])
                    longitude = float(parts[1])
                    radius_km = float(parts[2])
                    reports = get_reports_near_point(latitude, longitude, radius_km)
                    return {
                        "contents": [
                            {
                                "uri": uri,
                                "mimeType": "application/json",
                                "text": json.dumps(reports, indent=2)
                            }
                        ]
                    }

            elif uri.startswith("signal://towers/near-point/"):
                parts = uri.replace("signal://towers/near-point/", "").split("/")
                if len(parts) >= 3:
                    latitude = float(parts[0])
                    longitude = float(parts[1])
                    radius_km = float(parts[2])
                    towers = get_towers_near_point(latitude, longitude, radius_km)
                    return {
                        "contents": [
                            {
                                "uri": uri,
                                "mimeType": "application/json",
                                "text": json.dumps(towers, indent=2)
                            }
                        ]
                    }

            elif uri == "signal://anomalies/recent":
                anomalies = get_recent_anomalies(limit=20)
                return {
                    "contents": [
                        {
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": json.dumps(anomalies, indent=2)
                        }
                    ]
                }

            elif uri.startswith("signal://anomalies/near-point/"):
                parts = uri.replace("signal://anomalies/near-point/", "").split("/")
                if len(parts) >= 3:
                    latitude = float(parts[0])
                    longitude = float(parts[1])
                    radius_km = float(parts[2])
                    anomalies = get_anomalies_near_point(latitude, longitude, radius_km)
                    return {
                        "contents": [
                            {
                                "uri": uri,
                                "mimeType": "application/json",
                                "text": json.dumps(anomalies, indent=2)
                            }
                        ]
                    }

            else:
                return {
                    "contents": [
                        {
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": json.dumps({"error": f"Unknown resource: {uri}"})
                        }
                    ]
                }

        except Exception as e:
            return {
                "contents": [
                    {
                        "uri": uri,
                        "mimeType": "application/json",
                        "text": json.dumps({"error": str(e)})
                    }
                ]
            }

    def handle_request(self, request: dict[str, Any]) -> dict[str, Any]:
        # route mcp requests to handlers
        method = request.get("method")

        if method == "tools/list":
            return self.handle_list_tools()
        elif method == "tools/call":
            return self.handle_call_tool(
                request["params"]["name"],
                request["params"]["arguments"]
            )
        elif method == "resources/list":
            return self.handle_list_resources()
        elif method == "resources/read":
            return self.handle_read_resource(request["params"]["uri"])
        else:
            return {"error": f"Unknown method: {method}"}

    def run(self):
        # stdio mcp server loop
        while True:
            try:
                line = input()
                if not line:
                    continue

                request = json.loads(line)
                response = self.handle_request(request)
                print(json.dumps(response))
                sys.stdout.flush()

            except EOFError:
                break
            except Exception as e:
                print(json.dumps({"error": str(e)}), file=sys.stderr)
                sys.stderr.flush()


def main():
    # entry point
    server = MCPServer()
    server.run()


if __name__ == "__main__":
    main()
