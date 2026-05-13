#!/usr/bin/env python3
"""Comprehensive backend API test suite"""
import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(name, method, url, expected_status=200):
    """Test a single endpoint"""
    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, json={}, timeout=5)
        
        status = "✅" if response.status_code == expected_status else "❌"
        print(f"{status} {name}: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, dict):
                    keys = list(data.keys())[:3]
                    print(f"   Response keys: {keys}")
            except:
                pass
        return response.status_code == expected_status
    except Exception as e:
        print(f"❌ {name}: ERROR - {str(e)}")
        return False

print("=" * 60)
print("Signal PH Backend API Test Suite")
print("=" * 60)
print(f"Timestamp: {datetime.now().isoformat()}\n")

results = {}

# Basic endpoints
print("Basic Endpoints:")
results['root'] = test_endpoint("GET /", "GET", f"{BASE_URL}/")
results['health'] = test_endpoint("GET /health", "GET", f"{BASE_URL}/health")
results['info'] = test_endpoint("GET /info", "GET", f"{BASE_URL}/info")

print("\nAPI Endpoints (merged from branches):")
results['towers'] = test_endpoint("GET /api/towers/nearby", "GET", 
    f"{BASE_URL}/api/towers/nearby?latitude=14.6091&longitude=121.0223&radius_km=5&limit=5")
results['signals'] = test_endpoint("GET /api/signals/analyze", "GET",
    f"{BASE_URL}/api/signals/analyze?latitude=14.6091&longitude=121.0223&radius_km=5")
results['reports'] = test_endpoint("GET /api/reports/nearby", "GET",
    f"{BASE_URL}/api/reports/nearby?latitude=14.6091&longitude=121.0223&radius_km=1")

print("\nAdvanced Endpoints (from route_service):")
results['point_analyze'] = test_endpoint("POST /analyze/point", "POST", f"{BASE_URL}/analyze/point")
results['route_analyze'] = test_endpoint("POST /analyze/route", "POST", f"{BASE_URL}/analyze/route")

print("\nDocumentation:")
results['docs'] = test_endpoint("GET /docs (Swagger UI)", "GET", f"{BASE_URL}/docs")
results['redoc'] = test_endpoint("GET /redoc", "GET", f"{BASE_URL}/redoc")

print("\n" + "=" * 60)
print("Summary:")
passed = sum(1 for v in results.values() if v)
total = len(results)
print(f"Passed: {passed}/{total}")
print("=" * 60)

if passed == total:
    print("✅ All endpoints working!")
elif passed >= total * 0.8:
    print("⚠️  Most endpoints working, some issues detected")
else:
    print("❌ Multiple endpoint failures detected")

# Save results
with open('backend_test_results.json', 'w') as f:
    json.dump({
        'timestamp': datetime.now().isoformat(),
        'base_url': BASE_URL,
        'results': results,
        'summary': f"{passed}/{total} passed"
    }, f, indent=2)

print("\nResults saved to backend_test_results.json")
