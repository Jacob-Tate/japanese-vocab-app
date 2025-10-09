// src/components/SrsSettingsModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function SrsSettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({ newCardsPerDay: '20', reviewsPerDay: '100' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api.getSettings()
        .then(data => {
          setSettings({
            newCardsPerDay: data.newCardsPerDay || '20',
            reviewsPerDay: data.reviewsPerDay || '100'
          });
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        api.updateSetting('newCardsPerDay', settings.newCardsPerDay),
        api.updateSetting('reviewsPerDay', settings.reviewsPerDay)
      ]);
      onClose();
    } catch (error) {
      console.error("Failed to save SRS settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Allow empty input for typing, but ensure it's a number
    const numValue = value === '' ? '' : Math.max(0, parseInt(value, 10));
    setSettings(prev => ({ ...prev, [name]: numValue.toString() }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-white">SRS Daily Limits</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={24} className="dark:text-gray-300" />
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="newCardsPerDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Cards per Day</label>
              <input
                type="number"
                id="newCardsPerDay"
                name="newCardsPerDay"
                value={settings.newCardsPerDay}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-600 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">The maximum number of new cards to introduce each day.</p>
            </div>
            <div>
              <label htmlFor="reviewsPerDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reviews per Day</label>
              <input
                type="number"
                id="reviewsPerDay"
                name="reviewsPerDay"
                value={settings.reviewsPerDay}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-600 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">The maximum number of review cards to show each day.</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving || isLoading} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
