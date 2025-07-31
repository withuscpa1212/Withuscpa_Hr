// 출퇴근/직원 관련 타입 통합

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string | null;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
}
