const express = require('express');
const path = require('path');
const { initDB, saveScore, getTopScores } = require('./db.cjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get rankings
app.get('/api/rankings', async (req, res) => {
  try {
    const rankings = await getTopScores(10);
    res.json(rankings);
  } catch (err) {
    console.error('❌ Error fetching rankings:', err);
    res.status(500).json({ error: 'Failed to fetch rankings' });
  }
});

// Save score
app.post('/api/rankings', async (req, res) => {
  try {
    const { player_name, score, level, lines } = req.body;
    
    if (!player_name || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await saveScore(player_name, score, level, lines);
    res.json({ success: true, id: result.id });
  } catch (err) {
    console.error('❌ Error saving score:', err);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

// SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🚀 Tetris server running on http://localhost:${PORT}`);
  });
}

start();
