require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const lotteryRoutes = require('./routes/lottery');

// Khởi động scheduler tự động cập nhật lúc 18:35
require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/dist')));

// API Routes
app.use('/api/lottery', lotteryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const crawlService = require('./services/crawlService');
  const data = crawlService.readData();
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    vietnamTime: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
    version: '1.0.0',
    database: {
      totalDays: data.results.length,
      latestDate: data.results[0]?.date || null
    },
    scheduler: {
      nextUpdate: '18:35 Vietnam Time (daily)'
    }
  });
});

// Serve React app for all other routes (Express 5 syntax)
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(50));
  console.log(`🎰 Lottery Prediction Server`);
  console.log('='.repeat(50));
  console.log(`🌐 Web: http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/lottery`);
  console.log(`⏰ Auto-update: 18:35 daily (Vietnam time)`);
  console.log('='.repeat(50));
  console.log('');
});

module.exports = app;
