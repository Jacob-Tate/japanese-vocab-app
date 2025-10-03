// src/components/ParticlePractice.jsx
import React, { useState } from 'react';
import { Milestone, CheckCircle, XCircle, RotateCcw, AlertCircle } from 'lucide-react';
import { particleSentences, allParticles } from '../particles';

export default function ParticlePractice({ onExit }) {
  const [gameState, setGameState] = useState('setup'); // 'setup', 'playing', 'finished'
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [userChoice, setUserChoice] = useState(null);

  const startGame = () => {
    const shuffled = [...particleSentences].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, questionCount);

    const quizQuestions = selectedQuestions.map(q => {
      const distractors = allParticles
        .filter(p => p !== q.particle)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      const options = [q.particle, ...distractors].sort(() => 0.5 - Math.random());
      return { ...q, options };
    });

    setQuestions(quizQuestions);
    setCurrentIndex(0);
    setFeedback(null);
    setUserChoice(null);
    setScore(0);
    setResults([]);
    setGameState('playing');
  };

  const handleAnswer = (choice) => {
    if (feedback) return;

    setUserChoice(choice);
    const isCorrect = choice === questions[currentIndex].particle;

    if (isCorrect) {
      setScore(s => s + 10);
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }

    setResults(prev => [...prev, { question: questions[currentIndex], userAnswer: choice, isCorrect }]);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setFeedback(null);
        setUserChoice(null);
      } else {
        setGameState('finished');
      }
    }, 1500);
  };

  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 dark:text-white"><Milestone /> Particle Practice Setup</h2>
          <button onClick={onExit} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Exit</button>
        </div>
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg max-w-lg mx-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 dark:text-white">Number of Questions</h3>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="5" 
                max={particleSentences.length} 
                value={questionCount} 
                onChange={(e) => setQuestionCount(Number(e.target.value))} 
                className="flex-1"
              />
              <input 
                type="number" 
                min="1" 
                max={particleSentences.length}
                value={questionCount} 
                onChange={(e) => setQuestionCount(Number(e.target.value) > 0 ? Number(e.target.value) : 1)} 
                className="w-20 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white text-center"
              />
            </div>
          </div>
          <button onClick={startGame} className="w-full bg-blue-500 text-white py-3 rounded-lg text-lg font-semibold transition-colors hover:bg-blue-600">
            Start Practice ({questionCount} Questions)
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const correctCount = results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">Practice Complete!</h2>
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
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((r, i) => {
              const reviewHtml = r.isCorrect
                ? `[${r.question.particle}]`
                : `[<span class="text-red-500 dark:text-red-400">${r.userAnswer}</span>→<span class="text-green-500 dark:text-green-400">${r.question.particle}</span>]`;
              return (
                <div key={i} className={`p-2 rounded ${r.isCorrect ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>{r.question.english}</p>
                  <p className='font-semibold dark:text-white' dangerouslySetInnerHTML={{ __html: r.question.japanese.replace('___', reviewHtml) }} />
                </div>
              );
            })}
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
        <h2 className="text-2xl font-bold dark:text-white">Particle Practice</h2>
        <button onClick={onExit} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Exit</button>
      </div>
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>{currentIndex + 1} / {questions.length}</span>
          <span>Score: {score}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div></div>
      </div>
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <p className="text-gray-500 dark:text-gray-400 mb-2">Fill in the blank:</p>
          <div className="text-3xl sm:text-4xl font-bold my-4 dark:text-white">
            {currentQuestion.japanese.split('___').map((part, i) => (
              <React.Fragment key={i}>
                {part}
                {i < currentQuestion.japanese.split('___').length - 1 && (
                  <span className="inline-block w-16 mx-2 border-b-2 border-gray-400 dark:border-gray-500">&nbsp;</span>
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-gray-600 dark:text-gray-300">({currentQuestion.english})</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {currentQuestion.options.map((option, index) => {
            let buttonClass = 'bg-white dark:bg-gray-600 border-2 border-gray-200 dark:border-gray-500 hover:border-blue-300 dark:hover:border-blue-500 dark:text-white';
            if (feedback) {
              const isCorrect = currentQuestion.particle === option;
              if (isCorrect) {
                buttonClass = 'bg-green-500 text-white';
              } else if (userChoice === option) { 
                buttonClass = 'bg-red-500 text-white';
              }
            }
            return (
              <button key={index} onClick={() => handleAnswer(option)} disabled={!!feedback} className={`w-full py-4 rounded-lg font-bold transition-all text-2xl ${buttonClass}`}>
                {option}
              </button>
            )
          })}
        </div>
        
        {feedback && (
          <div className="mt-6 text-center text-xl font-bold">
            {feedback === 'correct' ? <span className="text-green-500 flex items-center justify-center gap-2"><CheckCircle /> Correct!</span> : <span className="text-red-500 flex items-center justify-center gap-2"><XCircle /> Incorrect! Correct particle is "{currentQuestion.particle}"</span>}
          </div>
        )}
      </div>
    </div>
  );
}
