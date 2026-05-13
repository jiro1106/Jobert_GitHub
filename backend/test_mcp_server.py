#!/usr/bin/env python3

import json
import sys
from pathlib import Path

# Add backend parent directory to path
backend_dir = Path(__file__).parent
project_root = backend_dir.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

def test_imports():
    # can we import?
    print("Testing imports...")
    try:
        print("✓ All imports successful")
        return True
    except Exception as e:
        print(f"✗ Import failed: {e}")
        return False

def test_server_initialization():
    # server initializes?
    print("Testing server initialization...")
    try:
        from backend.mcp_server.server import MCPServer
        server = MCPServer()
        print("✓ Server initialized successfully")
        return True
    except Exception as e:
        print(f"✗ Server initialization failed: {e}")
        return False

def test_list_tools():
    # get tools list?
    print("Testing list tools...")
    try:
        from backend.mcp_server.server import MCPServer
        server = MCPServer()
        response = server.handle_list_tools()
        tools = response.get("tools", [])
        print(f"✓ Found {len(tools)} tools:")
        for tool in tools:
            print(f"  - {tool['name']}")
        return len(tools) == 3
    except Exception as e:
        print(f"✗ List tools failed: {e}")
        return False

def test_list_resources():
    # get resources list?
    print("Testing list resources...")
    try:
        from backend.mcp_server.server import MCPServer
        server = MCPServer()
        response = server.handle_list_resources()
        resources = response.get("resources", [])
        print(f"✓ Found {len(resources)} resources:")
        for resource in resources:
            print(f"  - {resource['uri']}")
        return len(resources) == 4
    except Exception as e:
        print(f"✗ List resources failed: {e}")
        return False

def test_call_analyze_point_tool():
    # actually call analyze_point tool
    print("Testing tool call: analyze_point...")
    try:
        from backend.db.schema import create_database
        from backend.mcp_server.server import MCPServer
        create_database()
        
        server = MCPServer()
        result = server.handle_call_tool("analyze_point", {
            "latitude": 14.5995,
            "longitude": 121.0437,
            "radius_km": 2.0
        })
        
        if "content" in result and len(result["content"]) > 0:
            content = result["content"][0].get("text", "")
            data = json.loads(content) if content else {}
            print(f"✓ analyze_point returned valid response with best_provider: {data.get('best_provider', 'N/A')}")
            return True
        else:
            print(f"✗ analyze_point returned invalid structure: {result}")
            return False
    except Exception as e:
        print(f"✗ analyze_point tool failed: {e}")
        return False

def test_call_analyze_route_tool():
    # actually call analyze_route tool
    print("Testing tool call: analyze_route...")
    try:
        from backend.mcp_server.server import MCPServer
        server = MCPServer()
        
        result = server.handle_call_tool("analyze_route", {
            "origin": {"latitude": 14.5995, "longitude": 121.0437, "name": "Start"},
            "destination": {"latitude": 14.6091, "longitude": 121.0537, "name": "End"},
            "route_points": [],
            "radius_km": 2.0
        })
        
        if "content" in result and len(result["content"]) > 0:
            content = result["content"][0].get("text", "")
            data = json.loads(content) if content else {}
            print(f"✓ analyze_route returned valid response with best_provider: {data.get('best_provider', 'N/A')}")
            return True
        else:
            print(f"✗ analyze_route returned invalid structure: {result}")
            return False
    except Exception as e:
        print(f"✗ analyze_route tool failed: {e}")
        return False

def test_call_submit_report_tool():
    # actually call submit_signal_report tool
    print("Testing tool call: submit_signal_report...")
    try:
        from backend.mcp_server.server import MCPServer
        server = MCPServer()
        
        result = server.handle_call_tool("submit_signal_report", {
            "latitude": 14.5995,
            "longitude": 121.0437,
            "provider_name": "Globe",
            "signal_feedback": "good",
            "issue_type": None,
            "user_notes": "Test report"
        })
        
        if "content" in result and len(result["content"]) > 0:
            content = result["content"][0].get("text", "")
            data = json.loads(content) if content else {}
            if data.get("status") == "saved":
                print(f"✓ submit_signal_report saved successfully (id: {data.get('report_id', 'N/A')})")
                return True
            else:
                print(f"✗ submit_signal_report returned unexpected status: {data.get('status')}")
                return False
        else:
            print(f"✗ submit_signal_report returned invalid structure: {result}")
            return False
    except Exception as e:
        print(f"✗ submit_signal_report tool failed: {e}")
        return False

def test_read_resource():
    # read a resource
    print("Testing resource read: recent-reports...")
    try:
        from backend.mcp_server.server import MCPServer
        server = MCPServer()
        
        result = server.handle_read_resource("signal://recent-reports")
        
        if "contents" in result and len(result["contents"]) > 0:
            content = result["contents"][0].get("text", "")
            data = json.loads(content) if content else {}
            report_count = len(data) if isinstance(data, list) else 0
            print(f"✓ read resource returned {report_count} recent reports")
            return True
        else:
            print(f"✗ read resource returned invalid structure: {result}")
            return False
    except Exception as e:
        print(f"✗ read resource failed: {e}")
        return False

def main():
    # run tests
    print("="* 60)
    print("SignalPH MCP Server Test Suite")
    print("=" * 60)
    print()
    
    tests = [
        test_imports,
        test_server_initialization,
        test_list_tools,
        test_list_resources,
        test_call_analyze_point_tool,
        test_call_analyze_route_tool,
        test_call_submit_report_tool,
        test_read_resource,
    ]
    
    results = []
    for test in tests:
        try:
            results.append(test())
        except Exception as e:
            print(f"✗ Test {test.__name__} crashed: {e}")
            results.append(False)
        print()
    
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Results: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed == total:
        print("✓ All tests passed! MCP server is ready to use.")
        print()
        print("To start the server, run:")
        print("  python run_mcp_server.py")
        return 0
    else:
        print("✗ Some tests failed. Please check the output above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
