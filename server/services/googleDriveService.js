const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);
const cheerio = require('cheerio');

class GoogleDriveService {
  constructor() {
    this.videosDir = path.join(__dirname, '../../videos');
    this.downloadProgress = {};
    
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

      // Generate unique download ID
      const downloadId = `download_${Date.now()}`;
      this.downloadProgress[downloadId] = {
        downloaded: 0,
        total: 0,
        status: 'starting'
      };

      // Get file metadata first
      const metadataUrl = `https://drive.google.com/file/d/${fileId}/view`;
      const metadataResponse = await axios.get(metadataUrl);
      const $ = cheerio.load(metadataResponse.data);
      const title = $('title').text().replace(' - Google Drive', '').trim();
      const filename = title || `video-${fileId}.mp4`;

      // Get direct download link with confirmation token
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const response = await axios.get(downloadUrl, {
        maxRedirects: 5,
        validateStatus: status => status < 400
      });

      let finalUrl = downloadUrl;
      
      // Check if we need to handle the confirmation page for large files
      if (response.data.includes('Google Drive - Virus scan warning')) {
        const $ = cheerio.load(response.data);
        const confirmToken = $('form').find('input[name="confirm"]').val();
        if (confirmToken) {
          finalUrl = `${downloadUrl}&confirm=${confirmToken}`;
        }
      }

      // Start the actual download with progress tracking
      const downloadResponse = await axios({
        method: 'get',
        url: finalUrl,
        responseType: 'stream',
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Get total size
      const totalSize = parseInt(downloadResponse.headers['content-length'], 10);
      const filepath = path.join(this.videosDir, filename);

      // Update progress store with total size
      this.downloadProgress[downloadId].total = totalSize;
      this.downloadProgress[downloadId].status = 'downloading';

      // Create write stream
      const writer = fs.createWriteStream(filepath);

      // Set up progress tracking
      downloadResponse.data.on('data', (chunk) => {
        this.downloadProgress[downloadId].downloaded += chunk.length;
      });

      // Handle download completion
      downloadResponse.data.on('end', () => {
        this.downloadProgress[downloadId].status = 'completed';
      });

      // Handle errors
      downloadResponse.data.on('error', (err) => {
        this.downloadProgress[downloadId].status = 'error';
        this.downloadProgress[downloadId].error = err.message;
        console.error('Download error:', err);
      });

      // Start download
      await pipeline(downloadResponse.data, writer);

      // Get final file stats
      const stats = await fs.promises.stat(filepath);

      // Clean up progress data after a delay
      setTimeout(() => {
        delete this.downloadProgress[downloadId];
      }, 300000); // Remove after 5 minutes

      return {
        downloadId,
        filename,
        size: stats.size,
        path: filepath,
        downloadDate: new Date()
      };
    } catch (error) {
      console.error('Error downloading video:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      throw new Error(`Gagal mengunduh video: ${error.message}`);
    }
  }

  getDownloadProgress(downloadId) {
    return this.downloadProgress[downloadId] || null;
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
        if (file !== '.gitkeep') {
          const stats = await fs.promises.stat(path.join(this.videosDir, file));
          videoFiles.push({
            filename: file,
            size: stats.size,
            modifiedDate: stats.mtime
          });
        }
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
}

module.exports = new GoogleDriveService();