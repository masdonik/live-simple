const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class FFmpegService {
    constructor() {
        this.activeStreams = new Map();
    }

    async startStream({ videoPath, platform, streamKey, duration = null }) {
        try {
            const streamId = uuidv4();
            const rtmpUrl = this.getRTMPUrl(platform, streamKey);
            
            // FFmpeg command untuk streaming
            const ffmpegArgs = [
                '-re',                    // Read input at native frame rate
                '-i', videoPath,          // Input file
                '-c:v', 'libx264',        // Video codec
                '-preset', 'veryfast',    // Encoding preset
                '-maxrate', '2500k',      // Maximum bitrate
                '-bufsize', '5000k',      // Buffer size
                '-pix_fmt', 'yuv420p',    // Pixel format
                '-g', '60',               // Keyframe interval
                '-c:a', 'aac',            // Audio codec
                '-b:a', '128k',           // Audio bitrate
                '-ar', '44100',           // Audio sample rate
                '-f', 'flv',              // Output format
                rtmpUrl                   // Output URL
            ];

            console.log('Starting FFmpeg with command:', 'ffmpeg', ffmpegArgs.join(' '));

            const ffmpeg = spawn('ffmpeg', ffmpegArgs);

            ffmpeg.stdout.on('data', (data) => {
                console.log(`FFmpeg stdout: ${data}`);
            });

            ffmpeg.stderr.on('data', (data) => {
                console.log(`FFmpeg stderr: ${data}`);
            });

            ffmpeg.on('error', (error) => {
                console.error('FFmpeg error:', error);
                this.stopStream(streamId);
            });

            ffmpeg.on('close', (code) => {
                console.log(`FFmpeg process exited with code ${code}`);
                this.stopStream(streamId);
            });

            const stream = {
                id: streamId,
                videoPath,
                platform,
                startTime: new Date(),
                status: 'active',
                process: ffmpeg
            };

            this.activeStreams.set(streamId, stream);

            // Jika durasi diatur, hentikan streaming setelah durasi tersebut
            if (duration) {
                setTimeout(() => {
                    this.stopStream(streamId);
                }, duration * 1000);
            }

            return {
                id: streamId,
                videoPath,
                platform,
                startTime: stream.startTime
            };
        } catch (error) {
            console.error('Error starting stream:', error);
            throw error;
        }
    }

    stopStream(streamId) {
        const stream = this.activeStreams.get(streamId);
        if (!stream) {
            return false;
        }

        try {
            if (stream.process) {
                stream.process.kill('SIGTERM');
            }
        } catch (error) {
            console.error('Error stopping FFmpeg process:', error);
        }

        this.activeStreams.delete(streamId);
        return true;
    }

    getActiveStreams() {
        return Array.from(this.activeStreams.values()).map(stream => ({
            id: stream.id,
            videoPath: stream.videoPath,
            platform: stream.platform,
            startTime: stream.startTime
        }));
    }

    getRTMPUrl(platform, streamKey) {
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