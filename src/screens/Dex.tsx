import { useApp } from '../store';
import { DECOS, ENEMIES, FRIENDS } from '../core/game';
import { Friend, Enemy } from '../art/Characters';
import { Btn, TopBar } from '../ui';
import type { DecoId, FriendId } from '../core/types';

export default function Dex() {
  const app = useApp(); const g = app.game;
  const setG = (p: Partial<typeof g>) => app.commit({}, { game: { ...g, ...p } });
  const buy = (id: DecoId, price: number) => { if (g.coins >= price && !g.decorations.includes(id)) setG({ coins: g.coins - price, decorations: [...g.decorations, id], equipped: id }); };
  return (
    <main className="screen dex">
      <TopBar title="도감 · 꾸미기" />
      <section className="panel">
        <h2>꾸미기 <span className="chip coin">🪙 {g.coins}</span></h2>
        <p className="small">장식은 모습만 바꿔요. 문제를 대신 풀어 주지는 않아요.</p>
        <div className="deco-grid">
          <button className={`deco ${g.equipped === null ? 'on' : ''}`} onClick={() => setG({ equipped: null })}>
            <Friend id={g.friend!} size={90} /><span>장식 없음</span>
          </button>
          {DECOS.map((d) => {
            const own = g.decorations.includes(d.id);
            return (
              <button key={d.id} className={`deco ${g.equipped === d.id ? 'on' : ''}`} onClick={() => (own ? setG({ equipped: d.id }) : buy(d.id, d.price))} disabled={!own && g.coins < d.price}>
                <Friend id={g.friend!} deco={d.id} size={90} />
                <span>{d.name}</span>
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
              <Friend id={f.id} mood={g.friend === f.id ? 'cheer' : 'normal'} deco={g.equipped} size={100} />
              <span>{f.name}</span><small>{f.kind}{g.friend === f.id ? ' · 함께하는 중' : ''}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>상대 몬스터 도감</h2>
        <div className="deco-grid">
          {ENEMIES.map((e) => {
            const r = g.dex[e.id];
            return (
              <div key={e.id} className="deco static">
                <Enemy id={e.id} size={100} silhouette={!r} />
                <span>{r ? e.name : '???'}</span>
                <small>{r ? `${e.desc} · 만남 ${r.met} · 물리침 ${r.defeated}` : '아직 못 만났어요'}</small>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
