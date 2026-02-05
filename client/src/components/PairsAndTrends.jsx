import { Link2, TrendingUp, TrendingDown } from 'lucide-react';

export default function PairsAndTrends({ pairs, trend, headTail }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Cặp số hay đi cùng */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          <span>Cặp Số Hay Đi Cùng</span>
        </div>
        <div className="card-body">
          <div className="space-y-2">
            {pairs?.slice(0, 10).map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between bg-gray-700/50 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm w-5">{idx + 1}.</span>
                  <span className="font-mono font-bold text-yellow-400">
                    {item.pair}
                  </span>
                </div>
                <span className="text-sm text-gray-400">{item.count} lần</span>
              </div>
            ))}
            {(!pairs || pairs.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">Chưa có dữ liệu</p>
            )}
          </div>
        </div>
      </div>

      {/* Xu hướng tăng/giảm */}
      <div className="card">
        <div className="card-header flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600">
          <TrendingUp className="w-5 h-5" />
          <span>Xu Hướng Tăng</span>
        </div>
        <div className="card-body">
          <p className="text-xs text-gray-400 mb-3">Số đang xuất hiện nhiều hơn gần đây</p>
          <div className="flex flex-wrap gap-2">
            {trend?.increasing?.slice(0, 10).map((item, idx) => (
              <div key={idx} className="text-center">
                <div 
                  className="number-ball mx-auto"
                  style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
                >
                  {item.number}
                </div>
                <span className="text-xs text-green-400 mt-1 block flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  +{item.trendValue}
                </span>
              </div>
            ))}
          </div>
          {(!trend?.increasing || trend.increasing.length === 0) && (
            <p className="text-gray-500 text-sm text-center py-4">Chưa có dữ liệu</p>
          )}
        </div>
      </div>

      {/* Phân tích đầu đuôi */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <span>📊</span>
          <span>Đầu Đuôi Nóng</span>
        </div>
        <div className="card-body">
          {/* Đầu nóng */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2">Đầu xuất hiện nhiều:</p>
            <div className="flex gap-2">
              {headTail?.heads?.slice(0, 5).map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center font-bold text-white text-sm">
                    {item.digit}
                  </div>
                  <span className="text-xs text-gray-400">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Đuôi nóng */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Đuôi xuất hiện nhiều:</p>
            <div className="flex gap-2">
              {headTail?.tails?.slice(0, 5).map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm">
                    {item.digit}
                  </div>
                  <span className="text-xs text-gray-400">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {(!headTail?.heads || headTail.heads.length === 0) && (
            <p className="text-gray-500 text-sm text-center py-4">Chưa có dữ liệu</p>
          )}
        </div>
      </div>
    </div>
  );
}
