// 동물 몬스터 그림 생성기 (직접 그린 SVG). 몸 구조 틀 + 동물 부품 + 속성 효과 + 등급 장식
import { useId } from 'react';

export type Plan = 'quad' | 'bird' | 'fish' | 'serpent' | 'arachnid' | 'crab' | 'biped' | 'cetacean' | 'bat';
export type Element = 'fire' | 'water' | 'plant' | 'electric' | 'ice' | 'rock' | 'earth' | 'wind' | 'poison' | 'metal' | 'shadow' | 'light';
export type Tier = 'common' | 'rare' | 'legend';
export interface AnimalArt {
  plan: Plan; element: Element; tier: Tier;
  head?: 'canine' | 'feline' | 'ursine' | 'rodent' | 'bovine';
  ears?: 'pointy' | 'round' | 'tufted' | 'none';
  tail?: 'bushy' | 'thin' | 'short' | 'tuft' | 'none';
  extras?: string[]; // mane, spines, horn, curlhorns, antlers, tusks, hood, stinger, beak-hook, crest, dorsal …
  bulk?: number; // 0.8 ~ 1.2
}

const OL = '#1b1626';
const PAL: Record<Element, { base: string; shade: string; light: string; accent: string; eye: string }> = {
  fire: { base: '#d9482b', shade: '#8f2614', light: '#ff8a4c', accent: '#ffc53d', eye: '#ffe066' },
  water: { base: '#2f7fd1', shade: '#1b4b8a', light: '#6fb6ff', accent: '#9ff0ff', eye: '#d6fbff' },
  plant: { base: '#3f9a4a', shade: '#235c2b', light: '#7ccf62', accent: '#d8f06a', eye: '#f4ff9a' },
  electric: { base: '#f2c021', shade: '#a87a06', light: '#ffe46b', accent: '#3a6bff', eye: '#ffffff' },
  ice: { base: '#8fc8ef', shade: '#4d86b8', light: '#d8f1ff', accent: '#ffffff', eye: '#bff4ff' },
  rock: { base: '#8a7a68', shade: '#4f4539', light: '#b8a993', accent: '#e0a84a', eye: '#ffb347' },
  earth: { base: '#b9783a', shade: '#6e4119', light: '#e0a868', accent: '#f2d39b', eye: '#ffd27a' },
  wind: { base: '#79c7c0', shade: '#3f8a86', light: '#c8f2ec', accent: '#ffffff', eye: '#e8fffb' },
  poison: { base: '#7a3fa8', shade: '#44205f', light: '#a874d6', accent: '#9cff3a', eye: '#c8ff5a' },
  metal: { base: '#8f9db0', shade: '#4c5868', light: '#d3dbe6', accent: '#3c6bd6', eye: '#7fd8ff' },
  shadow: { base: '#3b2a5a', shade: '#1c1230', light: '#6a4f96', accent: '#ff3d9a', eye: '#ff5ac0' },
  light: { base: '#f1e3b0', shade: '#c4a45a', light: '#fffbe8', accent: '#ffcf3f', eye: '#3fb8ff' },
};

const S = (d: string, fill: string, w = 3) => <path d={d} fill={fill} stroke={OL} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />;

/** 눈: 크고 또렷한 눈동자 + 반짝임 두 개 + 자신감 있는 짧은 눈썹 (귀엽지만 유치하지 않게) */
function Eye({ x, y, s = 8, color, dir = 1, mood = 'normal' }: { x: number; y: number; s?: number; color: string; dir?: number; mood?: string }) {
  s = s * 1.3;
  if (mood === 'hurt') return <path d={`M${x - s * 0.7} ${y - s * 0.5} L${x + s * 0.5} ${y} L${x - s * 0.7} ${y + s * 0.5}`} stroke={OL} strokeWidth={3} fill="none" strokeLinecap="round" />;
  if (mood === 'happy' || mood === 'cheer') return <path d={`M${x - s * 0.8} ${y + 1} Q${x} ${y - s} ${x + s * 0.8} ${y + 1}`} stroke={OL} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={s * 0.82} ry={s * 0.95} fill="#ffffff" stroke={OL} strokeWidth={2.5} />
      <circle cx={x + s * 0.18 * dir} cy={y + s * 0.08} r={s * 0.62} fill={color} />
      <circle cx={x + s * 0.22 * dir} cy={y + s * 0.12} r={s * 0.34} fill={OL} />
      <circle cx={x + s * 0.02 * dir} cy={y - s * 0.22} r={s * 0.2} fill="#fff" />
      <circle cx={x + s * 0.42 * dir} cy={y + s * 0.38} r={s * 0.09} fill="#fff" />
      <path d={`M${x - s * 0.85} ${y - s * 1.05} Q${x} ${y - s * 1.45} ${x + s * 0.9} ${y - s * 1.25}`} stroke={OL} strokeWidth={3} fill="none" strokeLinecap="round" />
    </g>
  );
}

/* ───────── 속성 효과 ───────── */
function flame(x: number, y: number, s: number, rot = 0, c1 = '#ff6a1f', c2 = '#ffd23f') {
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}><path d="M0 0 C8 -8 2 -16 8 -26 C16 -14 18 -6 10 2Z" fill={c1} stroke={OL} strokeWidth={2 / s} /><path d="M3 -2 C7 -6 5 -11 8 -16 C12 -9 12 -4 8 0Z" fill={c2} /></g>;
}
function crystal(x: number, y: number, s: number, rot = 0, c = '#d8f1ff') {
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}><path d="M-5 0 L-3 -18 L0 -26 L3 -18 L5 0Z" fill={c} stroke={OL} strokeWidth={2 / s} /><path d="M0 -26 L0 0" stroke="#ffffff" strokeWidth={1.5 / s} opacity={0.8} /></g>;
}
function bolt(x: number, y: number, s: number, c = '#ffe46b') {
  return <path d={`M${x} ${y} l${6 * s} ${-10 * s} l${-3 * s} 0 l${5 * s} ${-10 * s} l${-9 * s} ${12 * s} l${3 * s} 0 Z`} fill={c} stroke={OL} strokeWidth={2} strokeLinejoin="round" />;
}
function leaf(x: number, y: number, s: number, rot = 0) {
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}><path d="M0 0 C-8 -8 -6 -20 0 -26 C6 -20 8 -8 0 0Z" fill="#5cc04a" stroke={OL} strokeWidth={2 / s} /><path d="M0 -2 L0 -22" stroke="#2e7a26" strokeWidth={1.5 / s} /></g>;
}
function plate(x: number, y: number, s: number, rot = 0, c = '#d3dbe6') {
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}><path d="M-10 4 L-8 -8 L8 -8 L10 4 Z" fill={c} stroke={OL} strokeWidth={2 / s} /><circle cx={-5} cy={-3} r={1.4} fill={OL} /><circle cx={5} cy={-3} r={1.4} fill={OL} /></g>;
}
function stone(x: number, y: number, s: number, rot = 0, c = '#b8a993') {
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}><path d="M-9 2 L-7 -8 L2 -12 L9 -5 L8 3Z" fill={c} stroke={OL} strokeWidth={2 / s} /><path d="M-3 -6 L3 -2" stroke={OL} strokeWidth={1.2 / s} /></g>;
}
function wisp(x: number, y: number, s: number, c = '#6a4f96') {
  return <path d={`M${x} ${y} c${-8 * s} ${-4 * s} ${-14 * s} ${-14 * s} ${-6 * s} ${-22 * s} c${-2 * s} ${8 * s} ${6 * s} ${10 * s} ${10 * s} ${4 * s}`} fill={c} stroke={OL} strokeWidth={2} opacity={0.9} />;
}
function sparkle(x: number, y: number, s: number, c = '#ffffff') {
  return <path d={`M${x} ${y - 6 * s} L${x + 1.6 * s} ${y - 1.6 * s} L${x + 6 * s} ${y} L${x + 1.6 * s} ${y + 1.6 * s} L${x} ${y + 6 * s} L${x - 1.6 * s} ${y + 1.6 * s} L${x - 6 * s} ${y} L${x - 1.6 * s} ${y - 1.6 * s}Z`} fill={c} />;
}
function swirl(x: number, y: number, s: number, c = '#ffffff') {
  return <path d={`M${x} ${y} c${10 * s} ${-6 * s} ${22 * s} ${2 * s} ${16 * s} ${10 * s} c${-4 * s} ${5 * s} ${-12 * s} ${2 * s} ${-8 * s} ${-3 * s}`} fill="none" stroke={c} strokeWidth={3} strokeLinecap="round" opacity={0.9} />;
}
function drop(x: number, y: number, s: number, c: string) {
  return <path d={`M${x} ${y} c${-4 * s} ${6 * s} ${-4 * s} ${10 * s} 0 ${10 * s} c${4 * s} 0 ${4 * s} ${-4 * s} 0 ${-10 * s}Z`} fill={c} stroke={OL} strokeWidth={1.5} />;
}

/** 등 위(back)·주변(around)·몸(body) 기준점에 속성 효과를 붙임 */
function ElementFx({ el, back, around, body, tier }: { el: Element; back: [number, number, number][]; around: [number, number][]; body: [number, number][]; tier: Tier }) {
  const p = PAL[el];
  const big = tier === 'legend' ? 1.35 : tier === 'rare' ? 1.15 : 1;
  const out: JSX.Element[] = [];
  const B = tier === 'common' ? back.slice(0, Math.ceil(back.length * 0.6)) : back;
  B.forEach(([x, y, r], i) => {
    const k = `b${i}`;
    if (el === 'fire') out.push(<g key={k}>{flame(x, y, 0.8 * big, r)}</g>);
    if (el === 'ice') out.push(<g key={k}>{crystal(x, y, 0.8 * big, r, p.light)}</g>);
    if (el === 'metal') out.push(<g key={k}>{plate(x, y, 0.85 * big, r, p.light)}</g>);
    if (el === 'rock') out.push(<g key={k}>{stone(x, y, 0.9 * big, r, p.light)}</g>);
    if (el === 'plant') out.push(<g key={k}>{leaf(x, y, 0.75 * big, r)}</g>);
    if (el === 'shadow') out.push(<g key={k}>{wisp(x, y, 0.8 * big, p.light)}</g>);
    if (el === 'water') out.push(<g key={k}><path d={`M${x - 6} ${y + 2} q6 -16 14 -14 q-6 6 -2 14Z`} fill={p.light} stroke={OL} strokeWidth={2} transform={`rotate(${r} ${x} ${y})`} /></g>);
    if (el === 'wind') out.push(<g key={k}><path d={`M${x} ${y} q-18 -8 -26 -2 q10 0 14 6Z`} fill={p.light} stroke={OL} strokeWidth={2} transform={`rotate(${r} ${x} ${y})`} /></g>);
    if (el === 'electric') out.push(<g key={k}>{bolt(x - 4, y + 4, 0.7 * big)}</g>);
    if (el === 'poison') out.push(<g key={k}><circle cx={x} cy={y} r={4 * big} fill={p.accent} stroke={OL} strokeWidth={2} /></g>);
    if (el === 'light') out.push(<g key={k}>{crystal(x, y, 0.7 * big, r, '#fff6c8')}</g>);
    if (el === 'earth') out.push(<g key={k}><path d={`M${x - 6} ${y + 3} L${x} ${y - 10} L${x + 6} ${y + 3}Z`} fill={p.light} stroke={OL} strokeWidth={2} transform={`rotate(${r} ${x} ${y})`} /></g>);
  });
  // 몸 무늬
  body.forEach(([x, y], i) => {
    const k = `m${i}`;
    if (el === 'electric') out.push(<path key={k} d={`M${x - 6} ${y - 4} l6 4 l-4 3 l8 5`} stroke={p.accent} strokeWidth={3} fill="none" strokeLinecap="round" />);
    if (el === 'poison') out.push(<circle key={k} cx={x} cy={y} r={3.5} fill={p.accent} opacity={0.85} />);
    if (el === 'earth' || el === 'rock') out.push(<path key={k} d={`M${x - 7} ${y} q7 -4 14 0`} stroke={p.shade} strokeWidth={3} fill="none" strokeLinecap="round" />);
    if (el === 'fire') out.push(<path key={k} d={`M${x - 5} ${y + 3} q5 -10 10 0`} stroke={p.accent} strokeWidth={2.5} fill="none" />);
    if (el === 'ice' || el === 'light') out.push(<g key={k}>{sparkle(x, y, 0.6, el === 'ice' ? '#ffffff' : '#fff2b0')}</g>);
    if (el === 'shadow') out.push(<path key={k} d={`M${x - 6} ${y} q6 -5 12 0`} stroke={p.accent} strokeWidth={2.5} fill="none" opacity={0.8} />);
    if (el === 'metal') out.push(<circle key={k} cx={x} cy={y} r={1.8} fill={OL} />);
    if (el === 'plant') out.push(<path key={k} d={`M${x - 6} ${y + 2} q6 -8 12 0`} stroke="#2e7a26" strokeWidth={2.5} fill="none" />);
    if (el === 'water' || el === 'wind') out.push(<path key={k} d={`M${x - 7} ${y} q3.5 -4 7 0 t7 0`} stroke={p.light} strokeWidth={2.5} fill="none" />);
  });
  // 주변 입자 (희귀·레전드)
  if (tier !== 'common') around.forEach(([x, y], i) => {
    const k = `a${i}`;
    if (el === 'fire') out.push(<circle key={k} cx={x} cy={y} r={2.5} fill={p.accent} />);
    else if (el === 'electric') out.push(<g key={k}>{bolt(x, y, 0.55)}</g>);
    else if (el === 'ice' || el === 'light') out.push(<g key={k}>{sparkle(x, y, 0.9, el === 'ice' ? '#ffffff' : '#ffe680')}</g>);
    else if (el === 'wind') out.push(<g key={k}>{swirl(x, y, 0.6, '#ffffff')}</g>);
    else if (el === 'water') out.push(<g key={k}>{drop(x, y, 0.8, p.light)}</g>);
    else if (el === 'poison') out.push(<g key={k}>{drop(x, y, 0.8, p.accent)}</g>);
    else if (el === 'shadow') out.push(<circle key={k} cx={x} cy={y} r={3} fill={p.accent} opacity={0.8} />);
    else if (el === 'plant') out.push(<g key={k}>{leaf(x, y, 0.45, i * 50)}</g>);
    else out.push(<circle key={k} cx={x} cy={y} r={2.5} fill={p.light} stroke={OL} strokeWidth={1.2} />);
  });
  return <g>{out}</g>;
}

/* ───────── 몸 구조 틀 ───────── */
function Quad({ a, mood }: { a: AnimalArt; mood: string }) {
  const p = PAL[a.element], ex = a.extras ?? [];
  const head = a.head ?? 'canine';
  const heavy = head === 'ursine' || head === 'bovine';
  const legW = heavy ? 18 : 13;
  const leg = (x: number, far: boolean, hind = false) => (
    <g key={x}>
      {hind
        ? S(`M${x - legW / 2 - 6} 112 C${x - legW - 8} 132 ${x - legW / 2 - 8} 146 ${x - 6} 150 C${x - 4} 158 ${x - legW / 2 + 2} 166 ${x - legW / 2 + 1} 172 L${x + legW / 2 + 1} 172 C${x + legW / 2 + 2} 162 ${x + 4} 152 ${x + 6} 146 C${x + legW / 2 + 6} 136 ${x + legW / 2 + 6} 122 ${x + legW / 2 + 4} 114Z`, far ? p.shade : p.base)
        : S(`M${x - legW / 2} 120 C${x - legW / 2} 140 ${x - legW / 2 + 2} 160 ${x - legW / 2 + 1} 172 L${x + legW / 2 + 1} 172 C${x + legW / 2} 158 ${x + legW / 2 + 2} 138 ${x + legW / 2 + 1} 118Z`, far ? p.shade : p.base)}
      {S(`M${x - legW / 2 - 2} 172 Q${x + 2} 166 ${x + legW / 2 + 6} 172 Z`, far ? p.shade : p.base, 2.5)}
      <path d={`M${x + legW / 2 + 2} 172 l3 3 M${x + legW / 2 - 4} 172 l2 4 M${x - 2} 172 l1 4`} stroke={a.element === 'metal' ? '#e8eef6' : '#f3ece0'} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
  const torso = heavy
    ? 'M48 104 C46 74 86 62 124 68 C152 72 164 96 158 122 C152 142 120 146 90 144 C64 142 50 128 48 104Z'
    : 'M52 104 C54 82 92 74 124 78 C148 82 158 98 152 120 C146 136 118 140 92 138 C70 136 52 124 52 104Z';
  const hx = heavy ? 150 : 150, hy = heavy ? 74 : 76;
  return (
    <g>
      {/* 꼬리 */}
      {a.tail === 'bushy' && S('M58 100 C30 96 14 70 26 48 C34 66 46 74 62 86Z', p.base)}
      {a.tail === 'bushy' && <path d="M30 56 C34 70 44 78 56 86" stroke={p.light} strokeWidth={4} fill="none" strokeLinecap="round" />}
      {a.tail === 'thin' && <path d="M56 100 C36 96 26 112 18 96" stroke={OL} strokeWidth={9} fill="none" strokeLinecap="round" />}
      {a.tail === 'thin' && <path d="M56 100 C36 96 26 112 18 96" stroke={p.base} strokeWidth={5} fill="none" strokeLinecap="round" />}
      {a.tail === 'tuft' && <g><path d="M56 102 C40 104 32 120 26 132" stroke={OL} strokeWidth={8} fill="none" strokeLinecap="round" /><path d="M56 102 C40 104 32 120 26 132" stroke={p.base} strokeWidth={4} fill="none" strokeLinecap="round" />{S('M26 126 l-10 14 l14 -4 l2 10 l6 -14Z', p.shade, 2.5)}</g>}
      {a.tail === 'short' && S('M52 100 l-14 -6 l4 12Z', p.base)}
      {/* 먼 다리 */}
      {leg(heavy ? 70 : 74, true, true)}{leg(heavy ? 128 : 134, true)}
      {/* 갈기(머리 뒤) */}
      {ex.includes('mane') && <g>{Array.from({ length: 11 }, (_, i) => { const ang = (-150 + i * 26) * Math.PI / 180; const r1 = 26, r2 = 46; return <path key={i} d={`M${hx + r1 * Math.cos(ang - 0.2)} ${hy + r1 * Math.sin(ang - 0.2)} L${hx + r2 * Math.cos(ang)} ${hy + r2 * Math.sin(ang)} L${hx + r1 * Math.cos(ang + 0.2)} ${hy + r1 * Math.sin(ang + 0.2)}Z`} fill={i % 2 ? p.shade : p.accent} stroke={OL} strokeWidth={2.5} strokeLinejoin="round" />; })}</g>}
      {/* 몸통 */}
      {S(torso, p.base)}
      <path d={heavy ? 'M66 132 C90 140 130 140 150 126' : 'M70 128 C92 134 124 134 144 122'} stroke={p.shade} strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.55} />
      <path d={heavy ? 'M70 80 C92 70 118 70 136 76' : 'M74 88 C94 80 116 80 132 84'} stroke={p.light} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />
      {/* 가시 */}
      {ex.includes('spines') && <g>{Array.from({ length: 9 }, (_, i) => { const x = 58 + i * 11; const y = 92 - Math.sin((i / 8) * Math.PI) * 18; return S(`M${x - 6} ${y + 8} L${x - 8 + (i % 2) * 2} ${y - 18} L${x + 6} ${y + 6}Z`, i % 2 ? p.light : p.shade, 2.5); })}</g>}
      {/* 가까운 다리 */}
      {leg(heavy ? 92 : 96, false, true)}{leg(heavy ? 146 : 148, false)}
      {/* 머리 (조금 크게 → 귀여운 비율) */}
      <g transform="translate(155 78) scale(1.14) translate(-162 -76)">
        {head === 'canine' && S('M134 82 C132 60 150 50 166 54 C176 56 182 62 184 68 L200 78 C202 84 196 90 188 90 L176 92 C164 98 142 98 134 82Z', p.base)}
        {head === 'feline' && S('M132 80 C130 58 150 48 168 52 C182 56 188 66 188 76 C188 88 178 96 164 96 C148 98 134 92 132 80Z', p.base)}
        {head === 'ursine' && S('M128 78 C126 52 148 42 170 46 C186 50 194 62 194 76 C194 90 184 100 166 100 C146 100 130 94 128 78Z', p.base)}
        {head === 'rodent' && S('M136 84 C134 64 150 58 164 60 C178 64 186 72 196 80 C192 88 182 92 170 94 C154 96 138 94 136 84Z', p.base)}
        {head === 'bovine' && S('M130 74 C128 52 152 44 172 50 C186 54 194 66 196 80 C196 92 186 100 172 100 C150 102 132 92 130 74Z', p.base)}
        {/* 귀 */}
        {(a.ears === 'pointy' || a.ears === 'tufted') && <g>{S('M146 60 L142 32 L160 52Z', p.shade)}{S('M158 56 L162 28 L174 54Z', p.base)}<path d="M162 34 L166 50" stroke={p.light} strokeWidth={3} strokeLinecap="round" />{a.ears === 'tufted' && <path d="M162 28 l-2 -10 M142 32 l-4 -9" stroke={OL} strokeWidth={3} strokeLinecap="round" />}</g>}
        {a.ears === 'round' && <g>{S('M146 56 a10 10 0 1 1 14 -6Z', p.shade)}{S('M162 52 a10 10 0 1 1 14 -2Z', p.base)}</g>}
        {/* 주둥이 음영·코·입 */}
        <path d={head === 'ursine' ? 'M170 84 C178 82 188 80 192 76' : 'M164 80 C176 82 186 82 196 80'} stroke={p.shade} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.6} />
        <ellipse cx={head === 'feline' ? 186 : head === 'ursine' ? 190 : head === 'bovine' ? 192 : 198} cy={head === 'rodent' ? 80 : 76} rx={5} ry={4} fill={OL} />
        <path d={`M${head === 'feline' ? 170 : 168} 88 Q${head === 'feline' ? 178 : 180} 95 ${head === 'feline' ? 186 : 192} 86`} stroke={OL} strokeWidth={3} fill="none" strokeLinecap="round" />
        <path d={`M${head === 'feline' ? 178 : 183} 91 l1.5 4 l2 -4`} fill="#fff" stroke={OL} strokeWidth={1.3} strokeLinejoin="round" />
        <Eye x={head === 'ursine' ? 166 : 164} y={head === 'ursine' ? 68 : 70} s={head === 'rodent' ? 6 : 7.5} color={p.eye} mood={mood} />
        {/* 뿔·엄니 */}
        {ex.includes('horn') && S('M186 70 C190 52 196 40 194 28 C204 40 204 60 196 74Z', '#f3ece0')}
        {ex.includes('curlhorns') && S('M148 52 C134 34 150 18 166 26 C176 32 172 46 162 46 C168 40 164 32 156 34 C150 38 154 48 160 54Z', '#e8d8b8')}
        {ex.includes('antlers') && <g fill="none" strokeLinecap="round"><path d="M154 52 C150 34 140 22 132 14 M146 36 L134 34 M150 44 L138 46 M160 50 C166 30 176 20 186 12 M168 34 L180 34 M164 42 L176 46" stroke={OL} strokeWidth={8} /><path d="M154 52 C150 34 140 22 132 14 M146 36 L134 34 M150 44 L138 46 M160 50 C166 30 176 20 186 12 M168 34 L180 34 M164 42 L176 46" stroke="#e8d8b8" strokeWidth={4} /></g>}
        {ex.includes('tusks') && S('M184 92 C194 98 198 108 192 116 C190 106 186 100 180 96Z', '#f6f0e2', 2.5)}
      </g>
    </g>
  );
}

function Bird({ a, mood }: { a: AnimalArt; mood: string }) {
  const p = PAL[a.element], ex = a.extras ?? [];
  return (
    <g>
      {/* 뒷날개 */}
      {S('M96 96 C70 56 40 34 12 30 C26 44 30 54 22 60 C38 62 44 72 36 82 C54 82 64 92 60 104Z', p.shade)}
      {/* 꽁지 */}
      {S('M74 128 L34 160 L52 160 L40 178 L66 164 L66 182 L88 144Z', p.shade)}
      {/* 몸 */}
      {S('M70 120 C66 92 92 74 120 76 C148 78 160 100 154 124 C148 146 118 156 96 150 C80 146 72 136 70 120Z', p.base)}
      <path d="M96 138 C112 144 132 140 146 128" stroke={p.light} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.6} />
      {/* 다리·발톱 */}
      <path d="M104 150 L100 172 M126 148 L130 170" stroke={OL} strokeWidth={6} strokeLinecap="round" />
      <path d="M92 174 l8 -2 l8 3 M122 172 l8 -2 l8 3" stroke={OL} strokeWidth={4} fill="none" strokeLinecap="round" />
      {/* 앞날개 */}
      {S('M120 96 C126 60 150 30 186 18 C178 32 178 40 186 46 C170 50 166 58 172 66 C156 70 150 80 152 92 C140 92 128 98 120 96Z', p.base)}
      <path d="M134 74 C146 58 160 46 176 38 M140 84 C150 74 160 66 170 62" stroke={p.light} strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* 머리 */}
      <g transform="translate(152 74) scale(1.12) translate(-152 -74)">
      {S('M128 84 C124 62 140 50 156 52 C170 54 176 66 174 78 C172 90 160 96 146 96 C136 96 130 92 128 84Z', p.base)}
      {(ex.includes('crest') || a.tier !== 'common') && S('M140 54 L128 34 L146 46 L144 26 L156 48 L162 32 L162 54Z', p.accent)}
      {S(ex.includes('beak-hook') ? 'M170 66 C186 64 196 72 194 86 C188 80 180 80 172 82Z' : 'M170 68 L196 76 L170 84Z', '#f2b632')}
      <Eye x={156} y={70} s={7} color={p.eye} mood={mood} />
      </g>
    </g>
  );
}

function Fish({ a, mood }: { a: AnimalArt; mood: string }) {
  const p = PAL[a.element];
  return (
    <g>
      {S('M44 112 L10 78 L18 112 L10 146Z', p.shade)}
      {S('M96 76 L108 40 L132 74Z', p.shade)}
      {S('M100 146 L92 172 L122 150Z', p.shade)}
      {S('M40 112 C56 80 100 66 140 72 C168 76 188 92 194 110 C188 126 170 146 140 152 C100 160 56 144 40 112Z', p.base)}
      <path d="M60 126 C90 142 140 146 176 128" stroke={p.light} strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.6} />
      {/* 아래턱과 이빨 */}
      {S('M150 116 C166 112 186 112 196 118 C188 132 168 138 150 130Z', p.shade)}
      <path d="M156 116 l4 7 l4 -7 l4 7 l4 -7 l4 7 l4 -7 l4 7 l4 -7" stroke="#fff" strokeWidth={2.5} fill="#fff" strokeLinejoin="round" />
      {S('M126 112 L104 130 L132 124Z', p.base)}
      <path d="M118 84 C112 100 112 118 120 134" stroke={OL} strokeWidth={3} fill="none" />
      <Eye x={162} y={96} s={8} color={p.eye} mood={mood} />
    </g>
  );
}

function Serpent({ a, mood }: { a: AnimalArt; mood: string }) {
  const p = PAL[a.element], ex = a.extras ?? [];
  return (
    <g>
      <path d="M150 100 C150 140 120 150 92 150 C58 150 40 164 44 174 C52 186 100 182 130 176 C160 170 176 160 172 150" stroke={OL} strokeWidth={30} fill="none" strokeLinecap="round" />
      <path d="M150 100 C150 140 120 150 92 150 C58 150 40 164 44 174 C52 186 100 182 130 176 C160 170 176 160 172 150" stroke={p.base} strokeWidth={24} fill="none" strokeLinecap="round" />
      <path d="M146 112 C144 136 120 142 92 144 C66 146 52 158 54 168" stroke={p.light} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.7} />
      <path d="M44 174 C40 186 26 184 22 176" stroke={OL} strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d="M44 174 C40 186 26 184 22 176" stroke={p.base} strokeWidth={5} fill="none" strokeLinecap="round" />
      {/* 목·후드 */}
      {ex.includes('hood') && S('M150 104 C116 98 108 64 120 42 C130 30 150 34 152 50 C154 34 174 30 182 44 C194 66 184 98 150 104Z', p.shade)}
      {ex.includes('hood') && <path d="M136 54 q6 10 0 20 M168 54 q-6 10 0 20" stroke={p.accent} strokeWidth={4} fill="none" strokeLinecap="round" />}
      <path d="M150 104 L150 70" stroke={OL} strokeWidth={30} strokeLinecap="round" />
      <path d="M150 104 L150 70" stroke={p.base} strokeWidth={24} strokeLinecap="round" />
      {/* 머리 */}
      {S('M132 62 C130 44 146 34 162 38 C180 42 194 52 196 62 C192 72 176 76 160 76 C144 76 134 72 132 62Z', p.base)}
      <path d="M160 70 L192 64" stroke={OL} strokeWidth={3} strokeLinecap="round" />
      <path d="M174 68 l2 9 l3 -9 M184 66 l2 8 l3 -8" fill="#fff" stroke={OL} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M196 62 l10 2 l-4 4 m4 -4 l-3 -5" stroke="#ff3b5c" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Eye x={160} y={52} s={7} color={p.eye} mood={mood} />
    </g>
  );
}

function Arachnid({ a, mood }: { a: AnimalArt; mood: string }) {
  const p = PAL[a.element], ex = a.extras ?? [];
  const legs = [70, 88, 106, 124];
  return (
    <g>
      {/* 꼬리 독침 */}
      {ex.includes('stinger') && <g>
        <path d="M70 128 C40 124 28 96 40 72 C50 52 74 46 86 58" stroke={OL} strokeWidth={22} fill="none" strokeLinecap="round" />
        <path d="M70 128 C40 124 28 96 40 72 C50 52 74 46 86 58" stroke={p.base} strokeWidth={16} fill="none" strokeLinecap="round" strokeDasharray="14 3" />
        {S('M84 54 C96 50 102 58 98 68 L92 62Z', p.accent)}
      </g>}
      {/* 다리 */}
      {legs.map((x, i) => <path key={i} d={`M${x} 134 L${x - 14} 150 L${x - 18} 176`} stroke={OL} strokeWidth={7} fill="none" strokeLinejoin="round" strokeLinecap="round" />)}
      {legs.map((x, i) => <path key={'l' + i} d={`M${x} 134 L${x - 14} 150 L${x - 18} 176`} stroke={p.shade} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />)}
      {/* 몸 */}
      {S('M60 132 C56 112 80 102 110 104 C140 106 160 116 158 132 C156 146 130 152 104 150 C80 150 62 146 60 132Z', p.base)}
      {[80, 100, 120, 140].map((x) => <path key={x} d={`M${x} 108 C${x - 4} 124 ${x - 4} 136 ${x} 148`} stroke={p.shade} strokeWidth={3} fill="none" />)}
      {/* 집게 */}
      <path d="M150 126 C166 118 172 104 168 92" stroke={OL} strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d="M150 126 C166 118 172 104 168 92" stroke={p.base} strokeWidth={6} fill="none" strokeLinecap="round" />
      {S('M160 94 C160 76 180 70 192 80 L176 86 L194 94 C186 104 166 104 160 94Z', p.base)}
      <path d="M152 136 C170 140 180 132 184 122" stroke={OL} strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d="M152 136 C170 140 180 132 184 122" stroke={p.base} strokeWidth={6} fill="none" strokeLinecap="round" />
      {S('M178 124 C176 108 196 104 200 116 L188 118 L200 128 C194 136 180 134 178 124Z', p.shade)}
      {/* 머리 */}
      {S('M142 112 C146 98 162 98 166 110 C168 120 158 128 148 126 C144 124 142 118 142 112Z', p.base)}
      <Eye x={154} y={110} s={5.5} color={p.eye} mood={mood} />
    </g>
  );
}

function Crab({ a, mood }: { a: AnimalArt; mood: string }) {
  const p = PAL[a.element];
  return (
    <g>
      {[-1, 1].map((s) => [0, 1, 2].map((k) => (
        <g key={`${s}${k}`}><path d={`M${100 + s * (30 + k * 8)} 140 L${100 + s * (52 + k * 12)} 150 L${100 + s * (58 + k * 12)} 176`} stroke={OL} strokeWidth={8} fill="none" strokeLinejoin="round" strokeLinecap="round" /><path d={`M${100 + s * (30 + k * 8)} 140 L${100 + s * (52 + k * 12)} 150 L${100 + s * (58 + k * 12)} 176`} stroke={p.shade} strokeWidth={4} fill="none" strokeLinejoin="round" strokeLinecap="round" /></g>
      )))}
      {/* 팔 */}
      {[-1, 1].map((s) => <g key={s}><path d={`M${100 + s * 40} 118 C${100 + s * 60} 108 ${100 + s * 66} 92 ${100 + s * 62} 76`} stroke={OL} strokeWidth={14} fill="none" strokeLinecap="round" /><path d={`M${100 + s * 40} 118 C${100 + s * 60} 108 ${100 + s * 66} 92 ${100 + s * 62} 76`} stroke={p.base} strokeWidth={9} fill="none" strokeLinecap="round" /></g>)}
      {[-1, 1].map((s) => <g key={'c' + s}>{S(`M${100 + s * 56} 82 C${100 + s * 44} 58 ${100 + s * 58} 36 ${100 + s * 80} 40 C${100 + s * 96} 44 ${100 + s * 98} 62 ${100 + s * 88} 74 L${100 + s * 78} 64 L${100 + s * 76} 80 C${100 + s * 70} 86 ${100 + s * 62} 86 ${100 + s * 56} 82Z`, p.base)}<path d={`M${100 + s * 64} 52 q${s * 8} -6 ${s * 16} -4`} stroke={p.light} strokeWidth={3} fill="none" strokeLinecap="round" /></g>)}
      {/* 등딱지 */}
      {S('M46 130 C42 104 68 88 100 88 C132 88 158 104 154 130 C150 146 126 152 100 152 C74 152 50 146 46 130Z', p.base)}
      <path d="M60 140 C84 150 116 150 140 140" stroke={p.shade} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.6} />
      <path d="M62 104 C80 94 120 94 138 104" stroke={p.light} strokeWidth={4} fill="none" strokeLinecap="round" />
      {/* 눈자루 */}
      {[-1, 1].map((s) => <g key={'e' + s}><path d={`M${100 + s * 14} 92 L${100 + s * 18} 70`} stroke={OL} strokeWidth={7} strokeLinecap="round" /><path d={`M${100 + s * 14} 92 L${100 + s * 18} 70`} stroke={p.base} strokeWidth={3} strokeLinecap="round" /></g>)}
      <Eye x={82} y={68} s={6.5} color={p.eye} mood={mood} />
      <Eye x={118} y={68} s={6.5} color={p.eye} mood={mood} />
      <path d="M88 126 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5" stroke={OL} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
    </g>
  );
}

function Biped({ a, mood }: { a: AnimalArt; mood: string }) {
  const p = PAL[a.element];
  return (
    <g>
      {/* 다리 */}
      {S('M74 140 C70 156 70 166 66 176 L94 176 C94 164 96 152 96 142Z', p.shade)}
      {S('M110 142 C112 156 112 166 112 176 L140 176 C136 164 134 152 132 140Z', p.base)}
      {/* 뒷팔 */}
      {S('M70 96 C50 104 40 126 44 146 C48 154 60 154 62 146 C62 132 70 118 82 110Z', p.shade)}
      {/* 몸 */}
      {S('M64 110 C60 76 84 56 108 58 C136 60 150 84 146 116 C142 142 124 152 104 152 C82 152 66 138 64 110Z', p.base)}
      {S('M84 104 C84 90 120 88 124 104 C128 126 116 140 104 140 C90 140 82 126 84 104Z', p.light, 2)}
      {/* 앞팔·발톱 */}
      {S('M136 86 C160 88 174 106 172 128 C170 138 158 140 154 132 C156 118 150 108 136 106Z', p.base)}
      <path d="M156 136 l-2 8 M164 136 l0 9 M171 132 l3 8" stroke="#f3ece0" strokeWidth={3.5} strokeLinecap="round" />
      {/* 머리 */}
      <g transform="translate(112 54) scale(1.12) translate(-112 -54)">
      {S('M80 62 C76 36 96 22 116 24 C138 26 148 42 146 60 C144 76 130 84 112 84 C94 84 82 76 80 62Z', p.base)}
      {S('M88 34 a10 10 0 1 1 14 -8Z', p.shade)}{S('M126 26 a10 10 0 1 1 14 8Z', p.shade)}
      {S('M108 58 C112 50 134 50 138 58 C140 68 132 76 122 76 C112 76 106 68 108 58Z', p.light, 2)}
      <ellipse cx={126} cy={58} rx={6} ry={4.5} fill={OL} />
      <path d="M114 70 Q124 76 134 70" stroke={OL} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M118 71 l2 5 l2 -4 M128 71 l2 4 l2 -5" fill="#fff" stroke={OL} strokeWidth={1.5} />
      <Eye x={100} y={48} s={6.5} color={p.eye} mood={mood} />
      <Eye x={128} y={44} s={6} color={p.eye} mood={mood} />
      </g>
    </g>
  );
}

function Cetacean({ a, mood }: { a: AnimalArt; mood: string }) {
  const p = PAL[a.element];
  return (
    <g>
      {S('M40 120 C24 112 14 96 10 82 C24 88 34 90 40 86 C40 74 34 62 30 52 C46 62 56 82 58 104Z', p.shade)}
      {S('M100 74 C104 48 116 28 126 18 C130 40 132 58 128 76Z', p.shade)}
      {S('M50 112 C60 80 100 66 144 70 C176 72 196 92 196 114 C196 136 176 152 140 154 C100 156 62 144 50 112Z', p.base)}
      {S('M92 128 C112 148 150 152 182 132 C186 124 178 120 168 124 C140 132 112 132 92 128Z', a.element === 'shadow' || a.element === 'metal' ? '#f1f3f6' : p.light, 2.5)}
      {S('M120 134 L106 160 L138 140Z', p.shade)}
      <path d="M170 124 C178 122 188 118 194 112" stroke={OL} strokeWidth={3} strokeLinecap="round" />
      <path d="M176 124 l2 5 l2 -5 l2 5 l2 -5 l2 4" stroke="#fff" strokeWidth={1.8} fill="none" />
      {S('M150 92 C156 86 168 86 172 94 C166 98 156 98 150 92Z', '#f1f3f6', 2)}
      <Eye x={162} y={100} s={6.5} color={p.eye} mood={mood} />
    </g>
  );
}

function Bat({ a, mood }: { a: AnimalArt; mood: string }) {
  const p = PAL[a.element];
  const wing = (s: number) => S(`M${100 + s * 14} 100 C${100 + s * 40} 70 ${100 + s * 70} 50 ${100 + s * 96} 52 C${100 + s * 90} 66 ${100 + s * 94} 76 ${100 + s * 96} 88 C${100 + s * 84} 84 ${100 + s * 76} 90 ${100 + s * 76} 104 C${100 + s * 66} 98 ${100 + s * 56} 102 ${100 + s * 54} 116 C${100 + s * 44} 110 ${100 + s * 30} 114 ${100 + s * 20} 124Z`, s < 0 ? p.shade : p.base);
  return (
    <g>
      {wing(-1)}{wing(1)}
      {[-1, 1].map((s) => <path key={s} d={`M${100 + s * 18} 102 L${100 + s * 96} 52 M${100 + s * 40} 92 L${100 + s * 76} 104 M${100 + s * 30} 102 L${100 + s * 54} 116`} stroke={OL} strokeWidth={2.5} fill="none" opacity={0.7} />)}
      {S('M80 116 C78 94 90 84 100 84 C112 84 122 94 120 116 C118 136 110 146 100 146 C90 146 82 136 80 116Z', p.base)}
      <path d="M88 130 C96 138 106 138 112 130" stroke={p.light} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.6} />
      {S('M84 84 L76 46 L96 74Z', p.base)}{S('M116 84 L124 46 L104 74Z', p.base)}
      {S('M82 92 C80 74 90 66 100 66 C110 66 120 74 118 92 C116 102 108 106 100 106 C92 106 84 102 82 92Z', p.base)}
      <path d="M92 98 Q100 104 108 98" stroke={OL} strokeWidth={2.5} fill="none" />
      <path d="M94 99 l2 5 l2 -4 M104 99 l2 4 l2 -5" fill="#fff" stroke={OL} strokeWidth={1.4} />
      <Eye x={92} y={84} s={5.5} color={p.eye} dir={-1} mood={mood} />
      <Eye x={108} y={84} s={5.5} color={p.eye} mood={mood} />
      <path d="M92 146 l-4 12 M108 146 l4 12" stroke={OL} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
}

/* 몸 틀별 속성 효과 기준점 */
const ANCHORS: Record<Plan, { back: [number, number, number][]; around: [number, number][]; body: [number, number][] }> = {
  quad: { back: [[72, 82, -20], [92, 74, -8], [112, 72, 4], [130, 74, 14], [60, 96, -40]], around: [[30, 40], [176, 24], [20, 150], [186, 140], [110, 30]], body: [[90, 108], [112, 104], [124, 120], [78, 120]] },
  bird: { back: [[50, 52, -40], [176, 34, 30], [30, 40, -60], [80, 150, -120]], around: [[20, 120], [186, 120], [100, 30], [60, 186]], body: [[104, 110], [124, 104], [116, 128]] },
  fish: { back: [[84, 76, -10], [108, 70, 0], [132, 72, 10], [20, 100, -80]], around: [[30, 40], [180, 40], [20, 170], [180, 176]], body: [[90, 104], [112, 100], [134, 108]] },
  serpent: { back: [[118, 46, -30], [186, 46, 30], [74, 140, -20], [100, 138, 0], [126, 138, 10]], around: [[30, 60], [190, 110], [20, 140], [90, 30]], body: [[96, 160], [130, 168], [150, 120]] },
  arachnid: { back: [[86, 102, -10], [108, 100, 0], [130, 102, 10], [40, 64, -40]], around: [[20, 40], [186, 50], [20, 180], [180, 176]], body: [[90, 126], [112, 128], [134, 128]] },
  crab: { back: [[72, 92, -30], [100, 86, 0], [128, 92, 30], [40, 40, -40], [160, 40, 40]], around: [[20, 110], [180, 120], [100, 20], [100, 186]], body: [[80, 118], [100, 114], [120, 118]] },
  biped: { back: [[70, 70, -30], [84, 56, -15], [60, 90, -50], [146, 70, 30]], around: [[24, 60], [180, 40], [26, 170], [184, 168]], body: [[84, 120], [124, 118], [104, 96]] },
  cetacean: { back: [[80, 82, -20], [140, 70, 10], [160, 76, 20], [30, 60, -40]], around: [[20, 140], [100, 30], [186, 60], [60, 176]], body: [[90, 104], [116, 96], [140, 98]] },
  bat: { back: [[30, 58, -40], [170, 58, 40], [60, 64, -20], [140, 64, 20]], around: [[20, 120], [180, 120], [100, 30], [100, 180]], body: [[92, 120], [108, 122], [100, 108]] },
};

export function LegendCrest({ el }: { el: Element }) {
  const p = PAL[el];
  return <g>{S('M86 10 L92 -4 L100 8 L108 -4 L114 10 Z', '#ffd23f', 2.5)}<circle cx={100} cy={6} r={2.5} fill={p.accent} /></g>;
}

export function AnimalMonster({ art, size = 160, mood = 'normal', className, silhouette, label }: { art: AnimalArt; size?: number; mood?: string; className?: string; silhouette?: boolean; label?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const p = PAL[art.element];
  const A = ANCHORS[art.plan];
  const Body = { quad: Quad, bird: Bird, fish: Fish, serpent: Serpent, arachnid: Arachnid, crab: Crab, biped: Biped, cetacean: Cetacean, bat: Bat }[art.plan];
  const special = !silhouette && art.tier !== 'common';
  const legend = art.tier === 'legend';
  return (
    <svg viewBox={special && label !== false ? '0 -32 200 232' : '0 0 200 200'} width={size} height={size} className={className} role="img" style={silhouette ? { filter: 'brightness(0)', opacity: 0.35 } : undefined}>
      {special && (
        <g>
          <defs><radialGradient id={`ag${uid}`}><stop offset="0" stopColor={legend ? '#ffd23f' : p.light} stopOpacity={0.85} /><stop offset="1" stopColor={legend ? '#ff8a00' : p.base} stopOpacity={0} /></radialGradient></defs>
          <circle cx={100} cy={110} r={98} fill={`url(#ag${uid})`} />
          <g className="aura-rays" style={{ transformOrigin: '100px 110px' }}>{Array.from({ length: legend ? 16 : 10 }, (_, i) => <path key={i} d="M100 110 L94 4 L106 4Z" fill={legend ? '#ffd23f' : p.light} opacity={0.3} transform={`rotate(${i * (360 / (legend ? 16 : 10))} 100 110)`} />)}</g>
          {label !== false && <text x={100} y={-4} textAnchor="middle" fontSize={legend ? 34 : 32} fontWeight={900} fontFamily="Arial Black, Arial, sans-serif" letterSpacing={legend ? 2 : 4} fill={legend ? '#fff3b0' : '#ffffff'} stroke={legend ? '#b35a00' : p.shade} strokeWidth={2.5}>{legend ? 'LEGEND' : 'RARE'}</text>}
        </g>
      )}
      <ellipse cx={104} cy={182} rx={64} ry={8} fill="#00000030" />
      <g transform={legend ? 'translate(100 110) scale(1.06) translate(-100 -110)' : undefined}>
        <ElementFx el={art.element} tier={art.tier} back={A.back.filter((_, i) => i % 2 === 1 || art.tier !== 'common')} around={[]} body={[]} />
        <Body a={art} mood={mood} />
        <ElementFx el={art.element} tier={art.tier} back={A.back.filter((_, i) => i % 2 === 0)} around={A.around} body={A.body} />
        {art.tier !== 'common' && A.body.map(([x, y], i) => <circle key={i} cx={x} cy={y + 8} r={2.2} fill={p.accent} opacity={0.9} />)}
        {legend && <g transform={art.plan === 'quad' ? 'translate(62 34)' : art.plan === 'bird' ? 'translate(48 38)' : art.plan === 'serpent' ? 'translate(62 24)' : art.plan === 'biped' ? 'translate(12 12)' : art.plan === 'cetacean' ? 'translate(66 58)' : 'translate(0 40)'}><LegendCrest el={art.element} /></g>}
      </g>
    </svg>
  );
}
