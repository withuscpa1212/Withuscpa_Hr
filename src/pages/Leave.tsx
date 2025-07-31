
import { useState, useEffect } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'denied';
  requested_at: string;
  user_id: string;
}

const Leave = () => {
  const { profile } = useUserProfile();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    if (profile) {
      fetchLeaveRequests();
    }
  }, [profile]);

  const fetchLeaveRequests = async () => {
    if (!profile) return;

    try {
      console.log('Fetching leave requests for user:', profile.id);
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched leave requests:', data);
      // Type assertion to ensure status is properly typed
      const typedRequests: LeaveRequest[] = (data || []).map(request => ({
        ...request,
        status: request.status as 'pending' | 'approved' | 'denied'
      }));
      
      setLeaveRequests(typedRequests);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast.error('연차 신청 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!formData.start_date || !formData.end_date) {
      toast.error('시작일과 종료일을 모두 입력해주세요.');
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error('시작일이 종료일보다 늦을 수 없습니다.');
      return;
    }

    setSubmitLoading(true);
    try {
      console.log('Submitting leave request:', {
        user_id: profile.id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason || null,
        status: 'pending'
      });

      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          user_id: profile.id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('Inserted leave request:', data);
      toast.success('연차 신청이 완료되었습니다!');
      setShowForm(false);
      setFormData({ start_date: '', end_date: '', reason: '' });
      await fetchLeaveRequests();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast.error('연차 신청 중 오류가 발생했습니다.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">승인됨</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800">반려됨</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">대기중</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">연차 관리</h1>
          <p className="text-gray-600">연차를 신청하고 관리할 수 있습니다.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>연차 신청</span>
        </Button>
      </div>

      {/* 연차 신청 폼 */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>새 연차 신청</CardTitle>
            <CardDescription>
              연차 사용 기간과 사유를 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="reason-select">사유 *</Label>
                <select
                  id="reason-select"
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={formData.reason.startsWith('직접입력:') ? '직접입력' : formData.reason}
                  onChange={e => {
                    if (e.target.value === '직접입력') {
                      setFormData({ ...formData, reason: '직접입력:' });
                    } else {
                      setFormData({ ...formData, reason: e.target.value });
                    }
                  }}
                  required
                >
                  <option value="">사유 선택</option>
                  <option value="연차">연차</option>
                  <option value="병가">병가</option>
                  <option value="경조사">경조사</option>
                  <option value="직접입력">직접 입력</option>
                </select>
                {formData.reason.startsWith('직접입력') && (
                  <Input
                    className="mt-2"
                    placeholder="사유를 직접 입력하세요"
                    value={formData.reason.replace('직접입력:', '')}
                    onChange={e => setFormData({ ...formData, reason: '직접입력:' + e.target.value })}
                  />
                )}
              </div>
              {/* 날짜 입력란 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="start_date">시작일 *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">종료일 *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              {/* 버튼 영역 */}
              <div className="flex space-x-2 mt-4">
                <Button type="submit" disabled={submitLoading}>
                  {submitLoading ? '신청 중...' : '신청하기'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 연차 신청 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>연차 신청 내역</span>
          </CardTitle>
          <CardDescription>
            나의 연차 신청 내역을 확인할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaveRequests.length > 0 ? (
              leaveRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">
                          {formatDate(request.start_date)} ~ {formatDate(request.end_date)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {calculateDays(request.start_date, request.end_date)}일
                        </p>
                      </div>
                    </div>
                    {request.reason && (
                      <p className="text-sm text-gray-600">사유: {request.reason}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      신청일: {new Date(request.requested_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">연차 신청 내역이 없습니다.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leave;
