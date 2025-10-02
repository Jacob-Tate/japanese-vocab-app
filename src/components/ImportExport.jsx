// src/components/ImportExport.jsx
import React, { useState } from 'react';
import { Download, Upload, FileText, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function ImportExport({ onRefresh }) {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const exportVocabulary = async () => {
    try {
      const vocab = await api.getAllVocab();
      const sentences = await api.getAllSentences();
      const sets = await api.getAllSets();

      // Create CSV for vocabulary
      const vocabCsv = [
        'Type,Japanese,English',
        ...vocab.map(v => `word,"${v.japanese}","${v.english}"`),
        ...sentences.map(s => `sentence,"${s.japanese}","${s.english}"`)
      ].join('\n');

      // Download vocabulary CSV
      const vocabBlob = new Blob([vocabCsv], { type: 'text/csv' });
      const vocabUrl = URL.createObjectURL(vocabBlob);
      const vocabLink = document.createElement('a');
      vocabLink.href = vocabUrl;
      vocabLink.download = `japanese-vocab-${new Date().toISOString().split('T')[0]}.csv`;
      vocabLink.click();

      // Create JSON for sets (since they reference IDs)
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
      event.target.value = ''; // Reset input
    }
  };

  const importFromCSV = async (csvText) => {
    const lines = csvText.split('\n').slice(1); // Skip header
    let wordCount = 0;
    let sentenceCount = 0;
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (handles quoted fields)
      const match = line.match(/^(word|sentence),"([^"]*)","([^"]*)"$/);
      if (!match) {
        errors.push(`Line ${i + 2}: Invalid format`);
        continue;
      }

      const [, type, japanese, english] = match;

      try {
        if (type === 'word') {
          await api.addVocab({ japanese, english });
          wordCount++;
        } else if (type === 'sentence') {
          await api.addSentence({ japanese, english });
          sentenceCount++;
        }
      } catch (error) {
        errors.push(`Line ${i + 2}: ${error.message}`);
      }
    }

    setImportResult({
      success: true,
      message: `Imported ${wordCount} words and ${sentenceCount} sentences`,
      errors: errors.length > 0 ? errors : null
    });
  };

  const importFromJSON = async (jsonText) => {
    const data = JSON.parse(jsonText);
    
    // Import vocabulary first
    const vocabIdMap = new Map();
    for (const vocab of data.vocab || []) {
      const result = await api.addVocab({
        japanese: vocab.japanese,
        english: vocab.english
      });
      vocabIdMap.set(vocab.id, result.id);
    }

    // Import sentences
    const sentenceIdMap = new Map();
    for (const sentence of data.sentences || []) {
      const result = await api.addSentence({
        japanese: sentence.japanese,
        english: sentence.english
      });
      sentenceIdMap.set(sentence.id, result.id);
    }

    // Import sets with mapped IDs
    for (const set of data.sets || []) {
      const wordIds = (set.wordIds || []).map(id => vocabIdMap.get(id)).filter(Boolean);
      const sentenceIds = (set.sentenceIds || []).map(id => sentenceIdMap.get(id)).filter(Boolean);
      
      await api.addSet({
        name: set.name,
        wordIds,
        sentenceIds
      });
    }

    setImportResult({
      success: true,
      message: `Imported ${data.vocab?.length || 0} words, ${data.sentences?.length || 0} sentences, and ${data.sets?.length || 0} sets`
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
      <h3 className="text-base sm:text-lg font-semibold mb-4">Import / Export Data</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={exportVocabulary}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Download size={20} />
          Export All Data
        </button>

        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer">
          <Upload size={20} />
          {importing ? 'Importing...' : 'Import Data'}
          <input
            type="file"
            accept=".csv,.json"
            onChange={handleFileUpload}
            disabled={importing}
            className="hidden"
          />
        </label>
      </div>

      {importResult && (
        <div className={`mt-4 p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start gap-2">
            {importResult.success ? (
              <FileText className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            )}
            <div>
              <p className={`font-semibold ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {importResult.message}
              </p>
              {importResult.errors && (
                <div className="mt-2 text-sm text-red-700">
                  <p className="font-semibold">Errors:</p>
                  <ul className="list-disc list-inside">
                    {importResult.errors.slice(0, 5).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li>...and {importResult.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600 space-y-2">
        <p><strong>CSV Format:</strong> Type,Japanese,English (for bulk vocabulary)</p>
        <p><strong>JSON Format:</strong> Complete backup including sets</p>
      </div>
    </div>
  );
}
