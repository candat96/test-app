// Service phân tích thống kê xổ số

// Tính tần suất xuất hiện của từng số (00-99)
function calculateFrequency(results, days = 30) {
  const frequency = {};
  
  // Khởi tạo tất cả số từ 00-99
  for (let i = 0; i < 100; i++) {
    const num = i.toString().padStart(2, '0');
    frequency[num] = {
      number: num,
      count: 0,
      percentage: 0,
      lastAppeared: null,
      daysSinceLastAppeared: null,
      appearances: [] // Ngày xuất hiện
    };
  }

  // Lấy dữ liệu trong khoảng thời gian
  const recentResults = results.slice(0, days);
  const totalDays = recentResults.length;

  // Đếm tần suất
  recentResults.forEach((result, dayIndex) => {
    if (result.twoDigits && result.twoDigits.length > 0) {
      result.twoDigits.forEach(num => {
        if (frequency[num]) {
          frequency[num].count++;
          frequency[num].appearances.push({
            date: result.date,
            dayIndex: dayIndex
          });
        }
      });
    }
  });

  // Tính phần trăm và ngày cuối xuất hiện
  Object.keys(frequency).forEach(num => {
    const data = frequency[num];
    data.percentage = totalDays > 0 ? ((data.count / totalDays) * 100).toFixed(2) : 0;
    
    if (data.appearances.length > 0) {
      data.lastAppeared = data.appearances[0].date;
      data.daysSinceLastAppeared = data.appearances[0].dayIndex;
    } else {
      data.daysSinceLastAppeared = totalDays;
    }
  });

  return frequency;
}

// Tìm số "nóng" - xuất hiện nhiều gần đây
function getHotNumbers(frequency, limit = 10) {
  return Object.values(frequency)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Tìm số "lạnh" - lâu chưa xuất hiện (có khả năng về)
function getColdNumbers(frequency, limit = 10) {
  return Object.values(frequency)
    .filter(f => f.daysSinceLastAppeared !== null)
    .sort((a, b) => b.daysSinceLastAppeared - a.daysSinceLastAppeared)
    .slice(0, limit);
}

// Tìm số "gan" - chưa về nhiều ngày liên tiếp
function getOverdueNumbers(frequency, minDays = 10, limit = 10) {
  return Object.values(frequency)
    .filter(f => f.daysSinceLastAppeared >= minDays)
    .sort((a, b) => b.daysSinceLastAppeared - a.daysSinceLastAppeared)
    .slice(0, limit);
}

// Phân tích cặp số hay đi cùng
function analyzePairs(results, days = 30) {
  const pairs = {};
  const recentResults = results.slice(0, days);

  recentResults.forEach(result => {
    if (result.twoDigits && result.twoDigits.length > 1) {
      const uniqueNumbers = [...new Set(result.twoDigits)];
      
      // Tìm tất cả các cặp trong ngày
      for (let i = 0; i < uniqueNumbers.length; i++) {
        for (let j = i + 1; j < uniqueNumbers.length; j++) {
          const pair = [uniqueNumbers[i], uniqueNumbers[j]].sort().join('-');
          pairs[pair] = (pairs[pair] || 0) + 1;
        }
      }
    }
  });

  // Sắp xếp theo tần suất
  return Object.entries(pairs)
    .map(([pair, count]) => ({ pair, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

// Phân tích đầu đuôi
function analyzeHeadTail(results, days = 30) {
  const heads = {}; // Số đầu (0-9)
  const tails = {}; // Số đuôi (0-9)

  // Khởi tạo
  for (let i = 0; i <= 9; i++) {
    heads[i] = { digit: i, count: 0, numbers: [] };
    tails[i] = { digit: i, count: 0, numbers: [] };
  }

  const recentResults = results.slice(0, days);

  recentResults.forEach(result => {
    if (result.twoDigits) {
      result.twoDigits.forEach(num => {
        const head = parseInt(num[0]);
        const tail = parseInt(num[1]);
        
        heads[head].count++;
        if (!heads[head].numbers.includes(num)) {
          heads[head].numbers.push(num);
        }
        
        tails[tail].count++;
        if (!tails[tail].numbers.includes(num)) {
          tails[tail].numbers.push(num);
        }
      });
    }
  });

  return {
    heads: Object.values(heads).sort((a, b) => b.count - a.count),
    tails: Object.values(tails).sort((a, b) => b.count - a.count)
  };
}

// Phân tích xu hướng (tăng/giảm tần suất)
function analyzeTrend(results, days = 30) {
  const halfDays = Math.floor(days / 2);
  const recentResults = results.slice(0, days);
  
  const firstHalf = recentResults.slice(0, halfDays);
  const secondHalf = recentResults.slice(halfDays);

  const firstFreq = {};
  const secondFreq = {};

  // Khởi tạo
  for (let i = 0; i < 100; i++) {
    const num = i.toString().padStart(2, '0');
    firstFreq[num] = 0;
    secondFreq[num] = 0;
  }

  // Đếm nửa đầu (gần đây hơn)
  firstHalf.forEach(result => {
    if (result.twoDigits) {
      result.twoDigits.forEach(num => {
        firstFreq[num]++;
      });
    }
  });

  // Đếm nửa sau
  secondHalf.forEach(result => {
    if (result.twoDigits) {
      result.twoDigits.forEach(num => {
        secondFreq[num]++;
      });
    }
  });

  // Tính xu hướng
  const trends = [];
  for (let i = 0; i < 100; i++) {
    const num = i.toString().padStart(2, '0');
    const diff = firstFreq[num] - secondFreq[num];
    trends.push({
      number: num,
      recentCount: firstFreq[num],
      previousCount: secondFreq[num],
      trend: diff > 0 ? 'increasing' : diff < 0 ? 'decreasing' : 'stable',
      trendValue: diff
    });
  }

  return {
    increasing: trends.filter(t => t.trend === 'increasing').sort((a, b) => b.trendValue - a.trendValue).slice(0, 10),
    decreasing: trends.filter(t => t.trend === 'decreasing').sort((a, b) => a.trendValue - b.trendValue).slice(0, 10)
  };
}

// Phân tích chu kỳ xuất hiện
function analyzeCycle(results, number) {
  const appearances = [];
  
  results.forEach((result, index) => {
    if (result.twoDigits && result.twoDigits.includes(number)) {
      appearances.push({
        date: result.date,
        dayIndex: index
      });
    }
  });

  if (appearances.length < 2) {
    return {
      number,
      averageCycle: null,
      cycles: [],
      appearances
    };
  }

  // Tính chu kỳ giữa các lần xuất hiện
  const cycles = [];
  for (let i = 0; i < appearances.length - 1; i++) {
    cycles.push(appearances[i + 1].dayIndex - appearances[i].dayIndex);
  }

  const averageCycle = cycles.reduce((a, b) => a + b, 0) / cycles.length;

  return {
    number,
    averageCycle: averageCycle.toFixed(1),
    cycles,
    appearances: appearances.slice(0, 10)
  };
}

// Tạo báo cáo phân tích tổng hợp
function generateAnalysisReport(results, days = 30) {
  const frequency = calculateFrequency(results, days);
  const hotNumbers = getHotNumbers(frequency, 10);
  const coldNumbers = getColdNumbers(frequency, 10);
  const overdueNumbers = getOverdueNumbers(frequency, 5, 10);
  const pairs = analyzePairs(results, days);
  const headTail = analyzeHeadTail(results, days);
  const trend = analyzeTrend(results, days);

  return {
    period: {
      days,
      from: results[Math.min(days - 1, results.length - 1)]?.date,
      to: results[0]?.date
    },
    frequency,
    hotNumbers,
    coldNumbers,
    overdueNumbers,
    pairs,
    headTail,
    trend,
    summary: {
      totalResults: Math.min(days, results.length),
      mostFrequent: hotNumbers[0],
      leastFrequent: coldNumbers[0],
      longestOverdue: overdueNumbers[0]
    }
  };
}

// Tạo dữ liệu cho AI phân tích
function prepareDataForAI(results, days = 30) {
  const report = generateAnalysisReport(results, days);
  
  return {
    period: report.period,
    hotNumbers: report.hotNumbers.map(h => ({
      number: h.number,
      count: h.count,
      daysSinceLast: h.daysSinceLastAppeared
    })),
    coldNumbers: report.coldNumbers.map(c => ({
      number: c.number,
      count: c.count,
      daysSinceLast: c.daysSinceLastAppeared
    })),
    overdueNumbers: report.overdueNumbers.map(o => ({
      number: o.number,
      count: o.count,
      daysSinceLast: o.daysSinceLastAppeared
    })),
    topPairs: report.pairs.slice(0, 10),
    headTailAnalysis: {
      topHeads: report.headTail.heads.slice(0, 5),
      topTails: report.headTail.tails.slice(0, 5)
    },
    trendAnalysis: {
      increasing: report.trend.increasing.slice(0, 5),
      decreasing: report.trend.decreasing.slice(0, 5)
    },
    recentResults: results.slice(0, 7).map(r => ({
      date: r.date,
      twoDigits: r.twoDigits
    }))
  };
}

module.exports = {
  calculateFrequency,
  getHotNumbers,
  getColdNumbers,
  getOverdueNumbers,
  analyzePairs,
  analyzeHeadTail,
  analyzeTrend,
  analyzeCycle,
  generateAnalysisReport,
  prepareDataForAI
};
