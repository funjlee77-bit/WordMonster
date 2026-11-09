import type { DecoId, EnemyId, FriendId } from './types';

export const FRIENDS: { id: FriendId; name: string; kind: string; desc: string }[] = [
  { id: 'lumo', name: '루모', kind: '등불꼬리 도롱뇽', desc: '꼬리 끝 등불로 어두운 길을 밝혀요. 호기심 대장!' },
  { id: 'moko', name: '모코', kind: '이끼등 아르마딜로', desc: '등에 이끼 정원을 키워요. 느긋하지만 끈기가 최고!' },
  { id: 'quilly', name: '퀼리', kind: '깃펜 부엉이', desc: '깃털 펜으로 단어를 기록해요. 철자 박사!' },
];
export const ENEMIES: { id: EnemyId; name: string; desc: string }[] = [
  { id: 'blot', name: '얼룩잉크', desc: '글자를 번지게 만드는 잉크 덩어리' },
  { id: 'vine', name: '덩굴깨비', desc: '단어를 꼬아버리는 장난꾸러기 덩굴' },
  { id: 'fizz', name: '퐁퐁거품', desc: '생각을 거품처럼 터뜨리는 탄산 몬스터' },
  { id: 'clank', name: '깡통봇', desc: '철자를 뒤섞는 고장 난 로봇' },
  { id: 'murk', name: '안개유령', desc: '기억을 뿌옇게 가리는 안개' },
];
export const DECOS: { id: DecoId; name: string; price: number }[] = [
  { id: 'scarf', name: '바람 목도리', price: 30 },
  { id: 'glasses', name: '동글 안경', price: 40 },
  { id: 'hat', name: '탐험 모자', price: 50 },
  { id: 'badge', name: '별빛 배지', price: 60 },
  { id: 'cape', name: '모험 망토', price: 80 },
  { id: 'crown', name: '꽃 화관', price: 100 },
];
export const REGIONS: { name: string; hue: number; motif: 'tree' | 'wave' | 'crystal' | 'snow' | 'star' | 'mountain' }[] = [
  { name: '새싹 초원', hue: 110, motif: 'tree' }, { name: '바람 언덕', hue: 85, motif: 'mountain' }, { name: '버섯 숲', hue: 140, motif: 'tree' },
  { name: '산호 해변', hue: 190, motif: 'wave' }, { name: '수정 동굴', hue: 270, motif: 'crystal' }, { name: '눈꽃 설원', hue: 205, motif: 'snow' },
  { name: '노을 사막', hue: 30, motif: 'mountain' }, { name: '별빛 호수', hue: 235, motif: 'star' }, { name: '구름 다리', hue: 200, motif: 'wave' },
  { name: '시계탑 마을', hue: 45, motif: 'mountain' }, { name: '용암 골짜기', hue: 10, motif: 'crystal' }, { name: '대나무 숲', hue: 125, motif: 'tree' },
  { name: '무지개 폭포', hue: 175, motif: 'wave' }, { name: '등대 섬', hue: 215, motif: 'star' }, { name: '고대 유적', hue: 40, motif: 'mountain' },
  { name: '꽃 정원', hue: 330, motif: 'tree' }, { name: '얼음 성', hue: 195, motif: 'snow' }, { name: '화석 계곡', hue: 25, motif: 'mountain' },
  { name: '오로라 언덕', hue: 160, motif: 'star' }, { name: '해적 항구', hue: 205, motif: 'wave' }, { name: '거울 미로', hue: 285, motif: 'crystal' },
  { name: '거인의 정원', hue: 95, motif: 'tree' }, { name: '번개 고원', hue: 55, motif: 'mountain' }, { name: '달빛 신전', hue: 250, motif: 'star' },
  { name: '하늘 성', hue: 220, motif: 'snow' },
];
export const enemyForChapters = (chs: number[], round: number): EnemyId => ENEMIES[((chs[0] ?? 1) + round) % ENEMIES.length].id;

export const levelOf = (xp: number) => Math.floor(xp / 100) + 1;
/** 별: 끝까지 하면 최소 1개. 정답 비율 60% 이상 2개, 90% 이상 3개 (힌트·완화 정답도 게임 점수로는 정답) */
export const starsFor = (correct: number, total: number) => (total === 0 ? 0 : correct / total >= 0.9 ? 3 : correct / total >= 0.6 ? 2 : 1);
export function rewardFor(r: { strict: number; other: number; overcame: number; stars: number }) {
  return { xp: r.strict * 10 + r.other * 5 + r.overcame * 5 + 10, coins: r.stars * 5 + r.strict + r.overcame * 2 };
}
