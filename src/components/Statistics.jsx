// src/components/Statistics.jsx
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Target, Award, Calendar, CheckCircle, XCircle, Flame, BookOpen } from 'lucide-react';
import { api } from '../api';

const StreakWidget = ({ streakData }) => {
  if (!streakData) return null;
  const { current } = streakData;

  return (
    <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-lg p-6 shadow-lg text-center">
      <Flame size={48} className="mx-auto mb-2 opacity-80" />
      <div className="text-5xl font-bold">{current}</div>
      <div className="text-xl font-semibold">{current === 1 ? 'Day Streak' : 'Day Streak'}!</div>
      <p className="text-sm opacity-80 mt-1">
        {current > 0 ? 'Keep practicing every day!' : 'Practice today to start a new streak!'}
      </p>
    </div>
  );
};

const ReviewHistory = ({ history }) => {
  const gameModeNames = {
    srs: 'SRS Review',
    srs_sentences: 'SRS Sentences',
    quiz: 'Multiple Choice',
    typing: 'Typing Challenge',
    audio_quiz: 'Audio Quiz',
    sentence_scramble: 'Sentence Scramble',
    flashcard: 'Flashcard Drill',
    flashcard_sentences: 'Sentence Flashcards',
  };

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">Recent Activity</h3>
      {history.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No review history yet. Complete a practice session to see your activity here.</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.map(item => (
            <div key={item.id} className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex-shrink-0 mt-1">
                {item.item_type === 'session' ? (
                  <BookOpen size={24} className="text-blue-500" />
                ) : item.result === 'correct' ? (
                  <CheckCircle size={24} className="text-green-500" />
                ) : (
                  <XCircle size={24} className="text-red-500" />
                )}
              </div>
              <div className="flex-grow">
                {item.item_type === 'session' ? (
                  <>
                    <p className="font-semibold dark:text-white">{gameModeNames[item.game_mode] || item.game_mode} on "{item.set_name}"</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.result}</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold dark:text-white">{item.japanese}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{gameModeNames[item.game_mode] || item.game_mode}</p>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                {new Date(item.reviewed_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [streak, setStreak] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const [
        vocab,
        sentences,
        sets,
        gameStats,
        allSessions,
        streakData,
        reviewHistory
      ] = await Promise.all([
        api.getAllVocab(),
        api.getAllSentences(),
        api.getAllSets(),
        api.getGameStatistics(),
        api.getAllGameSessions(),
        api.getStreak(),
        api.getReviews(),
      ]);

      const totalScore = allSessions.reduce((sum, session) => sum + session.score, 0);
            
      setStats({
        totalWords: vocab.length,
        totalSentences: sentences.length,
        totalSets: sets.length,
        totalGamesPlayed: allSessions.length,
        totalScore,
        averageScore: allSessions.length > 0 ? Math.round(totalScore / allSessions.length) : 0,
        gameStats: gameStats.reduce((acc, stat) => {
          acc[stat.game_mode] = {
            count: stat.total_plays,
            totalScore: stat.total_score,
            averageScore: Math.round(stat.average_score),
            bestScore: stat.best_score,
            worstScore: stat.worst_score
          };
          return acc;
        }, {}),
      });

      setStreak(streakData);
      setReviews(reviewHistory);

    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center dark:text-white">Loading statistics...</div>;
  }

  const gameModeNames = {
    matching: 'Matching Game',
    speedmatch: 'Speed Match',
    quiz: 'Multiple Choice',
    typing: 'Typing Challenge',
    memory: 'Memory Pairs',
    audio_quiz: 'Audio Quiz',
    sentence_scramble: 'Sentence Scramble',
    typing_blitz: 'Typing Blitz',
    crossword: 'Crossword',
    flashcard: 'Flashcard Drill',
    flashcard_sentences: 'Sentence Flashcards',
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 dark:text-white">
        <BarChart3 size={28} className="text-blue-500" />
        Your Learning Statistics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <StreakWidget streakData={streak} />
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2"><Target size={24} /><span className="text-3xl font-bold">{stats.totalWords}</span></div>
            <p className="text-blue-100">Total Words</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2"><BarChart3 size={24} /><span className="text-3xl font-bold">{stats.totalSets}</span></div>
            <p className="text-purple-100">Study Sets</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2"><TrendingUp size={24} /><span className="text-3xl font-bold">{stats.totalGamesPlayed}</span></div>
            <p className="text-green-100">Games Played</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2"><Award size={24} /><span className="text-3xl font-bold">{stats.totalScore}</span></div>
            <p className="text-yellow-100">Total Points</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReviewHistory history={reviews} />
        
        {Object.keys(stats.gameStats).length > 0 && (
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Performance by Game Mode</h3>
            <div className="space-y-4">
              {Object.entries(stats.gameStats).map(([mode, data]) => (
                <div key={mode} className="border-b dark:border-gray-600 pb-4 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold dark:text-white">{gameModeNames[mode] || mode}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{data.count} games played</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Best: </span>
                      <span className="font-bold text-green-600 dark:text-green-400">{data.bestScore}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Average: </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{data.averageScore}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Worst: </span>
                      <span className="font-bold text-gray-600 dark:text-gray-400">{data.worstScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
