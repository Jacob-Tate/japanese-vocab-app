// src/components/Dictionary.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Star } from 'lucide-react';
import { api } from '../api';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const Dictionary = () => {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debouncedTerm = useDebounce(term, 500);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
        inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const search = async () => {
      if (debouncedTerm.trim() === '') {
        setResults([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await api.searchDictionary(debouncedTerm);
        setResults(response.data);
      } catch (e) {
        setError(e.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    
    search();
  }, [debouncedTerm]);

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 dark:text-white">Dictionary Search</h2>
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={24} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for a word in English or Japanese..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="w-full pl-14 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 animate-spin" size={24} />}
      </div>

      {error && <div className="text-red-500 dark:text-red-400 text-center">{error}</div>}

      <div className="space-y-4">
        {results.length > 0 ? (
          results.map((result, index) => <SearchResult key={result.slug + index} result={result} />)
        ) : (
          !loading && term && <p className="text-center text-gray-500 dark:text-gray-400">No results found for "{term}".</p>
        )}
      </div>
    </div>
  );
};

const SearchResult = ({ result }) => {
    return (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mb-3">
                {result.japanese.map((jp, i) => (
                    <div key={i} className="flex items-baseline">
                        <span className="text-3xl font-bold dark:text-white">{jp.word || jp.reading}</span>
                        {jp.word && <span className="ml-2 text-lg text-gray-600 dark:text-gray-300">({jp.reading})</span>}
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
                {result.is_common && <span className="flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full"><Star size={12}/> Common word</span>}
                {result.tags.map(tag => <span key={tag} className="text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">{formatTag(tag)}</span>)}
            </div>

            {result.senses.map((sense, i) => (
                <div key={i} className="border-t dark:border-gray-600 pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
                    <div className="flex">
                        <span className="text-gray-500 dark:text-gray-400 mr-3">{i + 1}.</span>
                        <div>
                            <p className="text-gray-800 dark:text-gray-200">{sense.english_definitions.join('; ')}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">{sense.parts_of_speech.join(', ')}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const formatTag = (tag) => {
    return tag.replace('wanikani', 'WaniKani ').replace('jlpt-n', 'JLPT N');
}

export default Dictionary;
