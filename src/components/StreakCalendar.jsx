// src/components/StreakCalendar.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function StreakCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeDays, setActiveDays] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityForMonth(currentDate);
  }, [currentDate]);

  const fetchActivityForMonth = async (date) => {
    setLoading(true);
    const year = date.getFullYear();
    const month = date.getMonth();

    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    try {
      const history = await api.getReviews({ startDate, endDate });
      const days = new Set(history.map(item => new Date(item.reviewed_at + ' UTC').getDate()));
      setActiveDays(days);
    } catch (error) {
      console.error("Failed to fetch activity:", error);
      setActiveDays(new Set());
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (offset) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    return (
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-xs sm:text-sm text-gray-500 dark:text-gray-400">{day}</div>
        ))}
        {blanks.map((_, i) => <div key={`blank-${i}`} />)}
        {days.map(day => {
          const isToday = isCurrentMonth && day === today.getDate();
          const isActive = activeDays.has(day);
          
          let dayClass = 'w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full transition-colors ';
          if (isToday) {
            dayClass += 'font-bold ring-2 ring-blue-500 ';
          }
          if (isActive) {
            dayClass += 'bg-green-400 text-white ';
          } else {
            dayClass += 'bg-gray-100 dark:bg-gray-600 dark:text-gray-200 ';
          }

          return (
            <div key={day} className={dayClass}>
              {day}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
          <ChevronLeft className="dark:text-gray-300" />
        </button>
        <h3 className="text-lg sm:text-xl font-bold dark:text-white">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
          <ChevronRight className="dark:text-gray-300" />
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : (
        renderCalendar()
      )}
       <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-400"></div><span>Active Day</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full ring-2 ring-blue-500"></div><span>Today</span></div>
      </div>
    </div>
  );
}
