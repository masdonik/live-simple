const express = require('express');
const router = express.Router();
const googleDriveService = require('../services/googleDriveService');

// GET /download - Mendapatkan daftar video yang sudah didownload
router.get('/', async (req, res) => {
  try {
    const videos = await googleDriveService.listVideos();
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /download/progress/:downloadId - Mendapatkan progress download
router.get('/progress/:downloadId', (req, res) => {
  try {
    const { downloadId } = req.params;
    const progress = googleDriveService.getDownloadProgress(downloadId);
    
    if (!progress) {
      return res.status(404).json({ 
        error: 'Download tidak ditemukan' 
      });
    }

    // Hitung persentase
    const percentage = progress.total > 0 
      ? Math.floor((progress.downloaded / progress.total) * 100) 
      : 0;

    res.json({
      downloadId,
      status: progress.status,
      progress: percentage,
      downloaded: progress.downloaded,
      total: progress.total,
      error: progress.error
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /download - Download video baru dari Google Drive
router.post('/', async (req, res) => {
  try {
    const { driveUrl } = req.body;

    if (!driveUrl) {
      return res.status(400).json({
        error: 'URL Google Drive harus disediakan'
      });
    }

    const downloadInfo = await googleDriveService.downloadVideo(driveUrl);
    res.json({
      message: 'Video sedang diunduh',
      downloadId: downloadInfo.downloadId,
      video: {
        filename: downloadInfo.filename,
        size: downloadInfo.size
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /download/:filename - Mengubah nama video
router.put('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { newFilename } = req.body;

    if (!newFilename) {
      return res.status(400).json({
        error: 'Nama file baru harus disediakan'
      });
    }

    const updateInfo = await googleDriveService.renameVideo(filename, newFilename);
    res.json({
      message: 'Nama video berhasil diubah',
      video: updateInfo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /download/:filename - Menghapus video
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const deleteInfo = await googleDriveService.deleteVideo(filename);
    res.json({
      message: 'Video berhasil dihapus',
      video: deleteInfo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;