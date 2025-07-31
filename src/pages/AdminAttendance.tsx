import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDatesArray } from '@/utils/date';
import type { Employee, AttendanceRecord } from '@/types/attendance';


const AdminAttendance = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [days, setDays] = useState(14); // 최근 14일 기본

  const dates = getDatesArray(days);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [days]);

  const fetchData = async () => {
    setLoading(true);
    // 직원 목록
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, email, department');
    // 출퇴근 기록 (기간 내 전체)
    const { data: att, error: attError } = await supabase
      .from('attendance')
      .select('id, user_id, date, clock_in, clock_out')
      .gte('date', dates[0])
      .lte('date', dates[dates.length - 1]);
    if (!userError && users) setEmployees(users);
    if (!attError && att) setAttendance(att);
    setLoading(false);
  };

  // 직원ID-날짜별 attendance 매핑
  const attendanceMap: Record<string, Record<string, AttendanceRecord>> = {};
  attendance.forEach(rec => {
    if (!attendanceMap[rec.user_id]) attendanceMap[rec.user_id] = {};
    attendanceMap[rec.user_id][rec.date] = rec;
  });

  // 검색 필터
  const filteredEmployees = employees.filter(emp => {
    const q = search.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q)
    );
  });

  // 엑셀 내보내기
  const handleExportExcel = async () => {
    const xlsx = await import('xlsx');
    const sheetData = [
      ['이름', '부서', ...dates],
      ...filteredEmployees.map(emp => [
        emp.name,
        emp.department ?? '',
        ...dates.map(date => {
          const rec = attendanceMap[emp.id]?.[date];
          if (!rec) return 'X';
          if (rec.clock_in && rec.clock_out) return 'O';
          if (rec.clock_in && !rec.clock_out) return '퇴근미처리';
          return 'X';
        })
      ])
    ];
    const sheet = xlsx.utils.aoa_to_sheet(sheetData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, sheet, '직원별근태');
    xlsx.writeFile(wb, 'attendance_matrix.xlsx');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>직원별 날짜별 근태현황 (최근 {days}일)</CardTitle>
        <div className="flex gap-2 mt-2 flex-wrap">
          <Button onClick={handleExportExcel}>엑셀로 내보내기</Button>
          <select value={days} onChange={e => setDays(Number(e.target.value))} className="border rounded px-2 py-1">
            <option value={7}>최근 7일</option>
            <option value={14}>최근 14일</option>
            <option value={30}>최근 30일</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <input
          type="text"
          placeholder="직원 검색 (이름, 이메일, 부서)"
          className="mb-4 w-full border rounded px-3 py-2"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {loading ? (
          <div>로딩 중...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left bg-gray-50 border-b whitespace-nowrap">이름</th>
                  <th className="px-2 py-2 text-left bg-gray-50 border-b whitespace-nowrap">부서</th>
                  {dates.map(date => (
                    <th key={date} className="px-2 py-2 text-center bg-gray-50 border-b whitespace-nowrap">
                      {date.slice(5)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="border-b last:border-b-0">
                    <td className="px-2 py-2 whitespace-nowrap text-left align-middle font-medium text-gray-900">{emp.name}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-left align-middle text-gray-700">{emp.department}</td>
                    {dates.map(date => {
                      const rec = attendanceMap[emp.id]?.[date];
                      let cell = '-';
                      let color = 'text-gray-400';
                      if (!rec) {
                        cell = 'X';
                        color = 'text-red-500 font-bold';
                      } else if (rec.clock_in && rec.clock_out) {
                        cell = 'O';
                        color = 'text-green-600 font-bold';
                      } else if (rec.clock_in && !rec.clock_out) {
                        cell = '퇴근X';
                        color = 'text-orange-500 font-bold';
                      }
                      return (
                        <td key={date} className={`px-2 py-2 text-center align-middle whitespace-nowrap ${color}`}>
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAttendance;
