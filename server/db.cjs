const { Pool } = require('pg');

// 메모리 기반 임시 저장소 (로컬 개발용)
let inMemoryRankings = [];
let useMemory = !process.env.DATABASE_URL;

let pool;
if (!useMemory) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

async function initDB() {
  if (useMemory) {
    console.log('⚠️  Using in-memory storage (no PostgreSQL)');
    return;
  }
  
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS rankings (
        id SERIAL PRIMARY KEY,
        player_name VARCHAR(50) NOT NULL,
        score INTEGER NOT NULL,
        level INTEGER NOT NULL,
        lines INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_score ON rankings(score DESC);
    `);
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('❌ DB init error:', err);
  } finally {
    client.release();
  }
}

async function saveScore(playerName, score, level, lines) {
  if (useMemory) {
    const id = inMemoryRankings.length + 1;
    const entry = {
      id,
      player_name: playerName,
      score,
      level,
      lines,
      created_at: new Date()
    };
    inMemoryRankings.push(entry);
    return { id };
  }
  
  const result = await pool.query(
    'INSERT INTO rankings (player_name, score, level, lines) VALUES ($1, $2, $3, $4) RETURNING id',
    [playerName, score, level, lines]
  );
  return result.rows[0];
}

async function getTopScores(limit = 10) {
  if (useMemory) {
    return inMemoryRankings
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  const result = await pool.query(
    'SELECT player_name, score, level, lines, created_at FROM rankings ORDER BY score DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

module.exports = { initDB, saveScore, getTopScores };
