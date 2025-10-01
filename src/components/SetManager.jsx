import React, { useState } from 'react';
import { Plus, X, Check, Search, Edit } from 'lucide-react';
import { api } from '../api';

export default function SetManager({ vocabulary, sets, onRefresh }) {
  const [setName, setSetName] = useState('');
  const [selectedWords, setSelectedWords] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSet, setEditingSet] = useState(null);

  const toggleWord = (id) => {
    setSelectedWords(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  const handleCreateSet = async () => {
    if (setName.trim() && selectedWords.length > 0) {
      await api.addSet({
        name: setName.trim(),
        wordIds: selectedWords
      });
      setSetName('');
      setSelectedWords([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      onRefresh();
    }
  };

  const handleEditSet = (set) => {
    setEditingSet(set);
    setSetName(set.name);
    setSelectedWords(set.wordIds);
    setSearchTerm('');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateSet = async () => {
    if (setName.trim() && selectedWords.length > 0 && editingSet) {
      await api.updateSet(editingSet.id, {
        name: setName.trim(),
        wordIds: selectedWords
      });
      setSetName('');
      setSelectedWords([]);
      setEditingSet(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      onRefresh();
    }
  };

  const handleCancelEdit = () => {
    setEditingSet(null);
    setSetName('');
    setSelectedWords([]);
    setSearchTerm('');
  };

  const handleDeleteSet = async (id) => {
    await api.deleteSet(id);
    onRefresh();
  };

  // Filter vocabulary based on search term
  const filteredVocabulary = vocabulary.filter(word =>
    word.japanese.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.english.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Manage Sets</h2>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">
          {editingSet ? 'Edit Set' : 'Create New Set'}
        </h3>
        {editingSet && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Editing: <span className="font-semibold">{editingSet.name}</span>
            </p>
          </div>
        )}
        <input
          type="text"
          placeholder="Set Name"
          value={setName}
          onChange={(e) => setSetName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        />
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Select words for this set ({selectedWords.length} selected):</p>
          
          <div className="relative mb-2">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search words..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>
          
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 sm:p-4">
            {filteredVocabulary.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                {searchTerm ? 'No words found matching your search' : 'No vocabulary available'}
              </p>
            ) : (
              filteredVocabulary.map((word) => (
                <label key={word.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer rounded">
                  <input
                    type="checkbox"
                    checked={selectedWords.includes(word.id)}
                    onChange={() => toggleWord(word.id)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">{word.japanese}</span>
                  <span className="text-gray-600">- {word.english}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {editingSet ? (
          <div className="flex gap-3">
            <button
              onClick={handleUpdateSet}
              disabled={!setName.trim() || selectedWords.length === 0}
              className="flex-1 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check size={20} /> Update Set
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              <X size={20} /> Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleCreateSet}
            disabled={!setName.trim() || selectedWords.length === 0}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus size={20} /> Create Set
          </button>
        )}
        {showSuccess && (
          <div className="mt-4 text-green-600 flex items-center gap-2">
            <Check size={20} /> {editingSet ? 'Set updated successfully!' : 'Set created successfully!'}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Your Sets ({sets.length})</h3>
        <div className="space-y-3">
          {sets.map((set) => (
            <div key={set.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div>
                <h4 className="font-semibold">{set.name}</h4>
                <p className="text-sm text-gray-600">{set.wordIds.length} words</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditSet(set)}
                  className="text-blue-500 hover:text-blue-700 p-2"
                  title="Edit set"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => handleDeleteSet(set.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                  title="Delete set"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
