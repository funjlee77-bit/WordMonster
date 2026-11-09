import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { DirRecord, ExamRecord, GameState, Overrides, ProgressMap, Settings, Dir, AnswerOverride } from './core/types';
import { DEFAULT_GAME, DEFAULT_SETTINGS, pkey } from './core/types';
import * as db from './core/storage';
import type { Backup } from './core/backup';

export interface AppData { progress: ProgressMap; settings: Settings; game: GameState; overrides: Overrides; exams: ExamRecord[]; currentExam: any }
interface Ctx extends AppData {
  loaded: boolean; loadError: string | null; saveError: string | null;
  commit(progress: Record<string, DirRecord>, kv?: Partial<Pick<AppData, 'game' | 'settings' | 'overrides' | 'exams' | 'currentExam'>>): Promise<boolean>;
  setOverride(id: string, dir: Dir, o: AnswerOverride | null, resetProgress: boolean): Promise<boolean>;
  restore(b: Backup): Promise<boolean>;
  resetAll(keepGame: boolean): Promise<boolean>;
  clearSaveError(): void;
}
const C = createContext<Ctx>(null as any);
export const useApp = () => useContext(C);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [d, setD] = useState<AppData>({ progress: {}, settings: DEFAULT_SETTINGS, game: DEFAULT_GAME, overrides: {}, exams: [], currentExam: null });
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const ref = useRef(d); ref.current = d;

  useEffect(() => {
    db.loadAll().then(({ progress, kv }) => {
      setD({ progress, settings: { ...DEFAULT_SETTINGS, ...(kv.settings ?? {}) }, game: { ...DEFAULT_GAME, ...(kv.game ?? {}) },
        overrides: kv.overrides ?? {}, exams: kv.exams ?? [], currentExam: kv.currentExam ?? null });
      setLoaded(true);
    }).catch((e) => { setLoadError(String(e?.message ?? e)); setLoaded(true); });
    try { navigator.storage?.persist?.(); } catch { /* 무시 */ }
  }, []);

  const fail = (e: any) => { setSaveError('기록을 기기에 저장하지 못했어요. (' + String(e?.message ?? e) + ') 부모 메뉴 → 백업으로 지금 기록을 파일로 저장해 주세요.'); return false; };

  const commit: Ctx['commit'] = useCallback(async (progress, kv = {}) => {
    const next = { ...ref.current, ...kv, progress: { ...ref.current.progress, ...progress } };
    ref.current = next; setD(next);
    try { await db.saveBatch(progress, kv as any); return true; } catch (e) { return fail(e); }
  }, []);

  const setOverride: Ctx['setOverride'] = useCallback(async (id, dir, o, resetProgress) => {
    const ov: Overrides = { ...ref.current.overrides, [id]: { ...(ref.current.overrides[id] ?? {}) } };
    if (o) ov[id]![dir] = o; else delete ov[id]![dir];
    if (!Object.keys(ov[id]!).length) delete ov[id];
    const progress = { ...ref.current.progress };
    if (resetProgress) delete progress[pkey(id, dir)];
    ref.current = { ...ref.current, overrides: ov, progress }; setD(ref.current);
    try {
      await db.saveBatch({}, { overrides: ov });
      if (resetProgress) await db.deleteProgressKeys([pkey(id, dir)]);
      return true;
    } catch (e) { return fail(e); }
  }, []);

  const restore: Ctx['restore'] = useCallback(async (b) => {
    const next: AppData = { progress: b.progress, settings: b.settings, game: b.game, overrides: b.overrides, exams: b.exams, currentExam: null };
    try { await db.replaceAll(next.progress, { settings: next.settings, game: next.game, overrides: next.overrides, exams: next.exams }); ref.current = next; setD(next); return true; }
    catch (e) { return fail(e); }
  }, []);

  const resetAll: Ctx['resetAll'] = useCallback(async (keepGame) => {
    const cur = ref.current;
    const next: AppData = { progress: {}, settings: cur.settings, overrides: cur.overrides, exams: [], currentExam: null,
      game: keepGame ? cur.game : { ...DEFAULT_GAME } };
    try { await db.replaceAll({}, { settings: next.settings, overrides: next.overrides, game: next.game, exams: [] }); ref.current = next; setD(next); return true; }
    catch (e) { return fail(e); }
  }, []);

  return (
    <C.Provider value={{ ...d, loaded, loadError, saveError, commit, setOverride, restore, resetAll, clearSaveError: () => setSaveError(null) }}>
      {children}
    </C.Provider>
  );
}
