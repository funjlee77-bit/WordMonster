import raw from '../data/words.json';
import type { WordData, WordItem, Dir, Overrides } from './types';

export const WORD_DATA = raw as WordData;
export const ITEMS: WordItem[] = WORD_DATA.items;
export const ITEM_BY_ID: Record<string, WordItem> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const CHAPTERS = Array.from({ length: 25 }, (_, i) => i + 1);
export const itemsInChapters = (chs: number[]) => ITEMS.filter((i) => chs.includes(i.chapter));

/** 교재 기본 정답(원문) */
export const baseAnswer = (item: WordItem, dir: Dir) => (dir === 'en' ? item.englishAnswer : item.koreanAnswer);
/** 부모 수정이 반영된 대표 정답 */
export const mainAnswer = (item: WordItem, dir: Dir, ov: Overrides) => ov[item.id]?.[dir]?.replace ?? baseAnswer(item, dir);
/** 인정되는 모든 정답(대표 정답 + 부모가 등록한 대체 정답) */
export function acceptedAnswers(item: WordItem, dir: Dir, ov: Overrides): string[] {
  const o = ov[item.id]?.[dir];
  return [mainAnswer(item, dir, ov), ...(o?.alternates ?? [])].filter((s) => s.trim() !== '');
}
/** 문제로 보여줄 글: en 방향은 D열 뜻, ko 방향은 C열 교재 표기 */
export const promptText = (item: WordItem, dir: Dir) => (dir === 'en' ? item.koreanAnswer : item.englishDisplay);
