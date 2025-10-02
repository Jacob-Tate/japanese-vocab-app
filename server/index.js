// server/index.js
import express from 'express';
import cors from 'cors';
import { dbOps } from './database.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Vocabulary routes
app.post('/api/vocabulary', async (req, res) => {
  try {
    const { japanese, english } = req.body;
    const result = await dbOps.addVocab(japanese, english);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vocabulary', async (req, res) => {
  try {
    const vocabulary = await dbOps.getAllVocab();
    res.json(vocabulary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/vocabulary/:id', async (req, res) => {
  try {
    await dbOps.deleteVocab(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vocabulary/:id/sets', async (req, res) => {
  try {
    const sets = await dbOps.getSetsContainingWord(req.params.id);
    res.json(sets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sentence routes
app.post('/api/sentences', async (req, res) => {
  try {
    const { japanese, english } = req.body;
    const result = await dbOps.addSentence(japanese, english);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sentences', async (req, res) => {
  try {
    const sentences = await dbOps.getAllSentences();
    res.json(sentences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/sentences/:id', async (req, res) => {
  try {
    await dbOps.deleteSentence(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set routes
app.post('/api/sets', async (req, res) => {
  try {
    const { name, wordIds, sentenceIds } = req.body;
    const result = await dbOps.addSet(name, wordIds, sentenceIds);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sets', async (req, res) => {
  try {
    const sets = await dbOps.getAllSets();
    res.json(sets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/sets/:id', async (req, res) => {
  try {
    await dbOps.deleteSet(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sets/:id', async (req, res) => {
  try {
    const { name, wordIds, sentenceIds } = req.body;
    await dbOps.updateSet(req.params.id, name, wordIds, sentenceIds);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// High score routes
app.post('/api/highscores', async (req, res) => {
  try {
    const { setId, gameMode, score, metadata } = req.body;
    const result = await dbOps.saveHighScore(setId, gameMode, score, metadata);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/highscores/:setId/:gameMode', async (req, res) => {
  try {
    const highScore = await dbOps.getHighScore(req.params.setId, req.params.gameMode);
    res.json(highScore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/highscores/:setId', async (req, res) => {
  try {
    const highScores = await dbOps.getAllHighScores(req.params.setId);
    res.json(highScores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Game history routes
app.post('/api/game-sessions', async (req, res) => {
  try {
    const { setId, gameMode, score, metadata } = req.body;
    const result = await dbOps.saveGameSession(setId, gameMode, score, metadata);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/game-sessions', async (req, res) => {
  try {
    const sessions = await dbOps.getAllGameSessions();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/game-statistics', async (req, res) => {
  try {
    const stats = await dbOps.getGameStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SRS Routes
app.get('/api/srs/due', async (req, res) => {
  try {
    const setId = req.query.setId && req.query.setId !== 'all' ? req.query.setId : null;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const words = await dbOps.getDueSrsWords(setId, limit);
    res.json(words);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/srs/review', async (req, res) => {
  try {
    const { wordId, quality } = req.body;
    if (!wordId || !quality) {
        return res.status(400).json({ error: 'wordId and quality are required' });
    }
    await dbOps.updateSrsReview(wordId, quality);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/srs/stats', async (req, res) => {
  try {
    const setId = req.query.setId && req.query.setId !== 'all' ? req.query.setId : null;
    const stats = await dbOps.getSrsStats(setId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SRS Reset Route
app.delete('/api/srs', async (req, res) => {
  try {
    const { wordId } = req.body; // wordId can be null/undefined for global reset
    await dbOps.resetSrsData(wordId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  dbOps.cleanupOrphanedWords().then(() => console.log('Word cleanup complete')).catch(err => console.error('Word cleanup error:', err));
  dbOps.cleanupOrphanedSentences().then(() => console.log('Sentence cleanup complete')).catch(err => console.error('Sentence cleanup error:', err));
});
