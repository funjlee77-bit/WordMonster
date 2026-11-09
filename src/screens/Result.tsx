import { useApp } from '../store';
import { transient } from '../session';
import { ITEM_BY_ID, mainAnswer } from '../core/data';
import { ENEMIES, FRIENDS } from '../core/game';
import { Friend, Enemy } from '../art/Characters';
import { Btn, nav, DIR_ICON } from '../ui';
import type { EnemyId } from '../core/types';

export default function Result() {
  const app = useApp();
  const s = transient.summary;
  if (!s) { nav(''); return null; }
  const enemy = ENEMIES.find((e) => e.id === s.enemy)!;
  const correct = s.strict + s.relaxed + s.aided;
  return (
    <main className="screen result" data-testid="result">
      <h1 className="game-title small">{s.mode === 'wrong' ? '오답 추격 완료!' : '탐험 완료!'}</h1>
      <div className="result-hero">
        <Friend id={app.game.friend!} deco={app.game.equipped} mood="cheer" size={150} className="jump" />
        <Enemy id={enemy.id as EnemyId} mood="hurt" size={110} className={s.defeated ? 'defeated' : 'run'} />
      </div>
      <p className="big-stars" aria-label={`별 ${s.stars}개`}>{'⭐'.repeat(s.stars)}{'☆'.repeat(3 - s.stars)} <span className="small">별 {s.stars}개</span></p>
      <p>{s.defeated ? `${enemy.name}를 물리쳤어요!` : `${enemy.name}가 도망갔어요. 다음엔 꼭 잡자!`} {s.newDex && <span className="chip gold">📚 도감에 새로 등록!</span>}</p>
      <div className="today">
        <div><b>{correct}/{s.total}</b><span>맞힌 문제</span></div>
        <div><b>+{s.xp}</b><span>경험치</span></div>
        <div><b>+{s.coins}</b><span>🪙 코인</span></div>
        <div><b>{s.strict}</b><span>혼자서 정답</span></div>
      </div>
      {s.levelUp && <p className="chip gold">🎉 레벨 업! {FRIENDS.find((f) => f.id === app.game.friend)!.name}가 더 강해졌어요!</p>}
      {(s.relaxed > 0 || s.aided > 0) && <p className="small">도움을 받은 정답 {s.aided}개 · 완화 채점 정답 {s.relaxed}개는 숙련도에 들어가지 않아요.</p>}
      {!s.saved && <p className="tag bad">⚠️ 보상을 저장하지 못했어요. 부모 메뉴에서 백업해 주세요.</p>}
      {s.overcame.length > 0 && (
        <section className="panel"><h3>💪 지난번보다 강해진 단어</h3>
          <ul>{s.overcame.map((k) => { const [id, d] = k.split('|') as [string, 'en' | 'ko']; const it = ITEM_BY_ID[id]; return <li key={k}>{DIR_ICON[d]} {it.englishDisplay} — {it.koreanAnswer}</li>; })}</ul>
        </section>
      )}
      {s.carried.length > 0 && (
        <section className="panel"><h3>📌 다음 탐험에서 다시 만날 단어</h3>
          <ul>{s.carried.map(({ id, dir }) => { const it = ITEM_BY_ID[id]; return <li key={id + dir}>{DIR_ICON[dir]} Chapter {it.chapter}·{it.number}번 {it.englishDisplay} → <b>{mainAnswer(it, dir, app.overrides)}</b></li>; })}</ul>
          <p className="small">틀린 단어는 사라지지 않고 다음 탐험·오답 추격에서 먼저 나와요.</p>
        </section>
      )}
      <div className="row wrap">
        <Btn kind="gold" data-testid="again" onClick={() => { transient.round = { chapters: s.chapters, mode: 'explore', dirs: transient.round?.dirs ?? ['en', 'ko'] }; nav('battle'); }}>⚔️ 한 번 더 탐험</Btn>
        <Btn kind="secondary" onClick={() => nav('map')}>🗺️ 지도</Btn>
        <Btn kind="ghost" onClick={() => nav('')} data-testid="home">🏠 홈</Btn>
      </div>
    </main>
  );
}
