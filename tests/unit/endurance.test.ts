import { describe, it, expect } from 'vitest';
import { newRun, answer, blockResult, nextIndex, scoreOf, advance, nextLegend, wrongOf, curQs, BLOCK } from '../../src/core/endurance';
import { COLOSSEUM_LEGENDS, FRUIT_BY_ID } from '../../src/core/fruits';
import type { EAns } from '../../src/core/endurance';

function seeded(seed = 3) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
const ok: EAns = { r: 'strict', a: 'x' }, bad: EAns = { r: 'wrong', a: 'x' };

describe('끝장 퀴즈', () => {
  it('500문항: 모든 단어 한 번씩, 방향 250/250, 몬스터 50칸(레전드 제외)', () => {
    const r = newRun(seeded());
    expect(r.order).toHaveLength(500);
    expect(new Set(r.order.map((q) => q.id)).size).toBe(500);
    expect(r.order.filter((q) => q.dir === 'en')).toHaveLength(250);
    expect(r.monsters).toHaveLength(50);
    expect(r.monsters.every((m) => FRUIT_BY_ID[m].rarity !== 'legend' && FRUIT_BY_ID[m].zone === 'colosseum')).toBe(true);
  });
  it('이어하기: 다음 문제 위치, 중복 채점 방지', () => {
    let r = newRun(seeded());
    r = answer(r, 0, ok); r = answer(r, 1, bad);
    expect(nextIndex(r)).toBe(2);
    expect(answer(r, 1, ok).main[1]).toEqual(bad);
  });
  it('10문제 블록 포획: 일반 8개 이상, 희귀 10개', () => {
    let r = newRun(seeded());
    for (let i = 0; i < BLOCK; i++) r = answer(r, i, i < 8 ? ok : bad);
    const b = blockResult(r, 9);
    expect(b.done).toBe(true); expect(b.correct).toBe(8);
    expect(b.capture).toBe(FRUIT_BY_ID[b.monster].rarity === 'common');
    expect(blockResult(r, 12).done).toBe(false);
  });
  it('본선 점수, 오답 스테이지 1→2→3, 틀린 문제만 다시', () => {
    let r = newRun(seeded());
    r.order.forEach((_, i) => { r = answer(r, i, i % 10 === 0 ? bad : ok); });
    expect(r.status).toBe('phaseDone'); expect(scoreOf(r.main)).toBe(90);
    r = advance(r, 'x');
    expect(r.stage).toBe(1); expect(curQs(r)).toHaveLength(50); expect(r.status).toBe('playing');
    curQs(r).forEach((_, i) => { r = answer(r, i, i < 46 ? ok : bad); });
    expect(scoreOf(r.stageAns)).toBe(92);
    r = advance(r, 'y'); expect(r.stage).toBe(2); expect(curQs(r)).toHaveLength(4); expect(r.stageScores).toEqual([92]);
    curQs(r).forEach((_, i) => { r = answer(r, i, i < 3 ? ok : bad); });
    r = advance(r, 'z'); expect(r.stage).toBe(3); expect(curQs(r)).toHaveLength(1);
    r = answer(r, 0, bad);
    expect(wrongOf(r)).toHaveLength(1);
    r = advance(r, null); expect(r.status).toBe('done'); expect(r.stageScores).toEqual([92, 75, 0]);
  });
  it('틀린 문제가 없으면 바로 완료', () => {
    let r = newRun(seeded());
    r.order.forEach((_, i) => { r = answer(r, i, ok); });
    expect(advance(r, 'x').status).toBe('done');
  });
  it('레전드는 못 잡은 것부터 순서대로, 같은 판 중복 없음, 모두 잡으면 적게 잡은 것', () => {
    expect(nextLegend({})).toBe(COLOSSEUM_LEGENDS[0].id);
    expect(nextLegend({ [COLOSSEUM_LEGENDS[0].id]: { at: '', count: 1 } })).toBe(COLOSSEUM_LEGENDS[1].id);
    expect(nextLegend({}, [COLOSSEUM_LEGENDS[0].id])).toBe(COLOSSEUM_LEGENDS[1].id);
    const all = Object.fromEntries(COLOSSEUM_LEGENDS.map((f, i) => [f.id, { at: '', count: i === 3 ? 1 : 2 }]));
    expect(nextLegend(all)).toBe(COLOSSEUM_LEGENDS[3].id);
  });
});
