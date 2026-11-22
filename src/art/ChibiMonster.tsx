// 친구 같은 동글동글 몬스터 (직접 그린 SVG). 둥근 몸 + 동물 부품 + 속성 장식 + 등급 연출
import { useId } from 'react';

export type Element = 'fire' | 'water' | 'plant' | 'electric' | 'ice' | 'rock' | 'earth' | 'wind' | 'poison' | 'metal' | 'shadow' | 'light';
export type Tier = 'common' | 'rare' | 'legend';
export type Shape = 'egg' | 'wide' | 'tall' | 'drop';
export type Part =
  | 'ears-pointy' | 'ears-round' | 'ears-long' | 'ears-bat' | 'ears-small'
  | 'snout' | 'horn' | 'horns-curl' | 'antlers' | 'tusks' | 'trunk' | 'beak' | 'beak-hook' | 'bill'
  | 'spines' | 'mane' | 'crest' | 'hood' | 'whiskers' | 'mask' | 'stripes' | 'spots'
  | 'tail-bushy' | 'tail-thin' | 'tail-tuft' | 'tail-fin' | 'tail-fluke' | 'tail-coil' | 'tail-stinger' | 'tail-feather'
  | 'wings-bird' | 'wings-bat' | 'wings-bug' | 'fins' | 'dorsal' | 'claws' | 'pincers' | 'legs-many' | 'feet-none' | 'antennae' | 'shell' | 'teeth'
  | 'ears-big' | 'tail-flat' | 'tail-curl' | 'snout-long' | 'hump' | 'horns-small' | 'mandibles' | 'tentacles' | 'shell-spiral' | 'star-arms'
  | 'frog-eyes' | 'tongue' | 'lure' | 'beak-long';
export interface ChibiArt { shape: Shape; element: Element; tier: Tier; parts: Part[]; hue?: number }

const OL = '#2a2233';
const PAL: Record<Element, { base: string; shade: string; belly: string; accent: string }> = {
  fire: { base: '#ff8a5c', shade: '#e0603a', belly: '#ffd7b8', accent: '#ffcf3f' },
  water: { base: '#6fb8f2', shade: '#4a90d0', belly: '#d8f0ff', accent: '#ffffff' },
  plant: { base: '#8ed07a', shade: '#62a957', belly: '#e6f8cf', accent: '#ffe066' },
  electric: { base: '#9db4ff', shade: '#7088e6', belly: '#e8eeff', accent: '#ffe14a' },
  ice: { base: '#a8dcf7', shade: '#78b6dd', belly: '#ffffff', accent: '#e8fbff' },
  rock: { base: '#b9a894', shade: '#8f7f6c', belly: '#e8ddcc', accent: '#e8a84a' },
  earth: { base: '#d9a066', shade: '#b07a45', belly: '#f6e2c2', accent: '#8a5a2a' },
  wind: { base: '#9fe2d6', shade: '#6fbfb2', belly: '#effffb', accent: '#ffffff' },
  poison: { base: '#b58ae0', shade: '#8a62b8', belly: '#ecdcfb', accent: '#9cff3a' },
  metal: { base: '#b8c4d4', shade: '#8c9aae', belly: '#eef2f8', accent: '#4a7de0' },
  shadow: { base: '#6e5aa8', shade: '#4f3f82', belly: '#c9bdf0', accent: '#ff7ac8' },
  light: { base: '#fff1b8', shade: '#e8cf7a', belly: '#ffffff', accent: '#ffb02e' },
};
function hueShift(hex: string, deg: number): string {
  if (!deg) return hex;
  const n = parseInt(hex.slice(1), 16); let r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
  h = (h + deg / 360 + 1) % 1;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, pp = 2 * l - q;
  const f = (t: number) => { t = (t + 1) % 1; return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp; };
  return '#' + [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}
const P = (d: string, fill: string, w = 4) => <path d={d} fill={fill} stroke={OL} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />;

const BODY: Record<Shape, { d: string; top: number; cx: number; cy: number; w: number }> = {
  egg: { d: 'M100 52 C142 52 162 84 162 118 C162 152 136 172 100 172 C64 172 38 152 38 118 C38 84 58 52 100 52Z', top: 52, cx: 100, cy: 116, w: 62 },
  wide: { d: 'M100 66 C150 66 174 92 174 124 C174 156 142 170 100 170 C58 170 26 156 26 124 C26 92 50 66 100 66Z', top: 66, cx: 100, cy: 122, w: 74 },
  tall: { d: 'M100 44 C136 44 154 76 154 114 C154 152 132 174 100 174 C68 174 46 152 46 114 C46 76 64 44 100 44Z', top: 44, cx: 100, cy: 112, w: 54 },
  drop: { d: 'M100 44 C124 60 160 88 160 124 C160 154 134 172 100 172 C66 172 40 154 40 124 C40 88 76 60 100 44Z', top: 44, cx: 100, cy: 120, w: 60 },
};

function Face({ y, mood, has, base }: { y: number; mood: string; has: (p: Part) => boolean; base: string }) {
  const ex = 20;
  const eye = (x: number) => mood === 'hurt'
    ? <path key={x} d={`M${x - 5} ${y - 4} l8 4 l-8 4`} stroke={OL} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    : mood === 'happy' || mood === 'cheer'
      ? <path key={x} d={`M${x - 6} ${y + 2} q6 -8 12 0`} stroke={OL} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      : <g key={x}><ellipse cx={x} cy={y} rx={5.5} ry={7} fill={OL} /><circle cx={x + 1.8} cy={y - 2.6} r={2.2} fill="#fff" /></g>;
  return (
    <g>
      {has('mask') && <path d={`M${100 - ex - 14} ${y - 4} Q100 ${y - 16} ${100 + ex + 14} ${y - 4} Q${100 + ex + 10} ${y + 10} 100 ${y + 4} Q${100 - ex - 10} ${y + 10} ${100 - ex - 14} ${y - 4}Z`} fill="#4a3a5a" opacity={0.85} />}
      {eye(100 - ex)}{eye(100 + ex)}
      <ellipse cx={100 - ex - 12} cy={y + 13} rx={9} ry={5.5} fill="#ff8fa8" opacity={0.55} />
      <ellipse cx={100 + ex + 12} cy={y + 13} rx={9} ry={5.5} fill="#ff8fa8" opacity={0.55} />
      {has('snout') && <g><ellipse cx={100} cy={y + 14} rx={14} ry={9} fill="#fff6ee" stroke={OL} strokeWidth={3} /><ellipse cx={100} cy={y + 10} rx={4.5} ry={3.2} fill={OL} /></g>}
      {has('beak') && P(`M90 ${y + 8} L110 ${y + 8} L100 ${y + 20}Z`, '#ffb547', 3)}
      {has('beak-hook') && P(`M90 ${y + 7} Q104 ${y + 2} 112 ${y + 10} Q108 ${y + 20} 100 ${y + 20} Q94 ${y + 14} 90 ${y + 7}Z`, '#ffb547', 3)}
      {has('beak-long') && P(`M92 ${y + 8} L${has('crest') ? 140 : 132} ${y + 14} L92 ${y + 18}Z`, '#ffb547', 3)}
      {has('snout-long') && <g>{P(`M90 ${y + 8} C100 ${y + 4} 132 ${y + 8} 140 ${y + 14} C134 ${y + 22} 104 ${y + 24} 90 ${y + 20}Z`, '#fff6ee', 3)}<ellipse cx={136} cy={y + 13} rx={3.5} ry={3} fill={OL} /></g>}
      {has('tongue') && <path d={`M100 ${y + 18} q2 10 -4 14 m4 -14 q4 8 8 10`} stroke="#ff4f7a" strokeWidth={3} fill="none" strokeLinecap="round" />}
      {has('bill') && P(`M86 ${y + 10} Q100 ${y + 4} 114 ${y + 10} Q100 ${y + 20} 86 ${y + 10}Z`, '#ffb547', 3)}
      {!has('beak') && !has('beak-hook') && !has('bill') && !has('trunk') && !has('beak-long') && !has('snout-long') && (
        has('teeth')
          ? <g><path d={`M90 ${y + 16} Q100 ${y + 24} 110 ${y + 16}Z`} fill="#7a2a3a" stroke={OL} strokeWidth={3} strokeLinejoin="round" /><path d={`M93 ${y + 17} l2 3 l2 -3 l2 3 l2 -3 l2 3 l2 -3 l2 3 l2 -3`} stroke="#fff" strokeWidth={1.6} fill="none" /></g>
          : <g><path d={`M93 ${y + (has('snout') ? 22 : 15)} q3.5 4 7 0 q3.5 4 7 0`} stroke={OL} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d={`M102 ${y + (has('snout') ? 23 : 16)} l1.5 3.5 l1.5 -3`} fill="#fff" stroke={OL} strokeWidth={1.3} /></g>
      )}
      {has('trunk') && P(`M94 ${y + 8} C92 ${y + 28} 104 ${y + 40} 116 ${y + 34} C118 ${y + 30} 112 ${y + 28} 108 ${y + 30} C104 ${y + 28} 104 ${y + 18} 106 ${y + 8}Z`, base, 3)}
      {has('whiskers') && <g stroke={OL} strokeWidth={2} strokeLinecap="round"><path d={`M${100 - 30} ${y + 14} l-14 -3 M${100 - 30} ${y + 18} l-14 3 M${130} ${y + 14} l14 -3 M130 ${y + 18} l14 3`} /></g>}
      {has('tusks') && <g>{P(`M88 ${y + 20} q-4 8 2 12 q0 -6 4 -10Z`, '#fffaf0', 2.5)}{P(`M112 ${y + 20} q4 8 -2 12 q0 -6 -4 -10Z`, '#fffaf0', 2.5)}</g>}
    </g>
  );
}

function ElementTop({ el, x, y, tier }: { el: Element; x: number; y: number; tier: Tier }) {
  const p = PAL[el], k = tier === 'legend' ? 1.25 : tier === 'rare' ? 1.1 : 1;
  const g = (c: JSX.Element) => <g transform={`translate(${x} ${y}) scale(${k})`}>{c}</g>;
  switch (el) {
    case 'fire': return g(<g>{P('M-12 4 C-16 -8 -6 -14 -4 -24 C2 -14 4 -18 6 -28 C14 -16 18 -6 12 4Z', '#ff6a3a', 3)}{P('M-5 3 C-6 -4 -1 -8 0 -14 C4 -8 6 -4 5 3Z', '#ffd23f', 2)}</g>);
    case 'ice': return g(<g>{P('M-14 4 L-10 -12 L-6 4Z', '#e8fbff', 3)}{P('M-5 4 L0 -22 L5 4Z', '#ffffff', 3)}{P('M6 4 L10 -10 L14 4Z', '#e8fbff', 3)}</g>);
    case 'plant': return g(<g><path d="M0 4 L0 -10" stroke={OL} strokeWidth={4} strokeLinecap="round" />{P('M0 -8 C-6 -20 -20 -20 -22 -12 C-16 -4 -6 -4 0 -8Z', '#6fcf5a', 3)}{P('M0 -10 C6 -24 20 -22 22 -14 C16 -6 6 -6 0 -10Z', '#8ee06a', 3)}</g>);
    case 'electric': return g(<g>{P('M-4 4 L4 -10 L-2 -10 L6 -26 L-8 -6 L-2 -6 L-8 4Z', '#ffe14a', 3)}</g>);
    case 'metal': return g(<g>{P('M-20 6 Q-20 -14 0 -16 Q20 -14 20 6Z', '#d6deea', 3)}<path d="M0 -16 L0 6" stroke={OL} strokeWidth={2.5} /><circle cx={-12} cy={0} r={2} fill={OL} /><circle cx={12} cy={0} r={2} fill={OL} /></g>);
    case 'rock': return g(<g>{P('M-16 6 L-12 -8 L-2 -14 L10 -10 L16 4Z', '#cdbfaa', 3)}<path d="M-6 -6 L2 0" stroke={OL} strokeWidth={2} /></g>);
    case 'earth': return g(<g>{P('M-14 6 C-14 -6 -4 -10 0 -18 C4 -10 14 -6 14 6Z', '#c98a4a', 3)}<circle cx={-4} cy={-2} r={2} fill={OL} /><circle cx={5} cy={1} r={1.6} fill={OL} /></g>);
    case 'wind': return g(<g><path d="M-14 0 C-14 -14 4 -18 10 -10 C14 -4 6 2 0 -4" stroke={OL} strokeWidth={7} fill="none" strokeLinecap="round" /><path d="M-14 0 C-14 -14 4 -18 10 -10 C14 -4 6 2 0 -4" stroke="#ffffff" strokeWidth={3} fill="none" strokeLinecap="round" /></g>);
    case 'poison': return g(<g>{P('M-14 0 Q-14 -18 0 -18 Q14 -18 14 0Z', '#a35ad6', 3)}<circle cx={-6} cy={-9} r={3} fill="#c8ff5a" /><circle cx={5} cy={-6} r={2.5} fill="#c8ff5a" /><rect x={-4} y={0} width={8} height={6} fill="#f2ecff" stroke={OL} strokeWidth={2.5} /></g>);
    case 'shadow': return g(<g>{P('M-14 6 C-20 -6 -12 -14 -8 -22 C-6 -12 -2 -10 0 -4 C2 -10 6 -12 8 -22 C12 -14 20 -6 14 6Z', '#4f3f82', 3)}<circle cx={-6} cy={-2} r={2} fill={p.accent} /><circle cx={6} cy={-2} r={2} fill={p.accent} /></g>);
    case 'light': return <g><ellipse cx={x} cy={y - 14 * k} rx={20 * k} ry={6 * k} fill="none" stroke="#ffcf3f" strokeWidth={4} /><ellipse cx={x} cy={y - 14 * k} rx={20 * k} ry={6 * k} fill="none" stroke="#fff7c8" strokeWidth={1.5} /></g>;
    case 'water': return g(<g>{P('M0 -24 C-10 -10 -14 -4 -12 2 C-10 8 10 8 12 2 C14 -4 10 -10 0 -24Z', '#8fd0ff', 3)}<ellipse cx={-4} cy={-4} rx={2.5} ry={4} fill="#fff" /></g>);
  }
}

function Sparkle({ x, y, s = 1, c = '#fff' }: { x: number; y: number; s?: number; c?: string }) {
  return <path d={`M${x} ${y - 7 * s} L${x + 2 * s} ${y - 2 * s} L${x + 7 * s} ${y} L${x + 2 * s} ${y + 2 * s} L${x} ${y + 7 * s} L${x - 2 * s} ${y + 2 * s} L${x - 7 * s} ${y} L${x - 2 * s} ${y - 2 * s}Z`} fill={c} />;
}

export function ChibiMonster({ art, size = 160, mood = 'normal', className, silhouette, label }: { art: ChibiArt; size?: number; mood?: string; className?: string; silhouette?: boolean; label?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const p0 = PAL[art.element];
  const p = { ...p0, base: hueShift(p0.base, art.hue ?? 0), shade: hueShift(p0.shade, art.hue ?? 0) };
  const B = BODY[art.shape];
  const has = (x: Part) => art.parts.includes(x);
  const legend = art.tier === 'legend', special = !silhouette && art.tier !== 'common';
  const faceY = B.cy - 8;
  const fill = (d: string, c = p.base, w = 4) => P(d, c, w);
  const top = B.top;
  return (
    <svg viewBox={special && label !== false ? '0 -32 200 232' : '0 0 200 200'} width={size} height={size} className={className} role="img" style={silhouette ? { filter: 'brightness(0)', opacity: 0.35 } : undefined}>
      {special && (
        <g>
          <defs><radialGradient id={`cg${uid}`}><stop offset="0" stopColor={legend ? '#ffe07a' : p.belly} stopOpacity={0.95} /><stop offset="1" stopColor={legend ? '#ffb000' : p.base} stopOpacity={0} /></radialGradient></defs>
          <circle cx={100} cy={112} r={98} fill={`url(#cg${uid})`} />
          <g className="aura-rays" style={{ transformOrigin: '100px 112px' }}>{Array.from({ length: legend ? 16 : 10 }, (_, i) => <path key={i} d="M100 112 L94 6 L106 6Z" fill={legend ? '#ffd23f' : '#ffffff'} opacity={0.3} transform={`rotate(${i * (360 / (legend ? 16 : 10))} 100 112)`} />)}</g>
          {label !== false && <text x={100} y={-4} textAnchor="middle" fontSize={legend ? 34 : 32} fontWeight={900} fontFamily="Arial Black, Arial, sans-serif" letterSpacing={legend ? 2 : 4} fill={legend ? '#fff3b0' : '#ffffff'} stroke={legend ? '#b35a00' : p.shade} strokeWidth={2.5}>{legend ? 'LEGEND' : 'RARE'}</text>}
        </g>
      )}
      <ellipse cx={100} cy={180} rx={50} ry={7} fill="#00000026" />
      {/* 뒤쪽 부품 */}
      {has('mane') && <g>{Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; const r = B.w + 10; return <circle key={i} cx={100 + Math.cos(a) * r * 0.92} cy={faceY + Math.sin(a) * r * 0.82} r={16} fill={i % 2 ? p.shade : p.accent} stroke={OL} strokeWidth={3.5} />; })}</g>}
      {has('hood') && fill(`M100 ${top - 10} C56 ${top - 16} 8 ${faceY} 24 ${faceY + 44} C48 ${faceY + 30} 60 ${faceY + 30} 66 ${faceY + 34} L134 ${faceY + 34} C140 ${faceY + 30} 152 ${faceY + 30} 176 ${faceY + 44} C192 ${faceY} 144 ${top - 16} 100 ${top - 10}Z`, p.shade)}
      {has('hood') && <g fill={p.accent} stroke={OL} strokeWidth={2.5}><ellipse cx={34} cy={faceY + 10} rx={6} ry={9} /><ellipse cx={166} cy={faceY + 10} rx={6} ry={9} /></g>}
      {has('wings-bird') && <g>{fill(`M46 ${B.cy} C20 ${B.cy - 10} 8 ${B.cy - 34} 14 ${B.cy - 46} C24 ${B.cy - 34} 34 ${B.cy - 34} 40 ${B.cy - 26} C44 ${B.cy - 40} 52 ${B.cy - 44} 58 ${B.cy - 42}Z`, p.shade)}{fill(`M154 ${B.cy} C180 ${B.cy - 10} 192 ${B.cy - 34} 186 ${B.cy - 46} C176 ${B.cy - 34} 166 ${B.cy - 34} 160 ${B.cy - 26} C156 ${B.cy - 40} 148 ${B.cy - 44} 142 ${B.cy - 42}Z`, p.shade)}</g>}
      {has('wings-bat') && <g>{fill(`M48 ${B.cy - 6} C26 ${B.cy - 40} 8 ${B.cy - 44} 4 ${B.cy - 30} C14 ${B.cy - 26} 12 ${B.cy - 14} 20 ${B.cy - 8} C26 ${B.cy - 14} 34 ${B.cy - 10} 34 ${B.cy - 2} C40 ${B.cy - 6} 46 ${B.cy - 2} 46 ${B.cy + 4}Z`, p.shade)}{fill(`M152 ${B.cy - 6} C174 ${B.cy - 40} 192 ${B.cy - 44} 196 ${B.cy - 30} C186 ${B.cy - 26} 188 ${B.cy - 14} 180 ${B.cy - 8} C174 ${B.cy - 14} 166 ${B.cy - 10} 166 ${B.cy - 2} C160 ${B.cy - 6} 154 ${B.cy - 2} 154 ${B.cy + 4}Z`, p.shade)}</g>}
      {has('wings-bug') && <g>{[-1, 1].map((s) => <ellipse key={s} cx={100 + s * 56} cy={B.cy - 34} rx={30} ry={16} fill="#f2fbff" stroke={OL} strokeWidth={3} opacity={0.95} transform={`rotate(${s * -25} ${100 + s * 56} ${B.cy - 34})`} />)}</g>}
      {has('tail-bushy') && fill(`M${100 + B.w - 6} ${B.cy + 30} C${100 + B.w + 34} ${B.cy + 30} ${100 + B.w + 40} ${B.cy - 12} ${100 + B.w + 20} ${B.cy - 30} C${100 + B.w + 18} ${B.cy - 10} ${100 + B.w + 8} ${B.cy + 4} ${100 + B.w - 10} ${B.cy + 10}Z`, p.shade)}
      {has('tail-thin') && <g><path d={`M${100 + B.w - 6} ${B.cy + 34} C${100 + B.w + 22} ${B.cy + 40} ${100 + B.w + 28} ${B.cy + 14} ${100 + B.w + 18} ${B.cy + 6}`} stroke={OL} strokeWidth={10} fill="none" strokeLinecap="round" /><path d={`M${100 + B.w - 6} ${B.cy + 34} C${100 + B.w + 22} ${B.cy + 40} ${100 + B.w + 28} ${B.cy + 14} ${100 + B.w + 18} ${B.cy + 6}`} stroke={p.shade} strokeWidth={5} fill="none" strokeLinecap="round" /></g>}
      {has('tail-tuft') && <g><path d={`M${100 + B.w - 6} ${B.cy + 34} C${100 + B.w + 20} ${B.cy + 34} ${100 + B.w + 22} ${B.cy + 14} ${100 + B.w + 18} ${B.cy + 2}`} stroke={OL} strokeWidth={9} fill="none" strokeLinecap="round" /><path d={`M${100 + B.w - 6} ${B.cy + 34} C${100 + B.w + 20} ${B.cy + 34} ${100 + B.w + 22} ${B.cy + 14} ${100 + B.w + 18} ${B.cy + 2}`} stroke={p.shade} strokeWidth={4} fill="none" strokeLinecap="round" /><circle cx={100 + B.w + 18} cy={B.cy - 2} r={9} fill={has('mane') ? p.accent : p.shade} stroke={OL} strokeWidth={3.5} /></g>}
      {has('tail-fin') && fill(`M${100 + B.w - 8} ${B.cy + 10} L${100 + B.w + 28} ${B.cy - 18} L${100 + B.w + 20} ${B.cy + 12} L${100 + B.w + 30} ${B.cy + 40}Z`, p.shade)}
      {has('tail-fluke') && fill(`M${100 + B.w - 10} ${B.cy + 24} C${100 + B.w + 8} ${B.cy + 20} ${100 + B.w + 14} ${B.cy} ${100 + B.w + 10} ${B.cy - 14} C${100 + B.w + 24} ${B.cy - 10} ${100 + B.w + 34} ${B.cy - 18} ${100 + B.w + 38} ${B.cy - 28} C${100 + B.w + 40} ${B.cy - 6} ${100 + B.w + 26} ${B.cy + 4} ${100 + B.w + 20} ${B.cy + 10} C${100 + B.w + 14} ${B.cy + 28} ${100 + B.w} ${B.cy + 34} ${100 + B.w - 14} ${B.cy + 34}Z`, p.shade)}
      {has('tail-stinger') && <g><path d={`M${100 + B.w - 10} ${B.cy + 30} C${100 + B.w + 30} ${B.cy + 30} ${100 + B.w + 34} ${B.cy - 30} ${100 + B.w + 4} ${B.cy - 44}`} stroke={OL} strokeWidth={18} fill="none" strokeLinecap="round" /><path d={`M${100 + B.w - 10} ${B.cy + 30} C${100 + B.w + 30} ${B.cy + 30} ${100 + B.w + 34} ${B.cy - 30} ${100 + B.w + 4} ${B.cy - 44}`} stroke={p.shade} strokeWidth={11} fill="none" strokeLinecap="round" strokeDasharray="12 4" />{fill(`M${100 + B.w + 4} ${B.cy - 54} C${100 + B.w + 16} ${B.cy - 56} ${100 + B.w + 16} ${B.cy - 40} ${100 + B.w + 4} ${B.cy - 38} L${100 + B.w - 6} ${B.cy - 48}Z`, p.accent, 3)}</g>}
      {has('tail-coil') && <g><path d={`M60 ${B.cy + 46} C40 ${B.cy + 62} 150 ${B.cy + 66} 166 ${B.cy + 44} C178 ${B.cy + 28} 160 ${B.cy + 18} 152 ${B.cy + 30}`} stroke={OL} strokeWidth={26} fill="none" strokeLinecap="round" /><path d={`M60 ${B.cy + 46} C40 ${B.cy + 62} 150 ${B.cy + 66} 166 ${B.cy + 44} C178 ${B.cy + 28} 160 ${B.cy + 18} 152 ${B.cy + 30}`} stroke={p.shade} strokeWidth={18} fill="none" strokeLinecap="round" /></g>}
      {has('dorsal') && fill(`M92 ${top + 6} C96 ${top - 22} 108 ${top - 36} 120 ${top - 40} C118 ${top - 22} 118 ${top - 6} 116 ${top + 8}Z`, p.shade)}
      {has('spines') && <g>{Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (1.0 + i * 0.125); const r1 = B.w - 8, r2 = B.w + 26; const cx = 100, cy = B.cy + 4; return fill(`M${cx + Math.cos(a - 0.12) * r1} ${cy + Math.sin(a - 0.12) * r1 * 1.05} Q${cx + Math.cos(a) * (r2 + 4)} ${cy + Math.sin(a) * (r2 + 4) * 1.05} ${cx + Math.cos(a + 0.12) * r1} ${cy + Math.sin(a + 0.12) * r1 * 1.05}Z`, i % 2 ? p.shade : p.accent, 3); })}</g>}
      {has('tail-flat') && <g>{P(`M${100 + B.w - 12} ${B.cy + 36} C${100 + B.w + 10} ${B.cy + 36} ${100 + B.w + 40} ${B.cy + 46} ${100 + B.w + 36} ${B.cy + 58} C${100 + B.w + 20} ${B.cy + 62} ${100 + B.w} ${B.cy + 54} ${100 + B.w - 14} ${B.cy + 50}Z`, p.shade, 3.5)}<path d={`M${100 + B.w + 8} ${B.cy + 44} l8 10 M${100 + B.w + 20} ${B.cy + 46} l6 9`} stroke={OL} strokeWidth={2} /></g>}
      {has('tail-curl') && <g><path d={`M${100 + B.w - 8} ${B.cy + 30} C${100 + B.w + 26} ${B.cy + 34} ${100 + B.w + 30} ${B.cy - 6} ${100 + B.w + 12} ${B.cy - 8} C${100 + B.w} ${B.cy - 8} ${100 + B.w + 2} ${B.cy + 8} ${100 + B.w + 12} ${B.cy + 6}`} stroke={OL} strokeWidth={11} fill="none" strokeLinecap="round" /><path d={`M${100 + B.w - 8} ${B.cy + 30} C${100 + B.w + 26} ${B.cy + 34} ${100 + B.w + 30} ${B.cy - 6} ${100 + B.w + 12} ${B.cy - 8} C${100 + B.w} ${B.cy - 8} ${100 + B.w + 2} ${B.cy + 8} ${100 + B.w + 12} ${B.cy + 6}`} stroke={p.shade} strokeWidth={5} fill="none" strokeLinecap="round" /></g>}
      {has('tail-feather') && <g>{[-60, -30, 0, 30, 60].map((a, i) => <g key={a} transform={`translate(100 ${B.cy + 10}) rotate(${a})`}>{P(`M-9 0 Q-14 -${B.w + 30} 0 -${B.w + 40} Q14 -${B.w + 30} 9 0Z`, i % 2 ? p.shade : p.accent, 3)}<circle cy={-(B.w + 26)} r={6} fill={p.belly} stroke={OL} strokeWidth={2.5} /></g>)}</g>}
      {has('star-arms') && <g>{[0, 72, 144, 216, 288].map((a) => <g key={a} transform={`translate(100 ${B.cy + 4}) rotate(${a})`}>{P(`M-18 -${B.w - 20} Q0 -${B.w + 34} 18 -${B.w - 20}Z`, p.base, 4)}</g>)}</g>}
      {has('shell-spiral') && <g>{P(`M${100 + B.w - 34} ${B.cy - 6} a${B.w * 0.62} ${B.w * 0.62} 0 1 1 1 0Z`, p.shade, 4)}<path d={`M${100 + B.w + 4} ${B.cy - 6} m-24 0 a24 24 0 1 1 24 24 a16 16 0 1 1 -16 -16 a8 8 0 1 1 8 8`} stroke={OL} strokeWidth={3} fill="none" /></g>}
      {has('hump') && fill(`M${100 - 30} ${top + 14} C${100 - 26} ${top - 22} ${100 + 4} ${top - 24} ${100 + 8} ${top + 4}Z`, p.shade)}
      {has('frog-eyes') && <g>{fill(`M${100 - 38} ${top + 20} a16 16 0 1 1 30 -4Z`)}{fill(`M${100 + 38} ${top + 20} a16 16 0 1 0 -30 -4Z`)}</g>}
      {/* 귀 */}
      {has('ears-pointy') && <g>{fill(`M66 ${top + 22} L62 ${top - 16} L90 ${top + 6}Z`)}{fill(`M134 ${top + 22} L138 ${top - 16} L110 ${top + 6}Z`)}<path d={`M68 ${top + 10} L66 ${top - 4} M132 ${top + 10} L134 ${top - 4}`} stroke="#ff9fb5" strokeWidth={5} strokeLinecap="round" /></g>}
      {has('ears-small') && <g>{fill(`M70 ${top + 16} L70 ${top - 4} L86 ${top + 8}Z`)}{fill(`M130 ${top + 16} L130 ${top - 4} L114 ${top + 8}Z`)}</g>}
      {has('ears-round') && <g>{fill(`M62 ${top + 20} a16 16 0 1 1 26 -16Z`)}{fill(`M138 ${top + 20} a16 16 0 1 0 -26 -16Z`)}<circle cx={70} cy={top + 6} r={6} fill="#ffb6c6" /><circle cx={130} cy={top + 6} r={6} fill="#ffb6c6" /></g>}
      {has('ears-long') && <g>{fill(`M76 ${top + 12} C66 ${top - 16} 66 ${top - 44} 78 ${top - 50} C90 ${top - 44} 92 ${top - 16} 88 ${top + 8}Z`)}{fill(`M124 ${top + 12} C134 ${top - 16} 140 ${top - 40} 132 ${top - 48} C120 ${top - 44} 112 ${top - 16} 112 ${top + 8}Z`)}</g>}
      {has('ears-big') && <g>{fill(`M${100 - B.w + 8} ${B.cy - 30} C${100 - B.w - 30} ${B.cy - 40} ${100 - B.w - 34} ${B.cy + 10} ${100 - B.w + 6} ${B.cy + 14}Z`, p.shade)}{fill(`M${100 + B.w - 8} ${B.cy - 30} C${100 + B.w + 30} ${B.cy - 40} ${100 + B.w + 34} ${B.cy + 10} ${100 + B.w - 6} ${B.cy + 14}Z`, p.shade)}</g>}
      {has('horns-small') && <g>{fill(`M74 ${top + 16} C66 ${top - 2} 62 ${top - 12} 68 ${top - 18} C74 ${top - 8} 82 ${top} 86 ${top + 8}Z`, '#f2e2c4', 3.5)}{fill(`M126 ${top + 16} C134 ${top - 2} 138 ${top - 12} 132 ${top - 18} C126 ${top - 8} 118 ${top} 114 ${top + 8}Z`, '#f2e2c4', 3.5)}</g>}
      {has('ears-bat') && <g>{fill(`M64 ${top + 24} L50 ${top - 22} L88 ${top + 4}Z`)}{fill(`M136 ${top + 24} L150 ${top - 22} L112 ${top + 4}Z`)}</g>}
      {has('horns-curl') && <g>{fill(`M64 ${top + 18} C40 ${top + 10} 40 ${top - 20} 62 ${top - 18} C76 ${top - 16} 74 ${top} 64 ${top - 2} C70 ${top + 4} 72 ${top + 10} 78 ${top + 12}Z`, '#f2e2c4', 3.5)}{fill(`M136 ${top + 18} C160 ${top + 10} 160 ${top - 20} 138 ${top - 18} C124 ${top - 16} 126 ${top} 136 ${top - 2} C130 ${top + 4} 128 ${top + 10} 122 ${top + 12}Z`, '#f2e2c4', 3.5)}</g>}
      {has('antlers') && <g fill="none" strokeLinecap="round">{[-1, 1].map((s) => <g key={s}><path d={`M${100 + s * 22} ${top + 8} C${100 + s * 30} ${top - 14} ${100 + s * 44} ${top - 26} ${100 + s * 56} ${top - 32} M${100 + s * 34} ${top - 16} L${100 + s * 30} ${top - 34} M${100 + s * 46} ${top - 24} L${100 + s * 52} ${top - 44}`} stroke={OL} strokeWidth={10} /><path d={`M${100 + s * 22} ${top + 8} C${100 + s * 30} ${top - 14} ${100 + s * 44} ${top - 26} ${100 + s * 56} ${top - 32} M${100 + s * 34} ${top - 16} L${100 + s * 30} ${top - 34} M${100 + s * 46} ${top - 24} L${100 + s * 52} ${top - 44}`} stroke="#f2e2c4" strokeWidth={5} /></g>)}</g>}
      {/* 몸 */}
      {fill(B.d)}
      <ellipse cx={100} cy={B.cy + 32} rx={B.w * 0.62} ry={22} fill={p.belly} />
      <ellipse cx={78} cy={B.cy - 34} rx={14} ry={8} fill="#ffffff" opacity={0.45} transform={`rotate(-30 78 ${B.cy - 34})`} />
      {has('stripes') && <g stroke={p.shade} strokeWidth={6} strokeLinecap="round" fill="none"><path d={`M${100 - B.w + 6} ${B.cy - 10} q10 4 16 0 M${100 + B.w - 6} ${B.cy - 10} q-10 4 -16 0 M${100 - B.w + 10} ${B.cy + 10} q10 4 14 0 M${100 + B.w - 10} ${B.cy + 10} q-10 4 -14 0`} /></g>}
      {has('spots') && <g fill={p.shade}><circle cx={100 - B.w + 18} cy={B.cy + 4} r={5} /><circle cx={100 + B.w - 16} cy={B.cy - 2} r={6} /><circle cx={100 + B.w - 24} cy={B.cy + 22} r={4} /></g>}
      {has('shell') && fill(`M${100 - B.w + 4} ${B.cy + 10} Q100 ${top - 4} ${100 + B.w - 4} ${B.cy + 10} Q100 ${B.cy + 2} ${100 - B.w + 4} ${B.cy + 10}Z`, p.shade, 3.5)}
      {has('crest') && <g>{[-14, 0, 14].map((a) => <g key={a} transform={`translate(100 ${top + 4}) rotate(${a})`}>{P('M-5 0 Q0 -26 5 0Z', p.accent, 3)}</g>)}</g>}
      {has('horn') && fill(`M92 ${faceY - 12} Q100 ${faceY - 48} 108 ${faceY - 12}Z`, '#fffaf0', 3.5)}
      {/* 팔·발 */}
      {has('pincers') ? (
        <g>{[-1, 1].map((s) => { const W = Math.min(B.w, 56); return <g key={s}>{fill(`M${100 + s * (W - 6)} ${B.cy + 6} C${100 + s * (W + 10)} ${B.cy - 2} ${100 + s * (W + 14)} ${B.cy - 18} ${100 + s * (W + 10)} ${B.cy - 30} C${100 + s * (W + 24)} ${B.cy - 40} ${100 + s * (W + 36)} ${B.cy - 30} ${100 + s * (W + 30)} ${B.cy - 18} L${100 + s * (W + 20)} ${B.cy - 22} L${100 + s * (W + 26)} ${B.cy - 10} C${100 + s * (W + 20)} ${B.cy + 4} ${100 + s * (W + 6)} ${B.cy + 12} ${100 + s * (W - 6)} ${B.cy + 14}Z`.replace(/B\.w/g, ''), p.base, 3.5)}</g>; })}</g>
      ) : has('fins') ? (
        <g>{[-1, 1].map((s) => fill(`M${100 + s * (B.w - 4)} ${B.cy + 6} C${100 + s * (B.w + 18)} ${B.cy + 4} ${100 + s * (B.w + 22)} ${B.cy + 18} ${100 + s * (B.w + 12)} ${B.cy + 26} C${100 + s * (B.w + 4)} ${B.cy + 24} ${100 + s * (B.w - 2)} ${B.cy + 20} ${100 + s * (B.w - 6)} ${B.cy + 18}Z`, p.shade, 3.5))}</g>
      ) : !has('wings-bird') && !has('wings-bat') ? (
        <g>{[-1, 1].map((s) => <g key={s}>{fill(`M${100 + s * (B.w - 4)} ${B.cy + 2} C${100 + s * (B.w + 12)} ${B.cy + 4} ${100 + s * (B.w + 14)} ${B.cy + 20} ${100 + s * (B.w + 2)} ${B.cy + 24} C${100 + s * (B.w - 6)} ${B.cy + 24} ${100 + s * (B.w - 8)} ${B.cy + 14} ${100 + s * (B.w - 8)} ${B.cy + 10}Z`, p.base, 3.5)}{has('claws') && <path d={`M${100 + s * (B.w + 4)} ${B.cy + 24} l${s * 2} 5 M${100 + s * (B.w + 10)} ${B.cy + 20} l${s * 4} 4`} stroke={OL} strokeWidth={2.5} strokeLinecap="round" />}</g>)}</g>
      ) : null}
      {!has('feet-none') && !has('tail-coil') && !has('tentacles') && <g>{fill(`M74 ${B.cy + 52} q12 -8 22 0 q2 10 -11 10 q-13 0 -11 -10Z`, p.shade, 3.5)}{fill(`M104 ${B.cy + 52} q12 -8 22 0 q2 10 -11 10 q-13 0 -11 -10Z`, p.shade, 3.5)}</g>}
      {has('tentacles') && <g>{[-3, -2, -1, 0, 1, 2, 3].map((k) => <g key={k}><path d={`M${100 + k * 13} ${B.cy + 40} q${k * 4 + (k % 2 ? 6 : -6)} 16 ${k * 3} 30`} stroke={OL} strokeWidth={12} fill="none" strokeLinecap="round" /><path d={`M${100 + k * 13} ${B.cy + 40} q${k * 4 + (k % 2 ? 6 : -6)} 16 ${k * 3} 30`} stroke={p.shade} strokeWidth={6} fill="none" strokeLinecap="round" /></g>)}</g>}
      {has('mandibles') && <g>{P(`M84 ${faceY + 30} C76 ${faceY + 44} 86 ${faceY + 52} 94 ${faceY + 44} L90 ${faceY + 40}Z`, p.shade, 3)}{P(`M116 ${faceY + 30} C124 ${faceY + 44} 114 ${faceY + 52} 106 ${faceY + 44} L110 ${faceY + 40}Z`, p.shade, 3)}</g>}
      {has('lure') && <g><path d={`M100 ${top + 2} C102 ${top - 22} 124 ${top - 30} 132 ${top - 18}`} stroke={OL} strokeWidth={3.5} fill="none" /><circle cx={134} cy={top - 14} r={7} fill="#fff6a8" stroke={OL} strokeWidth={3} /></g>}
      {has('legs-many') && <g stroke={OL} strokeWidth={4} strokeLinecap="round">{[-1, 1].map((s) => [0, 1, 2].map((k) => <path key={`${s}${k}`} d={`M${100 + s * (B.w - 10 - k * 8)} ${B.cy + 34 + k * 4} l${s * 14} ${10 + k * 2}`} />))}</g>}
      {has('antennae') && <g stroke={OL} strokeWidth={3.5} fill="none" strokeLinecap="round">{[-1, 1].map((s) => <g key={s}><path d={`M${100 + s * 12} ${top + 4} Q${100 + s * 18} ${top - 20} ${100 + s * 30} ${top - 26}`} /><circle cx={100 + s * 30} cy={top - 26} r={4} fill={p.accent} /></g>)}</g>}
      <Face y={faceY} mood={mood} has={has} base={p.base} />
      {/* 속성 장식: 머리 위 */}
      {!has('horn') && !has('antlers') && !has('crest') && !has('dorsal') && <ElementTop el={art.element} x={100} y={top + 2} tier={art.tier} />}
      {(has('horn') || has('antlers') || has('crest') || has('dorsal')) && <ElementTop el={art.element} x={100 + B.w - 18} y={top + 26} tier={art.tier} />}
      {/* 희귀·레전드 반짝임 */}
      {art.tier !== 'common' && <g><Sparkle x={30} y={60} c={legend ? '#ffe680' : '#fff'} /><Sparkle x={172} y={74} s={0.8} c={legend ? '#ffe680' : '#fff'} /><Sparkle x={26} y={150} s={0.7} c={legend ? '#ffe680' : '#fff'} /><Sparkle x={178} y={152} c={legend ? '#ffe680' : '#fff'} /></g>}
      {legend && <g transform={`translate(${has('horn') || has('antlers') ? 28 : 0} ${has('ears-long') ? -44 : -14})`}>{P(`M84 ${top + 4} L88 ${top - 14} L96 ${top - 4} L100 ${top - 18} L104 ${top - 4} L112 ${top - 14} L116 ${top + 4}Z`, '#ffd23f', 3)}<circle cx={100} cy={top - 2} r={3} fill="#ff4f7a" /></g>}
    </svg>
  );
}
