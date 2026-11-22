import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { transient } from '../session';
import { ITEM_BY_ID, mainAnswer } from '../core/data';
import { FRIENDS } from '../core/game';
import { MONSTERS } from '../core/monsters';
import { CAPTURE_BONUS } from '../core/streak';
import { MonsterArt, monInfo } from '../art/MonsterArt';
import { Friend } from '../art/Characters';
import { Btn, nav, DIR_ICON } from '../ui';
import { play } from '../sound';

/** 포획 이벤트 화면 (동물·과일 몬스터 공통) */
export function CaptureEvent({ id, onClose, first = true }: { id: string; onClose: () => void; first?: boolean }) {
  const f = monInfo(id);
  const app = useApp();
  useEffect(() => { play(f.rarity === 'common' ? 'combo' : 'overcome'); }, []);
  const count = MONSTERS.filter((m) => app.game.captured?.[m.id]).length;
  const bonus = first ? CAPTURE_BONUS[f.rarity] : 0;
  return (
    <div className={`capture-event cap-${f.rarity}`} role="dialog" aria-label="포획 성공" data-testid="capture-event">
      <div className="cap-rays" aria-hidden />
      <div className="cap-confetti" aria-hidden>{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ ['--x' as any]: `${(i * 37) % 100}%`, ['--d' as any]: `${(i % 6) * 0.15}s`, ['--c' as any]: ['#ffd23f', '#ff5d8f', '#4fd1ff', '#7cf7a0', '#c9a6ff'][i % 5] }} />)}</div>
      <div className="cap-body">
        <p className="cap-label">{f.rarity === 'legend' ? '🌟 LEGEND 포획 성공! 🌟' : f.rarity === 'rare' ? '✨ RARE 포획 성공! ✨' : '🎉 포획 성공!'}</p>
        <MonsterArt id={id} mood="happy" size={f.rarity === 'common' ? 220 : 280} className="cap-pop" />
        <h2 className="cap-name">{f.rarity === 'legend' ? '전설의 ' : ''}{f.name}</h2>
        <p className="cap-desc">{f.desc} · {f.rarityKo} 등급{f.where ? ` · ${f.where}` : ''}</p>
        <p className="cap-desc">{first ? '새 친구가 되었어요!' : '또 만났어요! 우정 레벨 업 (포획 횟수 +1)'}</p>
        <p className="chip gold">📚 동물 도감 {count} / {MONSTERS.length}{bonus ? ` · 🪙 +${bonus}` : ''}</p>
        <Btn kind="gold" onClick={onClose} data-testid="capture-ok">좋아!</Btn>
      </div>
    </div>
  );
}

export default function Result() {
  const app = useApp();
  const s = transient.summary;
  useEffect(() => { if (!s) nav(''); }, [s]);
  if (!s) return null;
  const correct = s.strict + s.relaxed + s.aided;
  return (
    <main className="screen result" data-testid="result">
      <h1 className="game-title small">{s.mode === 'wrong' ? '오답 추격 완료!' : s.mode === 'retry' ? '재도전 스테이지 완료!' : '탐험 완료!'}</h1>
      <div className="result-hero">
        <Friend id={app.game.friend!} deco={app.game.equipped} mood="cheer" size={150} className="jump" />
        {app.game.partner && <MonsterArt id={app.game.partner} size={120} mood="happy" label={false} className="jump" />}
      </div>
      <p className="big-stars" aria-label={`별 ${s.stars}개`}>{'⭐'.repeat(s.stars)}{'☆'.repeat(3 - s.stars)} <span className="small">별 {s.stars}개 · 최고 연속 {s.bestStreak}번</span></p>
      {s.captures.length > 0 ? (
        <section className="panel"><h3>🎯 이번에 포획한 친구 {s.captures.length}마리</h3>
          <div className="legend-row">{s.captures.map((c, i) => <div key={i} className="award"><MonsterArt id={c.id} size={90} label={false} /><small>{monInfo(c.id).name}{c.first ? ' 🆕' : ''}</small></div>)}</div>
        </section>
      ) : <p data-testid="escaped" className="small">이번엔 포획하지 못했어요. 연속 정답을 이어 가면 몬스터 친구를 만날 수 있어요!</p>}
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
        <section className="panel"><h3>📌 다음에 다시 만날 단어</h3>
          <ul>{s.carried.map(({ id, dir }) => { const it = ITEM_BY_ID[id]; return <li key={id + dir}>{DIR_ICON[dir]} Chapter {it.chapter}·{it.number}번 {it.englishDisplay} → <b>{mainAnswer(it, dir, app.overrides)}</b></li>; })}</ul>
          <p className="small">틀린 단어는 사라지지 않고 오답 추격·재도전 스테이지에서 다시 나와요.</p>
        </section>
      )}
      <div className="row wrap">
        {s.mode === 'explore' && <Btn kind="gold" data-testid="again" onClick={() => { transient.round = { ...transient.round!, mode: 'explore' }; nav('battle'); }}>⚔️ 한 번 더 탐험</Btn>}
        <Btn kind="secondary" onClick={() => nav('dex')}>📚 도감</Btn>
        <Btn kind="ghost" onClick={() => nav('')} data-testid="home">🏠 홈</Btn>
      </div>
    </main>
  );
}
