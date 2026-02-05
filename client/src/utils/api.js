import axios from 'axios';

const API_BASE = '/api/lottery';

const api = {
  // Lấy kết quả mới nhất
  getLatest: () => axios.get(`${API_BASE}/latest`),
  
  // Cập nhật kết quả mới nhất
  updateLatest: () => axios.post(`${API_BASE}/update`),
  
  // Lấy lịch sử kết quả
  getHistory: (days = 30) => axios.get(`${API_BASE}/history?days=${days}`),
  
  // Lấy thống kê
  getStatistics: (days = 30) => axios.get(`${API_BASE}/statistics?days=${days}`),
  
  // Lấy số nóng
  getHotNumbers: (days = 30, limit = 10) => 
    axios.get(`${API_BASE}/hot-numbers?days=${days}&limit=${limit}`),
  
  // Lấy số lạnh
  getColdNumbers: (days = 30, limit = 10) => 
    axios.get(`${API_BASE}/cold-numbers?days=${days}&limit=${limit}`),
  
  // Lấy số gan
  getOverdueNumbers: (days = 30, minDays = 5, limit = 10) => 
    axios.get(`${API_BASE}/overdue-numbers?days=${days}&minDays=${minDays}&limit=${limit}`),
  
  // Lấy cặp số hay đi cùng
  getPairs: (days = 30) => axios.get(`${API_BASE}/pairs?days=${days}`),
  
  // Lấy phân tích đầu đuôi
  getHeadTail: (days = 30) => axios.get(`${API_BASE}/head-tail?days=${days}`),
  
  // Lấy xu hướng
  getTrend: (days = 30) => axios.get(`${API_BASE}/trend?days=${days}`),
  
  // Phân tích chu kỳ một số
  getCycle: (number) => axios.get(`${API_BASE}/cycle/${number}`),
  
  // AI phân tích
  getAIAnalysis: (days = 30, provider = 'anthropic') => 
    axios.get(`${API_BASE}/ai-analysis?days=${days}&provider=${provider}`),
  
  // Lấy danh sách AI providers
  getAIProviders: () => axios.get(`${API_BASE}/ai-providers`),
  
  // Xóa cache dự đoán
  clearPredictionCache: (modelKey) => 
    axios.post(`${API_BASE}/clear-prediction-cache`, { modelKey }),
  
  // Import dữ liệu mẫu
  importSample: () => axios.post(`${API_BASE}/import-sample`)
};

export default api;
