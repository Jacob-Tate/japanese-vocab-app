// src/components/PracticeSelector.jsx
import React, { useState, useEffect } from 'react';
import { Book, Play, Layers, Zap, ListChecks, Keyboard, Grid3x3, Volume2, Trophy, MessageSquare, Diameter, Brain, Type, Sigma } from 'lucide-react';
import { api } from '../api';

function HighScores({ scores }) {
  if (!scores || scores.length === 0) {
    return <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">No high scores yet for this set.</p>;
  }

  const gameModeNames = {
    speedmatch: 'Speed Match', quiz: 'Quiz', typing: 'Typing',
    memory: 'Memory Pairs', audio_quiz: 'Audio Quiz'
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 dark:text-gray-200"><Trophy size={16} className="text-yellow-500" />High Scores</h4>
      <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-2 space-y-1">
        {scores.map(score => (<div key={score.game_mode} className="flex justify-between items-center text-xs"><span className="text-gray-700 dark:text-gray-300">{gameModeNames[score.game_mode] || score.game_mode}</span><span className="font-bold text-blue-600 dark:text-blue-400">{score.score}</span></div>))}
      </div>
    </div>
  );
}

export default function PracticeSelector({ sets, vocabulary, onStartGame, onStartFlashcard, onStartSpeedMatch, onStartQuiz, onStartTyping, onStartTypingBlitz, onStartMemory, onStartAudioQuiz, onStartSentenceScramble, onStartSrs, onStartKanaPractice, onStartCountersQuiz }) {
  const [selectedSets, setSelectedSets] = useState([]);
  const [highScores, setHighScores] = useState([]);
  const [mode, setMode] = useState(null);
  const [repetitions, setRepetitions] = useState(3);
  const [startingSide, setStartingSide] = useState('japanese');
  const [questionCount, setQuestionCount] = useState(10);
  const [romajiMode, setRomajiMode] = useState(false);

  const allVocabSet = {
    id: 'all',
    name: 'All Vocabulary',
    wordIds: vocabulary.map(v => v.id),
    sentenceIds: [],
  };
  const displaySets = [allVocabSet, ...sets];

  useEffect(() => {
    if (selectedSets.length === 1 && selectedSets[0].id !== 'all') {
      api.getAllHighScores(selectedSets[0].id).then(setHighScores).catch(() => setHighScores([]));
    } else {
      setHighScores([]);
    }
  }, [selectedSets]);

  const handleSetSelection = (set) => {
    setMode(null); // Reset mode when set selection changes
    if (set.id === 'all') {
      setSelectedSets(prev => prev.some(s => s.id === 'all') ? [] : [allVocabSet]);
      return;
    }

    let newSelectedSets = selectedSets.filter(s => s.id !== 'all');
    const index = newSelectedSets.findIndex(s => s.id === set.id);
    if (index > -1) {
      newSelectedSets.splice(index, 1);
    } else {
      newSelectedSets.push(set);
    }
    setSelectedSets(newSelectedSets);
  };
  
  const handleStart = () => {
    if (selectedSets.length > 0 && mode) {
      let gameSet;
      if (selectedSets.length === 1) {
        gameSet = selectedSets[0];
      } else {
        gameSet = {
          id: 'combined', // Special ID for combined sets
          name: selectedSets.length > 2 
                ? `${selectedSets.slice(0, 2).map(s => s.name).join(', ')} & ${selectedSets.length - 2} more`
                : selectedSets.map(s => s.name).join(' + '),
          wordIds: [...new Set(selectedSets.flatMap(s => s.wordIds || []))],
          sentenceIds: [...new Set(selectedSets.flatMap(s => s.sentenceIds || []))],
          sourceSetIds: selectedSets.map(s => s.id),
        };
      }

      switch(mode) {
        case 'matching': onStartGame(gameSet, repetitions); break;
        case 'speedmatch': onStartSpeedMatch(gameSet, repetitions); break;
        case 'flashcard': onStartFlashcard(gameSet, startingSide); break;
        case 'quiz': onStartQuiz(gameSet, startingSide, questionCount); break;
        case 'typing': onStartTyping(gameSet, startingSide, questionCount, romajiMode); break;
        case 'memory': onStartMemory(gameSet); break;
        case 'audioQuiz': onStartAudioQuiz(gameSet, questionCount); break;
        case 'sentenceScramble': onStartSentenceScramble(gameSet); break;
        case 'typingBlitz': onStartTypingBlitz(gameSet, startingSide, romajiMode); break;
        case 'srs': onStartSrs(gameSet); break;
      }
    }
  };

  const wordGameModes = [
    { key: 'srs', name: 'Spaced Repetition', desc: 'Review words due today', icon: Brain, color: 'cyan', content: 'words' },
    { key: 'flashcard', name: 'Flashcard Drill', desc: 'Study cards in random order', icon: Book, color: 'blue', content: 'words' },
    { key: 'quiz', name: 'Multiple Choice', desc: 'Choose the right answer', icon: ListChecks, color: 'green', content: 'words' },
    { key: 'typing', name: 'Typing Challenge', desc: 'Type the translation', icon: Keyboard, color: 'purple', content: 'words' },
    { key: 'matching', name: 'Matching Game', desc: 'Match Japanese with English', icon: Layers, color: 'blue', content: 'words' },
    { key: 'speedmatch', name: 'Speed Match', desc: 'Timed with combos!', icon: Zap, color: 'yellow', content: 'words' },
    { key: 'typingBlitz', name: 'Typing Blitz', desc: 'Falling words arcade game', icon: Diameter, color: 'red', content: 'words' },
    { key: 'memory', name: 'Memory Pairs', desc: 'Classic memory card game', icon: Grid3x3, color: 'pink', content: 'words' },
    { key: 'audioQuiz', name: 'Audio Quiz', desc: 'Listen and choose', icon: Volume2, color: 'teal', content: 'words' },
  ];
  const sentenceGameModes = [
    { key: 'sentenceScramble', name: 'Sentence Scramble', desc: 'Unscramble the sentence', icon: MessageSquare, color: 'indigo', content: 'sentences' },
  ];

  const filteredWordGameModes = wordGameModes.filter(m => {
    // Only show the SRS option if a single set is selected.
    if (m.key === 'srs') {
      return selectedSets.length === 1;
    }
    return true;
  });
  
  const combinedSetForCount = selectedSets.length > 1 ? {
    wordIds: [...new Set(selectedSets.flatMap(s => s.wordIds || []))],
    sentenceIds: [...new Set(selectedSets.flatMap(s => s.sentenceIds || []))],
  } : (selectedSets[0] || { wordIds: [], sentenceIds: [] });
  
  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 dark:text-white">Practice Mode</h2>
      
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4 dark:text-white">Fundamentals Practice</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Practice the basics. No set selection required.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button onClick={onStartKanaPractice} className="p-4 rounded-lg border-2 transition-all text-center border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer">
            <Type className="w-8 h-8 mb-2 mx-auto text-indigo-500" />
            <div className="font-semibold dark:text-white">Kana Practice</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Quiz for Hiragana & Katakana</div>
          </button>
          <button onClick={onStartCountersQuiz} className="p-4 rounded-lg border-2 transition-all text-center border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer">
            <Sigma className="w-8 h-8 mb-2 mx-auto text-orange-500" />
            <div className="font-semibold dark:text-white">Counters Quiz</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Practice counting things (本, 枚...)</div>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4 dark:text-white">Vocabulary & Set Practice</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">1. Select Set(s)</p>
        <div className="space-y-2">
          {displaySets.map((set) => (
            <button key={set.id} onClick={() => handleSetSelection(set)} className={`w-full p-4 rounded-lg text-left transition-all ${selectedSets.some(s => s.id === set.id) ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500'}`}>
              <div className="font-semibold dark:text-white">{set.name}</div>
              <div className={`text-sm ${selectedSets.some(s => s.id === set.id) ? 'opacity-80' : 'opacity-80 dark:text-gray-300'}`}>
                {(set.wordIds || []).length} words, {(set.sentenceIds || []).length} sentences
              </div>
            </button>
          ))}
        </div>
        {selectedSets.length === 1 && selectedSets[0].id !== 'all' && <HighScores scores={highScores} />}
      </div>

      {selectedSets.length > 0 && (
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4 dark:text-white">2. Select Practice Mode</h3>

          <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300">Vocabulary Practice</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWordGameModes.map(m => {
              const hasContent = (combinedSetForCount.wordIds || []).length > 0;
              return (
                <button key={m.key} onClick={() => hasContent && setMode(m.key)} disabled={!hasContent} className={`p-4 rounded-lg border-2 transition-all text-center ${mode === m.key ? `border-${m.color}-500 bg-${m.color}-50 dark:bg-${m.color}-900` : 'border-gray-200 dark:border-gray-600'} ${hasContent ? 'hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer' : 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800'}`}>
                  <m.icon className={`w-8 h-8 mb-2 mx-auto text-${m.color}-500`} />
                  <div className="font-semibold dark:text-white">{m.name}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{m.desc}</div>
                  {!hasContent && <div className="text-xs text-red-500 dark:text-red-400 mt-1">(Needs words)</div>}
                </button>
              );
            })}
          </div>

          <h4 className="font-medium mt-6 mb-3 text-gray-700 dark:text-gray-300">Sentence Practice</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sentenceGameModes.map(m => {
              const hasContent = (combinedSetForCount.sentenceIds || []).length > 0;
              return (
                <button key={m.key} onClick={() => hasContent && setMode(m.key)} disabled={!hasContent} className={`p-4 rounded-lg border-2 transition-all text-center ${mode === m.key ? `border-${m.color}-500 bg-${m.color}-50 dark:bg-${m.color}-900` : 'border-gray-200 dark:border-gray-600'} ${hasContent ? 'hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer' : 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800'}`}>
                  <m.icon className={`w-8 h-8 mb-2 mx-auto text-${m.color}-500`} />
                  <div className="font-semibold dark:text-white">{m.name}</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{m.desc}</div>
                  {!hasContent && <div className="text-xs text-red-500 dark:text-red-400 mt-1">(Needs sentences)</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedSets.length > 0 && mode && (
        <>
          {(mode === 'matching' || mode === 'speedmatch') && (
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4 dark:text-white">Game Settings</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Repetitions per word</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="1" max="5" value={repetitions} onChange={(e) => setRepetitions(Number(e.target.value))} className="flex-1"/>
                  <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 w-8 sm:w-12 text-center">{repetitions}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">Each word will appear {repetitions} time{repetitions !== 1 ? 's' : ''} ({(combinedSetForCount.wordIds || []).length} words × {repetitions} = {(combinedSetForCount.wordIds || []).length * repetitions} total matches)</p>
              </div>
            </div>
          )}
                    
          {(mode === 'flashcard' || mode === 'quiz' || mode === 'typing' || mode === 'audioQuiz') && (
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4 dark:text-white">{mode.charAt(0).toUpperCase() + mode.slice(1)} Settings</h3>
                            
              {(mode === 'quiz' || mode === 'typing' || mode === 'audioQuiz') && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Number of questions</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="5" max="30" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="flex-1"/>
                    <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 w-12 text-center">{questionCount}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {combinedSetForCount && questionCount > (combinedSetForCount.wordIds || []).length && (combinedSetForCount.wordIds || []).length > 0 ? `Words will repeat (only ${(combinedSetForCount.wordIds || []).length} unique words in set)`: `${questionCount} questions selected`}
                  </p>
                </div>
              )}
                            
              {mode === 'typing' && startingSide === 'english' && (
                <div className="mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={romajiMode} onChange={(e) => setRomajiMode(e.target.checked)} className="w-5 h-5 text-blue-600"/>
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Romaji Input</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Type in romaji (e.g., "konnichiwa") instead of kana</p>
                    </div>
                  </label>
                </div>
              )}
                            
              {(mode === 'flashcard' || mode === 'quiz' || mode === 'typing') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Starting side</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => setStartingSide('japanese')} className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${startingSide === 'japanese' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-400'}`}>
                      <div className="font-semibold text-base sm:text-lg mb-1 dark:text-white">日本語 → English</div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Show Japanese first</div>
                    </button>
                    <button onClick={() => setStartingSide('english')} className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${startingSide === 'english' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-400'}`}>
                      <div className="font-semibold text-base sm:text-lg mb-1 dark:text-white">English → 日本語</div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Show English first</div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
                    
          {mode === 'typingBlitz' && (
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4 dark:text-white">Typing Blitz Settings</h3>
                            
              {startingSide === 'english' && (
                <div className="mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={romajiMode} onChange={(e) => setRomajiMode(e.target.checked)} className="w-5 h-5 text-blue-600"/>
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Romaji Input</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Type in romaji (e.g., "konnichiwa") instead of kana</p>
                    </div>
                  </label>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Falling Language</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => setStartingSide('japanese')} className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${startingSide === 'japanese' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-400'}`}>
                    <div className="font-semibold text-base sm:text-lg mb-1 dark:text-white">日本語 Falling</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Type the English translation</div>
                  </button>
                  <button onClick={() => setStartingSide('english')} className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${startingSide === 'english' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-400'}`}>
                    <div className="font-semibold text-base sm:text-lg mb-1 dark:text-white">English Falling</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Type the Japanese translation</div>
                  </button>
                </div>
              </div>
            </div>
          )}
                    
          {(mode !== 'srs') ? (
            <button onClick={handleStart} className="w-full bg-green-500 text-white py-3 sm:py-4 rounded-lg hover:bg-green-600 text-base sm:text-lg font-semibold flex items-center justify-center gap-2"><Play size={24} /> Start Practice</button>
          ) : (
            <button onClick={handleStart} className="w-full bg-cyan-500 text-white py-3 sm:py-4 rounded-lg hover:bg-cyan-600 text-base sm:text-lg font-semibold flex items-center justify-center gap-2"><Brain size={24} /> Start SRS Review</button>
          )}
        </>
      )}
    </div>
  );
}
