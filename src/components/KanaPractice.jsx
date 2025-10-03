// src/components/KanaPractice.jsx
import React, { useState, useEffect, useRef } from 'react';
import { hiragana, katakana, kanaGroups } from '../kana';
import { Type, CheckCircle, XCircle, RotateCcw, Keyboard, ListChecks, AlertCircle, Settings } from 'lucide-react';
import KanaCharacterSelectorModal from './KanaCharacterSelectorModal';

export default function KanaPractice({ onExit }) {
  const [gameState, setGameState] = useState('setup'); // 'setup', 'playing', 'finished'
  const [settings, setSettings] = useState({
    hiragana: true,
    katakana: false,
    groups: ['gojuon'],
    quizType: 'typing', // 'typing' or 'multipleChoice'
  });
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customCharacterSet, setCustomCharacterSet] = useState([]);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (gameState === 'playing' && settings.quizType === 'typing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, gameState, settings.quizType]);

  const handleSettingChange = (type, value) => {
    const wasInCustomMode = isCustomMode;
    setIsCustomMode(false); // Always exit custom mode if standard settings are changed

    if (type === 'kana') {
      if (wasInCustomMode) {
        // If coming from custom mode, this click SETS the new state directly, it doesn't toggle.
        // This ensures the button becomes active on the first click.
        setSettings(prev => ({
          ...prev,
          hiragana: value === 'hiragana',
          katakana: value === 'katakana',
        }));
      } else {
        // Normal toggle behavior when not in custom mode.
        setSettings(prev => ({ ...prev, [value]: !prev[value] }));
      }
    } else if (type === 'group') {
      let newGroups = [...settings.groups];
      if (newGroups.includes(value)) {
        newGroups = newGroups.filter(g => g !== value);
      } else {
        newGroups.push(value);
      }
      setSettings({ ...settings, groups: newGroups });
    } else if (type === 'quizType') {
      setSettings({ ...settings, quizType: value });
    }
  };
  
  const handleSaveCustomSet = (customSet) => {
    setCustomCharacterSet(customSet);
    setIsCustomMode(true);
    setIsCharacterModalOpen(false);
  };

  const startGame = () => {
    let characterSet = [];
    if (isCustomMode) {
        characterSet = customCharacterSet;
    } else {
      if (settings.hiragana) {
        settings.groups.forEach(group => characterSet.push(...hiragana[group]));
      }
      if (settings.katakana) {
        settings.groups.forEach(group => characterSet.push(...katakana[group]));
      }
    }


    if (characterSet.length === 0) {
      return; // Should be prevented by disabled button
    }
    
    let quizQuestions = [...characterSet].sort(() => Math.random() - 0.5);

    if (settings.quizType === 'multipleChoice') {
      if (characterSet.length < 4) {
        alert("Multiple choice requires at least 4 unique characters. Please select more groups/characters to proceed.");
        return;
      }
      quizQuestions = quizQuestions.map(correctChar => {
        const distractors = characterSet
          .filter(c => c.kana !== correctChar.kana)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(d => d.romaji[0]);
        
        const options = [correctChar.romaji[0], ...distractors].sort(() => Math.random() - 0.5);

        return {
          ...correctChar,
          options: options,
        };
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

    setResults(prev => [...prev, {
      question: currentQuestion,
      userAnswer: userAnswer,
      isCorrect,
    }]);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setUserInput('');
        setFeedback(null);
      } else {
        setGameState('finished');
      }
    }, 1000);
  };

  const handleTypingSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim() || feedback) return;
    const currentQuestion = questions[currentIndex];
    const isCorrect = currentQuestion.romaji.includes(userInput.trim().toLowerCase());
    processAnswer(userInput, isCorrect);
  };

  const handleMcqAnswer = (answer) => {
    if (feedback) return;
    const currentQuestion = questions[currentIndex];
    const isCorrect = currentQuestion.romaji[0] === answer;
    processAnswer(answer, isCorrect);
  };

  if (gameState === 'setup') {
    const isSetupValid = isCustomMode ? customCharacterSet.length > 0 : (settings.groups.length > 0 && (settings.hiragana || settings.katakana));
    
    return (
      <>
        <KanaCharacterSelectorModal
          isOpen={isCharacterModalOpen}
          onClose={() => setIsCharacterModalOpen(false)}
          onSave={handleSaveCustomSet}
          initialSettings={settings}
          initialCustomSet={isCustomMode ? customCharacterSet : null}
        />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 dark:text-white"><Type /> Kana Practice Setup</h2>
            <button onClick={onExit} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Exit</button>
          </div>
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg max-w-3xl mx-auto">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 dark:text-white">1. Choose Kana Type</h3>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleSettingChange('kana', 'hiragana')} className={`p-4 rounded-lg border-2 transition-all text-center dark:text-white ${settings.hiragana ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'}`}>Hiragana (あ)</button>
                <button onClick={() => handleSettingChange('kana', 'katakana')} className={`p-4 rounded-lg border-2 transition-all text-center dark:text-white ${settings.katakana ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'}`}>Katakana (ア)</button>
              </div>
            </div>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold dark:text-white">2. Choose Character Groups</h3>
                <button onClick={() => setIsCharacterModalOpen(true)} className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  <Settings size={16}/> Preview & Customize
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {isCustomMode ? (
                  <div className="col-span-2 p-4 rounded-lg border-2 border-purple-500 bg-purple-50 dark:bg-purple-900 text-center dark:text-white">
                    Custom Set Activated ({customCharacterSet.length} characters selected)
                  </div>
                ) : (
                  kanaGroups.map(group => (
                    <button key={group.id} onClick={() => handleSettingChange('group', group.id)} className={`p-4 rounded-lg border-2 transition-all text-center dark:text-white ${settings.groups.includes(group.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'}`}>
                      {group.name}
                    </button>
                  ))
                )}
              </div>
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
            <button 
              onClick={startGame} 
              disabled={!isSetupValid}
              className="w-full bg-blue-500 text-white py-3 rounded-lg text-lg font-semibold transition-colors hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Start Quiz
            </button>
            {!isSetupValid && (
              <div className="flex items-center justify-center gap-2 mt-3 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle size={18} />
                  <p>
                    {isCustomMode ? 'Your custom set is empty.' : 'Please select at least one Kana Type and one Character Group.'}
                  </p>
              </div>
            )}
          </div>
        </div>
      </>
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
                <div className="text-2xl font-bold text-center dark:text-white">{r.question.kana}</div>
                <div className="text-center text-sm">{r.isCorrect ? <span className="text-green-700 dark:text-green-300">✓ {r.userAnswer}</span> : <><span className="text-red-700 dark:text-red-300 line-through">✗ {r.userAnswer}</span><br /><span className="text-green-700 dark:text-green-300">{r.question.romaji.join('/')}</span></>}</div>
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
        <h2 className="text-2xl font-bold dark:text-white">Kana Practice</h2>
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
          <p className="text-gray-500 dark:text-gray-400">What is the romaji for:</p>
          <div className="text-8xl font-bold my-4 dark:text-white">{currentQuestion.kana}</div>
        </div>

        {settings.quizType === 'typing' ? (
          <form onSubmit={handleTypingSubmit}>
            <input ref={inputRef} type="text" value={userInput} onChange={e => setUserInput(e.target.value)} disabled={!!feedback} className="w-full text-center text-2xl p-4 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-600 dark:text-white" autoComplete="off" autoCapitalize="off" />
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = 'bg-white dark:bg-gray-600 border-2 border-gray-200 dark:border-gray-500 hover:border-blue-300 dark:hover:border-blue-500 dark:text-white';
              if (feedback) {
                const isCorrect = currentQuestion.romaji[0] === option;
                if(isCorrect) {
                  buttonClass = 'bg-green-500 text-white';
                } else if (userInput === option) { 
                  buttonClass = 'bg-red-500 text-white';
                }
              }
              return (
                <button key={index} onClick={() => { setUserInput(option); handleMcqAnswer(option); }} disabled={!!feedback} className={`w-full p-4 rounded-lg font-semibold transition-all text-lg ${buttonClass}`}>
                  {option}
                </button>
              )
            })}
          </div>
        )}
        
        {feedback && (
          <div className="mt-4 text-center text-xl font-bold">
            {feedback.type === 'correct' ? <span className="text-green-500 flex items-center justify-center gap-2"><CheckCircle /> Correct! +{feedback.points}</span> : <span className="text-red-500 flex items-center justify-center gap-2"><XCircle /> Incorrect! Correct: {currentQuestion.romaji.join(' / ')}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
