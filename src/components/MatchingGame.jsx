import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export default function MatchingGame({ set, vocabulary, onExit, repetitions = 3 }) {
  const [gameWords, setGameWords] = useState([]);
  const [leftItems, setLeftItems] = useState([]);
  const [rightItems, setRightItems] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matched, setMatched] = useState([]);
  const [grayedOut, setGrayedOut] = useState([]);
  const [wrongMatch, setWrongMatch] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const words = vocabulary.filter(v => set.wordIds.includes(v.id));
    
    const expanded = [];
    words.forEach(word => {
      for (let i = 0; i < repetitions; i++) {
        expanded.push({ ...word, instanceId: `${word.id}-${i}` });
      }
    });
    
    setGameWords(expanded);
    setMatched([]);
    setGrayedOut([]);
    setScore(0);
    loadNextPairs(expanded, []);
  };

  const loadNextPairs = (wordsPool, currentMatched) => {
    const available = wordsPool.filter(w => !currentMatched.includes(w.instanceId));
    
    if (available.length === 0) {
      return;
    }

    const shuffledAvailable = [...available].sort(() => Math.random() - 0.5);

    const uniqueWords = [];
    const seenIds = new Set();
    
    for (const word of shuffledAvailable) {
      if (!seenIds.has(word.id)) {
        seenIds.add(word.id);
        uniqueWords.push(word);
        if (uniqueWords.length >= 5) break;
      }
    }
    
    const newLeftItems = uniqueWords.map(w => ({
      instanceId: w.instanceId,
      text: w.japanese,
      id: w.id
    }));
    
    const newRightItems = uniqueWords.map(w => ({
      instanceId: w.instanceId,
      text: w.english,
      id: w.id
    }));

    setLeftItems(newLeftItems.sort(() => Math.random() - 0.5));
    setRightItems(newRightItems.sort(() => Math.random() - 0.5));
  };

  const handleLeftClick = (item) => {
    if (grayedOut.includes(item.instanceId)) return;
    setSelectedLeft(item);
    if (selectedRight) {
      checkMatch(item, selectedRight);
    }
  };

  const handleRightClick = (item) => {
    if (grayedOut.includes(item.instanceId)) return;
    setSelectedRight(item);
    if (selectedLeft) {
      checkMatch(selectedLeft, item);
    }
  };

  const checkMatch = (left, right) => {
    if (left.id === right.id) {
      const newMatched = [...matched, left.instanceId, right.instanceId];
      const newGrayedOut = [...grayedOut, left.instanceId, right.instanceId];
      setMatched(newMatched);
      setScore(score + 1);
      
      const available = gameWords.filter(w => !newMatched.includes(w.instanceId));
      
      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
        
        if (available.length === 0) {
          // Game complete - clear all items from screen
          setLeftItems([]);
          setRightItems([]);
          setGrayedOut([]);
          return;
        }
        
        setGrayedOut(newGrayedOut);
        
        if (newGrayedOut.length >= 6) {
          const remainingLeft = leftItems.filter(i => !newGrayedOut.includes(i.instanceId));
          const remainingRight = rightItems.filter(i => !newGrayedOut.includes(i.instanceId));
          
          const shuffledAvailable = [...available].sort(() => Math.random() - 0.5);
          const currentWordIds = new Set([...remainingLeft, ...remainingRight].map(item => item.id));
          const newWords = [];
          const newWordIds = new Set();
          
          for (const word of shuffledAvailable) {
            if (!currentWordIds.has(word.id) && !newWordIds.has(word.id) && newWords.length < 3) {
              newWords.push(word);
              newWordIds.add(word.id);
            }
          }
          
          const newLeftItems = newWords.map(w => ({
            instanceId: w.instanceId,
            text: w.japanese,
            id: w.id
          }));
          
          const newRightItems = newWords.map(w => ({
            instanceId: w.instanceId,
            text: w.english,
            id: w.id
          }));
          
          setLeftItems([...remainingLeft, ...newLeftItems].sort(() => Math.random() - 0.5));
          setRightItems([...remainingRight, ...newRightItems].sort(() => Math.random() - 0.5));
          setGrayedOut([]);
        }
      }, 500);
    } else {
      setWrongMatch(true);
      setTimeout(() => {
        setWrongMatch(false);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 500);
    }
  };

  const remainingWords = gameWords.length - (matched.length / 2);
  const isGameComplete = matched.length === gameWords.length * 2;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Matching Game: {set.name}</h2>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 w-full sm:w-auto"
        >
          Exit
        </button>
      </div>

      <div className="mb-4 text-sm sm:text-lg">
        Score: <span className="font-bold text-blue-600">{score}</span> | 
        Remaining: <span className="font-bold">{remainingWords}</span> | 
        Showing: <span className="font-bold">{leftItems.length}</span>
      </div>

      {isGameComplete ? (
        <div className="bg-green-100 border-2 border-green-500 rounded-lg p-6 sm:p-8 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-green-700 mb-4">🎉 Complete!</h3>
          <p className="text-lg sm:text-xl mb-4">Final Score: {score}</p>
          <button
            onClick={initGame}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 flex items-center gap-2 mx-auto"
          >
            <RotateCcw size={20} /> Play Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3">Japanese</h3>
            <div className="space-y-2">
              {leftItems.map((item) => (
                <button
                  key={item.instanceId}
                  onClick={() => handleLeftClick(item)}
                  disabled={grayedOut.includes(item.instanceId)}
                  className={`w-full p-3 sm:p-4 rounded-lg text-left font-medium transition-all text-sm sm:text-base ${
                    grayedOut.includes(item.instanceId)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : wrongMatch && selectedLeft?.instanceId === item.instanceId
                      ? 'bg-red-500 text-white'
                      : selectedLeft?.instanceId === item.instanceId
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {item.text}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3">English</h3>
            <div className="space-y-2">
              {rightItems.map((item) => (
                <button
                  key={item.instanceId}
                  onClick={() => handleRightClick(item)}
                  disabled={grayedOut.includes(item.instanceId)}
                  className={`w-full p-3 sm:p-4 rounded-lg text-left font-medium transition-all text-sm sm:text-base ${
                    grayedOut.includes(item.instanceId)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : wrongMatch && selectedRight?.instanceId === item.instanceId
                      ? 'bg-red-500 text-white'
                      : selectedRight?.instanceId === item.instanceId
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
