// src/components/VocabularyManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Check, Search, AlertTriangle, Clock, RotateCcw, Layers } from 'lucide-react';
import { api } from '../api';

// Helper function to format the SRS due date
const formatDueDate = (dueDateStr) => {
  if (!dueDateStr) {
    return { text: 'New', color: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300' };
  }
  const now = new Date();
  const dueDate = new Date(dueDateStr);
    
  if (dueDate <= now) {
    return { text: 'Due Now', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' };
  }
  
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  if (dueDate < tomorrow) {
    return { text: 'Due Today', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' };
  }
    
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(now.getDate() + 2);
  dayAfterTomorrow.setHours(0, 0, 0, 0);
  
  if (dueDate < dayAfterTomorrow) {
    return { text: 'Tomorrow', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' };
  }
  
  const diffTime = dueDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return { text: `In ${diffDays} days`, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' };
};

export default function VocabularyManager({ vocabulary, sets, onRefresh }) {
  const [japanese, setJapanese] = useState('');
  const [english, setEnglish] = useState('');
  const [newWordSets, setNewWordSets] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [addError, setAddError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [managingWord, setManagingWord] = useState(null);
  const [wordSets, setWordSets] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
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
      setAddError(null);
      try {
        await api.addVocab({ 
          japanese: japanese.trim(), 
          english: english.trim(),
          setIds: newWordSets
        });
        setJapanese('');
        setEnglish('');
        setNewWordSets([]);
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
    
  const handleOpenSetsModal = async (word) => {
    setManagingWord(word);
    try {
      const currentSets = await api.getSetsContainingWord(word.id);
      setWordSets(currentSets.map(s => s.id));
    } catch (error) {
      console.error("Failed to fetch sets for word", error);
      setWordSets([]);
    }
  };

  const handleCloseSetsModal = () => {
    setManagingWord(null);
    setWordSets([]);
    setIsSaving(false);
  };

  const handleSetSelectionChange = (setId) => {
    setWordSets(prev => 
      prev.includes(setId) ? prev.filter(id => id !== setId) : [...prev, setId]
    );
  };
    
  const handleSaveChanges = async () => {
    if (!managingWord) return;
    setIsSaving(true);
    try {
      await api.updateWordSets(managingWord.id, wordSets);
      handleCloseSetsModal();
    } catch (error) {
      console.error("Failed to update word sets", error);
    } finally {
      setIsSaving(false);
    }
  };
    
  const handleNewWordSetToggle = (setId) => {
    setNewWordSets(prev => 
      prev.includes(setId) ? prev.filter(id => id !== setId) : [...prev, setId]
    );
  };

  const filteredVocabulary = vocabulary.filter(word =>
    word.japanese.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.english.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 dark:text-white">Vocabulary Management</h2>
            
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={24} />
              <h3 className="text-lg sm:text-xl font-bold">Warning</h3>
            </div>
            <p className="mb-4 text-sm sm:text-base dark:text-gray-300">The word <span className="font-bold">{deleteConfirmation.word.japanese}</span> ({deleteConfirmation.word.english}) is currently in {deleteConfirmation.sets.length} set{deleteConfirmation.sets.length !== 1 ? 's' : ''}:</p>
            <ul className="mb-4 sm:mb-6 bg-gray-50 dark:bg-gray-700 rounded p-3 max-h-32 overflow-y-auto">{deleteConfirmation.sets.map(set => (<li key={set.id} className="text-sm py-1 dark:text-gray-300">• {set.name}</li>))}</ul>
            <p className="mb-4 sm:mb-6 text-sm text-gray-600 dark:text-gray-400">Deleting this word will remove it from all these sets. This action cannot be undone.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-semibold">Delete Anyway</button>
              <button onClick={cancelDelete} className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {managingWord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] flex flex-col">
            <h3 className="text-lg sm:text-xl font-bold mb-4 dark:text-white">Manage Sets for: <span className="text-blue-600 dark:text-blue-400">{managingWord.japanese}</span></h3>
            
            <div className="flex-grow overflow-y-auto space-y-2 mb-4 pr-2">
              {sets.length > 0 ? sets.map(set => (
                <label key={set.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    checked={wordSets.includes(set.id)}
                    onChange={() => handleSetSelectionChange(set.id)}
                  />
                  <span className="dark:text-gray-200">{set.name}</span>
                </label>
              )) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No sets have been created yet. Go to the 'Sets' tab to create one.</p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t dark:border-gray-600">
              <button onClick={handleSaveChanges} disabled={isSaving} className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-semibold disabled:bg-blue-300 dark:disabled:bg-blue-800">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={handleCloseSetsModal} className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
            
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4 dark:text-white">Add New Word</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input ref={japaneseInputRef} type="text" placeholder="Japanese (e.g., type 'sushi')" value={japanese} onChange={(e) => setJapanese(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"/>
          <input type="text" placeholder="English" value={english} onChange={(e) => setEnglish(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"/>
        </div>
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add to sets (optional)
            </label>
            <div className="max-h-32 overflow-y-auto border dark:border-gray-600 rounded-lg p-2 space-y-1 bg-gray-50 dark:bg-gray-800">
                {sets.length > 0 ? sets.map(set => (
                    <label key={set.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded">
                        <input
                            type="checkbox"
                            checked={newWordSets.includes(set.id)}
                            onChange={() => handleNewWordSetToggle(set.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                        />
                        <span className="dark:text-gray-200">{set.name}</span>
                    </label>
                )) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center p-2">No sets created yet.</p>
                )}
            </div>
        </div>
        <button onClick={handleAdd} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"><Plus size={20} /> Add Word</button>
        {showSuccess && (<div className="mt-4 text-green-600 dark:text-green-400 flex items-center gap-2"><Check size={20} /> Word added successfully!</div>)}
        {addError && (<div className="mt-4 text-red-600 dark:text-red-400 flex items-center gap-2"><AlertTriangle size={20} /> {addError}</div>)}
      </div>

      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4 dark:text-white">All Vocabulary ({vocabulary.length} words)</h3>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
          <input type="text" placeholder="Search vocabulary..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"/>
        </div>
                
        <div className="hidden sm:block max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-600 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left font-semibold dark:text-gray-200">Japanese</th>
                <th className="px-4 py-2 text-left font-semibold dark:text-gray-200">English</th>
                <th className="px-4 py-2 text-left font-semibold dark:text-gray-200">SRS Status</th>
                <th className="px-4 py-2 text-center font-semibold dark:text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVocabulary.length === 0 ? (
                <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{searchTerm ? 'No vocabulary found matching your search' : 'No vocabulary added yet'}</td></tr>
              ) : (
                filteredVocabulary.map((word) => {
                  const srsStatus = formatDueDate(word.due_date);
                  return (
                    <tr key={word.id} className="border-t dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="px-4 py-3 font-medium dark:text-gray-200">{word.japanese}</td>
                      <td className="px-4 py-3 dark:text-gray-300">{word.english}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${srsStatus.color}`}>{srsStatus.text}</span></td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button onClick={() => handleOpenSetsModal(word)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" title="Manage sets"><Layers size={18} /></button>
                          {word.due_date && <button onClick={() => handleResetSrs(word.id, word.japanese)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" title="Reset SRS progress for this word"><RotateCcw size={18} /></button>}
                          <button onClick={() => handleDelete(word.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Delete word"><X size={20} /></button>
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
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{searchTerm ? 'No vocabulary found matching your search' : 'No vocabulary added yet'}</div>
          ) : (
            filteredVocabulary.map((word) => {
              const srsStatus = formatDueDate(word.due_date);
              return (
                <div key={word.id} className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-lg mb-1 dark:text-white">{word.japanese}</div>
                    <div className="text-gray-600 dark:text-gray-300 mb-2">{word.english}</div>
                    <div className="flex items-center gap-2"><Clock size={14} className="text-gray-500 dark:text-gray-400"/><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${srsStatus.color}`}>{srsStatus.text}</span></div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => handleOpenSetsModal(word)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2" title="Manage sets"><Layers size={20} /></button>
                    {word.due_date && <button onClick={() => handleResetSrs(word.id, word.japanese)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-2" title="Reset SRS progress for this word"><RotateCcw size={20} /></button>}
                    <button onClick={() => handleDelete(word.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2" title="Delete word"><X size={20} /></button>
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
