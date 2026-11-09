import { describe, it, expect } from 'vitest';
import { planSession, insertRetry, type QueueEntry } from '../../src/core/scheduler';
import { applyAnswer } from '../../src/core/srs';
import { itemsInChapters } from '../../src/core/data';
import { pkey, type ProgressMap } from '../../src/core/types';

const T = '2026-11-09';
function seeded(seed = 1) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
const ch1 = itemsInChapters([1]);

describe('출제 계획', () => {
  it('새 기록이면 새 단어로 8문제, 같은 id 중복 없음', () => {
    const p = planSession({ items: ch1, dirs: ['en', 'ko'], n: 8, progress: {}, today: T, mode: 'explore', recentSessions: [], rng: seeded() });
    expect(p.length).toBe(8); expect(new Set(p.map((u) => u.id)).size).toBe(8);
    expect(new Set(p.map((u) => u.dir)).size).toBe(2);
  });
  it('이전 오답 → 기한 복습 → 새 단어 순, 새 단어 자리 확보', () => {
    const prog: ProgressMap = {};
    ch1.slice(0, 10).forEach((i) => (prog[pkey(i.id, 'en')] = applyAnswer(undefined, 'wrong', { today: '2026-11-08', now: 'x' }).rec));
    const p = planSession({ items: ch1, dirs: ['en'], n: 8, progress: prog, today: T, mode: 'explore', recentSessions: [], rng: seeded() });
    expect(p.filter((u) => u.bucket === 'pending').length).toBe(6);
    expect(p.filter((u) => u.bucket === 'new').length).toBe(2);
  });
  it('기한이 지난 복습이 일반 복습보다 먼저', () => {
    const prog: ProgressMap = {};
    ch1.forEach((i, k) => (prog[pkey(i.id, 'ko')] = { ...applyAnswer(undefined, 'strict', { today: '2026-11-01', now: 'x' }).rec, due: k < 3 ? '2026-11-05' : '2026-11-20' }));
    const p = planSession({ items: ch1, dirs: ['ko'], n: 5, progress: prog, today: T, mode: 'explore', recentSessions: [], rng: seeded() });
    expect(p.filter((u) => u.bucket === 'due').length).toBe(3);
    expect(p.filter((u) => u.bucket === 'review').length).toBe(2);
  });
  it('최근 많이 나온 항목은 뒤로', () => {
    const recent = [ch1.slice(0, 16).map((i) => pkey(i.id, 'en'))];
    const p = planSession({ items: ch1, dirs: ['en'], n: 4, progress: {}, today: T, mode: 'explore', recentSessions: recent, rng: seeded() });
    expect(p.every((u) => ch1.slice(16).some((i) => i.id === u.id))).toBe(true);
  });
  it('오답 추격: 오답이 적거나 없을 때', () => {
    expect(planSession({ items: ch1, dirs: ['en', 'ko'], n: 8, progress: {}, today: T, mode: 'wrong', recentSessions: [] }).length).toBe(0);
    const prog: ProgressMap = { [pkey(ch1[0].id, 'ko')]: applyAnswer(undefined, 'wrong', { today: T, now: 'x' }).rec };
    const p = planSession({ items: ch1, dirs: ['en', 'ko'], n: 8, progress: prog, today: T, mode: 'wrong', recentSessions: [] });
    expect(p).toHaveLength(1); expect(p[0].dir).toBe('ko');
  });
  it('후보가 문제 수보다 적어도 정상 작동', () => {
    const p = planSession({ items: ch1.slice(0, 3), dirs: ['en', 'ko'], n: 10, progress: {}, today: T, mode: 'explore', recentSessions: [], rng: seeded() });
    expect(p.length).toBe(6);
  });
});

describe('오답 지연 재출제', () => {
  const mk = (n: number): QueueEntry[] => Array.from({ length: n }, (_, k) => ({ id: 'ch01-' + String(k + 1).padStart(2, '0'), dir: 'en', kind: 'normal' }));
  it('2~4문제 뒤에 같은 방향으로, 판 길이는 고정', () => {
    for (let s = 1; s < 30; s++) {
      const r = insertRetry(mk(8), 0, { id: 'ch01-01', dir: 'en' }, new Set(), seeded(s));
      expect(r.inserted).toBe(true); expect(r.queue).toHaveLength(8);
      expect(r.position).toBeGreaterThanOrEqual(3); expect(r.position).toBeLessThanOrEqual(5);
      expect(r.queue[r.position]).toMatchObject({ id: 'ch01-01', dir: 'en', kind: 'retry' });
    }
  });
  it('남은 문제가 부족하면 다음 판으로 넘김, 같은 판 재도전은 한 번만', () => {
    expect(insertRetry(mk(8), 5, { id: 'x', dir: 'en' }, new Set()).inserted).toBe(false);
    const done = new Set<string>();
    const a = insertRetry(mk(10), 0, { id: 'ch01-01', dir: 'en' }, done);
    expect(a.inserted).toBe(true);
    expect(insertRetry(a.queue, a.position, { id: 'ch01-01', dir: 'en' }, done).inserted).toBe(false);
  });
});
