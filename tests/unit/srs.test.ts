import { describe, it, expect } from 'vitest';
import { applyAnswer, isDue, isMastered } from '../../src/core/srs';
import { addDays, localDate } from '../../src/core/dates';
import type { DirRecord, ProgressMap } from '../../src/core/types';

const D0 = '2026-11-09';
const at = (today: string) => ({ today, now: today + 'T10:00:00' });

describe('숙련 단계', () => {
  it('도움 없는 엄격 정답만 단계가 오르고, 같은 날 여러 번 오르지 않음', () => {
    let r = applyAnswer(undefined, 'strict', at(D0)).rec;
    expect(r.stage).toBe(2); expect(r.due).toBe('2026-11-10');
    r = applyAnswer(r, 'strict', at(D0)).rec; expect(r.stage).toBe(2);
    r = applyAnswer(r, 'strict', at('2026-11-10')).rec; expect(r.stage).toBe(3); expect(r.due).toBe('2026-11-13');
    r = applyAnswer(r, 'strict', at('2026-11-10')).rec; expect(r.stage).toBe(3);
  });
  it('예정일 전 정답은 단계 유지, 예정일 이후 정답은 진행', () => {
    let r: DirRecord = { ...applyAnswer(undefined, 'strict', at(D0)).rec, stage: 3, due: '2026-11-13', lastStageUpDate: '2026-11-10' };
    expect(isDue(r, '2026-11-12')).toBe(false);
    r = applyAnswer(r, 'strict', at('2026-11-12')).rec; expect(r.stage).toBe(3);
    expect(isDue(r, '2026-11-15')).toBe(true);
    r = applyAnswer(r, 'strict', at('2026-11-15')).rec; expect(r.stage).toBe(4); expect(r.due).toBe('2026-11-22');
    r = applyAnswer(r, 'strict', at('2026-11-22')).rec; expect(r.stage).toBe(5); expect(r.due).toBe('2026-12-22');
  });
  it('완화 정답·힌트·정답 보기·따라 쓰기는 숙련도를 올리지 않음', () => {
    expect(applyAnswer(undefined, 'relaxed', at(D0)).rec.stage).toBe(1);
    expect(applyAnswer(undefined, 'aided', { ...at(D0), hintUsed: true }).rec.stage).toBe(1);
    const viewed = applyAnswer(undefined, 'aided', { ...at(D0), answerViewed: true }).rec;
    expect(viewed.stage).toBe(1); expect(viewed.pendingRetry).toBe(true); expect(viewed.helpCount).toBe(1);
    const p = applyAnswer(viewed, 'practice', at(D0)).rec; expect(p.practiced).toBe(1); expect(p.attempts).toBe(1); expect(p.unaidedCorrect).toBe(0);
  });
  it('오답이면 단계를 낮추고 내일부터 복습, 기록은 유지. 같은 날 다시 맞혀도 다음 날 복습은 유지', () => {
    let r: DirRecord = { ...applyAnswer(undefined, 'strict', at(D0)).rec, stage: 4, due: D0 };
    r = applyAnswer(r, 'wrong', at(D0)).rec;
    expect(r.stage).toBe(1); expect(r.pendingRetry).toBe(true); expect(r.due).toBe('2026-11-10'); expect(r.unaidedCorrect).toBe(1);
    const o = applyAnswer(r, 'strict', at(D0));
    expect(o.overcame).toBe(true); expect(o.rec.pendingRetry).toBe(false); expect(o.rec.stage).toBe(1); expect(o.rec.due).toBe('2026-11-10');
    expect(applyAnswer(o.rec, 'strict', at('2026-11-10')).rec.stage).toBe(2);
  });
  it('양방향 모두 숙련이어야 숙련', () => {
    const m = { stage: 5 } as DirRecord;
    const p: ProgressMap = { 'ch01-01|en': m };
    expect(isMastered(p, 'ch01-01')).toBe(false);
    p['ch01-01|ko'] = m; expect(isMastered(p, 'ch01-01')).toBe(true);
  });
  it('현지 날짜 계산(월·연도 넘김)', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-02-27', 3)).toBe('2026-03-02');
    expect(localDate(new Date(2026, 10, 9, 23, 59))).toBe('2026-11-09');
  });
});
