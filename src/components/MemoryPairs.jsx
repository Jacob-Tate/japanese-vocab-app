// src/components/MemoryPairs.jsx
import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy } from 'lucide-react';
import { api } from '../api';

export default function MemoryPairs({ set, vocabulary, onExit }) {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [gridSize, setGridSize] = useState(4);
  const [bestScore, setBestScore] = useState(null);
  const [isNewBest, setIsNewBest] = useState(false);

  useEffect(() => {
    initGame();
  }, [gridSize]);

  useEffect(() => {
    loadHighScore();
  }, [gridSize, set.id]);
      
  const loadHighScore = async () => {
    try {
      const result = await api.getHighScore(set.id, 'memory');
      if (result) {
        const metadata = result.metadata ? JSON.parse(result.metadata) : {};
        if (metadata.gridSize === gridSize) {
          setBestScore(result.score);
        } else {
          setBestScore(null);
        }
      } else {
        setBestScore(null);
      }
    } catch (error) {
      console.error('Failed to load high score:', error);
      setBestScore(null);
    }
  };

  const saveGameCompletion = async (finalMoves) => {
    // Always save the game session for statistics
    try {
      await api.saveGameSession(set.id, 'memory', finalMoves, { gridSize });
    } catch (error) {
      console.error('Failed to save game session:', error);
    }

    // Check if it's a new best score (lower is better for memory game)
    if (!bestScore || finalMoves < bestScore) {
      try {
        await api.saveHighScore(set.id, 'memory', finalMoves, { gridSize });
        setBestScore(finalMoves);
        setIsNewBest(true);
      } catch (error) {
        console.error('Failed to save high score:', error);
      }
    }
  };

  const initGame = () => {
    const words = vocabulary.filter(v => set.wordIds.includes(v.id));
    const pairsNeeded = (gridSize * gridSize) / 2;
            
    if (words.length < pairsNeeded) {
        setCards([]);
        return;
    }
            
    const selectedWords = [...words].sort(() => 0.5 - Math.random()).slice(0, pairsNeeded);

    const gameCards = [];
    selectedWords.forEach((word, index) => {
      gameCards.push({
        id: `${index}-jp`,
        pairId: index,
        text: word.japanese,
        type: 'japanese',
        matched: false
      });
      gameCards.push({
        id: `${index}-en`,
        pairId: index,
        text: word.english,
        type: 'english',
        matched: false
      });
    });

    const shuffled = gameCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
    setMatchedCards([]);
    setMoves(0);
    setIsComplete(false);
    setIsNewBest(false);
  };

  const handleCardClick = (cardId) => {
    if (
      flippedCards.length >= 2 ||
      flippedCards.includes(cardId) ||
      matchedCards.includes(cardId)
    ) {
      return;
    }

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const currentMoves = moves + 1;
      setMoves(currentMoves);
      const card1 = cards.find(c => c.id === newFlipped[0]);
      const card2 = cards.find(c => c.id === newFlipped[1]);

      if (card1.pairId === card2.pairId) {
        setTimeout(() => {
          const newMatched = [...matchedCards, ...newFlipped];
          setMatchedCards(newMatched);
          setFlippedCards([]);

          if (newMatched.length === cards.length) {
            setIsComplete(true);
            saveGameCompletion(currentMoves);
          }
        }, 500);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const isCardFlipped = (cardId) => {
    return flippedCards.includes(cardId) || matchedCards.includes(cardId);
  };

  const isCardMatched = (cardId) => {
    return matchedCards.includes(cardId);
  };
      
  const pairsNeeded = (gridSize * gridSize) / 2;
  const hasEnoughWords = vocabulary.filter(v => set.wordIds.includes(v.id)).length >= pairsNeeded;

  if (!hasEnoughWords) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 dark:text-white">Memory Pairs: {set.name}</h2>
            <p className="text-red-500 dark:text-red-400">
                This set needs at least {pairsNeeded} words for a {gridSize}x{gridSize} grid.
            </p>
            <button onClick={onExit} className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                Back
            </button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold dark:text-white">Memory Pairs: {set.name}</h2>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto"
        >
          Exit
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-4">
          <div className="bg-white dark:bg-gray-700 rounded-lg px-4 py-2 shadow">
            <span className="text-sm text-gray-600 dark:text-gray-400">Moves: </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{moves}</span>
          </div>
          {bestScore !== null && (
            <div className="bg-white dark:bg-gray-700 rounded-lg px-4 py-2 shadow flex items-center gap-2">
              <Trophy size={20} className="text-yellow-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Best: </span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{bestScore}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setGridSize(4)}
            className={`px-3 py-1 rounded ${gridSize === 4 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          >
            4×4
          </button>
          <button
            onClick={() => setGridSize(6)}
            className={`px-3 py-1 rounded ${gridSize === 6 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          >
            6×6
          </button>
        </div>
      </div>

      {isComplete ? (
        <div className="bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 border-2 border-green-500 dark:border-green-600 rounded-lg p-6 sm:p-8 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-green-300 mb-4">Complete!</h3>
          <p className="text-xl mb-2 dark:text-white">Total Moves: <span className="font-bold">{moves}</span></p>
          {isNewBest && (
            <p className="text-yellow-600 dark:text-yellow-400 font-bold mb-4 flex items-center justify-center gap-2">
              <Trophy size={24} /> New Best Score!
            </p>
          )}
          <button
            onClick={initGame}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 flex items-center gap-2 mx-auto"
          >
            <RotateCcw size={20} /> Play Again
          </button>
        </div>
      ) : (
        <div
          className={`grid gap-2 sm:gap-3 mx-auto max-w-4xl`}
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={isCardFlipped(card.id)}
              className={`aspect-square rounded-lg transition-all duration-300 transform ${
                isCardFlipped(card.id)
                  ? isCardMatched(card.id)
                    ? 'bg-green-500 text-white scale-95'
                    : 'bg-blue-500 text-white'
                  : 'bg-gradient-to-br from-purple-400 to-blue-400 hover:scale-105 shadow-lg'
              } flex items-center justify-center font-bold text-xs sm:text-sm md:text-base p-2 cursor-pointer`}
              style={{
                height: gridSize === 6 ? 'auto' : 'auto'
              }}
            >
              {isCardFlipped(card.id) ? (
                <span className="text-center break-words">{card.text}</span>
              ) : (
                <span className="text-4xl sm:text-5xl">?</span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Click cards to flip them. Match Japanese words with their English translations!</p>
      </div>
    </div>
  );
}
