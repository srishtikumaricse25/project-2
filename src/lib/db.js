const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(process.cwd(), 'donate-ease.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    console.log(`[DATABASE] SQLite database initialized at ${dbPath}`);
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  const schemaPath = path.resolve(process.cwd(), 'src', 'lib', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
  }
  try {
    db.exec('ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;');
  } catch (e) { /* Column may already exist */ }
  try {
    db.exec('ALTER TABLE users ADD COLUMN locked_until TEXT;');
  } catch (e) { /* Column may already exist */ }
  try {
    db.exec('ALTER TABLE donations ADD COLUMN landmark TEXT;');
  } catch (e) { /* Column may already exist */ }
  try {
    db.exec('ALTER TABLE donations ADD COLUMN num_packages INTEGER DEFAULT 1;');
  } catch (e) { /* Column may already exist */ }

  // Auto-seed if users table is empty
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (!userCount || userCount.count === 0) {
      const { seed } = require('./seed');
      seed();
    }
  } catch (e) {
    // Ignore if seed already ran
  }
}

module.exports = { getDb };
