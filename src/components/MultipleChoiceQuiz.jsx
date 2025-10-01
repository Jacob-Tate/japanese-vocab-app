import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle, XCircle, Star } from 'lucide-react';

export default function MultipleChoiceQuiz({ set, vocabulary, onExit, startingSide = 'japanese', questionCount = 10 }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);

  useEffect(() => {
    initQuiz();
  }, []);

  const initQuiz = () => {
    const words = vocabulary.filter(v => set.wordIds.includes(v.id));
    
    // Create question pool - repeat words if needed to reach questionCount
    let questionPool = [...words];
    while (questionPool.length < questionCount) {
      questionPool = [...questionPool, ...words];
    }
    
    const shuffled = questionPool.sort(() => Math.random() - 0.5).slice(0, questionCount);
    
    const quizQuestions = shuffled.map(word => {
      const correctAnswer = startingSide === 'japanese' ? word.english : word.japanese;
      const question = startingSide === 'japanese' ? word.japanese : word.english;
      
      // Get 3 wrong answers
      const otherWords = words.filter(w => w.id !== word.id);
      const wrongOptions = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => startingSide === 'japanese' ? w.english : w.japanese);
      
      // Combine and shuffle options
      const options = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
      
      return {
        word,
        question,
        correctAnswer,
        options
      };
    });
    
    setQuestions(quizQuestions);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setWrongAnswers([]);
  };

  const handleAnswerClick = (answer) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    const currentQuestion = questions[currentIndex];
    if (answer === currentQuestion.correctAnswer) {
      setScore(score + 10);
    } else {
      setScore(Math.max(0, score - 5));
      setWrongAnswers([...wrongAnswers, currentQuestion]);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };

  if (questions.length === 0) return <div>Loading...</div>;

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isComplete = currentIndex === questions.length - 1 && isAnswered;
  const correctCount = score / 10;
  const percentage = Math.round((correctCount / questions.length) * 100);

  const getStarRating = () => {
    if (percentage >= 90) return 3;
    if (percentage >= 70) return 2;
    if (percentage >= 50) return 1;
    return 0;
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Multiple Choice: {set.name}</h2>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 w-full sm:w-auto"
        >
          Exit
        </button>
      </div>

      {!isComplete ? (
        <>
          <div className="mb-4">
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>Score: {score}</span>
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
              {startingSide === 'japanese' ? 'Japanese → English' : 'English → Japanese'}
            </p>
            <h3 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
              {currentQuestion.question}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((option, index) => {
                const isCorrect = option === currentQuestion.correctAnswer;
                const isSelected = option === selectedAnswer;
                
                let buttonClass = 'w-full p-4 rounded-lg text-left font-medium transition-all border-2 ';
                
                if (!isAnswered) {
                  buttonClass += 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50';
                } else if (isCorrect) {
                  buttonClass += 'bg-green-100 border-green-500 text-green-800';
                } else if (isSelected && !isCorrect) {
                  buttonClass += 'bg-red-100 border-red-500 text-red-800';
                } else {
                  buttonClass += 'bg-gray-100 border-gray-300 text-gray-500';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerClick(option)}
                    disabled={isAnswered}
                    className={buttonClass}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {isAnswered && isCorrect && <CheckCircle className="text-green-600" size={24} />}
                      {isAnswered && isSelected && !isCorrect && <XCircle className="text-red-600" size={24} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {isAnswered && (
            <button
              onClick={handleNext}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-semibold"
            >
              {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
            </button>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">Quiz Complete!</h3>
          
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map(star => (
              <Star
                key={star}
                size={40}
                className={star <= getStarRating() ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>

          <div className="text-5xl font-bold text-blue-600 mb-2">{percentage}%</div>
          <p className="text-xl mb-6">
            {correctCount} / {questions.length} correct
          </p>

          {wrongAnswers.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-semibold text-red-800 mb-3">Review Incorrect Answers:</h4>
              <div className="space-y-2">
                {wrongAnswers.map((q, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{q.question}</span> → <span className="text-green-700">{q.correctAnswer}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={initQuiz}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto"
          >
            <RotateCcw size={20} /> Try Again
          </button>
        </div>
      )}
    </div>
  );
}
