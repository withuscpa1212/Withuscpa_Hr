import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EmployeeLeaveInfo {
  bonus_days: number; // 관리자 가산 연차
  user_id: string;
  name: string | null;
  hire_date: string | null;
  total_months: number;
  earned_days: number;
  used_days: number;
  remaining_days: number;
  total_earned_days: number; // 총연차(입사월+earned_days+bonus_days)
}

export function useAllEmployeesLeaveInfo() {
  const [leaveInfo, setLeaveInfo] = useState<EmployeeLeaveInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaveInfo();
    // eslint-disable-next-line
  }, []);

  const fetchLeaveInfo = async () => {
    setLoading(true);
    setError(null);
    // Fetch leave info from remaining_leaves view
    const { data, error } = await supabase
      .from('remaining_leaves')
      .select('*');
    if (error) {
      setError(error.message);
      setLeaveInfo([]);
    } else {
      // Map to EmployeeLeaveInfo type
      setLeaveInfo(
        (data || []).map((row: any) => ({
          user_id: row.user_id,
          name: row.name,
          hire_date: row.hire_date,
          total_months: row.total_months ?? 0,
          bonus_days: row.bonus_days ?? 0,
          earned_days: row.earned_days ?? 0,
          used_days: row.used_days ?? 0,
          remaining_days: row.remaining_days ?? 0,
          total_earned_days:
            (row.total_months ?? 0) + (row.earned_days ?? 0) + (row.bonus_days ?? 0),
        }))
      );
    }
    setLoading(false);
  };

  return { leaveInfo, loading, error, refetch: fetchLeaveInfo };
}
