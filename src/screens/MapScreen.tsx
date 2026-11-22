import { useState } from 'react';
import { useApp } from '../store';
import { localDate } from '../core/dates';
import { Btn, TopBar, nav, chapterStats, Modal } from '../ui';
import { Backdrop } from '../art/Characters';
import { MonsterArt } from '../art/MonsterArt';
import { transient } from '../session';
import { KINGDOMS, chaptersOfKingdoms, questionsForKingdoms } from '../core/kingdoms';
import { MONSTERS } from '../core/monsters';
import { pendingKeys, RETRY_UNLOCK } from '../core/streak';
import { REGIONS } from '../core/game';
import type { Dir, Settings } from '../core/types';

export const dirsFor = (m: Settings['dirMode']): Dir[] => (m === 'mix' ? ['en', 'ko'] : [m]);

export default function MapScreen() {
  const app = useApp();
  const today = localDate();
  const initial = Array.from(new Set(app.game.selection.map((c) => Math.ceil(c / 5)))).filter((k) => k <= KINGDOMS.length);
  const [sel, setSel] = useState<number[]>(initial.length ? initial : [1]);
  const [open, setOpen] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(location.hash.includes('wrong') ? '선택한 왕국에 남은 오답이 없어요. 다른 왕국을 고르거나 일반 탐험을 떠나 보세요.' : null);
  const toggle = (k: number) => setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k].sort((a, b) => a - b)));
  const stat = (chs: number[]) => chs.map((c) => chapterStats(c, app.progress, today)).reduce((a, s) => ({ met: a.met + s.met, total: a.total + s.total, both: a.both + s.both, pending: a.pending + s.pending, due: a.due + s.due }), { met: 0, total: 0, both: 0, pending: 0, due: 0 });
  const chapters = chaptersOfKingdoms(sel);
  const selStat = stat(chapters);
  const pendingAll = pendingKeys(app.progress).length;
  const go = async (mode: 'explore' | 'wrong') => {
    if (!sel.length) { setMsg('왕국을 하나 이상 골라 주세요.'); return; }
    if (mode === 'wrong' && selStat.pending === 0) { setMsg('선택한 왕국에 남은 오답이 없어요! 탐험으로 새 단어를 만나 볼까요?'); return; }
    await app.commit({}, { game: { ...app.game, selection: chapters } });
    transient.round = { chapters, mode, dirs: dirsFor(app.settings.dirMode), kingdoms: sel };
    nav('battle');
  };
  return (
    <main className="screen map">
      <TopBar title="🗺️ 왕국 지도" />
      <p className="small">왕국을 눌러 고르세요. 여러 왕국을 고르면 문제가 늘어나요 (1개 50문제, 하나 더할 때마다 +10, 6개 100문제). 연속 정답으로 그 왕국의 몬스터 친구를 포획해요.</p>
      <div className="row wrap">
        <Btn kind="secondary" onClick={() => setSel(KINGDOMS.map((k) => k.no))}>전체 선택</Btn>
        <Btn kind="ghost" onClick={() => setSel([])}>선택 해제</Btn>
        <span className="chip">선택 {sel.length}개 왕국 · {questionsForKingdoms(sel.length)}문제</span>
      </div>
      <div className="kingdom-grid">
        {KINGDOMS.map((k) => {
          const s = stat(k.chapters), on = sel.includes(k.no);
          const mons = MONSTERS.filter((m) => m.kingdom === k.no), got = mons.filter((m) => app.game.captured?.[m.id]).length;
          const legends = mons.filter((m) => m.tier === 'legend');
          return (
            <div key={k.no} className={`kingdom ${on ? 'on' : ''}`}>
              <button className="kingdom-main" onClick={() => toggle(k.no)} aria-pressed={on} data-testid={`kingdom-${k.no}`}>
                <Backdrop hue={k.hue} motif={k.motif} />
                <div className="region-body">
                  <div className="region-head"><b>{k.no}스테이지 · {k.chapters[0]}~{k.chapters[k.chapters.length - 1]}과</b>{on && <span className="chip ok">✔ 선택</span>}</div>
                  <div className="region-name">{k.name} {got === mons.length && mons.length > 0 && <span title="왕국 정복 배지">🏆</span>}</div>
                  <div className="small">{k.desc}</div>
                  <div className="small">📚 친구 {got}/{mons.length} · 만난 단어 {s.met}/{s.total} · 🏅 양방향 숙련 {s.both}</div>
                  <div className="small">{s.pending > 0 ? <span className="tag bad">👾 오답 {s.pending}</span> : <span className="tag">오답 0</span>} {s.due > 0 && <span className="tag warn">⏰ 오늘 복습 {s.due}</span>}</div>
                  <div className="legend-row left">{legends.map((m) => <MonsterArt key={m.id} id={m.id} size={40} label={false} silhouette={!app.game.captured?.[m.id]} />)}</div>
                </div>
              </button>
              <Btn kind="ghost" className="kingdom-more" onClick={() => setOpen(open === k.no ? null : k.no)}>{open === k.no ? '접기' : '과별 보기'}</Btn>
              {open === k.no && (
                <div className="chapter-mini">
                  {k.chapters.map((c) => { const cs = chapterStats(c, app.progress, today); return <div key={c} className="small">Chapter {c} {REGIONS[c - 1]?.name ?? ''} · 만남 {cs.met}/20 · 숙련 {cs.both} · 오답 {cs.pending} · ⭐{app.game.chapterStars[c] ?? 0}</div>; })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="action-bar">
        <Btn kind="gold" data-testid="start-explore" onClick={() => go('explore')}>⚔️ 탐험 시작 ({questionsForKingdoms(sel.length)}문제)</Btn>
        <Btn kind="primary" onClick={() => go('wrong')}>👾 이 왕국 오답 추격 ({selStat.pending})</Btn>
        <Btn kind={pendingAll >= RETRY_UNLOCK ? 'secondary' : 'ghost'} data-testid="go-retry" onClick={() => { if (pendingAll < RETRY_UNLOCK) { setMsg(`재도전 스테이지는 쌓인 오답이 ${RETRY_UNLOCK}개가 되면 열려요. (지금 ${pendingAll}개)`); return; } transient.round = { chapters: [], mode: 'retry', dirs: ['en', 'ko'] }; nav('battle'); }}>🔁 재도전 스테이지 {pendingAll >= RETRY_UNLOCK ? `(${pendingAll}문제)` : `🔒 ${pendingAll}/${RETRY_UNLOCK}`}</Btn>
        <Btn kind="ghost" onClick={async () => { await app.commit({}, { game: { ...app.game, selection: chapters.length ? chapters : [1] } }); nav('cards'); }}>🃏 학습 카드</Btn>
      </div>
      {msg && <Modal onClose={() => setMsg(null)}><p>{msg}</p><Btn onClick={() => setMsg(null)}>확인</Btn></Modal>}
    </main>
  );
}
