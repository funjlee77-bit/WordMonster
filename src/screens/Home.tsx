import { useApp } from '../store';
import { FRIENDS, levelOf } from '../core/game';
import { Friend } from '../art/Characters';
import { Btn, nav, chapterStats } from '../ui';
import { CHAPTERS } from '../core/data';
import { localDate } from '../core/dates';
import { useOffline } from '../pwa';
import { FRUITS } from '../core/fruits';
import { scoreOf, correctCount } from '../core/endurance';
import { transient } from '../session';
import { dirsFor } from './MapScreen';

export function OfflineChip() {
  const o = useOffline();
  const map = { ready: ['ok', '✅ 오프라인 사용 준비 완료'], preparing: ['warn', '⏳ 오프라인 준비 중…'], failed: ['bad', '⚠️ 오프라인 준비 실패'], unsupported: ['bad', '⚠️ 오프라인 미지원 브라우저'], dev: ['warn', '🛠 개발 모드'] } as const;
  const [cls, txt] = map[o.status];
  return <button className={`chip status ${cls}`} onClick={() => nav('guide')} data-testid="offline-chip">{txt}</button>;
}

export default function Home() {
  const app = useApp();
  const g = app.game;
  const f = FRIENDS.find((x) => x.id === g.friend)!;
  const today = localDate();
  const tot = CHAPTERS.map((c) => chapterStats(c, app.progress, today)).reduce((a, s) => ({ pending: a.pending + s.pending, due: a.due + s.due, both: a.both + s.both, met: a.met + s.met }), { pending: 0, due: 0, both: 0, met: 0 });
  const lvl = levelOf(g.xp);
  const selPending = g.selection.reduce((a, c) => a + chapterStats(c, app.progress, today).pending, 0);
  return (
    <main className="screen home">
      <div className="home-top"><OfflineChip /><span className="row"><span className="chip gold" data-testid="home-dex">🍓 도감 {Object.keys(g.captured ?? {}).length}/{FRUITS.length}</span><span className="chip coin">🪙 {g.coins}</span></span></div>
      <section className="hero">
        <Friend id={g.friend!} deco={g.equipped} mood={tot.pending + tot.due > 0 ? 'happy' : 'cheer'} size={180} className="bob" />
        <div>
          <p className="eyebrow">{g.nickname ? `${g.nickname}의 친구` : '나의 친구'}</p>
          <h2>{f.name} <span className="muted">Lv.{lvl}</span></h2>
          <div className="xpbar" aria-label={`경험치 ${g.xp % 100}/100`}><i style={{ width: `${g.xp % 100}%` }} /></div>
          <p className="small">다음 레벨까지 {100 - (g.xp % 100)} 경험치 · 탐험 {g.rounds}번</p>
          <p className="bubble">{tot.pending + tot.due > 0 ? `오늘 다시 볼 단어가 ${tot.pending + tot.due}개 있어! 같이 하자!` : '좋아! 새 지역을 탐험해 볼까?'}</p>
        </div>
      </section>
      <section className="today">
        <div><b>{tot.pending}</b><span>남은 오답</span></div>
        <div><b>{tot.due}</b><span>오늘 복습</span></div>
        <div><b>{tot.met}</b><span>만난 단어 /500</span></div>
        <div><b>{tot.both}</b><span>양방향 숙련</span></div>
      </section>
      <div className="menu-grid">
        <Btn kind="gold" className="big" onClick={() => nav('map')} data-testid="go-map">🗺️ 탐험 떠나기<small>Chapter 고르기</small></Btn>
        <Btn kind="primary" className="big" data-testid="go-chase" onClick={() => {
          if (selPending > 0) { transient.round = { chapters: g.selection, mode: 'wrong', dirs: dirsFor(app.settings.dirMode) }; nav('battle'); }
          else nav('map?wrong');
        }}>👾 오답 몬스터 추격<small>{selPending > 0 ? `선택 범위 오답 ${selPending}개` : '오답 고르기'}</small></Btn>
        <Btn kind="gold" className="big colosseum-btn" onClick={() => nav('endurance')} data-testid="go-endurance">🏟️ 끝장 퀴즈<small>{app.endurance ? (app.endurance.stage === 0 ? `이어하기 · ${app.endurance.main.filter((x) => x).length}/500` : `오답 스테이지 ${app.endurance.stage} 이어하기`) : '500단어 전부 도전 · 레전드'}</small></Btn>
        <Btn kind="secondary" className="big" onClick={() => nav('cards')}>🃏 학습 카드<small>먼저 단어 보기</small></Btn>
        <Btn kind="secondary" className="big" onClick={() => nav('exam')} data-testid="go-exam">📝 학교 실전 모드<small>게임 없이 시험처럼</small></Btn>
        <Btn kind="secondary" className="big" onClick={() => nav('dex')}>📚 도감·꾸미기<small>코인으로 장식</small></Btn>
        <Btn kind="ghost" className="big" onClick={() => nav('parent')} data-testid="go-parent">🔒 부모 메뉴<small>기록·채점·백업</small></Btn>
      </div>
    </main>
  );
}
