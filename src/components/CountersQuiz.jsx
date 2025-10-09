// src/components/CountersQuiz.jsx
import React, { useState, useEffect, useRef } from 'react';
import { counters } from '../counters';
import { Sigma, CheckCircle, XCircle, RotateCcw, AlertCircle, Keyboard, ListChecks } from 'lucide-react';

export default function CountersQuiz({ onExit }) {
  const [gameState, setGameState] = useState('setup'); // 'setup', 'playing', 'finished'
  const [selectedCounters, setSelectedCounters] = useState([]);
  const [quizType, setQuizType] = useState('typing'); // 'typing' or 'multipleChoice'
  const [questionCount, setQuestionCount] = useState(20);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (gameState === 'playing' && quizType === 'typing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, gameState, quizType]);

  const handleCounterToggle = (counterReading) => {
    setSelectedCounters(prev =>
      prev.includes(counterReading)
        ? prev.filter(c => c !== counterReading)
        : [...prev, counterReading]
    );
  };

  const startGame = () => {
    const practiceCounters = counters.filter(c => selectedCounters.includes(c.reading));
    if (practiceCounters.length === 0) return;

    if (quizType === 'multipleChoice' && practiceCounters.length < 4) {
      alert("Multiple choice requires at least 4 different counters to be selected to generate good questions.");
      return;
    }

    let quizQuestions = [];
    for (let i = 0; i < questionCount; i++) {
      const counter = practiceCounters[Math.floor(Math.random() * practiceCounters.length)];
      
      const availableNumbers = Object.keys(counter.readings);
      if (availableNumbers.length === 0) continue;
      
      const number = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
      const item = counter.items[Math.floor(Math.random() * counter.items.length)];
      const answer = counter.readings[number];
      quizQuestions.push({ number, item, counter, answer });
    }
    
    quizQuestions = quizQuestions.sort(() => Math.random() - 0.5);
    
    if (quizType === 'multipleChoice') {
      quizQuestions = quizQuestions.map(q => {
        const correctAnswerHiragana = q.answer;
        
        const otherCounters = practiceCounters.filter(c => 
            c.reading !== q.counter.reading && 
            c.readings[q.number] !== undefined
        );
        
        let distractorsHiragana = [];
        const shuffledDistractors = otherCounters.sort(() => Math.random() - 0.5);

        for (const distractorCounter of shuffledDistractors) {
            if (distractorsHiragana.length >= 3) break;
            const distractorAnswerHiragana = distractorCounter.readings[q.number];
            if (!distractorsHiragana.includes(distractorAnswerHiragana) && distractorAnswerHiragana !== correctAnswerHiragana) {
                distractorsHiragana.push(distractorAnswerHiragana);
            }
        }
        
        let failsafe = 0;
        const allPossibleReadings = practiceCounters.flatMap(c => Object.values(c.readings));
        const uniqueReadings = [...new Set(allPossibleReadings)];

        while (distractorsHiragana.length < 3 && failsafe < 50) {
            const randomReading = uniqueReadings[Math.floor(Math.random() * uniqueReadings.length)];
            if (!distractorsHiragana.includes(randomReading) && randomReading !== correctAnswerHiragana) {
                distractorsHiragana.push(randomReading);
            }
            failsafe++;
        }
        
        const options = [correctAnswerHiragana, ...distractorsHiragana].sort(() => Math.random() - 0.5);
        return { ...q, answer: correctAnswerHiragana, options };
      });
    }

    setQuestions(quizQuestions);
    setCurrentIndex(0);
    setUserInput('');
    setFeedback(null);
    setScore(0);
    setStreak(0);
    setResults([]);
    setGameState('playing');
  };

  const processAnswer = (userAnswer, isCorrect) => {
    const currentQuestion = questions[currentIndex];
    
    if (isCorrect) {
      const points = 10 + streak;
      setScore(score + points);
      setStreak(streak + 1);
      setFeedback({ type: 'correct', points });
    } else {
      setStreak(0);
      setFeedback({ type: 'incorrect' });
    }

    setResults(prev => [...prev, { question: currentQuestion, userAnswer, isCorrect }]);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setUserInput('');
        setFeedback(null);
      } else {
        setGameState('finished');
      }
    }, 1500);
  };

  const handleTypingSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim() || feedback) return;
    const currentQuestion = questions[currentIndex];
    const romajiAnswer = wanakana.toRomaji(currentQuestion.answer);

    const isCorrect = userInput.trim().toLowerCase() === currentQuestion.answer ||
                      userInput.trim().toLowerCase() === romajiAnswer;
                      
    processAnswer(userInput, isCorrect);
  };
  
  const handleMcqAnswer = (answer) => {
    if (feedback) return;
    setUserInput(answer);
    const currentQuestion = questions[currentIndex];
    const isCorrect = currentQuestion.answer === answer;
    processAnswer(answer, isCorrect);
  };

  if (gameState === 'setup') {
    const isSetupValid = quizType === 'typing' ? selectedCounters.length > 0 : selectedCounters.length >= 4;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 dark:text-white"><Sigma /> Counters Quiz Setup</h2>
          <button onClick={onExit} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Exit</button>
        </div>
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold mb-3 dark:text-white">1. Choose Counters to Practice</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {counters.map(counter => (
              <button key={counter.reading} onClick={() => handleCounterToggle(counter.reading)} className={`p-4 rounded-lg border-2 transition-all text-center dark:text-white ${selectedCounters.includes(counter.reading) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'}`}>
                <div className="text-2xl font-bold">{counter.counter}</div>
                <div className="text-sm">{counter.reading}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{counter.uses}</div>
              </button>
            ))}
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 dark:text-white">2. Choose Quiz Type</h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setQuizType('typing')} className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center dark:text-white ${quizType === 'typing' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'}`}>
                <Keyboard size={24} className="mb-2"/> Typing
              </button>
              <button onClick={() => setQuizType('multipleChoice')} className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center dark:text-white ${quizType === 'multipleChoice' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'}`}>
                <ListChecks size={24} className="mb-2"/> Multiple Choice
              </button>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 dark:text-white">3. Number of Questions</h3>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="5" 
                max="50" 
                value={questionCount} 
                onChange={(e) => setQuestionCount(Number(e.target.value))} 
                className="flex-1"
              />
              <input 
                type="number" 
                min="1" 
                value={questionCount} 
                onChange={(e) => setQuestionCount(Number(e.target.value) > 0 ? Number(e.target.value) : 1)} 
                className="w-20 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white text-center"
              />
            </div>
          </div>
          <button onClick={startGame} disabled={!isSetupValid} className="w-full bg-blue-500 text-white py-3 rounded-lg text-lg font-semibold transition-colors hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
            Start Quiz ({questionCount} Questions)
          </button>
          {!isSetupValid && (
            <div className="flex items-center justify-center gap-2 mt-3 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={18} />
              <p>
                {quizType === 'typing' ? 'Please select at least one counter.' : 'Please select at least 4 counters for Multiple Choice.'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (gameState === 'finished') {
    const correctCount = results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">Quiz Complete!</h2>
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6 text-center mb-6">
          <h3 className="text-3xl font-bold mb-2 dark:text-white">Final Score: {score}</h3>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">Accuracy: {accuracy}% ({correctCount}/{questions.length})</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => setGameState('setup')} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Change Settings</button>
            <button onClick={startGame} className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center gap-2"><RotateCcw /> Try Again</button>
            <button onClick={onExit} className="px-6 py-3 dark:text-gray-400 hover:underline">Exit</button>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
          <h4 className="font-semibold mb-2 dark:text-white">Review your answers:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className={`p-2 rounded ${r.isCorrect ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                <div className="text-md font-bold text-center dark:text-white">{r.question.number} {r.question.item}</div>
                <div className="text-center text-sm">{r.isCorrect ? <span className="text-green-700 dark:text-green-300">✓ {r.question.answer}</span> : <><span className="text-red-700 dark:text-red-300 line-through">✗ {r.userAnswer}</span><br /><span className="text-green-700 dark:text-green-300">{r.question.answer}</span></>}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold dark:text-white">Counters Quiz</h2>
        <button onClick={onExit} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Exit</button>
      </div>
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>{currentIndex + 1} / {questions.length}</span>
          <div className="flex gap-4"><span>Score: {score}</span>{streak > 0 && <span className="text-orange-500">🔥 Streak: {streak}</span>}</div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div></div>
      </div>
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <p className="text-gray-500 dark:text-gray-400">How do you say...</p>
          <div className="text-5xl font-bold my-4 dark:text-white">
            {currentQuestion.number} {currentQuestion.item}
          </div>
        </div>
        
        {quizType === 'typing' ? (
          <form onSubmit={handleTypingSubmit}>
            <input ref={inputRef} type="text" value={userInput} onChange={e => setUserInput(e.target.value)} disabled={!!feedback} className="w-full text-center text-2xl p-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-600 dark:text-white" placeholder="Type in hiragana or romaji..." autoComplete="off" autoCapitalize="off" />
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = 'bg-white dark:bg-gray-600 border-2 border-gray-200 dark:border-gray-500 hover:border-blue-300 dark:hover:border-blue-500 dark:text-white';
              if (feedback) {
                const isCorrect = currentQuestion.answer === option;
                if(isCorrect) {
                  buttonClass = 'bg-green-500 text-white';
                } else if (userInput === option) { 
                  buttonClass = 'bg-red-500 text-white';
                }
              }
              return (
                <button key={index} onClick={() => handleMcqAnswer(option)} disabled={!!feedback} className={`w-full p-4 rounded-lg font-semibold transition-all text-lg ${buttonClass}`}>
                  {option}
                </button>
              )
            })}
          </div>
        )}
        
        {feedback && (
          <div className="mt-4 text-center text-xl font-bold">
            {feedback.type === 'correct' ? <span className="text-green-500 flex items-center justify-center gap-2"><CheckCircle /> Correct! +{feedback.points}</span> : <span className="text-red-500 flex items-center justify-center gap-2"><XCircle /> Incorrect! Correct: {currentQuestion.answer}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
