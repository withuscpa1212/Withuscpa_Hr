import { useEffect, useState } from 'react';
import { useAllEmployeesLeaveInfo } from '@/hooks/useEmployeeLeaveInfo';
import { useUserProfile } from '@/hooks/useUserProfile';
import LeaveCell from '@/components/LeaveCell';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EditableNumberCell from '@/components/EditableNumberCell';

interface User {
  id: string;
  email: string;
  name: string | null;
  department: string | null;
  position: string | null;
  role: string;
  hire_date: string | null;
  address: string | null;
  bank: string | null;
  account_number: string | null;
  avatar_url: string | null;
}
// deleted 필드는 실제 DB에는 있지만, User 타입에는 없으므로 타입 확장해서 사용
// employees.filter(emp => (emp as any).deleted) 등으로 타입 단언 사용

const AdminEmployees = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { leaveInfo, loading: leaveLoading, refetch } = useAllEmployeesLeaveInfo();
  const { profile } = useUserProfile();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('users').select('*').or('deleted.is.null,deleted.eq.false');
    if (!error && data) setEmployees(data);
    setLoading(false);
  };

  // 검색 필터 적용 + 이름순 정렬
  const filteredEmployees = employees
    .filter(emp => {
      // deleted가 true인 직원은 무조건 숨김 (deleted는 any로 단언)
      if ((emp as any).deleted) return false;
      const q = search.toLowerCase();
      return (
        emp.name?.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q) ||
        emp.department?.toLowerCase().includes(q) ||
        emp.position?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });

  // 역할 변경 핸들러
  const handleRoleChange = async (id: string, newRole: string) => {
    await supabase.from('users').update({ role: newRole }).eq('id', id);
    fetchEmployees();
  };

  // 직원 삭제(soft-delete) 핸들러
  const handleDelete = async (id: string) => {
    if (!window.confirm('정말로 이 직원을 삭제하시겠습니까?')) return;
    const { error } = await supabase
  .from('users')
  // 타입 단언으로 deleted 필드 허용
  .update({ deleted: true } as any)
  .eq('id', id);
    if (!error) {
      toast({ title: '직원이 삭제되었습니다.' });
      fetchEmployees();
    } else {
      toast({ title: '삭제 실패', description: error.message, variant: 'destructive' });
    }
  };

  // 엑셀로 내보내기 핸들러
  const handleExportExcel = async () => {
    const xlsx = await import('xlsx');
    const sheet = xlsx.utils.json_to_sheet(
      filteredEmployees.map(emp => ({
        이름: emp.name,
        이메일: emp.email,
        부서: emp.department,
        직급: emp.position,
        역할: emp.role,
        입사일: emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('ko-KR') : '',
        주소: emp.address,
        은행: emp.bank,
        계좌번호: emp.account_number,
        프로필사진: emp.avatar_url || '',
      }))
    );
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, sheet, '직원목록');
    xlsx.writeFile(wb, 'employees.xlsx');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>직원 목록 관리</CardTitle>
        <Button onClick={handleExportExcel} className="mt-2">엑셀로 내보내기</Button>
      </CardHeader>
      <CardContent>
        <input
          type="text"
          placeholder="직원 검색 (이름, 이메일, 부서, 직급)"
          className="mb-4 w-full border rounded px-3 py-2"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {loading || leaveLoading ? (
          <div>로딩 중...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="w-36 px-4 py-3 text-left bg-gray-50 border-b font-semibold text-gray-800 whitespace-nowrap">이름</th>
                  <th className="w-24 px-4 py-3 text-center bg-gray-50 border-b font-semibold text-gray-800 whitespace-nowrap">총연차</th>
                  <th className="w-24 px-4 py-3 text-center bg-gray-50 border-b font-semibold text-gray-800 whitespace-nowrap">가산 연차</th>
                  <th className="w-24 px-4 py-3 text-center bg-gray-50 border-b font-semibold text-gray-800 whitespace-nowrap">사용연차</th>
                  <th className="w-24 px-4 py-3 text-center bg-gray-50 border-b font-semibold text-gray-800 whitespace-nowrap">남은연차</th>
                  <th className="w-32 px-4 py-3 text-left bg-gray-50 border-b font-semibold text-gray-800 whitespace-nowrap">입사일</th>
                  <th className="w-52 px-4 py-3 text-left bg-gray-50 border-b font-semibold text-gray-800 whitespace-nowrap">이메일</th>
                  <th className="w-36 px-4 py-3 text-left bg-gray-50 border-b font-semibold text-gray-800 whitespace-nowrap">부서</th>
                  <th className="w-36 px-4 py-3 text-left bg-gray-50 border-b font-semibold text-gray-800 whitespace-nowrap">직급</th>
                  <th className="w-28 px-4 py-3 text-center bg-gray-50 border-b font-semibold text-gray-800 whitespace-nowrap">역할</th>
                  <th className="w-44 px-4 py-3 text-left bg-gray-50 border-b font-semibold text-gray-800 whitespace-nowrap">주소</th>
                  <th className="w-28 px-4 py-3 text-left bg-gray-50 border-b font-semibold text-gray-800 whitespace-nowrap">은행</th>
                  <th className="w-36 px-4 py-3 text-left bg-gray-50 border-b font-semibold text-gray-800 whitespace-nowrap">계좌번호</th>

                  <th className="w-24 px-4 py-3 text-center bg-gray-50 border-b font-semibold text-gray-800 whitespace-nowrap">프로필사진</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, i) => {
                  const leave = leaveInfo.find(l => l.user_id === emp.id);
                  return (
                    <tr
                      key={emp.id}
                      className={`border-b last:border-b-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-mint-50 transition-colors`}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-left align-middle font-medium text-gray-900">{emp.name}</td>
                      {/* 총연차 */}
                      <td className="px-4 py-2 whitespace-nowrap text-center align-middle">{leave ? (
                            profile?.role === 'admin' ? (
                              <EditableNumberCell
                                value={(leave as any).total_earned_days}
                                min={(leave as any).used_days}
                                onSave={async (newEarned) => {
                                  // earned_days만 직접 수정 (total_earned_days는 계산값)
                                  const base = (leave as any).total_months ?? 0;
                                  const bonus = (leave as any).bonus_days ?? 0;
                                  // 입력값에서 입사월, 가산연차를 뺀 값만 earned_days로 update
                                  const updateVal = newEarned - base - bonus;
                                  const { error } = await (supabase as any)
                                    .from('leave_days')
                                    .update({ earned_days: updateVal })
                                    .eq('user_id', emp.id);
                                  if (!error) {
                                    toast({ title: '총연차가 수정되었습니다.', variant: 'default' });
                                    refetch();
                                  } else {
                                    toast({ title: '수정 실패', description: error.message, variant: 'destructive' });
                                  }
                                }}
                              />
                            ) : (
                              (leave as any).total_earned_days
                            )
                          ) : (
                            <span className="text-xs text-gray-400">정보 없음</span>
                          )}
                        </td>
                      {/* 가산 연차 */}
                      <td className="px-4 py-2 whitespace-nowrap text-center align-middle">{leave ? (
                            profile?.role === 'admin' ? (
                              <EditableNumberCell
                                value={(leave as any).bonus_days}
                                min={0}
                                onSave={async (newBonus) => {
                                  const { error } = await (supabase as any)
                                    .from('leave_days')
                                    .update({ bonus_days: newBonus })
                                    .eq('user_id', emp.id);
                                  if (!error) {
                                    toast({ title: '가산 연차가 수정되었습니다.', variant: 'default' });
                                    refetch();
                                  } else {
                                    toast({ title: '수정 실패', description: error.message, variant: 'destructive' });
                                  }
                                }}
                                onReset={async () => {
                                  const { error } = await (supabase as any)
                                    .from('leave_days')
                                    .update({ bonus_days: 0 })
                                    .eq('user_id', emp.id);
                                  if (!error) {
                                    toast({ title: '가산 연차가 0으로 초기화되었습니다.', variant: 'default' });
                                    refetch();
                                  } else {
                                    toast({ title: '초기화 실패', description: error.message, variant: 'destructive' });
                                  }
                                }}
                              />
                            ) : (
                              (leave as any).bonus_days
                            )
                          ) : (
                            <span className="text-xs text-gray-400">정보 없음</span>
                          )}
                        </td>
                      {/* 사용연차 */}
                      <td className="px-4 py-2 whitespace-nowrap text-center align-middle">{leave ? (
                            (leave as any).used_days
                          ) : (
                            <span className="text-xs text-gray-400">정보 없음</span>
                          )}
                        </td>
                      {/* 남은연차 */}
                      <td className="px-4 py-2 whitespace-nowrap text-center align-middle">{leave ? (
                            (leave as any).remaining_days
                          ) : (
                            <span className="text-xs text-gray-400">정보 없음</span>
                          )}
                        </td>
                      <td className="px-4 py-2 whitespace-nowrap text-left align-middle text-gray-700">{emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('ko-KR') : ''}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-left align-middle text-gray-700">{emp.email}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-left align-middle text-gray-700">{emp.department}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-left align-middle text-gray-700">{emp.position}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-center align-middle">
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(emp.id)}>
                          삭제
                        </Button>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center align-middle">
                        <select
                          value={emp.role}
                          onChange={e => handleRoleChange(emp.id, e.target.value)}
                          className="border rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-mint-400"
                          style={{ minWidth: 80 }}
                        >
                          <option value="employee">직원</option>
                          <option value="manager">매니저</option>
                          <option value="admin">관리자</option>
                        </select>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-left align-middle text-gray-700">{emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('ko-KR') : ''}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-left align-middle text-gray-700">{emp.address}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-left align-middle text-gray-700">{emp.bank}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-left align-middle text-gray-700">{emp.account_number}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-center align-middle">
                        {emp.avatar_url ? (
                          <img src={emp.avatar_url} alt="프로필" className="w-8 h-8 rounded-full mx-auto" />
                        ) : (
                          <span className="text-xs text-gray-400">없음</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminEmployees;
