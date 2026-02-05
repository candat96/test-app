import { Trophy, Star, Hash, Calendar, Clock } from 'lucide-react';

const prizeLabels = {
  special: { label: 'ĐB', className: 'text-xl font-bold text-yellow-400' },
  first: { label: 'G1', className: 'text-lg font-bold text-red-400' },
  second: { label: 'G2', className: 'text-base font-semibold text-orange-400' },
  third: { label: 'G3', className: 'text-sm text-gray-200' },
  fourth: { label: 'G4', className: 'text-sm text-gray-300' },
  fifth: { label: 'G5', className: 'text-sm text-gray-300' },
  sixth: { label: 'G6', className: 'text-sm text-gray-300' },
  seventh: { label: 'G7', className: 'text-sm text-gray-300' }
};

export default function LotteryResult({ result }) {
  if (!result) {
    return (
      <div className="card">
        <div className="card-header flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700">
          <Trophy className="w-5 h-5" />
          <span>Kết Quả XSMB</span>
        </div>
        <div className="card-body text-center text-gray-400 py-8">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Chưa có dữ liệu</p>
          <p className="text-sm mt-1">Nhấn "Cập nhật" để lấy kết quả</p>
        </div>
      </div>
    );
  }

  const { prizes, dateDisplay, date, twoDigits } = result;

  // Đếm số lần xuất hiện của mỗi lô trong ngày
  const lotoCount = {};
  twoDigits?.forEach(num => {
    lotoCount[num] = (lotoCount[num] || 0) + 1;
  });

  // Tìm lô về nhiều lần (kép)
  const doubleLoto = Object.entries(lotoCount).filter(([num, count]) => count >= 2);

  // Xác định ngày hiển thị
  const displayDate = dateDisplay || date;

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          <span>Kết Quả Đã Xổ</span>
        </div>
        <div className="flex items-center gap-1 text-sm opacity-90">
          <Calendar className="w-4 h-4" />
          <span>{displayDate}</span>
        </div>
      </div>
      <div className="card-body">
        {/* Thông báo */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 mb-4 text-sm">
          <div className="flex items-center gap-2 text-blue-400">
            <Clock className="w-4 h-4" />
            <span>Kết quả XSMB ngày <strong>{displayDate}</strong></span>
          </div>
          <p className="text-blue-300/70 text-xs mt-1">
            Kết quả mới sẽ có lúc 18:35 hàng ngày
          </p>
        </div>

        {/* LÔ TÔ ĐÃ XỔ */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-bold text-gray-300">
                {twoDigits?.length || 0} LÔ ĐÃ VỀ
              </h3>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {twoDigits?.map((num, idx) => {
              const isDouble = lotoCount[num] >= 2;
              return (
                <span
                  key={idx}
                  className={`number-ball text-sm w-9 h-9 ${isDouble ? 'hot ring-2 ring-yellow-400' : ''}`}
                  title={isDouble ? `Lô ${num} về ${lotoCount[num]} lần!` : `Lô ${num}`}
                >
                  {num}
                </span>
              );
            })}
          </div>
          
          {/* Lô kép */}
          {doubleLoto.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700/50">
              <span className="text-yellow-400 text-sm font-semibold">🔥 Lô kép: </span>
              {doubleLoto.map(([num, count], idx) => (
                <span key={idx} className="text-yellow-300 font-bold ml-2">
                  {num} (x{count})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bảng kết quả đầy đủ - Thu gọn */}
        <details className="group mt-4">
          <summary className="cursor-pointer text-gray-400 text-sm hover:text-gray-300 flex items-center gap-2">
            <span>📋 Xem chi tiết các giải</span>
            <span className="group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <table className="w-full mt-3 text-sm">
            <tbody>
              {Object.entries(prizeLabels).map(([key, { label, className }]) => (
                <tr key={key} className="border-b border-gray-700/50 last:border-0">
                  <td className="py-2 px-2 text-gray-500 w-10">{label}</td>
                  <td className="py-2 px-2">
                    <div className="flex flex-wrap gap-2">
                      {prizes[key]?.map((num, idx) => (
                        <span key={idx} className={`${className} font-mono`}>
                          {key === 'special' && (
                            <Star className="inline w-3 h-3 mr-1 text-yellow-400" />
                          )}
                          {num}
                          <span className="text-yellow-400 font-bold ml-0.5">
                            ({num.slice(-2)})
                          </span>
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </div>
  );
}
