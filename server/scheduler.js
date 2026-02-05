const cron = require('node-cron');
const lotteryService = require('./services/lotteryService');
const crawlService = require('./services/crawlService');

// Timezone Việt Nam: UTC+7
// 18:35 giờ VN = 11:35 UTC

console.log('🕐 Lottery Scheduler Started');
console.log('📅 Scheduled: 18:35 daily (Vietnam time / UTC+7)');
console.log('');

// Hàm cập nhật kết quả từ API và lưu database
async function fetchAndSave() {
  try {
    // Fetch từ API
    const result = await lotteryService.fetchLotteryFromAPI();
    
    // Lưu vào database
    const data = crawlService.readData();
    const existingIndex = data.results.findIndex(r => r.date === result.date);
    if (existingIndex >= 0) {
      data.results[existingIndex] = result;
    } else {
      data.results.unshift(result);
    }
    data.results.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (data.results.length > 365) {
      data.results = data.results.slice(0, 365);
    }
    crawlService.saveData(data);
    
    return result;
  } catch (error) {
    throw error;
  }
}

// Schedule chạy lúc 18:35 giờ Việt Nam mỗi ngày
// 35 11 * * * = 11:35 UTC = 18:35 UTC+7
cron.schedule('35 11 * * *', async () => {
  const now = new Date();
  const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  
  console.log('');
  console.log('='.repeat(50));
  console.log(`🎰 [${vnTime.toLocaleString('vi-VN')}] Auto-update triggered`);
  console.log('='.repeat(50));
  
  try {
    const result = await fetchAndSave();
    console.log(`✅ Successfully updated: ${result.dateDisplay}`);
    console.log(`📊 Lô tô (${result.twoDigits.length}): ${result.twoDigits.join(', ')}`);
  } catch (error) {
    console.error(`❌ Update failed: ${error.message}`);
    
    // Retry sau 5 phút
    console.log('⏰ Will retry in 5 minutes...');
    setTimeout(async () => {
      try {
        const result = await fetchAndSave();
        console.log(`✅ Retry successful: ${result.dateDisplay}`);
      } catch (err) {
        console.error(`❌ Retry also failed: ${err.message}`);
      }
    }, 5 * 60 * 1000);
  }
}, {
  timezone: 'UTC'
});

// Backup lúc 18:45
cron.schedule('45 11 * * *', async () => {
  const data = crawlService.readData();
  const now = new Date();
  const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const todayStr = vnTime.toISOString().split('T')[0];
  
  const hasToday = data.results.some(r => r.date === todayStr && r.twoDigits.length === 27);
  
  if (!hasToday) {
    console.log('');
    console.log('🔄 [18:45] Backup update...');
    
    try {
      const result = await fetchAndSave();
      console.log(`✅ Backup successful: ${result.dateDisplay}`);
    } catch (error) {
      console.error(`❌ Backup failed: ${error.message}`);
    }
  }
}, {
  timezone: 'UTC'
});

// Log status mỗi giờ
cron.schedule('0 * * * *', () => {
  const now = new Date();
  const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const data = crawlService.readData();
  
  console.log(`📊 [${vnTime.toLocaleString('vi-VN')}] Database: ${data.results.length} days`);
});

// Hiển thị thời gian
function showNextRun() {
  const now = new Date();
  const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  
  const next = new Date(vnTime);
  next.setHours(18, 35, 0, 0);
  
  if (vnTime >= next) {
    next.setDate(next.getDate() + 1);
  }
  
  const diff = next - vnTime;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  console.log(`🕐 Current time (VN): ${vnTime.toLocaleString('vi-VN')}`);
  console.log(`⏰ Next update in: ${hours}h ${minutes}m`);
}

showNextRun();

module.exports = { showNextRun, fetchAndSave };
