import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { loadAll, saveBatch, replaceAll, _resetForTests } from '../../src/core/storage';
import { makeBackup, checkBackup } from '../../src/core/backup';
import { applyAnswer } from '../../src/core/srs';
import { DEFAULT_GAME, DEFAULT_SETTINGS } from '../../src/core/types';

describe('저장과 백업', () => {
  it('제출할 때 저장 → 다시 열어도(새로고침) 기록 유지', async () => {
    const r = applyAnswer(undefined, 'wrong', { today: '2026-11-09', now: 'x' }).rec;
    await saveBatch({ 'ch01-01|en': r }, { game: { ...DEFAULT_GAME, xp: 30 } });
    _resetForTests();
    const { progress, kv } = await loadAll();
    expect(progress['ch01-01|en'].pendingRetry).toBe(true);
    expect(kv.game?.xp).toBe(30);
  });
  it('백업 → 검증 → 복원', async () => {
    const { progress, kv } = await loadAll();
    const b = makeBackup({ settings: DEFAULT_SETTINGS, overrides: { 'ch12-04': { ko: { alternates: ['숨기다'], updatedAt: 'x' } } }, progress, game: kv.game!, exams: [] }, '1.0.0');
    const text = JSON.stringify(b);
    const c = checkBackup(text);
    expect(c.ok).toBe(true); expect(c.summary?.records).toBe(1); expect(c.summary?.overrides).toBe(1);
    await replaceAll({}, {});
    expect(Object.keys((await loadAll()).progress)).toHaveLength(0);
    await replaceAll(c.data!.progress, { game: c.data!.game, overrides: c.data!.overrides, settings: c.data!.settings });
    const after = await loadAll();
    expect(after.progress['ch01-01|en'].wrong).toBe(1);
    expect(after.kv.overrides?.['ch12-04']?.ko?.alternates).toEqual(['숨기다']);
  });
  it('잘못된 백업은 거부', () => {
    expect(checkBackup('nope').ok).toBe(false);
    expect(checkBackup(JSON.stringify({ app: 'other' })).ok).toBe(false);
    const bad = makeBackup({ settings: DEFAULT_SETTINGS, overrides: {}, progress: { 'ch01-01|en': { stage: 9 } as any }, game: DEFAULT_GAME, exams: [] }, '1');
    expect(checkBackup(JSON.stringify(bad)).ok).toBe(false);
  });
});
