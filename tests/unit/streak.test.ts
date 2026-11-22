import { describe, it, expect } from 'vitest';
import { milestoneTier, nextMilestone, TH_NORMAL, TH_RETRY, pickTarget, retryUnlocked, bumpDaily, addCaptureTo } from '../../src/core/streak';
import { MONSTERS, MON_BY_ID, ANIMAL_SPEC } from '../../src/core/monsters';
import { KINGDOMS, questionsForKingdoms, chaptersOfKingdoms } from '../../src/core/kingdoms';
import { DEFAULT_GAME, type ProgressMap, type DirRecord } from '../../src/core/types';

describe('동물 몬스터 300종·6개 왕국', () => {
  it('일반 200·희귀 70·레전드 30, 왕국마다 레전드 5', () => {
    expect(MONSTERS).toHaveLength(300);
    expect(MONSTERS.filter((m) => m.tier === 'common')).toHaveLength(200);
    expect(MONSTERS.filter((m) => m.tier === 'rare')).toHaveLength(70);
    for (let k = 1; k <= 6; k++) expect(MONSTERS.filter((m) => m.kingdom === k && m.tier === 'legend')).toHaveLength(5);
    expect(new Set(MONSTERS.map((m) => m.name)).size).toBe(300);
    expect(MON_BY_ID['C001']).toMatchObject({ name: '스파이콘', nameEn: 'Spikon', animalKo: '고슴도치', element: 'rock' });
    expect(MON_BY_ID['L001']).toMatchObject({ name: '레오고로스', element: 'shadow', kingdom: 1 });
    MONSTERS.forEach((m) => expect(ANIMAL_SPEC[m.animal]).toBeTruthy());
  });
  it('왕국 6개 = 5과씩, 문제 수 50 + 10씩', () => {
    expect(KINGDOMS).toHaveLength(6);
    expect(KINGDOMS[5].chapters).toEqual([26, 27, 28, 29, 30]);
    expect([1, 2, 3, 6].map(questionsForKingdoms)).toEqual([50, 60, 70, 100]);
    expect(chaptersOfKingdoms([1, 3])).toEqual([1, 2, 3, 4, 5, 11, 12, 13, 14, 15]);
  });
});

describe('연속 정답 포획', () => {
  it('탐험: 10 일반, 15 희귀, 30 레전드, 이후 반복', () => {
    const t = (s: number) => milestoneTier(s, TH_NORMAL);
    expect([9, 10, 11, 15, 29, 30, 40, 45, 60].map(t)).toEqual([null, 'common', null, 'rare', null, 'legend', 'common', 'rare', 'legend']);
    expect(nextMilestone(0, TH_NORMAL)).toEqual({ tier: 'common', at: 10 });
    expect(nextMilestone(10, TH_NORMAL)).toEqual({ tier: 'rare', at: 15 });
    expect(nextMilestone(15, TH_NORMAL)).toEqual({ tier: 'legend', at: 30 });
  });
  it('재도전: 5 일반, 10 희귀, 15 레전드', () => {
    expect([5, 10, 15, 20].map((s) => milestoneTier(s, TH_RETRY))).toEqual(['common', 'rare', 'legend', 'common']);
  });
  it('포획 대상: 고른 왕국에서 못 잡은 것부터', () => {
    for (let i = 0; i < 20; i++) { const id = pickTarget('legend', [2], {}); expect(MON_BY_ID[id].kingdom).toBe(2); }
    const caught = Object.fromEntries(MONSTERS.filter((m) => m.kingdom === 2 && m.tier === 'legend').slice(0, 4).map((m) => [m.id, { at: '', count: 1 }]));
    const left = MONSTERS.filter((m) => m.kingdom === 2 && m.tier === 'legend')[4].id;
    for (let i = 0; i < 10; i++) expect(pickTarget('legend', [2], caught)).toBe(left);
  });
  it('재도전 스테이지는 오답 30개부터', () => {
    const p: ProgressMap = {};
    for (let i = 0; i < 29; i++) p[`ch01-${String((i % 20) + 1).padStart(2, '0')}|${i < 20 ? 'en' : 'ko'}`] = { pendingRetry: true } as DirRecord;
    expect(retryUnlocked(p)).toBe(false);
    p['ch02-01|en'] = { pendingRetry: true } as DirRecord;
    expect(retryUnlocked(p)).toBe(true);
  });
  it('오늘의 미션 기록은 날짜가 바뀌면 새로 시작, 포획 보너스는 처음에만', () => {
    let d = bumpDaily(undefined, '2026-11-22', { solved: 1, streak: 4 });
    d = bumpDaily(d, '2026-11-22', { solved: 1, streak: 2, overcame: 1 });
    expect(d).toMatchObject({ solved: 2, bestStreak: 4, overcame: 1 });
    expect(bumpDaily(d, '2026-11-23', { solved: 1 })).toMatchObject({ solved: 1, bestStreak: 0 });
    const a = addCaptureTo({ ...DEFAULT_GAME }, 'C001', 5); expect(a.first).toBe(true); expect(a.game.coins).toBe(5);
    const b = addCaptureTo(a.game, 'C001', 5); expect(b.first).toBe(false); expect(b.game.coins).toBe(5); expect(b.game.captured.C001.count).toBe(2);
  });
});
