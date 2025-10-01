// src/components/SentenceScramble.jsx
import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle, XCircle } from 'lucide-react';

/**
 * A more intelligent tokenizer for Japanese sentences that splits by common particles.
 * @param {string} sentence The Japanese sentence to tokenize.
 * @returns {string[]} An array of tokens (words and particles).
 */
const tokenizeJapanese = (sentence) => {
  if (!sentence) return [];
  
  // Common particles to split by. This list can be expanded.
  const particles = ['は', 'が', 'を', 'に', 'へ', 'で', 'と', 'も', 'の'];
  
  // Create a regex that splits the string by the particles, but keeps them in the result.
  // e.g., "私は学生です" with particle "は" becomes ["私", "は", "学生です"]
  const regex = new RegExp(`(${particles.join('|')})`, 'g');
  
  const tokens = sentence
    .split(regex) // Split the sentence by the particles
    .filter(Boolean); // Filter out any empty strings that may result from the split

  // Sometimes, a word might end where a particle begins, creating a token like ["学生", "です"].
  // We can further process this, but for now, this is a huge improvement.
  // A more advanced step could involve checking for verb conjugations, but this covers the core particle issue.
  return tokens;
};


export default function SentenceScramble({ set, sentences, onExit }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wordBank, setWordBank] = useState([]);
  const [answer, setAnswer] = useState([]);
  const [feedback, setFeedback] = useState(null); // null, 'correct', 'wrong'
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const gameSentences = sentences.filter(s => (set.sentenceIds || []).includes(s.id));
    const shuffled = [...gameSentences].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setIsComplete(false);
    if (shuffled.length > 0) {
      setupQuestion(shuffled[0]);
    }
  };

  const setupQuestion = (sentence) => {
    // Use our new, smarter tokenizer!
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
      setFeedback('correct');
      setScore(score + 10);
      setTimeout(nextQuestion, 1500);
    } else {
      setFeedback('wrong');
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setupQuestion(questions[nextIndex]);
    } else {
      setIsComplete(true);
    }
  };
  
  if (questions.length === 0) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Sentence Scramble</h2>
        <p className="text-red-500">This set has no sentences to practice.</p>
        <button onClick={onExit} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Back</button>
      </div>
    );
  }
  
  if (isComplete) {
     return (
      <div className="p-4 sm:p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Well Done!</h2>
        <p className="text-lg mb-4">Final Score: <span className="font-bold text-green-600">{score}</span></p>
        <button onClick={initGame} className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto">
          <RotateCcw size={20} /> Play Again
        </button>
        <button onClick={onExit} className="mt-4 text-sm text-gray-600 hover:underline">Exit to menu</button>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Sentence Scramble: {set.name}</h2>
        <button onClick={onExit} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Exit</button>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>Score: {score}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}/>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <p className="text-gray-600 mb-2">Translate and unscramble:</p>
        <h3 className="text-2xl font-semibold mb-6 text-center">{questions[currentIndex].english}</h3>

        <div className="bg-gray-100 rounded-lg min-h-[6rem] p-3 flex flex-wrap items-center justify-center gap-2 mb-4">
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
        
        <div className="border-t-2 border-dashed my-4"></div>

        <div className="min-h-[6rem] p-3 flex flex-wrap items-center justify-center gap-2 mb-6">
           {wordBank.map((word, index) => (
            <button key={index} onClick={() => handleWordBankClick(word, index)} className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg text-lg">
              {word}
            </button>
          ))}
        </div>

        <button onClick={checkAnswer} disabled={feedback === 'correct'} className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-semibold text-lg disabled:bg-gray-400">
          Check Answer
        </button>
      </div>
    </div>
  );
}
