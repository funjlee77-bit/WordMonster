// 동물 몬스터 300종 (디자인 주문서의 번호·이름·속성 그대로) + 6개 왕국 배치 + 그림 부품
import raw from '../data/monsters.json';
import type { ChibiArt, Part, Shape, Element } from '../art/ChibiMonster';

export type MTier = 'common' | 'rare' | 'legend';
export interface AnimalMon { id: string; tier: MTier; name: string; nameEn: string; animal: string; animalKo: string; element: Element; kingdom: number; art: ChibiArt }

// 동물 → 몸 모양 · 부품
const SPEC = `hedgehog egg spines,ears-small,snout
porcupine egg spines,ears-small,snout,tail-thin
armadillo wide shell,ears-small,snout,tail-thin
pangolin egg shell,snout,tail-thin,claws
mole egg snout,claws,whiskers
badger egg stripes,ears-small,snout,claws
raccoon egg mask,ears-pointy,tail-bushy
skunk egg ears-small,tail-bushy,stripes
meerkat tall ears-small,mask,tail-thin
lemur egg ears-small,tail-curl,mask
squirrel egg ears-pointy,tail-bushy
beaver egg ears-small,teeth,tail-flat
otter egg ears-small,whiskers,tail-thin
platypus egg bill,tail-flat
kangaroo tall ears-long,tail-thin
koala egg ears-big,snout
sloth egg mask,claws
anteater egg snout-long,tail-bushy,claws
rabbit egg ears-long
fox egg ears-pointy,tail-bushy,snout
wolf egg ears-pointy,tail-bushy,snout,claws
hyena egg ears-round,spots,snout
jackal tall ears-pointy,snout,tail-thin
lion egg mane,ears-round,snout,tail-tuft
tiger egg ears-round,stripes,snout,tail-thin
panther egg ears-round,snout,tail-thin,claws
cheetah tall ears-small,spots,tail-thin
lynx egg ears-pointy,whiskers
bear tall ears-round,snout,claws
polarbear tall ears-round,snout
panda egg ears-round,mask,snout
redpanda egg ears-pointy,mask,tail-bushy
gorilla tall ears-small,snout,claws
monkey egg ears-round,tail-curl,snout
orangutan wide ears-small,snout,claws
elephant wide ears-big,trunk,tusks
rhino wide ears-small,horn,tail-tuft
hippo wide ears-small,snout,teeth
giraffe tall horns-small,ears-small,spots
zebra egg ears-pointy,stripes,crest
horse tall ears-pointy,crest,tail-tuft
camel tall hump,ears-small,snout
goat egg horns-small,ears-small
ram egg horns-curl
yak wide horns-small,ears-small
bison wide horns-small,hump,snout
boar egg tusks,snout,ears-small
deer egg antlers,ears-small
moose wide antlers,snout
bat egg ears-bat,wings-bat,teeth
owl egg ears-pointy,wings-bird,beak
eagle tall wings-bird,beak-hook,crest
hawk egg wings-bird,beak-hook
falcon egg wings-bird,beak-hook,mask
crow egg wings-bird,beak
parrot tall wings-bird,beak-hook,crest
flamingo tall beak-long,wings-bird
swan egg beak,wings-bird
peacock egg tail-feather,crest,beak
hummingbird drop wings-bug,beak-long
woodpecker egg beak-long,crest,wings-bird
vulture egg beak-hook,wings-bird
albatross wide wings-bird,beak
kingfisher egg beak-long,wings-bird,crest
toucan egg beak-long,wings-bird
rooster egg crest,beak,tail-feather
ostrich tall beak,wings-bird,crest
penguin tall beak,fins
shark drop fins,tail-fin,dorsal,teeth,feet-none
orca wide dorsal,fins,tail-fluke,feet-none
whale wide fins,tail-fluke,feet-none
dolphin drop fins,tail-fluke,dorsal,feet-none
narwhal wide horn,fins,tail-fluke,feet-none
manta wide fins,tail-thin,horns-small,feet-none
eel drop tail-coil,teeth,fins
piranha drop fins,tail-fin,teeth,feet-none,dorsal
pufferfish egg spines,fins,tail-fin,feet-none
swordfish drop horn,fins,tail-fin,dorsal,feet-none
anglerfish egg teeth,fins,tail-fin,feet-none,lure
octopus egg tentacles
squid tall tentacles,dorsal
jellyfish drop tentacles
seahorse tall tail-curl,crest,snout-long
crab wide pincers,legs-many,feet-none,antennae
lobster wide pincers,antennae,tail-fin
shrimp drop antennae,legs-many,tail-fin,feet-none
starfish egg star-arms,feet-none
turtle wide shell
crocodile wide snout-long,tail-thin,stripes
komodo wide snout-long,tongue,tail-thin
gecko egg tail-thin,frog-eyes,spots
iguana egg crest,tail-thin
chameleon egg tail-curl,frog-eyes,crest
cobra tall hood,tail-coil
python egg tail-coil,spots
frog wide frog-eyes,tongue
salamander egg tail-thin,spots
beetle egg horn,shell,legs-many
stagbeetle egg mandibles,shell,legs-many
mantis tall antennae,wings-bug,claws
ant egg antennae,mandibles,legs-many
wasp egg antennae,wings-bug,stripes,tail-stinger
dragonfly drop wings-bug,frog-eyes
firefly egg antennae,wings-bug,lure
scorpion wide pincers,tail-stinger,legs-many,feet-none
spider egg legs-many,feet-none,teeth,spots
centipede wide legs-many,antennae,stripes
snail egg shell-spiral,antennae,feet-none
moth egg wings-bug,antennae
butterfly egg wings-bug,antennae
locust tall antennae,wings-bug
leopard egg ears-round,spots,tail-thin
jaguar egg ears-round,spots,tail-thin,claws
weasel tall ears-small,tail-thin
ferret tall ears-small,mask,tail-thin
seal wide whiskers,fins,feet-none
walrus wide whiskers,tusks,fins,feet-none
tapir egg snout-long,ears-small
llama tall ears-pointy,crest
bull wide horns-small,snout,tail-tuft
buffalo wide horns-curl,snout
mongoose tall ears-small,tail-bushy
heron tall beak-long,crest,wings-bird
magpie egg beak,wings-bird,tail-feather
sparrow egg beak,wings-bird
raven egg beak-hook,wings-bird,crest
stingray wide fins,tail-thin,feet-none
barracuda drop teeth,fins,tail-fin,feet-none
catfish wide whiskers,fins,tail-fin,feet-none
cuttlefish egg tentacles,fins
hermitcrab egg shell-spiral,pincers,antennae
mantisshrimp drop antennae,pincers,tail-fin,frog-eyes`;
export const ANIMAL_SPEC: Record<string, { shape: Shape; parts: Part[] }> = Object.fromEntries(
  SPEC.split('\n').map((l) => { const [k, shape, parts] = l.trim().split(' '); return [k, { shape: shape as Shape, parts: parts.split(',') as Part[] }]; }));

export const MONSTERS: AnimalMon[] = (raw as any[]).map((m) => {
  const sp = ANIMAL_SPEC[m.animal];
  if (!sp) throw new Error('그림 부품 없음: ' + m.animal);
  let h = 0; for (const c of m.animal) h = (h * 31 + c.charCodeAt(0)) % 997;
  return { ...m, art: { shape: sp.shape, parts: sp.parts, element: m.element, tier: m.tier, hue: (h % 61) - 30 } };
});
export const MON_BY_ID: Record<string, AnimalMon> = Object.fromEntries(MONSTERS.map((m) => [m.id, m]));
export const ELEMENT_KO: Record<Element, string> = { fire: '불꽃', water: '물', plant: '풀', electric: '번개', ice: '얼음', rock: '바위', earth: '대지', wind: '바람', poison: '독', metal: '강철', shadow: '그림자', light: '빛' };
