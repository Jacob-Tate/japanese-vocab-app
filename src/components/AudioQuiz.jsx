// src/components/AudioQuiz.jsx
import React, { useState, useEffect } from 'react';
import { RotateCcw, Volume2, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { api } from '../api';

// Simple Text-to-Speech utility
const speak = (text, lang = 'ja-JP') => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  } else {
    alert('Sorry, your browser does not support text-to-speech.');
  }
};

export default function AudioQuiz({ set, vocabulary, onExit, questionCount = 10 }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  useEffect(() => {
    initQuiz();
    loadHighScore();
  }, []);

  const loadHighScore = async () => {
    try {
      const result = await api.getHighScore(set.id, 'audio_quiz');
      if (result) setHighScore(result.score);
    } catch (error) {
      console.error('Failed to load high score:', error);
    }
  };

  const saveGameCompletion = async (finalScore) => {
    // Always save the game session for statistics
    try {
      await api.saveGameSession(set.id, 'audio_quiz', finalScore, { questionCount });
    } catch (error) {
      console.error('Failed to save game session:', error);
    }

    // Check if it's a new high score
    if (finalScore > highScore) {
      try {
        await api.saveHighScore(set.id, 'audio_quiz', finalScore, { questionCount });
        setHighScore(finalScore);
        setIsNewHighScore(true);
      } catch (error) {
        console.error('Failed to save high score:', error);
      }
    }
  };

  const initQuiz = () => {
    const wordsInSet = vocabulary.filter(v => set.wordIds.includes(v.id));
    if (wordsInSet.length < 4) {
      // Not enough words to create a meaningful quiz
      setQuestions([]);
      return;
    }
        
    let questionPool = [...wordsInSet];
    while(questionPool.length < questionCount) {
        questionPool.push(...wordsInSet);
    }

    const quizQuestions = questionPool
      .sort(() => Math.random() - 0.5)
      .slice(0, questionCount)
      .map((correctWord) => {
        const distractors = wordsInSet
          .filter(w => w.id !== correctWord.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
                
        const options = [correctWord, ...distractors]
          .sort(() => Math.random() - 0.5);
                
        return {
          questionWord: correctWord,
          options: options.map(opt => opt.english),
          correctAnswer: correctWord.english,
        };
      });

    setQuestions(quizQuestions);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setFeedback(null);
    setScore(0);
    setIsComplete(false);
    setIsNewHighScore(false);
  };

  const handleAnswer = (answer) => {
    if (feedback) return;

    setSelectedAnswer(answer);
    const isCorrect = answer === questions[currentIndex].correctAnswer;
        
    if (isCorrect) {
      setScore(score + 10);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
        setFeedback(null);
      } else {
        const finalScore = isCorrect ? score + 10 : score;
        setIsComplete(true);
        saveGameCompletion(finalScore);
      }
    }, 1500);
  };

  if (questions.length === 0) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Audio Quiz: {set.name}</h2>
        <p className="text-red-500">This set needs at least 4 words to generate a quiz.</p>
        <button onClick={onExit} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
          Back
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
    
  if (isComplete) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Quiz Complete!</h2>
        <p className="text-lg mb-2">Your score: <span className="font-bold text-green-600">{score}</span></p>
        {highScore > 0 && <p className="text-sm mb-4">High Score: {highScore}</p>}
        {isNewHighScore && (
          <p className="text-yellow-600 font-bold mb-4 flex items-center justify-center gap-2">
            <Trophy size={24} /> New High Score!
          </p>
        )}
        <button
          onClick={initQuiz}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto"
        >
          <RotateCcw size={20} /> Try Again
        </button>
        <button onClick={onExit} className="mt-4 text-sm text-gray-600 hover:underline">
          Exit to menu
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Audio Quiz: {set.name}</h2>
        <button onClick={onExit} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
          Exit
        </button>
      </div>
            
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <div className="flex items-center gap-4">
            <span>Score: {score}</span>
            {highScore > 0 && (
              <span className="flex items-center gap-1">
                <Trophy size={16} className="text-yellow-500" />
                {highScore}
              </span>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}/>
        </div>
      </div>
            
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6 text-center">
        <p className="text-gray-600 mb-4">Listen to the word and select the correct translation:</p>
        <button 
          onClick={() => speak(currentQuestion.questionWord.japanese)}
          className="bg-blue-500 text-white rounded-full p-6 hover:bg-blue-600 transition-transform hover:scale-110 mb-8 mx-auto flex items-center justify-center"
        >
          <Volume2 size={48} />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, index) => {
            const isCorrect = option === currentQuestion.correctAnswer;
            let buttonClass = 'bg-white border-2 border-gray-200 hover:border-blue-300';
            if (feedback && selectedAnswer === option) {
              buttonClass = isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white';
            } else if (feedback && isCorrect) {
              buttonClass = 'bg-green-500 text-white';
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={!!feedback}
                className={`w-full p-4 rounded-lg font-semibold transition-all text-lg ${buttonClass}`}
              >
                {option}
              </button>
            );
          })}
        </div>
        {feedback && (
          <div className="mt-6 text-lg font-bold">
            {feedback === 'correct' ? 
              <span className="text-green-600 flex items-center justify-center gap-2"><CheckCircle /> Correct!</span> :
              <span className="text-red-600 flex items-center justify-center gap-2"><XCircle /> Incorrect!</span>
            }
          </div>
        )}
      </div>
    </div>
  );
}
