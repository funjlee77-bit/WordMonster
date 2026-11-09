// 복습 날짜 규칙: 기기의 "현지 날짜"(자정 기준)로 하루를 나눕니다.
// 날짜는 'YYYY-MM-DD' 문자열로 저장하고, 간격은 달력 날짜 차이로 계산합니다(시각은 보지 않음).
// 예) 11월 9일 밤 11시에 맞혀 "1일 뒤 복습"이 되면, 11월 10일 0시부터 복습 대상입니다.
export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return localDate(new Date(y, m - 1, d + n));
}
