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

// Get sets containing a word
app.get('/api/vocabulary/:id/sets', async (req, res) => {
  try {
    const sets = await dbOps.getSetsContainingWord(req.params.id);
    res.json(sets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set routes
app.post('/api/sets', async (req, res) => {
  try {
    const { name, wordIds } = req.body;
    const result = await dbOps.addSet(name, wordIds);
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

// Update set
app.put('/api/sets/:id', async (req, res) => {
  try {
    const { name, wordIds } = req.body;
    await dbOps.updateSet(req.params.id, name, wordIds);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Clean up any orphaned word references on startup
  dbOps.cleanupOrphanedWords()
    .then(() => console.log('Database cleanup complete'))
    .catch(err => console.error('Database cleanup error:', err));
});
