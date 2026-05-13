/**
 * Example API Test Component
 * Demonstrates how to use the Signal PH API from the frontend
 */

import { useState } from 'react';
import {
  analyzeSignalLocation,
  getNearbyTowers,
  getNearbyReports,
  submitSignalReport,
  getApiBaseUrl,
  type SignalAnalysisResponse,
  type NearbyTowersResponse,
  type SignalReport,
} from '../lib/api';
import { useApi } from '../lib/useApi';

export default function ApiTestComponent() {
  const [latitude, setLatitude] = useState('14.5995');
  const [longitude, setLongitude] = useState('120.9842');
  const [activeTab, setActiveTab] = useState<'analyze' | 'towers' | 'reports'>('analyze');

  // API call hooks
  const analyzeApi = useApi(() =>
    analyzeSignalLocation({ latitude: parseFloat(latitude), longitude: parseFloat(longitude) })
  );

  const towersApi = useApi(() =>
    getNearbyTowers(parseFloat(latitude), parseFloat(longitude))
  );

  const reportsApi = useApi(() =>
    getNearbyReports(parseFloat(latitude), parseFloat(longitude))
  );

  const handleAnalyzeSignal = async () => {
    try {
      await analyzeApi.execute();
    } catch (error) {
      console.error('Error analyzing signal:', error);
    }
  };

  const handleGetTowers = async () => {
    try {
      await towersApi.execute();
    } catch (error) {
      console.error('Error fetching towers:', error);
    }
  };

  const handleGetReports = async () => {
    try {
      await reportsApi.execute();
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleSubmitReport = async () => {
    try {
      const result = await submitSignalReport({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        signal_strength: -80,
        network_type: '4G',
        provider: 'Globe',
      });
      console.log('Report submitted:', result);
      alert('Report submitted successfully!');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <h1 className="text-2xl font-bold">Signal PH API Test</h1>
          <p className="text-sm mt-1">Backend URL: {getApiBaseUrl()}</p>
        </div>

        <div className="p-6">
          {/* Location Input */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="font-bold text-lg mb-3">Test Location</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="14.5995"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="120.9842"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Current: {latitude}, {longitude}</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            {(['analyze', 'towers', 'reports'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Analyze Signal Tab */}
          {activeTab === 'analyze' && (
            <div>
              <button
                onClick={handleAnalyzeSignal}
                disabled={analyzeApi.loading}
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {analyzeApi.loading ? 'Loading...' : 'Analyze Signal'}
              </button>
              {analyzeApi.error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
                  Error: {analyzeApi.error.message}
                </div>
              )}
              {analyzeApi.data && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Analysis Result</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Location:</strong>{' '}
                      {(analyzeApi.data as SignalAnalysisResponse).location_lat.toFixed(4)},{' '}
                      {(analyzeApi.data as SignalAnalysisResponse).location_lng.toFixed(4)}
                    </p>
                    <p>
                      <strong>Composite score:</strong>{' '}
                      {(analyzeApi.data as SignalAnalysisResponse).signal_score.toFixed(1)}
                    </p>
                    <p>
                      <strong>Towers in search area:</strong>{' '}
                      {(analyzeApi.data as SignalAnalysisResponse).nearby_towers}
                    </p>
                    <p>
                      <strong>Reports in 1 km:</strong>{' '}
                      {(analyzeApi.data as SignalAnalysisResponse).recent_reports}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Towers Tab */}
          {activeTab === 'towers' && (
            <div>
              <button
                onClick={handleGetTowers}
                disabled={towersApi.loading}
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {towersApi.loading ? 'Loading...' : 'Get Nearby Towers'}
              </button>
              {towersApi.error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
                  Error: {towersApi.error.message}
                </div>
              )}
              {towersApi.data && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">
                    Found {(towersApi.data as NearbyTowersResponse).towers.length} Towers
                  </h3>
                  <div className="space-y-2">
                    {(towersApi.data as NearbyTowersResponse).towers.slice(0, 5).map((tower, idx) => (
                      <div key={idx} className="text-sm p-2 bg-white rounded border">
                        <p>
                          <strong>{tower.provider}</strong> - {tower.distance_km?.toFixed(2)} km away
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleGetReports}
                  disabled={reportsApi.loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {reportsApi.loading ? 'Loading...' : 'Get Nearby Reports'}
                </button>
                <button
                  onClick={handleSubmitReport}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Submit Test Report
                </button>
              </div>
              {reportsApi.error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
                  Error: {reportsApi.error.message}
                </div>
              )}
              {reportsApi.data && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">
                    Found {(reportsApi.data as SignalReport[]).length} Reports
                  </h3>
                  <div className="space-y-2">
                    {(reportsApi.data as SignalReport[]).slice(0, 5).map((report, idx) => (
                      <div key={idx} className="text-sm p-2 bg-white rounded border">
                        <p>
                          <strong>{report.provider}</strong> ({report.network_type}) -{' '}
                          {report.signal_strength} dBm
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
