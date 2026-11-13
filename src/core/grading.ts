import type { Dir, Overrides, WordItem } from './types';
import { acceptedAnswers } from './data';

export interface GradeOptions { caseSensitive: boolean; spaceSensitive: boolean; punctSensitive: boolean }
export const STRICT: GradeOptions = { caseSensitive: true, spaceSensitive: true, punctSensitive: true };

/** 기본 정규화: Unicode NFC + 앞뒤 공백 제거. 그 외에는 아무것도 바꾸지 않음 */
export const baseNorm = (s: string) => s.normalize('NFC').trim();

const PUNCT = /[.,/()\-'"!?~·:;\[\]{}_‘’“”…]/g;
/** 부모가 완화 설정을 켰을 때만 쓰는 비교용 형태 */
export function relaxedForm(s: string, o: GradeOptions): string {
  let x = baseNorm(s);
  if (!o.caseSensitive) x = x.toLowerCase();
  if (!o.punctSensitive) x = x.replace(PUNCT, ' ');
  x = o.spaceSensitive ? (o.punctSensitive ? x : x.replace(/\s+/g, ' ').trim()) : x.replace(/\s+/g, '');
  return x;
}
export const isStrictSetting = (o: GradeOptions) => o.caseSensitive && o.spaceSensitive && o.punctSensitive;

export interface Grade { kind: 'strict' | 'relaxed' | 'wrong'; matched: string | null }

/**
 * 뜻 쓰기(영어 → 뜻) 비교용 형태: 부호와 띄어쓰기만 지움. 글자·단어·순서는 그대로 비교.
 * 예) "(~한 상태로) 변하다, 되다" → "한상태로변하다되다"
 *     "한상태로변하다/되다", "한 상태로 변하다 되다" 모두 정답. "되다, 변하다"(순서 바뀜)·"변하다"(일부)는 오답
 */
const KO_IGNORE = /[\s\p{P}\p{S}]/gu; // 공백, 문장부호((), ~, 쉼표, 따옴표, /, -, … 등), 기호
export const koForm = (s: string) => baseNorm(s).replace(KO_IGNORE, '');

/** 엄격 정답(교재/부모 등록 정답과 같음)과 완화 정답을 구분해 돌려줌. koMode면 부호·띄어쓰기를 무시하고 비교 */
export function gradeAnswer(input: string, answers: string[], o: GradeOptions, koMode = false): Grade {
  const inp = baseNorm(input);
  if (inp === '') return { kind: 'wrong', matched: null };
  for (const a of answers) if (baseNorm(a) === inp) return { kind: 'strict', matched: a };
  if (koMode) {
    const k = koForm(inp);
    if (k !== '') for (const a of answers) if (koForm(a) === k) return { kind: 'strict', matched: a };
  }
  if (!isStrictSetting(o)) {
    const r = relaxedForm(inp, o);
    for (const a of answers) if (relaxedForm(a, o) === r && r !== '') return { kind: 'relaxed', matched: a };
  }
  return { kind: 'wrong', matched: null };
}

export function gradeItem(input: string, item: WordItem, dir: Dir, ov: Overrides, o: GradeOptions): Grade {
  return gradeAnswer(input, acceptedAnswers(item, dir, ov), o, dir === 'ko');
}

/** 같은 뜻(en 방향) 또는 같은 영어(ko 방향)를 가진 "다른 항목"의 답을 쓴 경우 그 항목을 찾음 (정답으로 인정하지 않음) */
export function findSiblingMatch(input: string, item: WordItem, dir: Dir, scope: WordItem[], ov: Overrides, o: GradeOptions): WordItem | null {
  for (const other of scope) {
    if (other.id === item.id) continue;
    const same = dir === 'en' ? other.grading.ko === item.grading.ko : other.grading.en === item.grading.en;
    if (!same) continue;
    if (gradeItem(input, other, dir, ov, o).kind !== 'wrong') return other;
  }
  return null;
}

/** 범위 안에서 같은 문제 글이 되는 다른 항목들 (Chapter·번호 표시용) */
export function siblings(item: WordItem, dir: Dir, scope: WordItem[]): WordItem[] {
  return scope.filter((o) => o.id !== item.id && (dir === 'en' ? o.grading.ko === item.grading.ko : o.englishDisplay === item.englishDisplay));
}

export type DiffSeg = { text: string; kind: 'same' | 'extra' | 'missing' };
/** 글자 단위 비교: mine(내 답)에서 더 쓴 글자, answer(정답)에서 빠진 글자를 표시 */
export function diffChars(mine: string, answer: string): { mine: DiffSeg[]; answer: DiffSeg[]; changed: number } {
  const a = Array.from(baseNorm(mine)), b = Array.from(baseNorm(answer));
  const n = a.length, m = b.length;
  const L: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const ma: DiffSeg[] = [], an: DiffSeg[] = [];
  const push = (arr: DiffSeg[], ch: string, kind: DiffSeg['kind']) => {
    const last = arr[arr.length - 1];
    if (last && last.kind === kind) last.text += ch; else arr.push({ text: ch, kind });
  };
  let i = 0, j = 0, changed = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { push(ma, a[i], 'same'); push(an, b[j], 'same'); i++; j++; }
    else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) { push(an, b[j], 'missing'); j++; changed++; }
    else { push(ma, a[i], 'extra'); i++; changed++; }
  }
  return { mine: ma, answer: an, changed };
}
