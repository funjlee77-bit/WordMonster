// 직접 그린 SVG 캐릭터 (외부 이미지 없음)
import type { DecoId, EnemyId, FriendId } from '../core/types';

export type Mood = 'normal' | 'happy' | 'cheer' | 'hurt';

export function Eyes({ x1, x2, y, r = 9, mood, color = '#1d1b2f' }: { x1: number; x2: number; y: number; r?: number; mood: Mood; color?: string }) {
  if (mood === 'happy')
    return (
      <g stroke={color} strokeWidth={4} fill="none" strokeLinecap="round">
        <path d={`M${x1 - r} ${y + 2} Q${x1} ${y - r - 2} ${x1 + r} ${y + 2}`} />
        <path d={`M${x2 - r} ${y + 2} Q${x2} ${y - r - 2} ${x2 + r} ${y + 2}`} />
      </g>
    );
  if (mood === 'hurt')
    return (
      <g stroke={color} strokeWidth={4} fill="none" strokeLinecap="round">
        <path d={`M${x1 - r * 0.8} ${y - r * 0.6} L${x1 + r * 0.6} ${y} L${x1 - r * 0.8} ${y + r * 0.6}`} />
        <path d={`M${x2 + r * 0.8} ${y - r * 0.6} L${x2 - r * 0.6} ${y} L${x2 + r * 0.8} ${y + r * 0.6}`} />
      </g>
    );
  if (mood === 'cheer')
    return (
      <g fill={color}>
        {[x1, x2].map((x) => (
          <g key={x}>
            <circle cx={x} cy={y} r={r} />
            <path d={`M${x} ${y - r * 0.75} L${x + r * 0.22} ${y - r * 0.2} L${x + r * 0.75} ${y} L${x + r * 0.22} ${y + r * 0.2} L${x} ${y + r * 0.75} L${x - r * 0.22} ${y + r * 0.2} L${x - r * 0.75} ${y} L${x - r * 0.22} ${y - r * 0.2}Z`} fill="#fff6a8" />
          </g>
        ))}
      </g>
    );
  return (
    <g>
      {[x1, x2].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx={r * 0.85} ry={r} fill={color} />
          <circle cx={x + r * 0.3} cy={y - r * 0.4} r={r * 0.32} fill="#fff" />
          <circle cx={x - r * 0.25} cy={y + r * 0.35} r={r * 0.15} fill="#fff" opacity={0.7} />
        </g>
      ))}
    </g>
  );
}

export function Mouth({ x, y, mood, w = 12 }: { x: number; y: number; mood: Mood; w?: number }) {
  if (mood === 'cheer' || mood === 'happy')
    return (
      <g>
        <path d={`M${x - w} ${y} Q${x} ${y + w * 1.4} ${x + w} ${y} Z`} fill="#7a2335" />
        <path d={`M${x - w * 0.5} ${y + w * 0.6} Q${x} ${y + w * 0.3} ${x + w * 0.5} ${y + w * 0.6} Q${x} ${y + w * 1.05} ${x - w * 0.5} ${y + w * 0.6}`} fill="#ff8a9a" />
      </g>
    );
  if (mood === 'hurt') return <path d={`M${x - w * 0.7} ${y + 4} Q${x} ${y - 3} ${x + w * 0.7} ${y + 4}`} stroke="#3a2030" strokeWidth={3.5} fill="none" strokeLinecap="round" />;
  return <path d={`M${x - w * 0.6} ${y} Q${x} ${y + w * 0.7} ${x + w * 0.6} ${y}`} stroke="#3a2030" strokeWidth={3.5} fill="none" strokeLinecap="round" />;
}

/* ───── 친구 몬스터 ───── */
function Lumo({ mood }: { mood: Mood }) {
  return (
    <g>
      {/* 꼬리 + 등불 */}
      <path d="M118 150 C160 158 182 132 172 100 C166 82 150 80 148 66" stroke="#ff7a59" strokeWidth={16} fill="none" strokeLinecap="round" />
      <path d="M118 150 C160 158 182 132 172 100 C166 82 150 80 148 66" stroke="#ffb199" strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray="2 12" />
      <circle cx={148} cy={52} r={22} fill="#ffe680" opacity={0.35} className="glow" />
      <path d="M140 40 Q148 28 156 40 L159 60 Q148 70 137 60Z" fill="#ffd23f" stroke="#e07b00" strokeWidth={3} />
      <path d="M144 46 Q148 40 152 46 L153 56 Q148 60 143 56Z" fill="#fff7c2" />
      <rect x={141} y={60} width={14} height={6} rx={2} fill="#8a4b2a" />
      {/* 다리 */}
      <path d="M78 160 q-4 22 -14 26 h24 q2 -12 6 -24" fill="#e85d3f" />
      <path d="M112 160 q4 22 14 26 h-24 q-2 -12 -6 -24" fill="#e85d3f" />
      {/* 몸 */}
      <ellipse cx={96} cy={140} rx={40} ry={36} fill="#ff7a59" />
      <ellipse cx={96} cy={148} rx={26} ry={24} fill="#ffd1b8" />
      {[0, 1, 2].map((i) => <path key={i} d={`M${82 + i * 0} ${136 + i * 9} h28`} stroke="#ffb199" strokeWidth={2} />)}
      {/* 팔 */}
      <path d="M58 128 q-20 4 -22 22 q8 2 12 -6 q6 -8 14 -8" fill="#e85d3f" />
      <path d="M134 128 q20 4 22 22 q-8 2 -12 -6 q-6 -8 -14 -8" fill="#e85d3f" />
      {/* 아가미 깃 */}
      {[-1, 1].map((s) => (
        <g key={s} fill="#ff6fa8">
          <path d={`M${96 + s * 46} 70 q${s * 22} -14 ${s * 26} -2 q${s * -8} 6 ${s * -24} 10Z`} />
          <path d={`M${96 + s * 48} 84 q${s * 26} -2 ${s * 26} 12 q${s * -10} 2 ${s * -24} -2Z`} />
          <path d={`M${96 + s * 44} 98 q${s * 22} 8 ${s * 18} 20 q${s * -8} -2 ${s * -18} -10Z`} />
        </g>
      ))}
      {/* 머리 */}
      <ellipse cx={96} cy={86} rx={50} ry={40} fill="#ff8c69" />
      <ellipse cx={96} cy={100} rx={34} ry={18} fill="#ffc3a6" />
      <circle cx={72} cy={60} r={4} fill="#ffcf5c" /><circle cx={118} cy={58} r={3} fill="#ffcf5c" /><circle cx={96} cy={52} r={3.5} fill="#ffcf5c" />
      <Eyes x1={76} x2={116} y={84} r={10} mood={mood} />
      <circle cx={62} cy={100} r={7} fill="#ff5d7a" opacity={0.45} /><circle cx={130} cy={100} r={7} fill="#ff5d7a" opacity={0.45} />
      <Mouth x={96} y={100} mood={mood} />
    </g>
  );
}

function Moko({ mood }: { mood: Mood }) {
  return (
    <g>
      {/* 다리 */}
      {[56, 82, 112, 138].map((x) => <rect key={x} x={x - 9} y={160} width={18} height={24} rx={8} fill="#8a6447" />)}
      {/* 등껍질 */}
      <path d="M30 160 Q30 70 100 66 Q170 70 170 160 Z" fill="#5f8f7a" />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${44 + i * 4} 160 Q${48 + i * 4} ${96 + i * 4} ${100} ${92 + i * 0}`} stroke="#3f6b58" strokeWidth={0} fill="none" />
      ))}
      {[52, 76, 100, 124, 148].map((x, i) => (
        <path key={x} d={`M${x} ${158} Q${x + (100 - x) * 0.25} ${84 + Math.abs(2 - i) * 10} ${x + (100 - x) * 0.5} ${72 + Math.abs(2 - i) * 6}`} stroke="#3f6b58" strokeWidth={5} fill="none" strokeLinecap="round" />
      ))}
      <path d="M30 160 Q100 150 170 160" stroke="#3f6b58" strokeWidth={6} fill="none" />
      {/* 이끼와 새싹 */}
      <path d="M58 86 q10 -16 26 -12 q8 -14 24 -6 q14 -8 26 6 q14 2 12 16 q-48 -12 -88 -4Z" fill="#9ed36a" />
      <circle cx={70} cy={84} r={5} fill="#c6ef8c" /><circle cx={128} cy={82} r={6} fill="#c6ef8c" />
      <path d="M100 66 Q98 46 100 34" stroke="#4e9a3a" strokeWidth={4} fill="none" />
      <path d="M100 46 q-18 -10 -24 -2 q10 10 24 2Z" fill="#7ccf4f" />
      <path d="M100 38 q16 -14 24 -6 q-8 12 -24 6Z" fill="#7ccf4f" />
      <g transform="translate(134 62)">
        {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-6} rx={4} ry={6} fill="#ffd6e8" transform={`rotate(${a})`} />)}
        <circle r={3.5} fill="#ffb83f" />
      </g>
      <g transform="translate(66 70)"><path d="M-8 6 q8 -18 16 0Z" fill="#ff7a6b" /><rect x={-2} y={5} width={4} height={6} fill="#fff1d6" /><circle cx={-2} cy={0} r={1.5} fill="#fff" /></g>
      {/* 얼굴 */}
      <ellipse cx={100} cy={132} rx={48} ry={34} fill="#d9a77c" />
      <path d="M58 108 q-12 -22 4 -26 q10 4 10 20Z" fill="#c48e63" /><path d="M142 108 q12 -22 -4 -26 q-10 4 -10 20Z" fill="#c48e63" />
      <path d="M62 104 q-6 -12 2 -14 q4 4 4 12Z" fill="#f2b8a0" /><path d="M138 104 q6 -12 -2 -14 q-4 4 -4 12Z" fill="#f2b8a0" />
      <ellipse cx={100} cy={148} rx={20} ry={12} fill="#efc9a6" />
      <ellipse cx={100} cy={140} rx={7} ry={5} fill="#5a3a2a" />
      <Eyes x1={80} x2={120} y={124} r={8.5} mood={mood} color="#2b1d18" />
      <circle cx={66} cy={140} r={6} fill="#ff7f8f" opacity={0.4} /><circle cx={134} cy={140} r={6} fill="#ff7f8f" opacity={0.4} />
      <Mouth x={100} y={150} mood={mood} w={9} />
    </g>
  );
}

function Quilly({ mood }: { mood: Mood }) {
  return (
    <g>
      {/* 발 */}
      <path d="M78 172 l-8 14 m8 -14 l0 15 m0 -15 l8 14" stroke="#f0a020" strokeWidth={5} strokeLinecap="round" />
      <path d="M122 172 l-8 14 m8 -14 l0 15 m0 -15 l8 14" stroke="#f0a020" strokeWidth={5} strokeLinecap="round" />
      {/* 몸 */}
      <path d="M100 52 C150 52 168 96 160 136 C154 168 128 180 100 180 C72 180 46 168 40 136 C32 96 50 52 100 52Z" fill="#6d68d8" />
      <path d="M100 104 C128 104 140 130 134 154 C128 172 114 176 100 176 C86 176 72 172 66 154 C60 130 72 104 100 104Z" fill="#b8b3ff" />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <path key={`${r}${c}`} d={`M${86 + c * 14 - (r % 2) * 7} ${128 + r * 12} q7 7 14 0`} stroke="#8d86f0" strokeWidth={2.5} fill="none" />))}
      {/* 잉크 방울 문장 */}
      <path d="M100 112 q8 10 0 16 q-8 -6 0 -16Z" fill="#2c2a6b" />
      {/* 날개 = 책장 */}
      <path d="M44 106 q-26 20 -18 52 q20 -4 30 -22Z" fill="#fff8e8" stroke="#4a46a8" strokeWidth={3} />
      <path d="M34 124 h14 M32 134 h14 M32 144 h12" stroke="#c9c2a8" strokeWidth={2} />
      <path d="M156 106 q26 20 18 52 q-20 -4 -30 -22Z" fill="#fff8e8" stroke="#4a46a8" strokeWidth={3} />
      <path d="M152 124 h14 M154 134 h14 M156 144 h12" stroke="#c9c2a8" strokeWidth={2} />
      {/* 깃펜 귀깃 */}
      <g>
        <path d="M66 62 C52 40 46 22 40 8 C58 18 70 36 76 58Z" fill="#fff" stroke="#4a46a8" strokeWidth={3} />
        <path d="M70 58 L44 12" stroke="#4a46a8" strokeWidth={2} />
        <path d="M134 62 C148 40 154 22 160 8 C142 18 130 36 124 58Z" fill="#fff" stroke="#4a46a8" strokeWidth={3} />
        <path d="M130 58 L156 12" stroke="#4a46a8" strokeWidth={2} />
        <path d="M160 8 l4 -8 l-1 9Z" fill="#2c2a6b" />
      </g>
      {/* 얼굴 원반 */}
      <circle cx={80} cy={88} r={22} fill="#f3f1ff" /><circle cx={120} cy={88} r={22} fill="#f3f1ff" />
      <Eyes x1={80} x2={120} y={88} r={11} mood={mood} color="#24204f" />
      <path d="M100 98 l-8 6 l8 12 l8 -12Z" fill="#ffb02e" />
      {(mood === 'cheer' || mood === 'happy') && <path d="M92 106 q8 10 16 0" stroke="#7a2335" strokeWidth={3} fill="none" />}
      {mood === 'hurt' && <path d="M90 116 q10 -6 20 0" stroke="#24204f" strokeWidth={3} fill="none" />}
      <circle cx={60} cy={104} r={6} fill="#ff8fb1" opacity={0.5} /><circle cx={140} cy={104} r={6} fill="#ff8fb1" opacity={0.5} />
    </g>
  );
}

/** 꾸미기: 친구마다 머리/목 위치가 다름 */
const ANCHOR: Record<FriendId, { head: [number, number]; neck: [number, number]; face: [number, number] }> = {
  lumo: { head: [96, 50], neck: [96, 120], face: [96, 84] },
  moko: { head: [100, 70], neck: [100, 162], face: [100, 124] },
  quilly: { head: [100, 54], neck: [100, 110], face: [100, 88] },
};
export function Deco({ id, friend }: { id: DecoId; friend: FriendId }) {
  const a = ANCHOR[friend];
  switch (id) {
    case 'hat':
      return (
        <g transform={`translate(${a.head[0]} ${a.head[1]})`}>
          <ellipse cx={0} cy={0} rx={40} ry={9} fill="#8a5a2b" />
          <path d="M-24 0 Q-22 -32 0 -34 Q22 -32 24 0Z" fill="#b07a3e" />
          <rect x={-24} y={-10} width={48} height={7} fill="#3e7a4a" />
          <path d="M14 -10 l12 -16 l2 10Z" fill="#ff5d5d" />
        </g>
      );
    case 'crown':
      return (
        <g transform={`translate(${a.head[0]} ${a.head[1] - 2})`}>
          {[-30, -15, 0, 15, 30].map((x, i) => (
            <g key={x} transform={`translate(${x} ${Math.abs(x) / 5})`}>
              {[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cy={-5} rx={3.5} ry={5.5} fill={['#ff9ec7', '#ffd23f', '#9be7ff', '#c8a2ff', '#a8f08a'][i]} transform={`rotate(${r})`} />)}
              <circle r={2.5} fill="#fff" />
            </g>
          ))}
        </g>
      );
    case 'glasses':
      return (
        <g transform={`translate(${a.face[0]} ${a.face[1]})`} fill="none" stroke="#2d2d2d" strokeWidth={3.5}>
          <circle cx={-20} cy={0} r={15} fill="#ffffff30" /><circle cx={20} cy={0} r={15} fill="#ffffff30" /><path d="M-5 -2 q5 -5 10 0" />
        </g>
      );
    case 'scarf':
      return (
        <g transform={`translate(${a.neck[0]} ${a.neck[1]})`}>
          <path d="M-36 -6 Q0 10 36 -6 L34 6 Q0 22 -34 6Z" fill="#3fa7ff" />
          <path d="M14 4 l10 30 l-14 -2 l-2 -26Z" fill="#2a86d9" />
          {[-24, -8, 8, 24].map((x) => <rect key={x} x={x - 2} y={-2} width={4} height={10} fill="#ffffff80" />)}
        </g>
      );
    case 'cape':
      return (
        <g transform={`translate(${a.neck[0]} ${a.neck[1]})`} opacity={0.95}>
          <path d="M-30 0 Q-56 50 -40 66 L40 66 Q56 50 30 0Z" fill="#c43b5c" />
          <path d="M-30 0 Q0 10 30 0" stroke="#ffd23f" strokeWidth={5} fill="none" />
          <circle cx={0} cy={6} r={5} fill="#ffd23f" />
        </g>
      );
    case 'badge':
      return (
        <g transform={`translate(${a.neck[0] + 22} ${a.neck[1] + 12})`}>
          <circle r={11} fill="#ffd23f" stroke="#e08a00" strokeWidth={3} />
          <path d="M0 -7 L2 -2 L7 -2 L3 1 L5 6 L0 3 L-5 6 L-3 1 L-7 -2 L-2 -2Z" fill="#fff" />
        </g>
      );
  }
}

export function Friend({ id, mood = 'normal', deco, size = 160, className }: { id: FriendId; mood?: Mood; deco?: DecoId | null; size?: number; className?: string }) {
  const back = deco === 'cape';
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} role="img" aria-label={`${id} 친구 몬스터`}>
      <ellipse cx={100} cy={190} rx={60} ry={8} fill="#00000022" />
      {back && <Deco id="cape" friend={id} />}
      {id === 'lumo' && <Lumo mood={mood} />}
      {id === 'moko' && <Moko mood={mood} />}
      {id === 'quilly' && <Quilly mood={mood} />}
      {deco && !back && <Deco id={deco} friend={id} />}
    </svg>
  );
}

/* ───── 상대 몬스터 ───── */
export function Enemy({ id, mood = 'normal', size = 150, className, silhouette }: { id: EnemyId; mood?: Mood; size?: number; className?: string; silhouette?: boolean }) {
  const m: Mood = mood === 'happy' || mood === 'cheer' ? 'normal' : mood;
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} role="img" aria-label={`${id} 상대 몬스터`} style={silhouette ? { filter: 'brightness(0) opacity(0.35)' } : undefined}>
      <ellipse cx={100} cy={190} rx={58} ry={8} fill="#00000022" />
      {id === 'blot' && (
        <g>
          <path d="M40 120 C30 70 70 40 104 44 C150 46 172 84 164 124 C160 150 150 160 146 176 q-6 10 -12 0 q-2 -10 -10 -10 q-8 0 -8 14 q-4 10 -12 0 q-2 -14 -12 -14 q-10 0 -12 10 q-6 10 -12 0 q0 -12 -12 -18 C44 150 42 136 40 120Z" fill="#2f3a7a" />
          <circle cx={30} cy={74} r={8} fill="#2f3a7a" /><circle cx={176} cy={60} r={6} fill="#2f3a7a" /><circle cx={170} cy={168} r={5} fill="#2f3a7a" />
          <path d="M70 60 q20 -10 40 -6" stroke="#5a68c9" strokeWidth={6} fill="none" strokeLinecap="round" />
          {m === 'hurt' ? <Eyes x1={78} x2={124} y={100} r={11} mood="hurt" color="#fff" /> : (
            <g>
              <circle cx={78} cy={100} r={16} fill="#fff" /><circle cx={82} cy={102} r={8} fill="#111" />
              <circle cx={126} cy={96} r={10} fill="#fff" /><circle cx={128} cy={98} r={5} fill="#111" />
            </g>
          )}
          <path d="M80 132 q10 -8 20 0 q10 8 20 0" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
      )}
      {id === 'vine' && (
        <g>
          <path d="M100 180 C60 170 50 130 80 112 C50 100 56 60 92 58 C100 30 140 36 140 64 C172 72 168 112 136 120 C160 140 140 176 100 180Z" fill="#3c8f3a" />
          <path d="M80 112 C100 120 120 116 136 120 M92 58 C104 74 124 76 140 64 M100 180 C96 150 110 130 136 120" stroke="#2a6a28" strokeWidth={5} fill="none" />
          {[[60, 80, -30], [150, 90, 40], [70, 150, -60], [140, 160, 50], [118, 40, 10]].map(([x, y, r], i) => (
            <path key={i} d="M0 0 q14 -12 26 0 q-12 12 -26 0Z" fill="#7ccf4f" transform={`translate(${x} ${y}) rotate(${r})`} />
          ))}
          {[[46, 116], [160, 130], [104, 32]].map(([x, y], i) => <path key={i} d={`M${x} ${y} l6 -10 l4 10Z`} fill="#c9e86a" />)}
          {m === 'hurt' ? <Eyes x1={88} x2={124} y={92} r={9} mood="hurt" color="#152" /> : (
            <g>
              <ellipse cx={88} cy={92} rx={11} ry={8} fill="#fffbe0" /><circle cx={91} cy={93} r={5} fill="#152" />
              <ellipse cx={124} cy={92} rx={11} ry={8} fill="#fffbe0" /><circle cx={121} cy={93} r={5} fill="#152" />
              <path d="M76 80 l20 6 M136 80 l-20 6" stroke="#152" strokeWidth={4} strokeLinecap="round" />
            </g>
          )}
          <circle cx={106} cy={106} r={7} fill="#e8424f" /><circle cx={104} cy={104} r={2} fill="#fff" />
          <path d="M90 124 q16 10 32 0" stroke="#152" strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
      )}
      {id === 'fizz' && (
        <g>
          <circle cx={100} cy={118} r={56} fill="#7fe3f0" opacity={0.85} />
          <circle cx={100} cy={118} r={56} fill="none" stroke="#2bb5c9" strokeWidth={4} />
          <path d="M66 90 q14 -22 40 -24" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.8} />
          {[[40, 70, 12], [158, 64, 10], [168, 112, 7], [30, 140, 8], [56, 46, 6], [146, 40, 5]].map(([x, y, r], i) => (
            <g key={i}><circle cx={x} cy={y} r={r} fill="#bff6fb" stroke="#2bb5c9" strokeWidth={2.5} /><circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.25} fill="#fff" /></g>
          ))}
          <path d="M74 64 l6 -14 l8 10 l8 -14 l8 14 l8 -10 l6 14Z" fill="#ff5d5d" stroke="#c02f3a" strokeWidth={2} />
          {m === 'hurt' ? <Eyes x1={84} x2={118} y={112} r={9} mood="hurt" color="#0b4d58" /> : (
            <g><circle cx={84} cy={112} r={9} fill="#0b4d58" /><circle cx={118} cy={112} r={9} fill="#0b4d58" /><circle cx={87} cy={109} r={3} fill="#fff" /><circle cx={121} cy={109} r={3} fill="#fff" /></g>
          )}
          <ellipse cx={101} cy={136} rx={8} ry={6} fill="#0b4d58" />
        </g>
      )}
      {id === 'clank' && (
        <g>
          <path d="M100 40 v-14" stroke="#777" strokeWidth={4} /><path d="M92 26 q8 -8 16 0 q-8 8 -16 0" fill="none" stroke="#777" strokeWidth={3} />
          <circle cx={100} cy={16} r={7} fill="#ff4f4f" />
          <rect x={52} y={40} width={96} height={124} rx={18} fill="#b8c4cf" stroke="#6f7f8f" strokeWidth={5} />
          <path d="M52 76 h96 M52 132 h96" stroke="#8d9cab" strokeWidth={4} />
          <path d="M126 140 q8 6 16 0" stroke="#8d9cab" strokeWidth={3} fill="none" />
          <rect x={66} y={86} width={68} height={36} rx={8} fill="#22313f" />
          {m === 'hurt' ? (
            <g stroke="#ffcf3f" strokeWidth={4} strokeLinecap="round"><path d="M76 96 l12 12 M88 96 l-12 12 M112 96 l12 12 M124 96 l-12 12" /></g>
          ) : (
            <g fill="#7cf7a0"><rect x={76} y={96} width={14} height={14} rx={2} /><rect x={110} y={96} width={14} height={10} rx={2} /></g>
          )}
          {[[60, 50], [140, 50], [60, 156], [140, 156]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4} fill="#6f7f8f" />)}
          <path d="M52 100 q-24 4 -28 26" stroke="#6f7f8f" strokeWidth={9} fill="none" strokeLinecap="round" />
          <path d="M18 128 l10 -6 l2 12Z M30 136 l-4 8" fill="#6f7f8f" stroke="#6f7f8f" strokeWidth={4} />
          <path d="M148 100 q20 -6 26 -24" stroke="#6f7f8f" strokeWidth={9} fill="none" strokeLinecap="round" />
          <circle cx={176} cy={72} r={8} fill="#ffcf3f" stroke="#c99a10" strokeWidth={3} />
          <rect x={70} y={164} width={18} height={20} rx={4} fill="#6f7f8f" /><rect x={112} y={164} width={18} height={20} rx={4} fill="#6f7f8f" />
        </g>
      )}
      {id === 'murk' && (
        <g>
          <path d="M44 120 C40 70 70 40 104 40 C142 40 164 72 160 116 C158 140 168 152 176 170 C160 170 152 160 146 172 C138 160 128 182 118 170 C108 184 96 168 86 178 C78 164 66 176 58 166 C46 172 36 166 30 168 C42 152 46 140 44 120Z" fill="#c9b8f0" opacity={0.92} />
          <path d="M60 90 q20 -30 60 -26" stroke="#ffffffaa" strokeWidth={8} fill="none" strokeLinecap="round" />
          <path d="M130 140 q16 -6 8 -18 q-10 -6 -14 4" stroke="#9d86d9" strokeWidth={4} fill="none" strokeLinecap="round" />
          {m === 'hurt' ? <Eyes x1={84} x2={122} y={102} r={10} mood="hurt" color="#3e2a78" /> : (
            <g><ellipse cx={84} cy={102} rx={11} ry={15} fill="#3e2a78" /><ellipse cx={122} cy={102} rx={11} ry={15} fill="#3e2a78" /><circle cx={87} cy={96} r={4} fill="#fff" /><circle cx={125} cy={96} r={4} fill="#fff" /></g>
          )}
          <ellipse cx={104} cy={134} rx={10} ry={7} fill="#3e2a78" />
        </g>
      )}
      {mood === 'hurt' && <g fill="#ffd23f">{[[40, 40], [160, 36], [100, 20]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 8} l3 6 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1Z`} />)}</g>}
    </svg>
  );
}

/** 지역 배경 장식 */
export function Backdrop({ hue, motif }: { hue: number; motif: 'tree' | 'wave' | 'crystal' | 'snow' | 'star' | 'mountain' }) {
  const c1 = `hsl(${hue} 70% 82%)`, c2 = `hsl(${hue} 55% 62%)`, c3 = `hsl(${hue} 45% 45%)`;
  return (
    <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMax slice" className="backdrop" aria-hidden>
      <rect width={400} height={160} fill={c1} />
      {motif === 'mountain' && <path d="M0 160 L60 70 L110 130 L170 50 L240 140 L300 80 L400 150 V160Z" fill={c2} />}
      {motif === 'tree' && [20, 80, 150, 230, 300, 360].map((x, i) => (
        <g key={x} transform={`translate(${x} ${110 + (i % 2) * 12})`}><rect x={-4} y={10} width={8} height={30} fill={c3} /><circle r={24} fill={c2} /><circle cx={12} cy={-8} r={14} fill={c2} /></g>
      ))}
      {motif === 'wave' && [0, 1, 2].map((k) => <path key={k} d={`M0 ${110 + k * 18} q25 -14 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V160 H0Z`} fill={k === 1 ? c2 : c3} opacity={0.7} />)}
      {motif === 'crystal' && [30, 110, 200, 280, 350].map((x, i) => <path key={x} d={`M${x} 160 l14 -${50 + (i % 3) * 20} l14 ${50 + (i % 3) * 20}Z`} fill={i % 2 ? c2 : c3} />)}
      {motif === 'snow' && (<g><path d="M0 130 Q100 110 200 130 T400 125 V160 H0Z" fill="#fff" />{[40, 120, 190, 260, 330, 80, 300].map((x, i) => <circle key={i} cx={x} cy={20 + (i * 23) % 90} r={3} fill="#fff" />)}</g>)}
      {motif === 'star' && (<g><path d="M0 140 Q200 120 400 140 V160 H0Z" fill={c3} />{[30, 90, 160, 220, 280, 350, 120, 320].map((x, i) => <path key={i} transform={`translate(${x} ${20 + (i * 19) % 80})`} d="M0 -6 L2 -2 L6 0 L2 2 L0 6 L-2 2 L-6 0 L-2 -2Z" fill="#fff" />)}</g>)}
    </svg>
  );
}

export function AppIconArt() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width={200} height={200} fill="#2d2a6e" />
      <Lumo mood="cheer" />
    </svg>
  );
}

/** 끝장 퀴즈 콜로세움 배경 (직접 그린 SVG) */
export function Colosseum({ boss }: { boss?: boolean }) {
  const crowd = ['#ff6b6b', '#ffd23f', '#4fd1ff', '#7cf7a0', '#c9a6ff', '#ff9ad5', '#ffffff'];
  return (
    <svg viewBox="0 0 800 160" preserveAspectRatio="xMidYMid slice" className="backdrop" aria-hidden>
      <defs>
        <linearGradient id="col-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={boss ? '#3a1060' : '#ffb36b'} /><stop offset="1" stopColor={boss ? '#a0306a' : '#ffe2a8'} /></linearGradient>
      </defs>
      <rect width={800} height={160} fill="url(#col-sky)" />
      {[0, 400].map((ox) => <g key={ox} transform={`translate(${ox} 0)`}>
      {/* 경기장 벽 2층 아치 */}
      <path d="M0 40 Q200 18 400 40 V120 H0Z" fill="#d9a066" />
      <path d="M0 40 Q200 18 400 40 V48 Q200 26 0 48Z" fill="#b97a3f" />
      {Array.from({ length: 16 }, (_, i) => <path key={'u' + i} d={`M${6 + i * 25} 74 v-14 a9 9 0 0 1 18 0 v14Z`} fill="#8a5428" />)}
      <path d="M0 78 H400 V84 H0Z" fill="#b97a3f" />
      {Array.from({ length: 13 }, (_, i) => <path key={'l' + i} d={`M${4 + i * 31} 118 v-20 a12 12 0 0 1 24 0 v20Z`} fill="#6b3e1c" />)}
      {/* 관중 */}
      {Array.from({ length: 60 }, (_, i) => <circle key={'c' + i} cx={4 + (i * 6.7) % 400} cy={36 - Math.sin(i) * 2 + (i % 2) * 4} r={2.6} fill={crowd[i % crowd.length]} />)}
      {/* 깃발 */}
      {[30, 130, 270, 370].map((x, i) => (
        <g key={'f' + x}><path d={`M${x} 34 V6`} stroke="#5a3a1a" strokeWidth={2} /><path d={`M${x} 6 L${x + 20} 11 L${x} 17Z`} fill={['#e8323c', '#3f7dff', '#ffd23f', '#2fbf71'][i]} /></g>
      ))}
      {/* 횃불 */}
      {[60, 340].map((x) => (
        <g key={'t' + x}><rect x={x - 2} y={92} width={4} height={22} fill="#5a3a1a" /><path d={`M${x} 80 C${x + 7} 88 ${x + 5} 94 ${x} 95 C${x - 5} 94 ${x - 7} 88 ${x} 80Z`} fill="#ff8a1f" className="glow" /></g>
      ))}
      </g>)}
      {/* 모래 바닥 */}
      <ellipse cx={400} cy={156} rx={520} ry={30} fill="#f2d39b" />
      <ellipse cx={400} cy={154} rx={300} ry={12} fill="#e8c27c" opacity={0.6} />
    </svg>
  );
}
