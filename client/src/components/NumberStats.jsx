import { Flame, Snowflake, Clock } from 'lucide-react';

export default function NumberStats({ hotNumbers, coldNumbers, overdueNumbers }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Số nóng */}
      <div className="card">
        <div className="card-header flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600">
          <Flame className="w-5 h-5" />
          <span>Số Nóng</span>
        </div>
        <div className="card-body">
          <p className="text-xs text-gray-400 mb-3">Xuất hiện nhiều gần đây</p>
          <div className="flex flex-wrap gap-2">
            {hotNumbers?.slice(0, 10).map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="number-ball hot mx-auto">
                  {item.number}
                </div>
                <span className="text-xs text-gray-400 mt-1 block">
                  {item.count} lần
                </span>
              </div>
            ))}
          </div>
          {(!hotNumbers || hotNumbers.length === 0) && (
            <p className="text-gray-500 text-sm text-center py-4">Chưa có dữ liệu</p>
          )}
        </div>
      </div>

      {/* Số lạnh */}
      <div className="card">
        <div className="card-header flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700">
          <Snowflake className="w-5 h-5" />
          <span>Số Lạnh</span>
        </div>
        <div className="card-body">
          <p className="text-xs text-gray-400 mb-3">Lâu chưa xuất hiện</p>
          <div className="flex flex-wrap gap-2">
            {coldNumbers?.slice(0, 10).map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="number-ball cold mx-auto">
                  {item.number}
                </div>
                <span className="text-xs text-gray-400 mt-1 block">
                  {item.daysSinceLastAppeared}d
                </span>
              </div>
            ))}
          </div>
          {(!coldNumbers || coldNumbers.length === 0) && (
            <p className="text-gray-500 text-sm text-center py-4">Chưa có dữ liệu</p>
          )}
        </div>
      </div>

      {/* Số gan */}
      <div className="card">
        <div className="card-header flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700">
          <Clock className="w-5 h-5" />
          <span>Số Gan</span>
        </div>
        <div className="card-body">
          <p className="text-xs text-gray-400 mb-3">Chưa về nhiều ngày liên tiếp</p>
          <div className="flex flex-wrap gap-2">
            {overdueNumbers?.slice(0, 10).map((item, idx) => (
              <div key={idx} className="text-center">
                <div 
                  className="number-ball mx-auto"
                  style={{ 
                    background: `linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)` 
                  }}
                >
                  {item.number}
                </div>
                <span className="text-xs text-gray-400 mt-1 block">
                  {item.daysSinceLastAppeared} ngày
                </span>
              </div>
            ))}
          </div>
          {(!overdueNumbers || overdueNumbers.length === 0) && (
            <p className="text-gray-500 text-sm text-center py-4">Chưa có dữ liệu</p>
          )}
        </div>
      </div>
    </div>
  );
}
