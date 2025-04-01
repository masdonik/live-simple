const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);

class GoogleDriveService {
  constructor() {
    this.videosDir = path.join(__dirname, '../../videos');
    // Pastikan direktori videos ada
    if (!fs.existsSync(this.videosDir)) {
      fs.mkdirSync(this.videosDir, { recursive: true });
    }
  }

  async downloadVideo(driveUrl) {
    try {
      // Extract file ID from Google Drive URL
      const fileId = this._extractFileId(driveUrl);
      if (!fileId) {
        throw new Error('URL Google Drive tidak valid');
      }

      // Get direct download link
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

      // Get file metadata first
      const response = await axios.get(downloadUrl, { 
        responseType: 'stream',
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });

      // Get filename from content-disposition header or use fileId
      const filename = this._getFilenameFromResponse(response) || `video-${fileId}.mp4`;
      const filepath = path.join(this.videosDir, filename);

      // Download file
      await pipeline(
        response.data,
        fs.createWriteStream(filepath)
      );

      // Get file stats
      const stats = await fs.promises.stat(filepath);

      return {
        filename,
        size: stats.size,
        path: filepath,
        downloadDate: new Date()
      };
    } catch (error) {
      console.error('Error downloading video:', error);
      throw new Error(`Gagal mengunduh video: ${error.message}`);
    }
  }

  async renameVideo(oldFilename, newFilename) {
    try {
      const oldPath = path.join(this.videosDir, oldFilename);
      const newPath = path.join(this.videosDir, newFilename);

      // Check if old file exists
      if (!fs.existsSync(oldPath)) {
        throw new Error('File tidak ditemukan');
      }

      // Check if new filename already exists
      if (fs.existsSync(newPath)) {
        throw new Error('Nama file baru sudah ada');
      }

      // Rename file
      await fs.promises.rename(oldPath, newPath);

      // Get updated file stats
      const stats = await fs.promises.stat(newPath);

      return {
        filename: newFilename,
        size: stats.size,
        path: newPath,
        modifiedDate: new Date()
      };
    } catch (error) {
      console.error('Error renaming video:', error);
      throw new Error(`Gagal mengubah nama video: ${error.message}`);
    }
  }

  async deleteVideo(filename) {
    try {
      const filepath = path.join(this.videosDir, filename);

      // Check if file exists
      if (!fs.existsSync(filepath)) {
        throw new Error('File tidak ditemukan');
      }

      // Delete file
      await fs.promises.unlink(filepath);

      return {
        filename,
        deletedAt: new Date()
      };
    } catch (error) {
      console.error('Error deleting video:', error);
      throw new Error(`Gagal menghapus video: ${error.message}`);
    }
  }

  async listVideos() {
    try {
      const files = await fs.promises.readdir(this.videosDir);
      const videoFiles = [];

      for (const file of files) {
        const stats = await fs.promises.stat(path.join(this.videosDir, file));
        videoFiles.push({
          filename: file,
          size: stats.size,
          modifiedDate: stats.mtime
        });
      }

      return videoFiles;
    } catch (error) {
      console.error('Error listing videos:', error);
      throw new Error(`Gagal mendapatkan daftar video: ${error.message}`);
    }
  }

  _extractFileId(url) {
    const patterns = [
      /\/file\/d\/([^/]+)/,          // Format: /file/d/[fileId]/
      /id=([^&]+)/,                  // Format: id=[fileId]
      /\/d\/([^/]+)/                 // Format: /d/[fileId]
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  _getFilenameFromResponse(response) {
    const disposition = response.headers['content-disposition'];
    if (disposition) {
      const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        return filenameMatch[1].replace(/['"]/g, '');
      }
    }
    return null;
  }
}

module.exports = new GoogleDriveService();