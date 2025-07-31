import React, { useEffect, useState } from 'react';
import { Calendar } from './ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface LeaveUser {
  user_id: string;
  name: string;
  avatar_url?: string | null;
}

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  user: LeaveUser;
}

interface CalendarLeaveMap {
  [date: string]: LeaveUser[];
}

const LeaveCalendar: React.FC = () => {
  const [leaveMap, setLeaveMap] = useState<CalendarLeaveMap>({});
  const [month, setMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeavesForMonth(month);
    // eslint-disable-next-line
  }, [month]);

  const fetchLeavesForMonth = async (date: Date) => {
    setLoading(true);
    const year = date.getFullYear();
    const monthIdx = date.getMonth();
    const firstDay = new Date(year, monthIdx, 1);
    const lastDay = new Date(year, monthIdx + 1, 0);
    const from = firstDay.toISOString().split('T')[0];
    const to = lastDay.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('leave_requests')
      .select('id, start_date, end_date, users:user_id(name, avatar_url)')
      .eq('status', 'approved')
      .or(`start_date.lte.${to},end_date.gte.${from}`);

    if (error) {
      setLoading(false);
      return;
    }

    // Map each date to users on leave
    const map: CalendarLeaveMap = {};
    (data || []).forEach((lv: any) => {
      const start = new Date(lv.start_date);
      const end = new Date(lv.end_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        if (!map[key]) map[key] = [];
        map[key].push({
          user_id: lv.users.user_id || lv.user_id,
          name: lv.users.name,
          avatar_url: lv.users.avatar_url || null,
        });
      }
    });
    setLeaveMap(map);
    setLoading(false);
  };

  // Custom day render
  const renderDay = (date: Date) => {
    const key = date.toISOString().split('T')[0];
    const users = leaveMap[key] || [];
    const maxShow = 3; // 최대 표시 인원
    const showUsers = users.slice(0, maxShow);
    const extraCount = users.length - maxShow;
    return (
      <div
        className={`relative flex flex-col items-center justify-start w-full h-full rounded-xl border border-mint-200 bg-white shadow group min-h-[90px] min-w-[90px] py-2 px-1 transition-all duration-150 overflow-hidden`}
        title={users.length > 0 ? users.map(u => u.name).join(', ') : ''}
      >
        <span className={`font-bold text-lg mb-1 ${users.length > 0 ? 'text-mint-700' : ''}`}>{date.getDate()}</span>
        {users.length > 0 && (
          <div className="flex flex-col gap-1 items-center w-full max-h-28 overflow-y-auto scrollbar-thin scrollbar-thumb-mint-200 scrollbar-track-transparent">
            {users.map((user, idx) => (
              <div key={user.user_id + idx} className="w-full flex items-center justify-center">
                <span className="text-xs text-mint-700 font-semibold truncate max-w-[80px] py-0.5">{user.name.length > 8 ? user.name.slice(0, 8) + '…' : user.name}</span>
              </div>
            ))}
            {users.length > 6 && (
              <div className="w-full text-center text-xs text-pink-400 font-bold mt-1">+{users.length - 6} 더보기</div>
            )}
          </div>
        )}
        {/* Tooltip: 그룹 호버 시 전체 명단 */}
        {users.length > 0 && (
          <div className="absolute z-20 left-1/2 -translate-x-1/2 bottom-0 translate-y-full opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-white border border-mint-200 rounded shadow-lg px-3 py-2 text-xs text-gray-700 min-w-[120px] whitespace-pre-line">
            {users.map(u => u.name).join(', ')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">이번 달 휴가자 달력</h2>
      <div className="w-full max-w-5xl mx-auto px-4">
        <Calendar
          month={month}
          onMonthChange={setMonth}
          components={{ DayContent: ({ date }: { date: Date }) => renderDay(date) }}
          className="bg-white rounded-2xl shadow-xl p-6 w-full min-h-[540px]"
        />
      </div>
      {loading && <div className="mt-2 text-sm text-gray-500">불러오는 중...</div>}
    </div>
  );
};

export default LeaveCalendar;
