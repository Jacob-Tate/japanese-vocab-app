import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function TypingChallenge({ set, vocabulary, onExit, startingSide = 'japanese', questionCount = 10 }) {
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    initChallenge();
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex]);

  const initChallenge = () => {
    const filteredWords = vocabulary.filter(v => set.wordIds.includes(v.id));
    
    // Create question pool - repeat words if needed to reach questionCount
    let questionPool = [...filteredWords];
    while (questionPool.length < questionCount) {
      questionPool = [...questionPool, ...filteredWords];
    }
    
    const shuffled = questionPool.sort(() => Math.random() - 0.5).slice(0, questionCount);
    
    setWords(shuffled);
    setCurrentIndex(0);
    setUserInput('');
    setFeedback(null);
    setScore(0);
    setStreak(0);
    setIsComplete(false);
    setResults([]);
  };

  const calculateSimilarity = (str1, str2) => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    
    // Levenshtein distance
    const matrix = [];
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const distance = matrix[s1.length][s2.length];
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - (distance / maxLength);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const currentWord = words[currentIndex];
    const correctAnswer = startingSide === 'japanese' ? currentWord.english : currentWord.japanese;
    const similarity = calculateSimilarity(userInput, correctAnswer);

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

    setScore(score + points);
    setFeedback({ type: feedbackType, message: feedbackMessage, points });
    setResults([...results, {
      word: currentWord,
      userAnswer: userInput,
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
      }
    }, 1500);
  };

  if (words.length === 0) return <div>Loading...</div>;

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;
  const correctCount = results.filter(r => r.isCorrect).length;
  const closeCount = results.filter(r => r.isClose).length;

  if (isComplete) {
    const percentage = Math.round((correctCount / words.length) * 100);
    
    return (
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">Typing Challenge Results</h2>
          <button
            onClick={onExit}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 w-full sm:w-auto"
          >
            Exit
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">Challenge Complete!</h3>
          
          <div className="text-5xl font-bold text-blue-600 mb-2">{percentage}%</div>
          <p className="text-xl mb-2">Final Score: <span className="font-bold text-green-600">{score}</span></p>
          <div className="flex justify-center gap-4 text-sm mb-6">
            <span className="text-green-600">✓ {correctCount} Perfect</span>
            <span className="text-yellow-600">~ {closeCount} Close</span>
            <span className="text-red-600">✗ {words.length - correctCount - closeCount} Wrong</span>
          </div>

          <button
            onClick={initChallenge}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto"
          >
            <RotateCcw size={20} /> Try Again
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h4 className="font-semibold mb-4">Review:</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={`p-3 rounded-lg ${
                result.isCorrect ? 'bg-green-50' : result.isClose ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
                <div className="flex items-start gap-2">
                  {result.isCorrect ? (
                    <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                  ) : result.isClose ? (
                    <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                  ) : (
                    <XCircle className="text-red-600 flex-shrink-0" size={20} />
                  )}
                  <div className="flex-1 text-sm">
                    <div className="font-medium">
                      {startingSide === 'japanese' ? result.word.japanese : result.word.english}
                    </div>
                    <div className="text-gray-600">
                      Your answer: <span className={result.isCorrect || result.isClose ? 'text-green-700' : 'text-red-700'}>{result.userAnswer}</span>
                    </div>
                    {!result.isCorrect && (
                      <div className="text-green-700">
                        Correct: {result.correctAnswer}
                      </div>
                    )}
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
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Typing Challenge: {set.name}</h2>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 w-full sm:w-auto"
        >
          Exit
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
          <span>Word {currentIndex + 1} of {words.length}</span>
          <div className="flex gap-4">
            <span>Score: {score}</span>
            {streak > 0 && <span className="text-orange-600">🔥 Streak: {streak}</span>}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
        <p className="text-sm text-gray-500 mb-2">
          Type the {startingSide === 'japanese' ? 'English' : 'Japanese'} translation:
        </p>
        <h3 className="text-4xl sm:text-5xl font-bold mb-8 text-center">
          {startingSide === 'japanese' ? currentWord.japanese : currentWord.english}
        </h3>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={feedback !== null}
            className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-center"
            placeholder="Type your answer..."
            autoComplete="off"
          />

          {feedback && (
            <div className={`p-4 rounded-lg mb-4 text-center ${
              feedback.type === 'correct' ? 'bg-green-100 text-green-800' :
              feedback.type === 'close' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              <div className="font-bold text-lg mb-1">
                {feedback.type === 'correct' && '✓ '}
                {feedback.type === 'close' && '~ '}
                {feedback.type === 'wrong' && '✗ '}
                {feedback.message}
              </div>
              {feedback.points > 0 && <div>+{feedback.points} points!</div>}
            </div>
          )}

          {!feedback && (
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-semibold"
            >
              Submit
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
