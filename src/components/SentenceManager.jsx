// src/components/SentenceManager.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, X, Check, Search, AlertTriangle, TextSelect, Layers, ChevronDown } from 'lucide-react';
import { api } from '../api';
import ClozeGeneratorModal from './ClozeGeneratorModal';

export default function SentenceManager({ sentences, sets, onRefresh }) {
  const [japanese, setJapanese] = useState('');
  const [english, setEnglish] = useState('');
  const [newSentenceSets, setNewSentenceSets] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [addError, setAddError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const japaneseInputRef = useRef(null);
  const [isSetSelectionOpen, setIsSetSelectionOpen] = useState(false);
  const [newSetName, setNewSetName] = useState('');

  const [isClozeModalOpen, setIsClozeModalOpen] = useState(false);
  const [sentenceForCloze, setSentenceForCloze] = useState(null);

  const [managingSentence, setManagingSentence] = useState(null);
  const [sentenceSets, setSentenceSets] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

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

  const sentenceToSetsMap = useMemo(() => {
    const map = new Map();
    for (const sentence of sentences) {
        map.set(sentence.id, []);
    }
    for (const set of sets) {
        for (const sentenceId of set.sentenceIds) {
            if (map.has(sentenceId)) {
                map.get(sentenceId).push(set.name);
            }
        }
    }
    return map;
  }, [sentences, sets]);

  const handleOpenClozeModal = (sentence) => {
    setSentenceForCloze(sentence);
    setIsClozeModalOpen(true);
  };

  const handleAdd = async () => {
    if (japanese.trim() && english.trim()) {
      setAddError(null);
      try {
        await api.addSentence({ 
          japanese: japanese.trim(), 
          english: english.trim(),
          setIds: newSentenceSets
        });
        setJapanese('');
        setEnglish('');
        // Persist set selection: setNewSentenceSets([]);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        onRefresh();
      } catch (error) {
        setAddError(error.message);
        setTimeout(() => setAddError(null), 5000);
      }
    }
  };
  
  const handleCreateNewSet = async (e) => {
    e.preventDefault();
    if (!newSetName.trim()) return;
    try {
        await api.addSet({ name: newSetName.trim(), wordIds: [], sentenceIds: [] });
        setNewSetName('');
        onRefresh();
    } catch (error) {
        console.error("Failed to create new set:", error);
        alert("Failed to create new set.");
    }
  };

  const handleDelete = async (id) => {
    await api.deleteSentence(id);
    onRefresh();
  };

  const handleOpenSetsModal = async (sentence) => {
    setManagingSentence(sentence);
    try {
      const currentSets = await api.getSetsContainingSentence(sentence.id);
      setSentenceSets(currentSets.map(s => s.id));
      console.log(sentenceSets);
    } catch (error) {
      console.error("Failed to fetch sets for sentence", error);
      setSentenceSets([]);
    }
  };

  const handleCloseSetsModal = () => {
    setManagingSentence(null);
    setSentenceSets([]);
    setIsSaving(false);
  };

  const handleSetSelectionChange = (setId) => {
    setSentenceSets(prev => 
      prev.includes(setId) ? prev.filter(id => id !== setId) : [...prev, setId]
    );
  };

  const handleSaveChanges = async () => {
    if (!managingSentence) return;
    setIsSaving(true);
    try {
      await api.updateSentenceSets(managingSentence.id, sentenceSets);
      handleCloseSetsModal();
      onRefresh(); // Refresh data to show updated set associations
    } catch (error) {
      console.error("Failed to update sentence sets", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewSentenceSetToggle = (setId) => {
    setNewSentenceSets(prev => 
      prev.includes(setId) ? prev.filter(id => id !== setId) : [...prev, setId]
    );
  };

  const filteredSentences = sentences.filter(s =>
    s.japanese.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.english.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 dark:text-white">Sentence Management</h2>

      <ClozeGeneratorModal
        isOpen={isClozeModalOpen}
        sentence={sentenceForCloze}
        onClose={() => setIsClozeModalOpen(false)}
      />

      {managingSentence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] flex flex-col">
            <h3 className="text-lg sm:text-xl font-bold mb-4 dark:text-white">Manage Sets for Sentence</h3>
            
            <div className="flex-grow overflow-y-auto space-y-2 mb-4 pr-2">
              {sets.length > 0 ? sets.map(set => (
                <label key={set.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    checked={sentenceSets.includes(set.id)}
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
        <div className="mb-4">
            <button onClick={() => setIsSetSelectionOpen(!isSetSelectionOpen)} className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span>Add to sets (optional)</span>
                <ChevronDown className={`transition-transform ${isSetSelectionOpen ? 'rotate-180' : ''}`} />
            </button>
            {isSetSelectionOpen && (
              <div className="border dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-800">
                <form onSubmit={handleCreateNewSet} className="flex gap-2 p-2 dark:border-gray-700">
                    <input type="text" value={newSetName} onChange={(e) => setNewSetName(e.target.value)} placeholder="Or create a new set..." className="flex-grow px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"/>
                    <button type="submit" className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 disabled:bg-gray-400" disabled={!newSetName.trim()}>Create</button>
                </form>
                <div className="max-h-32 overflow-y-auto space-y-1 mb-2">
                    {sets.length > 0 ? sets.map(set => (
                        <label key={set.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded">
                            <input type="checkbox" checked={newSentenceSets.includes(set.id)} onChange={() => handleNewSentenceSetToggle(set.id)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"/>
                            <span className="dark:text-gray-200">{set.name}</span>
                        </label>
                    )) : (<p className="text-sm text-gray-500 dark:text-gray-400 text-center p-2">No sets created yet.</p>)}
                </div>
              </div>
            )}
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
            filteredSentences.map((sentence) => {
              const containingSets = sentenceToSetsMap.get(sentence.id) || [];
              return (
              <div key={sentence.id} className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4 flex justify-between items-start">
                <div>
                  <div className="font-medium mb-1 dark:text-white">{sentence.japanese}</div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm mb-2">{sentence.english}</div>
                  {containingSets.length > 0 && (
                      <div className="flex flex-wrap gap-2 items-center">
                          <Layers size={14} className="text-gray-500 dark:text-gray-400" />
                          {containingSets.map(setName => (
                              <span key={setName} className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">{setName}</span>
                          ))}
                      </div>
                  )}
                </div>
                <div className="flex items-center ml-2 flex-shrink-0">
                   <button onClick={() => handleOpenSetsModal(sentence)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2" title="Manage sets">
                    <Layers size={20} />
                  </button>
                   <button onClick={() => handleOpenClozeModal(sentence)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-2" title="Generate Cloze Deletion">
                    <TextSelect size={20} />
                  </button>
                  <button onClick={() => handleDelete(sentence.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2">
                    <X size={20} />
                  </button>
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
