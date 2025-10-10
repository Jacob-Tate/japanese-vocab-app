// src/components/SrsPracticeSentences.jsx
import React, { useState, useEffect } from 'react';
import { Brain, RotateCcw, Volume2 } from 'lucide-react';
import { api } from '../api';
import { playAudio } from '../utils/audio';

export default function SrsPracticeSentences({ set, onExit, options }) {
  const [dueSentences, setDueSentences] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionResults, setSessionResults] = useState({ correct: 0, incorrect: 0 });
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  const currentCard = !isSessionComplete && dueSentences.length > 0 ? dueSentences[0] : null;

  useEffect(() => {
    loadSrsData();
  }, [set.id, options.reviewOnly]);

  useEffect(() => {
    // Autoplay audio when a new card is shown
    if (currentCard) {
      playAudio(currentCard);
    }
  }, [currentCard]);

  const loadSrsData = async () => {
    setIsLoading(true);
    try {
      const [due, srsStats] = await Promise.all([
        api.getDueSrsSentences(set.id, options),
        api.getSrsStatsSentences(set.id)
      ]);
      setDueSentences(due);
      setStats(srsStats);
      if (due.length === 0) {
        setIsSessionComplete(true);
      }
    } catch (error) {
      console.error("Failed to load Sentence SRS data:", error);
      setDueSentences([]);
      setIsSessionComplete(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (quality) => {
    if (dueSentences.length === 0) return;

    const currentSentence = dueSentences[0];
    await api.postSrsReviewSentence(currentSentence.id, quality);

    if (quality === 'again') {
        setSessionResults(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
        const sentenceToRequeue = { ...currentSentence };
        let newQueue = [...dueSentences.slice(1)];
        const reinsertIndex = Math.min(3, newQueue.length);
        newQueue.splice(reinsertIndex, 0, sentenceToRequeue);
        setDueSentences(newQueue);
    } else {
        setSessionResults(prev => ({ ...prev, correct: prev.correct + 1 }));
        const newQueue = dueSentences.slice(1);
        setDueSentences(newQueue);

        if (newQueue.length === 0) {
            setIsSessionComplete(true);
            return;
        }
    }
    setShowAnswer(false);
  };
  
  const startNewSession = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionResults({ correct: 0, incorrect: 0 });
    setIsSessionComplete(false);
    loadSrsData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6 text-center">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Sentence Spaced Repetition</h2>
        <p className="dark:text-gray-300">Loading your review session...</p>
      </div>
    );
  }

  if (isSessionComplete || !currentCard) {
    const totalReviewed = sessionResults.correct + sessionResults.incorrect;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 dark:text-white">SRS Session Complete!</h2>
        {totalReviewed === 0 ? (
          <p className="text-lg mb-4 dark:text-gray-300">🎉 No sentences due for review right now. Well done!</p>
        ) : (
          <div>
            <p className="text-lg mb-4 dark:text-gray-300">You reviewed {totalReviewed} unique sentences.</p>
            <div className="flex justify-center gap-6 mb-6">
              <div className="text-green-600 dark:text-green-400"><div className="text-4xl font-bold">{sessionResults.correct}</div><div>Correct</div></div>
              <div className="text-red-600 dark:text-red-400"><div className="text-4xl font-bold">{sessionResults.incorrect}</div><div>Incorrect</div></div>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={startNewSession} className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"><RotateCcw size={20} /> Check for More</button>
          <button onClick={onExit} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Exit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 dark:text-white"><Brain className="text-cyan-500" /> Sentence SRS: {set.name}</h2>
        <button onClick={onExit} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Exit</button>
      </div>
      <div className="mb-4">
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Sentences Remaining: {dueSentences.length}</span>
          <span>{stats ? `${stats.due_count} originally due` : ''}</span>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-2xl">
          <div onClick={() => setShowAnswer(true)} className="w-full h-64 sm:h-80 bg-white dark:bg-gray-700 rounded-2xl shadow-2xl flex items-center justify-center p-6 sm:p-8 mb-6 transition-all cursor-pointer">
            <div className="text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 break-words dark:text-white">{currentCard.japanese}</p>
              {showAnswer && (<p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300">{currentCard.english}</p>)}
              {!showAnswer && (<p className="text-gray-400 dark:text-gray-500 text-sm">Click to show answer</p>)}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (currentCard) playAudio(currentCard);
            }}
            className="absolute top-4 right-4 bg-blue-500 text-white rounded-full p-3 hover:bg-blue-600 transition-transform hover:scale-110"
            title="Play audio"
          >
            <Volume2 size={24} />
          </button>
        </div>
        {showAnswer ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-3xl">
             <button
              onClick={() => handleReview('again')}
              className="p-4 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600"
            >
              Again
            </button>
             <button
              onClick={() => handleReview('hard')}
              className="p-4 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600"
            >
              Hard
            </button>
            <button
              onClick={() => handleReview('good')}
              className="p-4 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600"
            >
              Good
            </button>
            <button
              onClick={() => handleReview('easy')}
              className="p-4 rounded-lg font-semibold text-white bg-green-500 hover:bg-green-600"
            >
              Easy
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAnswer(true)} className="w-full max-w-md bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold text-lg">Show Answer</button>
        )}
      </div>
    </div>
  );
}
