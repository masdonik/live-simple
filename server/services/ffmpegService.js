const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

class FFmpegService {
  constructor() {
    this.activeStreams = new Map();
  }

  async startStream({ videoPath, platform, streamKey, duration }) {
    const streamId = uuidv4();
    const rtmpUrl = this._getRTMPUrl(platform, streamKey);
    
    // Simulasi streaming karena ini hanya demo
    console.log(`[DEMO] Memulai streaming ke ${platform}`);
    console.log(`[DEMO] Video: ${videoPath}`);
    console.log(`[DEMO] RTMP URL: ${rtmpUrl}`);
    
    const stream = {
      id: streamId,
      videoPath,
      platform,
      startTime: new Date(),
      status: 'active'
    };

    this.activeStreams.set(streamId, stream);

    // Jika durasi ditentukan, hentikan streaming setelah durasi tersebut
    if (duration) {
      setTimeout(() => {
        this.stopStream(streamId);
      }, duration * 1000);
    }

    return stream;
  }

  stopStream(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      return false;
    }

    console.log(`[DEMO] Menghentikan streaming ${streamId}`);
    this.activeStreams.delete(streamId);
    return true;
  }

  getActiveStreams() {
    return Array.from(this.activeStreams.values());
  }

  _getRTMPUrl(platform, streamKey) {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return `rtmps://live-api-s.facebook.com:443/rtmp/${streamKey}`;
      case 'youtube':
        return `rtmp://a.rtmp.youtube.com/live2/${streamKey}`;
      default:
        throw new Error('Platform tidak didukung');
    }
  }
}

module.exports = new FFmpegService();