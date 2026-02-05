import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

export default function FrequencyChart({ frequency }) {
  if (!frequency) {
    return (
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          <span>Biểu Đồ Tần Suất</span>
        </div>
        <div className="card-body text-center text-gray-400 py-8">
          Chưa có dữ liệu
        </div>
      </div>
    );
  }

  // Chuyển đổi dữ liệu cho chart
  const chartData = Object.values(frequency)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map(item => ({
      number: item.number,
      count: item.count,
      percentage: parseFloat(item.percentage)
    }));

  const maxCount = Math.max(...chartData.map(d => d.count));

  const getBarColor = (count) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return '#f59e0b'; // Vàng - nóng
    if (ratio > 0.5) return '#ef4444'; // Đỏ
    if (ratio > 0.3) return '#8b5cf6'; // Tím
    return '#3b82f6'; // Xanh - lạnh
  };

  return (
    <div className="card">
      <div className="card-header flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        <span>Top 20 Số Xuất Hiện Nhiều Nhất</span>
      </div>
      <div className="card-body">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="horizontal">
              <XAxis 
                dataKey="number" 
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                axisLine={{ stroke: '#374151' }}
              />
              <YAxis 
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                axisLine={{ stroke: '#374151' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value, name) => [value, 'Số lần']}
                labelFormatter={(label) => `Số ${label}`}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.count)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span className="text-gray-400">Rất nóng</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-gray-400">Nóng</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span className="text-gray-400">Trung bình</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-gray-400">Lạnh</span>
          </div>
        </div>
      </div>
    </div>
  );
}
