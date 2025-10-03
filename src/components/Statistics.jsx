// src/components/Statistics.jsx
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Target, Award, Calendar } from 'lucide-react';
import { api } from '../api';

export default function Statistics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const vocab = await api.getAllVocab();
      const sentences = await api.getAllSentences();
      const sets = await api.getAllSets();
      const gameStats = await api.getGameStatistics();
      const allSessions = await api.getAllGameSessions();

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
        recentActivity: allSessions.slice(0, 10)
      });
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  if (!stats) {
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
    crossword: 'Crossword'
  };

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2 dark:text-white">
        <BarChart3 size={28} className="text-blue-500" />
        Your Learning Statistics
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Target size={24} />
            <span className="text-3xl font-bold">{stats.totalWords}</span>
          </div>
          <p className="text-blue-100">Total Words</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 size={24} />
            <span className="text-3xl font-bold">{stats.totalSets}</span>
          </div>
          <p className="text-purple-100">Study Sets</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={24} />
            <span className="text-3xl font-bold">{stats.totalGamesPlayed}</span>
          </div>
          <p className="text-green-100">Games Played</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Award size={24} />
            <span className="text-3xl font-bold">{stats.totalScore}</span>
          </div>
          <p className="text-yellow-100">Total Points</p>
        </div>
      </div>

      {Object.keys(stats.gameStats).length > 0 && (
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 mb-6">
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

      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Learning Insights</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
              <Target className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div>
              <p className="font-semibold dark:text-white">Vocabulary Progress</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You have {stats.totalWords} words and {stats.totalSentences} sentences to practice
              </p>
            </div>
          </div>

          {stats.totalGamesPlayed > 0 && (
            <>
              <div className="flex items-start gap-3">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded">
                  <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <p className="font-semibold dark:text-white">Average Performance</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your average score across all games is {stats.averageScore} points
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded">
                  <Calendar className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <div>
                  <p className="font-semibold dark:text-white">Practice Sessions</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You've completed {stats.totalGamesPlayed} practice {stats.totalGamesPlayed === 1 ? 'session' : 'sessions'}
                  </p>
                </div>
              </div>
            </>
          )}

          {stats.totalGamesPlayed === 0 && (
            <div className="flex items-start gap-3">
              <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded">
                <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />
              </div>
              <div>
                <p className="font-semibold dark:text-white">Get Started!</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Start practicing to track your progress and see detailed statistics
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
