const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const ffmpegService = require('../services/ffmpegService');

// Get list of available videos
router.get('/', async (req, res) => {
    try {
        const videosDir = path.join(__dirname, '../../videos');
        
        // Create videos directory if it doesn't exist
        try {
            await fs.access(videosDir);
        } catch {
            await fs.mkdir(videosDir, { recursive: true });
        }
        
        const files = await fs.readdir(videosDir);
        const videos = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.mp4', '.mkv', '.avi', '.mov'].includes(ext);
        });
        
        res.json({ videos });
    } catch (error) {
        console.error('Error getting video list:', error);
        res.status(500).json({ error: 'Gagal mendapatkan daftar video' });
    }
});

// Get active streams
router.get('/active', (req, res) => {
    try {
        const streams = ffmpegService.getActiveStreams();
        res.json(streams);
    } catch (error) {
        console.error('Error getting active streams:', error);
        res.status(500).json({ error: 'Gagal mendapatkan daftar streaming aktif' });
    }
});

// Start streaming
router.post('/start', async (req, res) => {
    try {
        const { videoPath, platform, streamKey, duration } = req.body;
        console.log('Starting stream with:', { videoPath, platform, duration });

        if (!videoPath || !platform || !streamKey) {
            return res.status(400).json({ 
                error: 'Video, platform, dan stream key harus diisi' 
            });
        }

        const videoFullPath = path.join(__dirname, '../../videos', videoPath);
        console.log('Full video path:', videoFullPath);
        
        try {
            await fs.access(videoFullPath);
        } catch (error) {
            console.error('Video access error:', error);
            return res.status(404).json({ 
                error: 'Video tidak ditemukan' 
            });
        }

        const stream = await ffmpegService.startStream({
            videoPath: videoFullPath,
            platform,
            streamKey,
            duration: duration ? parseInt(duration) : null
        });

        res.json(stream);
    } catch (error) {
        console.error('Error starting stream:', error);
        res.status(500).json({ 
            error: error.message || 'Gagal memulai streaming' 
        });
    }
});

// Stop streaming
router.post('/stop', (req, res) => {
    try {
        const { streamId } = req.body;
        
        if (!streamId) {
            return res.status(400).json({ 
                error: 'Stream ID harus disertakan' 
            });
        }

        const success = ffmpegService.stopStream(streamId);
        
        if (!success) {
            return res.status(404).json({ 
                error: 'Stream tidak ditemukan' 
            });
        }

        res.json({ message: 'Streaming dihentikan' });
    } catch (error) {
        console.error('Error stopping stream:', error);
        res.status(500).json({ 
            error: 'Gagal menghentikan streaming' 
        });
    }
});

module.exports = router;