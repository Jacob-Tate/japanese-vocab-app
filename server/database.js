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
});

// Database operations
export const dbOps = {
  // Vocabulary operations
  addVocab(japanese, english) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO vocabulary (japanese, english) VALUES (?, ?)',
        [japanese, english],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  getAllVocab() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM vocabulary ORDER BY id DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  deleteVocab(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM vocabulary WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  getSetsContainingWord(wordId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT s.* FROM sets s
         INNER JOIN set_words sw ON s.id = sw.set_id
         WHERE sw.word_id = ?`,
        [wordId],
        (err, sets) => {
          if (err) reject(err);
          else resolve(sets);
        }
      );
    });
  },

  // Set operations
  addSet(name, wordIds) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('INSERT INTO sets (name) VALUES (?)', [name], function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          const setId = this.lastID;
          
          if (wordIds.length === 0) {
            resolve({ id: setId });
            return;
          }

          const stmt = db.prepare('INSERT INTO set_words (set_id, word_id) VALUES (?, ?)');
          
          wordIds.forEach((wordId) => {
            stmt.run(setId, wordId);
          });
          
          stmt.finalize((err) => {
            if (err) reject(err);
            else resolve({ id: setId });
          });
        });
      });
    });
  },

  getAllSets() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM sets ORDER BY id DESC', (err, sets) => {
        if (err) {
          reject(err);
          return;
        }

        if (sets.length === 0) {
          resolve([]);
          return;
        }

        // Get word IDs for each set
        const setsWithWords = [];
        let processed = 0;

        sets.forEach((set) => {
          // Join with vocabulary table to only get valid word IDs
          db.all(
            `SELECT sw.word_id 
             FROM set_words sw
             INNER JOIN vocabulary v ON sw.word_id = v.id
             WHERE sw.set_id = ?`,
            [set.id],
            (err, words) => {
              if (err) {
                reject(err);
                return;
              }

              setsWithWords.push({
                ...set,
                wordIds: words.map(w => w.word_id)
              });

              processed++;
              if (processed === sets.length) {
                resolve(setsWithWords);
              }
            }
          );
        });
      });
    });
  },

  deleteSet(id) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('DELETE FROM set_words WHERE set_id = ?', [id], (err) => {
          if (err) {
            reject(err);
            return;
          }

          db.run('DELETE FROM sets WHERE id = ?', [id], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
    });
  },

  updateSet(id, name, wordIds) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Update the set name
        db.run('UPDATE sets SET name = ? WHERE id = ?', [name, id], (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Delete existing word associations
          db.run('DELETE FROM set_words WHERE set_id = ?', [id], (err) => {
            if (err) {
              reject(err);
              return;
            }

            if (wordIds.length === 0) {
              resolve();
              return;
            }

            // Insert new word associations
            const stmt = db.prepare('INSERT INTO set_words (set_id, word_id) VALUES (?, ?)');
            
            wordIds.forEach((wordId) => {
              stmt.run(id, wordId);
            });
            
            stmt.finalize((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        });
      });
    });
  },

  // Clean up orphaned word references in set_words table
  cleanupOrphanedWords() {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM set_words 
         WHERE word_id NOT IN (SELECT id FROM vocabulary)`,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
};

export default db;
