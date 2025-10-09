// src/api.js
const API_URL = '/api';

export const api = {
  async addVocab(vocab) {
    const response = await fetch(`${API_URL}/vocabulary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vocab)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to add vocabulary word.');
    }
    return data;
  },
    
  async getAllVocab() {
    const response = await fetch(`${API_URL}/vocabulary`);
    return response.json();
  },
    
  async deleteVocab(id) {
    const response = await fetch(`${API_URL}/vocabulary/${id}`, { method: 'DELETE' });
    return response.json();
  },
  
  async getSetsContainingWord(id) {
    const response = await fetch(`${API_URL}/vocabulary/${id}/sets`);
    return response.json();
  },
  
  async updateWordSets(wordId, setIds) {
    const response = await fetch(`${API_URL}/vocabulary/${wordId}/sets`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setIds })
    });
    return response.json();
  },

  async uploadAudio(wordId, audioFile) {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    const response = await fetch(`${API_URL}/vocabulary/${wordId}/audio`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload audio.');
    }
    return data;
  },
  
  async deleteAudio(wordId) {
    const response = await fetch(`${API_URL}/vocabulary/${wordId}/audio`, {
      method: 'DELETE',
    });
    return response.json();
  },

  async addSentence(sentence) {
    const response = await fetch(`${API_URL}/sentences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sentence)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to add sentence.');
    }
    return data;
  },
    
  async getAllSentences() {
    const response = await fetch(`${API_URL}/sentences`);
    return response.json();
  },
    
  async deleteSentence(id) {
    const response = await fetch(`${API_URL}/sentences/${id}`, { method: 'DELETE' });
    return response.json();
  },
    
  async addSet(set) {
    const response = await fetch(`${API_URL}/sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(set)
    });
    return response.json();
  },
    
  async getAllSets() {
    const response = await fetch(`${API_URL}/sets`);
    return response.json();
  },
    
  async deleteSet(id) {
    const response = await fetch(`${API_URL}/sets/${id}`, { method: 'DELETE' });
    return response.json();
  },
  
  async updateSet(id, set) {
    const response = await fetch(`${API_URL}/sets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(set)
    });
    return response.json();
  },
  
  async saveHighScore(data) {
    const response = await fetch(`${API_URL}/highscores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  async getHighScore(setId, gameMode) {
    const response = await fetch(`${API_URL}/highscores/${setId}/${gameMode}`);
    return response.json();
  },
  
  async getAllHighScores(setId) {
    const response = await fetch(`${API_URL}/highscores/${setId}`);
    return response.json();
  },

  // Game session tracking
  async saveGameSession(data) {
    const response = await fetch(`${API_URL}/game-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async getAllGameSessions() {
    const response = await fetch(`${API_URL}/game-sessions`);
    return response.json();
  },

  async getGameStatistics() {
    const response = await fetch(`${API_URL}/game-statistics`);
    return response.json();
  },

  // SRS API
  async getDueSrsWords(setId, options = {}) {
    const { reviewOnly = false } = options;
    const response = await fetch(`${API_URL}/srs/due?setId=${setId || 'all'}&reviewOnly=${reviewOnly}`);
    return response.json();
  },

  async postSrsReview(wordId, quality) {
    const response = await fetch(`${API_URL}/srs/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordId, quality })
    });
    return response.json();
  },

  async getSrsStats(setId) {
    const response = await fetch(`${API_URL}/srs/stats?setId=${setId || 'all'}`);
    return response.json();
  },
  
  async resetSrsData(wordId = null) {
    const response = await fetch(`${API_URL}/srs`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordId }) // wordId will be null for global reset
    });
    return response.json();
  },

  // Settings API
  async getSettings() {
    const response = await fetch(`${API_URL}/settings`);
    return response.json();
  },

  async updateSetting(key, value) {
    const response = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    return response.json();
  },
  
  // Dictionary API
  async searchDictionary(term) {
    if (!term) return { data: [] };
    const response = await fetch(`${API_URL}/dictionary/${term}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search dictionary.');
    }
    return response.json();
  }
};
