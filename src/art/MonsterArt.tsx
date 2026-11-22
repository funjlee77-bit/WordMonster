// 동물 몬스터(새 300종)와 과일 몬스터(예전 친구들)를 같은 방식으로 그리기
import { MON_BY_ID, ELEMENT_KO } from '../core/monsters';
import { FRUIT_BY_ID, RARITY_LABEL } from '../core/fruits';
import { KINGDOMS } from '../core/kingdoms';
import { ChibiMonster } from './ChibiMonster';
import { FruitMonster } from './FruitMonster';
import type { Mood } from './Characters';

export function monInfo(id: string) {
  const a = MON_BY_ID[id];
  if (a) return { kind: 'animal' as const, name: a.name, nameEn: a.nameEn, rarity: a.tier, rarityKo: RARITY_LABEL[a.tier], desc: `${ELEMENT_KO[a.element]} 속성 ${a.animalKo} 몬스터`, where: KINGDOMS[a.kingdom - 1]?.name ?? '' };
  const f = FRUIT_BY_ID[id];
  if (f) return { kind: 'fruit' as const, name: f.name, nameEn: '', rarity: f.rarity, rarityKo: RARITY_LABEL[f.rarity], desc: f.desc, where: '예전 친구들' };
  return { kind: 'animal' as const, name: '???', nameEn: '', rarity: 'common' as const, rarityKo: '일반', desc: '', where: '' };
}
export function MonsterArt({ id, size = 150, mood = 'normal', className, silhouette, label }: { id: string; size?: number; mood?: Mood; className?: string; silhouette?: boolean; label?: boolean }) {
  const a = MON_BY_ID[id];
  if (a) return <ChibiMonster art={a.art} size={size} mood={mood} className={className} silhouette={silhouette} label={label} />;
  const f = FRUIT_BY_ID[id];
  if (f) return <FruitMonster def={f} size={size} mood={mood} className={className} silhouette={silhouette} aura={label !== false} />;
  return null;
}
