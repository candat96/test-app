const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/lottery-history.json');

// Đảm bảo file data tồn tại
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ results: [] }, null, 2));
  }
}

// Đọc dữ liệu từ file
function readData() {
  ensureDataFile();
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
}

// Lưu dữ liệu vào file
function saveData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Crawl từ xskt.com.vn - lấy kết quả theo ngày
async function crawlXSKT(dateStr = null) {
  try {
    // dateStr format: "4-2-2026" hoặc null để lấy hôm nay
    let url = 'https://xskt.com.vn/xsmb';
    let targetDate = null;
    
    if (dateStr) {
      url = `https://xskt.com.vn/xsmb/ngay-${dateStr}`;
      // Parse dateStr để lấy ngày chính xác
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        targetDate = {
          date: `${year}-${month}-${day}`,
          display: dateStr
        };
      }
    }

    console.log(`[Crawl] Fetching: ${url}`);

    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Parse bảng kết quả XSMB
    const result = {
      date: '',
      dateDisplay: '',
      prizes: {
        special: [],
        first: [],
        second: [],
        third: [],
        fourth: [],
        fifth: [],
        sixth: [],
        seventh: []
      },
      twoDigits: []
    };

    // Sử dụng ngày từ URL nếu có
    if (targetDate) {
      result.date = targetDate.date;
      result.dateDisplay = targetDate.display;
    } else {
      // Lấy ngày từ tiêu đề cho trường hợp không có dateStr
      const dateMatch = $('h2').first().text().match(/ngày\s*(\d{1,2})\/(\d{1,2})/i);
      if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0');
        const month = dateMatch[2].padStart(2, '0');
        const year = new Date().getFullYear();
        result.date = `${year}-${month}-${day}`;
        result.dateDisplay = `${dateMatch[1]}-${dateMatch[2]}-${year}`;
      } else {
        const today = new Date();
        result.date = today.toISOString().split('T')[0];
        result.dateDisplay = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      }
    }

    // Parse từng giải từ bảng kết quả
    const table = $('table.result#MB0, table#MB0');
    
    table.find('tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const prizeLabel = $(cells[0]).text().trim().toUpperCase();
        const prizeContent = $(cells[1]);
        
        let numbers = [];
        
        // Lấy số từ thẻ em (giải ĐB) hoặc p
        const emText = prizeContent.find('em').text().trim();
        if (emText) {
          numbers.push(emText);
        }
        
        const pText = prizeContent.find('p').text().trim();
        if (pText) {
          // Tách các số bằng khoảng trắng
          const nums = pText.split(/\s+/).filter(n => /^\d+$/.test(n));
          numbers = numbers.concat(nums);
        }

        // Map vào đúng giải
        if (prizeLabel.includes('ĐB') || prizeLabel.includes('DB')) {
          result.prizes.special = numbers;
        } else if (prizeLabel === 'G1') {
          result.prizes.first = numbers;
        } else if (prizeLabel === 'G2') {
          result.prizes.second = numbers;
        } else if (prizeLabel === 'G3') {
          result.prizes.third = numbers;
        } else if (prizeLabel === 'G4') {
          result.prizes.fourth = numbers;
        } else if (prizeLabel === 'G5') {
          result.prizes.fifth = numbers;
        } else if (prizeLabel === 'G6') {
          result.prizes.sixth = numbers;
        } else if (prizeLabel === 'G7') {
          result.prizes.seventh = numbers;
        }
      }
    });

    // Trích xuất 2 số cuối từ tất cả các giải
    const allNumbers = Object.values(result.prizes).flat().filter(n => n);
    result.twoDigits = allNumbers.map(num => num.slice(-2));
    result.countNumbers = result.twoDigits.length;

    console.log(`[Crawl] Got ${result.twoDigits.length} numbers for ${result.dateDisplay}`);
    
    return result;
  } catch (error) {
    console.error('[Crawl] Error:', error.message);
    throw error;
  }
}

// Crawl từ API (backup)
async function crawlFromAPI() {
  try {
    const response = await axios.get('https://api-xsmb-today.onrender.com/api/v1', {
      timeout: 10000
    });

    const apiData = response.data;
    
    const result = {
      date: convertDateFormat(apiData.time),
      dateDisplay: apiData.time,
      prizes: {
        special: apiData.results['ĐB'] || [],
        first: apiData.results['G1'] || [],
        second: apiData.results['G2'] || [],
        third: apiData.results['G3'] || [],
        fourth: apiData.results['G4'] || [],
        fifth: apiData.results['G5'] || [],
        sixth: apiData.results['G6'] || [],
        seventh: apiData.results['G7'] || []
      },
      twoDigits: [],
      countNumbers: apiData.countNumbers
    };

    const allNumbers = Object.values(result.prizes).flat();
    result.twoDigits = allNumbers.map(num => num.slice(-2));

    return result;
  } catch (error) {
    console.error('[API] Error:', error.message);
    throw error;
  }
}

// Chuyển đổi định dạng ngày
function convertDateFormat(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

// Crawl 30 ngày lịch sử từ xskt.com.vn
async function crawlHistory(days = 30) {
  console.log(`[History] Starting to crawl ${days} days of history...`);
  
  const results = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const dateStr = `${day}-${month}-${year}`;
    
    try {
      const result = await crawlXSKT(dateStr);
      if (result.twoDigits.length > 0) {
        results.push(result);
        console.log(`[History] ✓ ${dateStr}: ${result.twoDigits.length} numbers`);
      } else {
        console.log(`[History] ✗ ${dateStr}: No data`);
      }
      
      // Delay để tránh bị block
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`[History] ✗ ${dateStr}: ${error.message}`);
    }
  }
  
  // Lưu vào database
  const data = readData();
  
  results.forEach(result => {
    const existingIndex = data.results.findIndex(r => r.date === result.date);
    if (existingIndex >= 0) {
      data.results[existingIndex] = result;
    } else {
      data.results.push(result);
    }
  });
  
  // Sắp xếp theo ngày giảm dần
  data.results.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  saveData(data);
  
  console.log(`[History] Saved ${results.length} results to database`);
  return results;
}

// Cập nhật kết quả hôm nay
async function updateToday() {
  console.log('[Update] Fetching today result...');
  
  let result;
  
  // Thử crawl từ xskt.com.vn trước
  try {
    result = await crawlXSKT();
    if (result.twoDigits.length === 0) {
      throw new Error('No data from xskt');
    }
  } catch (e) {
    console.log('[Update] xskt failed, trying API...');
    // Fallback to API
    result = await crawlFromAPI();
  }
  
  if (result.twoDigits.length === 0) {
    throw new Error('Could not get today result');
  }
  
  // Lưu vào database
  const data = readData();
  const existingIndex = data.results.findIndex(r => r.date === result.date);
  
  if (existingIndex >= 0) {
    data.results[existingIndex] = result;
  } else {
    data.results.unshift(result);
  }
  
  // Giữ tối đa 365 ngày
  if (data.results.length > 365) {
    data.results = data.results.slice(0, 365);
  }
  
  saveData(data);
  
  console.log(`[Update] ✓ Saved: ${result.dateDisplay} with ${result.twoDigits.length} numbers`);
  console.log(`[Update] Lô tô: ${result.twoDigits.join(', ')}`);
  
  return result;
}

// Lấy tất cả kết quả
function getAllResults() {
  const data = readData();
  return data.results;
}

// Lấy kết quả theo số ngày
function getRecentResults(days = 30) {
  const data = readData();
  return data.results.slice(0, days);
}

module.exports = {
  crawlXSKT,
  crawlFromAPI,
  crawlHistory,
  updateToday,
  getAllResults,
  getRecentResults,
  readData,
  saveData
};

// Chạy trực tiếp nếu gọi từ command line
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'history') {
    const days = parseInt(args[1]) || 30;
    crawlHistory(days).then(() => {
      console.log('Done!');
      process.exit(0);
    }).catch(err => {
      console.error(err);
      process.exit(1);
    });
  } else if (args[0] === 'today') {
    updateToday().then(() => {
      console.log('Done!');
      process.exit(0);
    }).catch(err => {
      console.error(err);
      process.exit(1);
    });
  } else {
    console.log('Usage:');
    console.log('  node crawlService.js history [days]  - Crawl history data');
    console.log('  node crawlService.js today           - Update today result');
  }
}
