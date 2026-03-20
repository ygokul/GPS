import { useState, useEffect } from 'react';
import { getApiKey, setApiKey } from '../services/api';
import { FiSave, FiAlertCircle } from 'react-icons/fi';

const Settings = () => {
  const [apiKey, setApiKeyValue] = useState(getApiKey() || '');
  const [mapCenter, setMapCenter] = useState(() => {
    const saved = localStorage.getItem('map_center');
    return saved ? JSON.parse(saved) : { lat: 20.5937, lng: 78.9629 };
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Other effects if necessary
  }, []);

  const handleSave = () => {
    setApiKey(apiKey);
    localStorage.setItem('map_center', JSON.stringify(mapCenter));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold dark:text-white">Settings</h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-medium dark:text-white mb-2">API Configuration</h3>
          <p className="text-sm text-gray-500 mb-4">
            Enter your device access key provided by the administrator.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key (Bearer Token)
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKeyValue(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                placeholder="ey..."
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        <div>
          <h3 className="text-lg font-medium dark:text-white mb-2">Map Preferences</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={mapCenter.lat}
                onChange={(e) => setMapCenter({ ...mapCenter, lat: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={mapCenter.lng}
                onChange={(e) => setMapCenter({ ...mapCenter, lng: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end">
          {saved && (
            <span className="text-green-600 mr-4 flex items-center text-sm font-medium animate-fade-in">
              <FiAlertCircle className="mr-2" /> Settings Saved
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <FiSave className="mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
