
import { useState, useEffect } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import Lottie from "lottie-react";
import businessIdeasAnimation from '@/_assets/business-ideas.json';

interface AttendanceRecord {
  id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  user_id: string;
}

const Attendance = () => {
  const { profile } = useUserProfile();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchAttendanceRecords();
    }
  }, [profile]);

  const fetchAttendanceRecords = async () => {
    if (!profile) return;

    try {
      console.log('Fetching attendance records for user:', profile.id);
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', profile.id)
        .order('date', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched attendance data:', data);
      setAttendanceRecords(data || []);

      // 오늘 출근 기록 찾기
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = data?.find(record => record.date === today);
      setTodayRecord(todayAttendance || null);
      console.log('Today attendance record:', todayAttendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('출근 기록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClockAction = async () => {
    if (!profile) return;

    setActionLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const nowIso = now.toISOString();

      // --- 퇴근 미처리 자동 처리 로직 ---
      // 1. 관리자는 예외
      if (profile.role !== 'admin') {
        // 2. 오늘 출근 기록이 없고, 현재 시간이 9시 미만(즉, 0~8시) 또는 8~8:59에 출근하는 경우
        if (!todayRecord && (now.getHours() < 9)) {
          // 3. 어제 출근 기록 중 퇴근이 없는 기록 찾기
          const yesterdayDate = new Date(now);
          yesterdayDate.setDate(now.getDate() - 1);
          const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
          const yesterdayRecord = attendanceRecords.find(r => r.date === yesterdayStr);
          if (yesterdayRecord && yesterdayRecord.clock_in && !yesterdayRecord.clock_out) {
            // 4. 어제 퇴근을 18:00으로 자동 처리
            const sixPM = new Date(yesterdayRecord.clock_in);
            sixPM.setHours(18, 0, 0, 0);
            const sixPMStr = sixPM.toISOString();
            await supabase
              .from('attendance')
              .update({ clock_out: sixPMStr })
              .eq('id', yesterdayRecord.id);
            toast.info('전날 퇴근이 누락되어 18:00로 자동 처리되었습니다.');
          }
        }
      }

      // --- 기존 출근/퇴근 처리 로직 ---
      if (!todayRecord) {
        // 출근 처리
        console.log('Inserting new attendance record');
        const { error } = await supabase
          .from('attendance')
          .insert({
            user_id: profile.id,
            date: today,
            clock_in: (() => {
              const nowDate = new Date();
              const hour = nowDate.getHours();
              const minute = nowDate.getMinutes();
              if (hour === 8 || (hour === 9 && minute === 0)) {
                // 8:00~8:59 또는 9:00:00~9:00:59
                const nine = new Date(nowDate);
                nine.setHours(9, 0, 0, 0);
                return nine.toISOString();
              }
              return nowIso; // string only
            })()
          })
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        toast.success('출근 처리되었습니다!');
      } else if (todayRecord.clock_in && !todayRecord.clock_out) {
        // 퇴근 처리
        console.log('Updating attendance record for clock out');
        const { data, error } = await supabase
          .from('attendance')
          .update({ clock_out: nowIso })
          .eq('id', todayRecord.id)
          .select()
          .single();

        if (error) {
          console.error('Update error:', error);
          throw error;
        }

        console.log('Updated attendance record:', data);
        toast.success('퇴근이 처리되었습니다!');
      } else {
        toast.info('오늘은 이미 출퇴근이 완료되었습니다.');
        return;
      }

      await fetchAttendanceRecords();
    } catch (error) {
      console.error('Error handling clock action:', error);
      toast.error('출퇴근 처리 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatDateKorean = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${['일','월','화','수','목','금','토'][date.getDay()]})`;
  };

  const formatTimeShort = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const calculateWorkingHours = (clockIn: string, clockOut: string) => {
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}시간 ${diffMinutes}분`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">출근 관리</h1>
        <p className="text-gray-600">출퇴근 기록을 관리하고 확인할 수 있습니다.</p>
      </div>

      {/* 오늘 출근 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>오늘 출근 현황</span>
          </CardTitle>
          <CardDescription>
            {formatDate(new Date().toISOString().split('T')[0])}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              {todayRecord ? (
                <>
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">출근 시간</p>
                      <p className="font-medium">
                        {todayRecord.clock_in ? formatTime(todayRecord.clock_in) : '-'}
                      </p>
                    </div>
                    {/*<div>*/}
                    {/*  <p className="text-sm text-gray-500">퇴근 시간</p>*/}
                    {/*  <p className="font-medium">*/}
                    {/*    {todayRecord.clock_out ? formatTime(todayRecord.clock_out) : '-'}*/}
                    {/*  </p>*/}
                    {/*</div>*/}
                    {/*{todayRecord.clock_in && todayRecord.clock_out && (*/}
                    {/*  <div>*/}
                    {/*    <p className="text-sm text-gray-500">근무 시간</p>*/}
                    {/*    <p className="font-medium">*/}
                    {/*      {calculateWorkingHours(todayRecord.clock_in, todayRecord.clock_out)}*/}
                    {/*    </p>*/}
                    {/*  </div>*/}
                    {/*)}*/}
                  </div>
                </>
              ) : (
                <p className="text-gray-500">아직 출근하지 않았습니다.</p>
              )}
            </div>
            <Button
              onClick={handleClockAction}
              size="lg"
              disabled={actionLoading || (!!todayRecord?.clock_in && !!todayRecord?.clock_out)}
            >
              {actionLoading ? '처리 중...' :
               !todayRecord ? '출근' :
               todayRecord.clock_in && !todayRecord.clock_out ? '퇴근' : '완료'}
            </Button>
          </div>
        </CardContent>
      </Card>

       {/*출근 기록*/}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 justify-center">
            {/*<Calendar className="h-5 w-5" />*/}
            {/*<span>최근 출근 기록</span>*/}
            <span>오늘도 화이팅</span>
          </CardTitle>
          {/*<CardDescription>*/}
          {/*  최근 30일간의 출근 기록입니다.*/}
          {/*</CardDescription>*/}
        </CardHeader>
        <CardContent>
          <div className={'flex w-full justify-center'}>
            <Lottie animationData={businessIdeasAnimation} loop={true} className={'w-80'} />
          </div>
  {/*<div className="flex flex-col gap-2 mb-3 md:flex-row md:items-center md:justify-between">*/}
  {/*  <div className="flex gap-3 items-center text-xs text-gray-500">*/}
  {/*    <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-mint-400"></span>완료</span>*/}
  {/*    <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-blue-300"></span>진행중</span>*/}
  {/*  </div>*/}
  {/*  <div className="text-xs text-gray-400 text-right hidden md:block">* 최근 30일 기록만 표시됩니다.</div>*/}
  {/*</div>*/}
  {/*<div className="overflow-x-auto">*/}
  {/*  {attendanceRecords.length > 0 ? (*/}
  {/*    <table className="min-w-full border-spacing-y-2 border-separate">*/}
  {/*      <thead>*/}
  {/*        <tr className="bg-gradient-to-r from-mint-50 to-blue-50 text-mint-700">*/}
  {/*          <th className="rounded-l-lg px-4 py-2 font-semibold text-left">날짜</th>*/}
  {/*          <th className="px-4 py-2 font-semibold text-left">출근</th>*/}
  {/*          <th className="px-4 py-2 font-semibold text-left">퇴근</th>*/}
  {/*          <th className="px-4 py-2 font-semibold text-left">근무시간</th>*/}
  {/*          <th className="rounded-r-lg px-4 py-2 font-semibold text-left">상태</th>*/}
  {/*        </tr>*/}
  {/*      </thead>*/}
  {/*      <tbody>*/}
  {/*        {attendanceRecords.map((record, idx) => {*/}
  {/*          // Highlight today*/}
  {/*          const todayStr = new Date().toISOString().split('T')[0];*/}
  {/*          const isToday = record.date === todayStr;*/}
  {/*          return (*/}
  {/*            <tr*/}
  {/*              key={record.id}*/}
  {/*              className={`transition-all duration-300 shadow-sm hover:shadow-lg rounded-xl ${*/}
  {/*                isToday ? 'bg-mint-100/70' : idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'*/}
  {/*              } animate-fadeIn`}*/}
  {/*            >*/}
  {/*              <td className="rounded-l-lg px-4 py-3 font-semibold text-gray-900 whitespace-nowrap text-base">*/}
  {/*                {formatDateKorean(record.date)}*/}
  {/*                {isToday && <span className="ml-2 px-2 py-0.5 rounded bg-mint-500 text-white text-xs align-middle">오늘</span>}*/}
  {/*              </td>*/}
  {/*              <td className="px-4 py-3 text-gray-800 whitespace-nowrap text-base">*/}
  {/*                {record.clock_in ? formatTimeShort(record.clock_in) : <span className="text-gray-300">-</span>}*/}
  {/*              </td>*/}
  {/*              <td className="px-4 py-3 text-gray-800 whitespace-nowrap text-base">*/}
  {/*                {record.clock_out ? formatTimeShort(record.clock_out) : <span className="text-gray-300">-</span>}*/}
  {/*              </td>*/}
  {/*              <td className="px-4 py-3 text-gray-800 whitespace-nowrap text-base">*/}
  {/*                {record.clock_in && record.clock_out ? (*/}
  {/*                  <span>{calculateWorkingHours(record.clock_in, record.clock_out)}</span>*/}
  {/*                ) : (*/}
  {/*                  <span className="text-gray-300">-</span>*/}
  {/*                )}*/}
  {/*              </td>*/}
  {/*              <td className="rounded-r-lg px-4 py-3">*/}
  {/*                <span*/}
  {/*                  className={*/}
  {/*                    record.clock_out*/}
  {/*                      ? 'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-mint-400 text-white font-semibold text-xs shadow-sm'*/}
  {/*                      : 'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-300 text-white font-semibold text-xs shadow-sm'*/}
  {/*                  }*/}
  {/*                >*/}
  {/*                  {record.clock_out ? (*/}
  {/*                    <Clock className="w-3 h-3 mr-0.5 inline-block" />*/}
  {/*                  ) : (*/}
  {/*                    <TrendingUp className="w-3 h-3 mr-0.5 inline-block" />*/}
  {/*                  )}*/}
  {/*                  {record.clock_out ? '완료' : '진행중'}*/}
  {/*                </span>*/}
  {/*              </td>*/}
  {/*            </tr>*/}
  {/*          );*/}
  {/*        })}*/}
  {/*      </tbody>*/}
  {/*    </table>*/}
  {/*  ) : (*/}
  {/*    <p className="text-center text-gray-500 py-8">출근 기록이 없습니다.</p>*/}
  {/*  )}*/}
  {/*</div>*/}
  {/*<style>{`*/}
  {/*  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: none; } }*/}
  {/*  .animate-fadeIn { animation: fadeIn 0.5s; }*/}
  {/*`}</style>*/}
</CardContent>

      </Card>
    </div>
  );
};

export default Attendance;
