import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDatesArray, calcWorkMinutes } from '@/utils/date';
import type { Employee, AttendanceRecord } from '@/types/attendance';


const AdminWorkHours = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [days, setDays] = useState(14); // 0=전체기간, 7/14/30=최근 N일, -1=직접지정
  const [dates, setDates] = useState<string[]>(getDatesArray(14));
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [detailEmp, setDetailEmp] = useState<Employee|null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [days, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, email, department');
    let att: AttendanceRecord[] = [];
    let attError;
    let dateArr: string[] = [];
    if (days === 0) {
      // 전체기간: 모든 출퇴근 기록 조회
      const { data, error } = await supabase
        .from('attendance')
        .select('id, user_id, date, clock_in, clock_out');
      att = data || [];
      attError = error;
      // 날짜 목록 자동 생성 (min~max)
      if (att.length > 0) {
        const dateList = att.map(r => r.date).sort();
        const minDate = dateList[0];
        const maxDate = dateList[dateList.length - 1];
        const arr: string[] = [];
        let d = new Date(minDate);
        const end = new Date(maxDate);
        while (d <= end) {
          arr.push(d.toISOString().slice(0, 10));
          d.setDate(d.getDate() + 1);
        }
        dateArr = arr;
      }
    } else if (days === -1 && startDate && endDate) {
      // 직접 지정
      const { data, error } = await supabase
        .from('attendance')
        .select('id, user_id, date, clock_in, clock_out')
        .gte('date', startDate)
        .lte('date', endDate);
      att = data || [];
      attError = error;
      // 날짜 목록 생성
      const arr: string[] = [];
      let d = new Date(startDate);
      const end = new Date(endDate);
      while (d <= end) {
        arr.push(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
      }
      dateArr = arr;
    } else {
      // 최근 N일
      dateArr = getDatesArray(days);
      const { data, error } = await supabase
        .from('attendance')
        .select('id, user_id, date, clock_in, clock_out')
        .gte('date', dateArr[0])
        .lte('date', dateArr[dateArr.length - 1]);
      att = data || [];
      attError = error;
    }
    setDates(dateArr);
    if (!userError && users) setEmployees(users);
    if (!attError && att) setAttendance(att.map(r => {
      const outDate = new Date(r.clock_out);

      if (outDate.getHours() >= 18 && outDate.getMinutes() >= 0) {
        return {
          ...r,
          clock_out: new Date(outDate.setHours(18, 0, 0)).toISOString() // 퇴근시간이 18시 이후면 18시로 조정
        }
      }

      return r;
    }));
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
      ['이름', '부서', '총 근무일수', '총 근무시간(시:분)', ...dates],
      ...filteredEmployees.map(emp => {
        let totalMinutes = 0;
        const daily = dates.map(date => {
          const rec = attendanceMap[emp.id]?.[date];
          const min = calcWorkMinutes(rec?.clock_in || null, rec?.clock_out || null);
          totalMinutes += min;
          return min > 0 ? `${Math.floor(min/60)}:${(min%60).toString().padStart(2,'0')}` : '';
        });
        const workDays = daily.filter(str => str).length;
        return [
          emp.name,
          emp.department ?? '',
          workDays,
          `${Math.floor(totalMinutes/60)}:${(totalMinutes%60).toString().padStart(2,'0')}`,
          ...daily
        ];
      })
    ];
    const sheet = xlsx.utils.aoa_to_sheet(sheetData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, sheet, '근무시간');
    xlsx.writeFile(wb, 'workhours_matrix.xlsx');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>직원별 근무시간 현황 (최근 {days}일)</CardTitle>
        <div className="flex gap-2 mt-2 flex-wrap">
          <Button onClick={handleExportExcel}>엑셀로 내보내기</Button>
          <select value={days} onChange={e => setDays(Number(e.target.value))} className="border rounded px-2 py-1 mr-2">
            <option value={7}>최근 7일</option>
            <option value={14}>최근 14일</option>
            <option value={30}>최근 30일</option>
            <option value={0}>전체기간</option>
            <option value={-1}>직접지정</option>
          </select>
          {days === -1 && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="border rounded px-2 py-1 mr-1"
                max={endDate || undefined}
              />
              <span className="mx-1">~</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="border rounded px-2 py-1"
                min={startDate || undefined}
              />
            </>
          )}
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
                  <th className="px-2 py-2 text-center bg-gray-50 border-b whitespace-nowrap">총 근무일수</th>
                  <th className="px-2 py-2 text-center bg-gray-50 border-b whitespace-nowrap">총 근무시간</th>
                  {dates.map(date => (
                    <th key={date} className="px-2 py-2 text-center bg-gray-50 border-b whitespace-nowrap">
                      {date.slice(5)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => {
                  let totalMinutes = 0;
                  const daily = dates.map(date => {
                    const rec = attendanceMap[emp.id]?.[date];
                    const min = calcWorkMinutes(rec?.clock_in || null, rec?.clock_out || null);
                    totalMinutes += min;
                    return min > 0 ? `${Math.floor(min/60)}:${(min%60).toString().padStart(2,'0')}` : '';
                  });
                  const workDays = daily.filter(str => str).length;
                  return (
                    <tr key={emp.id} className="border-b last:border-b-0">
                      <td className="px-2 py-2 whitespace-nowrap text-left align-middle font-medium text-gray-900">{emp.name}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-left align-middle text-gray-700">{emp.department}</td>
                      <td className="px-2 py-2 text-center align-middle font-bold text-blue-700">{workDays}</td>
                      <td className="px-2 py-2 text-center align-middle font-bold text-green-700">{`${Math.floor(totalMinutes/60)}:${(totalMinutes%60).toString().padStart(2,'0')}`}</td>
                      {daily.map((t, i) => (
                        <td key={dates[i]} className={`px-2 py-2 text-center align-middle whitespace-nowrap ${t ? 'text-gray-900' : 'text-gray-300'}`}>{t}</td>
                      ))}
                      <td className="px-2 py-2 text-center align-middle">
                        <button
                          className="px-2 py-1 text-xs bg-mint-100 text-mint-700 rounded hover:bg-mint-200 border border-mint-200"
                          onClick={() => { setDetailEmp(emp); setDetailOpen(true); }}
                        >상세</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* 상세 모달 */}
        {detailOpen && detailEmp && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative animate-fadeIn">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-mint-700 text-xl font-bold"
                onClick={() => setDetailOpen(false)}
                aria-label="닫기"
              >×</button>
              <h2 className="text-lg font-bold mb-2">{detailEmp.name} <span className="text-sm text-gray-500">({detailEmp.department})</span></h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 bg-gray-50 border-b">날짜</th>
                      <th className="px-2 py-1 bg-gray-50 border-b">출근</th>
                      <th className="px-2 py-1 bg-gray-50 border-b">퇴근</th>
                      <th className="px-2 py-1 bg-gray-50 border-b">근무시간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dates.map(date => {
                      const rec = attendanceMap[detailEmp.id]?.[date];
                      let clockIn = rec?.clock_in ? new Date(rec.clock_in).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-';
                      let clockOut = rec?.clock_out ? new Date(rec.clock_out).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-';
                      let min = calcWorkMinutes(rec?.clock_in || null, rec?.clock_out || null);
                      let work = min > 0 ? `${Math.floor(min/60)}:${(min%60).toString().padStart(2,'0')}` : '';

                      return (
                        <tr key={date}>
                          <td className="px-2 py-1 text-center">{date}</td>
                          <td className="px-2 py-1 text-center">{clockIn}</td>
                          <td className="px-2 py-1 text-center">{clockOut}</td>
                          <td className="px-2 py-1 text-center">{work}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminWorkHours;
