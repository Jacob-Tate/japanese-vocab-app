// src/components/FlashcardDrillSentences.jsx
import React, { useState, useEffect } from 'react';
import { RotateCcw, Volume2 } from 'lucide-react';
import { playAudio } from '../utils/audio';
import { api } from '../api';

export default function FlashcardDrillSentences({ set, sentences, onExit, startingSide = 'japanese', audioMode = false }) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studied, setStudied] = useState(0);
  const [viewedCardIds, setViewedCardIds] = useState(new Set());

  useEffect(() => {
    const setSentences = sentences.filter(s => set.sentenceIds.includes(s.id));
    const shuffled = [...setSentences].sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, []);

  useEffect(() => {
    // Autoplay audio in audio-only mode when a new card is shown
    if (audioMode && startingSide === 'japanese' && !showAnswer && cards.length > 0) {
      playAudio(cards[currentIndex]);
    }
  }, [currentIndex, cards, showAnswer, audioMode, startingSide]);

  useEffect(() => {
    if (cards.length > 0) {
      setViewedCardIds(prev => new Set(prev).add(cards[currentIndex].id));
    }
  }, [currentIndex, cards]);

  const handleFlip = () => {
    setShowAnswer(!showAnswer);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      if (!showAnswer) {
        setStudied(studied + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const handleExit = async () => {
    if (viewedCardIds.size > 0) {
      const reviewedSentences = Array.from(viewedCardIds).map(id => {
        return sentences.find(s => s.id === id)?.japanese;
      }).filter(Boolean);

      const payload = {
        gameMode: 'flashcard_sentences',
        score: 0,
        metadata: {
          repetitions: viewedCardIds.size,
          words: reviewedSentences.map(s => s.substring(0, 20) + '...').join(', '),
        },
      };

      if (set.sourceSetIds) {
        payload.setIds = set.sourceSetIds;
      } else {
        payload.setId = set.id;
      }
      
      try {
        await api.saveGameSession(payload);
      } catch (error) {
        console.error('Failed to save sentence flashcard session:', error);
      }
    }
    onExit();
  };

  if (cards.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6 text-center">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Sentence Flashcards: {set.name}</h2>
        <p className="text-red-500 dark:text-red-400">This set has no sentences to practice.</p>
        <button onClick={onExit} className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
          Back
        </button>
    </div>
  );

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;
    
  const frontSide = startingSide === 'japanese' ? currentCard.japanese : currentCard.english;
  const backSide = startingSide === 'japanese' ? currentCard.english : currentCard.japanese;
  const frontLabel = startingSide === 'japanese' ? 'Japanese' : 'English';
  const backLabel = startingSide === 'japanese' ? 'English' : 'Japanese';
  const isFrontAudioOnly = audioMode && startingSide === 'japanese';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold dark:text-white">Sentence Flashcards: {set.name}</h2>
        <button
          onClick={handleExit}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto"
        >
          Exit
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <span>Studied: {studied}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-2xl">
          <div
            onClick={handleFlip}
            className="w-full h-64 sm:h-80 bg-white dark:bg-gray-700 rounded-2xl shadow-2xl cursor-pointer flex items-center justify-center p-6 sm:p-8 mb-6 hover:shadow-3xl transition-all"
          >
            <div className="text-center">
              {isFrontAudioOnly && !showAnswer ? (
                <div className="flex flex-col items-center justify-center">
                  <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">Listen and recall</p>
                  <Volume2 size={64} className="text-blue-500" />
                </div>
              ) : (
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 break-words dark:text-white">
                  {showAnswer ? backSide : frontSide}
                </p>
              )}
              <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm mt-2">
                {showAnswer ? `(${backLabel})` : `(${frontLabel})`} - Click to flip
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              playAudio(currentCard);
            }}
            className="absolute top-4 right-4 bg-blue-500 text-white rounded-full p-3 hover:bg-blue-600 transition-transform hover:scale-110"
            title="Play audio"
          >
            <Volume2 size={24} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-4 sm:px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleShuffle}
            className="px-4 sm:px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} /> Shuffle
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            className="px-4 sm:px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
