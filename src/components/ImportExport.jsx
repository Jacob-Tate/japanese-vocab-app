// src/components/ImportExport.jsx
import React, { useState } from 'react';
import { Download, Upload, FileText, AlertCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import { api } from '../api';

export default function ImportExport({ onRefresh }) {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const exportVocabulary = async () => {
    try {
      const vocab = await api.getAllVocab();
      const sentences = await api.getAllSentences();
      const sets = await api.getAllSets();

      const vocabCsv = [
'Type,Japanese,English',
        ...vocab.map(v => `word,"${v.japanese}","${v.english}"`),
        ...sentences.map(s => `sentence,"${s.japanese}","${s.english}"`)
      ].join('\n');
      const vocabBlob = new Blob([vocabCsv], { type: 'text/csv' });
      const vocabUrl = URL.createObjectURL(vocabBlob);
      const vocabLink = document.createElement('a');
      vocabLink.href = vocabUrl;
      vocabLink.download = `japanese-vocab-${new Date().toISOString().split('T')[0]}.csv`;
      vocabLink.click();

      const setsJson = JSON.stringify({ sets, vocab, sentences }, null, 2);
      const setsBlob = new Blob([setsJson], { type: 'application/json' });
      const setsUrl = URL.createObjectURL(setsBlob);
      const setsLink = document.createElement('a');
      setsLink.href = setsUrl;
      setsLink.download = `japanese-sets-${new Date().toISOString().split('T')[0]}.json`;
      setsLink.click();
    
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
            
      if (file.name.endsWith('.csv')) {
        await importFromCSV(text);
      } else if (file.name.endsWith('.json')) {
        await importFromJSON(text);
      } else {
        throw new Error('Unsupported file format. Use CSV or JSON.');
      }

      onRefresh();
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({ success: false, message: error.message });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const importFromCSV = async (csvText) => {
    const lines = csvText.split('\n').slice(1);
    let wordCount = 0;
    let sentenceCount = 0;
    const errors = [];
    let processedLines = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      processedLines++;
      const match = line.match(/^(word|sentence),"([^"]*)","([^"]*)"$/);
      if (!match) {
        errors.push(`Line ${i + 2}: Invalid format`);
        continue;
      }
      const [, type, japanese, english] = match;
      try {
        if (type === 'word') {
          await api.addVocab({ japanese: japanese.trim(), english: english.trim() });
          wordCount++;
        } else if (type === 'sentence') {
          await api.addSentence({ japanese: japanese.trim(), english: english.trim() });
          sentenceCount++;
        }
      } catch (error) {
        errors.push(`Line ${i + 2} (${japanese.trim()}): ${error.message}`);
      }
    }
    const skippedCount = processedLines - (wordCount + sentenceCount);
    let message = `Imported ${wordCount} words and ${sentenceCount} sentences from CSV.`;
    if(skippedCount > 0){
        message += ` ${skippedCount} items were skipped (duplicates or errors).`;
    }
    setImportResult({ success: true, message: message, errors: errors.length > 0 ? errors : null });
  };

  const importFromJSON = async (jsonText) => {
    const data = JSON.parse(jsonText);
    const vocabIdMap = new Map();
    const sentenceIdMap = new Map();
    const errors = [];
    let importedWords = 0;
    let skippedWords = 0;
    let importedSentences = 0;
    let skippedSentences = 0;
    let importedSets = 0;

    for (const vocab of data.vocab || []) {
      try {
        const result = await api.addVocab({ japanese: vocab.japanese.trim(), english: vocab.english.trim() });
        vocabIdMap.set(vocab.id, result.id);
        importedWords++;
      } catch (error) {
        skippedWords++;
        errors.push(`Word "${vocab.japanese.trim()}": ${error.message}`);
      }
    }

    for (const sentence of data.sentences || []) {
      try {
        const result = await api.addSentence({ japanese: sentence.japanese.trim(), english: sentence.english.trim() });
        sentenceIdMap.set(sentence.id, result.id);
        importedSentences++;
      } catch(error) {
        skippedSentences++;
        errors.push(`Sentence "${sentence.japanese.trim().substring(0,20)}...": ${error.message}`);
      }
    }

    for (const set of data.sets || []) {
      const wordIds = (set.wordIds || []).map(id => vocabIdMap.get(id)).filter(Boolean);
      const sentenceIds = (set.sentenceIds || []).map(id => sentenceIdMap.get(id)).filter(Boolean);
      await api.addSet({ name: set.name, wordIds, sentenceIds });
      importedSets++;
    }
    
    let message = `Imported ${importedWords} words, ${importedSentences} sentences, and ${importedSets} sets.`;
    const skippedMessages = [];
    if (skippedWords > 0) skippedMessages.push(`${skippedWords} duplicate words`);
    if (skippedSentences > 0) skippedMessages.push(`${skippedSentences} duplicate sentences`);
    if (skippedMessages.length > 0) {
      message += ` Skipped ${skippedMessages.join(' and ')}.`;
    }
    
    setImportResult({ success: true, message, errors: errors.length > 0 ? errors : null });
  };
    
  const handleResetAllSrs = async () => {
    if (window.confirm("Are you sure you want to reset ALL Spaced Repetition progress? This will erase all review history and due dates for every word. This action cannot be undone.")) {
      setResetting(true);
      try {
        await api.resetSrsData();
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 3000);
        onRefresh();
      } catch (error) {
        console.error("Failed to reset SRS data", error);
        alert("Could not reset SRS progress. Please try again.");
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
      <h3 className="text-base sm:text-lg font-semibold mb-4 dark:text-white">Import / Export Data</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={exportVocabulary} className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"><Download size={20} />Export All Data</button>
        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer"><Upload size={20} />{importing ? 'Importing...' : 'Import Data'}<input type="file" accept=".csv,.json" onChange={handleFileUpload} disabled={importing} className="hidden"/></label>
      </div>

      {importResult && (
        <div className={`mt-4 p-4 rounded-lg ${importResult.success ? 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700'}`}>
          <div className="flex items-start gap-2">
            {importResult.success ? <FileText className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} /> : <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />}
            <div>
              <p className={`font-semibold ${importResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>{importResult.message}</p>
              {importResult.errors && (<div className="mt-2 text-sm text-red-700 dark:text-red-300"><p className="font-semibold">Errors:</p><ul className="list-disc list-inside">{importResult.errors.slice(0, 5).map((error, i) => (<li key={i}>{error}</li>))}{importResult.errors.length > 5 && (<li>...and {importResult.errors.length - 5} more</li>)}</ul></div>)}
            </div>
          </div>
        </div>
      )}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 space-y-2"><p><strong>CSV Format:</strong> Type,Japanese,English (for bulk vocabulary)</p><p><strong>JSON Format:</strong> Complete backup including sets</p></div>
            
      <div className="mt-6 pt-6 border-t dark:border-gray-600">
        <h3 className="text-base sm:text-lg font-semibold mb-4 text-red-700 dark:text-red-400 flex items-center gap-2"><AlertTriangle size={20}/> Danger Zone</h3>
        <button onClick={handleResetAllSrs} disabled={resetting} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-red-300 dark:disabled:bg-red-800">
          <RotateCcw size={20} />
          {resetting ? 'Resetting...' : 'Reset All SRS Progress'}
        </button>
        {resetSuccess && <p className="mt-2 text-sm text-green-600 dark:text-green-400">All SRS progress has been successfully reset.</p>}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">This will make all vocabulary words "New" in the SRS system, resetting any learning progress.</p>
      </div>
    </div>
  );
}
