// src/components/KanaCharacterSelectorModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { hiragana, katakana, kanaGroups } from '../kana';

export default function KanaCharacterSelectorModal({ isOpen, onClose, onSave, initialSettings, initialCustomSet }) {
  const [selectedKana, setSelectedKana] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); // 'select' or 'deselect'
  const lastTouchedKanaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const newSelectionSet = new Set();
      if (initialCustomSet) {
        // If an existing custom set is passed in, use it to populate the modal.
        initialCustomSet.forEach(char => newSelectionSet.add(char.kana));
      } else {
        // Otherwise, build the selection from the standard group settings.
        const characterList = [];
        if (initialSettings.hiragana) {
          initialSettings.groups.forEach(group => characterList.push(...hiragana[group]));
        }
        if (initialSettings.katakana) {
          initialSettings.groups.forEach(group => characterList.push(...katakana[group]));
        }
        characterList.forEach(char => newSelectionSet.add(char.kana));
      }
      setSelectedKana(newSelectionSet);
    }
  }, [isOpen, initialSettings, initialCustomSet]);

  // Handlers for ending the drag action
  const handleEndDrag = () => {
    setIsDragging(false);
    setDragMode(null);
    lastTouchedKanaRef.current = null;
  };

  // Add global listeners to end drag even if mouse is released outside the window
  useEffect(() => {
    window.addEventListener('mouseup', handleEndDrag);
    window.addEventListener('touchend', handleEndDrag);
    return () => {
      window.removeEventListener('mouseup', handleEndDrag);
      window.removeEventListener('touchend', handleEndDrag);
    };
  }, []);

  const applyDragAction = (charKana) => {
    if (!charKana || charKana === lastTouchedKanaRef.current) return;
    lastTouchedKanaRef.current = charKana;

    setSelectedKana(prevSelected => {
      const newSelection = new Set(prevSelected);
      if (dragMode === 'select' && !newSelection.has(charKana)) {
        newSelection.add(charKana);
      } else if (dragMode === 'deselect' && newSelection.has(charKana)) {
        newSelection.delete(charKana);
      } else {
        return prevSelected; // No change needed, avoids re-render
      }
      return newSelection;
    });
  };
  
  // Handler for starting a drag (mousedown or touchstart)
  const handleStartDrag = (charKana) => {
    setIsDragging(true);
    const mode = selectedKana.has(charKana) ? 'deselect' : 'select';
    setDragMode(mode);
    // Apply the action to the first character immediately
    setSelectedKana(prevSelected => {
        const newSelection = new Set(prevSelected);
        if (mode === 'select') newSelection.add(charKana);
        else newSelection.delete(charKana);
        return newSelection;
    });
  };

  // Handler for when the mouse moves over a character
  const handleMouseEnter = (charKana) => {
    if (isDragging) {
      applyDragAction(charKana);
    }
  };
  
  // Handler for touch screen dragging
  const handleTouchMove = (e) => {
      if (!isDragging) return;
      // Prevent screen scrolling while dragging
      e.preventDefault();
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element && element.dataset.kana) {
        applyDragAction(element.dataset.kana);
      }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    const allChars = [];
    if (initialSettings.hiragana) kanaGroups.forEach(g => allChars.push(...hiragana[g.id]));
    if (initialSettings.katakana) kanaGroups.forEach(g => allChars.push(...katakana[g.id]));
    
    const finalSelection = allChars.filter(char => selectedKana.has(char.kana));
    onSave(finalSelection);
  };

  const renderGroup = (group, kanaSystem) => {
    return (
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
        {kanaSystem[group.id].map(char => (
          <div
            key={char.kana}
            data-kana={char.kana}
            onMouseDown={() => handleStartDrag(char.kana)}
            onMouseEnter={() => handleMouseEnter(char.kana)}
            onTouchStart={() => handleStartDrag(char.kana)}
            className={`p-2 text-center rounded-md cursor-pointer text-lg select-none ${selectedKana.has(char.kana) ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            {char.kana}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onTouchMove={handleTouchMove}>
        <div className="p-4 border-b dark:border-gray-600 flex-shrink-0">
          <h2 className="text-xl font-bold dark:text-white">Customize Character Set</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Click or drag to select the specific characters you want to practice.</p>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {initialSettings.hiragana && (
            <fieldset className="border dark:border-gray-600 rounded-lg p-3">
              <legend className="px-2 font-semibold dark:text-gray-200">Hiragana</legend>
              {kanaGroups.map(group => (
                <div key={`h-${group.id}`} className="mb-3">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{group.name}</h4>
                  {renderGroup(group, hiragana)}
                </div>
              ))}
            </fieldset>
          )}
          {initialSettings.katakana && (
            <fieldset className="border dark:border-gray-600 rounded-lg p-3">
              <legend className="px-2 font-semibold dark:text-gray-200">Katakana</legend>
              {kanaGroups.map(group => (
                <div key={`k-${group.id}`} className="mb-3">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{group.name}</h4>
                  {renderGroup(group, katakana)}
                </div>
              ))}
            </fieldset>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-600 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Save & Use Custom Set
          </button>
        </div>
      </div>
    </div>
  );
}
