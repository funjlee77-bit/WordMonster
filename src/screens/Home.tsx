import { useApp } from '../store';
import { FRIENDS, levelOf } from '../core/game';
import { Friend } from '../art/Characters';
import { MonsterArt, monInfo } from '../art/MonsterArt';
import { Btn, nav, chapterStats } from '../ui';
import { CHAPTERS, ITEMS } from '../core/data';
import { localDate } from '../core/dates';
import { useOffline } from '../pwa';
import { transient } from '../session';
import { dirsFor } from './MapScreen';
import { MONSTERS } from '../core/monsters';
import { MISSIONS, freshDaily, pendingKeys, RETRY_UNLOCK } from '../core/streak';

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
  const got = MONSTERS.filter((m) => g.captured?.[m.id]).length;
  const pendingAll = pendingKeys(app.progress).length;
  const daily = g.daily && g.daily.date === today ? g.daily : freshDaily(today);
  const claim = (id: string, coins: number) => app.commit({}, { game: { ...g, coins: g.coins + coins, daily: { ...daily, claimed: [...daily.claimed, id] } } });
  return (
    <main className="screen home">
      <div className="home-top"><OfflineChip /><span className="row"><span className="chip gold" data-testid="home-dex">🐾 도감 {got}/{MONSTERS.length}</span><span className="chip coin">🪙 {g.coins}</span></span></div>
      <section className="hero">
        <div className="hero-pair">
          <Friend id={g.friend!} deco={g.equipped} mood={tot.pending + tot.due > 0 ? 'happy' : 'cheer'} size={170} className="bob" />
          {g.partner && <MonsterArt id={g.partner} size={110} label={false} mood="happy" className="bob" />}
        </div>
        <div>
          <p className="eyebrow">{g.nickname ? `${g.nickname}의 친구` : '나의 친구'}{g.partner ? ` · 동료 ${monInfo(g.partner).name}` : ''}</p>
          <h2>{f.name} <span className="muted">Lv.{lvl}</span></h2>
          <div className="xpbar" aria-label={`경험치 ${g.xp % 100}/100`}><i style={{ width: `${g.xp % 100}%` }} /></div>
          <p className="small">다음 레벨까지 {100 - (g.xp % 100)} 경험치 · 탐험 {g.rounds}번</p>
          <p className="bubble">{tot.pending + tot.due > 0 ? `오늘 다시 볼 단어가 ${tot.pending + tot.due}개 있어! 같이 하자!` : '좋아! 새 왕국을 탐험해 볼까?'}{!g.partner && got > 0 ? ' (도감에서 동료를 골라 데려갈 수 있어!)' : ''}</p>
        </div>
      </section>
      <section className="missions panel" data-testid="missions">
        <h3>📅 오늘의 미션</h3>
        {MISSIONS.map((m) => {
          const v = Math.min((daily as any)[m.key] as number, m.goal), done = v >= m.goal, claimed = daily.claimed.includes(m.id);
          return (
            <div key={m.id} className="mission">
              <span>{claimed ? '✅' : done ? '🎁' : '⬜'} {m.label}</span>
              <div className="xpbar small-bar"><i style={{ width: `${(v / m.goal) * 100}%` }} /></div>
              <span className="small">{v}/{m.goal}</span>
              {done && !claimed ? <Btn kind="gold" onClick={() => claim(m.id, m.coins)}>🪙 {m.coins} 받기</Btn> : <span className="small">{claimed ? '받음' : `🪙 ${m.coins}`}</span>}
            </div>
          );
        })}
      </section>
      <section className="today">
        <div><b>{tot.pending}</b><span>남은 오답</span></div>
        <div><b>{tot.due}</b><span>오늘 복습</span></div>
        <div><b>{tot.met}</b><span>만난 단어 /{ITEMS.length}</span></div>
        <div><b>{tot.both}</b><span>양방향 숙련</span></div>
      </section>
      <div className="menu-grid">
        <Btn kind="gold" className="big" onClick={() => nav('map')} data-testid="go-map">🗺️ 왕국 탐험<small>왕국 고르기 · 연속 정답으로 포획</small></Btn>
        <Btn kind={pendingAll >= RETRY_UNLOCK ? 'primary' : 'ghost'} className="big" data-testid="go-retry-home" onClick={() => { if (pendingAll >= RETRY_UNLOCK) { transient.round = { chapters: [], mode: 'retry', dirs: ['en', 'ko'] }; nav('battle'); } else nav('map'); }}>
          🔁 재도전 스테이지<small>{pendingAll >= RETRY_UNLOCK ? `열림! 오답 ${pendingAll}문제 · 5·10·15연속 포획` : `🔒 오답 ${pendingAll}/${RETRY_UNLOCK}개 모이면 열려요`}</small></Btn>
        <Btn kind="primary" className="big" data-testid="go-chase" onClick={() => {
          const sel = g.selection, selPending = sel.reduce((a, c) => a + chapterStats(c, app.progress, today).pending, 0);
          if (selPending > 0) { transient.round = { chapters: sel, mode: 'wrong', dirs: dirsFor(app.settings.dirMode) }; nav('battle'); } else nav('map?wrong');
        }}>👾 오답 몬스터 추격<small>고른 왕국의 오답만</small></Btn>
        <Btn kind="gold" className="big colosseum-btn" onClick={() => nav('endurance')} data-testid="go-endurance">🏟️ 끝장 콜로세움<small>{app.endurance ? (app.endurance.stage === 0 ? `이어하기 · ${app.endurance.main.filter((x) => x).length}/${app.endurance.order.length}` : `오답 스테이지 ${app.endurance.stage} 이어하기`) : '200문제 · 90점이면 레전드'}</small></Btn>
        <Btn kind="secondary" className="big" onClick={() => nav('cards')}>🃏 학습 카드<small>먼저 단어 보기</small></Btn>
        <Btn kind="secondary" className="big" onClick={() => nav('exam')} data-testid="go-exam">📝 학교 실전 모드<small>게임 없이 시험처럼</small></Btn>
        <Btn kind="secondary" className="big" onClick={() => nav('dex')} data-testid="go-dex">📚 도감·동료·꾸미기<small>잡은 친구 보기</small></Btn>
        <Btn kind="ghost" className="big" onClick={() => nav('parent')} data-testid="go-parent">🔒 부모 메뉴<small>기록·채점·백업</small></Btn>
      </div>
    </main>
  );
}
