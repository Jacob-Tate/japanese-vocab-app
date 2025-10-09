// src/components/TypingChallenge.jsx
import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, CheckCircle, XCircle, AlertCircle, Trophy, Volume2 } from 'lucide-react';
import { api } from '../api';
import { playAudio } from '../utils/audio';

export default function TypingChallenge({ set, vocabulary, onExit, startingSide = 'japanese', repetitions = 1, romajiMode = false }) {
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState([]);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const inputRef = useRef(null);
  const isMultiSet = !!set.sourceSetIds;

  useEffect(() => {
    initChallenge();
    if (!isMultiSet && set.id !== 'all') {
      loadHighScore();
    }
  }, []);

  useEffect(() => {
    if (words.length > 0 && startingSide === 'japanese' && !isComplete) {
        playAudio(words[currentIndex]);
    }
  }, [currentIndex, words, startingSide, isComplete]);

  const loadHighScore = async () => {
    try {
      const result = await api.getHighScore(set.id, 'typing');
      if (result) {
        setHighScore(result.score);
      }
    } catch (error) {
      console.error('Failed to load high score:', error);
    }
  };

  const saveGameCompletion = async (finalScore) => {
    if (set.id === 'all') return;

    const reviewResults = results.map(r => ({
      itemId: r.word.id,
      itemType: 'word',
      result: r.isCorrect ? 'correct' : 'incorrect'
    }));

    const payload = {
      gameMode: 'typing',
      score: finalScore,
      metadata: { repetitions, startingSide, romajiMode, results: reviewResults },
    };
    if (isMultiSet) {
      payload.setIds = set.sourceSetIds;
    } else {
      payload.setId = set.id;
    }

    try {
      await api.saveGameSession(payload);
    } catch (error) {
      console.error('Failed to save game session:', error);
    }

    if (finalScore > highScore) {
      try {
        await api.saveHighScore(payload);
        if (!isMultiSet) {
          setHighScore(finalScore);
          setIsNewHighScore(true);
        }
      } catch (error) {
        console.error('Failed to save high score:', error);
      }
    }
  };

  useEffect(() => {
    if (inputRef.current && !isComplete) {
      inputRef.current.focus();
    }
  }, [currentIndex, isComplete]);

  const initChallenge = () => {
    const filteredWords = vocabulary.filter(v => set.wordIds.includes(v.id));
            
    let questionPool = [];
    for (let i = 0; i < repetitions; i++) {
        questionPool.push(...filteredWords);
    }
            
    const shuffled = questionPool.sort(() => Math.random() - 0.5);
            
    setWords(shuffled);
    setCurrentIndex(0);
    setUserInput('');
    setFeedback(null);
    setScore(0);
    setStreak(0);
    setIsComplete(false);
    setResults([]);
    setIsNewHighScore(false);
  };

  const calculateSimilarity = (str1, str2) => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
            
    if (s1 === s2) return 1;
            
    const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i += 1) {
      matrix[0][i] = i;
    }
    for (let j = 0; j <= s2.length; j += 1) {
      matrix[j][0] = j;
    }
    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator,
        );
      }
    }
    const distance = matrix[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    if (maxLength === 0) return 1;
    return 1 - (distance / maxLength);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim() || feedback) return;

    const currentWord = words[currentIndex];
    const correctAnswer = startingSide === 'japanese' ? currentWord.english : currentWord.japanese;
            
    let processedInput = userInput.trim();
    let normalizedCorrect = correctAnswer;

    if (romajiMode && startingSide === 'english' && window.wanakana) {
      processedInput = wanakana.toHiragana(processedInput, { passRomaji: true });
      const hiraganaAnswer = wanakana.toHiragana(correctAnswer, { passRomaji: true });
      normalizedCorrect = hiraganaAnswer;
    }

    const similarity = calculateSimilarity(processedInput, normalizedCorrect);
    let finalScore = score;
    let points = 0;
    let feedbackType = 'wrong';
    let feedbackMessage = '';

    if (similarity === 1) {
      points = 10 + streak;
      feedbackType = 'correct';
      feedbackMessage = 'Perfect!';
      setStreak(streak + 1);
    } else if (similarity >= 0.8) {
      points = 5;
      feedbackType = 'close';
      feedbackMessage = 'Almost! Small typo.';
      setStreak(0);
    } else {
      points = 0;
      feedbackType = 'wrong';
      feedbackMessage = `Correct answer: ${correctAnswer}`;
      setStreak(0);
    }

    finalScore += points;
    setScore(finalScore);
    setFeedback({ type: feedbackType, message: feedbackMessage, points });
    setResults(prev => [...prev, {
      word: currentWord,
      userAnswer: romajiMode && startingSide === 'english' ? `${userInput} (${processedInput})` : userInput,
      correctAnswer,
      isCorrect: similarity === 1,
      isClose: similarity >= 0.8 && similarity < 1
    }]);

    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setUserInput('');
        setFeedback(null);
      } else {
        setIsComplete(true);
        saveGameCompletion(finalScore);
      }
    }, 1500);
  };
      
  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 dark:text-white">Typing Challenge: {set.name}</h2>
        <p className="text-red-500 dark:text-red-400">This set has no words to practice.</p>
        <button onClick={onExit} className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
          Back
        </button>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  if (isComplete) {
    const correctCount = results.filter(r => r.isCorrect).length;
    const closeCount = results.filter(r => r.isClose).length;
    const percentage = Math.round((correctCount / words.length) * 100);
            
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold dark:text-white">Typing Challenge Results</h2>
          <button onClick={onExit} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Exit</button>
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-lg p-6 sm:p-8 mb-6 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4 dark:text-white">Challenge Complete!</h3>
          <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">{percentage}%</div>
          <p className="text-xl mb-2 dark:text-gray-300">Final Score: <span className="font-bold text-green-600 dark:text-green-400">{score}</span></p>
          {isNewHighScore ? (
            <p className="text-yellow-600 dark:text-yellow-400 font-bold mb-2 flex items-center justify-center gap-2">
              <Trophy size={24} /> New High Score!
            </p>
          ) : highScore > 0 && !isMultiSet ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">High Score: {highScore}</p>
          ) : null}
          <div className="flex justify-center gap-4 text-sm mb-6">
            <span className="text-green-600 dark:text-green-400">✓ {correctCount} Perfect</span>
            <span className="text-yellow-600 dark:text-yellow-400">~ {closeCount} Close</span>
            <span className="text-red-600 dark:text-red-400">✗ {words.length - correctCount - closeCount} Wrong</span>
          </div>
          <button onClick={initChallenge} className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto">
            <RotateCcw size={20} /> Try Again
          </button>
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 sm:p-6">
          <h4 className="font-semibold mb-4 dark:text-white">Review:</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={`p-3 rounded-lg ${
                result.isCorrect ? 'bg-green-50 dark:bg-green-900' : result.isClose ? 'bg-yellow-50 dark:bg-yellow-900' : 'bg-red-50 dark:bg-red-900'
              }`}>
                <div className="flex items-start gap-2">
                  {result.isCorrect ? <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-1" size={20} /> : result.isClose ? <AlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" size={20} /> : <XCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-1" size={20} />}
                  <div className="flex-1 text-sm">
                    <div className="font-medium dark:text-white">{startingSide === 'japanese' ? result.word.japanese : result.word.english}</div>
                    <div className="text-gray-600 dark:text-gray-300">Your answer: <span className={result.isCorrect || result.isClose ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>{result.userAnswer}</span></div>
                    {!result.isCorrect && <div className="text-green-700 dark:text-green-400">Correct: {result.correctAnswer}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold dark:text-white">Typing Challenge: {set.name}</h2>
        <button onClick={onExit} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Exit</button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Word {currentIndex + 1} of {words.length}</span>
          <div className="flex gap-4">
            <span>Score: {score}</span>
            {streak > 0 && <span className="text-orange-600 dark:text-orange-400">🔥 Streak: {streak}</span>}
            {highScore > 0 && !isMultiSet && (
              <span className="flex items-center gap-1">
                <Trophy size={16} className="text-yellow-500" />
                {highScore}
              </span>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}/></div>
      </div>

      <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Type the {startingSide === 'japanese' ? 'English' : 'Japanese'} translation:
          {romajiMode && startingSide === 'english' && <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold">ROMAJI MODE</span>}
        </p>
        <div className="flex items-center justify-center gap-4 mb-8">
            <h3 className="text-4xl sm:text-5xl font-bold text-center dark:text-white">{startingSide === 'japanese' ? currentWord.japanese : currentWord.english}</h3>
            {startingSide === 'japanese' && (
                <button
                    onClick={() => playAudio(currentWord)}
                    className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-transform hover:scale-110"
                    title="Play audio"
                >
                    <Volume2 size={24} />
                </button>
            )}
        </div>

        <form onSubmit={handleSubmit}>
          <input ref={inputRef} type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} disabled={!!feedback} className="w-full px-4 py-3 text-xl border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 text-center dark:bg-gray-600 dark:text-white dark:placeholder-gray-400" placeholder={romajiMode && startingSide === 'english' ? "Type in romaji..." : "Type your answer..."} autoComplete="off"/>
          {romajiMode && startingSide === 'english' && userInput && window.wanakana && <div className="text-center mb-4 text-gray-600 dark:text-gray-400"><span className="text-sm">Converts to: </span><span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{wanakana.toHiragana(userInput, { passRomaji: true })}</span></div>}
          {feedback && <div className={`p-4 rounded-lg mb-4 text-center ${feedback.type === 'correct' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : feedback.type === 'close' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}><div className="font-bold text-lg mb-1">{feedback.type === 'correct' && '✓ '}{feedback.type === 'close' && '~ '}{feedback.type === 'wrong' && '✗ '}{feedback.message}</div>{feedback.points > 0 && <div>+{feedback.points} points!</div>}</div>}
          {!feedback && <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-semibold">Submit</button>}
        </form>
      </div>
    </div>
  );
}
