export type SectionId =
  | 'home'
  | 'photo'
  | 'books'
  | 'poems'
  | 'paintings'
  | 'sport'
  | 'series'
  | 'films'
  | 'games'
  | 'apps';

export interface PortalEntry {
  id: SectionId | 'world3d';
  index: string;
  label: string;
  zhLabel: string;
  count: string;
  summary: string;
  accentHex: string;
  href?: string;
}

export interface PhotoItem {
  id: string;
  index: number;
  number: string;
  act: 'BLOOM' | 'HORIZON' | 'CITY' | 'NIGHT' | 'LAND' | 'WINTER';
  src: string;
  full: string;
  original?: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

export interface BookItem {
  id: string;
  spine: string;
  title: string;
  author: string;
  blurb: string;
  thickness: number;
  height: number;
  cloth: string;
  ink: string;
  band: string;
}

export interface PoemItem {
  id: string;
  title: string;
  displayTitle: string;
  author: string;
  authorUrl: string;
  form: string;
  year: string;
  standfirst: string;
  sourceLabel: string;
  sourceUrl: string;
  note: string;
  refrains: string[];
  stanzas: string[][];
}

export interface PaintingItem {
  id: string;
  title: string;
  english: string;
  artist: string;
  artistShort: string;
  year: string;
  medium: string;
  museum: string;
  museumUrl: string;
  note: string;
  alt: string;
  image: string;
  thumbnail: string;
}

export interface SportTeam {
  id: string;
  sportLabel: string;
  club: string;
  league: string;
  honours: string;
  honoursHighlight: string;
  sourceLabel: string;
  sourceUrl: string;
  image: string;
  crest: string;
  alt: string;
  objectPosition: string;
  accent: string;
}

export interface SeriesItem {
  id: string;
  douban: string;
  poster: string;
  title: string;
  years: string;
  seasons: string;
  category:
    | 'CLASSICS'
    | 'CRIME & MYSTERY'
    | 'POWER & HISTORY'
    | 'SCI-FI & FANTASY'
    | 'DARK SATIRE'
    | 'FAMILY & LIFE'
    | 'ROMANCE & MELO';
  quote: string;
}

export interface FilmItem {
  id: string;
  douban: string;
  poster: string;
  title: string;
  director: string;
  year: string;
  genre: 'CRIME & NOIR' | 'SCI-FI' | 'DRAMA' | 'ROMANCE & CLASSIC';
  quote: string;
}

export interface GameItem {
  id: string;
  rank: number;
  title: string;
  release: string;
  releaseDate: string;
  releaseKind: 'series' | 'single';
  image: string;
  alt: string;
}

export interface AppExhibit {
  id: string;
  name: string;
  kicker: string;
  platform: string;
  tagline: string;
  description: string;
  image: string;
  imageAlt: string;
  detailHref: string;
  githubHref: string;
  releaseHref: string;
  webHref?: string;
  highlights: { title: string; detail: string }[];
  specs: { label: string; value: string }[];
}

export const PORTAL_ENTRIES: PortalEntry[] = [
  {
    id: 'photo',
    index: '01',
    label: 'Photography',
    zhLabel: '摄影',
    count: '46',
    summary: '光影、地平线与城市的四十六个定格瞬间',
    accentHex: '#D4A853',
  },
  {
    id: 'books',
    index: '02',
    label: 'Books',
    zhLabel: '书架',
    count: '16',
    summary: '十六部反复翻阅的典藏与私人批注',
    accentHex: '#C28B59',
  },
  {
    id: 'poems',
    index: '03',
    label: 'Poems',
    zhLabel: '诗歌',
    count: '03',
    summary: '三首留在夜色里的英文诗篇与逐节排印',
    accentHex: '#B8A88A',
  },
  {
    id: 'paintings',
    index: '04',
    label: 'Paintings',
    zhLabel: '名画',
    count: '12',
    summary: '十二幅世界馆藏名作与笔触检视室',
    accentHex: '#6E95B8',
  },
  {
    id: 'sport',
    index: '05',
    label: 'Sport',
    zhLabel: '体育',
    count: '05',
    summary: '五个赛场席位：NBA、英超、F1、NFL 与 CS2',
    accentHex: '#5FA68E',
  },
  {
    id: 'series',
    index: '06',
    label: 'Series',
    zhLabel: '剧集',
    count: '36',
    summary: '三十六部跨越类型与年代的长篇叙事',
    accentHex: '#9C82B5',
  },
  {
    id: 'films',
    index: '07',
    label: 'Films',
    zhLabel: '电影',
    count: '24',
    summary: '二十四部私人电影资料馆片单与导演索引',
    accentHex: '#C97B63',
  },
  {
    id: 'games',
    index: '08',
    label: 'Games',
    zhLabel: '游戏',
    count: '18',
    summary: '十八座互动世界与发行编年史',
    accentHex: '#7A9EC2',
  },
  {
    id: 'apps',
    index: '09',
    label: 'Apps',
    zhLabel: '应用',
    count: '02',
    summary: '亲手构建的 N1ghtScore 与 N1ghtKey',
    accentHex: '#A7B5A0',
  },
  {
    id: 'world3d',
    index: '10',
    label: '3D World',
    zhLabel: '3D 世界',
    count: '3D',
    summary: '步入完整的沉浸式三维夜间陈列室',
    accentHex: '#E0C078',
    href: '/3d/',
  },
];

const RAW_PHOTOS: Array<
  [
    number,
    PhotoItem['act'],
    string,
    string,
    string,
    number,
    number,
    string,
    string,
  ]
> = [
  [0, 'BLOOM', 'photo/wall/1779456446198.webp', 'photo/1779456446198.jpg', '', 1600, 1067, 'Bare branches in backlight against a pale sky', 'Before the leaves, the shape is the story.'],
  [1, 'BLOOM', 'photo/wall/1779456446218.webp', 'photo/1779456446218.jpg', '', 1600, 1067, 'Yellow blossom clustered on a dark branch', 'Yellow arrives first.'],
  [2, 'BLOOM', 'photo/wall/SAVE_20260618_225416.webp', 'photo/SAVE_20260618_225416.jpg', '', 1600, 1067, 'A reindeer with broad antlers standing behind pale birch trunks', 'Antlers fill the gap between trunks.'],
  [3, 'HORIZON', 'photo/wall/SAVE_20260616_234154.webp', 'photo/SAVE_20260616_234154.jpg', '', 1600, 1067, 'A green field under a wide bank of clouds', 'A field under a sky that keeps opening.'],
  [4, 'BLOOM', 'photo/wall/1779456446227.webp', 'photo/1779456446227.jpg', '', 1600, 1067, 'White blossom against a soft blue background', 'Blossom against blue.'],
  [5, 'HORIZON', 'photo/wall/SAVE_20260618_230022_1781795010861edit.webp', 'photo/SAVE_20260618_230022_1781795010861edit.jpg', '', 1600, 1067, 'Wind turbines on green hills beneath a wide bank of cloud', 'Small blades against a soft grey sky.'],
  [6, 'BLOOM', 'photo/wall/1779456446240.webp', 'photo/1779456446240.jpg', '', 1600, 1067, 'Folded flower buds and leaves against a green blurred background', 'Still folded, already reaching.'],
  [7, 'BLOOM', 'photo/wall/1779456446231.webp', 'photo/1779456446231.jpg', '', 1600, 1067, 'A white blossom branch reaching into the blue sky', 'A branch reaches for the sky.'],
  [8, 'HORIZON', 'photo/wall/1789470372631.webp', 'photo/1789470372631.jpg', '', 1600, 1067, 'White cumulus towers above green hills and a row of wind turbines', 'The cloud sits down on the ridge.'],
  [9, 'BLOOM', 'photo/wall/1779456446248.webp', 'photo/1779456446248.jpg', '', 1600, 1067, 'Dense white blossom on dark branches', 'Too much bloom to hold.'],
  [10, 'BLOOM', 'photo/wall/SAVE_20260618_225310.webp', 'photo/SAVE_20260618_225310.jpg', '', 1600, 1067, 'A grove of pale birch trunks under bright green leaves', 'Every trunk repeats the same line.'],
  [11, 'BLOOM', 'photo/wall/1779456446245.webp', 'photo/1779456446245.jpg', '', 1600, 1067, 'A curved branch with white blossom against the blue sky', 'The arc knows where it is going.'],
  [12, 'BLOOM', 'photo/wall/SAVE_20260618_225828.webp', 'photo/SAVE_20260618_225828.jpg', '', 1600, 1067, 'A blue pond ringed by vivid green brush and small trees', 'Blue water inside a ring of green.'],
  [13, 'BLOOM', 'photo/wall/SAVE_20260616_234458.webp', 'photo/SAVE_20260616_234458.jpg', '', 1600, 1067, 'A black cow with a white face standing in sunlit green grass', 'One looks up while the other eats.'],
  [14, 'HORIZON', 'photo/wall/SAVE_20260618_230059.webp', 'photo/SAVE_20260618_230059.jpg', '', 1600, 1067, 'A town of pale rooftops beneath a wide bank of cloud', 'Roofs, then hills, then cloud.'],
  [15, 'BLOOM', 'photo/wall/SAVE_20260618_225844_1781795146234edit.webp', 'photo/SAVE_20260618_225844_1781795146234edit.jpg', '', 1600, 1067, 'Sunlit green leaves on a thin branch against deep shadow', 'One branch keeps all the light.'],
  [16, 'HORIZON', 'photo/wall/SAVE_20260616_234224.webp', 'photo/SAVE_20260616_234224.jpg', '', 1600, 1067, 'A field under low hanging clouds', 'Clouds moving slower than the road.'],
  [17, 'HORIZON', 'photo/wall/SAVE_20260618_225834_1781795044036edit.webp', 'photo/SAVE_20260618_225834_1781795044036edit.jpg', '', 1600, 1067, 'A pale river curving through a green plain beneath distant hills', 'The water turns back on itself.'],
  [18, 'HORIZON', 'photo/wall/SAVE_20260618_230015_1781795020338edit.webp', 'photo/SAVE_20260618_230015_1781795020338edit.jpg', '', 1600, 1067, 'A river threading through wide green forest toward far hills', 'Trees crowd the water on both sides.'],
  [19, 'HORIZON', 'photo/wall/SAVE_20260616_234337.webp', 'photo/SAVE_20260616_234337.jpg', '', 1600, 1067, 'A green grass slope below a tall cloud', 'Green, then a long horizon.'],
  [20, 'HORIZON', 'photo/wall/SAVE_20260616_234423.webp', 'photo/SAVE_20260616_234423.jpg', '', 1600, 1067, 'Open fields with a distant band of cloud', 'The day leaves the frame open.'],
  [21, 'CITY', 'photo/wall/1791482278707.webp?v=1', 'photo/prints/1791482278707.webp?v=1', 'photo/1791482278707.jpg', 4080, 3072, 'A red sunset above the river and a distant city skyline', 'The last red light'],
  [22, 'CITY', 'photo/wall/1791482278719.webp?v=1', 'photo/prints/1791482278719.webp?v=1', 'photo/1791482278719.jpg', 4080, 3072, 'Golden light breaking through dark clouds above the river', 'An opening in the clouds'],
  [23, 'CITY', 'photo/wall/1791482278743.webp?v=1', 'photo/prints/1791482278743.webp?v=1', 'photo/1791482278743.jpg', 4080, 3072, 'The low sun reflected in rippling river water', 'Sunlight on the river'],
  [24, 'CITY', 'photo/wall/1791482278773.webp?v=1', 'photo/prints/1791482278773.webp?v=1', 'photo/1791482278773.jpg', 4096, 3072, 'The Oriental Pearl Tower rising into a cloud-filled sky', 'Looking up in Shanghai'],
  [25, 'CITY', 'photo/wall/1791482278781.webp?v=1', 'photo/prints/1791482278781.webp?v=1', 'photo/1791482278781.jpg', 4096, 3072, 'White arches of a bridge crossing a broad river', 'White arches, still water'],
  [26, 'CITY', 'photo/wall/1791482278794.webp?v=1', 'photo/prints/1791482278794.webp?v=1', 'photo/1791482278794.jpg', 4080, 3072, 'A sailing ship and towers beside a winding waterway', 'A ship beside the city'],
  [27, 'CITY', 'photo/wall/1791482278808.webp?v=1', 'photo/prints/1791482278808.webp?v=1', 'photo/1791482278808.jpg', 4080, 3072, 'An ornate building with tall towers beside green parkland', 'Towers across the water'],
  [28, 'NIGHT', 'photo/wall/1791482278824.webp?v=1', 'photo/prints/1791482278824.webp?v=1', 'photo/1791482278824.jpg', 4096, 3072, 'A bridge illuminated in gold against the night sky', 'A bridge after dark'],
  [29, 'NIGHT', 'photo/wall/1791482278836.webp?v=1', 'photo/prints/1791482278836.webp?v=1', 'photo/1791482278836.jpg', 3072, 4096, 'A golden illuminated church tower against the dark sky', 'Gold against the night'],
  [30, 'NIGHT', 'photo/wall/1791482278844.webp?v=1', 'photo/prints/1791482278844.webp?v=1', 'photo/1791482278844.jpg', 4096, 3072, 'Yellow lanterns above red flowers on a lively night street', 'Lanterns and red flowers'],
  [31, 'CITY', 'photo/wall/1791482278854.webp?v=1', 'photo/prints/1791482278854.webp?v=1', 'photo/1791482278854.jpg', 4096, 3072, 'A river bridge framed by apartment buildings and green hills', 'The river below the balcony'],
  [32, 'CITY', 'photo/wall/1791482278864.webp?v=1', 'photo/prints/1791482278864.webp?v=1', 'photo/1791482278864.jpg', 3072, 4080, 'Sunset seen between tall buildings on a narrow street', 'The light between buildings'],
  [33, 'CITY', 'photo/wall/1791482278875.webp?v=1', 'photo/prints/1791482278875.webp?v=1', 'photo/1791482278875.jpg', 4096, 3072, 'The setting sun seen through a dark canopy of trees', 'A small window of sun'],
  [34, 'CITY', 'photo/wall/1791482278888.webp?v=1', 'photo/prints/1791482278888.webp?v=1', 'photo/1791482278888.jpg', 4080, 3072, 'A red arched bridge and city buildings beyond the river', 'A red arc across the city'],
  [35, 'NIGHT', 'photo/wall/1791482278899.webp?v=1', 'photo/prints/1791482278899.webp?v=1', 'photo/1791482278899.jpg', 3072, 4096, 'An illuminated red pagoda framed by trees at night', 'Red among the trees'],
  [36, 'LAND', 'photo/wall/1791482278910.webp?v=1', 'photo/prints/1791482278910.webp?v=1', 'photo/1791482278910.jpg', 3072, 4080, 'A tall layered rock pillar rising above green mountains', 'Stone above the valley'],
  [37, 'LAND', 'photo/wall/1791482278923.webp?v=1', 'photo/prints/1791482278923.webp?v=1', 'photo/1791482278923.jpg', 4096, 1844, 'Layers of blue mountains beyond a sunlit grassy ridge', 'Ridges into the distance'],
  [38, 'LAND', 'photo/wall/1791482278932.webp?v=1', 'photo/prints/1791482278932.webp?v=1', 'photo/1791482278932.jpg', 4096, 1844, 'Clear turquoise water beside trees and a riverside path', 'Following the blue water'],
  [39, 'LAND', 'photo/wall/1791482278944.webp?v=1', 'photo/prints/1791482278944.webp?v=1', 'photo/1791482278944.jpg', 4096, 1844, 'A branching waterfall flowing through dense green forest', 'Water through the forest'],
  [40, 'LAND', 'photo/wall/1791482278956.webp?v=1', 'photo/prints/1791482278956.webp?v=1', 'photo/1791482278956.jpg', 4096, 1844, 'A white cascade flowing into a turquoise pool', 'A pool below the falls'],
  [41, 'LAND', 'photo/wall/1791482278971.webp?v=1', 'photo/prints/1791482278971.webp?v=1', 'photo/1791482278971.jpg', 4096, 3072, 'A clear turquoise pool reflecting vivid green trees', 'A green reflection'],
  [42, 'LAND', 'photo/wall/1791482278991.webp?v=1', 'photo/prints/1791482278991.webp?v=1', 'photo/1791482278991.jpg', 4096, 1844, 'Buildings beside a river beneath green mountains and clouds', 'A village below the hills'],
  [43, 'LAND', 'photo/wall/1791482278998.webp?v=1', 'photo/prints/1791482278998.webp?v=1', 'photo/1791482278998.jpg', 4096, 1844, 'A broad waterfall falling from a forested cliff', 'The curtain of water'],
  [44, 'LAND', 'photo/wall/1791482279005.webp?v=1', 'photo/prints/1791482279005.webp?v=1', 'photo/1791482279005.jpg', 4096, 1844, 'A distant waterfall and drifting mist among green hills', 'Mist above the valley'],
  [45, 'WINTER', 'photo/wall/mmexport1702262955913.webp?v=1', 'photo/prints/mmexport1702262955913.webp?v=1', 'photo/mmexport1702262955913.jpg', 1920, 1080, 'Snow-covered trees beside a pond and a small pavilion', 'A garden in snow'],
];

export const PHOTOS: PhotoItem[] = RAW_PHOTOS.map(
  ([index, act, src, full, original, width, height, alt, caption]) => {
    const number = String(index + 1).padStart(2, '0');
    return {
      id: `photo-${number}`,
      index,
      number,
      act,
      src: '/' + src,
      full: '/' + full,
      original: original ? '/' + original : undefined,
      width,
      height,
      alt,
      caption,
    };
  },
);

export const BOOKS: BookItem[] = [
  { id: 'three-body', spine: 'The Three-Body Problem', title: '三体', author: 'Liu Cixin', blurb: 'We called into the dark, only to hear that the whole forest was already holding its breath.', thickness: 39, height: 278, cloth: '#2f4858', ink: '#f2ece0', band: '#c8a24a' },
  { id: 'stranger', spine: 'The Stranger', title: '局外人', author: 'Albert Camus', blurb: 'The sun was so bright that even the tears expected of him would not come.', thickness: 24, height: 254, cloth: '#8a3b34', ink: '#f6ece4', band: '#e0c07a' },
  { id: 'notre-dame', spine: 'Notre-Dame de Paris', title: '巴黎圣母院', author: 'Victor Hugo', blurb: 'The bell tower sheltered a man the city would not look at kindly. The cathedral stood between him and their eyes.', thickness: 34, height: 288, cloth: '#c7a233', ink: '#2b2618', band: '#8a3b34' },
  { id: 'to-live', spine: 'To Live', title: '活着', author: 'Yu Hua', blurb: 'Life took things from him one by one. He kept living, one day at a time.', thickness: 30, height: 245, cloth: '#1f4b52', ink: '#eef0e9', band: '#d08a4a' },
  { id: 'steel', spine: 'How the Steel Was Tempered', title: '钢铁是怎样炼成的', author: 'Nikolai Ostrovsky', blurb: 'He folded a lifetime into a single sentence. The sentence outlived him.', thickness: 30, height: 266, cloth: '#7d2f2a', ink: '#f4e9d8', band: '#e0c07a' },
  { id: 'fortress', spine: 'Fortress Besieged', title: '围城', author: 'Qian Zhongshu', blurb: 'Those inside want out; those outside want in. The wall stays where it is.', thickness: 41, height: 252, cloth: '#5f6b4a', ink: '#f2f2e6', band: '#3b6b6b' },
  { id: 'gatsby', spine: 'The Great Gatsby', title: '了不起的盖茨比', author: 'F. Scott Fitzgerald', blurb: 'For years he reached across the bay for a green light. It remained so small.', thickness: 26, height: 273, cloth: '#22304a', ink: '#e9eef5', band: '#c8a24a' },
  { id: 'ming', spine: 'Ming Dynasty', title: '明朝那些事儿', author: 'Dang Nian Ming Yue', blurb: 'The cold names in history books become people who hunger, fear and make mistakes.', thickness: 33, height: 248, cloth: '#8c4a1f', ink: '#f6ecdc', band: '#e8cfa0' },
  { id: 'ordinary', spine: 'Ordinary World', title: '平凡的世界', author: 'Lu Yao', blurb: 'Bricks by day. At night, a book pulled from beneath the pillow and read by a single lamp.', thickness: 45, height: 284, cloth: '#3b3550', ink: '#efe9df', band: '#a9a0c4' },
  { id: 'red-chamber', spine: 'Dream of the Red Chamber', title: '红楼梦', author: 'Cao Xueqin', blurb: "At the garden's busiest hour, no one noticed it had already begun to empty.", thickness: 33, height: 258, cloth: '#33513f', ink: '#eee7d6', band: '#c9b78b' },
  { id: '1984', spine: 'Nineteen Eighty-Four', title: '1984', author: 'George Orwell', blurb: 'The glass paperweight was the only thing in the room that obeyed no one.', thickness: 36, height: 262, cloth: '#6d4a2f', ink: '#f4ece0', band: '#e8cfa0' },
  { id: 'catcher', spine: 'The Catcher in the Rye', title: '麦田里的守望者', author: 'J. D. Salinger', blurb: "The museum's glass cases never changed. He went back to look whenever he came to the city.", thickness: 29, height: 240, cloth: '#3a4a63', ink: '#eef1f6', band: '#cbb2d6' },
  { id: 'butterfly', spine: 'The Butterfly Lovers', title: '梁祝', author: 'Chinese folklore', blurb: 'The same long road, walked together again and again. Neither said the words aloud.', thickness: 22, height: 268, cloth: '#4a4f3c', ink: '#f0eee2', band: '#b9b48f' },
  { id: 'dawn', spine: 'Dawn Blossoms Plucked at Dusk', title: '朝花夕拾', author: 'Lu Xun', blurb: 'Decades later, childhood returned to the page more clearly than it had been lived.', thickness: 34, height: 244, cloth: '#5a3f6b', ink: '#f1e9f2', band: '#cbb2d6' },
  { id: 'century', spine: 'The Century Trilogy', title: '世纪三部曲', author: 'Ken Follett', blurb: 'In the same war, some talk in drawing rooms. Others dig beneath the earth.', thickness: 44, height: 280, cloth: '#1e4034', ink: '#eaf2ea', band: '#b9b48f' },
  { id: 'condor', spine: 'The Legend of the Condor Heroes', title: '射雕英雄传', author: 'Jin Yong', blurb: 'Seven masters crossed into the desert to teach one slow learner how to fight.', thickness: 42, height: 246, cloth: '#2a2723', ink: '#efece4', band: '#c8a24a' },
];

export const POEMS: PoemItem[] = [
  {
    id: 'dylan',
    title: 'Do not go gentle into that good night',
    displayTitle: 'Do not go gentle.',
    author: 'Dylan Thomas',
    authorUrl: 'https://www.poetryfoundation.org/poets/dylan-thomas',
    form: 'A villanelle',
    year: '1947',
    standfirst: 'A year spent looking, then a shelf of everything worth keeping, and now the poem that says what the looking was for. It is the shortest thing on this page: nineteen lines, one instruction, repeated until it stops being advice.',
    sourceLabel: 'Poetry Foundation',
    sourceUrl: 'https://www.poetryfoundation.org/poems/46569/do-not-go-gentle-into-that-good-night',
    note: 'Kept here because the light was never the reward. Catching it, and not letting go, was the whole instruction.',
    refrains: [
      'Do not go gentle into that good night,',
      'Do not go gentle into that good night.',
      'Rage, rage against the dying of the light.',
    ],
    stanzas: [
      ['Do not go gentle into that good night,', 'Old age should burn and rave at close of day;', 'Rage, rage against the dying of the light.'],
      ['Though wise men at their end know dark is right,', 'Because their words had forked no lightning they', 'Do not go gentle into that good night.'],
      ['Good men, the last wave by, crying how bright', 'Their frail deeds might have danced in a green bay,', 'Rage, rage against the dying of the light.'],
      ['Wild men who caught and sang the sun in flight,', 'And learn, too late, they grieved it on its way,', 'Do not go gentle into that good night.'],
      ['Grave men, near death, who see with blinding sight', 'Blind eyes could blaze like meteors and be gay,', 'Rage, rage against the dying of the light.'],
      ['And you, my father, there on the sad height,', 'Curse, bless, me now with your fierce tears, I pray.', 'Do not go gentle into that good night.', 'Rage, rage against the dying of the light.'],
    ],
  },
  {
    id: 'yeats',
    title: 'When You Are Old',
    displayTitle: 'When You Are Old',
    author: 'William Butler Yeats',
    authorUrl: 'https://www.poetryfoundation.org/poets/william-butler-yeats',
    form: 'Lyric poem',
    year: '1893',
    standfirst: 'An old age imagined beside the fire: a book opened, a remembered face, and the rare love that saw beyond beauty.',
    sourceLabel: 'Poetry Foundation',
    sourceUrl: 'https://www.poetryfoundation.org/poems/43283/when-you-are-old',
    note: 'A quiet invitation to remember the one who loved the pilgrim soul beneath the passing years.',
    refrains: ['But one man loved the pilgrim soul in you,'],
    stanzas: [
      ['When you are old and grey and full of sleep,', 'And nodding by the fire, take down this book,', 'And slowly read, and dream of the soft look', 'Your eyes had once, and of their shadows deep;'],
      ['How many loved your moments of glad grace,', 'And loved your beauty with love false or true,', 'But one man loved the pilgrim soul in you,', 'And loved the sorrows of your changing face;'],
      ['And bending down beside the glowing bars,', 'Murmur, a little sadly, how Love fled', 'And paced upon the mountains overhead', 'And hid his face amid a crowd of stars.'],
    ],
  },
  {
    id: 'dickinson',
    title: 'Nobody knows this little Rose',
    displayTitle: 'Nobody knows this little Rose',
    author: 'Emily Dickinson',
    authorUrl: 'https://www.poetryfoundation.org/poets/emily-dickinson',
    form: 'Lyric poem · Fr11B',
    year: 'c. 1858',
    standfirst: 'A small rose carried from the ways and offered in secret, noticed only by the creatures that might have missed it.',
    sourceLabel: 'Manuscript & Transcription',
    sourceUrl: 'https://dickinsonsbirds.org/project/poems/266',
    note: 'The rose passes briefly through a world of roads, wings, weather and attention.',
    refrains: ['Ah Little Rose – how easy', 'For such as thee to die!'],
    stanzas: [
      ['Nobody knows this little Rose –', 'It might a pilgrim be', 'Did I not take it from the ways', 'And lift it up to thee.'],
      ['Only a Bee will miss it –', 'Only a Butterfly,', 'Hastening from far journey –', 'On it′s breast to lie –'],
      ['Only a Bird will wonder –', 'Only a Breeze will sigh –', 'Ah Little Rose – how easy', 'For such as thee to die!'],
    ],
  },
];

export const PAINTINGS: PaintingItem[] = [
  { id: 'starry-night', title: '星月夜', english: 'The Starry Night', artist: 'Vincent van Gogh', artistShort: 'Van Gogh', year: '1889', medium: 'Oil on canvas', museum: 'MoMA · New York', museumUrl: 'https://www.moma.org/collection/works/79802', note: '天空卷起蓝色的漩涡，柏树向上生长，小镇却安静地睡着。让目光沿着笔触，走进这片仍在流动的夜。', alt: '梵高《星月夜》：旋转的蓝色夜空、明亮星月、深色柏树与山间小镇。' },
  { id: 'pearl-earring', title: '戴珍珠耳环的少女', english: 'Girl with a Pearl Earring', artist: 'Johannes Vermeer', artistShort: 'Vermeer', year: 'c. 1665', medium: 'Oil on canvas', museum: 'Mauritshuis · The Hague', museumUrl: 'https://www.mauritshuis.nl/en/our-collection/artworks/670-girl-with-a-pearl-earring/', note: '从深色背景里转过身来，蓝色头巾、微启的嘴唇和耳畔的一点光，让一个瞬间有了长久的回声。', alt: '维米尔《戴珍珠耳环的少女》：戴蓝黄头巾的少女回望，耳畔珍珠映出亮光。' },
  { id: 'mona-lisa', title: '蒙娜丽莎', english: 'Mona Lisa', artist: 'Leonardo da Vinci', artistShort: 'Da Vinci', year: 'c. 1503–1519', medium: 'Oil on wood', museum: 'Musée du Louvre · Paris', museumUrl: 'https://collections.louvre.fr/en/ark:/53355/cl010062370', note: '微笑的边缘轻轻融入阴影。越过交叠的双手，远处山水也像面容一样，在朦胧中缓慢浮现。', alt: '达·芬奇《蒙娜丽莎》：双手交叠、面带微笑的女子，身后是朦胧的山水。' },
  { id: 'water-lilies', title: '睡莲', english: 'Water Lilies', artist: 'Claude Monet', artistShort: 'Monet', year: '1906', medium: 'Oil on canvas', museum: 'Art Institute of Chicago', museumUrl: 'https://www.artic.edu/artworks/16568/water-lilies', note: '没有天际线，只有水面、倒影与浮着的花。目光不必寻找中心，停在哪里，哪里就是一小片花园。', alt: '莫奈1906年《睡莲》：池塘水面上的睡莲，与蓝绿、紫色交织的倒影。' },
  { id: 'the-kiss', title: '吻', english: 'The Kiss', artist: 'Gustav Klimt', artistShort: 'Klimt', year: 'c. 1907–1909', medium: 'Oil and metal leaf on canvas', museum: 'Belvedere · Vienna', museumUrl: 'https://sammlung.belvedere.at/objects/6678/der-kuss-liebespaar', note: '金色纹样包裹着拥抱的人，花草停在脚边。繁复的装饰之中，两张面孔与一双手显得格外柔软。', alt: '克里姆特《吻》：身披金色纹样长袍的一对恋人在花地上拥抱。' },
  { id: 'birth-of-venus', title: '维纳斯的诞生', english: 'The Birth of Venus', artist: 'Sandro Botticelli', artistShort: 'Botticelli', year: 'c. 1485', medium: 'Tempera on canvas', museum: 'Uffizi Galleries · Florence', museumUrl: 'https://www.uffizi.it/en/artworks/birth-of-venus', note: '海风推来贝壳，也吹动玫瑰、长发与衣褶。细长的线条，把整幅画连成一次轻盈的呼吸。', alt: '波提切利《维纳斯的诞生》：维纳斯立于海边贝壳上，风神与持花袍的女子分列两侧。' },
  { id: 'impression-sunrise', title: '印象·日出', english: 'Impression, Sunrise', artist: 'Claude Monet', artistShort: 'Monet', year: '1872', medium: 'Oil on canvas', museum: 'Musée Marmottan Monet · Paris', museumUrl: 'https://www.marmottan.fr/notice/4014/', note: '港口隐在蓝灰色晨雾里，一轮橙红的太阳把倒影留在水上。几笔颜色，便让清晨有了温度。', alt: '莫奈《印象·日出》：晨雾中的港口与小船，橙红太阳在蓝灰色水面上留下倒影。' },
  { id: 'la-grande-jatte', title: '大碗岛的星期日下午', english: 'A Sunday on La Grande Jatte', artist: 'Georges Seurat', artistShort: 'Seurat', year: '1884–1886', medium: 'Oil on canvas', museum: 'Art Institute of Chicago', museumUrl: 'https://www.artic.edu/artworks/27992/a-sunday-on-la-grande-jatte-1884', note: '人群、树荫和帆船停在河岸的午后。凑近是细密的色点，退后一步，光线又把它们重新织在一起。', alt: '修拉《大碗岛的星期日下午》：穿着礼服的人们在塞纳河岸的草地和树荫间休憩。' },
  { id: 'the-scream', title: '呐喊', english: 'The Scream', artist: 'Edvard Munch', artistShort: 'Munch', year: '1893', medium: 'Tempera and oil crayon on cardboard', museum: 'National Museum · Oslo', museumUrl: 'https://www.nasjonalmuseet.no/en/collection/object/NG.M.00939', note: '桥的直线通向远处，天空与海湾却弯曲、震荡。捂住双耳的身影，让看不见的声音充满了画面。', alt: '蒙克1893年《呐喊》：捂住双耳的人站在桥上，身后是波动的红色天空和蓝色海湾。' },
  { id: 'las-meninas', title: '宫娥', english: 'Las Meninas', artist: 'Diego Velázquez', artistShort: 'Velázquez', year: '1656', medium: 'Oil on canvas', museum: 'Museo del Prado · Madrid', museumUrl: 'https://www.museodelprado.es/en/the-collection/art-work/las-meninas/9fdc7800-9ade-48b0-ab8b-edee94ea877f', note: '公主站在光里，画家从画布旁望来，镜中还有两个人。顺着这些视线，观看者也悄悄成为了画中的一员。', alt: '委拉斯凯兹《宫娥》：公主与侍女、左侧作画的画家，以及后墙镜中映出的国王和王后。' },
  { id: 'night-watch', title: '夜巡', english: 'The Night Watch', artist: 'Rembrandt van Rijn', artistShort: 'Rembrandt', year: '1642', medium: 'Oil on canvas', museum: 'Rijksmuseum · Amsterdam', museumUrl: 'https://www.rijksmuseum.nl/en/collection/object/The-Night-Watch--3137deb45cd7765f9a76084a16c99544', note: '队伍正要出发，手势、长矛与鼓声仿佛接连响起。光从人群中挑出面孔，让群像有了舞台般的节奏。', alt: '伦勃朗《夜巡》：由黑衣队长和黄衣副官率领的民兵队伍，明暗交错的人群正准备出发。' },
  { id: 'bedroom-arles', title: '阿尔勒的卧室', english: 'The Bedroom', artist: 'Vincent van Gogh', artistShort: 'Van Gogh', year: '1888', medium: 'Oil on canvas', museum: 'Van Gogh Museum · Amsterdam', museumUrl: 'https://www.vangoghmuseum.nl/en/collection/s0047V1962', note: '蓝墙、木床、两把椅子，几件日常物品构成整个世界。倾斜的透视，让安静的房间也带着鲜明的性格。', alt: '梵高1888年《阿尔勒的卧室》：蓝色墙壁、黄色木床、两把椅子，以及墙上的肖像画。' },
].map((w) => ({
  ...w,
  image: `/assets/paintings/${w.id}.webp?v=1`,
  thumbnail: `/assets/paintings/${w.id}-thumb.webp?v=1`,
}));

export const SPORT_TEAMS: SportTeam[] = [
  {
    id: 'basketball',
    sportLabel: 'Basketball',
    club: 'San Antonio Spurs',
    league: 'NBA',
    honours: 'Five NBA championships',
    honoursHighlight: '1999–2014',
    sourceLabel: 'nba.com/spurs',
    sourceUrl: 'https://www.nba.com/spurs',
    image: '/sport/spurs.webp',
    crest: '/logos/spurs.svg',
    alt: 'San Antonio Spurs celebrating with the championship trophy',
    objectPosition: '50% 34%',
    accent: '#C4CBD4',
  },
  {
    id: 'football',
    sportLabel: 'Football',
    club: 'Manchester City',
    league: 'Premier League',
    honours: 'Ten English league titles',
    honoursHighlight: 'the treble in 2023',
    sourceLabel: 'mancity.com',
    sourceUrl: 'https://www.mancity.com',
    image: '/sport/mancity.webp',
    crest: '/logos/mancity.svg',
    alt: 'Manchester City supporters raising their arms in the stands',
    objectPosition: '50% 55%',
    accent: '#78B6E4',
  },
  {
    id: 'formula-1',
    sportLabel: 'Formula 1',
    club: 'McLaren Racing',
    league: 'Formula 1',
    honours: 'Ten constructors titles',
    honoursHighlight: 'back-to-back in 2024–2025',
    sourceLabel: 'mclaren.com/racing',
    sourceUrl: 'https://www.mclaren.com/racing/',
    image: '/sport/mclaren.webp',
    crest: '/logos/mclaren.svg',
    alt: 'McLaren celebrating the 2025 constructors championship in the garage',
    objectPosition: '50% 50%',
    accent: '#F08833',
  },
  {
    id: 'american-football',
    sportLabel: 'American Football',
    club: 'Baltimore Ravens',
    league: 'NFL',
    honours: 'Two Super Bowl titles',
    honoursHighlight: '2001 and 2013',
    sourceLabel: 'baltimoreravens.com',
    sourceUrl: 'https://www.baltimoreravens.com',
    image: '/sport/ravens.webp',
    crest: '/logos/ravens.svg',
    alt: 'Baltimore Ravens players celebrating in the end zone',
    objectPosition: '62% 45%',
    accent: '#9E82D6',
  },
  {
    id: 'esports',
    sportLabel: 'Esports',
    club: 'Team Spirit',
    league: 'CS2',
    honours: 'Three premier tournament titles',
    honoursHighlight: '2024–2025',
    sourceLabel: 'teamspirit.gg',
    sourceUrl: 'https://teamspirit.gg',
    image: '/sport/spirit.webp',
    crest: '/logos/spirit.svg',
    alt: 'Team Spirit player donk watching his screen at the tournament desk',
    objectPosition: '58% 58%',
    accent: '#D4A853',
  },
];

export const SERIES: SeriesItem[] = [
  { id: 'series-01', douban: '1864810', poster: '/posters/1864810.jpg', title: '红楼梦', years: '1987', seasons: '36 episodes', category: 'CLASSICS', quote: 'Those who cherish an individual heart are born into a world that enters marriage, kinship and dignity into the family ledger.' },
  { id: 'series-02', douban: '2156663', poster: '/posters/2156663.jpg', title: '西游记', years: '1986', seasons: '25 episodes', category: 'CLASSICS', quote: 'The journey defeats demons and personal obsessions alike. A free heart must learn to travel with responsibility.' },
  { id: 'series-03', douban: '33447642', poster: '/posters/33447642.jpg', title: '沉默的真相', years: '2020', seasons: '12 episodes', category: 'CRIME & MYSTERY', quote: 'When justice costs good people their whole lives, the arrival of truth becomes a question no silent witness can escape.' },
  { id: 'series-04', douban: '33404425', poster: '/posters/33404425.jpg', title: '隐秘的角落', years: '2020', seasons: '12 episodes', category: 'CRIME & MYSTERY', quote: 'A child learns that lies can win love, then discovers that telling the truth may leave no one willing to stay.' },
  { id: 'series-05', douban: '35588177', poster: '/posters/35588177.jpg', title: '漫长的季节', years: '2023', seasons: '12 episodes', category: 'CRIME & MYSTERY', quote: 'An era takes his work and his family. A father remains trapped in guilt until a late truth teaches him to live forward.' },
  { id: 'series-06', douban: '26883064', poster: '/posters/26883064.jpg', title: '白夜追凶', years: '2017', seasons: '32 episodes', category: 'CRIME & MYSTERY', quote: 'Blood makes two men live for each other. The search for truth puts both family loyalty and self-preservation on trial.' },
  { id: 'series-07', douban: '2373195', poster: '/posters/2373195.jpg', title: 'Breaking Bad', years: '2008-2013', seasons: '5 seasons', category: 'CRIME & MYSTERY', quote: "He explains every transgression with his family's future, until each loss reveals that his own pride was the real need." },
  { id: 'series-08', douban: '25726259', poster: '/posters/25726259.jpg', title: 'Better Call Saul', years: '2015-2022', seasons: '6 seasons', category: 'CRIME & MYSTERY', quote: 'Written off by those closest to him, he turns prejudice into an identity, then reclaims his name by accepting responsibility.' },
  { id: 'series-09', douban: '10748120', poster: '/posters/10748120.jpg', title: 'True Detective', years: '2014-2024', seasons: '4 seasons', category: 'CRIME & MYSTERY', quote: 'Seeing human corruption does not excuse anyone from responsibility. Those who question evil must admit they still want some light.' },
  { id: 'series-10', douban: '26310143', poster: '/posters/26310143.jpg', title: '信号', years: '2016', seasons: '16 episodes', category: 'CRIME & MYSTERY', quote: 'A cry from the past reaches the present. The chance to mend regret also brings responsibility for another altered fate.' },
  { id: 'series-11', douban: '26934346', poster: '/posters/26934346.jpg', title: '秘密森林', years: '2017-2020', seasons: '2 seasons', category: 'CRIME & MYSTERY', quote: 'Refusing to let relationships explain away evidence, he must learn trust inside a system that uses loyalty as cover.' },
  { id: 'series-12', douban: '25754848', poster: '/posters/25754848.jpg', title: '琅琊榜', years: '2015', seasons: '54 episodes', category: 'POWER & HISTORY', quote: "He returns with a revenger's methods, hoping to preserve an honest person's faith in order. Every calculation carries a cost." },
  { id: 'series-13', douban: '25853071', poster: '/posters/25853071.jpg', title: '庆余年', years: '2019-2024', seasons: '3 seasons', category: 'POWER & HISTORY', quote: 'He brings equality into a world of power. The hardest test comes after winning: refusing to turn people into bargaining chips.' },
  { id: 'series-14', douban: '7054120', poster: '/posters/7054120.jpg', title: '黑镜', years: '2011-2023', seasons: '6 seasons', category: 'SCI-FI & FANTASY', quote: 'Technology tends to every desire, dressing control, punishment and loneliness as freely chosen experiences.' },
  { id: 'series-15', douban: '26359270', poster: '/posters/26359270.jpg', title: 'Stranger Things', years: '2016-2025', seasons: '5 seasons', category: 'SCI-FI & FANTASY', quote: 'Children treated as outsiders resist fear through trust, preserving the closeness that growing up has not yet taken.' },
  { id: 'series-16', douban: '23011215', poster: '/posters/23011215.jpg', title: 'Sense8', years: '2015-2018', seasons: '2 seasons', category: 'SCI-FI & FANTASY', quote: "When another's pain can pass through your body, difference stops being a reason for isolation. Intimacy becomes resistance." },
  { id: 'series-17', douban: '32579283', poster: '/posters/32579283.jpg', title: "The Queen's Gambit", years: '2020', seasons: '7 episodes', category: 'SCI-FI & FANTASY', quote: 'She sharpens solitude into a gift for calculation, but must accept help before every approach stops feeling like weakness.' },
  { id: 'series-18', douban: '25698722', poster: '/posters/25698722.jpg', title: '来自星星的你', years: '2013', seasons: '21 episodes', category: 'SCI-FI & FANTASY', quote: 'A long life has taught him to watch from a distance. Love gives eternity a price and a brief life irreplaceable value.' },
  { id: 'series-19', douban: '24702659', poster: '/posters/24702659.jpg', title: '听见你的声音', years: '2013', seasons: '18 episodes', category: 'SCI-FI & FANTASY', quote: 'Hearing a heart is not the same as understanding a person. When revenge seems justified, refusing hatred is the hardest choice.' },
  { id: 'series-20', douban: '26761935', poster: '/posters/26761935.jpg', title: '孤单又灿烂的神：鬼怪', years: '2016', seasons: '16 episodes', category: 'SCI-FI & FANTASY', quote: 'Immortality turns loss into endless punishment. Love makes him want to live again, and finally brave enough to face an ending.' },
  { id: 'series-21', douban: '26727298', poster: '/posters/26727298.jpg', title: 'W-两个世界', years: '2016', seasons: '16 episodes', category: 'SCI-FI & FANTASY', quote: "When characters discover someone else writes their lives, love and free will ask who has the right to decide a real life's ending." },
  { id: 'series-22', douban: '26887064', poster: '/posters/26887064.jpg', title: '当你沉睡时', years: '2017', seasons: '32 episodes', category: 'SCI-FI & FANTASY', quote: 'Foreseeing disaster removes ignorance as an excuse. Each changed future begins with the willingness to trust another person.' },
  { id: 'series-23', douban: '3703650', poster: '/posters/3703650.jpg', title: 'The Boys', years: '2019-2024', seasons: '4 seasons', category: 'DARK SATIRE', quote: 'When heroes become products, rescue becomes an advertisement for power. Their opponents approach the very thing they hate.' },
  { id: 'series-24', douban: '6037429', poster: '/posters/6037429.jpg', title: 'House of Cards', years: '2013-2018', seasons: '6 seasons', category: 'DARK SATIRE', quote: 'Power makes trust a tool. Two people who know each other best hold on through an ambition that may consume them both.' },
  { id: 'series-25', douban: '26813224', poster: '/posters/26813224.jpg', title: 'Succession', years: '2018-2023', seasons: '4 seasons', category: 'DARK SATIRE', quote: 'They can buy the world, yet still prize one word of approval from their father. Their rivalry inherits his cruelty.' },
  { id: 'series-26', douban: '1393859', poster: '/posters/1393859.jpg', title: 'Friends', years: '1994-2004', seasons: '10 seasons', category: 'FAMILY & LIFE', quote: 'While learning to build families, they keep a place where failure can be admitted. Friendship becomes a family beyond blood.' },
  { id: 'series-27', douban: '3754382', poster: '/posters/3754382.jpg', title: 'Modern Family', years: '2009-2020', seasons: '11 seasons', category: 'FAMILY & LIFE', quote: 'Family keeps changing shape. Even the stubborn must practice giving way, so love becomes more than a demand made on their terms.' },
  { id: 'series-28', douban: '4729738', poster: '/posters/4729738.jpg', title: 'Shameless', years: '2011-2021', seasons: '11 seasons', category: 'FAMILY & LIFE', quote: "Poverty makes them rely on one another, while family claims each person's future. Both leaving and staying carry a debt." },
  { id: 'series-29', douban: '26302614', poster: '/posters/26302614.jpg', title: '请回答1988', years: '2015', seasons: '20 episodes', category: 'FAMILY & LIFE', quote: "Growing up brings choices and takes familiar company away. Home's warmth is often understood only after leaving." },
  { id: 'series-30', douban: '27602137', poster: '/posters/27602137.jpg', title: '我的大叔', years: '2018', seasons: '16 episodes', category: 'FAMILY & LIFE', quote: "They recognize the wounds each would rather hide. Understanding becomes permission to keep one's dignity, rather than rescue from above." },
  { id: 'series-31', douban: '30464551', poster: '/posters/30464551.jpg', title: '浪漫的体质', years: '2019', seasons: '16 episodes', category: 'FAMILY & LIFE', quote: 'Those who write love stories cannot write their own lives so neatly. Laughter and friends slowly make room for loss and disorder.' },
  { id: 'series-32', douban: '34660401', poster: '/posters/34660401.jpg', title: '棒球大联盟', years: '2019', seasons: '16 episodes', category: 'FAMILY & LIFE', quote: 'Changing a team used to losing means undoing interests held together by sentiment, and trusting people treated as numbers again.' },
  { id: 'series-33', douban: '33464863', poster: '/posters/33464863.jpg', title: '机智医生生活', years: '2020-2021', seasons: '2 seasons', category: 'FAMILY & LIFE', quote: 'Doctors can treat pain with practiced hands, but cannot decide the weight of goodbye. Friends care for them as they care for others.' },
  { id: 'series-34', douban: '25831874', poster: '/posters/25831874.jpg', title: '太阳的后裔', years: '2016', seasons: '16 episodes', category: 'ROMANCE & MELO', quote: 'Both protect life, yet must accept different duties. Their love travels alongside danger and disagreement.' },
  { id: 'series-35', douban: '34861170', poster: '/posters/34861170.jpg', title: '虽然是精神病但没关系', years: '2020', seasons: '16 episodes', category: 'ROMANCE & MELO', quote: 'One hides desire by caring for others; one hides loneliness by hurting them. Closeness lets both admit they need care too.' },
  { id: 'series-36', douban: '35402776', poster: '/posters/35402776.jpg', title: '那年，我们的夏天', years: '2021', seasons: '16 episodes', category: 'ROMANCE & MELO', quote: 'Meeting again reveals the old misunderstanding: love was there, but neither dared entrust their insecurity to the other.' },
];

export const FILMS: FilmItem[] = [
  { id: 'film-01', douban: '1291841', poster: '/posters/1291841.jpg', title: 'The Godfather', director: 'Francis Ford Coppola', year: '1972', genre: 'CRIME & NOIR', quote: 'He takes power to protect his family, then turns home into a place no one can freely leave.' },
  { id: 'film-02', douban: '1291832', poster: '/posters/1291832.jpg', title: 'Pulp Fiction', director: 'Quentin Tarantino', year: '1994', genre: 'CRIME & NOIR', quote: 'Violence makes people interchangeable. One accidental survival opens the question of living differently.' },
  { id: 'film-03', douban: '1292348', poster: '/posters/1292348.jpg', title: 'L.A. Confidential', director: 'Curtis Hanson', year: '1997', genre: 'CRIME & NOIR', quote: 'The badge conceals desire, yet makes three flawed men pay their own price for justice.' },
  { id: 'film-04', douban: '1307914', poster: '/posters/1307914.jpg', title: '无间道', director: 'Andrew Lau / Alan Mak', year: '2002', genre: 'CRIME & NOIR', quote: 'Identities can change hands; conscience cannot. The deepest punishment is living without proof that you are good.' },
  { id: 'film-05', douban: '1300299', poster: '/posters/1300299.jpg', title: 'Memories of Murder', director: 'Bong Joon-ho', year: '2003', genre: 'CRIME & NOIR', quote: 'When violence reaches an answer before evidence does, the hunters become suspects their era cannot clear.' },
  { id: 'film-06', douban: '1291580', poster: '/posters/1291580.jpg', title: 'Kill Bill', director: 'Quentin Tarantino', year: '2003', genre: 'CRIME & NOIR', quote: 'Revenge gives the dispossessed their names back. Once the past is dead, who is left to live for?' },
  { id: 'film-07', douban: '1309069', poster: '/posters/1309069.jpg', title: 'Batman Begins', director: 'Christopher Nolan', year: '2005', genre: 'CRIME & NOIR', quote: 'Before making fear a symbol, he must separate the pleasure of punishment from the duty of protection.' },
  { id: 'film-08', douban: '1857099', poster: '/posters/1857099.jpg', title: 'No Country for Old Men', director: 'Ethan Coen / Joel Coen', year: '2007', genre: 'CRIME & NOIR', quote: 'He believes the world is getting worse. Harder to admit: violence never promised to obey his familiar rules.' },
  { id: 'film-09', douban: '1851857', poster: '/posters/1851857.jpg', title: 'The Dark Knight', director: 'Christopher Nolan', year: '2008', genre: 'CRIME & NOIR', quote: 'When a city needs a spotless hero, can its protector still afford to tell the truth?' },
  { id: 'film-10', douban: '2334904', poster: '/posters/2334904.jpg', title: 'Shutter Island', director: 'Martin Scorsese', year: '2010', genre: 'CRIME & NOIR', quote: 'He builds a world to keep believing he is good. Waking means dismantling his only shelter.' },
  { id: 'film-11', douban: '3395373', poster: '/posters/3395373.jpg', title: 'The Dark Knight Rises', director: 'Christopher Nolan', year: '2012', genre: 'CRIME & NOIR', quote: 'Being a savior has made him forget how to live. Returning means letting both the city and himself outgrow the myth.' },
  { id: 'film-12', douban: '1292233', poster: '/posters/1292233.jpg', title: 'A Clockwork Orange', director: 'Stanley Kubrick', year: '1971', genre: 'SCI-FI', quote: 'If a man is stripped of the ability to do wrong, has he become good, or lost his last human freedom?' },
  { id: 'film-13', douban: '1291843', poster: '/posters/1291843.jpg', title: 'The Matrix', director: 'Lana Wachowski / Lilly Wachowski', year: '1999', genre: 'SCI-FI', quote: 'Comfortable illusion asks you to surrender choice. Freedom lets you see truths you may not wish to bear.' },
  { id: 'film-14', douban: '3541415', poster: '/posters/3541415.jpg', title: 'Inception', director: 'Christopher Nolan', year: '2010', genre: 'SCI-FI', quote: 'He can enter other minds but cannot release his own past. Guilt mistaken for love makes the strongest prison.' },
  { id: 'film-15', douban: '1889243', poster: '/posters/1889243.jpg', title: 'Interstellar', director: 'Christopher Nolan', year: '2014', genre: 'SCI-FI', quote: "He leaves his daughter for humanity's future. Only a father's private longing can guide him home." },
  { id: 'film-16', douban: '1292063', poster: '/posters/1292063.jpg', title: 'Life Is Beautiful', director: 'Roberto Benigni', year: '1997', genre: 'DRAMA', quote: "A father makes a lie his last act of protection, preserving a child's ability to believe in a world without dignity." },
  { id: 'film-17', douban: '1300374', poster: '/posters/1300374.jpg', title: 'The Green Mile', director: 'Frank Darabont', year: '1999', genre: 'DRAMA', quote: 'The law can carry out an execution on time. It cannot lift the weight of destroying goodness from those who do it.' },
  { id: 'film-18', douban: '6879185', poster: '/posters/6879185.jpg', title: '12 Years a Slave', director: 'Steve McQueen', year: '2013', genre: 'DRAMA', quote: 'When society writes a man down as property, his struggle is for home and the right to define himself.' },
  { id: 'film-19', douban: '25773932', poster: '/posters/25773932.jpg', title: 'Whiplash', director: 'Damien Chazelle', year: '2014', genre: 'DRAMA', quote: 'He accepts destruction as the price of greatness. The louder the applause, the harder it is to tell who won.' },
  { id: 'film-20', douban: '27119724', poster: '/posters/27119724.jpg', title: 'Joker', director: 'Todd Phillips', year: '2019', genre: 'DRAMA', quote: 'A man desperate to be seen finally gets attention, as real suffering becomes a violent symbol for public consumption.' },
  { id: 'film-21', douban: '27010768', poster: '/posters/27010768.jpg', title: 'Parasite', director: 'Bong Joon-ho', year: '2019', genre: 'DRAMA', quote: 'Class keeps people apart, then makes those closest compete. Even sympathy carries the scent of looking down.' },
  { id: 'film-22', douban: '35593344', poster: '/posters/35593344.jpg', title: 'Oppenheimer', director: 'Christopher Nolan', year: '2023', genre: 'DRAMA', quote: 'He can calculate how destruction happens, but not how much responsibility its inventor must bear.' },
  { id: 'film-23', douban: '1294371', poster: '/posters/1294371.jpg', title: 'Modern Times', director: 'Charlie Chaplin', year: '1936', genre: 'ROMANCE & CLASSIC', quote: 'Machines promise efficiency; even breathing becomes a fault. Two people without a place still try to make room for each other.' },
  { id: 'film-24', douban: '1296339', poster: '/posters/1296339.jpg', title: 'The Before Trilogy', director: 'Richard Linklater', year: '1995-2013', genre: 'ROMANCE & CLASSIC', quote: 'Chance can bring two people together. Staying means choosing, again and again, the person everyday life has worn down.' },
];

export const GAMES: GameItem[] = [
  { id: 'cs', rank: 1, title: 'Counter-Strike', release: '1999', releaseDate: '1999', releaseKind: 'series', image: '/covers/counter-strike.webp', alt: 'Counter-Strike cover' },
  { id: 'nba2k', rank: 2, title: 'NBA 2K', release: '1999', releaseDate: '1999', releaseKind: 'series', image: '/covers/nba-2k.webp', alt: 'NBA 2K cover' },
  { id: 'fm', rank: 3, title: 'Football Manager', release: '2004', releaseDate: '2004', releaseKind: 'series', image: '/covers/football-manager.webp', alt: 'Football Manager cover' },
  { id: 'gta5', rank: 4, title: 'Grand Theft Auto V', release: 'September 17, 2013', releaseDate: '2013-09-17', releaseKind: 'single', image: '/covers/gta5.webp', alt: 'Grand Theft Auto V cover' },
  { id: 'human-fall-flat', rank: 5, title: 'Human Fall Flat', release: 'July 22, 2016', releaseDate: '2016-07-22', releaseKind: 'single', image: '/covers/human-fall-flat.webp', alt: 'Human Fall Flat cover' },
  { id: 'detroit', rank: 6, title: 'Detroit: Become Human', release: 'May 25, 2018', releaseDate: '2018-05-25', releaseKind: 'single', image: '/covers/detroit.webp', alt: 'Detroit Become Human cover' },
  { id: 'forza', rank: 7, title: 'Forza Horizon 4', release: 'October 2, 2018', releaseDate: '2018-10-02', releaseKind: 'single', image: '/covers/forza-horizon-4.webp', alt: 'Forza Horizon 4 cover' },
  { id: 'rdr2', rank: 8, title: 'Red Dead Redemption 2', release: 'October 26, 2018', releaseDate: '2018-10-26', releaseKind: 'single', image: '/covers/rdr2.webp', alt: 'Red Dead Redemption 2 cover' },
  { id: 'hitman-2', rank: 9, title: 'Hitman 2', release: 'November 13, 2018', releaseDate: '2018-11-13', releaseKind: 'single', image: '/covers/hitman.webp', alt: 'Hitman 2 cover' },
  { id: 'bfv', rank: 10, title: 'Battlefield V', release: 'November 20, 2018', releaseDate: '2018-11-20', releaseKind: 'single', image: '/covers/battlefield-v.webp', alt: 'Battlefield V cover' },
  { id: 'sekiro', rank: 11, title: 'Sekiro', release: 'March 22, 2019', releaseDate: '2019-03-22', releaseKind: 'single', image: '/covers/sekiro.webp', alt: 'Sekiro: Shadows Die Twice cover' },
  { id: 'cyberpunk', rank: 12, title: 'Cyberpunk 2077', release: 'December 10, 2020', releaseDate: '2020-12-10', releaseKind: 'single', image: '/covers/cyberpunk.webp', alt: 'Cyberpunk 2077 cover' },
  { id: 'it-takes-two', rank: 13, title: 'It Takes Two', release: 'March 26, 2021', releaseDate: '2021-03-26', releaseKind: 'single', image: '/covers/it%20takes%20two.webp', alt: 'It Takes Two cover' },
  { id: 'dying-light-2', rank: 14, title: 'Dying Light 2', release: 'February 4, 2022', releaseDate: '2022-02-04', releaseKind: 'single', image: '/covers/dying%20light.webp', alt: 'Dying Light 2 Stay Human cover' },
  { id: 'elden-ring', rank: 15, title: 'Elden Ring', release: 'February 25, 2022', releaseDate: '2022-02-25', releaseKind: 'single', image: '/covers/elden-ring.webp', alt: 'Elden Ring cover' },
  { id: 'bg3', rank: 16, title: "Baldur's Gate 3", release: 'August 3, 2023', releaseDate: '2023-08-03', releaseKind: 'single', image: '/covers/baldurs-gate-3.webp', alt: "Baldur's Gate 3 cover" },
  { id: 'wukong', rank: 17, title: 'Black Myth: Wukong', release: 'August 20, 2024', releaseDate: '2024-08-20', releaseKind: 'single', image: '/covers/black-myth-wukong.webp', alt: 'Black Myth: Wukong cover' },
  { id: 'fc26', rank: 18, title: 'EA SPORTS FC 26', release: 'September 26, 2025', releaseDate: '2025-09-26', releaseKind: 'single', image: '/covers/fc26.webp', alt: 'EA SPORTS FC 26 cover' },
];

export const APPS: AppExhibit[] = [
  {
    id: 'n1ghtscore',
    name: 'N1ghtScore',
    kicker: 'Android · 体育赛程与比分',
    platform: 'Android 9+ · 手机与平板三栏工作台',
    tagline: '按北京时间看足球、NBA、NFL、F1 与 CS2。查比分、阵容与榜单，将比赛直接写入系统日历。',
    description: '面向 Android 手机和平板的原生赛程与比赛资料应用。整合 ESPN、Jolpica F1、5EPlay 与 Valve 官方 VRS 排名，支持开赛前提醒、完场比分通知以及独立的 MyScore 网页版。',
    image: '/assets/apps/n1ghtscore-phone.webp',
    imageAlt: 'N1ghtScore Android 赛程与比分卡片界面',
    detailHref: '/apps/n1ghtscore/',
    githubHref: 'https://github.com/n1ght-ow/myscore',
    releaseHref: 'https://github.com/n1ght-ow/myscore/releases/latest',
    webHref: '/myscore/',
    highlights: [
      { title: '五大项目全覆盖', detail: '英超、欧冠、足总杯、NBA、NFL、F1 与 CS2 一线赛事同屏追踪。' },
      { title: '榜单与赛事签表', detail: '赛季积分榜、Valve VRS 区域榜，以及瑞士轮 / 双败 / 单败赛制签表。' },
      { title: '系统日历与完场通知', detail: '单场一键订阅写入日历，改期自动同步，完场后推送最终比分。' },
    ],
    specs: [
      { label: '包名', value: 'cn.myscore.app' },
      { label: '系统要求', value: 'Android 9+ (API 28)' },
      { label: '时区基准', value: 'Asia/Shanghai' },
    ],
  },
  {
    id: 'n1ghtkey',
    name: 'N1ghtKey',
    kicker: 'Android · 中文优先输入法',
    platform: 'Android 8+ · 本机词库与可选 AI 工具栏',
    tagline: '用拼音、英文和诗词候选写字，用手势移动光标与编辑。日常输入完全在本地完成。',
    description: '把中英混输、诗词首字母联想、空格滑动光标、剪贴板置顶短语，以及按需触发的 DeepSeek 询问、翻译与润色放进同一块克制、高响应的键盘。',
    image: '/assets/apps/n1ghtkey-phone.webp',
    imageAlt: 'N1ghtKey Android 中文拼音键盘与设置界面',
    detailHref: '/apps/n1ghtkey/',
    githubHref: 'https://github.com/n1ght-ow/myboard',
    releaseHref: 'https://github.com/n1ght-ow/myboard/releases/latest',
    highlights: [
      { title: '拼音、英文与诗词', detail: '全拼、简拼、中英混输与唐诗宋词名句首字母候选共用同一流畅流程。' },
      { title: '手势与剪贴板', detail: '空格左右滑动定位光标、退格上滑清空可撤回，支持 12 条置顶短语。' },
      { title: '可选键盘内 AI', detail: '自带密钥后可主动触发询问、翻译与多语气润色，密码框自动隔离保护。' },
    ],
    specs: [
      { label: '包名', value: 'dev.cheng.keyboard' },
      { label: '系统要求', value: 'Android 8+ (API 26)' },
      { label: '开源许可', value: 'GPL-3.0' },
    ],
  },
];

const LOCAL_SITE_KEYS = [
  'src',
  'full',
  'original',
  'image',
  'thumbnail',
  'poster',
  'crest',
  'href',
  'detailHref',
  'webHref',
] as const;

for (const items of [
  PORTAL_ENTRIES,
  PHOTOS,
  BOOKS,
  POEMS,
  PAINTINGS,
  SPORT_TEAMS,
  SERIES,
  FILMS,
  GAMES,
  APPS,
]) {
  for (const item of items as unknown as Array<Record<string, unknown>>) {
    for (const key of LOCAL_SITE_KEYS) {
      const value = item[key];
      if (
        typeof value === 'string' &&
        value.startsWith('/') &&
        !value.startsWith('//')
      ) {
        item[key] = value.slice(1);
      }
    }
  }
}
