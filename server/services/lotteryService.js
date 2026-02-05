const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/lottery-history.json');
const API_URL = 'https://api-xsmb-today.onrender.com/api/v1';

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

// Lấy kết quả từ API
async function fetchLotteryFromAPI() {
  try {
    const response = await axios.get(API_URL, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });

    const apiData = response.data;
    
    // Chuyển đổi format từ API sang format của chúng ta
    // API format: { time: "4-2-2026", results: { "ĐB": [...], "G1": [...], ... } }
    const result = {
      date: convertDateFormat(apiData.time), // Chuyển "4-2-2026" thành "2026-02-04"
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

    // Trích xuất 2 số cuối từ tất cả các giải
    const allNumbers = Object.values(result.prizes).flat();
    result.twoDigits = allNumbers.map(num => num.slice(-2));

    return result;
  } catch (error) {
    console.error('Error fetching lottery from API:', error.message);
    throw error;
  }
}

// Chuyển đổi định dạng ngày từ "4-2-2026" sang "2026-02-04"
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

// Cập nhật kết quả mới nhất từ API
async function updateLatestResult() {
  try {
    const data = readData();
    const result = await fetchLotteryFromAPI();
    
    // Kiểm tra xem đã có dữ liệu ngày này chưa
    const existingIndex = data.results.findIndex(r => r.date === result.date);
    
    if (existingIndex >= 0) {
      data.results[existingIndex] = result;
    } else {
      data.results.unshift(result);
    }
    
    // Sắp xếp theo ngày giảm dần
    data.results.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Giữ tối đa 365 ngày
    if (data.results.length > 365) {
      data.results = data.results.slice(0, 365);
    }
    
    saveData(data);
    return result;
  } catch (error) {
    console.error('Error updating latest result:', error.message);
    throw error;
  }
}

// Lấy tất cả kết quả đã lưu
function getAllResults() {
  const data = readData();
  return data.results;
}

// Lấy kết quả theo số ngày gần nhất
function getRecentResults(days = 30) {
  const data = readData();
  return data.results.slice(0, days);
}

// Thêm kết quả thủ công
function addManualResult(resultData) {
  const data = readData();
  
  const result = {
    date: resultData.date,
    dateDisplay: resultData.dateDisplay || resultData.date,
    prizes: resultData.prizes || {},
    twoDigits: [],
    countNumbers: resultData.countNumbers || 27
  };

  // Trích xuất 2 số cuối
  const allNumbers = Object.values(result.prizes).flat();
  result.twoDigits = allNumbers.map(num => num.slice(-2));

  const existingIndex = data.results.findIndex(r => r.date === result.date);
  
  if (existingIndex >= 0) {
    data.results[existingIndex] = result;
  } else {
    data.results.push(result);
    data.results.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  
  saveData(data);
  return result;
}

// Import dữ liệu mẫu để test
function importSampleData() {
  const data = readData();
  
  // Dữ liệu mẫu 30 ngày (bạn có thể thêm nhiều hơn)
  const sampleData = generateSampleData(30);
  
  sampleData.forEach(result => {
    const existingIndex = data.results.findIndex(r => r.date === result.date);
    if (existingIndex < 0) {
      data.results.push(result);
    }
  });
  
  data.results.sort((a, b) => new Date(b.date) - new Date(a.date));
  saveData(data);
  
  return data.results;
}

// Tạo dữ liệu mẫu cho testing
function generateSampleData(days) {
  const results = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const result = {
      date: date.toISOString().split('T')[0],
      dateDisplay: `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`,
      prizes: {
        special: [generateNumber(5)],
        first: [generateNumber(5)],
        second: [generateNumber(5), generateNumber(5)],
        third: [generateNumber(5), generateNumber(5), generateNumber(5), generateNumber(5), generateNumber(5), generateNumber(5)],
        fourth: [generateNumber(4), generateNumber(4), generateNumber(4), generateNumber(4)],
        fifth: [generateNumber(4), generateNumber(4), generateNumber(4), generateNumber(4), generateNumber(4), generateNumber(4)],
        sixth: [generateNumber(3), generateNumber(3), generateNumber(3)],
        seventh: [generateNumber(2), generateNumber(2), generateNumber(2), generateNumber(2)]
      },
      twoDigits: [],
      countNumbers: 27
    };
    
    // Trích xuất 2 số cuối
    const allNumbers = Object.values(result.prizes).flat();
    result.twoDigits = allNumbers.map(num => num.slice(-2));
    
    results.push(result);
  }
  
  return results;
}

// Tạo số ngẫu nhiên với số chữ số nhất định
function generateNumber(digits) {
  const max = Math.pow(10, digits);
  const num = Math.floor(Math.random() * max);
  return num.toString().padStart(digits, '0');
}

module.exports = {
  fetchLotteryFromAPI,
  updateLatestResult,
  getAllResults,
  getRecentResults,
  addManualResult,
  importSampleData,
  readData,
  saveData
};
