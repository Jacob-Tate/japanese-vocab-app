// src/components/TypingBlitz.jsx
import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Zap } from 'lucide-react';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const WORD_SPEED = 0.5;
const INPUT_AREA_HEIGHT = 80; // The height of the input form area at the bottom

export default function TypingBlitz({ set, vocabulary, onExit }) {
  const [userInput, setUserInput] = useState('');
  const [gameState, setGameState] = useState({
    words: [],
    score: 0,
    lives: 5,
    isGameOver: false,
  });
  
  // Ref to hold the synchronous, mutable game state for the animation loop
  const gameStateRef = useRef(gameState);
  const gameLoopRef = useRef();
  const inputRef = useRef();

  // Keep the ref in sync with the state
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

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
    inputRef.current?.focus();
  };

  useEffect(() => {
    startGame();
  }, [set.id]);

  // Effect for adding new words over time
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


  // The main game loop
  useEffect(() => {
    const gameTick = () => {
      // Stop the loop if the game is over
      if (gameStateRef.current.isGameOver) {
        return;
      }
      
      let livesLost = 0;
      
      // Update word positions and check for fallen words
      const remainingWords = gameStateRef.current.words
        .map(word => ({ ...word, y: word.y + WORD_SPEED }))
        .filter(word => {
          if (word.y > GAME_HEIGHT - INPUT_AREA_HEIGHT) {
            livesLost++;
            return false; // This word has fallen, so remove it
          }
          return true; // Keep this word
        });

      // If lives were lost, schedule a state update
      if (livesLost > 0) {
        const newLives = gameStateRef.current.lives - livesLost;
        const isGameOver = newLives <= 0;
        setGameState(prev => ({
          ...prev,
          words: remainingWords,
          lives: newLives,
          isGameOver,
        }));
      } else {
        // Otherwise, just update the word positions
        setGameState(prev => ({ ...prev, words: remainingWords }));
      }

      gameLoopRef.current = requestAnimationFrame(gameTick);
    };

    gameLoopRef.current = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, []); // This effect should only run once to start the loop

  const handleSubmit = (e) => {
    e.preventDefault();
    const typed = userInput.trim().toLowerCase();
    if (!typed || gameState.isGameOver) return;

    const matchedWord = gameState.words.find(w => w.english.toLowerCase() === typed);
    if (matchedWord) {
      setGameState(prev => ({
        ...prev,
        score: prev.score + 10,
        words: prev.words.filter(word => word.id !== matchedWord.id),
      }));
      setUserInput('');
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><Zap className="text-yellow-500" /> Typing Blitz: {set.name}</h2>
        <button onClick={onExit} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Exit</button>
      </div>

      <div className="flex justify-around mb-4 bg-white p-3 rounded-lg shadow">
        <div className="text-lg">Score: <span className="font-bold text-green-600">{gameState.score}</span></div>
        <div className="text-lg">Lives: <span className="font-bold text-red-600">{'❤️'.repeat(Math.max(0, gameState.lives))}</span></div>
      </div>

      {gameState.isGameOver ? (
        <div className="flex flex-col justify-center items-center bg-white rounded-lg shadow-lg p-8 text-center" style={{ width: GAME_WIDTH, height: GAME_HEIGHT, maxWidth: '100%' }}>
          <h3 className="text-3xl font-bold mb-4">Game Over!</h3>
          <p className="text-xl mb-6">Final Score: {gameState.score}</p>
          <button onClick={startGame} className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto"><RotateCcw /> Play Again</button>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg shadow-inner overflow-hidden relative" style={{ width: GAME_WIDTH, height: GAME_HEIGHT, maxWidth: '100%' }}>
          {gameState.words.map(word => (
            <div key={word.id} className="absolute text-white font-bold bg-indigo-500 px-3 py-1 rounded" style={{ left: word.x, top: word.y, fontSize: '1.2rem' }}>
              {word.japanese}
            </div>
          ))}
          <form onSubmit={handleSubmit} className="absolute bottom-0 left-0 right-0 p-4 bg-gray-900/50" style={{ height: INPUT_AREA_HEIGHT }}>
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder="Type English translation..."
              className="w-full px-4 py-3 text-lg border-2 border-gray-400 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              autoComplete="off"
            />
          </form>
        </div>
      )}
    </div>
  );
}
