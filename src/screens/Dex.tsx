import { useState } from 'react';
import { useApp } from '../store';
import { DECOS, ENEMIES, FRIENDS } from '../core/game';
import { FRUITS } from '../core/fruits';
import { MONSTERS, MON_BY_ID, type MTier } from '../core/monsters';
import { KINGDOMS } from '../core/kingdoms';
import { TH_NORMAL } from '../core/streak';
import { Friend, Enemy } from '../art/Characters';
import { MonsterArt, monInfo } from '../art/MonsterArt';
import { Btn, TopBar, Modal } from '../ui';
import type { DecoId, FriendId } from '../core/types';

const TIER_KO: Record<MTier, string> = { common: '일반', rare: '희귀', legend: '레전드' };

export default function Dex() {
  const app = useApp(); const g = app.game;
  const [kingdom, setKingdom] = useState<number>(1);
  const [filter, setFilter] = useState<'all' | MTier>('all');
  const [detail, setDetail] = useState<string | null>(null);
  const setG = (p: Partial<typeof g>) => app.commit({}, { game: { ...g, ...p } });
  const buy = (id: DecoId, price: number) => { if (g.coins >= price && !g.decorations.includes(id)) setG({ coins: g.coins - price, decorations: [...g.decorations, id], equipped: id }); };
  const cap = g.captured ?? {};
  const got = MONSTERS.filter((m) => cap[m.id]).length;
  const list = MONSTERS.filter((m) => m.kingdom === kingdom && (filter === 'all' || m.tier === filter));
  const kMons = MONSTERS.filter((m) => m.kingdom === kingdom);
  const fruitsGot = FRUITS.filter((f) => cap[f.id]);
  const oldMet = ENEMIES.filter((e) => g.dex[e.id]);
  const d = detail ? MON_BY_ID[detail] : null;
  return (
    <main className="screen dex">
      <TopBar title="도감 · 동료 · 꾸미기" />
      <section className="panel">
        <h2>🐾 몬스터 친구 도감 <span className="chip gold" data-testid="dex-count">{got} / {MONSTERS.length}</span></h2>
        <div className="chapter-tabs">{KINGDOMS.map((k) => { const n = MONSTERS.filter((m) => m.kingdom === k.no), c = n.filter((m) => cap[m.id]).length; return <button key={k.no} className={`tab wide ${kingdom === k.no ? 'on' : ''}`} onClick={() => setKingdom(k.no)} data-testid={`dex-k-${k.no}`}>{k.no}. {k.name} {c}/{n.length}{c === n.length && n.length ? ' 🏆' : ''}</button>; })}</div>
        <p className="small">일반 {kMons.filter((m) => m.tier === 'common' && cap[m.id]).length}/{kMons.filter((m) => m.tier === 'common').length} · 희귀 {kMons.filter((m) => m.tier === 'rare' && cap[m.id]).length}/{kMons.filter((m) => m.tier === 'rare').length} · 레전드 {kMons.filter((m) => m.tier === 'legend' && cap[m.id]).length}/{kMons.filter((m) => m.tier === 'legend').length} — 이 왕국을 탐험하며 연속 정답 {TH_NORMAL.common}·{TH_NORMAL.rare}·{TH_NORMAL.legend}번으로 만나요.</p>
        <div className="row wrap">{(['all', 'common', 'rare', 'legend'] as const).map((r) => <Btn key={r} kind={filter === r ? 'primary' : 'ghost'} onClick={() => setFilter(r)}>{r === 'all' ? '전체' : TIER_KO[r]}</Btn>)}</div>
        <div className="fruit-grid">
          {list.map((m) => (
            <button key={m.id} className={`fruit-card r-${m.tier} ${cap[m.id] ? 'got' : ''} ${g.partner === m.id ? 'partner-on' : ''}`} onClick={() => setDetail(m.id)} data-testid={`mon-${m.id}`}>
              <span className="fc-no">{m.id}{g.partner === m.id ? ' · 동료' : ''}</span>
              <MonsterArt id={m.id} size={100} label={false} silhouette={!cap[m.id]} />
              <b>{cap[m.id] ? m.name : '???'}</b>
              <span className={`rar rar-${m.tier}`}>{TIER_KO[m.tier]}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>꾸미기 <span className="chip coin">🪙 {g.coins}</span></h2>
        <p className="small">장식은 모습만 바꿔요. 문제를 대신 풀어 주지는 않아요.</p>
        <div className="deco-grid">
          <button className={`deco ${g.equipped === null ? 'on' : ''}`} onClick={() => setG({ equipped: null })}><Friend id={g.friend!} size={90} /><span>장식 없음</span></button>
          {DECOS.map((dc) => {
            const own = g.decorations.includes(dc.id);
            return (
              <button key={dc.id} className={`deco ${g.equipped === dc.id ? 'on' : ''}`} onClick={() => (own ? setG({ equipped: dc.id }) : buy(dc.id, dc.price))} disabled={!own && g.coins < dc.price}>
                <Friend id={g.friend!} deco={dc.id} size={90} /><span>{dc.name}</span>
                <small>{own ? (g.equipped === dc.id ? '✔ 착용 중' : '눌러서 착용') : `🪙 ${dc.price}${g.coins < dc.price ? ' (코인 부족)' : ' 사기'}`}</small>
              </button>
            );
          })}
        </div>
      </section>
      <section className="panel">
        <h2>처음 친구</h2>
        <div className="deco-grid">
          {FRIENDS.map((f) => (
            <button key={f.id} className={`deco ${g.friend === f.id ? 'on' : ''}`} onClick={() => setG({ friend: f.id as FriendId })}>
              <Friend id={f.id} mood={g.friend === f.id ? 'cheer' : 'normal'} deco={g.equipped} size={100} /><span>{f.name}</span><small>{f.kind}{g.friend === f.id ? ' · 함께하는 중' : ''}</small>
            </button>
          ))}
        </div>
      </section>
      {(fruitsGot.length > 0 || oldMet.length > 0) && (
        <section className="panel">
          <h2>🍓 예전 친구들 (과일 몬스터)</h2>
          <p className="small">이전 버전에서 모은 친구들이에요. 그대로 보관돼요.</p>
          <div className="deco-grid">
            {fruitsGot.map((f) => <button key={f.id} className="deco" onClick={() => setDetail(f.id)}><MonsterArt id={f.id} size={90} label={false} /><span>{f.name}</span><small>포획 {cap[f.id].count}번</small></button>)}
            {oldMet.map((e) => <div key={e.id} className="deco static"><Enemy id={e.id} size={90} /><span>{e.name}</span><small>만남 {g.dex[e.id]!.met}</small></div>)}
          </div>
        </section>
      )}
      {detail && (
        <Modal onClose={() => setDetail(null)}>
          <div className="fruit-detail">
            <MonsterArt id={detail} size={220} silhouette={!cap[detail]} mood={cap[detail] ? 'happy' : 'normal'} />
            <h2>{cap[detail] ? monInfo(detail).name : '???'} <span className={`rar rar-${monInfo(detail).rarity}`}>{monInfo(detail).rarityKo}</span></h2>
            {cap[detail] ? (
              <>
                <p>{monInfo(detail).desc}{d ? ` · ${d.nameEn}` : ''}</p>
                <p className="small">처음 포획: {new Date(cap[detail].at).toLocaleDateString('ko-KR')} · 포획 {cap[detail].count}번 · {monInfo(detail).where}</p>
                {d && (g.partner === detail
                  ? <Btn kind="ghost" onClick={() => setG({ partner: null })}>동료에서 쉬게 하기</Btn>
                  : <Btn kind="gold" data-testid="set-partner" onClick={() => { setG({ partner: detail }); setDetail(null); }}>🤝 동료로 데려가기</Btn>)}
              </>
            ) : d ? (
              <>
                <p>📍 {KINGDOMS[d.kingdom - 1]?.name}에 살아요.</p>
                <p className="small">🎯 {KINGDOMS[d.kingdom - 1]?.name}을(를) 탐험하며 연속 정답 {d.tier === 'common' ? TH_NORMAL.common : d.tier === 'rare' ? TH_NORMAL.rare : TH_NORMAL.legend}번이면 만날 수 있어요. 재도전 스테이지·끝장 콜로세움에서도 만날 수 있어요.</p>
              </>
            ) : null}
            <Btn onClick={() => setDetail(null)}>닫기</Btn>
          </div>
        </Modal>
      )}
    </main>
  );
}
