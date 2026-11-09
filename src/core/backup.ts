import type { ExamRecord, GameState, Overrides, ProgressMap, Settings, DirRecord } from './types';
import { DEFAULT_GAME, DEFAULT_SETTINGS } from './types';
import { ITEM_BY_ID, WORD_DATA } from './data';

export const BACKUP_FORMAT = 1;
export interface Backup {
  app: 'word-monster'; backupFormat: number; appVersion: string; dataVersion: number; textbook: string; textbookSha256: string;
  exportedAt: string; settings: Settings; overrides: Overrides; progress: ProgressMap; game: GameState; exams: ExamRecord[];
}
export function makeBackup(s: { settings: Settings; overrides: Overrides; progress: ProgressMap; game: GameState; exams: ExamRecord[] }, appVersion: string): Backup {
  return { app: 'word-monster', backupFormat: BACKUP_FORMAT, appVersion, dataVersion: WORD_DATA.dataVersion, textbook: WORD_DATA.textbook,
    textbookSha256: WORD_DATA.sourceSha256, exportedAt: new Date().toISOString(), ...s };
}

export interface BackupCheck { ok: boolean; errors: string[]; warnings: string[]; summary?: { records: number; items: number; overrides: number; exams: number; exportedAt: string; xp: number } ; data?: Backup }

const isNum = (x: unknown) => typeof x === 'number' && Number.isFinite(x);
function validRecord(r: any): r is DirRecord {
  return r && typeof r === 'object' && isNum(r.attempts) && isNum(r.wrong) && isNum(r.unaidedCorrect) &&
    [0, 1, 2, 3, 4, 5].includes(r.stage) && typeof r.pendingRetry === 'boolean' && (r.due === null || /^\d{4}-\d{2}-\d{2}$/.test(r.due));
}

/** 복원 전에 파일을 검사하고 요약을 보여줌. 문제가 있으면 복원하지 않음 */
export function checkBackup(text: string): BackupCheck {
  const errors: string[] = [], warnings: string[] = [];
  let b: any;
  try { b = JSON.parse(text); } catch { return { ok: false, errors: ['JSON 파일 형식이 아니에요.'], warnings }; }
  if (!b || b.app !== 'word-monster') errors.push('단어 몬스터 탐험대 백업 파일이 아니에요.');
  if (b && b.backupFormat !== BACKUP_FORMAT) errors.push(`지원하지 않는 백업 형식(${b?.backupFormat})이에요.`);
  if (errors.length) return { ok: false, errors, warnings };
  if (b.textbookSha256 !== WORD_DATA.sourceSha256) warnings.push('백업을 만든 때와 단어 데이터(교재 파일)가 달라요. 같은 ID의 기록만 복원돼요.');
  if (!b.progress || typeof b.progress !== 'object') errors.push('학습 기록이 없어요.');
  else for (const [k, v] of Object.entries(b.progress)) {
    const [id, dir] = k.split('|');
    if (!ITEM_BY_ID[id] || (dir !== 'en' && dir !== 'ko')) { warnings.push(`알 수 없는 항목 기록 ${k}는 건너뛰어요.`); delete b.progress[k]; continue; }
    if (!validRecord(v)) errors.push(`기록 ${k}의 형식이 잘못됐어요.`);
  }
  if (b.overrides && typeof b.overrides === 'object') {
    for (const [id, o] of Object.entries<any>(b.overrides)) {
      if (!ITEM_BY_ID[id]) { warnings.push(`알 수 없는 수정 항목 ${id}는 건너뛰어요.`); delete b.overrides[id]; continue; }
      for (const d of Object.keys(o)) if (!['en', 'ko'].includes(d) || !Array.isArray(o[d]?.alternates)) errors.push(`정답 수정 ${id}의 형식이 잘못됐어요.`);
    }
  } else b.overrides = {};
  if (!b.game || typeof b.game !== 'object' || !isNum(b.game.xp)) errors.push('게임 상태가 잘못됐어요.');
  if (errors.length) return { ok: false, errors: errors.slice(0, 20), warnings };
  b.settings = { ...DEFAULT_SETTINGS, ...(b.settings ?? {}) };
  b.game = { ...DEFAULT_GAME, ...b.game };
  b.exams = Array.isArray(b.exams) ? b.exams : [];
  return { ok: true, errors, warnings: warnings.slice(0, 20), data: b as Backup,
    summary: { records: Object.keys(b.progress).length, items: new Set(Object.keys(b.progress).map((k) => k.split('|')[0])).size,
      overrides: Object.keys(b.overrides).length, exams: b.exams.length, exportedAt: b.exportedAt, xp: b.game.xp } };
}
