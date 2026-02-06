const express = require('express');
const router = express.Router();
const lotteryService = require('../services/lotteryService');
const crawlService = require('../services/crawlService');
const statisticsService = require('../services/statisticsService');
const aiService = require('../services/aiService');

// Lấy kết quả mới nhất (từ database, không fetch API)
router.get('/latest', async (req, res) => {
  try {
    // Lấy từ database (đã lưu sẵn)
    const results = crawlService.getRecentResults(1);
    if (results.length > 0) {
      return res.json({
        success: true,
        data: results[0],
        source: 'database'
      });
    }
    
    // Nếu database trống, fetch từ API và lưu
    const result = await lotteryService.fetchLotteryFromAPI();
    
    // Lưu vào database
    const data = crawlService.readData();
    const existingIndex = data.results.findIndex(r => r.date === result.date);
    if (existingIndex >= 0) {
      data.results[existingIndex] = result;
    } else {
      data.results.unshift(result);
    }
    crawlService.saveData(data);
    
    res.json({
      success: true,
      data: result,
      source: 'api'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cập nhật và lưu kết quả mới nhất (fetch API và lưu database)
router.post('/update', async (req, res) => {
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
    // Sắp xếp theo ngày giảm dần
    data.results.sort((a, b) => new Date(b.date) - new Date(a.date));
    // Giữ tối đa 365 ngày
    if (data.results.length > 365) {
      data.results = data.results.slice(0, 365);
    }
    crawlService.saveData(data);
    
    console.log(`[Update] Saved: ${result.dateDisplay} with ${result.twoDigits.length} lô`);
    
    res.json({
      success: true,
      data: result,
      message: `Đã cập nhật kết quả ngày ${result.dateDisplay}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Crawl lịch sử nhiều ngày
router.post('/crawl-history', async (req, res) => {
  try {
    const days = parseInt(req.body.days) || 30;
    res.json({
      success: true,
      message: `Đang crawl ${days} ngày lịch sử... Vui lòng đợi.`
    });
    
    // Chạy async để không block response
    crawlService.crawlHistory(days).then(results => {
      console.log(`[API] Crawl completed: ${results.length} days`);
    }).catch(err => {
      console.error(`[API] Crawl failed: ${err.message}`);
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Lấy tất cả kết quả đã lưu
router.get('/history', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const results = crawlService.getRecentResults(days);
    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Thêm kết quả thủ công
router.post('/manual', (req, res) => {
  try {
    const result = lotteryService.addManualResult(req.body);
    res.json({
      success: true,
      data: result,
      message: 'Đã thêm kết quả thủ công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Import dữ liệu mẫu
router.post('/import-sample', (req, res) => {
  try {
    const results = lotteryService.importSampleData();
    res.json({
      success: true,
      count: results.length,
      message: 'Đã import dữ liệu mẫu'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Lấy thống kê tần suất
router.get('/statistics', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const results = crawlService.getAllResults();
    const report = statisticsService.generateAnalysisReport(results, days);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Lấy số nóng
router.get('/hot-numbers', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const limit = parseInt(req.query.limit) || 10;
    const results = crawlService.getAllResults();
    const frequency = statisticsService.calculateFrequency(results, days);
    const hotNumbers = statisticsService.getHotNumbers(frequency, limit);
    
    res.json({
      success: true,
      data: hotNumbers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Lấy số lạnh
router.get('/cold-numbers', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const limit = parseInt(req.query.limit) || 10;
    const results = crawlService.getAllResults();
    const frequency = statisticsService.calculateFrequency(results, days);
    const coldNumbers = statisticsService.getColdNumbers(frequency, limit);
    
    res.json({
      success: true,
      data: coldNumbers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Lấy số gan
router.get('/overdue-numbers', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const minDays = parseInt(req.query.minDays) || 5;
    const limit = parseInt(req.query.limit) || 10;
    const results = crawlService.getAllResults();
    const frequency = statisticsService.calculateFrequency(results, days);
    const overdueNumbers = statisticsService.getOverdueNumbers(frequency, minDays, limit);
    
    res.json({
      success: true,
      data: overdueNumbers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Phân tích cặp số
router.get('/pairs', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const results = crawlService.getAllResults();
    const pairs = statisticsService.analyzePairs(results, days);
    
    res.json({
      success: true,
      data: pairs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Phân tích đầu đuôi
router.get('/head-tail', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const results = crawlService.getAllResults();
    const headTail = statisticsService.analyzeHeadTail(results, days);
    
    res.json({
      success: true,
      data: headTail
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Phân tích xu hướng
router.get('/trend', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const results = crawlService.getAllResults();
    const trend = statisticsService.analyzeTrend(results, days);
    
    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Phân tích chu kỳ một số cụ thể
router.get('/cycle/:number', (req, res) => {
  try {
    const number = req.params.number.padStart(2, '0');
    const results = crawlService.getAllResults();
    const cycle = statisticsService.analyzeCycle(results, number);
    
    res.json({
      success: true,
      data: cycle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// AI phân tích và dự đoán (có cache - mỗi model 1 lần/ngày)
router.get('/ai-analysis', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const provider = req.query.provider || 'claude-opus';
    
    const results = crawlService.getAllResults();
    
    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Chưa có dữ liệu lịch sử. Vui lòng crawl dữ liệu trước.'
      });
    }
    
    const statisticsData = statisticsService.prepareDataForAI(results, days);
    const analysis = await aiService.analyze(statisticsData, provider);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Lấy tất cả dự đoán của ngày hôm nay
router.get('/today-predictions', (req, res) => {
  try {
    const predictions = aiService.getTodayPredictions();
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Xóa cache dự đoán (force refresh)
router.post('/clear-prediction-cache', (req, res) => {
  try {
    const { modelKey } = req.body;
    aiService.clearTodayCache(modelKey);
    res.json({
      success: true,
      message: modelKey ? `Đã xóa cache của ${modelKey}` : 'Đã xóa tất cả cache hôm nay'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Lấy danh sách AI providers (kèm trạng thái đã dự đoán chưa)
router.get('/ai-providers', (req, res) => {
  try {
    const providers = aiService.getAvailableProviders();
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Lấy thống kê tỉ lệ win của tất cả models
router.get('/model-statistics', (req, res) => {
  try {
    const statistics = aiService.getModelStatistics();
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Lấy thống kê chi tiết của một model
router.get('/model-statistics/:modelKey', (req, res) => {
  try {
    const { modelKey } = req.params;
    const stats = aiService.getModelDetailedStats(modelKey);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: `Không tìm thấy thống kê cho model ${modelKey}`
      });
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Đánh giá dự đoán với kết quả thực tế
router.post('/evaluate-predictions', (req, res) => {
  try {
    const { date } = req.body;
    
    // Lấy kết quả thực tế từ database
    const results = crawlService.getAllResults();
    const targetResult = results.find(r => r.date === date);
    
    if (!targetResult) {
      return res.status(404).json({
        success: false,
        error: `Không tìm thấy kết quả xổ số ngày ${date}`
      });
    }
    
    const evaluationResults = aiService.evaluatePrediction(date, targetResult.twoDigits);
    
    if (!evaluationResults) {
      return res.status(404).json({
        success: false,
        error: `Không có dự đoán nào cho ngày ${date}`
      });
    }
    
    res.json({
      success: true,
      date: date,
      actualNumbers: targetResult.twoDigits,
      data: evaluationResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Lấy lịch sử dự đoán
router.get('/prediction-history', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const history = aiService.getPredictionHistory(days);
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Lấy danh sách dự đoán chưa được đánh giá
router.get('/pending-evaluations', (req, res) => {
  try {
    const pending = aiService.getPendingEvaluations();
    res.json({
      success: true,
      data: pending
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Tự động đánh giá tất cả dự đoán chưa được đánh giá
router.post('/auto-evaluate', (req, res) => {
  try {
    const pending = aiService.getPendingEvaluations();
    const results = crawlService.getAllResults();
    const evaluated = [];
    
    // Nhóm theo ngày
    const pendingByDate = {};
    for (const p of pending) {
      if (!pendingByDate[p.date]) {
        pendingByDate[p.date] = [];
      }
      pendingByDate[p.date].push(p);
    }
    
    for (const [date, predictions] of Object.entries(pendingByDate)) {
      const targetResult = results.find(r => r.date === date);
      if (targetResult) {
        const evalResult = aiService.evaluatePrediction(date, targetResult.twoDigits);
        if (evalResult) {
          evaluated.push({
            date: date,
            results: evalResult
          });
        }
      }
    }
    
    res.json({
      success: true,
      message: `Đã đánh giá ${evaluated.length} ngày`,
      data: evaluated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
