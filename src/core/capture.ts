// 과일 몬스터 출현·포획 규칙 (공부 기록과 연결)
//  · 일반: 그 지역(Chapter) 탐험에서 나타남 → 별 2개 이상이면 포획
//  · 희귀: 그 Chapter에서 '1일 뒤 복습'을 통과한 단어(어느 방향이든 3단계 이상)가 5개 이상이면 나타남 → 별 3개면 포획
//  · 전설: 그 묶음(Chapter 1~5, 6~10 …) 100단어 중 양방향 숙련 20개 이상이면 나타남 → 도움(힌트·정답 보기) 없이 별 3개면 포획
//  · 포획에 실패해도 사라지지 않고 다음에 또 나타남. 잃는 것은 없음
import { FRUITS, type FruitDef } from './fruits';
import { ITEMS } from './data';
import { pkey, type ProgressMap, type GameState } from './types';

export const RARE_NEED = 5;
export const LEGEND_NEED = 20;
export const groupOf = (ch: number) => Math.ceil(ch / 5);
export const groupChapters = (g: number) => [1, 2, 3, 4, 5].map((k) => (g - 1) * 5 + k);

export function rareProgress(ch: number, p: ProgressMap): number {
  return ITEMS.filter((i) => i.chapter === ch && Math.max(p[pkey(i.id, 'en')]?.stage ?? 0, p[pkey(i.id, 'ko')]?.stage ?? 0) >= 3).length;
}
export function legendProgress(g: number, p: ProgressMap): number {
  const chs = groupChapters(g);
  return ITEMS.filter((i) => chs.includes(i.chapter) && p[pkey(i.id, 'en')]?.stage === 5 && p[pkey(i.id, 'ko')]?.stage === 5).length;
}
export const isUnlocked = (f: FruitDef, p: ProgressMap) =>
  f.rarity === 'common' || (f.rarity === 'rare' ? rareProgress(f.chapter, p) >= RARE_NEED : legendProgress(groupOf(f.chapter), p) >= LEGEND_NEED);

export interface Encounter { id: string; reason: 'legend' | 'rare' | 'new' | 'again' }

export function chooseEncounter(chapters: number[], game: Pick<GameState, 'captured'>, p: ProgressMap, rng: () => number = Math.random): Encounter {
  const caught = (id: string) => !!game.captured?.[id];
  const pick = <T,>(a: T[]) => a[Math.floor(rng() * a.length)];
  const groups = [...new Set(chapters.map(groupOf))];
  const legends = FRUITS.filter((f) => f.rarity === 'legend' && groups.includes(groupOf(f.chapter)) && !caught(f.id) && isUnlocked(f, p));
  if (legends.length) return { id: pick(legends).id, reason: 'legend' };
  const rares = FRUITS.filter((f) => f.rarity === 'rare' && chapters.includes(f.chapter) && !caught(f.id) && isUnlocked(f, p));
  if (rares.length) return { id: pick(rares).id, reason: 'rare' };
  const commons = FRUITS.filter((f) => f.rarity === 'common' && chapters.includes(f.chapter) && !caught(f.id));
  if (commons.length) return { id: pick(commons).id, reason: 'new' };
  const again = FRUITS.filter((f) => chapters.includes(f.chapter) && (f.rarity === 'common' || caught(f.id)));
  return { id: pick(again.length ? again : FRUITS.filter((f) => f.rarity === 'common')).id, reason: 'again' };
}

/** 이번 판 결과로 포획되는지 */
export function canCapture(f: FruitDef, r: { stars: number; aided: number }): boolean {
  if (f.rarity === 'common') return r.stars >= 2;
  if (f.rarity === 'rare') return r.stars >= 3;
  return r.stars >= 3 && r.aided === 0;
}
export function captureRuleText(f: FruitDef): string {
  if (f.rarity === 'common') return '별 2개 이상으로 탐험을 마치면 포획';
  if (f.rarity === 'rare') return '별 3개로 탐험을 마치면 포획';
  return '힌트·정답 보기 없이 별 3개로 마치면 포획';
}
export function appearRuleText(f: FruitDef, p: ProgressMap): string {
  if (f.rarity === 'common') return `Chapter ${f.chapter} 탐험에서 만날 수 있어요`;
  if (f.rarity === 'rare') return `Chapter ${f.chapter}에서 '1일 뒤 복습'을 통과한 단어 ${RARE_NEED}개가 되면 나타나요 (지금 ${Math.min(rareProgress(f.chapter, p), RARE_NEED)}/${RARE_NEED})`;
  const g = groupOf(f.chapter), chs = groupChapters(g);
  return `Chapter ${chs[0]}~${chs[4]} 단어 중 양방향 숙련 ${LEGEND_NEED}개가 되면 나타나요 (지금 ${Math.min(legendProgress(g, p), LEGEND_NEED)}/${LEGEND_NEED})`;
}
