// src/components/TypingBlitz.jsx
import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Zap, Trophy } from 'lucide-react';
import { api } from '../api';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const WORD_SPEED = 0.5;
const INPUT_AREA_HEIGHT = 120;

export default function TypingBlitz({ set, vocabulary, onExit, fallingLanguage = 'japanese', romajiMode = false }) {
  const [userInput, setUserInput] = useState('');
  const [gameState, setGameState] = useState({
    words: [],
    score: 0,
    lives: 5,
    isGameOver: false,
  });
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
      
  const targetLanguage = fallingLanguage === 'japanese' ? 'english' : 'japanese';
  const gameStateRef = useRef(gameState);
  const gameLoopRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    loadHighScore();
  }, []);

  const loadHighScore = async () => {
    try {
      const result = await api.getHighScore(set.id, 'typing_blitz');
      if (result) {
        setHighScore(result.score);
      }
    } catch (error) {
      console.error('Failed to load high score:', error);
    }
  };

  const saveGameCompletion = async (finalScore) => {
    // Always save the game session for statistics
    try {
      await api.saveGameSession(set.id, 'typing_blitz', finalScore, { fallingLanguage, romajiMode });
    } catch (error) {
      console.error('Failed to save game session:', error);
    }

    // Check if it's a new high score
    if (finalScore > highScore) {
      try {
        await api.saveHighScore(set.id, 'typing_blitz', finalScore, { fallingLanguage, romajiMode });
        setHighScore(finalScore);
        setIsNewHighScore(true);
      } catch (error) {
        console.error('Failed to save high score:', error);
      }
    }
  };

  const createWord = () => {
    const wordsInSet = vocabulary.filter(v => set.wordIds.includes(v.id));
    if (wordsInSet.length === 0) return null;
    const vocab = wordsInSet[Math.floor(Math.random() * wordsInSet.length)];
    return {
      id: Math.random(),
      japanese: vocab.japanese,
      english: vocab.english,
      x: Math.random() * (GAME_WIDTH - 100),
      y: -20,
    };
  };
      
  const startGame = () => {
    const firstWord = createWord();
    setGameState({
      words: firstWord ? [firstWord] : [],
      score: 0,
      lives: 5,
      isGameOver: false,
    });
    setUserInput('');
    setIsNewHighScore(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    startGame();
  }, [set.id, fallingLanguage, romajiMode]);

  useEffect(() => {
    if (gameState.isGameOver) return;
            
    const wordInterval = setInterval(() => {
      const newWord = createWord();
      if (newWord) {
        setGameState(prev => ({ ...prev, words: [...prev.words, newWord] }));
      }
    }, 3000);

    return () => clearInterval(wordInterval);
  }, [gameState.isGameOver, set.id]);

  useEffect(() => {
    const gameTick = () => {
      if (gameStateRef.current.isGameOver) {
        return;
      }
                  
      let livesLost = 0;
      const updatedWords = gameStateRef.current.words
        .map(word => ({ ...word, y: word.y + WORD_SPEED }))
        .filter(word => {
          if (word.y > GAME_HEIGHT - INPUT_AREA_HEIGHT) {
            livesLost++;
            return false;
          }
          return true;
        });

      if (livesLost > 0) {
        const newLives = gameStateRef.current.lives - livesLost;
        const isGameOver = newLives <= 0;
        if (isGameOver) {
          saveGameCompletion(gameStateRef.current.score);
        }
        setGameState(prev => ({
          ...prev,
          words: updatedWords,
          lives: newLives > 0 ? newLives : 0,
          isGameOver,
        }));
      } else {
        setGameState(prev => ({ ...prev, words: updatedWords }));
      }

      gameLoopRef.current = requestAnimationFrame(gameTick);
    };

    gameLoopRef.current = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const typed = userInput.trim();
    if (!typed || gameState.isGameOver) return;

    let matchedWord;

    if (targetLanguage === 'english') {
      matchedWord = gameState.words.find(w => w.english.toLowerCase() === typed.toLowerCase());
    } else {
      let processedInput = typed;
      if (romajiMode && wanakana) {
        processedInput = wanakana.toHiragana(typed, { passRomaji: true });
      }
      matchedWord = gameState.words.find(w => 
        w.japanese === processedInput ||
        (wanakana && wanakana.toHiragana(w.japanese) === processedInput)
      );
    }
            
    if (matchedWord) {
      const newScore = gameState.score + 10;
      setGameState(prev => ({
        ...prev,
        score: newScore,
        words: prev.words.filter(word => word.id !== matchedWord.id),
      }));
      setUserInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 dark:text-white"><Zap className="text-yellow-500" /> Typing Blitz: {set.name}</h2>
        <button onClick={onExit} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Exit</button>
      </div>

      <div className="flex justify-around mb-4 bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
        <div className="text-lg dark:text-white">Score: <span className="font-bold text-green-600 dark:text-green-400">{gameState.score}</span></div>
        <div className="text-lg dark:text-white">Lives: <span className="font-bold text-red-600 dark:text-red-400">{'❤️'.repeat(Math.max(0, gameState.lives))}</span></div>
        {highScore > 0 && (
          <div className="text-lg flex items-center gap-1 dark:text-white">
            <Trophy size={20} className="text-yellow-500" />
            <span className="font-bold text-purple-600 dark:text-purple-400">{highScore}</span>
          </div>
        )}
      </div>

      {gameState.isGameOver ? (
        <div className="flex flex-col justify-center items-center bg-white dark:bg-gray-700 rounded-lg shadow-lg p-8 text-center" style={{ width: GAME_WIDTH, height: GAME_HEIGHT, maxWidth: '100%' }}>
          <h3 className="text-3xl font-bold mb-4 dark:text-white">Game Over!</h3>
          <p className="text-xl mb-2 dark:text-gray-300">Final Score: {gameState.score}</p>
          {highScore > 0 && <p className="text-sm mb-4 dark:text-gray-400">High Score: {highScore}</p>}
          {isNewHighScore && (
            <p className="text-yellow-600 dark:text-yellow-400 font-bold mb-4 flex items-center justify-center gap-2">
              <Trophy size={24} /> New High Score!
            </p>
          )}
          <button onClick={startGame} className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto"><RotateCcw /> Play Again</button>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg shadow-inner overflow-hidden relative" style={{ width: GAME_WIDTH, height: GAME_HEIGHT, maxWidth: '100%' }}>
          {gameState.words.map(word => (
            <div key={word.id} className="absolute text-white font-bold bg-indigo-500 px-3 py-1 rounded" style={{ left: word.x, top: word.y, fontSize: '1.2rem' }}>
              {word[fallingLanguage]}
            </div>
          ))}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-900/50 flex flex-col justify-end" style={{ height: INPUT_AREA_HEIGHT }}>
            {targetLanguage === 'japanese' && romajiMode && userInput && wanakana && (
              <div className="text-center mb-2 text-gray-400 transition-opacity duration-300">
                <span className="text-sm">Preview: </span>
                <span className="text-xl font-bold text-white">{wanakana.toHiragana(userInput, { passRomaji: true })}</span>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder={
                  targetLanguage === 'japanese' && romajiMode
                  ? "Type in romaji..."
                  : `Type ${targetLanguage} translation...`
                }
                className="w-full px-4 py-3 text-lg border-2 border-gray-400 dark:border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                autoComplete="off"
              />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
