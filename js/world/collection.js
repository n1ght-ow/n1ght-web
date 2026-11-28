/* The world collection joins the existing catalogue globals with the three
   catalogue sections that currently live in the page markup. */

const SPACES = [
  {
    id: "photo",
    title: "光的温室",
    english: "Photography",
    description: "四十六帧从日常折返的光，依次经过花期、地平线、城市、夜色、山川与冬雪。",
    interaction: "选择一张照片，查看大图、章节与原始题注。"
  },
  {
    id: "books",
    title: "林间书阁",
    english: "Books",
    description: "十六本书架上留下的作品，记录故事、时间与仍在生长的私人阅读。",
    interaction: "取下一本书，阅读作者、书名与藏书笔记。"
  },
  {
    id: "poems",
    title: "月下诗庭",
    english: "Poems",
    description: "三首诗在夜色里留出停顿，完整保留每一节原文与来源。",
    interaction: "翻开诗页，逐节阅读原文并访问原始来源。"
  },
  {
    id: "paintings",
    title: "白昼画廊",
    english: "Paintings",
    description: "十二幅画作在白昼中展开，从星空、海风、人物到城市与房间。",
    interaction: "走近一幅画，查看作者、年代、馆藏与作品说明。"
  },
  {
    id: "sport",
    title: "绿茵剧场",
    english: "Sport",
    description: "五个真实球队与赛事席位，保留现场照片、队徽、荣誉和官方外链。",
    interaction: "选择一项运动记忆，查看原始现场与官方站点。"
  },
  {
    id: "series",
    title: "叙事之塔",
    english: "Series",
    description: "三十六部剧集沿楼层展开，收录年份、季数、集数与作品题记。",
    interaction: "选择一部剧集，查看海报、播出信息与豆瓣页面。"
  },
  {
    id: "films",
    title: "星光放映场",
    english: "Films",
    description: "二十四部电影在银幕间轮转，保存导演、年份、类型与作品题记。",
    interaction: "选择一部电影，查看海报、主创信息与豆瓣页面。"
  },
  {
    id: "games",
    title: "异境游乐所",
    english: "Games",
    description: "十八款游戏按真实发行时间陈列，封面、原名与发行信息全部保留。",
    interaction: "选择一张封面，查看游戏名称与发行日期。"
  },
  {
    id: "curate",
    title: "我的小展览",
    english: "Collection",
    description: "从八类藏品中挑选最多七件作品，组成一张可以保存和导出的私人展览。",
    interaction: "选择藏品、调整顺序、填写标题，并导出 PNG 海报。"
  }
];

/* These rows are transcribed from HEAD:index.html. Each photo remains tied to
   its original stable index and retains the wall, full-print and source paths. */
const PHOTO_ROWS = [
  [0, "BLOOM", "photo/wall/1779456446198.webp", "photo/1779456446198.jpg", "", 1600, 1067, "Bare branches in backlight against a pale sky", "Before the leaves, the shape is the story.", false],
  [1, "BLOOM", "photo/wall/1779456446218.webp", "photo/1779456446218.jpg", "", 1600, 1067, "Yellow blossom clustered on a dark branch", "Yellow arrives first.", false],
  [2, "BLOOM", "photo/wall/SAVE_20260618_225416.webp", "photo/SAVE_20260618_225416.jpg", "", 1600, 1067, "A reindeer with broad antlers standing behind pale birch trunks", "Antlers fill the gap between trunks.", false],
  [3, "HORIZON", "photo/wall/SAVE_20260616_234154.webp", "photo/SAVE_20260616_234154.jpg", "", 1600, 1067, "A green field under a wide bank of clouds", "A field under a sky that keeps opening.", false],
  [4, "BLOOM", "photo/wall/1779456446227.webp", "photo/1779456446227.jpg", "", 1600, 1067, "White blossom against a soft blue background", "Blossom against blue.", false],
  [5, "HORIZON", "photo/wall/SAVE_20260618_230022_1781795010861edit.webp", "photo/SAVE_20260618_230022_1781795010861edit.jpg", "", 1600, 1067, "Wind turbines on green hills beneath a wide bank of cloud", "Small blades against a soft grey sky.", false],
  [6, "BLOOM", "photo/wall/1779456446240.webp", "photo/1779456446240.jpg", "", 1600, 1067, "Folded flower buds and leaves against a green blurred background", "Still folded, already reaching.", false],
  [7, "BLOOM", "photo/wall/1779456446231.webp", "photo/1779456446231.jpg", "", 1600, 1067, "A white blossom branch reaching into the blue sky", "A branch reaches for the sky.", false],
  [8, "HORIZON", "photo/wall/1789470372631.webp", "photo/1789470372631.jpg", "", 1600, 1067, "White cumulus towers above green hills and a row of wind turbines", "The cloud sits down on the ridge.", false],
  [9, "BLOOM", "photo/wall/1779456446248.webp", "photo/1779456446248.jpg", "", 1600, 1067, "Dense white blossom on dark branches", "Too much bloom to hold.", false],
  [10, "BLOOM", "photo/wall/SAVE_20260618_225310.webp", "photo/SAVE_20260618_225310.jpg", "", 1600, 1067, "A grove of pale birch trunks under bright green leaves", "Every trunk repeats the same line.", false],
  [11, "BLOOM", "photo/wall/1779456446245.webp", "photo/1779456446245.jpg", "", 1600, 1067, "A curved branch with white blossom against the blue sky", "The arc knows where it is going.", false],
  [12, "BLOOM", "photo/wall/SAVE_20260618_225828.webp", "photo/SAVE_20260618_225828.jpg", "", 1600, 1067, "A blue pond ringed by vivid green brush and small trees", "Blue water inside a ring of green.", false],
  [13, "BLOOM", "photo/wall/SAVE_20260616_234458.webp", "photo/SAVE_20260616_234458.jpg", "", 1600, 1067, "A black cow with a white face standing in sunlit green grass", "One looks up while the other eats.", false],
  [14, "HORIZON", "photo/wall/SAVE_20260618_230059.webp", "photo/SAVE_20260618_230059.jpg", "", 1600, 1067, "A town of pale rooftops beneath a wide bank of cloud", "Roofs, then hills, then cloud.", false],
  [15, "BLOOM", "photo/wall/SAVE_20260618_225844_1781795146234edit.webp", "photo/SAVE_20260618_225844_1781795146234edit.jpg", "", 1600, 1067, "Sunlit green leaves on a thin branch against deep shadow", "One branch keeps all the light.", false],
  [16, "HORIZON", "photo/wall/SAVE_20260616_234224.webp", "photo/SAVE_20260616_234224.jpg", "", 1600, 1067, "A field under low hanging clouds", "Clouds moving slower than the road.", false],
  [17, "HORIZON", "photo/wall/SAVE_20260618_225834_1781795044036edit.webp", "photo/SAVE_20260618_225834_1781795044036edit.jpg", "", 1600, 1067, "A pale river curving through a green plain beneath distant hills", "The water turns back on itself.", false],
  [18, "HORIZON", "photo/wall/SAVE_20260618_230015_1781795020338edit.webp", "photo/SAVE_20260618_230015_1781795020338edit.jpg", "", 1600, 1067, "A river threading through wide green forest toward far hills", "Trees crowd the water on both sides.", false],
  [19, "HORIZON", "photo/wall/SAVE_20260616_234337.webp", "photo/SAVE_20260616_234337.jpg", "", 1600, 1067, "A green grass slope below a tall cloud", "Green, then a long horizon.", false],
  [20, "HORIZON", "photo/wall/SAVE_20260616_234423.webp", "photo/SAVE_20260616_234423.jpg", "", 1600, 1067, "Open fields with a distant band of cloud", "The day leaves the frame open.", false],
  [21, "CITY", "photo/wall/1791482278707.webp?v=1", "photo/prints/1791482278707.webp?v=1", "photo/1791482278707.jpg", 4080, 3072, "A red sunset above the river and a distant city skyline", "The last red light", true],
  [22, "CITY", "photo/wall/1791482278719.webp?v=1", "photo/prints/1791482278719.webp?v=1", "photo/1791482278719.jpg", 4080, 3072, "Golden light breaking through dark clouds above the river", "An opening in the clouds", true],
  [23, "CITY", "photo/wall/1791482278743.webp?v=1", "photo/prints/1791482278743.webp?v=1", "photo/1791482278743.jpg", 4080, 3072, "The low sun reflected in rippling river water", "Sunlight on the river", true],
  [24, "CITY", "photo/wall/1791482278773.webp?v=1", "photo/prints/1791482278773.webp?v=1", "photo/1791482278773.jpg", 4096, 3072, "The Oriental Pearl Tower rising into a cloud-filled sky", "Looking up in Shanghai", true],
  [25, "CITY", "photo/wall/1791482278781.webp?v=1", "photo/prints/1791482278781.webp?v=1", "photo/1791482278781.jpg", 4096, 3072, "White arches of a bridge crossing a broad river", "White arches, still water", true],
  [26, "CITY", "photo/wall/1791482278794.webp?v=1", "photo/prints/1791482278794.webp?v=1", "photo/1791482278794.jpg", 4080, 3072, "A sailing ship and towers beside a winding waterway", "A ship beside the city", true],
  [27, "CITY", "photo/wall/1791482278808.webp?v=1", "photo/prints/1791482278808.webp?v=1", "photo/1791482278808.jpg", 4080, 3072, "An ornate building with tall towers beside green parkland", "Towers across the water", true],
  [28, "NIGHT", "photo/wall/1791482278824.webp?v=1", "photo/prints/1791482278824.webp?v=1", "photo/1791482278824.jpg", 4096, 3072, "A bridge illuminated in gold against the night sky", "A bridge after dark", true],
  [29, "NIGHT", "photo/wall/1791482278836.webp?v=1", "photo/prints/1791482278836.webp?v=1", "photo/1791482278836.jpg", 3072, 4096, "A golden illuminated church tower against the dark sky", "Gold against the night", true],
  [30, "NIGHT", "photo/wall/1791482278844.webp?v=1", "photo/prints/1791482278844.webp?v=1", "photo/1791482278844.jpg", 4096, 3072, "Yellow lanterns above red flowers on a lively night street", "Lanterns and red flowers", true],
  [31, "CITY", "photo/wall/1791482278854.webp?v=1", "photo/prints/1791482278854.webp?v=1", "photo/1791482278854.jpg", 4096, 3072, "A river bridge framed by apartment buildings and green hills", "The river below the balcony", true],
  [32, "CITY", "photo/wall/1791482278864.webp?v=1", "photo/prints/1791482278864.webp?v=1", "photo/1791482278864.jpg", 3072, 4080, "Sunset seen between tall buildings on a narrow street", "The light between buildings", true],
  [33, "CITY", "photo/wall/1791482278875.webp?v=1", "photo/prints/1791482278875.webp?v=1", "photo/1791482278875.jpg", 4096, 3072, "The setting sun seen through a dark canopy of trees", "A small window of sun", true],
  [34, "CITY", "photo/wall/1791482278888.webp?v=1", "photo/prints/1791482278888.webp?v=1", "photo/1791482278888.jpg", 4080, 3072, "A red arched bridge and city buildings beyond the river", "A red arc across the city", true],
  [35, "NIGHT", "photo/wall/1791482278899.webp?v=1", "photo/prints/1791482278899.webp?v=1", "photo/1791482278899.jpg", 3072, 4096, "An illuminated red pagoda framed by trees at night", "Red among the trees", true],
  [36, "LAND", "photo/wall/1791482278910.webp?v=1", "photo/prints/1791482278910.webp?v=1", "photo/1791482278910.jpg", 3072, 4080, "A tall layered rock pillar rising above green mountains", "Stone above the valley", true],
  [37, "LAND", "photo/wall/1791482278923.webp?v=1", "photo/prints/1791482278923.webp?v=1", "photo/1791482278923.jpg", 4096, 1844, "Layers of blue mountains beyond a sunlit grassy ridge", "Ridges into the distance", true],
  [38, "LAND", "photo/wall/1791482278932.webp?v=1", "photo/prints/1791482278932.webp?v=1", "photo/1791482278932.jpg", 4096, 1844, "Clear turquoise water beside trees and a riverside path", "Following the blue water", true],
  [39, "LAND", "photo/wall/1791482278944.webp?v=1", "photo/prints/1791482278944.webp?v=1", "photo/1791482278944.jpg", 4096, 1844, "A branching waterfall flowing through dense green forest", "Water through the forest", true],
  [40, "LAND", "photo/wall/1791482278956.webp?v=1", "photo/prints/1791482278956.webp?v=1", "photo/1791482278956.jpg", 4096, 1844, "A white cascade flowing into a turquoise pool", "A pool below the falls", true],
  [41, "LAND", "photo/wall/1791482278971.webp?v=1", "photo/prints/1791482278971.webp?v=1", "photo/1791482278971.jpg", 4096, 3072, "A clear turquoise pool reflecting vivid green trees", "A green reflection", true],
  [42, "LAND", "photo/wall/1791482278991.webp?v=1", "photo/prints/1791482278991.webp?v=1", "photo/1791482278991.jpg", 4096, 1844, "Buildings beside a river beneath green mountains and clouds", "A village below the hills", true],
  [43, "LAND", "photo/wall/1791482278998.webp?v=1", "photo/prints/1791482278998.webp?v=1", "photo/1791482278998.jpg", 4096, 1844, "A broad waterfall falling from a forested cliff", "The curtain of water", true],
  [44, "LAND", "photo/wall/1791482279005.webp?v=1", "photo/prints/1791482279005.webp?v=1", "photo/1791482279005.jpg", 4096, 1844, "A distant waterfall and drifting mist among green hills", "Mist above the valley", true],
  [45, "WINTER", "photo/wall/mmexport1702262955913.webp?v=1", "photo/prints/mmexport1702262955913.webp?v=1", "photo/mmexport1702262955913.jpg", 1920, 1080, "Snow-covered trees beside a pond and a small pavilion", "A garden in snow", true]
];

const GAME_ROWS = [
  ["cs", "Counter-Strike", "1999", "1999", "series", "covers/counter-strike.webp", "Counter-Strike cover"],
  ["nba2k", "NBA 2K", "1999", "1999", "series", "covers/nba-2k.webp", "NBA 2K cover"],
  ["fm", "Football Manager", "2004", "2004", "series", "covers/football-manager.webp", "Football Manager cover"],
  ["gta5", "Grand Theft Auto V", "September 17, 2013", "2013-09-17", "", "covers/gta5.webp", "Grand Theft Auto V cover"],
  ["human-fall-flat", "Human Fall Flat", "July 22, 2016", "2016-07-22", "", "covers/human-fall-flat.webp", "Human Fall Flat cover"],
  ["detroit", "Detroit: Become Human", "May 25, 2018", "2018-05-25", "", "covers/detroit.webp", "Detroit Become Human cover"],
  ["forza", "Forza Horizon 4", "October 2, 2018", "2018-10-02", "", "covers/forza-horizon-4.webp", "Forza Horizon 4 cover"],
  ["rdr2", "Red Dead Redemption 2", "October 26, 2018", "2018-10-26", "", "covers/rdr2.webp", "Red Dead Redemption 2 cover"],
  ["hitman-2", "Hitman 2", "November 13, 2018", "2018-11-13", "", "covers/hitman.webp", "Hitman 2 cover"],
  ["bfv", "Battlefield V", "November 20, 2018", "2018-11-20", "", "covers/battlefield-v.webp", "Battlefield V cover"],
  ["sekiro", "Sekiro", "March 22, 2019", "2019-03-22", "", "covers/sekiro.webp", "Sekiro: Shadows Die Twice cover"],
  ["cyberpunk", "Cyberpunk 2077", "December 10, 2020", "2020-12-10", "", "covers/cyberpunk.webp", "Cyberpunk 2077 cover"],
  ["it-takes-two", "It Takes Two", "March 26, 2021", "2021-03-26", "", "covers/it%20takes%20two.webp", "It Takes Two cover"],
  ["dying-light-2", "Dying Light 2", "February 4, 2022", "2022-02-04", "", "covers/dying%20light.webp", "Dying Light 2 Stay Human cover"],
  ["elden-ring", "Elden Ring", "February 25, 2022", "2022-02-25", "", "covers/elden-ring.webp", "Elden Ring cover"],
  ["bg3", "Baldur's Gate 3", "August 3, 2023", "2023-08-03", "", "covers/baldurs-gate-3.webp", "Baldur's Gate 3 cover"],
  ["wukong", "Black Myth: Wukong", "August 20, 2024", "2024-08-20", "", "covers/black-myth-wukong.webp", "Black Myth: Wukong cover"],
  ["fc26", "EA SPORTS FC 26", "September 26, 2025", "2025-09-26", "", "covers/fc26.webp", "EA SPORTS FC 26 cover"]
];

const SPORT_ROWS = [
  ["basketball", "San Antonio Spurs · NBA", "Five NBA championships, 1999–2014", "nba.com/spurs", "https://www.nba.com/spurs", "sport/spurs.webp", "logos/spurs.svg", "San Antonio Spurs celebrating with the championship trophy", "50% 34%"],
  ["football", "Manchester City · Premier League", "Ten English league titles, the treble in 2023", "mancity.com", "https://www.mancity.com", "sport/mancity.webp", "logos/mancity.svg", "Manchester City supporters raising their arms in the stands", "50% 55%"],
  ["formula-1", "McLaren Racing · Formula 1", "Ten constructors titles, back-to-back in 2024–2025", "mclaren.com/racing", "https://www.mclaren.com/racing/", "sport/mclaren.webp", "logos/mclaren.svg", "McLaren celebrating the 2025 constructors championship in the garage", "50% 50%"],
  ["american-football", "Baltimore Ravens · NFL", "Two Super Bowl titles, 2001 and 2013", "baltimoreravens.com", "https://www.baltimoreravens.com", "sport/ravens.webp", "logos/ravens.svg", "Baltimore Ravens players celebrating in the end zone", "62% 45%"],
  ["esports", "Team Spirit · CS2", "Three premier tournament titles, 2024–2025", "teamspirit.gg", "https://teamspirit.gg", "sport/spirit.webp", "logos/spirit.svg", "Team Spirit player donk watching his screen at the tournament desk", "58% 58%"]
];

function arrayFrom(globalName) {
  const value = globalThis[globalName];
  return Array.isArray(value) ? value : [];
}

function photoItems() {
  return PHOTO_ROWS.map((row) => {
    const [photoIndex, act, image, full, originalPath, width, height, alt, caption, isNew] = row;
    const source = {
      type: "photo",
      photoIndex,
      act,
      src: image,
      full,
      originalPath,
      width,
      height,
      alt,
      caption,
      number: String(photoIndex + 1).padStart(2, "0"),
      new: isNew
    };
    return {
      ...source,
      id: "photo-" + source.number,
      category: "photo",
      title: caption,
      meta: act,
      description: alt,
      image,
      fullImage: full || image,
      url: originalPath || full || image,
      original: originalPath || full || image,
      originalFields: source,
      interaction: "打开照片，查看放大画面与原始题注。"
    };
  });
}

function bookItems() {
  return arrayFrom("BOOK_SHELF").map((book, index) => ({
    ...book,
    id: String(book.id ?? "book-" + (index + 1)),
    category: "books",
    title: book.title || book.spine || "",
    english: book.spine || "",
    meta: book.author || "",
    description: book.blurb || "",
    image: "",
    fullImage: "",
    url: "",
    original: "",
    originalFields: book,
    interaction: "取出书脊，阅读作者、书名与藏书笔记。"
  }));
}

function poemItems() {
  return arrayFrom("POEM_DATA").map((poem, index) => {
    const stanzas = Array.isArray(poem.stanzas)
      ? poem.stanzas.map((stanza) => Array.isArray(stanza) ? stanza.slice() : [])
      : [];
    return {
      ...poem,
      id: String(poem.id ?? "poem-" + (index + 1)),
      category: "poems",
      title: poem.title || "",
      meta: [poem.author, poem.form, poem.year].filter(Boolean).join(" · "),
      description: poem.standfirst || poem.note || "",
      image: "",
      fullImage: "",
      url: poem.sourceUrl || "",
      original: "",
      originalFields: poem,
      stanzas,
      interaction: "逐节阅读完整诗作，并访问原始来源。"
    };
  });
}

function paintingItems() {
  return arrayFrom("PAINTING_DATA").map((painting, index) => {
    const image = painting.image || "assets/paintings/" + painting.id + ".webp";
    return {
      ...painting,
      id: String(painting.id ?? "painting-" + (index + 1)),
      category: "paintings",
      title: painting.title || painting.english || "",
      meta: [painting.artistShort || painting.artist, painting.year].filter(Boolean).join(" · "),
      description: painting.note || "",
      image,
      fullImage: image,
      url: painting.museumUrl || "",
      original: painting.thumbnail || image,
      originalFields: painting,
      interaction: "走近画作，查看作者、年代、馆藏与作品说明。"
    };
  });
}

function sportItems() {
  return SPORT_ROWS.map((row) => {
    const [id, title, honours, sourceLabel, sourceUrl, image, crest, alt, objectPosition] = row;
    const source = {
      type: "sport",
      sport: id,
      title,
      honours,
      sourceLabel,
      sourceHref: sourceUrl,
      src: image,
      crest,
      alt,
      objectPosition
    };
    return {
      ...source,
      id,
      category: "sport",
      title,
      meta: honours,
      description: honours || alt,
      image,
      fullImage: image,
      url: sourceUrl,
      original: image,
      originalFields: source,
      source: { label: sourceLabel, url: sourceUrl },
      interaction: "选择一项运动记忆，访问球队或赛事官方站点。"
    };
  });
}

function seriesItems() {
  return arrayFrom("SERIES_DATA").map((series, index) => {
    const url = series.douban ? "https://movie.douban.com/subject/" + series.douban + "/" : "";
    return {
      ...series,
      id: String(series.id ?? "series-" + (index + 1)),
      category: "series",
      title: series.title || "",
      meta: [series.years, series.seasons].filter(Boolean).join(" · "),
      description: series.quote || "",
      image: series.poster || "",
      fullImage: series.poster || "",
      url,
      original: series.poster || "",
      originalFields: series,
      interaction: "查看海报、播出信息与豆瓣页面。"
    };
  });
}

function filmItems() {
  return arrayFrom("FILM_DATA").map((film, index) => {
    const url = film.douban ? "https://movie.douban.com/subject/" + film.douban + "/" : "";
    return {
      ...film,
      id: String(film.id ?? "film-" + (index + 1)),
      category: "films",
      title: film.title || "",
      meta: [film.director, film.year].filter(Boolean).join(" · "),
      description: film.quote || "",
      image: film.poster || "",
      fullImage: film.poster || "",
      url,
      original: film.poster || "",
      originalFields: film,
      interaction: "查看海报、主创信息与豆瓣页面。"
    };
  });
}

function gameItems() {
  return GAME_ROWS.map((row, index) => {
    const [id, title, release, releaseDate, releaseKind, image, alt] = row;
    const source = {
      type: "game",
      id,
      name: title,
      release,
      releaseDate,
      releaseKind,
      releaseLabel: releaseKind === "series" ? "Series debut" : "Released",
      src: image,
      alt,
      rank: index + 1
    };
    return {
      ...source,
      category: "games",
      title,
      meta: (releaseKind === "series" ? "Series debut · " : "Released · ") + release,
      description: alt,
      image,
      fullImage: image,
      url: "",
      original: image,
      originalFields: source,
      interaction: "选择封面，查看游戏名称与发行日期。"
    };
  });
}

const BUILDERS = {
  photo: photoItems,
  books: bookItems,
  poems: poemItems,
  paintings: paintingItems,
  sport: sportItems,
  series: seriesItems,
  films: filmItems,
  games: gameItems,
  curate: () => []
};

export async function loadCollection() {
  return SPACES.map((space) => ({
    ...space,
    items: BUILDERS[space.id]()
  }));
}
