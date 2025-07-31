// 날짜 관련 유틸 함수 모음

/**
 * 최근 N일 날짜 배열 반환 (YYYY-MM-DD)
 */
export function getDatesArray(days: number): string[] {
  const arr: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    arr.push(d.toISOString().slice(0, 10));
  }
  return arr;
}

/**
 * 근무시간(분) 계산
 */
export function calcWorkMinutes(clock_in: string | null, clock_out: string | null): number {
  if (!clock_in || !clock_out) return 0;
  const inDate = new Date(clock_in);
  const outDate = new Date(clock_out);
  return Math.max(0, Math.round((outDate.getTime() - inDate.getTime()) / 60000));
}
