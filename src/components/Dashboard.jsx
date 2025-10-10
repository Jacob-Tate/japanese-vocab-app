// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Flame, Brain, BookOpen, BarChart3, Loader2 } from 'lucide-react';
import { api } from '../api';

const StatCard = ({ icon, label, value, color, loading }) => {
  const Icon = icon;
  return (
    <div className={`bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg flex items-center gap-4`}>
      <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900`}>
        <Icon size={28} className={`text-${color}-500`} />
      </div>
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        {loading ? (
          <Loader2 className="animate-spin text-gray-400 mt-1" />
        ) : (
          <div className="text-2xl font-bold dark:text-white">{value}</div>
        )}
      </div>
    </div>
  );
};

const RecentActivity = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No recent activity. Complete a practice session to see it here!
      </div>
    );
  }

  const gameModeNames = {
    srs: 'SRS Review',
    srs_sentences: 'SRS Sentences',
    quiz: 'Multiple Choice',
    typing: 'Typing Challenge',
    // ... add other names as needed
  };

  return (
    <div className="space-y-3">
      {history.slice(0, 5).map(item => (
        <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
            {new Date(item.reviewed_at + ' UTC').toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard({ onStartSrs, onStartSrsSentences, onNavigate }) {
  const [stats, setStats] = useState({
    streak: null,
    srsWords: null,
    srsSentences: null,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [streakData, srsWordsData, srsSentencesData, activityData] = await Promise.all([
          api.getStreak(),
          api.getSrsStats('all'),
          api.getSrsStatsSentences('all'),
          api.getReviews({ limit: 5 }),
        ]);
        setStats({
          streak: streakData,
          srsWords: srsWordsData,
          srsSentences: srsSentencesData,
          recentActivity: activityData,
        });
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const allContentSet = { id: 'all', name: 'All Content' };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h2 className="text-2xl font-bold dark:text-white">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={Flame} 
          label="Current Streak" 
          value={`${stats.streak?.current || 0} Days`} 
          color="orange" 
          loading={loading}
        />
        <StatCard 
          icon={Brain} 
          label="Words to Review" 
          value={stats.srsWords?.due_count || 0} 
          color="cyan"
          loading={loading}
        />
        <StatCard 
          icon={BookOpen} 
          label="Sentences to Review" 
          value={stats.srsSentences?.due_count || 0}
          color="indigo" 
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Start Studying</h3>
          <div className="space-y-4">
            <button 
              onClick={() => onStartSrs(allContentSet, { reviewOnly: false })}
              disabled={loading || !stats.srsWords || (stats.srsWords.due_count === 0 && stats.srsWords.new_count === 0)}
              className="w-full flex items-center justify-between text-left p-4 bg-cyan-50 dark:bg-cyan-900/50 hover:bg-cyan-100 dark:hover:bg-cyan-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div>
                <p className="font-bold text-cyan-800 dark:text-cyan-200">Review Words (SRS)</p>
                <p className="text-sm text-cyan-700 dark:text-cyan-400">Practice with spaced repetition</p>
              </div>
              <div className="text-center">
                <div className="font-bold text-xl text-cyan-600 dark:text-cyan-300">{stats.srsWords?.due_count || 0}</div>
                <div className="text-xs text-cyan-500 dark:text-cyan-400">Due</div>
              </div>
            </button>
            <button
              onClick={() => onStartSrsSentences(allContentSet, { reviewOnly: false })}
              disabled={loading || !stats.srsSentences || (stats.srsSentences.due_count === 0 && stats.srsSentences.new_count === 0)}
              className="w-full flex items-center justify-between text-left p-4 bg-indigo-50 dark:bg-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div>
                <p className="font-bold text-indigo-800 dark:text-indigo-200">Review Sentences (SRS)</p>
                <p className="text-sm text-indigo-700 dark:text-indigo-400">Practice sentences in context</p>
              </div>
              <div className="text-center">
                <div className="font-bold text-xl text-indigo-600 dark:text-indigo-300">{stats.srsSentences?.due_count || 0}</div>
                <div className="text-xs text-indigo-500 dark:text-indigo-400">Due</div>
              </div>
            </button>
            <button
              onClick={() => onNavigate('practice')}
              className="w-full text-left p-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <p className="font-bold text-gray-800 dark:text-gray-200">More Practice Modes</p>
              <p className="text-sm text-gray-700 dark:text-gray-400">Flashcards, quizzes, matching games and more</p>
            </button>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Recent Activity</h3>
          {loading ? (
             <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-gray-400" /></div>
          ) : (
            <RecentActivity history={stats.recentActivity} />
          )}
        </div>
      </div>
    </div>
  );
}
