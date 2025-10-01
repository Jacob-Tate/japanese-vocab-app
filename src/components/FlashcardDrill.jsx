// src/components/FlashcardDrill.jsx
import React, { useState, useEffect } from 'react';
import { RotateCcw, Volume2 } from 'lucide-react';

// Simple Text-to-Speech utility
const speak = (text, lang = 'ja-JP') => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  } else {
    alert('Sorry, your browser does not support text-to-speech.');
  }
};

export default function FlashcardDrill({ set, vocabulary, onExit, startingSide = 'japanese' }) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studied, setStudied] = useState(0);

  useEffect(() => {
    const words = vocabulary.filter(v => set.wordIds.includes(v.id));
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, []);

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

  if (cards.length === 0) return <div>Loading...</div>;

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;
  
  const frontSide = startingSide === 'japanese' ? currentCard.japanese : currentCard.english;
  const backSide = startingSide === 'japanese' ? currentCard.english : currentCard.japanese;
  const frontLabel = startingSide === 'japanese' ? 'Japanese' : 'English';
  const backLabel = startingSide === 'japanese' ? 'English' : 'Japanese';

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Flashcards: {set.name}</h2>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 w-full sm:w-auto"
        >
          Exit
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <span>Studied: {studied}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
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
            className="w-full h-64 sm:h-80 bg-white rounded-2xl shadow-2xl cursor-pointer flex items-center justify-center p-6 sm:p-8 mb-6 hover:shadow-3xl transition-all"
          >
            <div className="text-center">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 break-words">
                {showAnswer ? backSide : frontSide}
              </p>
              <p className="text-gray-400 text-xs sm:text-sm">
                {showAnswer ? `(${backLabel})` : `(${frontLabel})`} - Click to flip
              </p>
            </div>
          </div>
          {((startingSide === 'japanese' && !showAnswer) || (startingSide === 'english' && showAnswer)) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                speak(currentCard.japanese);
              }}
              className="absolute top-4 right-4 bg-blue-500 text-white rounded-full p-3 hover:bg-blue-600 transition-transform hover:scale-110"
              title="Pronounce Japanese word"
            >
              <Volume2 size={24} />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-4 sm:px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
