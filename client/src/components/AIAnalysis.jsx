import { useState, useEffect } from 'react';
import { Brain, Loader2, AlertCircle, Sparkles, Target, RefreshCw, CheckCircle } from 'lucide-react';
import { useAIAnalysis } from '../hooks/useLottery';

// Danh sách models VPS AI
const AI_MODELS = [
  { id: 'claude-opus', name: '🧠 Claude Opus 4.5', desc: 'Mạnh nhất' },
  { id: 'claude-sonnet', name: '⚡ Claude Sonnet 4.5', desc: 'Nhanh' },
  { id: 'gemini', name: '✨ Gemini 3 Pro', desc: 'Google' },
  { id: 'gpt-codex-max', name: '🤖 GPT 5.1 Max', desc: 'GPT mạnh' },
  { id: 'gpt-codex', name: '🚀 GPT 5.2', desc: 'GPT nhanh' },
  { id: 'glm', name: '🔮 GLM 4.7', desc: 'GLM' },
  { id: 'minimax', name: '💫 MiniMax', desc: 'MiniMax' }
];

export default function AIAnalysis({ hasData }) {
  const { analysis, providers, loading, error, analyze } = useAIAnalysis();
  const [selectedModel, setSelectedModel] = useState('claude-opus');

  const handleAnalyze = async () => {
    try {
      await analyze(30, selectedModel);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  const formatAnalysis = (text) => {
    if (!text) return null;
    
    let formatted = text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');
    
    return formatted;
  };

  // Trích xuất 3 số dự đoán từ phân tích
  const extractPredictions = (text) => {
    if (!text) return [];
    const matches = text.match(/Lô\s*\[?(\d{2})\]?/gi);
    if (!matches) return [];
    
    const numbers = matches.map(m => m.match(/\d{2}/)[0]);
    // Lấy 3 số đầu tiên (unique)
    const unique = [...new Set(numbers)];
    return unique.slice(0, 3);
  };

  const predictions = analysis ? extractPredictions(analysis.analysis) : [];
  
  // Kiểm tra model đã có dự đoán chưa
  const currentModelInfo = providers.find(p => p.id === selectedModel);
  const hasPrediction = currentModelInfo?.hasPredictionToday;

  return (
    <div className="card">
      <div className="card-header flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600">
        <Brain className="w-5 h-5" />
        <span>AI Dự Đoán Hôm Nay</span>
        <Sparkles className="w-4 h-4 ml-auto animate-pulse" />
      </div>
      <div className="card-body">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-gray-400 mb-1">Chọn AI Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-500 focus:outline-none"
            >
              {AI_MODELS.map(model => {
                const info = providers.find(p => p.id === model.id);
                return (
                  <option key={model.id} value={model.id}>
                    {model.name} {info?.hasPredictionToday ? '✓' : ''}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAnalyze}
              disabled={loading || !hasData}
              className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang phân tích...
                </>
              ) : hasPrediction ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Xem dự đoán
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  Dự đoán
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cache info */}
        {analysis?.fromCache && (
          <div className="text-xs text-green-400 mb-3 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Dự đoán đã lưu - Mỗi model chỉ dự đoán 1 lần/ngày
          </div>
        )}

        {/* 3 số dự đoán nổi bật */}
        {predictions.length > 0 && (
          <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl p-4 mb-4 border border-green-600/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-bold">3 CẶP SỐ DỰ ĐOÁN</span>
              </div>
              <span className="text-xs text-green-300">
                {analysis?.predictionDateDisplay}
              </span>
            </div>
            <div className="flex gap-4 justify-center">
              {predictions.map((num, idx) => (
                <div key={idx} className="text-center">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-lg ${
                    idx === 0 
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 ring-2 ring-yellow-300 animate-pulse' 
                      : idx === 1
                      ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900'
                      : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                  }`}>
                    {num}
                  </div>
                  <span className="text-xs text-gray-400 mt-1 block">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-semibold">Lỗi</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* No data warning */}
        {!hasData && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-semibold">Chưa có dữ liệu</p>
              <p className="text-yellow-300 text-sm mt-1">
                Nhấn "Cập nhật" để lấy dữ liệu.
              </p>
            </div>
          </div>
        )}

        {/* Analysis Result */}
        {analysis && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
              <span>🤖 <strong className="text-yellow-400">{analysis.model}</strong></span>
              <span className="text-gray-600">|</span>
              <span>{new Date(analysis.timestamp).toLocaleString('vi-VN')}</span>
            </div>
            <div 
              className="analysis-content bg-gray-900/50 rounded-lg p-4 max-h-[300px] overflow-y-auto text-sm"
              dangerouslySetInnerHTML={{ __html: formatAnalysis(analysis.analysis) }}
            />
          </div>
        )}

        {/* Empty state */}
        {!analysis && !loading && !error && hasData && (
          <div className="text-center py-6 text-gray-400">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Chọn model và nhấn "Dự đoán"</p>
            <p className="text-sm text-gray-500 mt-1">
              Mỗi model chỉ dự đoán 1 lần/ngày • 3 cặp số
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
