const axios = require('axios');
const fs = require('fs');
const path = require('path');

// VPS AI Provider config
const VPS_BASE_URL = process.env.VPS_AI_BASE_URL || 'http://194.233.66.68:8317/v1';
const VPS_API_KEY = process.env.VPS_AI_API_KEY || 'candat';
const DEFAULT_MODEL = process.env.DEFAULT_AI_MODEL || 'gemini-claude-opus-4-5-thinking';

// File lưu cache dự đoán
const PREDICTION_CACHE_FILE = path.join(__dirname, '../data/predictions-cache.json');

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
  AVAILABLE_MODELS
};
