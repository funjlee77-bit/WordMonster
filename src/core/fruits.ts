// 과일 몬스터 50종 (직접 만든 캐릭터). 지역(Chapter)마다 2종.
// 등급: 일반 30 · 희귀 15 · 전설 5 (전설은 Chapter 5·10·15·20·25에 하나씩)
export type Rarity = 'common' | 'rare' | 'legend';
export type BodyShape = 'round' | 'apple' | 'pear' | 'oval' | 'long' | 'heart' | 'banana' | 'cluster' | 'star' | 'spiky' | 'hairy' | 'bumpy';
export type Texture = 'seeds' | 'spots' | 'stripes' | 'net' | 'scales' | 'dimples' | 'fuzz' | 'grapes' | 'bumps' | 'stars' | 'none';
export type Top = 'leaf' | 'leaves' | 'stem' | 'cherry' | 'calyx' | 'pineapple' | 'tip' | 'none';
export type Ears = 'bunny' | 'cat' | 'round' | 'mouse' | 'fox' | 'bear' | 'koala' | 'elephant' | 'sheep' | 'none';
export type Tail = 'bushy' | 'skunk' | 'curly' | 'fin' | 'lizard' | 'fan' | 'flame' | 'none';
export type Wings = 'bee' | 'bird' | 'bat' | 'butterfly' | 'moth' | 'phoenix' | 'flipper' | 'none';
export type Extra = 'beak' | 'duckbill' | 'snout' | 'pigsnout' | 'trunk' | 'horn' | 'rhinohorn' | 'dragonhorns' | 'ramhorns' | 'antenna' | 'stalks' | 'tentacles'
  | 'claws' | 'mask' | 'whiskers' | 'frogeyes' | 'crest' | 'flamecrest' | 'mane' | 'dorsal' | 'teeth' | 'spout' | 'arms' | 'cheeks' | 'tongue' | 'frost' | 'seedcore' | 'flippers' | 'crown' | 'helmet' | 'shield';

export type Zone = 'region' | 'colosseum';
export interface FruitDef {
  id: string; name: string; fruit: string; animal: string; chapter: number; rarity: Rarity; desc: string;
  /** region: 지역(Chapter) 탐험에서 만남 / colosseum: 끝장 퀴즈 전용 (chapter = 0) */
  zone: Zone;
  art: { body: BodyShape; c1: string; c2?: string; tex?: Texture; texColor?: string; top?: Top; ears?: Ears; earColor?: string; tail?: Tail; tailColor?: string; wings?: Wings; wingColor?: string; extras?: Extra[]; belly?: boolean };
}

const F = (chapter: number, rarity: Rarity, id: string, name: string, fruit: string, animal: string, desc: string, art: FruitDef['art']): FruitDef =>
  ({ id, name, fruit, animal, chapter, rarity, desc, art, zone: 'region' });
const C = (rarity: Rarity, id: string, name: string, fruit: string, animal: string, desc: string, art: FruitDef['art']): FruitDef =>
  ({ id, name, fruit, animal, chapter: 0, rarity, desc, art, zone: 'colosseum' });

export const FRUITS: FruitDef[] = [
  F(1, 'common', 'apple-bunny', '사과토끼', '사과', '토끼', '아삭아삭 소리를 내며 깡충깡충 뛰어다녀요.', { body: 'apple', c1: '#e8393f', c2: '#ffd8cf', top: 'leaf', ears: 'bunny', earColor: '#e8393f', belly: true, extras: ['cheeks'] }),
  F(1, 'common', 'cherry-mouse', '체리생쥐', '체리', '생쥐', '꼬리 대신 체리 꼭지를 흔드는 꼬마 생쥐.', { body: 'round', c1: '#c2183a', c2: '#ff8fa3', top: 'cherry', ears: 'mouse', tail: 'lizard', tailColor: '#7a1024', extras: ['whiskers'] }),
  F(2, 'common', 'tangerine-squirrel', '귤다람쥐', '귤', '다람쥐', '볼 가득 귤 알맹이를 모아 두는 부지런쟁이.', { body: 'round', c1: '#ff9b1f', c2: '#ffe0a8', tex: 'dimples', top: 'leaf', ears: 'cat', tail: 'bushy', tailColor: '#e0700a', belly: true, extras: ['cheeks'] }),
  F(2, 'rare', 'blueberry-owl', '블루베리부엉이', '블루베리', '부엉이', '밤새 단어를 외우는 똑똑한 부엉이. 눈이 별처럼 반짝여요.', { body: 'round', c1: '#4b5bd6', c2: '#a9b4ff', top: 'calyx', ears: 'cat', wings: 'bird', wingColor: '#3644b0', belly: true, extras: ['beak'] }),
  F(3, 'common', 'banana-monkey', '바나나원숭이', '바나나', '원숭이', '껍질을 망토처럼 펄럭이며 나무를 타요.', { body: 'banana', c1: '#ffd93b', c2: '#fff3b8', top: 'stem', ears: 'round', earColor: '#f2b21a', tail: 'curly', tailColor: '#e8b21a', belly: true }),
  F(3, 'common', 'grape-caterpillar', '포도애벌레', '포도', '애벌레', '송이송이 몸을 꿈틀거리며 기어가요.', { body: 'cluster', c1: '#8e4fc4', tex: 'grapes', top: 'stem', extras: ['antenna'] }),
  F(4, 'common', 'lemon-bee', '레몬벌', '레몬', '꿀벌', '새콤한 꿀을 모으는 레몬빛 꿀벌.', { body: 'oval', c1: '#fff04a', tex: 'stripes', texColor: '#4a3a1a', wings: 'bee', extras: ['antenna'] }),
  F(4, 'rare', 'lime-frog', '라임개구리', '라임', '개구리', '비 오는 날 연잎 위에서 상큼하게 울어요.', { body: 'round', c1: '#8fd14f', c2: '#e6f8b8', tex: 'dimples', belly: true, extras: ['frogeyes', 'tongue'] }),
  F(5, 'rare', 'watermelon-turtle', '수박거북', '수박', '거북', '줄무늬 등딱지에 시원한 물을 가득 담고 다녀요.', { body: 'round', c1: '#2f9a45', tex: 'stripes', texColor: '#16602a', top: 'stem', extras: ['flippers', 'seedcore'] }),
  F(5, 'legend', 'durian-skunk', '두리안스컹크', '두리안', '스컹크', '전설의 냄새 대장! 한 번 꼬리를 흔들면 숲 전체가 놀라요.', { body: 'spiky', c1: '#c9b84a', c2: '#fff3b0', ears: 'cat', earColor: '#3a3a3a', tail: 'skunk', belly: true, extras: ['crown'] }),
  F(6, 'common', 'strawberry-hedgehog', '딸기고슴도치', '딸기', '고슴도치', '씨앗 가시가 톡톡! 하지만 만지면 말랑해요.', { body: 'heart', c1: '#ff4466', tex: 'seeds', texColor: '#ffe680', top: 'leaves', ears: 'round', extras: ['snout'] }),
  F(6, 'common', 'pear-bear', '배곰', '배', '곰', '달콤한 즙을 나눠 주는 느긋한 곰.', { body: 'pear', c1: '#d7e37a', c2: '#fbffd8', tex: 'dimples', texColor: '#b9c45a', top: 'stem', ears: 'bear', belly: true }),
  F(7, 'common', 'peach-chick', '복숭아병아리', '복숭아', '병아리', '보송보송 솜털이 복숭아처럼 부드러워요.', { body: 'round', c1: '#ffb3a1', tex: 'fuzz', top: 'leaf', wings: 'bird', wingColor: '#ff9a85', extras: ['beak', 'cheeks'] }),
  F(7, 'rare', 'mango-parrot', '망고앵무', '망고', '앵무새', '들은 단어를 똑같이 따라 하는 수다쟁이.', { body: 'oval', c1: '#ffb020', c2: '#ff6a3d', wings: 'bird', wingColor: '#2fbf71', belly: true, extras: ['beak', 'crest'] }),
  F(8, 'common', 'kiwi-penguin', '키위펭귄', '키위', '펭귄', '얼음 위를 미끄러지며 키위 씨앗을 흘려요.', { body: 'oval', c1: '#8a6a3e', c2: '#a8d84e', tex: 'fuzz', wings: 'flipper', wingColor: '#6b5030', belly: true, extras: ['beak', 'seedcore'] }),
  F(8, 'common', 'coconut-crab', '코코넛게', '코코넛', '게', '단단한 껍질 속에 달콤한 물을 숨겼어요.', { body: 'hairy', c1: '#7a4e2d', c2: '#fff6e8', belly: true, extras: ['claws'] }),
  F(9, 'common', 'pineapple-lion', '파인애플사자', '파인애플', '사자', '잎사귀 갈기를 휘날리는 열대의 왕.', { body: 'oval', c1: '#f5c13b', tex: 'scales', texColor: '#b9861a', top: 'pineapple', ears: 'round', extras: ['mane', 'snout'] }),
  F(9, 'rare', 'pomegranate-dragon', '석류용', '석류', '용', '보석 같은 씨앗 불꽃을 뿜는 작은 용.', { body: 'round', c1: '#b5122e', c2: '#ff6b81', tex: 'seeds', texColor: '#ff9aaa', top: 'calyx', wings: 'bat', wingColor: '#7a0b1d', tail: 'lizard', tailColor: '#8a0f22', extras: ['dragonhorns'] }),
  F(10, 'rare', 'fig-bat', '무화과박쥐', '무화과', '박쥐', '달밤에만 날아다니는 수줍은 박쥐.', { body: 'pear', c1: '#7b3f7a', c2: '#e98bb0', tex: 'none', top: 'stem', ears: 'cat', wings: 'bat', wingColor: '#5a2a58', belly: true, extras: ['seedcore'] }),
  F(10, 'legend', 'dragonfruit-dragon', '용과드래곤', '용과', '드래곤', '불꽃 비늘을 두른 전설의 용. 날개를 펴면 하늘이 분홍빛이 돼요.', { body: 'oval', c1: '#ff3d8b', c2: '#ffffff', tex: 'scales', texColor: '#7ed957', wings: 'bat', wingColor: '#c4126a', tail: 'lizard', tailColor: '#e0206e', belly: true, extras: ['dragonhorns', 'seedcore', 'crown'] }),
  F(11, 'common', 'plum-pig', '자두돼지', '자두', '돼지', '뒹굴뒹굴 구르면 새콤한 향이 나요.', { body: 'round', c1: '#8b2c6f', c2: '#d87ab8', tex: 'fuzz', ears: 'cat', earColor: '#a0407f', tail: 'curly', tailColor: '#a0407f', extras: ['pigsnout'] }),
  F(11, 'common', 'apricot-hamster', '살구햄스터', '살구', '햄스터', '볼주머니에 살구씨를 가득 넣고 다녀요.', { body: 'round', c1: '#ffae5a', c2: '#fff0dc', tex: 'fuzz', top: 'leaf', ears: 'round', belly: true, extras: ['cheeks', 'whiskers'] }),
  F(12, 'common', 'persimmon-fox', '감여우', '감', '여우', '가을 노을빛 털을 가진 꾀돌이 여우.', { body: 'round', c1: '#ff7a1a', c2: '#fff1e0', top: 'calyx', ears: 'fox', tail: 'bushy', tailColor: '#ff7a1a', belly: true }),
  F(12, 'rare', 'yuzu-otter', '유자수달', '유자', '수달', '따뜻한 유자차 온천에서 헤엄치는 수달.', { body: 'bumpy', c1: '#ffd23a', c2: '#fff6c8', tex: 'dimples', texColor: '#e0aa10', ears: 'round', tail: 'lizard', tailColor: '#d9a414', belly: true, extras: ['whiskers'] }),
  F(13, 'common', 'melon-octopus', '멜론문어', '멜론', '문어', '그물 무늬 몸으로 여덟 다리 춤을 춰요.', { body: 'round', c1: '#b7e07a', tex: 'net', texColor: '#eaffcc', extras: ['tentacles'] }),
  F(13, 'common', 'orange-whale', '오렌지고래', '오렌지', '고래', '물 대신 오렌지 주스를 뿜는 고래.', { body: 'oval', c1: '#ff8c1a', c2: '#ffe2b8', tex: 'dimples', tail: 'fin', tailColor: '#e06f05', belly: true, extras: ['spout'] }),
  F(14, 'common', 'raspberry-sheep', '라즈베리양', '라즈베리', '양', '복슬복슬 알갱이 털을 가진 양.', { body: 'cluster', c1: '#e2406a', tex: 'grapes', ears: 'sheep', earColor: '#f6d7c8', extras: ['ramhorns'] }),
  F(14, 'rare', 'lychee-snail', '리치달팽이', '리치', '달팽이', '울퉁불퉁 껍질 집을 업고 천천히 산책해요.', { body: 'round', c1: '#e84a6a', tex: 'bumps', texColor: '#ff8fa3', extras: ['stalks', 'flippers'] }),
  F(15, 'rare', 'avocado-koala', '아보카도코알라', '아보카도', '코알라', '배 속 큰 씨앗을 꼭 껴안고 잠들어요.', { body: 'pear', c1: '#3f7d2e', c2: '#d6e98a', ears: 'koala', earColor: '#356b26', belly: true, extras: ['seedcore', 'snout'] }),
  F(15, 'legend', 'starfruit-pegasus', '카람볼라천마', '카람볼라(별과일)', '천마', '별 모양 몸으로 밤하늘을 달리는 전설의 천마.', { body: 'star', c1: '#ffe14a', c2: '#fff8c8', wings: 'bird', wingColor: '#ffffff', extras: ['horn', 'crown'] }),
  F(16, 'common', 'chestnut-mole', '밤두더지', '밤', '두더지', '가시 껍질 속에서 굴을 파고 놀아요.', { body: 'apple', c1: '#8a4b2a', c2: '#f2d3a8', top: 'tip', belly: true, extras: ['claws', 'snout', 'whiskers'] }),
  F(16, 'common', 'jujube-sparrow', '대추참새', '대추', '참새', '짹짹! 마당에서 대추를 콕콕 쪼아요.', { body: 'oval', c1: '#b0322a', c2: '#f5d9a8', tex: 'spots', texColor: '#d9584a', top: 'stem', wings: 'bird', wingColor: '#8a2620', belly: true, extras: ['beak'] }),
  F(17, 'common', 'papaya-chameleon', '파파야카멜레온', '파파야', '카멜레온', '기분에 따라 초록에서 주황으로 색이 바뀌어요.', { body: 'long', c1: '#ff9a3c', c2: '#ffe0b0', tex: 'stripes', texColor: '#7fc95a', tail: 'curly', tailColor: '#7fc95a', belly: true, extras: ['crest'] }),
  F(17, 'rare', 'passionfruit-peacock', '패션프루트공작', '패션프루트', '공작', '꼬리를 활짝 펴면 무지개 씨앗이 반짝여요.', { body: 'round', c1: '#5a2a6e', tex: 'spots', texColor: '#8a5aa0', tail: 'fan', extras: ['beak', 'crest'] }),
  F(18, 'common', 'tomato-ladybug', '토마토무당벌레', '토마토', '무당벌레', '빨간 등에 까만 점이 콕콕. 행운을 가져와요.', { body: 'round', c1: '#ff3b30', tex: 'spots', texColor: '#2a1a1a', top: 'leaves', extras: ['antenna'] }),
  F(18, 'common', 'mulberry-moth', '오디나방', '오디', '나방', '보랏빛 가루를 뿌리며 밤에 날아요.', { body: 'oval', c1: '#4a1d4f', tex: 'bumps', texColor: '#7a3a80', wings: 'moth', wingColor: '#c9a6d8', extras: ['antenna'] }),
  F(19, 'common', 'greengrape-snake', '청포도뱀', '청포도', '뱀', '송이송이 몸을 스르륵 꼬아요.', { body: 'cluster', c1: '#9bd46a', tex: 'grapes', top: 'stem', tail: 'lizard', tailColor: '#7ab84a', extras: ['tongue'] }),
  F(19, 'rare', 'guava-toad', '구아바두꺼비', '구아바', '두꺼비', '분홍 속살을 가진 느긋한 두꺼비 대장.', { body: 'round', c1: '#7fbf5a', c2: '#ff9aa8', tex: 'spots', texColor: '#5a9a3a', belly: true, extras: ['frogeyes'] }),
  F(20, 'rare', 'rambutan-yeti', '람부탄예티', '람부탄', '설인', '털북숭이지만 마음은 하얗고 달콤해요.', { body: 'hairy', c1: '#e8304a', c2: '#fff6f0', belly: true, extras: ['arms'] }),
  F(20, 'legend', 'goldenapple-phoenix', '황금사과피닉스', '황금사과', '불사조', '쓰러져도 다시 날아오르는 황금빛 전설의 새.', { body: 'apple', c1: '#ffcc33', c2: '#fff1b0', top: 'leaf', wings: 'phoenix', tail: 'flame', belly: true, extras: ['beak', 'flamecrest', 'crown'] }),
  F(21, 'common', 'hallabong-rhino', '한라봉코뿔소', '한라봉', '코뿔소', '머리 혹이 뿔처럼 솟은 제주의 힘센 친구.', { body: 'bumpy', c1: '#ff9419', tex: 'dimples', ears: 'round', extras: ['rhinohorn'] }),
  F(21, 'common', 'quince-hippo', '모과하마', '모과', '하마', '울퉁불퉁하지만 향기는 최고인 하마.', { body: 'round', c1: '#e9cf4a', c2: '#fff4c0', tex: 'spots', texColor: '#cdb22e', ears: 'round', extras: ['snout'] }),
  F(22, 'rare', 'bloodorange-shark', '블러드오렌지상어', '블러드오렌지', '상어', '빨간 속살을 숨긴 바다의 사냥꾼. 사실은 겁쟁이예요.', { body: 'oval', c1: '#e0482d', c2: '#a3122a', tail: 'fin', tailColor: '#b8331c', belly: true, extras: ['dorsal', 'teeth'] }),
  F(22, 'common', 'chamoe-duck', '참외오리', '참외', '오리', '노란 줄무늬 몸으로 꽥꽥 노래해요.', { body: 'oval', c1: '#ffd62e', tex: 'stripes', texColor: '#fff6c8', wings: 'bird', wingColor: '#e6b800', extras: ['duckbill'] }),
  F(23, 'common', 'kumquat-butterfly', '금귤나비', '금귤', '나비', '작고 동그란 몸에 커다란 날개.', { body: 'round', c1: '#ff9f1a', tex: 'dimples', top: 'leaf', wings: 'butterfly', wingColor: '#ffd23f', extras: ['antenna'] }),
  F(23, 'common', 'shinemuscat-jelly', '샤인머스캣해파리', '샤인머스캣', '해파리', '투명하게 반짝이며 둥실둥실 떠다녀요.', { body: 'cluster', c1: '#c9f08a', tex: 'grapes', extras: ['tentacles'] }),
  F(24, 'common', 'mangosteen-raccoon', '망고스틴너구리', '망고스틴', '너구리', '보라색 껍질 가면을 쓴 장난꾸러기.', { body: 'round', c1: '#4b1f45', c2: '#f4f0ff', top: 'calyx', ears: 'round', tail: 'bushy', tailColor: '#3a1636', belly: true, extras: ['mask'] }),
  F(24, 'rare', 'jackfruit-elephant', '잭프루트코끼리', '잭프루트', '코끼리', '세상에서 가장 큰 과일 코끼리. 코로 단어를 집어 올려요.', { body: 'oval', c1: '#a8b43a', tex: 'scales', texColor: '#7d8a20', ears: 'elephant', earColor: '#8f9a2e', extras: ['trunk'] }),
  F(25, 'rare', 'froststrawberry-wolf', '서리딸기늑대', '서리딸기', '늑대', '하늘 성의 눈밭을 지키는 차가운 늑대.', { body: 'heart', c1: '#7fb8ff', tex: 'seeds', texColor: '#ffffff', top: 'leaves', ears: 'fox', earColor: '#5a98e8', tail: 'bushy', tailColor: '#a8d0ff', extras: ['frost'] }),
  F(25, 'legend', 'cosmicmelon-whale', '우주멜론고래', '우주멜론', '고래', '별빛 그물 무늬로 은하수를 헤엄치는 전설의 고래.', { body: 'round', c1: '#2a2f8a', tex: 'stars', texColor: '#cfe0ff', tail: 'fin', tailColor: '#3a40a8', extras: ['spout', 'crown'] }),

  // ───── 콜로세움(끝장 퀴즈) 전용: 일반 30 · 희귀 20 · 레전드 10 ─────
  C('common', 'blackberry-crow', '블랙베리까마귀', '블랙베리', '까마귀', '반짝이는 것을 모으는 콜로세움의 수집가.', { body: 'cluster', c1: '#3a2546', tex: 'grapes', wings: 'bird', wingColor: '#2a1a33', extras: ['beak'] }),
  C('common', 'grapefruit-seal', '자몽물개', '자몽', '물개', '관중석에서 박수를 제일 크게 치는 물개.', { body: 'oval', c1: '#ff7a6b', c2: '#ffd0c4', belly: true, extras: ['flippers', 'whiskers'] }),
  C('common', 'cranberry-squirrel', '크랜베리다람쥐', '크랜베리', '다람쥐', '경기장 기둥을 쏜살같이 오르내려요.', { body: 'round', c1: '#c8102e', c2: '#ffc2cc', ears: 'cat', tail: 'bushy', tailColor: '#9a0c24', belly: true }),
  C('common', 'gooseberry-cat', '구스베리고양이', '구스베리', '고양이', '줄무늬 털을 핥으며 낮잠 자는 고양이.', { body: 'round', c1: '#b8d86a', tex: 'stripes', texColor: '#8fb84a', ears: 'cat', extras: ['whiskers'] }),
  C('common', 'cantaloupe-bear', '캔털루프곰', '캔털루프', '곰', '그물 무늬 등이 자랑인 든든한 곰.', { body: 'round', c1: '#f2b06a', tex: 'net', texColor: '#ffe6c4', ears: 'bear' }),
  C('common', 'cheonhye-bunny', '천혜향토끼', '천혜향', '토끼', '머리 꼭지가 귀처럼 쫑긋한 토끼.', { body: 'bumpy', c1: '#ff8a1a', tex: 'dimples', ears: 'bunny', earColor: '#ff8a1a', extras: ['cheeks'] }),
  C('common', 'aengdu-duck', '앵두오리', '앵두', '오리', '작은 몸으로 뒤뚱뒤뚱 행진해요.', { body: 'round', c1: '#e8193f', top: 'cherry', wings: 'bird', wingColor: '#b8102e', extras: ['duckbill'] }),
  C('common', 'meoru-frog', '머루개구리', '머루', '개구리', '송이 몸으로 폴짝 뛰면 알알이 흔들려요.', { body: 'cluster', c1: '#2f2a6e', tex: 'grapes', extras: ['frogeyes', 'tongue'] }),
  C('common', 'loquat-bee', '비파벌', '비파', '꿀벌', '경기장 꽃밭을 지키는 부지런한 벌.', { body: 'oval', c1: '#ffb347', tex: 'stripes', texColor: '#6a3a10', wings: 'bee', extras: ['antenna'] }),
  C('common', 'darae-owl', '다래부엉이', '다래', '부엉이', '보송한 털로 밤 경기를 지켜봐요.', { body: 'oval', c1: '#9cbf4a', tex: 'fuzz', ears: 'cat', wings: 'bird', wingColor: '#6f9a2a', extras: ['beak'] }),
  C('common', 'aronia-fox', '아로니아여우', '아로니아', '여우', '까만 털로 그림자 속에 숨어요.', { body: 'round', c1: '#2b1e3a', c2: '#6a4a8a', ears: 'fox', tail: 'bushy', tailColor: '#3a2a50', belly: true }),
  C('common', 'omija-monkey', '오미자원숭이', '오미자', '원숭이', '다섯 가지 맛 표정을 지을 수 있어요.', { body: 'cluster', c1: '#d62845', tex: 'grapes', ears: 'round', earColor: '#a81c34', tail: 'curly', tailColor: '#a81c34' }),
  C('common', 'maesil-tadpole', '매실올챙이', '매실', '올챙이', '꼬리를 살랑살랑 흔들며 헤엄쳐요.', { body: 'oval', c1: '#9ed36a', c2: '#e6f8c8', tail: 'fin', tailColor: '#7ab84a', belly: true }),
  C('common', 'tangja-hedgehog', '탱자고슴도치', '탱자', '고슴도치', '가시가 단단해서 방패 같아요.', { body: 'spiky', c1: '#e6d33a', extras: ['snout'] }),
  C('common', 'hongsi-octopus', '홍시문어', '홍시', '문어', '말랑말랑한 다리로 응원 깃발을 흔들어요.', { body: 'round', c1: '#ff5a1a', top: 'calyx', extras: ['tentacles'] }),
  C('common', 'geobong-mole', '거봉두더지', '거봉', '두더지', '경기장 모래 밑에 굴을 파 놓았어요.', { body: 'cluster', c1: '#4a2a6e', tex: 'grapes', extras: ['claws', 'snout', 'whiskers'] }),
  C('common', 'nectarine-pig', '천도복숭아돼지', '천도복숭아', '돼지', '반질반질 볼을 자랑하는 돼지.', { body: 'round', c1: '#e8405a', tex: 'fuzz', ears: 'cat', tail: 'curly', tailColor: '#c02a44', extras: ['pigsnout'] }),
  C('common', 'longan-turtle', '롱안거북', '롱안', '거북', '천천히 가도 결승선까지 꼭 가요.', { body: 'round', c1: '#c9a46a', top: 'stem', extras: ['flippers'] }),
  C('common', 'raspberry-chick', '산딸기병아리', '산딸기', '병아리', '삐약! 첫 경기에 나선 새내기.', { body: 'cluster', c1: '#e83a5a', tex: 'grapes', wings: 'bird', wingColor: '#c02a48', extras: ['beak'] }),
  C('common', 'borisu-mouse', '보리수생쥐', '보리수열매', '생쥐', '점박이 몸으로 관중석 사이를 누벼요.', { body: 'oval', c1: '#d8402a', tex: 'spots', texColor: '#f6c8a0', ears: 'mouse', tail: 'lizard', tailColor: '#a82a1a' }),
  C('common', 'greenapple-frog', '풋사과개구리', '풋사과', '개구리', '새콤한 목소리로 개굴개굴 응원해요.', { body: 'apple', c1: '#8fd14f', c2: '#e6f8c8', belly: true, extras: ['frogeyes'] }),
  C('common', 'redhyang-squirrel', '레드향다람쥐', '레드향', '다람쥐', '볼 가득 간식을 넣고 경기를 봐요.', { body: 'bumpy', c1: '#ff6a1a', ears: 'cat', tail: 'bushy', tailColor: '#d9500a', extras: ['cheeks'] }),
  C('common', 'greentangerine-whale', '청귤고래', '청귤', '고래', '초록 물줄기를 뿜는 꼬마 고래.', { body: 'round', c1: '#6fbf3a', tex: 'dimples', tail: 'fin', tailColor: '#4f9a22', extras: ['spout'] }),
  C('common', 'elderberry-bat', '엘더베리박쥐', '엘더베리', '박쥐', '밤 경기에만 나타나는 수줍은 박쥐.', { body: 'cluster', c1: '#2a2040', tex: 'grapes', ears: 'cat', wings: 'bat', wingColor: '#1a1430' }),
  C('common', 'honeydew-sheep', '허니듀양', '허니듀멜론', '양', '달콤한 향기가 나는 복슬복슬 양.', { body: 'round', c1: '#d8f0a8', tex: 'net', texColor: '#f4ffe0', ears: 'sheep', earColor: '#f6e7d8', extras: ['ramhorns'] }),
  C('common', 'noni-caterpillar', '노니애벌레', '노니', '애벌레', '울퉁불퉁 몸으로 꿈틀꿈틀 전진해요.', { body: 'long', c1: '#e8e6c0', tex: 'bumps', texColor: '#c9c69a', extras: ['antenna'] }),
  C('common', 'sapodilla-otter', '사포딜라수달', '사포딜라', '수달', '갈색 털이 보들보들한 수영 선수.', { body: 'oval', c1: '#a87a4a', c2: '#e8cfa8', ears: 'round', tail: 'lizard', tailColor: '#8a6038', belly: true, extras: ['whiskers'] }),
  C('common', 'salak-snake', '살락뱀', '살락(뱀껍질과일)', '뱀', '비늘 껍질로 스르륵 미끄러져요.', { body: 'oval', c1: '#6b2a1a', tex: 'scales', texColor: '#a8503a', tail: 'lizard', tailColor: '#5a2214', extras: ['tongue'] }),
  C('common', 'bokbunja-crab', '복분자게', '복분자', '게', '집게를 딸깍딸깍! 옆으로 걸어요.', { body: 'cluster', c1: '#4a0f2a', tex: 'grapes', extras: ['claws'] }),
  C('common', 'dangam-hamster', '단감햄스터', '단감', '햄스터', '단단한 볼주머니가 자랑이에요.', { body: 'round', c1: '#ff8a2a', c2: '#fff0dc', top: 'calyx', ears: 'round', belly: true, extras: ['cheeks', 'whiskers'] }),

  C('rare', 'ice-blueberry-penguin', '얼음블루베리펭귄', '얼음블루베리', '펭귄', '빙판 경기장의 스케이트 챔피언.', { body: 'oval', c1: '#8ac4ff', c2: '#ffffff', wings: 'flipper', wingColor: '#5a98e8', belly: true, extras: ['beak', 'frost'] }),
  C('rare', 'flame-pomegranate-fox', '불꽃석류여우', '불꽃석류', '여우', '꼬리에서 불씨가 톡톡 튀어요.', { body: 'round', c1: '#ff3b1a', c2: '#ffe0c8', tex: 'seeds', texColor: '#ffb0a0', ears: 'fox', tail: 'flame', belly: true }),
  C('rare', 'shadow-grape-bat', '그림자포도박쥐', '그림자포도', '박쥐', '그림자 속에서 날개를 펼쳐요.', { body: 'cluster', c1: '#2a1a4a', tex: 'grapes', ears: 'cat', wings: 'bat', wingColor: '#4a2a8a', extras: ['frost'] }),
  C('rare', 'rainbow-watermelon-whale', '무지개수박고래', '무지개수박', '고래', '뿜는 물줄기에 무지개가 떠요.', { body: 'round', c1: '#3fbf6a', tex: 'stripes', texColor: '#ff6ad5', tail: 'fin', tailColor: '#2f9a55', extras: ['spout'] }),
  C('rare', 'steel-coconut-turtle', '강철코코넛거북', '강철코코넛', '거북', '투구를 쓴 콜로세움의 방어 대장.', { body: 'hairy', c1: '#6a6a7a', extras: ['flippers', 'helmet'] }),
  C('rare', 'pineapple-gladiator', '파인애플검투사', '파인애플', '검투사', '방패를 들고 당당히 입장하는 검투사.', { body: 'oval', c1: '#f5c13b', tex: 'scales', texColor: '#b9861a', extras: ['helmet', 'shield'] }),
  C('rare', 'cloud-peach-sheep', '구름복숭아양', '구름복숭아', '양', '구름 위를 걷는 듯 폭신한 양.', { body: 'round', c1: '#ffd0e0', tex: 'fuzz', ears: 'sheep', earColor: '#fff0f4', extras: ['ramhorns', 'cheeks'] }),
  C('rare', 'moon-pear-owl', '달빛배부엉이', '달빛배', '부엉이', '별무늬 몸으로 밤하늘을 지켜요.', { body: 'pear', c1: '#d8dcff', tex: 'stars', texColor: '#8a90e8', ears: 'cat', wings: 'bird', wingColor: '#a8aef0', extras: ['beak'] }),
  C('rare', 'pricklypear-lizard', '선인장열매도마뱀', '선인장열매', '도마뱀', '사막 경기장의 날쌘 달리기 선수.', { body: 'oval', c1: '#c8306a', tex: 'spots', texColor: '#f08ab0', tail: 'lizard', tailColor: '#a82a5a', extras: ['crest'] }),
  C('rare', 'armored-lychee-crab', '갑옷리치게', '갑옷리치', '게', '울퉁불퉁 갑옷과 투구로 무장했어요.', { body: 'round', c1: '#e84a6a', tex: 'bumps', texColor: '#ff8fa3', extras: ['claws', 'helmet'] }),
  C('rare', 'flower-apple-butterfly', '꽃사과나비', '꽃사과', '나비', '날갯짓마다 꽃잎이 흩날려요.', { body: 'apple', c1: '#ff8fb3', top: 'leaf', wings: 'butterfly', wingColor: '#ffd6e8', extras: ['antenna'] }),
  C('rare', 'crystal-grape-jelly', '수정포도해파리', '수정포도', '해파리', '투명한 몸이 보석처럼 빛나요.', { body: 'cluster', c1: '#b8e6ff', tex: 'grapes', extras: ['tentacles', 'frost'] }),
  C('rare', 'royal-mangosteen-bear', '왕망고스틴곰', '왕망고스틴', '곰', '투구를 쓴 보라색 경기장 수문장.', { body: 'round', c1: '#4b1f45', c2: '#f4f0ff', ears: 'bear', earColor: '#4b1f45', belly: true, extras: ['helmet'] }),
  C('rare', 'wind-kiwi-bird', '바람키위새', '바람키위', '새', '바람처럼 빠르게 경기장을 한 바퀴 돌아요.', { body: 'oval', c1: '#8a6a3e', c2: '#a8d84e', tex: 'fuzz', wings: 'bird', wingColor: '#c9a46a', belly: true, extras: ['beak', 'crest', 'seedcore'] }),
  C('rare', 'starlight-cherry-bunny', '별빛체리토끼', '별빛체리', '토끼', '귀 끝에서 별가루가 떨어져요.', { body: 'round', c1: '#c2183a', tex: 'stars', texColor: '#ffe680', top: 'cherry', ears: 'bunny', earColor: '#c2183a' }),
  C('rare', 'forest-avocado-turtle', '숲아보카도거북', '숲아보카도', '거북', '등에 작은 숲을 키우는 거북.', { body: 'pear', c1: '#3f7d2e', c2: '#d6e98a', top: 'leaf', belly: true, extras: ['flippers', 'seedcore'] }),
  C('rare', 'volcano-dragonfruit-lizard', '화산용과도마뱀', '화산용과', '도마뱀', '용암처럼 뜨거운 꼬리를 가졌어요.', { body: 'oval', c1: '#ff3d8b', tex: 'scales', texColor: '#ffb020', tail: 'flame', extras: ['dragonhorns', 'crest'] }),
  C('rare', 'snowflake-tangerine-fox', '눈송이귤여우', '눈송이귤', '여우', '눈 내리는 날 경기장에 나타나요.', { body: 'round', c1: '#ffb84a', c2: '#ffffff', ears: 'fox', tail: 'bushy', tailColor: '#ffd8a0', belly: true, extras: ['frost'] }),
  C('rare', 'pirate-coconut-crab', '해적코코넛게', '해적코코넛', '게', '눈가리개를 쓴 바다 해적 게.', { body: 'hairy', c1: '#7a4e2d', extras: ['claws', 'mask'] }),
  C('rare', 'knight-durian-hedgehog', '기사두리안고슴도치', '기사두리안', '고슴도치', '가시 갑옷에 방패까지 든 기사.', { body: 'spiky', c1: '#c9b84a', extras: ['helmet', 'shield', 'snout'] }),

  C('legend', 'champion-watermelon-gladiator', '챔피언수박검투사', '챔피언수박', '검투사', '콜로세움 최강의 챔피언! 줄무늬 갑옷은 한 번도 깨진 적이 없어요.', { body: 'round', c1: '#2f9a45', tex: 'stripes', texColor: '#16602a', extras: ['helmet', 'shield', 'crown'] }),
  C('legend', 'phoenix-pomegranate-knight', '불사조석류기사', '불사조석류', '기사', '쓰러져도 불꽃 날개로 다시 일어서는 기사.', { body: 'round', c1: '#b5122e', tex: 'seeds', texColor: '#ff9aaa', wings: 'phoenix', tail: 'flame', extras: ['helmet', 'crown'] }),
  C('legend', 'emperor-pineapple-lion', '황제파인애플사자', '황제파인애플', '사자', '황금 갈기를 휘날리는 경기장의 황제.', { body: 'oval', c1: '#ffcc33', tex: 'scales', texColor: '#c99a10', top: 'pineapple', ears: 'round', extras: ['mane', 'snout', 'crown'] }),
  C('legend', 'thunder-lemon-dragon', '천둥레몬드래곤', '천둥레몬', '드래곤', '번개처럼 새콤한 숨결을 내뿜는 용.', { body: 'oval', c1: '#fff04a', c2: '#fffbd0', wings: 'bat', wingColor: '#e6b800', tail: 'lizard', tailColor: '#e6c800', belly: true, extras: ['dragonhorns', 'crest', 'crown'] }),
  C('legend', 'galaxy-grape-whale', '은하포도고래', '은하포도', '고래', '포도알마다 별이 하나씩 들어 있는 우주 고래.', { body: 'cluster', c1: '#2a2f8a', tex: 'grapes', tail: 'fin', tailColor: '#3a40a8', extras: ['spout', 'crown'] }),
  C('legend', 'sun-mango-phoenix', '태양망고피닉스', '태양망고', '불사조', '해가 뜰 때 함께 날아오르는 태양의 새.', { body: 'oval', c1: '#ffb020', c2: '#ff6a3d', wings: 'phoenix', tail: 'flame', belly: true, extras: ['beak', 'flamecrest', 'crown'] }),
  C('legend', 'glacier-melon-turtle', '빙하멜론거북', '빙하멜론', '거북', '천 년 동안 얼음 바다를 건너온 거북.', { body: 'round', c1: '#bfe6ff', tex: 'net', texColor: '#ffffff', extras: ['flippers', 'frost', 'crown'] }),
  C('legend', 'rainbow-starfruit-unicorn', '무지개카람볼라유니콘', '무지개카람볼라', '유니콘', '뿔에서 무지개가 피어나는 별 모양 유니콘.', { body: 'star', c1: '#ff9ad5', c2: '#fff0fa', wings: 'bird', wingColor: '#ffffff', extras: ['horn', 'crown'] }),
  C('legend', 'golden-durian-king', '황금두리안킹', '황금두리안', '스컹크', '황금 가시 갑옷을 입은 냄새의 왕.', { body: 'spiky', c1: '#ffcc33', c2: '#fff3b0', tail: 'skunk', belly: true, extras: ['helmet', 'crown'] }),
  C('legend', 'cosmic-dragonfruit-king', '우주용과드래곤킹', '우주용과', '드래곤', '우주 끝에서 날아온 모든 용의 왕.', { body: 'oval', c1: '#6a2aff', c2: '#ffffff', tex: 'scales', texColor: '#ff3d8b', wings: 'bat', wingColor: '#4a10c0', tail: 'lizard', tailColor: '#5a20e0', belly: true, extras: ['dragonhorns', 'seedcore', 'crown'] }),
];

export const REGION_FRUITS = FRUITS.filter((f) => f.zone === 'region');
export const COLOSSEUM_FRUITS = FRUITS.filter((f) => f.zone === 'colosseum');
export const COLOSSEUM_LEGENDS = COLOSSEUM_FRUITS.filter((f) => f.rarity === 'legend');
export const FRUIT_BY_ID: Record<string, FruitDef> = Object.fromEntries(FRUITS.map((f) => [f.id, f]));
export const RARITY_LABEL: Record<Rarity, string> = { common: '일반', rare: '희귀', legend: '전설' };
export const RARITY_BADGE: Record<Rarity, string> = { common: '', rare: 'RARE', legend: 'LEGEND' };
