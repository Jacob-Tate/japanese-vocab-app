// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Book, Layers, Play, MessageSquare } from 'lucide-react';
import { api } from './api';
import VocabularyManager from './components/VocabularyManager';
import SentenceManager from './components/SentenceManager';
import SetManager from './components/SetManager';
import MatchingGame from './components/MatchingGame';
import SpeedMatch from './components/SpeedMatch';
import FlashcardDrill from './components/FlashcardDrill';
import MultipleChoiceQuiz from './components/MultipleChoiceQuiz';
import TypingChallenge from './components/TypingChallenge';
import MemoryPairs from './components/MemoryPairs';
import AudioQuiz from './components/AudioQuiz';
import SentenceScramble from './components/SentenceScramble';
import PracticeSelector from './components/PracticeSelector';
import ReloadPrompt from './ReloadPrompt';
import TypingBlitz from './components/TypingBlitz';

export default function JapaneseVocabApp() {
  const [vocabulary, setVocabulary] = useState([]);
  const [sentences, setSentences] = useState([]);
  const [sets, setSets] = useState([]);
  const [currentView, setCurrentView] = useState('vocab');
  const [activeGame, setActiveGame] = useState(null);
  const [activeSet, setActiveSet] = useState(null);
  const [gameRepetitions, setGameRepetitions] = useState(3);
  const [flashcardStartingSide, setFlashcardStartingSide] = useState('japanese');
  const [questionCount, setQuestionCount] = useState(10);
  const [romajiMode, setRomajiMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const vocab = await api.getAllVocab();
    const allSentences = await api.getAllSentences();
    const allSets = await api.getAllSets();
    setVocabulary(vocab);
    setSentences(allSentences);
    setSets(allSets);
  };

  const exitGame = () => {
    setActiveGame(null);
    setActiveSet(null);
    setCurrentView('practice');
  };

  const gameComponents = {
    matching: <MatchingGame set={activeSet} vocabulary={vocabulary} repetitions={gameRepetitions} onExit={exitGame} />,
    speedmatch: <SpeedMatch set={activeSet} vocabulary={vocabulary} repetitions={gameRepetitions} onExit={exitGame} />,
    flashcard: <FlashcardDrill set={activeSet} vocabulary={vocabulary} startingSide={flashcardStartingSide} onExit={exitGame} />,
    quiz: <MultipleChoiceQuiz set={activeSet} vocabulary={vocabulary} startingSide={flashcardStartingSide} questionCount={questionCount} onExit={exitGame} />,
    typing: <TypingChallenge set={activeSet} vocabulary={vocabulary} startingSide={flashcardStartingSide} questionCount={questionCount} romajiMode={romajiMode} onExit={exitGame} />,
    memory: <MemoryPairs set={activeSet} vocabulary={vocabulary} onExit={exitGame} />,
    audioQuiz: <AudioQuiz set={activeSet} vocabulary={vocabulary} questionCount={questionCount} onExit={exitGame} />,
    sentenceScramble: <SentenceScramble set={activeSet} sentences={sentences} onExit={exitGame} />,
    typingBlitz: <TypingBlitz set={activeSet} vocabulary={vocabulary} onExit={exitGame} />,
  };

  if (activeGame && activeSet && gameComponents[activeGame]) {
    return gameComponents[activeGame];
  }

  return (
    <> {/* Add a fragment to wrap the app and the prompt */}
      <ReloadPrompt /> {/* Add the reload prompt component */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="bg-white shadow-md p-4 sm:p-6 mb-4 sm:mb-6 rounded-lg sm:rounded-none">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Japanese Vocabulary Practice</h1>
          </header>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
            <button onClick={() => setCurrentView('vocab')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all ${currentView === 'vocab' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'}`}>
              <Book size={20} /> Vocabulary
            </button>
            <button onClick={() => setCurrentView('sentences')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all ${currentView === 'sentences' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'}`}>
              <MessageSquare size={20} /> Sentences
            </button>
            <button onClick={() => setCurrentView('sets')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all ${currentView === 'sets' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'}`}>
              <Layers size={20} /> Sets
            </button>
            <button onClick={() => setCurrentView('practice')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all ${currentView === 'practice' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'}`}>
              <Play size={20} /> Practice
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg">
            {currentView === 'vocab' && <VocabularyManager vocabulary={vocabulary} onRefresh={loadData} />}
            {currentView === 'sentences' && <SentenceManager sentences={sentences} onRefresh={loadData} />}
            {currentView === 'sets' && <SetManager vocabulary={vocabulary} sentences={sentences} sets={sets} onRefresh={loadData} />}
            {currentView === 'practice' && (
              <PracticeSelector
                sets={sets}
                onStartGame={(set, reps) => { setActiveSet(set); setGameRepetitions(reps); setActiveGame('matching'); }}
                onStartSpeedMatch={(set, reps) => { setActiveSet(set); setGameRepetitions(reps); setActiveGame('speedmatch'); }}
                onStartFlashcard={(set, side) => { setActiveSet(set); setFlashcardStartingSide(side); setActiveGame('flashcard'); }}
                onStartQuiz={(set, side, count) => { setActiveSet(set); setFlashcardStartingSide(side); setQuestionCount(count); setActiveGame('quiz'); }}
                onStartTyping={(set, side, count, romaji) => { setActiveSet(set); setFlashcardStartingSide(side); setQuestionCount(count); setRomajiMode(romaji); setActiveGame('typing'); }}
                onStartTypingBlitz={(set) => { setActiveSet(set); setActiveGame('typingBlitz'); }}
                onStartMemory={(set) => { setActiveSet(set); setActiveGame('memory'); }}
                onStartAudioQuiz={(set, count) => { setActiveSet(set); setQuestionCount(count); setActiveGame('audioQuiz'); }}
                onStartSentenceScramble={(set) => { setActiveSet(set); setActiveGame('sentenceScramble'); }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
