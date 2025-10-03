// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Book, Layers, Play, MessageSquare, BarChart3, Download, Moon, Sun } from 'lucide-react';
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
import Statistics from './components/Statistics';
import ImportExport from './components/ImportExport';
import ReloadPrompt from './ReloadPrompt';
import TypingBlitz from './components/TypingBlitz';
import SrsPractice from './components/SrsPractice';
import KanaPractice from './components/KanaPractice';
import CountersQuiz from './components/CountersQuiz';

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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadData();
    // Load dark mode preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

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
    typingBlitz: <TypingBlitz set={activeSet} vocabulary={vocabulary} onExit={exitGame} fallingLanguage={flashcardStartingSide} romajiMode={romajiMode} />,
    srs: <SrsPractice set={activeSet} onExit={exitGame} />,
    kanaPractice: <KanaPractice onExit={exitGame} />,
    countersQuiz: <CountersQuiz onExit={exitGame} />,
  };

  if (activeGame && gameComponents[activeGame]) {
    if (activeGame === 'kanaPractice' || activeGame === 'countersQuiz') {
      return gameComponents[activeGame];
    }
    if (activeSet) {
      return gameComponents[activeGame];
    }
  }

  return (
    <>
      <ReloadPrompt />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="bg-white dark:bg-gray-800 shadow-md p-4 sm:p-6 mb-4 sm:mb-6 rounded-lg sm:rounded-none transition-colors duration-200">
            <div className="flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Japanese Vocabulary Practice</h1>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={24} className="text-yellow-400" /> : <Moon size={24} className="text-gray-600" />}
              </button>
            </div>
          </header>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 overflow-x-auto">
            <button onClick={() => setCurrentView('vocab')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${currentView === 'vocab' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <Book size={20} /> Vocabulary
            </button>
            <button onClick={() => setCurrentView('sentences')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${currentView === 'sentences' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <MessageSquare size={20} /> Sentences
            </button>
            <button onClick={() => setCurrentView('sets')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${currentView === 'sets' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <Layers size={20} /> Sets
            </button>
            <button onClick={() => setCurrentView('practice')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${currentView === 'practice' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <Play size={20} /> Practice
            </button>
            <button onClick={() => setCurrentView('stats')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${currentView === 'stats' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <BarChart3 size={20} /> Stats
            </button>
            <button onClick={() => setCurrentView('import')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${currentView === 'import' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <Download size={20} /> Data
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-colors duration-200">
            {currentView === 'vocab' && <VocabularyManager vocabulary={vocabulary} sets={sets} onRefresh={loadData} />}
            {currentView === 'sentences' && <SentenceManager sentences={sentences} onRefresh={loadData} />}
            {currentView === 'sets' && <SetManager vocabulary={vocabulary} sentences={sentences} sets={sets} onRefresh={loadData} />}
            {currentView === 'practice' && (
              <PracticeSelector
                sets={sets}
                vocabulary={vocabulary}
                onStartGame={(set, reps) => { setActiveSet(set); setGameRepetitions(reps); setActiveGame('matching'); }}
                onStartSpeedMatch={(set, reps) => { setActiveSet(set); setGameRepetitions(reps); setActiveGame('speedmatch'); }}
                onStartFlashcard={(set, side) => { setActiveSet(set); setFlashcardStartingSide(side); setActiveGame('flashcard'); }}
                onStartQuiz={(set, side, count) => { setActiveSet(set); setFlashcardStartingSide(side); setQuestionCount(count); setActiveGame('quiz'); }}
                onStartTyping={(set, side, count, romaji) => { setActiveSet(set); setFlashcardStartingSide(side); setQuestionCount(count); setRomajiMode(romaji); setActiveGame('typing'); }}
                onStartTypingBlitz={(set, side, romaji) => { setActiveSet(set); setFlashcardStartingSide(side); setRomajiMode(romaji); setActiveGame('typingBlitz'); }}
                onStartMemory={(set) => { setActiveSet(set); setActiveGame('memory'); }}
                onStartAudioQuiz={(set, count) => { setActiveSet(set); setQuestionCount(count); setActiveGame('audioQuiz'); }}
                onStartSentenceScramble={(set) => { setActiveSet(set); setActiveGame('sentenceScramble'); }}
                onStartSrs={(set) => { setActiveSet(set); setActiveGame('srs'); }}
                onStartKanaPractice={() => setActiveGame('kanaPractice')}
                onStartCountersQuiz={() => setActiveGame('countersQuiz')}
              />
            )}
            {currentView === 'stats' && <Statistics />}
            {currentView === 'import' && <ImportExport onRefresh={loadData} />}
          </div>
        </div>
      </div>
    </>
  );
}
