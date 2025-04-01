const si = require('systeminformation');

async function getStats() {
  try {
    // Get CPU usage
    const cpu = await si.currentLoad();
    
    // Get memory usage
    const mem = await si.mem();
    const memUsed = Math.floor((mem.used / mem.total) * 100);
    
    // Get disk usage
    const disk = await si.fsSize();
    const mainDisk = disk[0]; // Mengambil disk utama
    const diskUsed = Math.floor((mainDisk.used / mainDisk.size) * 100);

    return {
      cpu: Math.floor(cpu.currentLoad),
      memory: memUsed,
      disk: diskUsed,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error getting system stats:', error);
    return {
      cpu: 0,
      memory: 0,
      disk: 0,
      timestamp: new Date(),
      error: error.message
    };
  }
}

module.exports = {
  getStats
};