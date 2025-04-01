# Live Streaming Manager

Aplikasi web untuk mengelola live streaming video ke berbagai platform (Facebook, YouTube) dengan fitur manajemen video dan monitoring sistem.

## Fitur

- Live Streaming:
  - Mendukung streaming ke Facebook dan YouTube
  - Pemilihan video dari daftar yang tersedia
  - Konfigurasi stream key
  - Pengaturan durasi streaming (opsional)
  - Monitoring streaming aktif
  - Kemampuan untuk menghentikan streaming

- Manajemen Video:
  - Download video dari Google Drive
  - Daftar video yang tersedia
  - Rename video
  - Hapus video
  - Informasi ukuran dan tanggal modifikasi

- Monitoring Sistem:
  - Real-time monitoring CPU usage
  - Real-time monitoring RAM usage
  - Real-time monitoring Disk usage
  - Auto-update setiap 5 detik

## Persyaratan Sistem

- Node.js v14 atau lebih baru
- FFmpeg
- Git

## Instalasi

1. Clone repository:
```bash
git clone https://github.com/username/live-streaming-manager.git
cd live-streaming-manager
```

2. Install dependencies:
```bash
npm install
```

3. Install FFmpeg (jika belum terinstall):
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install ffmpeg

# macOS (menggunakan Homebrew)
brew install ffmpeg

# Windows (menggunakan Chocolatey)
choco install ffmpeg
```

4. Buat file .env:
```bash
cp .env.example .env
```

5. Edit file .env dan sesuaikan konfigurasi:
```
PORT=8000
GOOGLE_DRIVE_CLIENT_ID=your_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:8000/auth/google/callback
```

6. Jalankan aplikasi:
```bash
npm start
```

7. Buka browser dan akses:
```
http://localhost:8000
```

## Penggunaan

### Live Streaming

1. Pilih platform streaming (Facebook/YouTube)
2. Pilih video yang akan di-stream
3. Masukkan stream key dari platform yang dipilih
4. (Opsional) Masukkan durasi streaming dalam detik
5. Klik "Mulai Streaming"

### Download Video

1. Masukkan URL Google Drive dari video yang ingin didownload
2. Klik "Download Video"
3. Video yang berhasil didownload akan muncul di daftar "Video Tersedia"

### Manajemen Video

- Untuk mengubah nama video, klik tombol "Rename" di samping video
- Untuk menghapus video, klik tombol "Delete" di samping video

## Teknologi

- Backend: Node.js, Express
- Frontend: HTML, Tailwind CSS, JavaScript
- Database: File System
- Streaming: FFmpeg
- Template Engine: EJS

## Kontribusi

1. Fork repository
2. Buat branch baru (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -am 'Menambah fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

## Lisensi

MIT License - lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.