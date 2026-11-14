// 기기 안 저장소(IndexedDB). 앱 파일 캐시(Service Worker)와 완전히 분리되어 앱 업데이트 때 지워지지 않습니다.
// 단, 사용자가 Safari 웹사이트 데이터를 지우거나 기기가 공간 정리를 하면 사라질 수 있습니다 → 백업 권장.
import type { DirRecord, ExamRecord, GameState, Overrides, ProgressMap, Settings } from './types';

const DB_NAME = 'word-monster';
const DB_VERSION = 1;
export interface KV { settings: Settings; game: GameState; overrides: Overrides; exams: ExamRecord[]; currentExam: unknown; meta: { createdAt: string }; endurance: unknown; enduranceHistory: unknown[] }

let dbp: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains('progress')) d.createObjectStore('progress'); // 학습 기록
      if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); // 설정·게임 상태·부모 수정·시험 기록
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => { dbp = null; rej(req.error); };
  });
  return dbp;
}
const done = (tx: IDBTransaction) => new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error ?? new Error('abort')); });

export async function loadAll(): Promise<{ progress: ProgressMap; kv: Partial<KV> }> {
  const d = await db();
  const tx = d.transaction(['progress', 'kv'], 'readonly');
  const progress: ProgressMap = {}; const kv: Partial<KV> = {};
  await new Promise<void>((res, rej) => {
    const c = tx.objectStore('progress').openCursor();
    c.onsuccess = () => { const cur = c.result; if (cur) { progress[String(cur.key)] = cur.value; cur.continue(); } else res(); };
    c.onerror = () => rej(c.error);
  });
  await new Promise<void>((res, rej) => {
    const c = tx.objectStore('kv').openCursor();
    c.onsuccess = () => { const cur = c.result; if (cur) { (kv as any)[String(cur.key)] = cur.value; cur.continue(); } else res(); };
    c.onerror = () => rej(c.error);
  });
  await done(tx);
  return { progress, kv };
}

/** 답 하나를 제출할 때 학습 기록과 게임 상태를 한 번에 저장(둘 다 성공하거나 둘 다 실패) */
export async function saveBatch(progress: Record<string, DirRecord>, kv: Partial<KV>): Promise<void> {
  const d = await db();
  const tx = d.transaction(['progress', 'kv'], 'readwrite');
  for (const [k, v] of Object.entries(progress)) tx.objectStore('progress').put(v, k);
  for (const [k, v] of Object.entries(kv)) tx.objectStore('kv').put(v, k);
  await done(tx);
}
export async function replaceAll(progress: ProgressMap, kv: Partial<KV>): Promise<void> {
  const d = await db();
  const tx = d.transaction(['progress', 'kv'], 'readwrite');
  tx.objectStore('progress').clear(); tx.objectStore('kv').clear();
  for (const [k, v] of Object.entries(progress)) tx.objectStore('progress').put(v, k);
  for (const [k, v] of Object.entries(kv)) if (v !== undefined) tx.objectStore('kv').put(v, k);
  await done(tx);
}
export async function deleteProgressKeys(keys: string[]): Promise<void> {
  const d = await db();
  const tx = d.transaction(['progress'], 'readwrite');
  keys.forEach((k) => tx.objectStore('progress').delete(k));
  await done(tx);
}
export function _resetForTests() { dbp = null; }
