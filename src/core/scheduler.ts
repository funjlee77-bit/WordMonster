import type { Dir, ProgressMap, WordItem } from './types';
import { pkey } from './types';
import { isDue } from './srs';

export interface Unit { id: string; dir: Dir }
export type Bucket = 'pending' | 'due' | 'new' | 'review';
export interface PlannedUnit extends Unit { bucket: Bucket }
export type Rng = () => number;

export function bucketOf(p: ProgressMap, u: Unit, today: string): Bucket {
  const r = p[pkey(u.id, u.dir)];
  if (!r || r.stage === 0 && r.attempts === 0) return 'new';
  if (r.pendingRetry) return 'pending';
  if (isDue(r, today)) return 'due';
  return 'review';
}

function shuffle<T>(a: T[], rng: Rng): T[] {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
  return x;
}

export interface PlanInput {
  items: WordItem[]; dirs: Dir[]; n: number; progress: ProgressMap; today: string;
  mode: 'explore' | 'wrong'; recentSessions: string[][]; rng?: Rng;
}

/**
 * 출제 계획 (우선순위)
 *  1) 같은 판 재도전 — 판 진행 중 insertRetry()가 처리
 *  2) 이전 판에서 남은 오답(pendingRetry)  3) 복습 예정일이 지난 항목  4) 새 단어  5) 일반 복습
 *  - 일반 탐험은 새 단어 자리(문제 수의 25%, 최소 1)를 먼저 확보해 새 단어가 계속 밀리지 않게 함
 *  - 같은 단계 안에서는 최근 5판 출제 횟수가 적고, 오래 기다린 것부터 (동점은 무작위)
 *  - 한 판의 처음 계획에는 같은 단어(id)를 두 번 넣지 않음
 */
export function planSession(inp: PlanInput): PlannedUnit[] {
  const rng = inp.rng ?? Math.random;
  const recentCount = new Map<string, number>();
  inp.recentSessions.slice(-5).forEach((s) => s.forEach((k) => recentCount.set(k, (recentCount.get(k) ?? 0) + 1)));
  const all: PlannedUnit[] = [];
  for (const it of inp.items) for (const d of inp.dirs) all.push({ id: it.id, dir: d, bucket: bucketOf(inp.progress, { id: it.id, dir: d }, inp.today) });
  const waitKey = (u: Unit) => { const r = inp.progress[pkey(u.id, u.dir)]; return r?.lastServedAt ?? r?.lastAt ?? ''; };
  const sorted = (b: Bucket) => {
    const arr = shuffle(all.filter((u) => u.bucket === b), rng);
    return arr.sort((x, y) => {
      const rc = (recentCount.get(pkey(x.id, x.dir)) ?? 0) - (recentCount.get(pkey(y.id, y.dir)) ?? 0);
      if (rc) return rc;
      if (b === 'due') { const dx = inp.progress[pkey(x.id, x.dir)]?.due ?? '', dy = inp.progress[pkey(y.id, y.dir)]?.due ?? ''; if (dx !== dy) return dx < dy ? -1 : 1; }
      const wx = waitKey(x), wy = waitKey(y);
      return wx === wy ? 0 : wx < wy ? -1 : 1;
    });
  };
  const n = inp.n;
  const out: PlannedUnit[] = [];
  const usedIds = new Set<string>();
  const take = (list: PlannedUnit[], limit: number) => {
    for (const u of list) {
      if (out.length >= n || limit <= 0) break;
      if (usedIds.has(u.id)) continue;
      out.push(u); usedIds.add(u.id); limit--;
    }
  };
  if (inp.mode === 'wrong') {
    take(sorted('pending'), n);
    return shuffle(out, rng);
  }
  // 새 단어는 방향을 섞기 위해 단어별로 한 방향만 후보로
  const newList = sorted('new');
  const newCount = new Set(newList.map((u) => u.id)).size;
  const reserve = newCount > 0 ? Math.min(newCount, Math.max(1, Math.round(n * 0.25))) : 0;
  take(sorted('pending'), n - reserve);
  take(sorted('due'), n - reserve - out.length);
  take(newList, n - out.length);
  take(sorted('review'), n - out.length);
  // 단어 수가 문제 수보다 적으면 같은 단어의 다른 방향도 허용
  if (out.length < n) {
    for (const u of [...sorted('pending'), ...sorted('due'), ...newList, ...sorted('review')]) {
      if (out.length >= n) break;
      if (!out.some((o) => o.id === u.id && o.dir === u.dir)) out.push(u);
    }
  }
  // 같은 단어의 두 방향이 붙어 나오지 않게 섞기
  let res = shuffle(out, rng);
  for (let t = 0; t < 10; t++) {
    const bad = res.findIndex((u, i) => i > 0 && res[i - 1].id === u.id);
    if (bad < 0) break;
    res = shuffle(res, rng);
  }
  return res;
}

export interface QueueEntry extends Unit { kind: 'normal' | 'retry' }

/**
 * 오답 재출제: 다른 문제 2~4개 뒤에 같은 방향으로 다시 묻는다. 한 판의 문제 수는 고정.
 * 끼워 넣을 때는 맨 뒤의 일반 문제 하나를 빼서(다음 판으로 미룸) 길이를 유지한다.
 * 이미 이 판에서 재도전한 단어, 또는 남은 자리가 부족하면 false → 다음 판 우선 출제(pendingRetry)로 넘어감.
 */
export function insertRetry(queue: QueueEntry[], index: number, u: Unit, alreadyRetried: Set<string>, rng: Rng = Math.random): { queue: QueueEntry[]; inserted: boolean; position: number } {
  const key = pkey(u.id, u.dir);
  if (alreadyRetried.has(key)) return { queue, inserted: false, position: -1 };
  const gaps = [2, 3, 4].filter((g) => {
    const pos = index + g + 1;
    if (pos > queue.length - 1) return false;
    return queue.slice(pos).some((q) => q.kind === 'normal');
  });
  if (!gaps.length) return { queue, inserted: false, position: -1 };
  const gap = gaps[Math.floor(rng() * gaps.length)];
  const pos = index + gap + 1;
  const q = queue.slice();
  // 뒤에서부터 일반 문제 하나 제거
  for (let i = q.length - 1; i >= pos; i--) if (q[i].kind === 'normal') { q.splice(i, 1); break; }
  q.splice(pos, 0, { ...u, kind: 'retry' });
  alreadyRetried.add(key);
  return { queue: q, inserted: true, position: pos };
}
