import React, { useState } from 'react';
import { Plus, X, Check, Search, AlertTriangle } from 'lucide-react';
import { api } from '../api';

export default function VocabularyManager({ vocabulary, onRefresh }) {
  const [japanese, setJapanese] = useState('');
  const [english, setEnglish] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

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
    // Check if word is in any sets
    const sets = await api.getSetsContainingWord(id);
    
    if (sets.length > 0) {
      // Show confirmation modal
      const word = vocabulary.find(w => w.id === id);
      setDeleteConfirmation({ word, sets });
    } else {
      // Delete immediately if not in any sets
      await api.deleteVocab(id);
      onRefresh();
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

  // Filter vocabulary based on search term
  const filteredVocabulary = vocabulary.filter(word =>
    word.japanese.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.english.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Vocabulary Management</h2>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <AlertTriangle size={24} />
              <h3 className="text-lg sm:text-xl font-bold">Warning</h3>
            </div>
            
            <p className="mb-4 text-sm sm:text-base">
              The word <span className="font-bold">{deleteConfirmation.word.japanese}</span> ({deleteConfirmation.word.english}) 
              is currently in {deleteConfirmation.sets.length} set{deleteConfirmation.sets.length !== 1 ? 's' : ''}:
            </p>
            
            <ul className="mb-4 sm:mb-6 bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
              {deleteConfirmation.sets.map(set => (
                <li key={set.id} className="text-sm py-1">• {set.name}</li>
              ))}
            </ul>
            
            <p className="mb-4 sm:mb-6 text-sm text-gray-600">
              Deleting this word will remove it from all these sets. This action cannot be undone.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-semibold"
              >
                Delete Anyway
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Add New Word</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Japanese"
            value={japanese}
            onChange={(e) => setJapanese(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="English"
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus size={20} /> Add Word
        </button>
        {showSuccess && (
          <div className="mt-4 text-green-600 flex items-center gap-2">
            <Check size={20} /> Word added successfully!
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">All Vocabulary ({vocabulary.length} words)</h3>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search vocabulary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden sm:block max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left">Japanese</th>
                <th className="px-4 py-2 text-left">English</th>
                <th className="px-4 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredVocabulary.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'No vocabulary found matching your search' : 'No vocabulary added yet'}
                  </td>
                </tr>
              ) : (
                filteredVocabulary.map((word) => (
                  <tr key={word.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{word.japanese}</td>
                    <td className="px-4 py-3">{word.english}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(word.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Card View */}
        <div className="sm:hidden max-h-96 overflow-y-auto space-y-3">
          {filteredVocabulary.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              {searchTerm ? 'No vocabulary found matching your search' : 'No vocabulary added yet'}
            </div>
          ) : (
            filteredVocabulary.map((word) => (
              <div key={word.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-lg mb-1">{word.japanese}</div>
                  <div className="text-gray-600">{word.english}</div>
                </div>
                <button
                  onClick={() => handleDelete(word.id)}
                  className="text-red-500 hover:text-red-700 ml-2 p-2"
                >
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
