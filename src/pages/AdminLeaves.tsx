import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LeaveRequest {
  id: string;
  user_id: string;
  status: string;
  start_date: string;
  end_date: string;
  reason: string;
  users?: {
    name?: string;
  };
}

const AdminLeaves = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    // users 테이블과 join하여 name 포함해서 가져오기
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, users!user_id(name)')
      .order('start_date', { ascending: false });
    if (!error && data) setLeaves(data);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase
      .from('leave_requests')
      .update({ status: 'approved' })
      .eq('id', id);
    setProcessingId(null);
    if (!error) fetchLeaves();
    else alert('승인 처리 중 오류가 발생했습니다.');
  };
  const handleReject = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase
      .from('leave_requests')
      .update({ status: 'denied' })
      .eq('id', id);
    setProcessingId(null);
    if (!error) fetchLeaves();
    else alert('반려 처리 중 오류가 발생했습니다.');
  };

  // 검색 필터 적용
  const [search, setSearch] = useState('');
  // 이름 기준 오름차순 정렬 추가
  const filteredLeaves = leaves
    .filter(lv => {
      const q = search.toLowerCase();
      return (
        (lv.users?.name?.toLowerCase().includes(q) || lv.user_id?.toLowerCase().includes(q)) ||
        lv.reason?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const nameA = (a.users?.name || '').toLowerCase();
      const nameB = (b.users?.name || '').toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });

  // 엑셀로 내보내기 핸들러
  const handleExportExcel = async () => {
    const xlsx = await import('xlsx');
    const sheet = xlsx.utils.json_to_sheet(
      filteredLeaves.map(lv => ({
        신청자: lv.users?.name || lv.user_id,
        시작일: lv.start_date,
        종료일: lv.end_date,
        사유: lv.reason,
        상태: lv.status === 'approved' ? '승인' : lv.status === 'rejected' ? '반려' : '대기',
      }))
    );
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, sheet, '연차신청');
    xlsx.writeFile(wb, 'leaves.xlsx');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>연차 신청 승인/반려</CardTitle>
        <Button onClick={handleExportExcel} className="mt-2">엑셀로 내보내기</Button>
      </CardHeader>
      <CardContent>
        <input
          type="text"
          placeholder="검색 (신청자, 사유)"
          className="mb-4 w-full border rounded px-3 py-2"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {loading ? (
          <div>로딩 중...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm table-fixed border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="w-32 px-2 py-2 text-left bg-gray-50 border-b whitespace-nowrap">신청자</th>
                  <th className="w-32 px-2 py-2 text-center bg-gray-50 border-b whitespace-nowrap">시작일</th>
                  <th className="w-32 px-2 py-2 text-center bg-gray-50 border-b whitespace-nowrap">종료일</th>
                  <th className="min-w-[160px] px-2 py-2 text-left bg-gray-50 border-b whitespace-nowrap">사유</th>
                  <th className="w-24 px-2 py-2 text-center bg-gray-50 border-b whitespace-nowrap">상태</th>
                  <th className="w-32 px-2 py-2 text-center bg-gray-50 border-b whitespace-nowrap">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map(lv => (
                  <tr key={lv.id} className="border-b last:border-b-0">
                    <td className="px-2 py-2 whitespace-nowrap text-left align-middle">{lv.users?.name || lv.user_id}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-center align-middle">{lv.start_date}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-center align-middle">{lv.end_date}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-left align-middle break-all">{lv.reason}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-center align-middle">
                      {lv.status === 'approved' && <span className="text-green-600 font-bold">승인</span>}
                      {(lv.status === 'rejected' || lv.status === 'denied') && <span className="text-red-600 font-bold">반려</span>}
                      {lv.status === 'pending' && <span className="text-yellow-600 font-bold">대기</span>}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center align-middle">
                      {lv.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => handleApprove(lv.id)} className="mr-2" disabled={processingId === lv.id}>승인</Button>
                          <Button size="sm" variant="outline" onClick={() => handleReject(lv.id)} disabled={processingId === lv.id}>반려</Button>
                        </>
                      )}
                    </td>
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

export default AdminLeaves;
