// src/components/SrsPractice.jsx
import React, { useState, useEffect } from 'react';
import { Brain, RotateCcw, Check, X } from 'lucide-react';
import { api } from '../api';

export default function SrsPractice({ set, onExit }) {
  const [dueWords, setDueWords] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionResults, setSessionResults] = useState({ correct: 0, incorrect: 0, reCorrect: 0 });
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  useEffect(() => {
    loadSrsData();
  }, [set.id]);

  const loadSrsData = async () => {
    setIsLoading(true);
    try {
      const [due, srsStats] = await Promise.all([
        api.getDueSrsWords(set.id),
        api.getSrsStats(set.id)
      ]);
      // originalAttempt tracks the status within this session: 'pending', 'incorrect'
      setDueWords(due.map(word => ({ ...word, originalAttempt: 'pending' })));
      
      setStats(srsStats);
      if (due.length === 0) {
        setIsSessionComplete(true);
      }
    } catch (error) {
      console.error("Failed to load SRS data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (quality) => {
    if (currentIndex >= dueWords.length) return;

    const currentWord = dueWords[currentIndex];
        
    // Logic for an incorrect answer
    if (quality === 'incorrect') {
      // Only log the failure to the backend on the FIRST incorrect attempt this session
      if (currentWord.originalAttempt === 'pending') {
        await api.postSrsReview(currentWord.id, 'incorrect');
        setSessionResults(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
      }

      // Re-insert the failed word a few places ahead in the queue to be reviewed again soon.
      const wordToRequeue = { ...currentWord, originalAttempt: 'incorrect' };
      let newQueue = [...dueWords.slice(0, currentIndex), ...dueWords.slice(currentIndex + 1)];
      const reinsertIndex = Math.min(currentIndex + 2, newQueue.length); // Insert 2 spots away or at the end
      newQueue.splice(reinsertIndex, 0, wordToRequeue);
            
      setDueWords(newQueue);
      setShowAnswer(false);
        
      // Logic for a correct answer
    } else {
      
      // Only log a "correct" review to the backend if it was correct on the first try.
      // This prevents overriding the "incorrect" status which correctly schedules it for tomorrow.
      if (currentWord.originalAttempt === 'pending') {
        await api.postSrsReview(currentWord.id, 'correct');
        setSessionResults(prev => ({ ...prev, correct: prev.correct + 1 }));
      } else {
        // If it was previously incorrect, we just count it as re-learned for the session stats.
        setSessionResults(prev => ({ ...prev, reCorrect: prev.reCorrect + 1 }));
      }
            
      // Remove the word from the session queue
      const newQueue = [...dueWords.slice(0, currentIndex), ...dueWords.slice(currentIndex + 1)];
      setDueWords(newQueue);
      setShowAnswer(false);
            
      // If the queue is now empty, the session is over.
      if (newQueue.length === 0) {
        setIsSessionComplete(true);
      } else if (currentIndex >= newQueue.length) {
        // If we removed the last item, adjust index to prevent errors
        setCurrentIndex(newQueue.length - 1);
      }
    }
  };

  const startNewSession = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionResults({ correct: 0, incorrect: 0, reCorrect: 0 });
    setIsSessionComplete(false);
    loadSrsData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6 text-center">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Spaced Repetition</h2>
        <p className="dark:text-gray-300">Loading your review session...</p>
      </div>
    );
  }
    
  const currentCard = !isSessionComplete && dueWords.length > 0 ? dueWords[currentIndex] : null;

  if (isSessionComplete) {
    const totalReviewed = sessionResults.correct + sessionResults.incorrect;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 dark:text-white">SRS Session Complete!</h2>
        {totalReviewed === 0 ? (
          <p className="text-lg mb-4 dark:text-gray-300">🎉 No words due for review right now. Great job staying on top of your studies!</p>
        ) : (
          <div>
            <p className="text-lg mb-4 dark:text-gray-300">You reviewed {totalReviewed} unique words.</p>
            <div className="flex justify-center gap-6 mb-6">
              <div className="text-green-600 dark:text-green-400">
                <div className="text-4xl font-bold">{sessionResults.correct}</div>
                <div>Correct</div>
              </div>
              <div className="text-red-600 dark:text-red-400">
                <div className="text-4xl font-bold">{sessionResults.incorrect}</div>
                <div>Incorrect</div>
              </div>
              {sessionResults.reCorrect > 0 && (
                <div className="text-blue-600 dark:text-blue-400">
                  <div className="text-4xl font-bold">{sessionResults.reCorrect}</div>
                  <div>Re-learned</div>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={startNewSession} className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2">
            <RotateCcw size={20} /> Check for More Reviews
          </button>
          <button onClick={onExit} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
            Exit
          </button>
        </div>
      </div>
    );
  }
    
  const progress = ((currentIndex + 1) / dueWords.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 dark:text-white">
          <Brain className="text-cyan-500" /> Spaced Repetition: {set.name}
        </h2>
        <button onClick={onExit} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Exit</button>
      </div>
            
      <div className="mb-4">
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Words Remaining: {dueWords.length}</span>
          <span>{stats ? `${stats.due_count} originally due` : ''}</span>
        </div>
      </div>
            
      <div className="flex flex-col items-center">
        <div 
          onClick={() => setShowAnswer(true)}
          className="w-full max-w-2xl h-64 sm:h-80 bg-white dark:bg-gray-700 rounded-2xl shadow-2xl flex items-center justify-center p-6 sm:p-8 mb-6 transition-all cursor-pointer"
        >
          <div className="text-center">
            <p className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 break-words dark:text-white">
              {currentCard.japanese}
            </p>
            {showAnswer && (
              <p className="text-2xl sm:text-3xl text-gray-700 dark:text-gray-300">{currentCard.english}</p>
            )}
            {!showAnswer && (
              <p className="text-gray-400 dark:text-gray-500 text-sm">Click to show answer</p>
            )}
          </div>
        </div>

        {showAnswer ? (
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
            <button
              onClick={() => handleReview('incorrect')}
              className="flex-1 bg-red-500 text-white px-6 py-4 rounded-lg hover:bg-red-600 font-semibold text-lg flex items-center justify-center gap-2"
            >
              <X /> I forgot
            </button>
            <button
              onClick={() => handleReview('correct')}
              className="flex-1 bg-green-500 text-white px-6 py-4 rounded-lg hover:bg-green-600 font-semibold text-lg flex items-center justify-center gap-2"
            >
              <Check /> I knew it
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAnswer(true)}
            className="w-full max-w-md bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold text-lg"
          >
            Show Answer
          </button>
        )}
      </div>
    </div>
  );
}
