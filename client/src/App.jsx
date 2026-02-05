import { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Database, 
  TrendingUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  Calendar,
  Clock
} from 'lucide-react';
import { useLottery } from './hooks/useLottery';
import LotteryResult from './components/LotteryResult';
import NumberStats from './components/NumberStats';
import FrequencyChart from './components/FrequencyChart';
import AIAnalysis from './components/AIAnalysis';
import PairsAndTrends from './components/PairsAndTrends';
import HistoryTable from './components/HistoryTable';
import './index.css';

// Kiểm tra đã qua 18:35 chưa (giờ VN)
function isPastResultTime() {
  const now = new Date();
  const vnHour = (now.getUTCHours() + 7) % 24;
  const vnMinute = now.getUTCMinutes();
  return vnHour > 18 || (vnHour === 18 && vnMinute >= 35);
}

// Lấy ngày hôm nay theo giờ VN
function getTodayVN() {
  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return vnTime.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });
}

function App() {
  const { 
    latestResult, 
    history, 
    statistics, 
    loading, 
    fetchLatest,
    fetchHistory, 
    fetchStatistics,
    updateResult,
  } = useLottery();

  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Load initial data
  useEffect(() => {
    fetchLatest();
    fetchHistory(30);
    fetchStatistics(30);
  }, [fetchLatest, fetchHistory, fetchStatistics]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdate = async () => {
    try {
      await updateResult();
      await fetchStatistics(30);
      showNotification('Đã cập nhật kết quả!');
    } catch (err) {
      showNotification('Lỗi: ' + err.message, 'error');
    }
  };

  const pastResultTime = isPastResultTime();
  const todayVN = getTodayVN();

  const tabs = [
    { id: 'dashboard', label: 'Dự đoán', icon: TrendingUp },
    { id: 'history', label: 'Lịch sử', icon: Database },
  ];

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🎰</div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Dự Đoán LÔ TÔ XSMB
                </h1>
                <p className="text-yellow-200 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {todayVN}
                  {!pastResultTime && (
                    <span className="bg-yellow-600 text-white text-xs px-2 py-0.5 rounded">
                      Chưa xổ
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <div className="text-right text-white text-xs mr-2 hidden sm:block">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Xổ lúc 18:35
                </div>
              </div>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="btn btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Cập nhật</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-800 text-white'
                    : 'bg-white/20 text-white/80 hover:bg-white/30'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'error' 
            ? 'bg-red-600 text-white' 
            : 'bg-green-600 text-white'
        }`}>
          {notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          {notification.message}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Row 1: AI Dự đoán (CHÍNH) + Kết quả hôm qua */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Dự đoán - ĐẶT LÊN ĐẦU */}
              <AIAnalysis hasData={history.length > 0} />
              
              {/* Kết quả đã xổ (hôm qua hoặc hôm nay nếu đã xổ) */}
              <LotteryResult result={latestResult} isPastResultTime={pastResultTime} />
            </div>

            {/* Row 2: Number Stats */}
            <NumberStats
              hotNumbers={statistics?.hotNumbers}
              coldNumbers={statistics?.coldNumbers}
              overdueNumbers={statistics?.overdueNumbers}
            />

            {/* Row 3: Chart */}
            <FrequencyChart frequency={statistics?.frequency} />

            {/* Row 4: Pairs and Trends */}
            <PairsAndTrends
              pairs={statistics?.pairs}
              trend={statistics?.trend}
              headTail={statistics?.headTail}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryTable history={history} />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm mt-8 pb-4">
        <p>⚠️ Đây chỉ là phân tích thống kê, không đảm bảo kết quả.</p>
        <p className="mt-1">Chơi có trách nhiệm!</p>
      </footer>
    </div>
  );
}

export default App;
