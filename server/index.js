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
    const { japanese, english, setIds } = req.body;
    const result = await dbOps.addSentence(japanese, english, setIds);
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

app.get('/api/sentences/:id/sets', async (req, res) => {
  try {
    const sets = await dbOps.getSetsContainingSentence(req.params.id);
    res.json(sets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sentences/:id/sets', async (req, res) => {
  try {
    const { setIds } = req.body;
    await dbOps.updateSentenceSets(req.params.id, setIds);
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

    const processSession = async (id) => {
      await dbOps.saveGameSession(id, gameMode, score, metadata);
      let activity_happened = false;

      // For games with individual per-item results, log each one
      if (metadata && metadata.results && Array.isArray(metadata.results)) {
        for (const result of metadata.results) {
          await dbOps.addReviewHistory(result.itemId, result.itemType, gameMode, result.result);
        }
        if (metadata.results.length > 0) {
            activity_happened = true;
        }
      }
      // For flashcard sessions, create a single summary entry in review_history
      else if (gameMode.includes('flashcard') && metadata && metadata.repetitions > 0) {
          const words = metadata.words || '';
          const summary = words.length > 100 ? words.substring(0, 97) + '...' : words;
          let resultText;
          if (metadata.completed) {
            resultText = `Completed flashcard session (${metadata.repetitions} cards): ${summary}`;
          } else {
            resultText = `Reviewed ${metadata.repetitions} of ${metadata.totalCards} cards: ${summary}`;
          }
          await dbOps.addReviewHistory(id, 'session', gameMode, resultText);
          
          // Only count completed flashcard sessions for the streak
          if (metadata.completed) {
            activity_happened = true;
          }
      }
      // For other games (like matching, speedmatch) that don't have individual results
      else if (gameMode) {
          const resultText = `Completed with a score of ${score}.`;
          await dbOps.addReviewHistory(id, 'session', gameMode, resultText);
          activity_happened = true;
      }

      if (activity_happened) {
          await dbOps.updateStreak();
      }
    };

    if (setIds && Array.isArray(setIds)) {
      for (const id of setIds) {
        await processSession(id);
      }
      res.json({ success: true, count: setIds.length });
    } else if (setId) {
      await processSession(setId);
      res.json({ success: true });
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

// Vocabulary SRS Routes
app.get('/api/srs/due', async (req, res) => {
  try {
    const setId = req.query.setId && req.query.setId !== 'all' ? req.query.setId : null;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const reviewOnly = req.query.reviewOnly === 'true';
    const words = await dbOps.getDueSrsWords(setId, limit, reviewOnly);
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
    await dbOps.addReviewHistory(wordId, 'word', 'srs', quality);
    await dbOps.updateStreak();
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

// Sentence SRS Routes
app.get('/api/srs/sentences/due', async (req, res) => {
  try {
    const setId = req.query.setId && req.query.setId !== 'all' ? req.query.setId : null;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const reviewOnly = req.query.reviewOnly === 'true';
    const sentences = await dbOps.getDueSrsSentences(setId, limit, reviewOnly);
    res.json(sentences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/srs/sentences/review', async (req, res) => {
  try {
    const { sentenceId, quality } = req.body;
    if (!sentenceId || !quality) {
        return res.status(400).json({ error: 'sentenceId and quality are required' });
    }
    await dbOps.updateSrsReviewSentence(sentenceId, quality);
    await dbOps.addReviewHistory(sentenceId, 'sentence', 'srs_sentences', quality);
    await dbOps.updateStreak();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/srs/sentences/stats', async (req, res) => {
  try {
    const setId = req.query.setId && req.query.setId !== 'all' ? req.query.setId : null;
    const stats = await dbOps.getSrsStatsSentences(setId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// App Settings Routes
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await dbOps.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    if (key === undefined || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required.' });
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

// NEW Endpoints for streak and history
app.get('/api/streak', async (req, res) => {
  try {
    const streak = await dbOps.getStreak();
    res.json(streak);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reviews', async (req, res) => {
  try {
    const { limit, startDate, endDate } = req.query;
    const options = {
      limit: limit ? parseInt(limit, 10) : 100,
      startDate,
      endDate,
    };
    const history = await dbOps.getReviewHistory(options);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  dbOps.cleanupOrphanedWords().then(() => console.log('Word cleanup complete')).catch(err => console.error('Word cleanup error:', err));
  dbOps.cleanupOrphanedSentences().then(() => console.log('Sentence cleanup complete')).catch(err => console.error('Sentence cleanup error:', err));
});
