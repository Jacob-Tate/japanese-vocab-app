// src/components/SentenceScramble.jsx
import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { api } from '../api';

const tokenizeJapanese = (sentence) => {
  if (!sentence) return [];
      
  const particles = ['は', 'が', 'を', 'に', 'へ', 'で', 'と', 'も', 'の'];
  const regex = new RegExp(`(${particles.join('|')})`, 'g');
      
  const tokens = sentence
    .split(regex)
    .filter(Boolean);

  return tokens;
};
 
export default function SentenceScramble({ set, sentences, onExit }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wordBank, setWordBank] = useState([]);
  const [answer, setAnswer] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const isMultiSet = !!set.sourceSetIds;

  useEffect(() => {
    initGame();
    if (!isMultiSet && set.id !== 'all') {
      loadHighScore();
    }
  }, []);

  const loadHighScore = async () => {
    try {
      const result = await api.getHighScore(set.id, 'sentence_scramble');
      if (result) {
        setHighScore(result.score);
      }
    } catch (error) {
      console.error('Failed to load high score:', error);
    }
  };

  const saveGameCompletion = async (finalScore) => {
    if (set.id === 'all') return;

    const payload = {
      gameMode: 'sentence_scramble',
      score: finalScore,
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

  const initGame = () => {
    const gameSentences = sentences.filter(s => (set.sentenceIds || []).includes(s.id));
    const shuffled = [...gameSentences].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setIsComplete(false);
    setIsNewHighScore(false);
    if (shuffled.length > 0) {
      setupQuestion(shuffled[0]);
    }
  };

  const setupQuestion = (sentence) => {
    const tokens = tokenizeJapanese(sentence.japanese);
    setWordBank(tokens.sort(() => Math.random() - 0.5));
    setAnswer([]);
    setFeedback(null);
  };
      
  const handleWordBankClick = (word, index) => {
    setWordBank(wordBank.filter((_, i) => i !== index));
    setAnswer([...answer, word]);
  };

  const handleAnswerClick = (word, index) => {
    setAnswer(answer.filter((_, i) => i !== index));
    setWordBank([...wordBank, word]);
  };

  const checkAnswer = () => {
    const userAnswer = answer.join('');
    const correctAnswer = questions[currentIndex].japanese;
    if (userAnswer === correctAnswer) {
      const newScore = score + 10;
      setScore(newScore);
      setFeedback('correct');
      setTimeout(() => {
        nextQuestion(newScore);
      }, 1500);
    } else {
      setFeedback('wrong');
    }
  };

  const nextQuestion = (currentScore) => {
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setupQuestion(questions[nextIndex]);
    } else {
      setIsComplete(true);
      saveGameCompletion(currentScore);
    }
  };
      
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 dark:text-white">Sentence Scramble</h2>
        <p className="text-red-500 dark:text-red-400">This set has no sentences to practice.</p>
        <button onClick={onExit} className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Back</button>
      </div>
    );
  }
      
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 dark:text-white">Well Done!</h2>
        <p className="text-lg mb-2 dark:text-gray-300">Final Score: <span className="font-bold text-green-600 dark:text-green-400">{score}</span></p>
        {highScore > 0 && !isMultiSet && <p className="text-sm mb-4 dark:text-gray-400">High Score: {highScore}</p>}
        {isNewHighScore && (
          <p className="text-yellow-600 dark:text-yellow-400 font-bold mb-4 flex items-center justify-center gap-2">
            <Trophy size={24} /> New High Score!
          </p>
        )}
        <button onClick={initGame} className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto">
          <RotateCcw size={20} /> Play Again
        </button>
        <button onClick={onExit} className="mt-4 text-sm text-gray-600 dark:text-gray-400 hover:underline">Exit to menu</button>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="flex justify-between items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold dark:text-white">Sentence Scramble: {set.name}</h2>
        <button onClick={onExit} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Exit</button>
      </div>
                  
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <div className="flex items-center gap-4">
            <span>Score: {score}</span>
            {highScore > 0 && !isMultiSet && (
              <span className="flex items-center gap-1">
                <Trophy size={16} className="text-yellow-500" />
                {highScore}
              </span>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}/>
        </div>
      </div>
                  
      <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-lg p-6 sm:p-8">
        <p className="text-gray-600 dark:text-gray-400 mb-2">Translate and unscramble:</p>
        <h3 className="text-2xl font-semibold mb-6 text-center dark:text-white">{questions[currentIndex].english}</h3>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg min-h-[6rem] p-3 flex flex-wrap items-center justify-center gap-2 mb-4">
          {answer.map((word, index) => (
            <button key={index} onClick={() => handleAnswerClick(word, index)} className="bg-blue-500 text-white px-3 py-2 rounded-lg text-lg">
              {word}
            </button>
          ))}
          {feedback && (
            <div className={`ml-4 ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
              {feedback === 'correct' ? <CheckCircle size={32} /> : <XCircle size={32} />}
            </div>
          )}
        </div>
                        
        <div className="border-t-2 border-dashed dark:border-gray-600 my-4"></div>

        <div className="min-h-[6rem] p-3 flex flex-wrap items-center justify-center gap-2 mb-6">
          {wordBank.map((word, index) => (
            <button key={index} onClick={() => handleWordBankClick(word, index)} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 dark:text-white px-3 py-2 rounded-lg text-lg">
              {word}
            </button>
          ))}
        </div>

        <button onClick={checkAnswer} disabled={feedback === 'correct'} className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-semibold text-lg disabled:bg-gray-400 dark:disabled:bg-gray-600">
          Check Answer
        </button>
      </div>
    </div>
  );
}
