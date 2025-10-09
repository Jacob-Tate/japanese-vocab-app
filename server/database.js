// server/database.js
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'vocabulary.db');
const db = new sqlite3.Database(dbPath);

// CRITICAL: Enable foreign key constraints in SQLite for all subsequent operations
db.run('PRAGMA foreign_keys = ON');

// Schema migration logic
db.get('PRAGMA user_version', (err, row) => {
  if (err) {
    console.error('Failed to get user_version', err);
    return;
  }

  let currentVersion = row ? row.user_version : 0;
  console.log(`Database version: ${currentVersion}`);

  if (currentVersion < 1) {
    console.log('Running database migration to version 1 (add UNIQUE constraints)...');
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run('PRAGMA foreign_keys = OFF');
      db.run(`
        CREATE TABLE vocabulary_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          japanese TEXT NOT NULL UNIQUE,
          english TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      db.run(`
        CREATE TABLE sentences_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          japanese TEXT NOT NULL UNIQUE,
          english TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      db.run(`
        INSERT INTO vocabulary_new (id, japanese, english, created_at)
        SELECT MIN(id), japanese, english, MIN(created_at) FROM vocabulary GROUP BY japanese
      `);
      db.run(`
        INSERT INTO sentences_new (id, japanese, english, created_at)
        SELECT MIN(id), japanese, english, MIN(created_at) FROM sentences GROUP BY japanese
      `);
      db.run('DROP TABLE vocabulary');
      db.run('DROP TABLE sentences');
      db.run('ALTER TABLE vocabulary_new RENAME TO vocabulary');
      db.run('ALTER TABLE sentences_new RENAME TO sentences');
      db.run('PRAGMA user_version = 1');
      db.run('COMMIT', (err) => {
        if (err) {
          console.error('Migration commit failed:', err);
          db.run('ROLLBACK');
        } else {
          console.log('Database migration to version 1 complete.');
          currentVersion = 1; // Update for next migration check
        }
      });
    });
  }

  if (currentVersion < 2) {
    console.log('Running database migration to version 2 (add audio filename to vocabulary)...');
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run('ALTER TABLE vocabulary ADD COLUMN audio_filename TEXT', (err) => {
        if (err) console.error("Migration error (add audio_filename):", err.message);
      });
      db.run('PRAGMA user_version = 2');
      db.run('COMMIT', (err) => {
        if (err) {
          console.error('Migration commit failed:', err);
          db.run('ROLLBACK');
        } else {
          console.log('Database migration to version 2 complete.');
          currentVersion = 2; // Update for next migration check
        }
      });
    });
  }
});


// Initialize database tables
db.serialize(() => {
  // Vocabulary table
  db.run(`
    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      japanese TEXT NOT NULL UNIQUE,
      english TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      audio_filename TEXT
    )
  `);
  
  // Sentences table
  db.run(`
    CREATE TABLE IF NOT EXISTS sentences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      japanese TEXT NOT NULL UNIQUE,
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
  
  // High scores table (keeps only the best score per game mode per set)
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

  // NEW: Game history table (tracks every game session)
  db.run(`
    CREATE TABLE IF NOT EXISTS game_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      set_id INTEGER NOT NULL,
      game_mode TEXT NOT NULL,
      score INTEGER NOT NULL,
      metadata TEXT,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE
    )
  `);

  // NEW: SRS data table
  db.run(`
    CREATE TABLE IF NOT EXISTS srs_data (
      word_id INTEGER PRIMARY KEY,
      due_date DATETIME NOT NULL,
      interval_days INTEGER DEFAULT 1,
      ease_factor REAL DEFAULT 2.5,
      repetitions INTEGER DEFAULT 0,
      lapses INTEGER DEFAULT 0,
      last_reviewed DATETIME,
      FOREIGN KEY (word_id) REFERENCES vocabulary(id) ON DELETE CASCADE
    )
  `);
});

// Database operations
export const dbOps = {
  // Vocabulary operations
  addVocab(japanese, english, setIds) {
    return new Promise((resolve, reject) => {
      const trimmedJapanese = japanese.trim();
      const trimmedEnglish = english.trim();
      if (!trimmedJapanese || !trimmedEnglish) {
        return reject(new Error("Japanese and English fields cannot be empty."));
      }

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run('INSERT INTO vocabulary (japanese, english) VALUES (?, ?)', [trimmedJapanese, trimmedEnglish], function(err) {
          if (err) {
            db.run('ROLLBACK');
            if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE constraint failed: vocabulary.japanese')) {
              return reject(new Error(`The word "${trimmedJapanese}" already exists.`));
            }
            return reject(err);
          }
          const wordId = this.lastID;

          if (setIds && setIds.length > 0) {
            const stmt = db.prepare('INSERT INTO set_words (set_id, word_id) VALUES (?, ?)');
            setIds.forEach(setId => stmt.run(setId, wordId));
            stmt.finalize();
          }

          db.run('COMMIT', err => {
            if (err) reject(err);
            else resolve({ id: wordId });
          });
        });
      });
    });
  },
  getAllVocab() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          v.id,
          v.japanese,
          v.english,
          v.created_at,
          v.audio_filename,
          srs.due_date,
          srs.repetitions
        FROM vocabulary v
        LEFT JOIN srs_data srs ON v.id = srs.word_id
        ORDER BY v.id DESC
      `;
      db.all(query, (err, rows) => { 
        if (err) reject(err); 
        else resolve(rows); 
      });
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
  updateWordSets(wordId, setIds) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Delete existing associations for this word
        db.run('DELETE FROM set_words WHERE word_id = ?', [wordId]);
        
        // Insert new associations
        if (setIds && setIds.length > 0) {
          const stmt = db.prepare('INSERT INTO set_words (set_id, word_id) VALUES (?, ?)');
          setIds.forEach(setId => stmt.run(setId, wordId));
          stmt.finalize();
        }
        
        db.run('COMMIT', err => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  },
  updateWordAudio(wordId, filename) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE vocabulary SET audio_filename = ? WHERE id = ?', [filename, wordId], (err) => {
        if (err) reject(err); else resolve();
      });
    });
  },
  getWordById(wordId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM vocabulary WHERE id = ?', [wordId], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });
  },
    
  // Sentence operations
  addSentence(japanese, english, setIds) {
    return new Promise((resolve, reject) => {
      const trimmedJapanese = japanese.trim();
      const trimmedEnglish = english.trim();
      if (!trimmedJapanese || !trimmedEnglish) {
        return reject(new Error("Japanese and English fields cannot be empty."));
      }
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run('INSERT INTO sentences (japanese, english) VALUES (?, ?)', [trimmedJapanese, trimmedEnglish], function(err) { 
          if (err) {
            db.run('ROLLBACK');
            if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE constraint failed: sentences.japanese')) {
              return reject(new Error(`The sentence "${trimmedJapanese.substring(0, 20)}..." already exists.`));
            }
            return reject(err);
          }
          const sentenceId = this.lastID;

          if (setIds && setIds.length > 0) {
            const stmt = db.prepare('INSERT INTO set_sentences (set_id, sentence_id) VALUES (?, ?)');
            setIds.forEach(setId => stmt.run(setId, sentenceId));
            stmt.finalize();
          }

          db.run('COMMIT', err => {
            if (err) reject(err);
            else resolve({ id: sentenceId });
          });
        });
      });
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
  getSetsContainingSentence(sentenceId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT s.* FROM sets s INNER JOIN set_sentences ss ON s.id = ss.set_id WHERE ss.sentence_id = ?`, [sentenceId], (err, sets) => { if (err) reject(err); else resolve(sets); });
    });
  },
  updateSentenceSets(sentenceId, setIds) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Delete existing associations for this sentence
        db.run('DELETE FROM set_sentences WHERE sentence_id = ?', [sentenceId]);
        
        // Insert new associations
        if (setIds && setIds.length > 0) {
          const stmt = db.prepare('INSERT INTO set_sentences (set_id, sentence_id) VALUES (?, ?)');
          setIds.forEach(setId => stmt.run(setId, sentenceId));
          stmt.finalize();
        }
        
        db.run('COMMIT', err => {
          if (err) reject(err);
          else resolve();
        });
      });
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
  
  async getAllSets() {
    const sets = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM sets ORDER BY name ASC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    if (sets.length === 0) return [];

    // Use a for...of loop to ensure queries are executed sequentially,
    // which is safer with the default sqlite3 database object.
    for (const set of sets) {
      const words = await new Promise((resolve, reject) => {
        db.all('SELECT word_id FROM set_words WHERE set_id = ?', [set.id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      const sentences = await new Promise((resolve, reject) => {
        db.all('SELECT sentence_id FROM set_sentences WHERE set_id = ?', [set.id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      set.wordIds = words.map(w => w.word_id);
      set.sentenceIds = sentences.map(s => s.sentence_id);
    }

    return sets;
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
        db.run('DELETE FROM game_history WHERE set_id = ?', [id]);
        
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
  
  // High score operations (best performance per game mode)
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
  },

  // Game history operations (every game session)
  saveGameSession(setId, gameMode, score, metadata = null) {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO game_history (set_id, game_mode, score, metadata) VALUES (?, ?, ?, ?)', 
        [setId, gameMode, score, metadata ? JSON.stringify(metadata) : null], 
        function(err) { 
          if (err) reject(err); 
          else resolve({ id: this.lastID }); 
        }
      );
    });
  },
  getAllGameSessions() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM game_history ORDER BY played_at DESC', (err, rows) => { if (err) reject(err); else resolve(rows); });
    });
  },
  getGameSessionsBySet(setId) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM game_history WHERE set_id = ? ORDER BY played_at DESC', [setId], (err, rows) => { if (err) reject(err); else resolve(rows); });
    });
  },
  getGameStatistics() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          game_mode,
          COUNT(*) as total_plays,
          SUM(score) as total_score,
          AVG(score) as average_score,
          MAX(score) as best_score,
          MIN(score) as worst_score
        FROM game_history 
        GROUP BY game_mode
      `, (err, rows) => { if (err) reject(err); else resolve(rows); });
    });
  },

  // SRS operations
  getDueSrsWords(setId, limit = 20) {
    return new Promise((resolve, reject) => {
      const today = new Date().toISOString();
      let query;
      let params;
      if (setId) {
        query = `
          SELECT v.* FROM vocabulary v
          JOIN set_words sw ON v.id = sw.word_id
          LEFT JOIN srs_data srs ON v.id = srs.word_id
          WHERE sw.set_id = ? AND (srs.word_id IS NULL OR srs.due_date <= ?)
          ORDER BY srs.due_date ASC, RANDOM()
          LIMIT ?
        `;
        params = [setId, today, limit];
      } else {
        query = `
          SELECT v.* FROM vocabulary v
          LEFT JOIN srs_data srs ON v.id = srs.word_id
          WHERE srs.word_id IS NULL OR srs.due_date <= ?
          ORDER BY srs.due_date ASC, RANDOM()
          LIMIT ?
        `;
        params = [today, limit];
      }
      db.all(query, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
    });
  },
  
  updateSrsReview(wordId, quality) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM srs_data WHERE word_id = ?', [wordId], (err, row) => {
        if (err) return reject(err);
        let { ease_factor = 2.5, interval_days = 0, repetitions = 0, lapses = 0 } = row || {};
        if (quality === 'correct') {
          repetitions += 1;
          if (repetitions === 1) {
            interval_days = 1;
          } else if (repetitions === 2) {
            interval_days = 6;
          } else {
            interval_days = Math.ceil(interval_days * ease_factor);
          }
          ease_factor += 0.1;
        } else {
          lapses += 1;
          repetitions = 0;
          interval_days = 1;
          ease_factor = Math.max(1.3, ease_factor - 0.2);
        }
        interval_days = Math.min(interval_days, 365);
        ease_factor = Math.max(1.3, Math.min(ease_factor, 2.5));
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + interval_days);
        const lastReviewed = new Date().toISOString();
        if (row) {
          db.run(`UPDATE srs_data SET due_date = ?, interval_days = ?, ease_factor = ?, repetitions = ?, lapses = ?, last_reviewed = ? WHERE word_id = ?`, [dueDate.toISOString(), interval_days, ease_factor, repetitions, lapses, lastReviewed, wordId], (err) => { if (err) reject(err); else resolve(); });
        } else {
          db.run(`INSERT INTO srs_data (word_id, due_date, interval_days, ease_factor, repetitions, lapses, last_reviewed) VALUES (?, ?, ?, ?, ?, ?, ?)`, [wordId, dueDate.toISOString(), interval_days, ease_factor, repetitions, lapses, lastReviewed], (err) => { if (err) reject(err); else resolve(); });
        }
      });
    });
  },
  
  getSrsStats(setId) {
    return new Promise((resolve, reject) => {
      const today = new Date().toISOString();
      let whereClause = '';
      const params = [today];
      if (setId) {
        whereClause = 'AND v.id IN (SELECT word_id FROM set_words WHERE set_id = ?)';
        params.push(setId);
      }
      const query = `
        SELECT
          COUNT(CASE WHEN srs.word_id IS NULL THEN 1 END) as new_count,
          COUNT(CASE WHEN srs.due_date <= ? THEN 1 END) as due_count
        FROM vocabulary v
        LEFT JOIN srs_data srs ON v.id = srs.word_id
        WHERE 1=1 ${whereClause}
      `;
      db.get(query, params, (err, row) => {
        if (err) return reject(err);
        let totalQuery;
        let totalParams = [];
        if (setId) {
          totalQuery = `SELECT COUNT(*) as total FROM set_words WHERE set_id = ?`;
          totalParams = [setId];
        } else {
          totalQuery = `SELECT COUNT(*) as total FROM vocabulary`;
        }
        db.get(totalQuery, totalParams, (errTotal, rowTotal) => {
          if (errTotal) return reject(errTotal);
          resolve({ ...row, total_words: rowTotal.total });
        });
      });
    });
  },

  // NEW: Reset SRS data
  resetSrsData(wordId = null) {
    return new Promise((resolve, reject) => {
      if (wordId) {
        db.run('DELETE FROM srs_data WHERE word_id = ?', [wordId], (err) => {
          if (err) reject(err); else resolve();
        });
      } else {
        db.run('DELETE FROM srs_data', [], (err) => {
          if (err) reject(err); else resolve();
        });
      }
    });
  }
};

export default db;
