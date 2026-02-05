import { Calendar } from 'lucide-react';

export default function HistoryTable({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          <span>Lịch Sử Kết Quả</span>
        </div>
        <div className="card-body text-center text-gray-400 py-8">
          Chưa có lịch sử kết quả
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        <span>Lịch Sử Kết Quả ({history.length} ngày)</span>
      </div>
      <div className="card-body p-0">
        <div className="max-h-96 overflow-y-auto">
          <table className="lottery-table">
            <thead className="sticky top-0">
              <tr>
                <th className="w-28">Ngày</th>
                <th>Lô tô (2 số cuối)</th>
              </tr>
            </thead>
            <tbody>
              {history.map((result, idx) => (
                <tr key={idx} className="hover:bg-gray-700/50 transition-colors">
                  <td className="font-medium text-yellow-400">
                    {result.dateDisplay || result.date}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {result.twoDigits?.map((num, numIdx) => (
                        <span
                          key={numIdx}
                          className="inline-block bg-gray-700 text-gray-200 px-2 py-0.5 rounded text-xs font-mono"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
