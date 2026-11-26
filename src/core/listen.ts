// 🎧 듣고 쓰기(본선 연습): 앱이 영어를 읽어 주면 철자를 자판으로 쓰기
// - 화면에 영어·뜻·과 번호를 보여 주지 않음, 순서는 무작위
// - 채점: 엑셀 E열(부모 정답 수정 포함). 소리로 구별할 수 없는 것만 너그럽게:
//   · 대문자(Wednesday 등)는 소리로 안 들리니 소문자로 써도 정답(알림 표시)
//   · am/are/is 처럼 슬래시로 나뉜 답은 "am are is", "am, are, is"도 정답
//   · 소리가 같은 다른 단어(see ↔ sea)를 쓰면 틀림 처리하지 않고 뜻 힌트를 주고 다시 쓰게 함
import type { GameState, Overrides, WordItem } from './types';
import { acceptedAnswers } from './data';
import { baseNorm } from './grading';

export interface ListenRec { ok: number; ng: number; pending: boolean; lastAt: string }
export type ListenMap = Record<string, ListenRec>;

/** 소리만으로는 구별이 안 되는 단어(교재 단어 → 같은 소리의 다른 철자) */
export const HOMOPHONES: Record<string, string[]> = {
  see: ['sea'], male: ['mail'], whole: ['hole'], weather: ['whether'], read: ['reed', 'red'], board: ['bored'],
  great: ['grate'], raise: ['rays', 'raze'], scene: ['seen'], weigh: ['way'], effect: ['affect'], bury: ['berry'], symbol: ['cymbal'],
};

/** 비교용: 소문자 + 슬래시·쉼표를 띄어쓰기로, 띄어쓰기 하나로 */
export const listenForm = (s: string) => baseNorm(s).toLowerCase().replace(/[\/,]+/g, ' ').replace(/\s+/g, ' ').trim();
const sepForm = (s: string) => baseNorm(s).replace(/[\/,]+/g, ' ').replace(/\s+/g, ' ').trim();

export type ListenGrade = { kind: 'strict' | 'case' | 'homophone' | 'wrong'; answer: string; homophone?: string };

export function gradeListen(input: string, item: WordItem, ov: Overrides): ListenGrade {
  const answers = acceptedAnswers(item, 'en', ov);
  const main = answers[0];
  const inp = baseNorm(input);
  if (inp === '') return { kind: 'wrong', answer: main };
  for (const a of answers) if (baseNorm(a) === inp || sepForm(a) === sepForm(inp)) return { kind: 'strict', answer: a };
  const lf = listenForm(inp);
  for (const a of answers) if (listenForm(a) === lf) return { kind: 'case', answer: a };
  for (const a of answers) {
    const h = HOMOPHONES[listenForm(a)];
    if (h?.includes(lf)) return { kind: 'homophone', answer: a, homophone: lf };
  }
  return { kind: 'wrong', answer: main };
}

export function applyListen(rec: ListenRec | undefined, ok: boolean, now: string): ListenRec {
  const r = rec ?? { ok: 0, ng: 0, pending: false, lastAt: now };
  return ok ? { ok: r.ok + 1, ng: r.ng, pending: false, lastAt: now } : { ok: r.ok, ng: r.ng + 1, pending: true, lastAt: now };
}

/** 듣고 쓰기에서 틀리고 아직 다시 맞히지 못한 단어 id (범위 안) */
export function listenPending(game: GameState, scope: WordItem[]): string[] {
  const m = game.listen ?? {};
  return scope.filter((i) => m[i.id]?.pending).map((i) => i.id);
}

/** 무작위 순서로 n개 (범위보다 많으면 범위 전체) */
export function planListen(scope: WordItem[], n: number, rng: () => number = Math.random): string[] {
  const a = scope.map((i) => i.id);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, Math.min(n, a.length));
}
