// src/components/Crossword.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RotateCcw, Check, Lightbulb, Trophy } from 'lucide-react';
import { api } from '../api';

const GRID_SIZE = 15; // The width and height of the grid

// --- Rewritten Crossword Generation Logic ---
const generateCrossword = (words) => {
    // 1. Prepare and filter words
    const wordList = words
        .map(w => ({ text: w.japanese.replace(/ー/g, '丨'), clue: w.english })) // Replace long vowel mark for easier processing
        .filter(w => /^[ぁ-んァ-ン一-龯丨]+$/.test(w.text))
        .sort((a, b) => b.text.length - a.text.length);

    // --- FIX: Shuffle word list to ensure variety ---
    const firstWord = wordList.shift();
    for (let i = wordList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [wordList[i], wordList[j]] = [wordList[j], wordList[i]];
    }
    if(firstWord) {
        wordList.unshift(firstWord);
    }
    // --- END FIX ---

    let grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    const placedWords = [];

    // 2. Helper function to check if a word can be placed
    const canPlaceWord = (word, r, c, dir) => {
        if (dir === 'across') {
            if (c + word.length > GRID_SIZE) return false; // Check bounds
            if (c > 0 && grid[r][c - 1] !== null) return false; // Check cell before
            if (c + word.length < GRID_SIZE && grid[r][c + word.length] !== null) return false; // Check cell after

            for (let i = 0; i < word.length; i++) {
                if (grid[r][c + i] !== null && grid[r][c + i] !== word[i]) return false; // Mismatched letter
                if (grid[r][c + i] === null) { // Check adjacent perpendicular cells
                    if (r > 0 && grid[r - 1][c + i] !== null) return false;
                    if (r < GRID_SIZE - 1 && grid[r + 1][c + i] !== null) return false;
                }
            }
        } else { // 'down'
            if (r + word.length > GRID_SIZE) return false;
            if (r > 0 && grid[r - 1][c] !== null) return false;
            if (r + word.length < GRID_SIZE && grid[r + word.length][c] !== null) return false;

            for (let i = 0; i < word.length; i++) {
                if (grid[r + i][c] !== null && grid[r + i][c] !== word[i]) return false;
                if (grid[r + i][c] === null) {
                    if (c > 0 && grid[r + i][c - 1] !== null) return false;
                    if (c < GRID_SIZE - 1 && grid[r + i][c + 1] !== null) return false;
                }
            }
        }
        return true;
    };

    // 3. Helper function to place a word on the grid
    const placeWord = (word, r, c, dir) => {
        for (let i = 0; i < word.text.length; i++) {
            if (dir === 'across') grid[r][c + i] = word.text[i];
            else grid[r + i][c] = word.text[i];
        }
        placedWords.push({ ...word, row: r, col: c, direction: dir });
    };

    // 4. Start placement
    if (wordList.length > 0) {
        const startWord = wordList.shift();
        const startCol = Math.floor((GRID_SIZE - startWord.text.length) / 2);
        placeWord(startWord, Math.floor(GRID_SIZE / 2), startCol, 'across');
    }

    // 5. Place subsequent words
    for (const word of wordList) {
        let bestFit = { score: -1, r: -1, c: -1, dir: null };
        for (const pWord of placedWords) {
            for (let i = 0; i < pWord.text.length; i++) {
                for (let j = 0; j < word.text.length; j++) {
                    if (pWord.text[i] === word.text[j]) {
                        let r, c, dir;
                        let score = 0;
                        if (pWord.direction === 'across') {
                            dir = 'down';
                            r = pWord.row - j;
                            c = pWord.col + i;
                        } else {
                            dir = 'across';
                            r = pWord.row + i;
                            c = pWord.col - j;
                        }

                        if (r >= 0 && c >= 0 && canPlaceWord(word.text, r, c, dir)) {
                            for (let k = 0; k < word.text.length; k++) {
                                let checkR = r + (dir === 'down' ? k : 0);
                                let checkC = c + (dir === 'across' ? k : 0);
                                if (grid[checkR]?.[checkC] !== null) score++;
                            }

                            if (score > bestFit.score) {
                                bestFit = { score, r, c, dir };
                            }
                        }
                    }
                }
            }
        }
        if (bestFit.score !== -1) {
            placeWord(word, bestFit.r, bestFit.c, bestFit.dir);
        }
    }
    
    // 6. Final Pass: Number the clues correctly
    let clueCounter = 1;
    const clues = { across: [], down: [] };
    const clueLocations = {};
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const isAcrossStart = (c === 0 || grid[r][c-1] === null) && grid[r][c] !== null && c + 1 < GRID_SIZE && grid[r][c+1] !== null;
            const isDownStart = (r === 0 || grid[r-1]?.[c] === null) && grid[r][c] !== null && r + 1 < GRID_SIZE && grid[r+1]?.[c] !== null;

            if (isAcrossStart || isDownStart) {
                const currentNumber = clueCounter;
                clueLocations[`${r},${c}`] = currentNumber;

                if(isAcrossStart) {
                    const placed = placedWords.find(p => p.row === r && p.col === c && p.direction === 'across');
                    if(placed) clues.across.push({ ...placed, number: currentNumber, text: placed.text.replace(/丨/g, 'ー')});
                }
                if(isDownStart) {
                    const placed = placedWords.find(p => p.row === r && p.col === c && p.direction === 'down');
                    if(placed) clues.down.push({ ...placed, number: currentNumber, text: placed.text.replace(/丨/g, 'ー')});
                }
                clueCounter++;
            }
        }
    }
    
    clues.across.sort((a,b) => a.number - b.number);
    clues.down.sort((a,b) => a.number - b.number);

    // Replace placeholder character in final grid
    grid = grid.map(row => row.map(cell => cell === '丨' ? 'ー' : cell));
    
    return { grid, clues, clueLocations };
};


export default function Crossword({ set, vocabulary, onExit }) {
  const [gridData, setGridData] = useState(null);
  const [userGrid, setUserGrid] = useState([]);
  const [activeCell, setActiveCell] = useState({ row: -1, col: -1 });
  const [isComplete, setIsComplete] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const isMultiSet = !!set.sourceSetIds;
  const inputRefs = useRef([]);

  const wordsInSet = useMemo(() => vocabulary.filter(v => set.wordIds.includes(v.id)), [set, vocabulary]);

  useEffect(() => {
    initGame();
    if (!isMultiSet && set.id !== 'all') {
      loadHighScore();
    }
  }, []);
  
  const initGame = () => {
    const data = generateCrossword(wordsInSet);
    setGridData(data);
    setUserGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('')));
    setIsComplete(false);
    setIsNewHighScore(false);
    if(data.clues.across.length > 0) {
        setActiveCell({row: data.clues.across[0].row, col: data.clues.across[0].col});
    } else if (data.clues.down.length > 0) {
        setActiveCell({row: data.clues.down[0].row, col: data.clues.down[0].col});
    }
  };

  const loadHighScore = async () => {
    try {
      const result = await api.getHighScore(set.id, 'crossword');
      if (result) setHighScore(result.score);
    } catch (error) {
      console.error('Failed to load high score:', error);
    }
  };
  
  const handleInputChange = (e, row, col) => {
    // Convert the entire input value (romaji) to Kana
    const kanaValue = wanakana.toKana(e.target.value);

    const newUserGrid = userGrid.map(r => [...r]);
    // The maxLength="1" attribute on the input will ensure we only ever get a single character
    newUserGrid[row][col] = kanaValue;
    setUserGrid(newUserGrid);
    
    if (kanaValue) {
        const isAcross = gridData.grid[row][col + 1];
        const isDown = gridData.grid[row + 1]?.[col];

        if (isAcross) {
            inputRefs.current[row][col + 1]?.focus();
        } else if (isDown) {
            inputRefs.current[row + 1]?.[col]?.focus();
        }
    }
  };

  const handleKeyDown = (e, row, col) => {
    let newRow = row, newCol = col;
    if (e.key === 'ArrowUp') { newRow = Math.max(0, row - 1); e.preventDefault(); }
    if (e.key === 'ArrowDown') { newRow = Math.min(GRID_SIZE - 1, row + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { newCol = Math.max(0, col - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { newCol = Math.min(GRID_SIZE - 1, col + 1); e.preventDefault(); }
    
    if (gridData.grid[newRow]?.[newCol]) {
      inputRefs.current[newRow]?.[newCol]?.focus();
    }
  };

  const checkAnswers = () => {
    let correctCells = 0;
    let totalCells = 0;
    for(let r=0; r<GRID_SIZE; r++) {
        for (let c=0; c<GRID_SIZE; c++) {
            if (gridData.grid[r][c] !== null) {
                totalCells++;
                if (userGrid[r][c] === gridData.grid[r][c]) {
                    correctCells++;
                }
            }
        }
    }
    
    const finalScore = totalCells > 0 ? Math.floor((correctCells / totalCells) * 1000) : 0;
    alert(`You scored ${finalScore} points! (${correctCells}/${totalCells} correct cells)`);
    setIsComplete(true);

    if (set.id !== 'all') {
        const payload = { gameMode: 'crossword', score: finalScore };
        if (isMultiSet) payload.setIds = set.sourceSetIds;
        else payload.setId = set.id;
        api.saveGameSession(payload);
        if (finalScore > highScore) {
            api.saveHighScore(payload);
            setHighScore(finalScore);
            setIsNewHighScore(true);
        }
    }
  };

  const revealSolution = () => {
    setUserGrid(gridData.grid);
  };

  if (!gridData) {
    return <div>Generating crossword...</div>;
  }
  
  if (gridData.clues.across.length + gridData.clues.down.length < 2) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 dark:text-white">Crossword: {set.name}</h2>
            <p className="text-red-500 dark:text-red-400">Not enough suitable words in this set to generate a crossword puzzle.</p>
            <button onClick={onExit} className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                Back
            </button>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold dark:text-white">Crossword: {set.name}</h2>
            <div className='flex gap-2'>
              {highScore > 0 && !isMultiSet && (
                <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-2 rounded-lg text-sm">
                  <Trophy size={16} className="text-yellow-500" />
                  <span className='dark:text-gray-300'>Best: {highScore}</span>
                </div>
              )}
              <button onClick={onExit} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Exit</button>
            </div>
        </div>
        
        {isComplete && (
            <div className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg p-4 text-center mb-4">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Game Finished!</h3>
                {isNewHighScore && <p className="text-yellow-600 dark:text-yellow-400 font-bold">New High Score!</p>}
                <button onClick={initGame} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto">
                    <RotateCcw size={16} /> Play Again
                </button>
            </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-shrink-0">
                <div className="grid bg-white dark:bg-gray-700 p-2 rounded-lg shadow-lg" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
                    {gridData.grid.map((row, r) => {
                        inputRefs.current[r] = inputRefs.current[r] || [];
                        return row.map((cell, c) => {
                            if (!cell) {
                                return <div key={`${r}-${c}`} className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 dark:bg-gray-900" />;
                            }
                            const clueNumber = gridData.clueLocations[`${r},${c}`];
                            return (
                                <div key={`${r}-${c}`} className="relative w-8 h-8 sm:w-10 sm:h-10">
                                    {clueNumber && <span className="absolute top-0 left-0 text-xs text-gray-500 dark:text-gray-400 leading-none">{clueNumber}</span>}
                                    <input
                                        ref={el => inputRefs.current[r][c] = el}
                                        type="text"
                                        maxLength="1"
                                        value={userGrid[r]?.[c] || ''}
                                        onChange={(e) => handleInputChange(e, r, c)}
                                        onKeyDown={(e) => handleKeyDown(e, r, c)}
                                        onClick={() => setActiveCell({ row: r, col: c })}
                                        className={`w-full h-full text-center text-lg sm:text-xl font-bold uppercase dark:bg-gray-600 dark:text-white rounded-sm border ${activeCell.row === r && activeCell.col === c ? 'border-blue-500' : 'border-gray-300 dark:border-gray-500'}`}
                                        autoCapitalize="off"
                                        autoCorrect="off"
                                        spellCheck="false"
                                    />
                                </div>
                            );
                        });
                    })}
                </div>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-lg">
                <div>
                    <h3 className="font-bold text-lg mb-2 dark:text-white">Across</h3>
                    <ul className="space-y-1 text-sm dark:text-gray-300">
                        {gridData.clues.across.map(c => <li key={`ac-${c.number}`}><span className="font-bold">{c.number}.</span> {c.clue}</li>)}
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-2 dark:text-white">Down</h3>
                    <ul className="space-y-1 text-sm dark:text-gray-300">
                        {gridData.clues.down.map(c => <li key={`dn-${c.number}`}><span className="font-bold">{c.number}.</span> {c.clue}</li>)}
                    </ul>
                </div>
            </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={checkAnswers} className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-bold flex items-center justify-center gap-2"><Check /> Check Answers</button>
            <button onClick={revealSolution} className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 font-bold flex items-center justify-center gap-2"><Lightbulb /> Reveal Solution</button>
        </div>
    </div>
  );
}
