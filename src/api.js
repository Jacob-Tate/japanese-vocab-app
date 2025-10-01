// src/api.js
const API_URL = '/api';

export const api = {
  async addVocab(vocab) {
    const response = await fetch(`${API_URL}/vocabulary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vocab)
    });
    return response.json();
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

  async addSentence(sentence) {
    const response = await fetch(`${API_URL}/sentences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sentence)
    });
    return response.json();
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

  async saveHighScore(setId, gameMode, score, metadata = null) {
    const response = await fetch(`${API_URL}/highscores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setId, gameMode, score, metadata })
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
  }
};
