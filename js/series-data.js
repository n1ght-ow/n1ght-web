(function () {
  "use strict";

  window.SERIES_DATA = [
    {
      id: "series-01",
      imdb: "tt1162595",
      poster: "posters/tt1162595.jpg",
      title: "红楼梦",
      years: "1987",
      seasons: "36 集",
      category: "CLASSICS",
      quote: "一座大观园，装下所有聚散。三十七年过去，园子还在，人也还在。"
    },
    {
      id: "series-02",
      imdb: "tt1163129",
      poster: "posters/tt1163129.jpg",
      title: "西游记",
      years: "1986",
      seasons: "25 集",
      category: "CLASSICS",
      quote: "取经的路走了整整四十年，妖精换了几茬，师徒四人从来没换过。"
    },
    {
      id: "series-03",
      imdb: "tt11298328",
      poster: "posters/tt11298328.jpg",
      title: "沉默的真相",
      years: "2020",
      seasons: "12 集",
      category: "CRIME & MYSTERY",
      quote: "真相沉默太久，就有人用命替它开口。"
    },
    {
      id: "series-04",
      imdb: "tt12477942",
      poster: "posters/tt12477942.jpg",
      title: "隐秘的角落",
      years: "2020",
      seasons: "12 集",
      category: "CRIME & MYSTERY",
      quote: "小孩的镜头比大人诚实，也远比大人吓人。"
    },
    {
      id: "series-05",
      imdb: "tt27628576",
      poster: "posters/tt27628576.jpg",
      title: "漫长的季节",
      years: "2023",
      seasons: "12 集",
      category: "CRIME & MYSTERY",
      quote: "桦林的秋天比别处都长，长到够一个人把一辈子过完。"
    },
    {
      id: "series-06",
      imdb: "tt7368008",
      poster: "posters/tt7368008.jpg",
      title: "白夜追凶",
      years: "2017",
      seasons: "32 集",
      category: "CRIME & MYSTERY",
      quote: "白天和黑夜共用一张脸——兄弟俩撑起同一盏灯。"
    },
    {
      id: "series-07",
      imdb: "tt0903747",
      poster: "posters/tt0903747.jpg",
      title: "Breaking Bad",
      years: "2008-2013",
      seasons: "5 季",
      category: "CRIME & MYSTERY",
      quote: "化学老师的天平一开始称分子，后来称道德，最后称命。"
    },
    {
      id: "series-08",
      imdb: "tt3032476",
      poster: "posters/tt3032476.jpg",
      title: "Better Call Saul",
      years: "2015-2022",
      seasons: "6 季",
      category: "CRIME & MYSTERY",
      quote: "好人是怎么一步一步把自己写进坏人的剧本里。"
    },
    {
      id: "series-09",
      imdb: "tt5141800",
      poster: "posters/tt5141800.jpg",
      title: "琅琊榜",
      years: "2015",
      seasons: "54 集",
      category: "POWER & HISTORY",
      quote: "复仇者拿棋局当刀，走一步，棋盘上就少一个辜负过他的人。"
    },
    {
      id: "series-10",
      imdb: "tt11273352",
      poster: "posters/tt11273352.jpg",
      title: "庆余年",
      years: "2019-2024",
      seasons: "3 季",
      category: "POWER & HISTORY",
      quote: "穿越者带着现代脑子和背锅之躯，把整个庙堂都卷进一场赌局。"
    },
    {
      id: "series-11",
      imdb: "tt2085059",
      poster: "posters/tt2085059.jpg",
      title: "黑镜",
      years: "2011-2023",
      seasons: "6 季",
      category: "SCI-FI & FANTASY",
      quote: "黑镜 Black Mirror — 屏幕关掉以后，问题一个都没少。"
    },
    {
      id: "series-12",
      imdb: "tt4574334",
      poster: "posters/tt4574334.jpg",
      title: "Stranger Things",
      years: "2016-2025",
      seasons: "5 季",
      category: "SCI-FI & FANTASY",
      quote: "怪奇物语 — 八十年代的小镇，地下藏着一个颠倒的世界。"
    },
    {
      id: "series-13",
      imdb: "tt2431438",
      poster: "posters/tt2431438.jpg",
      title: "Sense8",
      years: "2015-2018",
      seasons: "2 季",
      category: "SCI-FI & FANTASY",
      quote: "超感猎杀 — 八个人分享同一颗心，城市之间没有墙。"
    },
    {
      id: "series-14",
      imdb: "tt10048342",
      poster: "posters/tt10048342.jpg",
      title: "The Queen's Gambit",
      years: "2020",
      seasons: "7 集",
      category: "SCI-FI & FANTASY",
      quote: "后翼弃兵 — 天才少女赢遍棋盘，最后要赢的是她自己。"
    },
    {
      id: "series-15",
      imdb: "tt1190634",
      poster: "posters/tt1190634.jpg",
      title: "The Boys",
      years: "2019-2024",
      seasons: "4 季",
      category: "DARK SATIRE",
      quote: "黑袍纠察队 — 超级英雄救的是收视率，普通人负责收拾烂摊子。"
    },
    {
      id: "series-16",
      imdb: "tt1856010",
      poster: "posters/tt1856010.jpg",
      title: "House of Cards",
      years: "2013-2018",
      seasons: "6 季",
      category: "DARK SATIRE",
      quote: "纸牌屋 — 权力游戏里没有人是安全的，包括玩家自己。"
    },
    {
      id: "series-17",
      imdb: "tt0108778",
      poster: "posters/tt0108778.jpg",
      title: "Friends",
      years: "1994-2004",
      seasons: "10 季",
      category: "FAMILY & LIFE",
      quote: "老友记 — 六个朋友一张沙发，中央公园的咖啡凉了，友情还热着。"
    },
    {
      id: "series-18",
      imdb: "tt1442437",
      poster: "posters/tt1442437.jpg",
      title: "Modern Family",
      years: "2009-2020",
      seasons: "11 季",
      category: "FAMILY & LIFE",
      quote: "摩登家庭 — 一大家子人，怪得各有各的可爱。"
    },
    {
      id: "series-19",
      imdb: "tt1586680",
      poster: "posters/tt1586680.jpg",
      title: "Shameless",
      years: "2011-2021",
      seasons: "11 季",
      category: "FAMILY & LIFE",
      quote: "无耻之徒 — 芝加哥南区的家：穷得叮当响，爱得理直气壮。"
    }
  ];
})();
