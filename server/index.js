require('dotenv').config();
const express = require('express');
const path = require('path');
const moment = require('moment');
const expressLayouts = require('express-ejs-layouts');
const systemInfo = require('./utils/systemInfo');
const streamingRoutes = require('./routes/streamingRoutes');
const downloadRoutes = require('./routes/downloadRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/videos', express.static(path.join(__dirname, '../videos')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Routes
app.get('/', async (req, res) => {
  try {
    const stats = await systemInfo.getStats();
    res.render('index', { 
      stats,
      moment,
      title: 'Live Streaming Manager'
    });
  } catch (error) {
    console.error('Error rendering index:', error);
    res.status(500).render('error', { error: error.message });
  }
});

// API Routes
app.get('/api/system-stats', async (req, res) => {
  try {
    const stats = await systemInfo.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting system stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mount route handlers
app.use('/streaming', streamingRoutes);
app.use('/download', downloadRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).render('error', { 
    error: err.message || 'Terjadi kesalahan pada server',
    title: 'Error'
  });
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server berjalan pada port ${PORT}`);
  console.log(`Buka http://localhost:${PORT} di browser Anda`);
});