// src/components/VocabularyManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Check, Search, AlertTriangle, Clock, RotateCcw } from 'lucide-react';
import { api } from '../api';

// Helper function to format the SRS due date
const formatDueDate = (dueDateStr) => {
  if (!dueDateStr) {
    return { text: 'New', color: 'bg-gray-200 text-gray-700' };
  }
  const now = new Date();
  const dueDate = new Date(dueDateStr);
  
  if (dueDate <= now) {
    return { text: 'Due Now', color: 'bg-red-100 text-red-700' };
  }

  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  if (dueDate < tomorrow) {
    return { text: 'Due Today', color: 'bg-orange-100 text-orange-700' };
  }
  
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(now.getDate() + 2);
  dayAfterTomorrow.setHours(0, 0, 0, 0);

  if (dueDate < dayAfterTomorrow) {
    return { text: 'Tomorrow', color: 'bg-yellow-100 text-yellow-700' };
  }

  const diffTime = dueDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return { text: `In ${diffDays} days`, color: 'bg-blue-100 text-blue-700' };
};

export default function VocabularyManager({ vocabulary, onRefresh }) {
  const [japanese, setJapanese] = useState('');
  const [english, setEnglish] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const japaneseInputRef = useRef(null);

  useEffect(() => {
    const inputElement = japaneseInputRef.current;
    if (inputElement && window.wanakana) {
      window.wanakana.bind(inputElement);
    }
    return () => {
      if (inputElement && window.wanakana) {
        window.wanakana.unbind(inputElement);
      }
    };
  }, []);

  const handleAdd = async () => {
    if (japanese.trim() && english.trim()) {
      await api.addVocab({ japanese: japanese.trim(), english: english.trim() });
      setJapanese('');
      setEnglish('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      onRefresh();
    }
  };

  const handleDelete = async (id) => {
    const sets = await api.getSetsContainingWord(id);
    if (sets.length > 0) {
      const word = vocabulary.find(w => w.id === id);
      setDeleteConfirmation({ word, sets });
    } else {
      await api.deleteVocab(id);
      onRefresh();
    }
  };
  
  const handleResetSrs = async (wordId, wordJapanese) => {
    if (window.confirm(`Are you sure you want to reset the SRS progress for "${wordJapanese}"? This word will become "New" again.`)) {
      try {
        await api.resetSrsData(wordId);
        onRefresh();
      } catch (error) {
        console.error("Failed to reset SRS data for word:", error);
        alert("Could not reset SRS progress. Please try again.");
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmation) {
      await api.deleteVocab(deleteConfirmation.word.id);
      setDeleteConfirmation(null);
      onRefresh();
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const filteredVocabulary = vocabulary.filter(word =>
    word.japanese.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.english.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Vocabulary Management</h2>
      
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <AlertTriangle size={24} />
              <h3 className="text-lg sm:text-xl font-bold">Warning</h3>
            </div>
            <p className="mb-4 text-sm sm:text-base">The word <span className="font-bold">{deleteConfirmation.word.japanese}</span> ({deleteConfirmation.word.english}) is currently in {deleteConfirmation.sets.length} set{deleteConfirmation.sets.length !== 1 ? 's' : ''}:</p>
            <ul className="mb-4 sm:mb-6 bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">{deleteConfirmation.sets.map(set => (<li key={set.id} className="text-sm py-1">• {set.name}</li>))}</ul>
            <p className="mb-4 sm:mb-6 text-sm text-gray-600">Deleting this word will remove it from all these sets. This action cannot be undone.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-semibold">Delete Anyway</button>
              <button onClick={cancelDelete} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Add New Word</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input ref={japaneseInputRef} type="text" placeholder="Japanese (e.g., type 'sushi')" value={japanese} onChange={(e) => setJapanese(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          <input type="text" placeholder="English" value={english} onChange={(e) => setEnglish(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <button onClick={handleAdd} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"><Plus size={20} /> Add Word</button>
        {showSuccess && (<div className="mt-4 text-green-600 flex items-center gap-2"><Check size={20} /> Word added successfully!</div>)}
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">All Vocabulary ({vocabulary.length} words)</h3>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input type="text" placeholder="Search vocabulary..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"/>
        </div>
        
        <div className="hidden sm:block max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Japanese</th>
                <th className="px-4 py-2 text-left font-semibold">English</th>
                <th className="px-4 py-2 text-left font-semibold">SRS Status</th>
                <th className="px-4 py-2 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVocabulary.length === 0 ? (
                <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">{searchTerm ? 'No vocabulary found matching your search' : 'No vocabulary added yet'}</td></tr>
              ) : (
                filteredVocabulary.map((word) => {
                  const srsStatus = formatDueDate(word.due_date);
                  return (
                    <tr key={word.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{word.japanese}</td>
                      <td className="px-4 py-3">{word.english}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${srsStatus.color}`}>{srsStatus.text}</span></td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center gap-2">
                           {word.due_date && <button onClick={() => handleResetSrs(word.id, word.japanese)} className="text-blue-500 hover:text-blue-700" title="Reset SRS progress for this word"><RotateCcw size={18} /></button>}
                           <button onClick={() => handleDelete(word.id)} className="text-red-500 hover:text-red-700" title="Delete word"><X size={20} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="sm:hidden max-h-96 overflow-y-auto space-y-3">
          {filteredVocabulary.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">{searchTerm ? 'No vocabulary found matching your search' : 'No vocabulary added yet'}</div>
          ) : (
            filteredVocabulary.map((word) => {
              const srsStatus = formatDueDate(word.due_date);
              return (
                <div key={word.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-lg mb-1">{word.japanese}</div>
                    <div className="text-gray-600 mb-2">{word.english}</div>
                    <div className="flex items-center gap-2"><Clock size={14} className="text-gray-500"/><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${srsStatus.color}`}>{srsStatus.text}</span></div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    {word.due_date && <button onClick={() => handleResetSrs(word.id, word.japanese)} className="text-blue-500 hover:text-blue-700 p-2" title="Reset SRS progress for this word"><RotateCcw size={20} /></button>}
                    <button onClick={() => handleDelete(word.id)} className="text-red-500 hover:text-red-700 p-2" title="Delete word"><X size={20} /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
