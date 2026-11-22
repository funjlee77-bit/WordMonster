// 6개 왕국: 5개 Chapter(과)씩. 단어가 늘면 왕국도 이어서 늘어남(7번째: 31~35과 …)
import { CHAPTERS } from './data';
export interface Kingdom { no: number; name: string; desc: string; hue: number; motif: 'tree' | 'wave' | 'crystal' | 'snow' | 'star' | 'mountain'; chapters: number[] }
const META = [
  { name: '초록숲 왕국', desc: '나무와 덤불 사이에 친구들이 숨어 있어요', hue: 120, motif: 'tree' },
  { name: '푸른바다 왕국', desc: '파도 너머 바다 친구들이 기다려요', hue: 200, motif: 'wave' },
  { name: '구름하늘 왕국', desc: '구름 위로 날개 달린 친구들이 날아요', hue: 215, motif: 'star' },
  { name: '황금사막 왕국', desc: '모래 언덕에 단단한 친구들이 살아요', hue: 38, motif: 'mountain' },
  { name: '얼음설원 왕국', desc: '눈보라 속 반짝이는 친구들을 찾아요', hue: 195, motif: 'snow' },
  { name: '불꽃화산 왕국', desc: '뜨거운 용암 옆 용감한 친구들의 땅', hue: 12, motif: 'crystal' },
] as const;
export const KINGDOMS: Kingdom[] = Array.from({ length: Math.ceil(CHAPTERS.length / 5) }, (_, i) => ({
  no: i + 1, ...(META[i] ?? { name: `${i + 1}번째 왕국`, desc: '새로 열린 왕국', hue: (i * 60) % 360, motif: 'star' }),
  chapters: CHAPTERS.filter((c) => Math.ceil(c / 5) === i + 1),
}));
export const kingdomOf = (ch: number) => Math.ceil(ch / 5);
export const chaptersOfKingdoms = (ks: number[]) => KINGDOMS.filter((k) => ks.includes(k.no)).flatMap((k) => k.chapters);
/** 문제 수: 왕국 1개 50문제, 하나 늘 때마다 +10 (6개 = 100) */
export const questionsForKingdoms = (n: number) => (n <= 0 ? 0 : 50 + (n - 1) * 10);
