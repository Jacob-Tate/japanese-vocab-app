// src/components/ClozeGeneratorModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, Clipboard, ClipboardCheck } from 'lucide-react';
import { chunkJapanese } from '../utils';
import kuromoji from 'kuromoji';

export default function ClozeGeneratorModal({ isOpen, sentence, onClose }) {
  const [tokenizer, setTokenizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [copyStatus, setCopyStatus] = useState({});

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setTokens([]);
      setSelectedIndex(null);
      setCopyStatus({});

      kuromoji.builder({ dicPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/" })
        .build((err, tokenizerInstance) => {
          if (err) {
            console.error("kuromoji build error:", err);
            setLoading(false);
            return;
          }
          setTokenizer(tokenizerInstance);
          const rawTokens = tokenizerInstance.tokenize(sentence.japanese);
          setTokens(chunkJapanese(rawTokens));
          setLoading(false);
        });
    }
  }, [isOpen, sentence]);

  const { clozeSentence, answer } = useMemo(() => {
    if (selectedIndex === null || tokens.length === 0) {
      return { clozeSentence: sentence?.japanese, answer: '' };
    }
    const answerText = tokens[selectedIndex];
    const sentenceParts = [...tokens];
    sentenceParts[selectedIndex] = '___';
    return { clozeSentence: sentenceParts.join(''), answer: answerText };
  }, [tokens, selectedIndex, sentence]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus({ [field]: true });
      setTimeout(() => setCopyStatus(prev => ({ ...prev, [field]: false })), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold dark:text-white">Cloze Deletion Generator</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={24} className="dark:text-gray-300" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-blue-500" size={48} /></div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="font-semibold mb-2 dark:text-gray-200">1. Select a word to hide</h3>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {tokens.map((token, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className={`px-3 py-2 rounded-md text-lg transition-colors ${selectedIndex === index ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 dark:text-white'}`}
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold mt-6 mb-2 dark:text-gray-200">2. Copy the results</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Generated Sentence</label>
                  <div className="mt-1 relative">
                    <pre className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-md text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{clozeSentence}</pre>
                    <button onClick={() => copyToClipboard(clozeSentence, 'cloze')} className="absolute top-2 right-2 p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                      {copyStatus.cloze ? <ClipboardCheck size={16} className="text-green-500" /> : <Clipboard size={16} className="text-gray-600 dark:text-gray-300" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Answer</label>
                  <div className="mt-1 relative">
                    <pre className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-md text-gray-800 dark:text-gray-200">{answer}</pre>
                     <button onClick={() => copyToClipboard(answer, 'answer')} disabled={!answer} className="absolute top-2 right-2 p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">
                      {copyStatus.answer ? <ClipboardCheck size={16} className="text-green-500" /> : <Clipboard size={16} className="text-gray-600 dark:text-gray-300" />}
                    </button>
                  </div>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">English Translation</label>
                  <div className="mt-1 relative">
                    <pre className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-md text-gray-800 dark:text-gray-200">{sentence.english}</pre>
                     <button onClick={() => copyToClipboard(sentence.english, 'english')} className="absolute top-2 right-2 p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                      {copyStatus.english ? <ClipboardCheck size={16} className="text-green-500" /> : <Clipboard size={16} className="text-gray-600 dark:text-gray-300" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
