import { useState } from 'react';
import { useApp } from '../store';
import { DECOS, ENEMIES, FRIENDS } from '../core/game';
import { FRUITS, RARITY_LABEL, type Rarity, type FruitDef, type Zone } from '../core/fruits';
import { appearRuleText, captureRuleText } from '../core/capture';
import { Friend, Enemy } from '../art/Characters';
import { FruitMonster } from '../art/FruitMonster';
import { Btn, TopBar, Modal } from '../ui';
import type { DecoId, FriendId } from '../core/types';

export default function Dex() {
  const app = useApp(); const g = app.game;
  const [filter, setFilter] = useState<'all' | Rarity>('all');
  const [zone, setZone] = useState<Zone>('region');
  const [detail, setDetail] = useState<FruitDef | null>(null);
  const setG = (p: Partial<typeof g>) => app.commit({}, { game: { ...g, ...p } });
  const buy = (id: DecoId, price: number) => { if (g.coins >= price && !g.decorations.includes(id)) setG({ coins: g.coins - price, decorations: [...g.decorations, id], equipped: id }); };
  const cap = g.captured ?? {};
  const count = (r?: Rarity, z?: Zone) => FRUITS.filter((f) => (!r || f.rarity === r) && (!z || f.zone === z) && cap[f.id]).length;
  const zoneList = FRUITS.filter((f) => f.zone === zone);
  const list = zoneList.filter((f) => filter === 'all' || f.rarity === filter);
  const total = (r: Rarity) => zoneList.filter((f) => f.rarity === r).length;
  const oldMet = ENEMIES.filter((e) => g.dex[e.id]);
  return (
    <main className="screen dex">
      <TopBar title="도감 · 꾸미기" />
      <section className="panel">
        <h2>🍓 과일 몬스터 도감 <span className="chip gold" data-testid="dex-count">{count()} / {FRUITS.length}</span></h2>
        <div className="row wrap">
          <Btn kind={zone === 'region' ? 'gold' : 'ghost'} onClick={() => setZone('region')}>🗺️ 지역 몬스터 {count(undefined, 'region')}/50</Btn>
          <Btn kind={zone === 'colosseum' ? 'gold' : 'ghost'} onClick={() => setZone('colosseum')} data-testid="dex-colosseum">🏟️ 콜로세움 몬스터 {count(undefined, 'colosseum')}/60</Btn>
        </div>
        <p className="small">일반 {count('common', zone)}/{total('common')} · 희귀 {count('rare', zone)}/{total('rare')} · 전설 {count('legend', zone)}/{total('legend')} — {zone === 'region' ? '희귀·전설은 복습을 꾸준히 해야 나타나요.' : '끝장 퀴즈에서 만나요. 레전드는 90점 이상 보상이에요.'}</p>
        <div className="row wrap">
          {(['all', 'common', 'rare', 'legend'] as const).map((r) => <Btn key={r} kind={filter === r ? 'primary' : 'ghost'} onClick={() => setFilter(r)}>{r === 'all' ? '전체' : RARITY_LABEL[r]}</Btn>)}
        </div>
        <div className="fruit-grid">
          {list.map((f) => {
            const c = cap[f.id];
            return (
              <button key={f.id} className={`fruit-card r-${f.rarity} ${c ? 'got' : ''}`} onClick={() => setDetail(f)} data-testid={`fruit-${f.id}`}>
                <span className="fc-no">No.{String(FRUITS.indexOf(f) + 1).padStart(3, '0')} · {f.zone === 'region' ? `Ch.${f.chapter}` : '콜로세움'}</span>
                <FruitMonster def={f} size={110} silhouette={!c} aura={!!c} />
                <b>{c ? f.name : '???'}</b>
                <span className={`rar rar-${f.rarity}`}>{RARITY_LABEL[f.rarity]}</span>
              </button>
            );
          })}
        </div>
      </section>
      <section className="panel">
        <h2>꾸미기 <span className="chip coin">🪙 {g.coins}</span></h2>
        <p className="small">장식은 모습만 바꿔요. 문제를 대신 풀어 주지는 않아요.</p>
        <div className="deco-grid">
          <button className={`deco ${g.equipped === null ? 'on' : ''}`} onClick={() => setG({ equipped: null })}><Friend id={g.friend!} size={90} /><span>장식 없음</span></button>
          {DECOS.map((d) => {
            const own = g.decorations.includes(d.id);
            return (
              <button key={d.id} className={`deco ${g.equipped === d.id ? 'on' : ''}`} onClick={() => (own ? setG({ equipped: d.id }) : buy(d.id, d.price))} disabled={!own && g.coins < d.price}>
                <Friend id={g.friend!} deco={d.id} size={90} /><span>{d.name}</span>
                <small>{own ? (g.equipped === d.id ? '✔ 착용 중' : '눌러서 착용') : `🪙 ${d.price}${g.coins < d.price ? ' (코인 부족)' : ' 사기'}`}</small>
              </button>
            );
          })}
        </div>
      </section>
      <section className="panel">
        <h2>친구 몬스터</h2>
        <div className="deco-grid">
          {FRIENDS.map((f) => (
            <button key={f.id} className={`deco ${g.friend === f.id ? 'on' : ''}`} onClick={() => setG({ friend: f.id as FriendId })}>
              <Friend id={f.id} mood={g.friend === f.id ? 'cheer' : 'normal'} deco={g.equipped} size={100} /><span>{f.name}</span><small>{f.kind}{g.friend === f.id ? ' · 함께하는 중' : ''}</small>
            </button>
          ))}
        </div>
      </section>
      {oldMet.length > 0 && (
        <section className="panel">
          <h2>처음 만났던 몬스터</h2>
          <div className="deco-grid">{oldMet.map((e) => <div key={e.id} className="deco static"><Enemy id={e.id} size={90} /><span>{e.name}</span><small>만남 {g.dex[e.id]!.met}</small></div>)}</div>
        </section>
      )}
      {detail && (
        <Modal onClose={() => setDetail(null)}>
          <div className="fruit-detail">
            <FruitMonster def={detail} size={220} silhouette={!cap[detail.id]} aura={!!cap[detail.id]} mood={cap[detail.id] ? 'happy' : 'normal'} />
            <h2>{cap[detail.id] ? detail.name : '???'} <span className={`rar rar-${detail.rarity}`}>{RARITY_LABEL[detail.rarity]}</span></h2>
            {cap[detail.id] ? (
              <>
                <p>{detail.fruit} × {detail.animal}</p><p>{detail.desc}</p>
                <p className="small">처음 포획: {new Date(cap[detail.id].at).toLocaleDateString('ko-KR')} · 포획 {cap[detail.id].count}번 · 만남 {g.fruitMet?.[detail.id] ?? 0}번</p>
              </>
            ) : (
              <>
                <p>📍 {detail.zone === 'region' ? `Chapter ${detail.chapter}에 살아요.` : '끝장 퀴즈 콜로세움에 살아요.'}</p>
                <p className="small">🔎 나타나는 조건: {appearRuleText(detail, app.progress)}</p>
                <p className="small">🎯 포획 조건: {captureRuleText(detail)}</p>
              </>
            )}
            <Btn onClick={() => setDetail(null)}>닫기</Btn>
          </div>
        </Modal>
      )}
    </main>
  );
}
