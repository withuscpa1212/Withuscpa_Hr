
import { useState, useEffect } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

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

  useEffect(() => {
    if (profile) {
      fetchAttendanceRecords();
    }
  }, [profile]);

  const fetchAttendanceRecords = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', profile.id)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;

      setAttendanceRecords(data || []);
      
      // 오늘 출근 기록 찾기
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = data?.find(record => record.date === today);
      setTodayRecord(todayAttendance || null);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('출근 기록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClockAction = async () => {
    if (!profile) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      if (!todayRecord) {
        // 출근 처리
        const { error } = await supabase
          .from('attendance')
          .insert({
            user_id: profile.id,
            date: today,
            clock_in: now
          });

        if (error) throw error;
        toast.success('출근이 처리되었습니다!');
      } else if (todayRecord.clock_in && !todayRecord.clock_out) {
        // 퇴근 처리
        const { error } = await supabase
          .from('attendance')
          .update({ clock_out: now })
          .eq('id', todayRecord.id);

        if (error) throw error;
        toast.success('퇴근이 처리되었습니다!');
      } else {
        toast.info('오늘은 이미 출퇴근이 완료되었습니다.');
        return;
      }

      await fetchAttendanceRecords();
    } catch (error) {
      console.error('Error handling clock action:', error);
      toast.error('출퇴근 처리 중 오류가 발생했습니다.');
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
                    <div>
                      <p className="text-sm text-gray-500">퇴근 시간</p>
                      <p className="font-medium">
                        {todayRecord.clock_out ? formatTime(todayRecord.clock_out) : '-'}
                      </p>
                    </div>
                    {todayRecord.clock_in && todayRecord.clock_out && (
                      <div>
                        <p className="text-sm text-gray-500">근무 시간</p>
                        <p className="font-medium">
                          {calculateWorkingHours(todayRecord.clock_in, todayRecord.clock_out)}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-500">아직 출근하지 않았습니다.</p>
              )}
            </div>
            <Button onClick={handleClockAction} size="lg">
              {!todayRecord ? '출근' : 
               todayRecord.clock_in && !todayRecord.clock_out ? '퇴근' : '완료'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 출근 기록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>최근 출근 기록</span>
          </CardTitle>
          <CardDescription>
            최근 30일간의 출근 기록입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendanceRecords.length > 0 ? (
              attendanceRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{formatDate(record.date)}</p>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div>
                        <p className="text-sm text-gray-500">출근</p>
                        <p className="text-sm font-medium">
                          {record.clock_in ? formatTime(record.clock_in) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">퇴근</p>
                        <p className="text-sm font-medium">
                          {record.clock_out ? formatTime(record.clock_out) : '-'}
                        </p>
                      </div>
                      {record.clock_in && record.clock_out && (
                        <div>
                          <p className="text-sm text-gray-500">근무시간</p>
                          <p className="text-sm font-medium">
                            {calculateWorkingHours(record.clock_in, record.clock_out)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={record.clock_out ? "default" : "secondary"}>
                    {record.clock_out ? "완료" : "진행중"}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">출근 기록이 없습니다.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
