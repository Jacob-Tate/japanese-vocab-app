// src/components/ConjugationPractice.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FilePenLine, CheckCircle, XCircle, RotateCcw, AlertCircle, Keyboard, ListChecks } from 'lucide-react';
import { verbs, conjugationForms } from '../conjugation';

export default function ConjugationPractice({ onExit }) {
  const [gameState, setGameState] = useState('setup'); // 'setup', 'playing', 'finished'
  const [settings, setSettings] = useState({
    verbTypes: ['ichidan', 'godan'],
    forms: ['masu', 'nai'],
    quizType: 'typing',
  });
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    const currentInput = inputRef.current;
    if (gameState === 'playing' && currentInput && settings.quizType === 'typing') {
      wanakana.bind(currentInput, { IMEMode: true });
      return () => {
        if (wanakana.isBound(currentInput)) {
          wanakana.unbind(currentInput);
        }
      };
    }
  }, [gameState, settings.quizType]);

  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, gameState]);

  const handleSettingChange = (type, value) => {
    if (type === 'quizType') {
        setSettings(prev => ({ ...prev, quizType: value }));
        return;
    }
    setSettings(prev => {
        let newValues = [...prev[type]];
        if (newValues.includes(value)) {
            newValues = newValues.filter(v => v !== value);
        } else {
            newValues.push(value);
        }
        return { ...prev, [type]: newValues };
    });
  };

  const startGame = () => {
    const practiceVerbs = verbs.filter(v => settings.verbTypes.includes(v.type));
    if (practiceVerbs.length === 0 || settings.forms.length === 0) return;

    let quizQuestions = [];
    practiceVerbs.forEach(verb => {
        settings.forms.forEach(formId => {
            quizQuestions.push({
                verb,
                formId,
                formName: conjugationForms.find(f => f.id === formId).name,
                answer: verb.conjugations[formId],
            });
        });
    });

    if (settings.quizType === 'multipleChoice' && quizQuestions.length < 4) {
        alert("Multiple choice requires at least 4 unique questions. Please select more verb types or forms.");
        return;
    }
    
    quizQuestions.sort(() => Math.random() - 0.5);

    if (settings.quizType === 'multipleChoice') {
        quizQuestions = quizQuestions.map(q => {
            const distractors = verbs
                .filter(v => v.dictionary !== q.verb.dictionary) // Different verb
                .map(v => v.conjugations[q.formId]) // Same form
                .filter(c => c && c !== q.answer) // Must exist and not be the answer
                
            const uniqueDistractors = [...new Set(distractors)];
            const shuffledDistractors = uniqueDistractors.sort(() => Math.random() - 0.5).slice(0, 3);
            
            const options = [q.answer, ...shuffledDistractors].sort(() => Math.random() - 0.5);
            return { ...q, options };
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
     if (isCorrect) {
      const points = 10 + streak;
      setScore(score + points);
      setStreak(streak + 1);
      setFeedback({ type: 'correct', points });
    } else {
      setStreak(0);
      setFeedback({ type: 'incorrect' });
    }

    setResults(prev => [...prev, { question: questions[currentIndex], userAnswer, isCorrect }]);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setUserInput('');
        setFeedback(null);
      } else {
        setGameState('finished');
      }
    }, 1500);
  }

  const handleTypingSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim() || feedback) return;
    const currentQuestion = questions[currentIndex];
    const isCorrect = userInput.trim() === currentQuestion.answer;
    processAnswer(userInput.trim(), isCorrect);
  };

  const handleMcqAnswer = (answer) => {
      if (feedback) return;
      setUserInput(answer);
      const currentQuestion = questions[currentIndex];
      const isCorrect = answer === currentQuestion.answer;
      processAnswer(answer, isCorrect);
  };

  if (gameState === 'setup') {
    const isSetupValid = settings.verbTypes.length > 0 && settings.forms.length > 0;
    const verbTypes = [
        {id: 'ichidan', name: 'Ichidan Verbs (る-verbs)'},
        {id: 'godan', name: 'Godan Verbs (う-verbs)'},
        {id: 'irregular', name: 'Irregular Verbs (する, 来る)'},
    ];
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 dark:text-white"><FilePenLine /> Conjugation Practice Setup</h2>
          <button onClick={onExit} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Exit</button>
        </div>
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold mb-3 dark:text-white">1. Choose Verb Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {verbTypes.map(type => (
              <button key={type.id} onClick={() => handleSettingChange('verbTypes', type.id)} className={`p-4 rounded-lg border-2 transition-all text-center dark:text-white ${settings.verbTypes.includes(type.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'}`}>
                {type.name}
              </button>
            ))}
          </div>
          <h3 className="text-lg font-semibold mb-3 dark:text-white">2. Choose Forms to Practice</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {conjugationForms.map(form => (
              <button key={form.id} onClick={() => handleSettingChange('forms', form.id)} className={`p-4 rounded-lg border-2 transition-all text-center dark:text-white ${settings.forms.includes(form.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'}`}>
                {form.name}
              </button>
            ))}
          </div>
          <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 dark:text-white">3. Choose Quiz Type</h3>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleSettingChange('quizType', 'typing')} className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center dark:text-white ${settings.quizType === 'typing' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'}`}>
                  <Keyboard size={24} className="mb-2"/> Typing
                </button>
                <button onClick={() => handleSettingChange('quizType', 'multipleChoice')} className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center dark:text-white ${settings.quizType === 'multipleChoice' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'}`}>
                  <ListChecks size={24} className="mb-2"/> Multiple Choice
                </button>
              </div>
            </div>
          <button onClick={startGame} disabled={!isSetupValid} className="w-full bg-blue-500 text-white py-3 rounded-lg text-lg font-semibold transition-colors hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
            Start Practice
          </button>
          {!isSetupValid && (
            <div className="flex items-center justify-center gap-2 mt-3 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={18} />
              <p>Please select at least one verb type and one form.</p>
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
          <h4 className="font-semibold mb-2 dark:text-white">Review your mistakes:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {results.filter(r => !r.isCorrect).map((r, i) => (
              <div key={i} className="p-2 rounded bg-red-100 dark:bg-red-900">
                <div className="text-md font-bold text-center dark:text-white">{r.question.verb.dictionary} <span className="text-sm font-normal">({r.question.formName})</span></div>
                <div className="text-center text-sm">
                    <span className="text-red-700 dark:text-red-300 line-through">✗ {r.userAnswer}</span><br />
                    <span className="text-green-700 dark:text-green-300">✓ {r.question.answer}</span>
                </div>
              </div>
            ))}
             {results.filter(r => !r.isCorrect).length === 0 && <p className='text-center text-gray-500 dark:text-gray-400 col-span-2 p-4'>No mistakes! Great job!</p>}
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
        <h2 className="text-2xl font-bold dark:text-white">Conjugation Practice</h2>
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
          <p className="text-gray-500 dark:text-gray-400">What is the <span className='font-semibold text-blue-600 dark:text-blue-400'>{currentQuestion.formName}</span> of...</p>
          <div className="text-5xl font-bold my-4 dark:text-white">
            {currentQuestion.verb.dictionary}
          </div>
           <p className="text-gray-500 dark:text-gray-400">({currentQuestion.verb.english})</p>
        </div>
        
        {settings.quizType === 'typing' ? (
            <form onSubmit={handleTypingSubmit}>
                <input ref={inputRef} type="text" value={userInput} onChange={e => setUserInput(e.target.value)} disabled={!!feedback} className="w-full text-center text-2xl p-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-600 dark:text-white" placeholder="Type the answer in Japanese..." autoComplete="off" autoCapitalize="off" />
            </form>
        ) : (
            <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => {
                    let buttonClass = 'bg-white dark:bg-gray-600 border-2 border-gray-200 dark:border-gray-500 hover:border-blue-300 dark:hover:border-blue-500 dark:text-white';
                    if (feedback) {
                        const isCorrect = currentQuestion.answer === option;
                        if (isCorrect) {
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
