// 과일 몬스터 그림 생성기: 과일 몸 + 동물 특징을 조합해 50종을 직접 그림 (외부 이미지 없음)
import { useId } from 'react';
import { RARITY_BADGE, type FruitDef, type Rarity } from '../core/fruits';
import { Eyes, Mouth, type Mood } from './Characters';

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((c) => c.toString(16).padStart(2, '0')).join('');
}
const rnd = (seed: number) => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

const TOP_Y: Record<string, number> = { round: 60, apple: 66, pear: 58, oval: 54, long: 50, heart: 70, banana: 52, cluster: 64, star: 52, spiky: 64, hairy: 64, bumpy: 58 };
const FACE_Y: Record<string, number> = { round: 110, apple: 112, pear: 124, oval: 106, long: 104, heart: 106, banana: 108, cluster: 104, star: 114, spiky: 112, hairy: 112, bumpy: 112 };

function starPath(cx: number, cy: number, ro: number, ri: number) {
  let d = '';
  for (let i = 0; i < 10; i++) { const r = i % 2 ? ri : ro, a = -Math.PI / 2 + (i * Math.PI) / 5; d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`; }
  return d + 'Z';
}

function BodyShape({ body, fill, stroke }: { body: string; fill: string; stroke?: string }) {
  const p = { fill, stroke, strokeWidth: stroke ? 4 : 0 };
  switch (body) {
    case 'apple': return <path {...p} d="M100 72 C122 56 162 64 162 112 C162 154 132 180 100 178 C68 180 38 154 38 112 C38 64 78 56 100 72Z" />;
    case 'pear': return <path {...p} d="M100 58 C120 58 126 80 132 96 C156 110 164 136 156 156 C146 178 122 182 100 182 C78 182 54 178 44 156 C36 136 44 110 68 96 C74 80 80 58 100 58Z" />;
    case 'oval': return <ellipse {...p} cx={100} cy={116} rx={52} ry={62} />;
    case 'long': return <ellipse {...p} cx={100} cy={116} rx={44} ry={66} />;
    case 'heart': return <path {...p} d="M100 182 C68 164 38 132 40 98 C42 70 70 62 100 72 C130 62 158 70 160 98 C162 132 132 164 100 182Z" />;
    case 'banana': return <path {...p} d="M88 54 C70 70 56 112 64 150 C70 174 98 184 124 178 C146 172 154 150 148 128 C142 100 122 80 114 56 C110 46 94 46 88 54Z" />;
    case 'cluster': return <path {...p} d="M100 182 C72 170 46 132 46 102 C46 76 70 64 100 64 C130 64 154 76 154 102 C154 132 128 170 100 182Z" />;
    case 'star': return <path {...p} d={starPath(100, 120, 72, 42)} strokeLinejoin="round" stroke={fill} strokeWidth={14} />;
    case 'bumpy': return <g><circle {...p} cx={100} cy={122} r={56} /><circle {...p} cx={100} cy={70} r={18} /></g>;
    case 'spiky': case 'hairy': return <circle {...p} cx={100} cy={120} r={54} />;
    default: return <circle {...p} cx={100} cy={118} r={58} />;
  }
}

function TextureLayer({ tex, color, body }: { tex: string; color: string; body: string }) {
  const r = rnd(body.length * 7 + tex.length * 13);
  const els: JSX.Element[] = [];
  if (tex === 'seeds') for (let y = 80; y < 180; y += 16) for (let x = 40 + ((y / 16) % 2) * 8; x < 165; x += 18) els.push(<ellipse key={`${x}-${y}`} cx={x} cy={y} rx={2.2} ry={3.6} fill={color} />);
  if (tex === 'spots') for (let i = 0; i < 9; i++) els.push(<circle key={i} cx={50 + r() * 100} cy={70 + r() * 105} r={5 + r() * 7} fill={color} opacity={0.85} />);
  if (tex === 'stripes') for (let x = 30; x < 180; x += 22) els.push(<path key={x} d={`M${x} 40 Q${x + 14} 118 ${x} 196`} stroke={color} strokeWidth={8} fill="none" opacity={0.75} />);
  if (tex === 'net') { for (let k = -150; k < 200; k += 18) { els.push(<path key={'a' + k} d={`M${k} 40 L${k + 160} 200`} stroke={color} strokeWidth={2.5} />); els.push(<path key={'b' + k} d={`M${k + 160} 40 L${k} 200`} stroke={color} strokeWidth={2.5} />); } }
  if (tex === 'scales') { for (let k = -150; k < 200; k += 20) { els.push(<path key={'a' + k} d={`M${k} 40 L${k + 160} 200`} stroke={color} strokeWidth={3} />); els.push(<path key={'b' + k} d={`M${k + 160} 40 L${k} 200`} stroke={color} strokeWidth={3} />); } }
  if (tex === 'dimples') for (let i = 0; i < 26; i++) els.push(<circle key={i} cx={46 + r() * 108} cy={66 + r() * 112} r={1.6} fill={color} opacity={0.5} />);
  if (tex === 'fuzz') els.push(<circle key="f" cx={80} cy={92} r={46} fill="#ffffff" opacity={0.22} />);
  if (tex === 'grapes') for (const [x, y] of [[78, 82], [100, 78], [122, 82], [66, 104], [88, 102], [112, 102], [134, 104], [72, 128], [96, 126], [120, 126], [140, 128], [82, 150], [106, 150], [128, 148], [96, 170], [114, 168]])
    els.push(<g key={`${x}${y}`}><circle cx={x} cy={y} r={13} fill="none" stroke="#00000022" strokeWidth={2.5} /><circle cx={x - 4} cy={y - 4} r={3} fill="#ffffff66" /></g>);
  if (tex === 'bumps') for (let i = 0; i < 18; i++) els.push(<circle key={i} cx={46 + r() * 108} cy={66 + r() * 112} r={5} fill="none" stroke={color} strokeWidth={2.5} />);
  if (tex === 'stars') for (let i = 0; i < 14; i++) { const x = 46 + r() * 108, y = 66 + r() * 112; els.push(<path key={i} d={starPath(x, y, 4 + r() * 3, 1.6)} fill={color} />); }
  if (tex === 'stars') for (let k = -150; k < 200; k += 22) els.push(<path key={'n' + k} d={`M${k} 40 L${k + 160} 200`} stroke={color} strokeWidth={1} opacity={0.35} />);
  return <g>{els}</g>;
}

function Ears({ kind, c, top }: { kind: string; c: string; top: number }) {
  const inner = shade(c, 0.45);
  const y = top + 14;
  const pair = (el: (s: number) => JSX.Element) => <g>{el(-1)}{el(1)}</g>;
  switch (kind) {
    case 'bunny': return pair((s) => <g key={s} transform={`translate(${100 + s * 26} ${y}) rotate(${s * 12})`}><ellipse cy={-36} rx={13} ry={36} fill={c} /><ellipse cy={-34} rx={6} ry={26} fill={inner} /></g>);
    case 'cat': return pair((s) => <g key={s} transform={`translate(${100 + s * 34} ${y})`}><path d={`M${-s * 14} 6 L${s * 4} -30 L${s * 18} 8Z`} fill={c} /><path d={`M${-s * 6} 2 L${s * 4} -18 L${s * 12} 4Z`} fill={inner} /></g>);
    case 'fox': return pair((s) => <g key={s} transform={`translate(${100 + s * 34} ${y})`}><path d={`M${-s * 16} 8 L${s * 6} -42 L${s * 20} 10Z`} fill={c} /><path d={`M${-s * 6} 4 L${s * 6} -26 L${s * 12} 6Z`} fill="#fff6ee" /></g>);
    case 'round': return pair((s) => <g key={s}><circle cx={100 + s * 40} cy={y - 2} r={14} fill={c} /><circle cx={100 + s * 40} cy={y - 2} r={7} fill={inner} /></g>);
    case 'bear': return pair((s) => <g key={s}><circle cx={100 + s * 38} cy={y + 2} r={16} fill={shade(c, -0.25)} /><circle cx={100 + s * 38} cy={y + 2} r={8} fill={inner} /></g>);
    case 'mouse': return pair((s) => <g key={s}><circle cx={100 + s * 42} cy={y - 6} r={22} fill={c} /><circle cx={100 + s * 42} cy={y - 6} r={13} fill="#ffc2cf" /></g>);
    case 'koala': return pair((s) => <g key={s}><circle cx={100 + s * 48} cy={y + 10} r={24} fill={c} /><circle cx={100 + s * 48} cy={y + 10} r={14} fill="#e8f0d8" /></g>);
    case 'elephant': return pair((s) => <ellipse key={s} cx={100 + s * 62} cy={y + 34} rx={20} ry={28} fill={c} stroke={shade(c, -0.3)} strokeWidth={3} />);
    case 'sheep': return pair((s) => <ellipse key={s} cx={100 + s * 56} cy={y + 30} rx={18} ry={9} fill={c} transform={`rotate(${s * 25} ${100 + s * 56} ${y + 30})`} />);
    default: return null;
  }
}

function TopPart({ kind, top }: { kind: string; top: number }) {
  const y = top + 6;
  switch (kind) {
    case 'leaf': return <g><path d={`M100 ${y} q-2 -14 4 -20`} stroke="#6b3e1f" strokeWidth={5} fill="none" strokeLinecap="round" /><path d={`M104 ${y - 14} q18 -18 34 -6 q-16 16 -34 6Z`} fill="#5cc04a" /></g>;
    case 'stem': return <path d={`M100 ${y + 2} q-3 -14 6 -22`} stroke="#6b3e1f" strokeWidth={6} fill="none" strokeLinecap="round" />;
    case 'cherry': return <g fill="none" strokeLinecap="round"><path d={`M100 ${y} Q104 ${y - 30} 126 ${y - 40}`} stroke="#3e7d2a" strokeWidth={5} /><circle cx={130} cy={y - 34} r={10} fill="#c2183a" /><path d={`M126 ${y - 40} q14 -6 22 4 q-12 8 -22 -4Z`} fill="#5cc04a" /></g>;
    case 'leaves': return <g fill="#3fae4a">{[-50, -25, 0, 25, 50].map((a) => <path key={a} d="M0 0 q-8 -14 0 -24 q8 10 0 24Z" transform={`translate(100 ${y + 4}) rotate(${a})`} />)}</g>;
    case 'calyx': return <g fill="#3e7d2a">{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-9} rx={6} ry={11} transform={`translate(100 ${y}) rotate(${a})`} />)}<circle cx={100} cy={y} r={5} fill="#2c5e1c" /></g>;
    case 'pineapple': return <g fill="#3fae4a">{[-36, -18, 0, 18, 36].map((a, i) => <path key={a} d={`M0 0 q-10 -${26 + (2 - Math.abs(i - 2)) * 10} 0 -${40 + (2 - Math.abs(i - 2)) * 12} q10 ${14 + (2 - Math.abs(i - 2)) * 10} 0 ${40 + (2 - Math.abs(i - 2)) * 12}Z`} transform={`translate(100 ${y + 6}) rotate(${a})`} />)}</g>;
    case 'tip': return <path d={`M88 ${y + 8} L100 ${y - 14} L112 ${y + 8}Z`} fill="#5a2e14" />;
    default: return null;
  }
}

function Tail({ kind, c }: { kind: string; c: string }) {
  switch (kind) {
    case 'bushy': return <path d="M146 150 C188 150 196 96 172 74 C160 96 168 118 140 124Z" fill={c} stroke={shade(c, -0.2)} strokeWidth={3} />;
    case 'skunk': return <g><path d="M144 154 C196 150 204 80 168 56 C156 86 170 118 138 128Z" fill="#2b2b2b" /><path d="M150 140 C182 132 186 92 168 70 C164 96 170 116 146 128Z" fill="#ffffff" /></g>;
    case 'curly': return <path d="M150 150 c20 0 24 -22 10 -26 c-12 -2 -12 14 0 12" stroke={c} strokeWidth={7} fill="none" strokeLinecap="round" />;
    case 'lizard': return <path d="M146 160 C172 168 186 152 182 132 C180 124 172 122 170 130" stroke={c} strokeWidth={10} fill="none" strokeLinecap="round" />;
    case 'fin': return <path d="M150 140 C168 140 176 126 178 110 L196 98 L192 124 L200 142 L178 138 C170 152 160 156 150 154Z" fill={c} />;
    case 'fan': return <g>{[-70, -45, -20, 5, 30, 55, 80].map((a, i) => <g key={a} transform={`translate(100 130) rotate(${a})`}><path d="M0 0 L-12 -96 Q0 -112 12 -96Z" fill={['#2fbf71', '#1f9fd6', '#7a5af0', '#2fbf71', '#1f9fd6', '#7a5af0', '#2fbf71'][i]} /><circle cy={-90} r={8} fill="#ffd23f" /><circle cy={-90} r={4} fill="#1f3a8a" /></g>)}</g>;
    case 'flame': return <g>{[-20, 0, 20].map((a) => <path key={a} d="M0 0 C10 -20 -6 -40 8 -64 C24 -40 30 -16 10 0Z" fill={a === 0 ? '#ff5a1f' : '#ffb020'} transform={`translate(146 150) rotate(${70 + a})`} />)}</g>;
    default: return null;
  }
}

function Wings({ kind, c, faceY }: { kind: string; c: string; faceY: number }) {
  const y = faceY + 12;
  const pair = (el: (s: number) => JSX.Element) => <g>{el(-1)}{el(1)}</g>;
  switch (kind) {
    case 'bee': return pair((s) => <ellipse key={s} cx={100 + s * 58} cy={y - 34} rx={26} ry={16} fill="#e8f6ff" opacity={0.85} stroke="#9ac7e8" strokeWidth={2} transform={`rotate(${s * -25} ${100 + s * 58} ${y - 34})`} />);
    case 'bird': return pair((s) => <path key={s} d={`M${100 + s * 46} ${y} q${s * 34} -18 ${s * 40} 8 q${s * -14} 4 ${s * -10} 14 q${s * -16} 0 ${s * -30} -6Z`} fill={c} />);
    case 'flipper': return pair((s) => <ellipse key={s} cx={100 + s * 52} cy={y + 14} rx={10} ry={26} fill={c} transform={`rotate(${s * -20} ${100 + s * 52} ${y + 14})`} />);
    case 'bat': return pair((s) => <path key={s} d={`M${100 + s * 44} ${y - 6} L${100 + s * 92} ${y - 36} L${100 + s * 86} ${y - 6} L${100 + s * 96} ${y + 6} L${100 + s * 80} ${y + 10} L${100 + s * 84} ${y + 26} L${100 + s * 50} ${y + 14}Z`} fill={c} />);
    case 'butterfly': return pair((s) => <g key={s}><ellipse cx={100 + s * 62} cy={y - 26} rx={30} ry={24} fill={c} stroke="#7a3a00" strokeWidth={3} /><ellipse cx={100 + s * 56} cy={y + 14} rx={20} ry={16} fill={shade(c, -0.15)} stroke="#7a3a00" strokeWidth={3} /><circle cx={100 + s * 66} cy={y - 28} r={7} fill="#fff" /></g>);
    case 'moth': return pair((s) => <path key={s} d={`M${100 + s * 40} ${y} C${100 + s * 90} ${y - 60} ${100 + s * 104} ${y + 10} ${100 + s * 66} ${y + 34}Z`} fill={c} opacity={0.9} />);
    case 'phoenix': return pair((s) => <g key={s}>{[0, 1, 2, 3].map((k) => <path key={k} d={`M${100 + s * 44} ${y} q${s * (40 + k * 10)} ${-50 + k * 12} ${s * (56 + k * 12)} ${-30 + k * 22} q${s * -24} 4 ${s * -56} 18Z`} fill={['#ff3d1f', '#ff7a1f', '#ffb020', '#ffe14a'][k]} />)}</g>);
    default: return null;
  }
}

function Extras({ list, def, faceY, top, front }: { list: string[]; def: FruitDef; faceY: number; top: number; front: boolean }) {
  const c = def.art.c1, dark = shade(c, -0.35);
  const out: JSX.Element[] = [];
  const has = (k: string) => list.includes(k);
  const my = faceY + 22;
  if (!front) {
    if (has('mane')) out.push(<g key="mane" fill="#ff9a1f">{Array.from({ length: 14 }, (_, i) => <ellipse key={i} cx={0} cy={-64} rx={13} ry={22} transform={`translate(100 118) rotate(${i * 26})`} />)}</g>);
    if (has('dorsal')) out.push(<path key="dorsal" d={`M88 ${top + 4} L112 ${top - 30} L118 ${top + 6}Z`} fill={shade(c, -0.2)} />);
    if (has('tentacles')) out.push(<g key="ten" stroke={shade(c, -0.1)} strokeWidth={11} fill="none" strokeLinecap="round">{[-3, -2, -1, 0, 1, 2, 3].map((k) => <path key={k} d={`M${100 + k * 15} 160 q${k * 6} 22 ${k * 4 + (k % 2 ? 10 : -10)} 34`} />)}</g>);
    if (has('flippers')) out.push(<g key="fl" fill={shade(c, -0.25)}><ellipse cx={52} cy={170} rx={18} ry={9} /><ellipse cx={148} cy={170} rx={18} ry={9} /><ellipse cx={46} cy={96} rx={16} ry={8} transform="rotate(-30 46 96)" /><ellipse cx={154} cy={96} rx={16} ry={8} transform="rotate(30 154 96)" /></g>);
    if (has('arms')) out.push(<g key="arms" fill={c}><ellipse cx={42} cy={136} rx={16} ry={30} transform="rotate(20 42 136)" /><ellipse cx={158} cy={136} rx={16} ry={30} transform="rotate(-20 158 136)" /></g>);
    if (has('claws')) out.push(<g key="claws" fill="#ff6b4a" stroke="#b8331c" strokeWidth={3}>{[-1, 1].map((s) => <g key={s}><path d={`M${100 + s * 56} 140 L${100 + s * 76} 120`} stroke="#b8331c" strokeWidth={8} /><path d={`M${100 + s * 76} 120 m${-s * 14} -2 a16 16 0 1 1 ${s * 28} 2 l${-s * 12} -2 l${-s * 4} 10Z`} /></g>)}</g>);
    return <g>{out}</g>;
  }
  if (has('seedcore')) out.push(<ellipse key="seed" cx={100} cy={faceY + 42} rx={16} ry={14} fill={def.id.includes('kiwi') ? '#ffffff' : '#7a4a22'} opacity={0.9} />);
  if (def.id.includes('kiwi') || def.id.includes('dragonfruit')) out.push(<g key="kseeds" fill="#222">{Array.from({ length: 10 }, (_, i) => <ellipse key={i} cx={100 + 24 * Math.cos(i * 0.63)} cy={faceY + 42 + 18 * Math.sin(i * 0.63)} rx={1.8} ry={3} />)}</g>);
  if (has('frogeyes')) out.push(<g key="fe">{[-1, 1].map((s) => <circle key={s} cx={100 + s * 24} cy={top + 6} r={16} fill={c} />)}</g>);
  if (has('mask')) out.push(<path key="mask" d={`M54 ${faceY - 2} Q100 ${faceY - 22} 146 ${faceY - 2} Q140 ${faceY + 14} 118 ${faceY + 10} Q100 ${faceY + 4} 82 ${faceY + 10} Q60 ${faceY + 14} 54 ${faceY - 2}Z`} fill="#1e0b1c" />);
  if (has('antenna')) out.push(<g key="ant" stroke="#2b1d2a" strokeWidth={4} fill="none" strokeLinecap="round">{[-1, 1].map((s) => <g key={s}><path d={`M${100 + s * 12} ${top + 4} Q${100 + s * 20} ${top - 26} ${100 + s * 34} ${top - 30}`} /><circle cx={100 + s * 34} cy={top - 30} r={5} fill="#2b1d2a" /></g>)}</g>);
  if (has('stalks')) out.push(<g key="st">{[-1, 1].map((s) => <g key={s}><path d={`M${100 + s * 14} ${top + 6} L${100 + s * 24} ${top - 30}`} stroke={shade(c, -0.1)} strokeWidth={8} strokeLinecap="round" /><circle cx={100 + s * 24} cy={top - 34} r={9} fill="#fff" /><circle cx={100 + s * 25} cy={top - 34} r={5} fill="#222" /></g>)}</g>);
  if (has('ramhorns')) out.push(<g key="ram" fill="none" stroke="#c9a06a" strokeWidth={9} strokeLinecap="round">{[-1, 1].map((s) => <path key={s} d={`M${100 + s * 26} ${top + 10} c${s * 20} -16 ${s * 40} 0 ${s * 30} 18 c${-s * 6} 10 ${-s * 18} 6 ${-s * 14} -4`} />)}</g>);
  if (has('dragonhorns')) out.push(<g key="dh" fill="#ffe7a8" stroke="#c99a3a" strokeWidth={2}>{[-1, 1].map((s) => <path key={s} d={`M${100 + s * 20} ${top + 10} Q${100 + s * 30} ${top - 20} ${100 + s * 44} ${top - 28} Q${100 + s * 36} ${top - 4} ${100 + s * 34} ${top + 14}Z`} />)}</g>);
  if (has('crest')) out.push(<g key="crest" fill={def.art.wingColor ?? '#2fbf71'}>{[-14, 0, 14].map((a) => <path key={a} d="M0 0 Q-6 -20 0 -32 Q6 -20 0 0Z" transform={`translate(100 ${top + 6}) rotate(${a})`} />)}</g>);
  if (has('flamecrest')) out.push(<g key="fc">{[-16, 0, 16].map((a) => <path key={a} d="M0 0 C8 -12 -4 -26 6 -40 C18 -24 18 -10 6 0Z" fill={a === 0 ? '#ff5a1f' : '#ffb020'} transform={`translate(100 ${top + 4}) rotate(${a})`} />)}</g>);
  if (has('horn')) out.push(<path key="horn" d={`M92 ${top + 8} L100 ${top - 40} L108 ${top + 8}Z`} fill="#fff6c8" stroke="#e0b000" strokeWidth={3} />);
  if (has('rhinohorn')) out.push(<path key="rh" d={`M92 ${faceY + 14} Q100 ${faceY - 26} 112 ${faceY - 18} Q106 ${faceY + 2} 108 ${faceY + 14}Z`} fill="#fff1d6" stroke="#c98a3a" strokeWidth={3} />);
  if (has('frost')) out.push(<g key="frost" fill="#ffffff">{[[50, 80], [150, 86], [60, 160], [146, 150]].map(([x, y], i) => <path key={i} d={starPath(x, y, 7, 2)} />)}</g>);
  // 얼굴
  const mood: Mood = 'normal';
  void mood;
  out.push(<g key="face-anchor" />);
  if (has('cheeks')) out.push(<g key="ch" fill="#ff6b8a" opacity={0.5}><circle cx={66} cy={faceY + 16} r={9} /><circle cx={134} cy={faceY + 16} r={9} /></g>);
  if (has('snout')) out.push(<g key="sn"><ellipse cx={100} cy={my - 2} rx={16} ry={11} fill={shade(c, 0.4)} /><ellipse cx={100} cy={my - 6} rx={6} ry={4} fill="#3a2020" /></g>);
  if (has('pigsnout')) out.push(<g key="ps"><ellipse cx={100} cy={my - 2} rx={16} ry={11} fill={shade(c, 0.35)} /><ellipse cx={94} cy={my - 2} rx={3} ry={4} fill={dark} /><ellipse cx={106} cy={my - 2} rx={3} ry={4} fill={dark} /></g>);
  if (has('beak')) out.push(<path key="bk" d={`M90 ${my - 10} L100 ${my + 4} L110 ${my - 10}Z`} fill="#ffb02e" stroke="#c77a00" strokeWidth={2} />);
  if (has('duckbill')) out.push(<ellipse key="db" cx={100} cy={my - 4} rx={20} ry={8} fill="#ff9a1f" stroke="#c76a00" strokeWidth={2} />);
  if (has('trunk')) out.push(<path key="tr" d={`M100 ${my - 10} C98 ${my + 20} 108 ${my + 40} 124 ${my + 36}`} stroke={shade(c, -0.15)} strokeWidth={16} fill="none" strokeLinecap="round" />);
  if (has('whiskers')) out.push(<g key="wh" stroke="#3a2a2a" strokeWidth={2} strokeLinecap="round">{[-1, 1].map((s) => <g key={s}><path d={`M${100 + s * 20} ${my - 4} l${s * 26} -6`} /><path d={`M${100 + s * 20} ${my} l${s * 26} 4`} /></g>)}</g>);
  if (has('teeth')) out.push(<path key="te" d={`M84 ${my + 4} l4 6 l4 -6 l4 6 l4 -6 l4 6 l4 -6 l4 6 l4 -6`} stroke="#fff" strokeWidth={2.5} fill="none" />);
  if (has('tongue')) out.push(<path key="to" d={`M100 ${my + 6} l0 14 l-5 6 m5 -6 l5 6`} stroke="#ff3b5c" strokeWidth={3} fill="none" strokeLinecap="round" />);
  if (has('helmet')) out.push(
    <g key="helmet">
      <path d={`M104 ${top - 8} Q132 ${top - 34} 150 ${top - 8} Q132 ${top - 22} 108 ${top - 2}Z`} fill="#e8323c" />
      <path d={`M64 ${top + 26} Q64 ${top - 14} 100 ${top - 16} Q136 ${top - 14} 136 ${top + 26} L124 ${top + 26} L124 ${top + 10} L76 ${top + 10} L76 ${top + 26}Z`} fill="#c9d3dc" stroke="#6f7f8f" strokeWidth={3} />
      <path d={`M100 ${top - 16} L100 ${top + 10}`} stroke="#6f7f8f" strokeWidth={3} />
      <circle cx={72} cy={top + 18} r={3} fill="#6f7f8f" /><circle cx={128} cy={top + 18} r={3} fill="#6f7f8f" />
    </g>);
  if (has('shield')) out.push(
    <g key="shield" transform={`translate(52 ${faceY + 44})`}>
      <circle r={24} fill="#c99a3a" stroke="#7a5a10" strokeWidth={4} />
      <circle r={15} fill="none" stroke="#ffe08a" strokeWidth={3} />
      <path d={starPath(0, 0, 9, 4)} fill="#ffe08a" />
    </g>);
  if (has('spout')) out.push(<g key="sp" fill="#8fd8ff">{[-14, 0, 14].map((x, i) => <circle key={i} cx={100 + x} cy={top - 18 - (i === 1 ? 10 : 0)} r={6} />)}<path d={`M100 ${top} L100 ${top - 14}`} stroke="#8fd8ff" strokeWidth={5} /></g>);
  return <g>{out}</g>;
}

export function RarityAura({ rarity, uid }: { rarity: Rarity; uid: string }) {
  if (rarity === 'common') return null;
  const legend = rarity === 'legend';
  const c1 = legend ? '#ffd23f' : '#9b8cff', c2 = legend ? '#ff8a00' : '#4fd1ff';
  return (
    <g className="aura">
      <defs>
        <radialGradient id={`g${uid}`}><stop offset="0" stopColor={c1} stopOpacity={0.9} /><stop offset="1" stopColor={c2} stopOpacity={0} /></radialGradient>
      </defs>
      <circle cx={100} cy={112} r={96} fill={`url(#g${uid})`} />
      <g className="rays" style={{ transformOrigin: '100px 112px' }}>
        {Array.from({ length: legend ? 16 : 10 }, (_, i) => <path key={i} d="M100 112 L94 6 L106 6Z" fill={c1} opacity={0.35} transform={`rotate(${i * (360 / (legend ? 16 : 10))} 100 112)`} />)}
      </g>
      <text x={100} y={-4} textAnchor="middle" fontSize={legend ? 34 : 32} fontWeight={900} fontFamily="Arial Black, Arial, sans-serif" letterSpacing={legend ? 2 : 4}
        fill={legend ? '#fff3b0' : '#e6e0ff'} stroke={legend ? '#b35a00' : '#4a3ab0'} strokeWidth={2.5} opacity={0.95}>{legend ? 'LEGEND' : 'RARE'}</text>
    </g>
  );
}

export function FruitMonster({ def, mood = 'normal', size = 150, className, silhouette, aura = true }: { def: FruitDef; mood?: Mood; size?: number; className?: string; silhouette?: boolean; aura?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const a = def.art; const top = TOP_Y[a.body], faceY = FACE_Y[a.body];
  const extras = a.extras ?? [];
  const tc = a.texColor ?? shade(a.c1, -0.25);
  const special = aura && !silhouette && def.rarity !== 'common';
  return (
    <svg viewBox={special ? '0 -32 200 232' : '0 0 200 200'} width={size} height={size} className={className} role="img" aria-label={`${def.name} (${def.fruit}·${def.animal}${def.rarity !== 'common' ? ', ' + RARITY_BADGE[def.rarity] : ''})`}>
      {aura && !silhouette && <RarityAura rarity={def.rarity} uid={uid} />}
      <g style={silhouette ? { filter: 'brightness(0)', opacity: 0.35 } : undefined}>
        <ellipse cx={100} cy={190} rx={56} ry={7} fill="#00000022" />
        {a.tail && <Tail kind={a.tail} c={a.tailColor ?? shade(a.c1, -0.2)} />}
        {a.wings && <Wings kind={a.wings} c={a.wingColor ?? shade(a.c1, -0.2)} faceY={faceY} />}
        <Extras list={extras} def={def} faceY={faceY} top={top} front={false} />
        {a.ears && <Ears kind={a.ears} c={a.earColor ?? a.c1} top={top} />}
        {/* 발 */}
        {!extras.includes('tentacles') && !extras.includes('flippers') && <g fill={shade(a.c1, -0.3)}><ellipse cx={80} cy={182} rx={13} ry={7} /><ellipse cx={120} cy={182} rx={13} ry={7} /></g>}
        {a.body === 'spiky' && <g fill={shade(a.c1, -0.25)}>{Array.from({ length: 18 }, (_, i) => <path key={i} d="M-8 0 L0 -18 L8 0Z" transform={`rotate(${i * 20} 100 120) translate(100 68)`} />)}</g>}
        {a.body === 'hairy' && <g stroke={shade(a.c1, -0.1)} strokeWidth={5} fill="none" strokeLinecap="round">{Array.from({ length: 22 }, (_, i) => <path key={i} d="M0 0 q6 -10 0 -18" transform={`rotate(${i * 16.4} 100 120) translate(100 70)`} />)}</g>}
        <defs><clipPath id={`c${uid}`}><BodyShape body={a.body} fill="#000" /></clipPath></defs>
        <BodyShape body={a.body} fill={a.c1} />
        <g clipPath={`url(#c${uid})`}>
          {a.tex && a.tex !== 'none' && <TextureLayer tex={a.tex} color={tc} body={a.body} />}
          {a.belly && a.c2 && <ellipse cx={100} cy={faceY + 40} rx={34} ry={28} fill={a.c2} />}
          <ellipse cx={74} cy={top + 26} rx={14} ry={8} fill="#ffffff" opacity={0.35} transform={`rotate(-30 74 ${top + 26})`} />
        </g>
        {a.top && <TopPart kind={a.top} top={top} />}
        <Extras list={extras} def={def} faceY={faceY} top={top} front />
        <Eyes x1={82} x2={118} y={faceY} r={9} mood={mood} color={extras.includes('mask') ? '#ffffff' : '#1d1b2f'} />
        {!extras.some((e) => ['beak', 'duckbill', 'snout', 'pigsnout', 'trunk', 'teeth'].includes(e)) && <Mouth x={100} y={faceY + 20} mood={mood} w={10} />}
        {(extras.includes('snout') || extras.includes('pigsnout') || extras.includes('teeth')) && <Mouth x={100} y={faceY + 32} mood={mood} w={8} />}
        {extras.includes('crown') && (
          <g transform={`translate(100 ${top - (extras.includes('helmet') ? 30 : a.ears === 'bunny' || a.ears === 'fox' ? 26 : 12)})`}>
            <path d="M-22 6 L-22 -10 L-11 -2 L0 -16 L11 -2 L22 -10 L22 6Z" fill="#ffd23f" stroke="#b37400" strokeWidth={2.5} />
            <circle cx={0} cy={-2} r={3.5} fill="#ff3d6b" /><circle cx={-13} cy={2} r={2.5} fill="#3dd6ff" /><circle cx={13} cy={2} r={2.5} fill="#3dd6ff" />
          </g>
        )}
      </g>
    </svg>
  );
}
