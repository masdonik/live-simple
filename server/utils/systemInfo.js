const si = require('systeminformation');

async function getStats() {
  try {
    const [cpu, mem, disk] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.fsSize()
    ]);

    return {
      cpu: {
        model: cpu.manufacturer + ' ' + cpu.brand,
        cores: cpu.cores,
        speed: cpu.speed + ' GHz'
      },
      memory: {
        total: formatBytes(mem.total),
        used: formatBytes(mem.used),
        free: formatBytes(mem.free)
      },
      disk: disk.map(d => ({
        fs: d.fs,
        size: formatBytes(d.size),
        used: formatBytes(d.used),
        available: formatBytes(d.available),
        use: Math.round(d.use) + '%'
      }))
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    return {
      error: 'Gagal mendapatkan informasi sistem'
    };
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  getStats
};