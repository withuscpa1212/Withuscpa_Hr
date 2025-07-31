
import { useEffect, useState } from 'react';
import LeaveCalendar from '@/components/LeaveCalendar';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, Bell, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
  totalEmployees: number;
  todayAttendance: number;
  pendingLeaves: number;
  unreadNotifications: number;
}

const Dashboard = () => {
  const { profile } = useUserProfile();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    todayAttendance: 0,
    pendingLeaves: 0,
    unreadNotifications: 0
  });
  const [loading, setLoading] = useState(true);
  const [clockingIn, setCLockingIn] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, [profile]);

  const fetchDashboardStats = async () => {
    if (!profile) return;

    try {
      // Fetch stats based on user role
      const promises = [];

      // Unread notifications for current user (exclude global notifications)
      promises.push(
        supabase
          .from('notifications')
          .select('id')
          .eq('user_id', profile.id)
          .eq('read', false)
      );

      if (profile.role === 'admin') {
        // Admin can see all stats
        promises.push(
          supabase.from('users').select('id'),
          supabase
            .from('attendance')
            .select('id')
            .eq('date', new Date().toISOString().split('T')[0]),
          supabase
            .from('leave_requests')
            .select('id')
            .eq('status', 'pending')
        );
      } else {
        // Regular users see limited stats
        promises.push(
          Promise.resolve({ data: [], error: null }),
          Promise.resolve({ data: [], error: null }),
          supabase
            .from('leave_requests')
            .select('id')
            .eq('user_id', profile.id)
            .eq('status', 'pending')
        );
      }

      const [notificationsResult, usersResult, attendanceResult, leavesResult] = await Promise.all(promises);

      setStats({
        unreadNotifications: notificationsResult.data?.length || 0,
        totalEmployees: usersResult.data?.length || 0,
        todayAttendance: attendanceResult.data?.length || 0,
        pendingLeaves: leavesResult.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    if (!profile) return;
    
    setCLockingIn(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      // Check if already clocked in today
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', today)
        .single();

      if (existingAttendance) {
        if (!existingAttendance.clock_out) {
          // Clock out
          const { error } = await supabase
            .from('attendance')
            .update({ clock_out: now })
            .eq('id', existingAttendance.id);

          if (error) throw error;
          toast.success('퇴근 처리되었습니다!');
        } else {
          toast.info('오늘은 이미 출퇴근 처리가 완료되었습니다.');
        }
      } else {
        // Clock in
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
  return now;
})()
          });

        if (error) throw error;
        toast.success('출근 처리되었습니다!');
      }

      fetchDashboardStats();
    } catch (error) {
      console.error('Error handling clock in/out:', error);
      toast.error('출퇴근 처리 중 오류가 발생했습니다.');
    } finally {
      setCLockingIn(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      timeZone: 'Asia/Seoul'
    });
  };

  const currentTime = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-2xl shadow-lg p-6 flex flex-col gap-4 mb-6 border border-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-mint-100 flex items-center justify-center shadow">
              <Users className="w-8 h-8 text-mint-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{profile?.name || '이름 미설정'}</p>
              <p className="text-sm text-foreground/70">{profile?.email}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="mb-2">
              {profile?.role === 'admin' ? '관리자' : 
               profile?.role === 'manager' ? '매니저' : '직원'}
            </Badge>
            <p className="text-sm text-foreground/70">
              {profile?.department || '부서 미설정'} • {profile?.position || '직급 미설정'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              안녕하세요, {profile?.name || '사용자'}님! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              {formatDate(currentTime)} • {formatTime(currentTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl shadow p-4 flex gap-4 mb-8 border border-card">
        <Button 
          onClick={handleClockIn}
          disabled={clockingIn}
          className="flex items-center space-x-2"
        >
          <Clock className="h-4 w-4" />
          <span>{clockingIn ? '처리 중...' : '출퇴근'}</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {profile?.role === 'admin' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">전체 직원</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                <p className="text-xs text-muted-foreground">명</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">오늘 출근</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayAttendance}</div>
                <p className="text-xs text-muted-foreground">명</p>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {profile?.role === 'admin' ? '대기 중인 연차' : '내 연차 신청'}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingLeaves}</div>
            <p className="text-xs text-muted-foreground">건</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">읽지 않은 알림</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadNotifications}</div>
            <p className="text-xs text-muted-foreground">개</p>
          </CardContent>
        </Card>
      </div>

      {/* 휴가자 달력 */}
      <LeaveCalendar />
    </div>
  );
};

export default Dashboard;
