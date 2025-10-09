// server/index.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path, { dirname, join } from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dbOps } from './database.js';

const app = express();
const PORT = 3001;

// Setup for file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded audio files
const audioDir = join(__dirname, 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
}
app.use('/audio', express.static(audioDir));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, audioDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'word-' + req.params.id + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/mpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only .mp3 files are allowed!'), false);
    }
  }
});

// Vocabulary routes
app.post('/api/vocabulary', async (req, res) => {
  try {
    const { japanese, english, setIds } = req.body;
    const result = await dbOps.addVocab(japanese, english, setIds);
    res.json(result);
  } catch (error) {
    if (error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
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

app.put('/api/vocabulary/:id/sets', async (req, res) => {
  try {
    const { setIds } = req.body;
    await dbOps.updateWordSets(req.params.id, setIds);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NEW: Audio routes
app.post('/api/vocabulary/:id/audio', upload.single('audio'), async (req, res) => {
  try {
    const wordId = req.params.id;
    const filename = req.file.filename;

    const existingWord = await dbOps.getWordById(wordId);
    if (existingWord && existingWord.audio_filename) {
      const oldPath = join(audioDir, existingWord.audio_filename);
      fs.unlink(oldPath, (err) => {
        if (err) console.error("Error deleting old audio file:", err);
      });
    }
    
    await dbOps.updateWordAudio(wordId, filename);
    res.json({ success: true, filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/vocabulary/:id/audio', async (req, res) => {
  try {
    const wordId = req.params.id;
    const word = await dbOps.getWordById(wordId);

    if (word && word.audio_filename) {
      const filePath = join(audioDir, word.audio_filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting audio file:", err);
      });

      await dbOps.updateWordAudio(wordId, null);
    }
    res.json({ success: true });
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
    if (error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
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
    const { setId, setIds, gameMode, score, metadata } = req.body;
    if (setIds && Array.isArray(setIds)) {
      const promises = setIds.map(id => dbOps.saveHighScore(id, gameMode, score, metadata));
      await Promise.all(promises);
      res.json({ success: true, count: setIds.length });
    } else if (setId) {
      const result = await dbOps.saveHighScore(setId, gameMode, score, metadata);
      res.json(result);
    } else {
      res.status(400).json({ error: 'Either setId or setIds must be provided.' });
    }
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
    const { setId, setIds, gameMode, score, metadata } = req.body;
    if (setIds && Array.isArray(setIds)) {
      const promises = setIds.map(id => dbOps.saveGameSession(id, gameMode, score, metadata));
      await Promise.all(promises);
      res.json({ success: true, count: setIds.length });
    } else if (setId) {
      const result = await dbOps.saveGameSession(setId, gameMode, score, metadata);
      res.json(result);
    } else {
      res.status(400).json({ error: 'Either setId or setIds must be provided.' });
    }
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
    const reviewOnly = req.query.reviewOnly === 'true';

    // 1. Get settings
    const settings = await dbOps.getSettings();
    const newCardsPerDay = parseInt(settings.newCardsPerDay || '20', 10);
    const reviewsPerDay = parseInt(settings.reviewsPerDay || '100', 10);
    
    // 2. Count today's progress
    const newLearned = await dbOps.countNewCardsLearnedToday(setId);
    const reviewsDone = await dbOps.countReviewsDoneToday(setId);

    // 3. Calculate limits for this session
    const newCardLimit = reviewOnly ? 0 : Math.max(0, newCardsPerDay - newLearned);
    const reviewLimit = Math.max(0, reviewsPerDay - reviewsDone);

    // 4. Fetch the queue
    const words = await dbOps.getSrsQueue(setId, reviewLimit, newCardLimit);
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
    const settings = await dbOps.getSettings();
    res.json({ ...stats, settings });
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

// Settings Routes
app.get('/api/settings', async (req, res) => {
    try {
        const settings = await dbOps.getSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/settings', async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key || value === undefined) {
            return res.status(400).json({ error: 'Key and value are required' });
        }
        await dbOps.updateSetting(key, value);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Dictionary search proxy
app.get('/api/dictionary/:term', async (req, res) => {
  try {
    const term = encodeURIComponent(req.params.term);
    // Use jisho.org's unofficial API
    const response = await fetch(`https://jisho.org/api/v1/search/words?keyword=${term}`);
    if (!response.ok) {
      throw new Error(`Jisho API responded with status ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Dictionary proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch dictionary results.' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  dbOps.cleanupOrphanedWords().then(() => console.log('Word cleanup complete')).catch(err => console.error('Word cleanup error:', err));
  dbOps.cleanupOrphanedSentences().then(() => console.log('Sentence cleanup complete')).catch(err => console.error('Sentence cleanup error:', err));
});
