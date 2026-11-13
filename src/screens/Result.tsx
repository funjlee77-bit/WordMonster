import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { transient } from '../session';
import { ITEM_BY_ID, mainAnswer } from '../core/data';
import { FRIENDS } from '../core/game';
import { FRUIT_BY_ID, RARITY_LABEL, FRUITS } from '../core/fruits';
import { captureRuleText } from '../core/capture';
import { Friend } from '../art/Characters';
import { FruitMonster } from '../art/FruitMonster';
import { Btn, nav, DIR_ICON } from '../ui';
import { play } from '../sound';

/** 포획 이벤트 화면 */
export function CaptureEvent({ id, onClose }: { id: string; onClose: () => void }) {
  const f = FRUIT_BY_ID[id];
  const app = useApp();
  useEffect(() => { play(f.rarity === 'common' ? 'combo' : 'overcome'); }, []);
  const count = Object.keys(app.game.captured ?? {}).length;
  return (
    <div className={`capture-event cap-${f.rarity}`} role="dialog" aria-label="포획 성공" data-testid="capture-event">
      <div className="cap-rays" aria-hidden />
      <div className="cap-confetti" aria-hidden>{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ ['--x' as any]: `${(i * 37) % 100}%`, ['--d' as any]: `${(i % 6) * 0.15}s`, ['--c' as any]: ['#ffd23f', '#ff5d8f', '#4fd1ff', '#7cf7a0', '#c9a6ff'][i % 5] }} />)}</div>
      <div className="cap-body">
        <p className="cap-label">{f.rarity === 'legend' ? '🌟 LEGEND 포획 성공! 🌟' : f.rarity === 'rare' ? '✨ RARE 포획 성공! ✨' : '🎉 포획 성공!'}</p>
        <FruitMonster def={f} mood="cheer" size={f.rarity === 'common' ? 220 : 280} className="cap-pop" />
        <h2 className="cap-name">{f.rarity === 'legend' ? '전설의 ' : ''}{f.name}</h2>
        <p className="cap-desc">{f.fruit} × {f.animal} · {RARITY_LABEL[f.rarity]} 등급</p>
        <p className="cap-desc">{f.desc}</p>
        <p className="chip gold">📚 도감 {count} / {FRUITS.length}{f.rarity !== 'common' ? ` · 보너스 🪙 +${f.rarity === 'legend' ? 50 : 20}` : ' · 🪙 +5'}</p>
        <Btn kind="gold" onClick={onClose} data-testid="capture-ok">도감에 등록하기</Btn>
      </div>
    </div>
  );
}

export default function Result() {
  const app = useApp();
  const s = transient.summary;
  const [showCap, setShowCap] = useState(!!s?.firstCapture);
  useEffect(() => { if (!s) nav(''); }, [s]);
  if (!s) return null;
  const f = FRUIT_BY_ID[s.enemy];
  const correct = s.strict + s.relaxed + s.aided;
  return (
    <main className="screen result" data-testid="result">
      {showCap && <CaptureEvent id={f.id} onClose={() => setShowCap(false)} />}
      <h1 className="game-title small">{s.mode === 'wrong' ? '오답 추격 완료!' : '탐험 완료!'}</h1>
      <div className="result-hero">
        <Friend id={app.game.friend!} deco={app.game.equipped} mood="cheer" size={150} className="jump" />
        <FruitMonster def={f} mood={s.captured ? 'happy' : 'hurt'} size={140} className={s.captured ? 'jump' : 'run'} />
      </div>
      <p className="big-stars" aria-label={`별 ${s.stars}개`}>{'⭐'.repeat(s.stars)}{'☆'.repeat(3 - s.stars)} <span className="small">별 {s.stars}개</span></p>
      {s.captured
        ? <p data-testid="captured">🎯 <b>{f.name}</b>{s.firstCapture ? '를 처음 포획했어요!' : '를 또 포획했어요! (포획 횟수 +1)'}</p>
        : <p data-testid="escaped">💨 <b>{f.name}</b>가 도망갔어요. 다음에 또 나타나요! <span className="small">({captureRuleText(f)})</span></p>}
      <div className="today">
        <div><b>{correct}/{s.total}</b><span>맞힌 문제</span></div>
        <div><b>+{s.xp}</b><span>경험치</span></div>
        <div><b>+{s.coins}</b><span>🪙 코인</span></div>
        <div><b>{s.strict}</b><span>혼자서 정답</span></div>
      </div>
      {s.levelUp && <p className="chip gold">🎉 레벨 업! {FRIENDS.find((x) => x.id === app.game.friend)!.name}가 더 강해졌어요!</p>}
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
        <Btn kind="secondary" onClick={() => nav('dex')}>📚 도감</Btn>
        <Btn kind="ghost" onClick={() => nav('')} data-testid="home">🏠 홈</Btn>
      </div>
    </main>
  );
}
