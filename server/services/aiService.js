const axios = require('axios');
const fs = require('fs');
const path = require('path');

// VPS AI Provider config
const VPS_BASE_URL = process.env.VPS_AI_BASE_URL || 'http://194.233.66.68:8317/v1';
const VPS_API_KEY = process.env.VPS_AI_API_KEY || 'candat';
const DEFAULT_MODEL = process.env.DEFAULT_AI_MODEL || 'gemini-claude-opus-4-5-thinking';

// File lưu cache dự đoán
const PREDICTION_CACHE_FILE = path.join(__dirname, '../data/predictions-cache.json');
// File lưu lịch sử dự đoán và thống kê
const PREDICTION_HISTORY_FILE = path.join(__dirname, '../data/predictions-history.json');

// Danh sách models có sẵn
const AVAILABLE_MODELS = {
  'claude-opus': {
    id: 'gemini-claude-opus-4-5-thinking',
    name: 'Claude Opus 4.5 Thinking',
    description: 'Mạnh nhất, phân tích sâu'
  },
  'claude-sonnet': {
    id: 'gemini-claude-sonnet-4-5-thinking', 
    name: 'Claude Sonnet 4.5 Thinking',
    description: 'Nhanh hơn, thinking'
  },
  'gemini': {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    description: 'Google Gemini mới nhất'
  },
  'gpt-codex-max': {
    id: 'gpt-5.1-codex-max',
    name: 'GPT 5.1 Codex Max',
    description: 'GPT mạnh nhất'
  },
  'gpt-codex': {
    id: 'gpt-5.2-codex',
    name: 'GPT 5.2 Codex',
    description: 'GPT nhanh'
  },
  'glm': {
    id: 'glm-4.7',
    name: 'GLM 4.7',
    description: 'Model GLM'
  },
  'minimax': {
    id: 'MiniMax-M2.1',
    name: 'MiniMax M2.1',
    description: 'MiniMax AI'
  }
};

// Lấy ngày hôm nay theo giờ Việt Nam (format: 2026-02-05)
function getTodayDateVN() {
  const now = new Date();
  const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return vnTime.toISOString().split('T')[0];
}

// Lấy ngày hôm nay dạng hiển thị
function getTodayDisplayVN() {
  const now = new Date();
  const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return vnTime.toLocaleDateString('vi-VN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Đọc cache dự đoán
function readPredictionCache() {
  try {
    if (fs.existsSync(PREDICTION_CACHE_FILE)) {
      const data = fs.readFileSync(PREDICTION_CACHE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('[Cache] Error reading:', e.message);
  }
  return {};
}

// Lưu cache dự đoán
function savePredictionCache(cache) {
  try {
    const dir = path.dirname(PREDICTION_CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PREDICTION_CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (e) {
    console.error('[Cache] Error saving:', e.message);
  }
}

// Đọc lịch sử dự đoán
function readPredictionHistory() {
  try {
    if (fs.existsSync(PREDICTION_HISTORY_FILE)) {
      const data = fs.readFileSync(PREDICTION_HISTORY_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('[History] Error reading:', e.message);
  }
  return { predictions: {}, statistics: {} };
}

// Lưu lịch sử dự đoán
function savePredictionHistory(history) {
  try {
    const dir = path.dirname(PREDICTION_HISTORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PREDICTION_HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (e) {
    console.error('[History] Error saving:', e.message);
  }
}

// Trích xuất các số dự đoán từ text phân tích
function extractPredictedNumbers(analysisText) {
  const numbers = [];
  // Tìm pattern: Lô [XX] hoặc Lô XX
  const patterns = [
    /Lô\s*\[(\d{2})\]/gi,
    /Lô\s+(\d{2})/gi,
    /\*\*(\d{2})\*\*/g
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(analysisText)) !== null) {
      const num = match[1].padStart(2, '0');
      if (!numbers.includes(num) && num.length === 2) {
        numbers.push(num);
      }
    }
  }
  
  // Chỉ lấy 3 số đầu tiên
  return numbers.slice(0, 3);
}

// Lưu dự đoán cuối cùng trong ngày vào history
function saveFinalPrediction(modelKey, prediction) {
  const history = readPredictionHistory();
  const date = prediction.predictionDate;
  
  if (!history.predictions[date]) {
    history.predictions[date] = {};
  }
  
  // Trích xuất các số dự đoán
  const predictedNumbers = extractPredictedNumbers(prediction.analysis);
  
  history.predictions[date][modelKey] = {
    model: prediction.model,
    modelId: prediction.modelId,
    modelKey: modelKey,
    predictedNumbers: predictedNumbers,
    analysis: prediction.analysis,
    timestamp: prediction.timestamp,
    evaluated: false,
    result: null
  };
  
  // Giữ lại 90 ngày gần nhất
  const dates = Object.keys(history.predictions).sort().reverse();
  if (dates.length > 90) {
    dates.slice(90).forEach(d => delete history.predictions[d]);
  }
  
  savePredictionHistory(history);
  console.log(`[History] Saved final prediction for ${modelKey} on ${date}: [${predictedNumbers.join(', ')}]`);
}

// Kiểm tra xem model đã dự đoán hôm nay chưa
function getCachedPrediction(modelKey) {
  const today = getTodayDateVN();
  const cache = readPredictionCache();
  
  if (cache[today] && cache[today][modelKey]) {
    console.log(`[Cache] Found prediction for ${modelKey} on ${today}`);
    return cache[today][modelKey];
  }
  return null;
}

// Lưu dự đoán vào cache
function cachePrediction(modelKey, prediction) {
  const today = getTodayDateVN();
  const cache = readPredictionCache();
  
  if (!cache[today]) {
    cache[today] = {};
  }
  
  cache[today][modelKey] = prediction;
  
  // Xóa cache cũ (chỉ giữ 7 ngày gần nhất)
  const dates = Object.keys(cache).sort().reverse();
  if (dates.length > 7) {
    dates.slice(7).forEach(date => delete cache[date]);
  }
  
  savePredictionCache(cache);
  console.log(`[Cache] Saved prediction for ${modelKey} on ${today}`);
}

// Prompt template - CHỈ DỰ ĐOÁN 3 CẶP SỐ
function createAnalysisPrompt(statisticsData) {
  const todayVN = getTodayDisplayVN();
  
  return `Bạn là chuyên gia phân tích LÔ TÔ xổ số miền Bắc.

## 📅 NGÀY DỰ ĐOÁN: ${todayVN}

## NHIỆM VỤ:
Dựa trên dữ liệu ${statisticsData.period.days} ngày, phân tích và đưa ra **ĐÚNG 3 CẶP SỐ** có xác suất cao nhất về hôm nay.

---

## 📊 DỮ LIỆU:

### LÔ NÓNG (xuất hiện nhiều):
${statisticsData.hotNumbers.slice(0, 10).map(h => `- ${h.number}: ${h.count} lần`).join('\n')}

### LÔ GAN (lâu chưa về):
${statisticsData.overdueNumbers.slice(0, 10).map(o => `- ${o.number}: ${o.daysSinceLast} ngày chưa về`).join('\n')}

### CẶP HAY ĐI CÙNG:
${statisticsData.topPairs.slice(0, 5).map(p => `- ${p.pair}: ${p.count} lần`).join('\n')}

### ĐẦU ĐUÔI NÓNG:
- Đầu: ${statisticsData.headTailAnalysis.topHeads.slice(0, 3).map(h => h.digit).join(', ')}
- Đuôi: ${statisticsData.headTailAnalysis.topTails.slice(0, 3).map(t => t.digit).join(', ')}

### 5 NGÀY GẦN NHẤT:
${statisticsData.recentResults.slice(0, 5).map(r => `${r.date}: [${r.twoDigits.join(', ')}]`).join('\n')}

---

## ✅ TRẢ LỜI ĐÚNG FORMAT SAU:

### 🎯 3 CẶP SỐ DỰ ĐOÁN HÔM NAY (${todayVN}):

**1. Lô [XX]** - [Lý do ngắn gọn]

**2. Lô [XX]** - [Lý do ngắn gọn]  

**3. Lô [XX]** - [Lý do ngắn gọn]

### 📊 Đầu đuôi gợi ý:
- Đầu: [X]
- Đuôi: [X]

### 📈 Độ tin cậy: [X]%

---
⚠️ CHỈ ĐƯỢC DỰ ĐOÁN ĐÚNG 3 SỐ. Không thêm, không bớt.`;
}

// Gọi API VPS AI
async function callVPSAI(prompt, modelId = DEFAULT_MODEL) {
  try {
    console.log(`[AI] Calling VPS AI with model: ${modelId}`);
    
    const response = await axios.post(
      `${VPS_BASE_URL}/chat/completions`,
      {
        model: modelId,
        messages: [
          {
            role: 'system',
            content: 'Bạn là chuyên gia xổ số. Chỉ trả lời đúng 3 cặp số dự đoán, không hơn không kém. Format rõ ràng.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2048,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${VPS_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('[AI] VPS API Error:', error.response?.data || error.message);
    throw new Error(`AI Error: ${error.response?.data?.error?.message || error.message}`);
  }
}

// Phân tích với model - CÓ CACHE
async function analyze(statisticsData, modelKey = 'claude-opus') {
  // Kiểm tra cache trước
  const cached = getCachedPrediction(modelKey);
  if (cached) {
    console.log(`[AI] Returning cached prediction for ${modelKey}`);
    return {
      ...cached,
      fromCache: true
    };
  }
  
  // Nếu chưa có cache, gọi AI
  const prompt = createAnalysisPrompt(statisticsData);
  
  let modelId = DEFAULT_MODEL;
  let modelName = 'Default Model';
  
  if (AVAILABLE_MODELS[modelKey]) {
    modelId = AVAILABLE_MODELS[modelKey].id;
    modelName = AVAILABLE_MODELS[modelKey].name;
  } else {
    modelId = modelKey;
    modelName = modelKey;
  }
  
  const analysisText = await callVPSAI(prompt, modelId);
  
  const prediction = {
    provider: 'vps-ai',
    model: modelName,
    modelId: modelId,
    modelKey: modelKey,
    analysis: analysisText,
    predictionDate: getTodayDateVN(),
    predictionDateDisplay: getTodayDisplayVN(),
    timestamp: new Date().toISOString(),
    fromCache: false
  };
  
  // Lưu vào cache
  cachePrediction(modelKey, prediction);
  
  // Lưu vào history (dự đoán cuối cùng trong ngày)
  saveFinalPrediction(modelKey, prediction);
  
  return prediction;
}

// Lấy tất cả dự đoán của ngày hôm nay
function getTodayPredictions() {
  const today = getTodayDateVN();
  const cache = readPredictionCache();
  return cache[today] || {};
}

// Xóa cache (force refresh)
function clearTodayCache(modelKey = null) {
  const today = getTodayDateVN();
  const cache = readPredictionCache();
  
  if (modelKey && cache[today]) {
    delete cache[today][modelKey];
    console.log(`[Cache] Cleared ${modelKey} for ${today}`);
  } else if (cache[today]) {
    delete cache[today];
    console.log(`[Cache] Cleared all predictions for ${today}`);
  }
  
  savePredictionCache(cache);
}

// Đánh giá dự đoán dựa trên kết quả thực tế
function evaluatePrediction(date, actualNumbers) {
  const history = readPredictionHistory();
  
  if (!history.predictions[date]) {
    console.log(`[Evaluate] No predictions found for ${date}`);
    return null;
  }
  
  const results = {};
  
  for (const [modelKey, prediction] of Object.entries(history.predictions[date])) {
    if (prediction.evaluated) {
      results[modelKey] = prediction.result;
      continue;
    }
    
    const predictedNumbers = prediction.predictedNumbers || [];
    const hits = predictedNumbers.filter(num => actualNumbers.includes(num));
    
    const result = {
      predictedNumbers: predictedNumbers,
      hits: hits,
      hitCount: hits.length,
      totalPredicted: predictedNumbers.length,
      actualNumbers: actualNumbers,
      isWin: hits.length > 0
    };
    
    // Cập nhật kết quả
    history.predictions[date][modelKey].evaluated = true;
    history.predictions[date][modelKey].result = result;
    
    results[modelKey] = result;
    console.log(`[Evaluate] ${modelKey} on ${date}: ${hits.length}/${predictedNumbers.length} hits - ${hits.length > 0 ? 'WIN' : 'LOSE'}`);
  }
  
  // Cập nhật thống kê tổng hợp
  updateStatistics(history);
  savePredictionHistory(history);
  
  return results;
}

// Cập nhật thống kê tổng hợp theo model
function updateStatistics(history) {
  const stats = {};
  
  for (const [date, predictions] of Object.entries(history.predictions)) {
    for (const [modelKey, prediction] of Object.entries(predictions)) {
      if (!prediction.evaluated || !prediction.result) continue;
      
      if (!stats[modelKey]) {
        stats[modelKey] = {
          totalDays: 0,
          wins: 0,
          losses: 0,
          totalHits: 0,
          totalPredicted: 0,
          winRate: 0,
          hitRate: 0,
          history: []
        };
      }
      
      stats[modelKey].totalDays++;
      if (prediction.result.isWin) {
        stats[modelKey].wins++;
      } else {
        stats[modelKey].losses++;
      }
      stats[modelKey].totalHits += prediction.result.hitCount;
      stats[modelKey].totalPredicted += prediction.result.totalPredicted;
      
      // Lưu lịch sử gần đây (10 ngày)
      if (stats[modelKey].history.length < 10) {
        stats[modelKey].history.push({
          date: date,
          predicted: prediction.predictedNumbers,
          hits: prediction.result.hits,
          isWin: prediction.result.isWin
        });
      }
    }
  }
  
  // Tính tỷ lệ
  for (const modelKey of Object.keys(stats)) {
    if (stats[modelKey].totalDays > 0) {
      stats[modelKey].winRate = Math.round((stats[modelKey].wins / stats[modelKey].totalDays) * 100);
    }
    if (stats[modelKey].totalPredicted > 0) {
      stats[modelKey].hitRate = Math.round((stats[modelKey].totalHits / stats[modelKey].totalPredicted) * 100);
    }
    // Sắp xếp history theo ngày mới nhất
    stats[modelKey].history.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  
  history.statistics = stats;
}

// Lấy thống kê của tất cả models
function getModelStatistics() {
  const history = readPredictionHistory();
  return history.statistics || {};
}

// Lấy thống kê chi tiết của một model
function getModelDetailedStats(modelKey) {
  const history = readPredictionHistory();
  const stats = history.statistics[modelKey] || null;
  
  if (!stats) return null;
  
  // Lấy thêm lịch sử chi tiết
  const detailedHistory = [];
  for (const [date, predictions] of Object.entries(history.predictions)) {
    if (predictions[modelKey] && predictions[modelKey].evaluated) {
      detailedHistory.push({
        date: date,
        predicted: predictions[modelKey].predictedNumbers,
        result: predictions[modelKey].result
      });
    }
  }
  
  detailedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return {
    ...stats,
    detailedHistory: detailedHistory.slice(0, 30)
  };
}

// Lấy tất cả dự đoán chưa được đánh giá
function getPendingEvaluations() {
  const history = readPredictionHistory();
  const pending = [];
  
  for (const [date, predictions] of Object.entries(history.predictions)) {
    for (const [modelKey, prediction] of Object.entries(predictions)) {
      if (!prediction.evaluated) {
        pending.push({
          date: date,
          modelKey: modelKey,
          predictedNumbers: prediction.predictedNumbers
        });
      }
    }
  }
  
  return pending;
}

// Lấy lịch sử dự đoán
function getPredictionHistory(days = 30) {
  const history = readPredictionHistory();
  const result = [];
  
  const sortedDates = Object.keys(history.predictions).sort().reverse().slice(0, days);
  
  for (const date of sortedDates) {
    result.push({
      date: date,
      models: history.predictions[date]
    });
  }
  
  return result;
}

// Lấy danh sách models
function getAvailableProviders() {
  const today = getTodayDateVN();
  const cache = readPredictionCache();
  const todayCache = cache[today] || {};
  
  return Object.entries(AVAILABLE_MODELS).map(([key, value]) => ({
    id: key,
    modelId: value.id,
    name: value.name,
    description: value.description,
    hasPredictionToday: !!todayCache[key]
  }));
}

module.exports = {
  analyze,
  getAvailableProviders,
  getTodayPredictions,
  clearTodayCache,
  createAnalysisPrompt,
  evaluatePrediction,
  getModelStatistics,
  getModelDetailedStats,
  getPendingEvaluations,
  getPredictionHistory,
  extractPredictedNumbers,
  AVAILABLE_MODELS
};
