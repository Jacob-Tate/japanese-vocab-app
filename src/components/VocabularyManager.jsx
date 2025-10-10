// src/components/VocabularyManager.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, X, Check, Search, AlertTriangle, Clock, RotateCcw, Layers, BookOpen, Loader2, Star, Upload, Volume2, Trash2, ArrowUp, ArrowDown, Edit, Save } from 'lucide-react';
import { api } from '../api';
import { playAudio } from '../utils/audio';

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

const formatTag = (tag) => {
    return tag.replace('wanikani', 'WaniKani ').replace('jlpt-n', 'JLPT N');
}

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
  const audioInputRef = useRef(null);
  const [uploadingForWordId, setUploadingForWordId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const [newSetName, setNewSetName] = useState('');
  const [newWordAudioFile, setNewWordAudioFile] = useState(null);
  const [isSetListVisible, setIsSetListVisible] = useState(false);
  const [isAddingWord, setIsAddingWord] = useState(false);

  const [editingWord, setEditingWord] = useState(null); // { id, japanese, english }
  const [editError, setEditError] = useState(null);
  const editingJapaneseInputRef = useRef(null);

  // State for Definition Modal
  const [defModalOpen, setDefModalOpen] = useState(false);
  const [defWord, setDefWord] = useState(null);
  const [defResults, setDefResults] = useState([]);
  const [defLoading, setDefLoading] = useState(false);
  const [defError, setDefError] = useState(null);

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

  useEffect(() => {
    const editInputElement = editingJapaneseInputRef.current;
    if (editInputElement && window.wanakana) {
      window.wanakana.bind(editInputElement);
    }
    return () => {
      if (editInputElement && window.wanakana) {
        window.wanakana.unbind(editInputElement);
      }
    };
  }, [editingWord]);

  const handleAudioFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'audio/mpeg') {
      setNewWordAudioFile(file);
    } else if (file) {
      alert('Only .mp3 files are allowed.');
    }
    event.target.value = ''; // Reset file input to allow re-selection of the same file
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (japanese.trim() && english.trim()) {
      setIsAddingWord(true);
      setAddError(null);
      try {
        const newWord = await api.addVocab({ 
          japanese: japanese.trim(), 
          english: english.trim(),
          setIds: newWordSets
        });

        if (newWordAudioFile && newWord.id) {
          await api.uploadAudio(newWord.id, newWordAudioFile);
        }

        setJapanese('');
        setEnglish('');
        setNewWordAudioFile(null); // Clear audio file after successful add
        // Do not clear newWordSets to allow rapid entry
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        onRefresh();
        japaneseInputRef.current?.focus(); // Focus back on the Japanese input
      } catch (error) {
        setAddError(error.message);
        setTimeout(() => setAddError(null), 5000);
      } finally {
        setIsAddingWord(false);
      }
    }
  };
  
  const handleCreateNewSet = async () => {
    if (newSetName.trim()) {
        try {
            const newSet = await api.addSet({ name: newSetName.trim(), wordIds: [], sentenceIds: [] });
            setNewSetName('');
            await onRefresh(); // Refresh the list of sets
            // Automatically select the new set
            setNewWordSets(prev => [...prev, newSet.id]);
        } catch (error) {
            console.error("Failed to create new set:", error);
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

  const handleShowDefinition = async (word) => {
    setDefWord(word);
    setDefModalOpen(true);
    setDefLoading(true);
    setDefError(null);
    try {
      const response = await api.searchDictionary(word.japanese);
      setDefResults(response.data);
    } catch (e) {
      setDefError(e.message);
      setDefResults([]);
    } finally {
      setDefLoading(false);
    }
  };

  const handleCloseDefinitionModal = () => {
    setDefModalOpen(false);
    setDefWord(null);
    setDefResults([]);
    setDefError(null);
  };

  const handleUploadClick = (wordId) => {
    setUploadingForWordId(wordId);
    audioInputRef.current.click();
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files[0];
    if (file && uploadingForWordId) {
        try {
            await api.uploadAudio(uploadingForWordId, file);
            onRefresh();
        } catch (error) {
            alert(`Upload failed: ${error.message}`);
        } finally {
            setUploadingForWordId(null);
            event.target.value = '';
        }
    }
  };

  const handleDeleteAudio = async (wordId) => {
    if (window.confirm("Are you sure you want to delete the custom audio for this word?")) {
        try {
            await api.deleteAudio(wordId);
            onRefresh();
        } catch (error) {
            alert(`Failed to delete audio: ${error.message}`);
        }
    }
  };

  const handleEdit = (word) => {
    setEditingWord({ ...word });
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingWord(null);
    setEditError(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingWord || !editingWord.japanese.trim() || !editingWord.english.trim()) return;
    try {
      await api.updateVocab(editingWord.id, { japanese: editingWord.japanese, english: editingWord.english });
      setEditingWord(null);
      setEditError(null);
      onRefresh();
    } catch (error) {
      setEditError(error.message);
    }
  };

  const handleEditingInputChange = (e) => {
    setEditingWord({ ...editingWord, [e.target.name]: e.target.value });
  };

  const filteredVocabulary = useMemo(() => 
    vocabulary.filter(word =>
      word.japanese.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.english.toLowerCase().includes(searchTerm.toLowerCase())
    ), [vocabulary, searchTerm]);
  
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedAndFilteredVocabulary = useMemo(() => {
    let sortableItems = [...filteredVocabulary];
    if (sortConfig.key) {
        sortableItems.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
  
            if (valA === null || valA === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valB === null || valB === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
  
            if (valA < valB) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (valA > valB) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }
    return sortableItems;
  }, [filteredVocabulary, sortConfig]);

  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ascending' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  return (
    <div className="p-4 sm:p-6">
      <input
        type="file"
        ref={audioInputRef}
        onChange={handleFileSelected}
        accept="audio/mpeg"
        className="hidden"
      />
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

      {defModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] flex flex-col">
            <h3 className="text-lg sm:text-xl font-bold mb-4 dark:text-white flex-shrink-0">Definition for: <span className="text-blue-600 dark:text-blue-400">{defWord.japanese}</span></h3>
            <div className="flex-grow overflow-y-auto pr-2">
              {defLoading && <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-blue-500" size={48} /></div>}
              {defError && <div className="text-red-500 dark:text-red-400 text-center">{defError}</div>}
              <div className="space-y-4">
                {defResults.length > 0 ? (
                  defResults.map((result, index) => (
                    <div key={result.slug + index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mb-3">
                          {result.japanese.map((jp, i) => (
                              <div key={i} className="flex items-baseline">
                                  <span className="text-2xl font-bold dark:text-white">{jp.word || jp.reading}</span>
                                  {jp.word && <span className="ml-2 text-md text-gray-600 dark:text-gray-300">({jp.reading})</span>}
                              </div>
                          ))}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                          {result.is_common && <span className="flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full"><Star size={12}/> Common word</span>}
                          {result.tags.map(tag => <span key={tag} className="text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">{formatTag(tag)}</span>)}
                      </div>
                      {result.senses.map((sense, i) => (
                          <div key={i} className="border-t dark:border-gray-600 pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
                              <div className="flex">
                                  <span className="text-gray-500 dark:text-gray-400 mr-3">{i + 1}.</span>
                                  <div>
                                      <p className="text-gray-800 dark:text-gray-200">{sense.english_definitions.join('; ')}</p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">{sense.parts_of_speech.join(', ')}</p>
                                  </div>
                              </div>
                          </div>
                      ))}
                    </div>
                  ))
                ) : (
                  !defLoading && <p className="text-center text-gray-500 dark:text-gray-400">No results found.</p>
                )}
              </div>
            </div>
            <div className="pt-4 mt-4 border-t dark:border-gray-600 flex-shrink-0">
              <button onClick={handleCloseDefinitionModal} className="w-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
            
      <form onSubmit={handleAdd} className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4 dark:text-white">Add New Word</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input ref={japaneseInputRef} type="text" placeholder="Japanese (e.g., type 'sushi')" value={japanese} onInput={(e) => setJapanese(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"/>
          <input type="text" placeholder="English" value={english} onChange={(e) => setEnglish(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"/>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Audio (optional, .mp3 only)
          </label>
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              accept="audio/mpeg"
              onChange={handleAudioFileSelect}
              className="hidden"
              id="new-word-audio-input"
            />
            <label htmlFor="new-word-audio-input" className="cursor-pointer bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg inline-flex items-center gap-2">
              <Upload size={18} />
              Choose File
            </label>
            {newWordAudioFile && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span>{newWordAudioFile.name}</span>
                <button type="button" onClick={() => setNewWordAudioFile(null)} className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900 text-red-500">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <button 
            type="button"
            onClick={() => setIsSetListVisible(!isSetListVisible)}
            className="w-full flex justify-between items-center text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Add to sets {newWordSets.length > 0 ? `(${newWordSets.length} selected)` : '(optional)'}
            </span>
            <Layers size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
          
          {isSetListVisible && (
            <div className="mt-2 p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2 mb-2">
                  <input 
                      type="text" 
                      placeholder="Create new set..." 
                      value={newSetName} 
                      onChange={(e) => setNewSetName(e.target.value)}
                      className="flex-grow px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button 
                      type="button"
                      onClick={handleCreateNewSet}
                      disabled={!newSetName.trim()}
                      className="p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
                      title="Create and select new set"
                  >
                      <Plus size={16} />
                  </button>
              </div>
              <div className="max-h-32 overflow-y-auto border dark:border-gray-600 rounded-lg p-2 space-y-1 bg-white dark:bg-gray-700">
                  {sets.length > 0 ? sets.map(set => (
                      <label key={set.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer rounded">
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
          )}
        </div>
        <button type="submit" disabled={isAddingWord} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2 disabled:bg-blue-300 dark:disabled:bg-blue-800">
            {isAddingWord ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20} />} 
            {isAddingWord ? 'Adding...' : 'Add Word'}
        </button>
        {showSuccess && (<div className="mt-4 text-green-600 dark:text-green-400 flex items-center gap-2"><Check size={20} /> Word added successfully!</div>)}
        {addError && (<div className="mt-4 text-red-600 dark:text-red-400 flex items-center gap-2"><AlertTriangle size={20} /> {addError}</div>)}
      </form>

      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4 dark:text-white">All Vocabulary ({vocabulary.length} words)</h3>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
          <input type="text" placeholder="Search vocabulary..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"/>
        </div>
        
        {/* Mobile Sort Controls */}
        <div className="sm:hidden mb-4 flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm font-medium dark:text-gray-300">Sort by:</label>
            <select
              id="sort-select"
              value={sortConfig.key}
              onChange={(e) => requestSort(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-600 dark:text-white"
            >
              <option value="created_at">Date Added</option>
              <option value="japanese">Japanese</option>
              <option value="english">English</option>
              <option value="due_date">SRS Status</option>
            </select>
            <button 
              onClick={() => setSortConfig(c => ({...c, direction: c.direction === 'ascending' ? 'descending' : 'ascending' }))} 
              className="p-2 bg-gray-100 dark:bg-gray-500 rounded-lg"
            >
              {sortConfig.direction === 'ascending' ? <ArrowUp size={16} className="dark:text-white"/> : <ArrowDown size={16} className="dark:text-white"/>}
            </button>
        </div>
                
        <div className="hidden sm:block max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-600 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left font-semibold dark:text-gray-200">
                  <button onClick={() => requestSort('japanese')} className="flex items-center gap-1 hover:text-blue-500 dark:hover:text-blue-400">Japanese <SortIndicator columnKey="japanese" /></button>
                </th>
                <th className="px-4 py-2 text-left font-semibold dark:text-gray-200">
                  <button onClick={() => requestSort('english')} className="flex items-center gap-1 hover:text-blue-500 dark:hover:text-blue-400">English <SortIndicator columnKey="english" /></button>
                </th>
                <th className="px-4 py-2 text-left font-semibold dark:text-gray-200">
                  <button onClick={() => requestSort('due_date')} className="flex items-center gap-1 hover:text-blue-500 dark:hover:text-blue-400">SRS Status <SortIndicator columnKey="due_date" /></button>
                </th>
                <th className="px-4 py-2 text-center font-semibold dark:text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredVocabulary.length === 0 ? (
                <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{searchTerm ? 'No vocabulary found matching your search' : 'No vocabulary added yet'}</td></tr>
              ) : (
                sortedAndFilteredVocabulary.map((word) => {
                  const srsStatus = formatDueDate(word.due_date);
                  const isEditing = editingWord && editingWord.id === word.id;
                  if (isEditing) {
                    return (
                      <tr key={word.id} className="bg-blue-50 dark:bg-blue-900/50">
                        <td className="px-4 py-3"><input ref={editingJapaneseInputRef} name="japanese" value={editingWord.japanese} onInput={handleEditingInputChange} className="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-white" /></td>
                        <td className="px-4 py-3"><input name="english" value={editingWord.english} onChange={handleEditingInputChange} className="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-white" /></td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${srsStatus.color}`}>{srsStatus.text}</span></td>
                        <td className="px-4 py-3 text-center">
                          <form onSubmit={handleUpdate} className="flex justify-center items-center gap-2">
                            <button type="submit" className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300" title="Save"><Save size={18} /></button>
                            <button type="button" onClick={handleCancelEdit} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Cancel"><X size={20} /></button>
                          </form>
                          {editError && <div className="text-red-500 text-xs text-center col-span-full">{editError}</div>}
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={word.id} className="border-t dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="px-4 py-3 font-medium dark:text-gray-200">{word.japanese}</td>
                      <td className="px-4 py-3 dark:text-gray-300">{word.english}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${srsStatus.color}`}>{srsStatus.text}</span></td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center gap-1">
                          <button onClick={() => handleEdit(word)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" title="Edit word"><Edit size={18} /></button>
                          {word.audio_filename ? (<><button onClick={() => playAudio(word)} className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300" title="Play custom audio"><Volume2 size={18} /></button><button onClick={() => handleDeleteAudio(word.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Delete custom audio"><Trash2 size={18} /></button></>) : (<button onClick={() => handleUploadClick(word.id)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" title="Upload MP3"><Upload size={18} /></button>)}
                          <button onClick={() => handleShowDefinition(word)} className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300" title="See definition"><BookOpen size={18} /></button>
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
          {sortedAndFilteredVocabulary.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{searchTerm ? 'No vocabulary found matching your search' : 'No vocabulary added yet'}</div>
          ) : (
            sortedAndFilteredVocabulary.map((word) => {
              const srsStatus = formatDueDate(word.due_date);
              const isEditing = editingWord && editingWord.id === word.id;
              if(isEditing) {
                return (
                  <form key={word.id} onSubmit={handleUpdate} className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-4 space-y-3">
                    <input ref={editingJapaneseInputRef} name="japanese" value={editingWord.japanese} onInput={handleEditingInputChange} className="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-white" />
                    <input name="english" value={editingWord.english} onChange={handleEditingInputChange} className="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-white" />
                    {editError && <div className="text-red-500 text-xs">{editError}</div>}
                    <div className="flex items-center gap-2">
                      <button type="submit" className="text-green-500 hover:text-green-700 p-2"><Save size={20} /></button>
                      <button type="button" onClick={handleCancelEdit} className="text-red-500 hover:text-red-700 p-2"><X size={20} /></button>
                    </div>
                  </form>
                )
              }
              return (
                <div key={word.id} className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-lg mb-1 dark:text-white">{word.japanese}</div>
                    <div className="text-gray-600 dark:text-gray-300 mb-2">{word.english}</div>
                    <div className="flex items-center gap-2"><Clock size={14} className="text-gray-500 dark:text-gray-400"/><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${srsStatus.color}`}>{srsStatus.text}</span></div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => handleEdit(word)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2" title="Edit word"><Edit size={20} /></button>
                    {word.audio_filename ? (<button onClick={() => playAudio(word)} className="text-green-500 p-2" title="Play custom audio"><Volume2 size={20} /></button>) : (<button onClick={() => handleUploadClick(word.id)} className="text-blue-500 p-2" title="Upload MP3"><Upload size={20} /></button>)}
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
