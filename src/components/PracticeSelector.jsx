import React, { useState } from 'react';
import { Book, Play, Layers } from 'lucide-react';

export default function PracticeSelector({ sets, vocabulary, onStartGame, onStartFlashcard }) {
  const [selectedSet, setSelectedSet] = useState(null);
  const [mode, setMode] = useState(null);
  const [repetitions, setRepetitions] = useState(3);
  const [startingSide, setStartingSide] = useState('japanese');

  const handleStart = () => {
    if (selectedSet && mode) {
      if (mode === 'matching') {
        onStartGame(selectedSet, repetitions);
      } else if (mode === 'flashcard') {
        onStartFlashcard(selectedSet, startingSide);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Practice Mode</h2>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Select a Set</h3>
        <div className="space-y-2">
          {sets.map((set) => (
            <button
              key={set.id}
              onClick={() => setSelectedSet(set)}
              className={`w-full p-4 rounded-lg text-left transition-all ${
                selectedSet?.id === set.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="font-semibold">{set.name}</div>
              <div className="text-sm opacity-80">{set.wordIds.length} words</div>
            </button>
          ))}
        </div>
      </div>

      {selectedSet && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Select Practice Mode</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setMode('matching')}
              className={`p-6 rounded-lg border-2 transition-all ${
                mode === 'matching'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              <Layers className="w-8 h-8 mb-2 mx-auto text-blue-500" />
              <div className="font-semibold">Matching Game</div>
              <div className="text-sm text-gray-600">Match Japanese with English</div>
            </button>
            <button
              onClick={() => setMode('flashcard')}
              className={`p-6 rounded-lg border-2 transition-all ${
                mode === 'flashcard'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              <Book className="w-8 h-8 mb-2 mx-auto text-blue-500" />
              <div className="font-semibold">Flashcard Drill</div>
              <div className="text-sm text-gray-600">Study cards in random order</div>
            </button>
          </div>
        </div>
      )}

      {selectedSet && mode && (
        <>
          {mode === 'matching' && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Game Settings</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repetitions per word
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={repetitions}
                    onChange={(e) => setRepetitions(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xl sm:text-2xl font-bold text-blue-600 w-8 sm:w-12 text-center">
                    {repetitions}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-2">
                  Each word will appear {repetitions} time{repetitions !== 1 ? 's' : ''} in the game
                  ({selectedSet.wordIds.length} words × {repetitions} = {selectedSet.wordIds.length * repetitions} total matches)
                </p>
              </div>
            </div>
          )}
          
          {mode === 'flashcard' && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Flashcard Settings</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Starting side
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setStartingSide('japanese')}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                      startingSide === 'japanese'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <div className="font-semibold text-base sm:text-lg mb-1">日本語 → English</div>
                    <div className="text-xs sm:text-sm text-gray-600">Show Japanese first</div>
                  </button>
                  <button
                    onClick={() => setStartingSide('english')}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                      startingSide === 'english'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <div className="font-semibold text-base sm:text-lg mb-1">English → 日本語</div>
                    <div className="text-xs sm:text-sm text-gray-600">Show English first</div>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleStart}
            className="w-full bg-green-500 text-white py-3 sm:py-4 rounded-lg hover:bg-green-600 text-base sm:text-lg font-semibold flex items-center justify-center gap-2"
          >
            <Play size={24} /> Start Practice
          </button>
        </>
      )}
    </div>
  );
}
