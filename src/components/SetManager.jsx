// src/components/SetManager.jsx
import React, { useState } from 'react';
import { Plus, X, Check, Search, Edit } from 'lucide-react';
import { api } from '../api';

export default function SetManager({ vocabulary, sentences, sets, onRefresh }) {
  const [setName, setSetName] = useState('');
  const [selectedWords, setSelectedWords] = useState([]);
  const [selectedSentences, setSelectedSentences] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSet, setEditingSet] = useState(null);

  const toggleWord = (id) => setSelectedWords(p => p.includes(id) ? p.filter(w => w !== id) : [...p, id]);
  const toggleSentence = (id) => setSelectedSentences(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  const handleCreateSet = async () => {
    if (setName.trim() && (selectedWords.length > 0 || selectedSentences.length > 0)) {
      await api.addSet({ name: setName.trim(), wordIds: selectedWords, sentenceIds: selectedSentences });
      resetForm();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      onRefresh();
    }
  };

  const handleEditSet = (set) => {
    setEditingSet(set);
    setSetName(set.name);
    setSelectedWords(set.wordIds || []);
    setSelectedSentences(set.sentenceIds || []);
    setSearchTerm('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateSet = async () => {
    if (setName.trim() && (selectedWords.length > 0 || selectedSentences.length > 0) && editingSet) {
      await api.updateSet(editingSet.id, { name: setName.trim(), wordIds: selectedWords, sentenceIds: selectedSentences });
      resetForm();
      setEditingSet(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      onRefresh();
    }
  };
  
  const resetForm = () => {
    setSetName('');
    setSelectedWords([]);
    setSelectedSentences([]);
    setSearchTerm('');
  };

  const handleCancelEdit = () => {
    setEditingSet(null);
    resetForm();
  };

  const handleDeleteSet = async (id) => {
    await api.deleteSet(id);
    onRefresh();
  };

  const filteredVocabulary = vocabulary.filter(w => w.japanese.toLowerCase().includes(searchTerm.toLowerCase()) || w.english.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredSentences = sentences.filter(s => s.japanese.toLowerCase().includes(searchTerm.toLowerCase()) || s.english.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Manage Sets</h2>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">{editingSet ? 'Edit Set' : 'Create New Set'}</h3>
        {editingSet && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"><p className="text-sm text-blue-800">Editing: <span className="font-semibold">{editingSet.name}</span></p></div>}
        <input type="text" placeholder="Set Name" value={setName} onChange={(e) => setSetName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"/>
        
        <div className="mb-4">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input type="text" placeholder="Search content..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"/>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Select words ({selectedWords.length} selected):</p>
              <div className="max-h-64 overflow-y-auto border rounded-lg p-2">
                {filteredVocabulary.map(w => <label key={`w-${w.id}`} className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer rounded"><input type="checkbox" checked={selectedWords.includes(w.id)} onChange={() => toggleWord(w.id)} className="w-4 h-4"/><span className="font-medium">{w.japanese}</span><span className="text-gray-600">- {w.english}</span></label>)}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Select sentences ({selectedSentences.length} selected):</p>
              <div className="max-h-64 overflow-y-auto border rounded-lg p-2">
                {filteredSentences.map(s => <label key={`s-${s.id}`} className="flex items-start gap-3 p-2 hover:bg-gray-50 cursor-pointer rounded"><input type="checkbox" checked={selectedSentences.includes(s.id)} onChange={() => toggleSentence(s.id)} className="w-4 h-4 mt-1 flex-shrink-0"/><div><div className="font-medium">{s.japanese}</div><div className="text-xs text-gray-500">{s.english}</div></div></label>)}
              </div>
            </div>
          </div>
        </div>

        {editingSet ? (
          <div className="flex gap-3">
            <button onClick={handleUpdateSet} disabled={!setName.trim() || (selectedWords.length === 0 && selectedSentences.length === 0)} className="flex-1 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 flex items-center justify-center gap-2"><Check size={20} /> Update Set</button>
            <button onClick={handleCancelEdit} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"><X size={20} /> Cancel</button>
          </div>
        ) : (
          <button onClick={handleCreateSet} disabled={!setName.trim() || (selectedWords.length === 0 && selectedSentences.length === 0)} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 flex items-center gap-2"><Plus size={20} /> Create Set</button>
        )}
        {showSuccess && <div className="mt-4 text-green-600 flex items-center gap-2"><Check size={20} /> {editingSet ? 'Set updated successfully!' : 'Set created successfully!'}</div>}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Your Sets ({sets.length})</h3>
        <div className="space-y-3">
          {sets.map((set) => (
            <div key={set.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div>
                <h4 className="font-semibold">{set.name}</h4>
                <p className="text-sm text-gray-600">{set.wordIds.length} words, {set.sentenceIds.length} sentences</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEditSet(set)} className="text-blue-500 hover:text-blue-700 p-2" title="Edit set"><Edit size={20} /></button>
                <button onClick={() => handleDeleteSet(set.id)} className="text-red-500 hover:text-red-700 p-2" title="Delete set"><X size={20} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
