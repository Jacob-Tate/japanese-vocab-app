import React, { useState, useEffect } from 'react';
import { Book, Layers, Play } from 'lucide-react';
import { api } from './api';
import VocabularyManager from './components/VocabularyManager';
import SetManager from './components/SetManager';
import MatchingGame from './components/MatchingGame';
import FlashcardDrill from './components/FlashcardDrill';
import PracticeSelector from './components/PracticeSelector';

export default function JapaneseVocabApp() {
  const [vocabulary, setVocabulary] = useState([]);
  const [sets, setSets] = useState([]);
  const [currentView, setCurrentView] = useState('vocab');
  const [activeGame, setActiveGame] = useState(null);
  const [activeSet, setActiveSet] = useState(null);
  const [gameRepetitions, setGameRepetitions] = useState(3);
  const [flashcardStartingSide, setFlashcardStartingSide] = useState('japanese');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const vocab = await api.getAllVocab();
    const allSets = await api.getAllSets();
    setVocabulary(vocab);
    setSets(allSets);
  };

  if (activeGame === 'matching' && activeSet) {
    return (
      <MatchingGame
        set={activeSet}
        vocabulary={vocabulary}
        repetitions={gameRepetitions}
        onExit={() => {
          setActiveGame(null);
          setActiveSet(null);
          setCurrentView('practice');
        }}
      />
    );
  }

  if (activeGame === 'flashcard' && activeSet) {
    return (
      <FlashcardDrill
        set={activeSet}
        vocabulary={vocabulary}
        startingSide={flashcardStartingSide}
        onExit={() => {
          setActiveGame(null);
          setActiveSet(null);
          setCurrentView('practice');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="bg-white shadow-md p-4 sm:p-6 mb-4 sm:mb-6 rounded-lg sm:rounded-none">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Japanese Vocabulary Practice</h1>
        </header>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => setCurrentView('vocab')}
            className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all ${
              currentView === 'vocab'
                ? 'bg-blue-500 text-white'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <Book size={20} /> Vocabulary
          </button>
          <button
            onClick={() => setCurrentView('sets')}
            className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all ${
              currentView === 'sets'
                ? 'bg-blue-500 text-white'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <Layers size={20} /> Sets
          </button>
          <button
            onClick={() => setCurrentView('practice')}
            className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all ${
              currentView === 'practice'
                ? 'bg-blue-500 text-white'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <Play size={20} /> Practice
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          {currentView === 'vocab' && (
            <VocabularyManager vocabulary={vocabulary} onRefresh={loadData} />
          )}
          {currentView === 'sets' && (
            <SetManager vocabulary={vocabulary} sets={sets} onRefresh={loadData} />
          )}
          {currentView === 'practice' && (
            <PracticeSelector
              sets={sets}
              vocabulary={vocabulary}
              onStartGame={(set, reps) => {
                setActiveSet(set);
                setGameRepetitions(reps);
                setActiveGame('matching');
              }}
              onStartFlashcard={(set, side) => {
                setActiveSet(set);
                setFlashcardStartingSide(side);
                setActiveGame('flashcard');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
