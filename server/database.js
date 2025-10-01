// server/database.js
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'vocabulary.db');
const db = new sqlite3.Database(dbPath);

// CRITICAL: Enable foreign key constraints in SQLite
db.run('PRAGMA foreign_keys = ON');

// Initialize database tables
db.serialize(() => {
  // Vocabulary table
  db.run(`
    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      japanese TEXT NOT NULL,
      english TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sentences table
  db.run(`
    CREATE TABLE IF NOT EXISTS sentences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      japanese TEXT NOT NULL,
      english TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sets table
  db.run(`
    CREATE TABLE IF NOT EXISTS sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Set words junction table
  db.run(`
    CREATE TABLE IF NOT EXISTS set_words (
      set_id INTEGER NOT NULL,
      word_id INTEGER NOT NULL,
      FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
      FOREIGN KEY (word_id) REFERENCES vocabulary(id) ON DELETE CASCADE,
      PRIMARY KEY (set_id, word_id)
    )
  `);
  
  // Set sentences junction table
  db.run(`
    CREATE TABLE IF NOT EXISTS set_sentences (
      set_id INTEGER NOT NULL,
      sentence_id INTEGER NOT NULL,
      FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
      FOREIGN KEY (sentence_id) REFERENCES sentences(id) ON DELETE CASCADE,
      PRIMARY KEY (set_id, sentence_id)
    )
  `);

  // High scores table
  db.run(`
    CREATE TABLE IF NOT EXISTS high_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      set_id INTEGER NOT NULL,
      game_mode TEXT NOT NULL,
      score INTEGER NOT NULL,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE
    )
  `);
});

// Database operations
export const dbOps = {
  // Vocabulary operations
  addVocab(japanese, english) {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO vocabulary (japanese, english) VALUES (?, ?)', [japanese, english], function(err) { if (err) reject(err); else resolve({ id: this.lastID }); });
    });
  },
  getAllVocab() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM vocabulary ORDER BY id DESC', (err, rows) => { if (err) reject(err); else resolve(rows); });
    });
  },
  deleteVocab(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM vocabulary WHERE id = ?', [id], (err) => { if (err) reject(err); else resolve(); });
    });
  },
  getSetsContainingWord(wordId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT s.* FROM sets s INNER JOIN set_words sw ON s.id = sw.set_id WHERE sw.word_id = ?`, [wordId], (err, sets) => { if (err) reject(err); else resolve(sets); });
    });
  },
  
  // Sentence operations
  addSentence(japanese, english) {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO sentences (japanese, english) VALUES (?, ?)', [japanese, english], function(err) { if (err) reject(err); else resolve({ id: this.lastID }); });
    });
  },
  getAllSentences() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM sentences ORDER BY id DESC', (err, rows) => { if (err) reject(err); else resolve(rows); });
    });
  },
  deleteSentence(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM sentences WHERE id = ?', [id], (err) => { if (err) reject(err); else resolve(); });
    });
  },

  // Set operations
  addSet(name, wordIds, sentenceIds) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('INSERT INTO sets (name) VALUES (?)', [name], function(err) {
          if (err) return reject(err);
          const setId = this.lastID;
          
          const wordStmt = db.prepare('INSERT INTO set_words (set_id, word_id) VALUES (?, ?)');
          (wordIds || []).forEach(wordId => wordStmt.run(setId, wordId));
          wordStmt.finalize();

          const sentenceStmt = db.prepare('INSERT INTO set_sentences (set_id, sentence_id) VALUES (?, ?)');
          (sentenceIds || []).forEach(sentenceId => sentenceStmt.run(setId, sentenceId));
          sentenceStmt.finalize(err => {
            if (err) reject(err); else resolve({ id: setId });
          });
        });
      });
    });
  },

  getAllSets() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM sets ORDER BY id DESC', async (err, sets) => {
        if (err) return reject(err);
        if (sets.length === 0) return resolve([]);

        try {
          const setsWithContent = await Promise.all(sets.map(async set => {
            const words = await new Promise((res, rej) => db.all(`SELECT sw.word_id FROM set_words sw INNER JOIN vocabulary v ON sw.word_id = v.id WHERE sw.set_id = ?`, [set.id], (e, r) => e ? rej(e) : res(r)));
            const sentences = await new Promise((res, rej) => db.all(`SELECT ss.sentence_id FROM set_sentences ss INNER JOIN sentences s ON ss.sentence_id = s.id WHERE ss.set_id = ?`, [set.id], (e, r) => e ? rej(e) : res(r)));
            return {
              ...set,
              wordIds: words.map(w => w.word_id),
              sentenceIds: sentences.map(s => s.sentence_id)
            };
          }));
          resolve(setsWithContent);
        } catch (error) {
          reject(error);
        }
      });
    });
  },

  deleteSet(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM sets WHERE id = ?', [id], (err) => {
        if (err) reject(err); else resolve();
      });
    });
  },

  updateSet(id, name, wordIds, sentenceIds) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run('UPDATE sets SET name = ? WHERE id = ?', [name, id]);
        db.run('DELETE FROM set_words WHERE set_id = ?', [id]);
        db.run('DELETE FROM set_sentences WHERE set_id = ?', [id]);
        db.run('DELETE FROM high_scores WHERE set_id = ?', [id]);

        const wordStmt = db.prepare('INSERT INTO set_words (set_id, word_id) VALUES (?, ?)');
        (wordIds || []).forEach(wordId => wordStmt.run(id, wordId));
        wordStmt.finalize();
        
        const sentenceStmt = db.prepare('INSERT INTO set_sentences (set_id, sentence_id) VALUES (?, ?)');
        (sentenceIds || []).forEach(sentenceId => sentenceStmt.run(id, sentenceId));
        sentenceStmt.finalize();

        db.run('COMMIT', err => {
          if (err) reject(err); else resolve();
        });
      });
    });
  },

  // Cleanup orphaned references
  cleanupOrphanedWords() {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM set_words WHERE word_id NOT IN (SELECT id FROM vocabulary)`, (err) => { if (err) reject(err); else resolve(); });
    });
  },
  cleanupOrphanedSentences() {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM set_sentences WHERE sentence_id NOT IN (SELECT id FROM sentences)`, (err) => { if (err) reject(err); else resolve(); });
    });
  },

  // High score operations
  saveHighScore(setId, gameMode, score, metadata = null) {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO high_scores (set_id, game_mode, score, metadata) VALUES (?, ?, ?, ?)', [setId, gameMode, score, metadata ? JSON.stringify(metadata) : null], function(err) { if (err) reject(err); else resolve({ id: this.lastID }); });
    });
  },
  getHighScore(setId, gameMode) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM high_scores WHERE set_id = ? AND game_mode = ? ORDER BY score DESC LIMIT 1', [setId, gameMode], (err, row) => { if (err) reject(err); else resolve(row || null); });
    });
  },
  getAllHighScores(setId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT game_mode, MAX(score) as score FROM high_scores WHERE set_id = ? GROUP BY game_mode`, [setId], (err, rows) => { if (err) reject(err); else resolve(rows); });
    });
  }
};

export default db;
