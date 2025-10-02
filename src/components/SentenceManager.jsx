// src/components/SentenceManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Check, Search, AlertTriangle } from 'lucide-react';
import { api } from '../api';

export default function SentenceManager({ sentences, onRefresh }) {
  const [japanese, setJapanese] = useState('');
  const [english, setEnglish] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [addError, setAddError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const japaneseInputRef = useRef(null);

  useEffect(() => {
    const inputElement = japaneseInputRef.current;
    if (inputElement && window.wanakana) {
      window.wanakana.bind(inputElement, { IMEMode: true });
    }
    return () => {
      if (inputElement && window.wanakana) {
        window.wanakana.unbind(inputElement);
      }
    };
  }, []);

  const handleAdd = async () => {
    if (japanese.trim() && english.trim()) {
      setAddError(null);
      try {
        await api.addSentence({ japanese: japanese.trim(), english: english.trim() });
        setJapanese('');
        setEnglish('');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        onRefresh();
      } catch (error) {
        setAddError(error.message);
        setTimeout(() => setAddError(null), 5000);
      }
    }
  };

  const handleDelete = async (id) => {
    await api.deleteSentence(id);
    onRefresh();
  };

  const filteredSentences = sentences.filter(s =>
    s.japanese.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.english.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 dark:text-white">Sentence Management</h2>
            
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4 dark:text-white">Add New Sentence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            ref={japaneseInputRef}
            type="text"
            placeholder="Japanese Sentence"
            value={japanese}
            onChange={(e) => setJapanese(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
          />
          <input
            type="text"
            placeholder="English Translation"
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
          />
        </div>
        <button onClick={handleAdd} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
          <Plus size={20} /> Add Sentence
        </button>
        {showSuccess && <div className="mt-4 text-green-600 dark:text-green-400 flex items-center gap-2"><Check size={20} /> Sentence added successfully!</div>}
        {addError && <div className="mt-4 text-red-600 dark:text-red-400 flex items-center gap-2"><AlertTriangle size={20} /> {addError}</div>}
      </div>

      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4 dark:text-white">All Sentences ({sentences.length})</h3>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search sentences..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
          />
        </div>
                
        <div className="max-h-96 overflow-y-auto space-y-3">
          {filteredSentences.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No sentences found matching your search' : 'No sentences added yet'}
            </div>
          ) : (
            filteredSentences.map((sentence) => (
              <div key={sentence.id} className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4 flex justify-between items-start">
                <div>
                  <div className="font-medium mb-1 dark:text-white">{sentence.japanese}</div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm">{sentence.english}</div>
                </div>
                <button onClick={() => handleDelete(sentence.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2 p-2 flex-shrink-0">
                  <X size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
