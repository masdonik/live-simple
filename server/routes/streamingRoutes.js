const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const ffmpegService = require('../services/ffmpegService');

// GET /streaming - Mendapatkan daftar video yang tersedia
router.get('/', (req, res) => {
  try {
    const videosDir = path.join(__dirname, '../../videos');
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }
    
    const videos = fs.readdirSync(videosDir);
    res.json({ videos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /streaming/active - Mendapatkan daftar streaming yang aktif
router.get('/active', (req, res) => {
  try {
    const activeStreams = ffmpegService.getActiveStreams();
    res.json(activeStreams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /streaming/start - Memulai streaming baru
router.post('/start', async (req, res) => {
  try {
    const { videoPath, platform, streamKey, duration } = req.body;

    if (!videoPath || !platform || !streamKey) {
      return res.status(400).json({
        error: 'Video, platform, dan stream key harus disediakan'
      });
    }

    const videoFile = path.join(__dirname, '../../videos', videoPath);
    if (!fs.existsSync(videoFile)) {
      return res.status(404).json({
        error: 'Video tidak ditemukan'
      });
    }

    const stream = await ffmpegService.startStream({
      videoPath,
      platform,
      streamKey,
      duration: parseInt(duration) || null
    });

    res.json({
      message: 'Streaming dimulai',
      stream
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /streaming/stop - Menghentikan streaming
router.post('/stop', (req, res) => {
  try {
    const { streamId } = req.body;

    if (!streamId) {
      return res.status(400).json({
        error: 'Stream ID harus disediakan'
      });
    }

    const success = ffmpegService.stopStream(streamId);
    if (!success) {
      return res.status(404).json({
        error: 'Stream tidak ditemukan'
      });
    }

    res.json({
      message: 'Streaming dihentikan'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;