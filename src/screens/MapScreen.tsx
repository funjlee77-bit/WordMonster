import { useState } from 'react';
import { useApp } from '../store';
import { REGIONS } from '../core/game';
import { CHAPTERS } from '../core/data';
import { localDate } from '../core/dates';
import { Btn, TopBar, nav, chapterStats, Modal } from '../ui';
import { Backdrop } from '../art/Characters';
import { transient } from '../session';
import type { Dir, Settings } from '../core/types';

export const dirsFor = (m: Settings['dirMode']): Dir[] => (m === 'mix' ? ['en', 'ko'] : [m]);

export default function MapScreen() {
  const app = useApp();
  const today = localDate();
  const [sel, setSel] = useState<number[]>(app.game.selection.length ? app.game.selection : [1]);
  const [msg, setMsg] = useState<string | null>(location.hash.includes('wrong') ? '선택한 범위에 남은 오답이 없어요. 다른 Chapter를 고르거나 "전체 Chapter 오답 복습"을 눌러 보세요.' : null);
  const stats = Object.fromEntries(CHAPTERS.map((c) => [c, chapterStats(c, app.progress, today)]));
  const toggle = (c: number) => setSel((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c].sort((a, b) => a - b)));
  const save = async (s = sel) => { await app.commit({}, { game: { ...app.game, selection: s } }); };
  const go = async (mode: 'explore' | 'wrong', chapters: number[]) => {
    if (!chapters.length) { setMsg('Chapter를 하나 이상 골라 주세요.'); return; }
    const pending = chapters.reduce((a, c) => a + stats[c].pending, 0);
    if (mode === 'wrong' && pending === 0) { setMsg(chapters.length === 25 ? '전체 Chapter에 남은 오답이 없어요! 일반 탐험으로 새 단어를 만나 볼까요?' : '선택한 범위에 남은 오답이 없어요. 일반 탐험으로 떠나 볼까요?'); return; }
    await save();
    transient.round = { chapters, mode, dirs: dirsFor(app.settings.dirMode) };
    nav('battle');
  };
  const selPending = sel.reduce((a, c) => a + stats[c].pending, 0);
  const allPending = CHAPTERS.reduce((a, c) => a + stats[c].pending, 0);
  return (
    <main className="screen map">
      <TopBar title="탐험 지도 · Chapter 고르기" />
      <p className="small">지역(Chapter)을 눌러 여러 개 고를 수 있어요. 처음부터 모든 지역을 고를 수 있어요. ⭐는 탐험 기록, 🏅는 단어 숙련이에요.</p>
      <div className="row wrap">
        <Btn kind="secondary" onClick={() => setSel(CHAPTERS.slice())}>전체 선택</Btn>
        <Btn kind="ghost" onClick={() => setSel([])}>선택 해제</Btn>
        <span className="chip">선택 {sel.length}개 지역</span>
      </div>
      <div className="region-grid">
        {CHAPTERS.map((c) => {
          const s = stats[c], R = REGIONS[c - 1], on = sel.includes(c), stars = app.game.chapterStars[c] ?? 0;
          return (
            <button key={c} className={`region ${on ? 'on' : ''}`} onClick={() => toggle(c)} aria-pressed={on} data-testid={`region-${c}`}>
              <Backdrop hue={R.hue} motif={R.motif} />
              <div className="region-body">
                <div className="region-head"><b>Chapter {c}</b>{on && <span className="chip ok">✔ 선택</span>}</div>
                <div className="region-name">{R.name}</div>
                <div className="stars" aria-label={`탐험 별 ${stars}개`}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)} <span className="small">탐험 {app.game.chapterClears[c] ?? 0}회</span></div>
                <div className="small">만난 단어 {s.met}/{s.total}</div>
                <div className="small">🏅 영어쓰기 {s.enM} · 뜻쓰기 {s.koM} · 양방향 {s.both}</div>
                <div className="small">{s.pending > 0 ? <span className="tag bad">👾 오답 {s.pending}</span> : <span className="tag">오답 0</span>} {s.due > 0 && <span className="tag warn">⏰ 오늘 복습 {s.due}</span>}</div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="action-bar">
        <Btn kind="gold" data-testid="start-explore" onClick={() => go('explore', sel)}>⚔️ 탐험 시작 ({app.settings.questionsPerRound}문제)</Btn>
        <Btn kind="secondary" onClick={async () => { await save(); nav('cards'); }}>🃏 학습 카드</Btn>
        <Btn kind="primary" onClick={() => go('wrong', sel)}>👾 이 범위 오답 추격 ({selPending})</Btn>
        <Btn kind="ghost" onClick={() => go('wrong', CHAPTERS.slice())}>🌍 전체 Chapter 오답 복습 ({allPending})</Btn>
      </div>
      {msg && <Modal onClose={() => setMsg(null)}><p>{msg}</p><Btn onClick={() => setMsg(null)}>확인</Btn></Modal>}
    </main>
  );
}
