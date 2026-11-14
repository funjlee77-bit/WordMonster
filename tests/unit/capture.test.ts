import { describe, it, expect } from 'vitest';
import { REGION_FRUITS as FRUITS, COLOSSEUM_FRUITS, FRUITS as ALL } from '../../src/core/fruits';
import { chooseEncounter, canCapture, rareProgress, legendProgress, RARE_NEED } from '../../src/core/capture';
import { itemsInChapters } from '../../src/core/data';
import { pkey, type ProgressMap, type DirRecord } from '../../src/core/types';

const st = (stage: number) => ({ stage } as DirRecord);
describe('과일 몬스터', () => {
  it('50종: 일반 30·희귀 15·전설 5, Chapter마다 2종, ID 중복 없음', () => {
    expect(FRUITS).toHaveLength(50);
    expect(FRUITS.filter((f) => f.rarity === 'common')).toHaveLength(30);
    expect(FRUITS.filter((f) => f.rarity === 'rare')).toHaveLength(15);
    expect(FRUITS.filter((f) => f.rarity === 'legend').map((f) => f.chapter)).toEqual([5, 10, 15, 20, 25]);
    for (let c = 1; c <= 25; c++) expect(FRUITS.filter((f) => f.chapter === c)).toHaveLength(2);
    expect(new Set(FRUITS.map((f) => f.id)).size).toBe(50);
    expect(new Set(FRUITS.map((f) => f.name)).size).toBe(50);
  });
  it('콜로세움 60종: 일반 30·희귀 20·레전드 10, 전체 110종 이름·ID 중복 없음', () => {
    expect(COLOSSEUM_FRUITS.filter((f) => f.rarity === 'common')).toHaveLength(30);
    expect(COLOSSEUM_FRUITS.filter((f) => f.rarity === 'rare')).toHaveLength(20);
    expect(COLOSSEUM_FRUITS.filter((f) => f.rarity === 'legend')).toHaveLength(10);
    expect(ALL).toHaveLength(110);
    expect(new Set(ALL.map((f) => f.id)).size).toBe(110); expect(new Set(ALL.map((f) => f.name)).size).toBe(110);
    for (let k = 0; k < 30; k++) expect(chooseEncounter([7], { captured: {} }, {}).id).not.toMatch(/gladiator|crow/);
  });
  it('처음에는 그 Chapter의 아직 못 잡은 일반 몬스터가 나옴, 희귀·전설은 조건 전 안 나옴', () => {
    for (let k = 0; k < 20; k++) {
      const e = chooseEncounter([4], { captured: {} }, {});
      expect(e.reason).toBe('new'); expect(e.id).toBe('lemon-bee');
    }
    const e = chooseEncounter([4], { captured: { 'lemon-bee': { at: '', count: 1 } } }, {});
    expect(e.reason).toBe('again'); expect(e.id).toBe('lemon-bee');
  });
  it('희귀: 1일 뒤 복습 통과 5단어 이후 출현', () => {
    const p: ProgressMap = {};
    itemsInChapters([4]).slice(0, RARE_NEED - 1).forEach((i) => (p[pkey(i.id, 'en')] = st(3)));
    expect(rareProgress(4, p)).toBe(4);
    expect(chooseEncounter([4], { captured: {} }, p).reason).toBe('new');
    p[pkey(itemsInChapters([4])[10].id, 'ko')] = st(4);
    expect(chooseEncounter([4], { captured: {} }, p)).toEqual({ id: 'lime-frog', reason: 'rare' });
  });
  it('전설: 묶음 양방향 숙련 20개 이후 출현, 한 방향만은 불인정', () => {
    const p: ProgressMap = {};
    itemsInChapters([1, 2]).slice(0, 20).forEach((i) => (p[pkey(i.id, 'en')] = st(5)));
    expect(legendProgress(1, p)).toBe(0);
    itemsInChapters([1, 2]).slice(0, 20).forEach((i) => (p[pkey(i.id, 'ko')] = st(5)));
    expect(legendProgress(1, p)).toBe(20);
    expect(chooseEncounter([3], { captured: {} }, p)).toEqual({ id: 'durian-skunk', reason: 'legend' });
    expect(chooseEncounter([3], { captured: { 'durian-skunk': { at: '', count: 1 } } }, p).reason).not.toBe('legend');
  });
  it('포획 조건', () => {
    const [c, r, l] = ['lemon-bee', 'lime-frog', 'durian-skunk'].map((id) => FRUITS.find((f) => f.id === id)!);
    expect(canCapture(c, { stars: 1, aided: 0 })).toBe(false); expect(canCapture(c, { stars: 2, aided: 3 })).toBe(true);
    expect(canCapture(r, { stars: 2, aided: 0 })).toBe(false); expect(canCapture(r, { stars: 3, aided: 1 })).toBe(true);
    expect(canCapture(l, { stars: 3, aided: 1 })).toBe(false); expect(canCapture(l, { stars: 3, aided: 0 })).toBe(true);
  });
});
