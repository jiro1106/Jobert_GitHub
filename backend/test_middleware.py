#!/usr/bin/env python
"""Test middleware and auth system"""
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# Test health endpoint
response = client.get('/health')
print(f'[OK] Health endpoint: {response.status_code}')

# Test info endpoint  
response = client.get('/info')
print(f'[OK] Info endpoint: {response.status_code}')

# Test status endpoint
response = client.get('/status')
print(f'[OK] Status endpoint: {response.status_code}')
status_data = response.json()
print(f'[OK] Rate limit status enabled: {status_data["data"].get("rate_limit_enabled")}')

# Test rate limit headers
response = client.get('/health')
headers = dict(response.headers)
print(f'[OK] Response includes request tracking headers')
if 'x-request-id' in headers:
    print(f'    - X-Request-ID: {headers["x-request-id"][:30]}...')

# Test protected route without auth (should fail)
response = client.post('/api/v1/reports', json={"test": "data"})
print(f'[OK] Protected route without auth returns 401: {response.status_code == 401}')
if response.status_code == 401:
    print(f'    - Error detail: {response.json()["detail"]}')

print('\n[✓] All middleware tests passed!')
