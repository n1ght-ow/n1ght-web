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
      quote: "园子刚刚造好，所有人都在往里走，只有一个人站在门口数日子。"
    },
    {
      id: "series-02",
      imdb: "tt1163129",
      poster: "posters/tt1163129.jpg",
      title: "西游记",
      years: "1986",
      seasons: "25 集",
      category: "CLASSICS",
      quote: "十万八千里走下来，最难的那一难，是让这四个人一直走同一条路。"
    },
    {
      id: "series-03",
      imdb: "tt11298328",
      poster: "posters/tt11298328.jpg",
      title: "沉默的真相",
      years: "2020",
      seasons: "12 集",
      category: "CRIME & MYSTERY",
      quote: "有人把真相背在身上太久了，最后只能交给别人替他扛。"
    },
    {
      id: "series-04",
      imdb: "tt12477942",
      poster: "posters/tt12477942.jpg",
      title: "隐秘的角落",
      years: "2020",
      seasons: "12 集",
      category: "CRIME & MYSTERY",
      quote: "三个孩子在山上按下了快门，下山以后，每个人都在演。"
    },
    {
      id: "series-05",
      imdb: "tt27628576",
      poster: "posters/tt27628576.jpg",
      title: "漫长的季节",
      years: "2023",
      seasons: "12 集",
      category: "CRIME & MYSTERY",
      quote: "这里的秋天特别长，长到够一个人把一个案子想上二十年。"
    },
    {
      id: "series-06",
      imdb: "tt7368008",
      poster: "posters/tt7368008.jpg",
      title: "白夜追凶",
      years: "2017",
      seasons: "32 集",
      category: "CRIME & MYSTERY",
      quote: "一张脸，两个名字，白天和黑夜轮着用。"
    },
    {
      id: "series-07",
      imdb: "tt0903747",
      poster: "posters/tt0903747.jpg",
      title: "Breaking Bad",
      years: "2008-2013",
      seasons: "5 季",
      category: "CRIME & MYSTERY",
      quote: "他一辈子都在配比，最后配出一个自己也不认识的人。"
    },
    {
      id: "series-08",
      imdb: "tt3032476",
      poster: "posters/tt3032476.jpg",
      title: "Better Call Saul",
      years: "2015-2022",
      seasons: "6 季",
      category: "CRIME & MYSTERY",
      quote: "他一步一步往前挪，每一步都小得不像错；回头看时，已经没有路了。"
    },
    {
      id: "series-09",
      imdb: "tt5141800",
      poster: "posters/tt5141800.jpg",
      title: "琅琊榜",
      years: "2015",
      seasons: "54 集",
      category: "POWER & HISTORY",
      quote: "他带着一身病回到京城，把整座朝廷当成一盘下了十二年的棋。"
    },
    {
      id: "series-10",
      imdb: "tt11273352",
      poster: "posters/tt11273352.jpg",
      title: "庆余年",
      years: "2019-2024",
      seasons: "3 季",
      category: "POWER & HISTORY",
      quote: "他带着一个不属于这里的脑子，走进了最不讲道理的地方。"
    },
    {
      id: "series-11",
      imdb: "tt2085059",
      poster: "posters/tt2085059.jpg",
      title: "黑镜",
      years: "2011-2023",
      seasons: "6 季",
      category: "SCI-FI & FANTASY",
      quote: "每一集都只往前多走一小步，然后停下来，让你看清那一步踩在哪儿。"
    },
    {
      id: "series-12",
      imdb: "tt4574334",
      poster: "posters/tt4574334.jpg",
      title: "Stranger Things",
      years: "2016-2025",
      seasons: "5 季",
      category: "SCI-FI & FANTASY",
      quote: "小镇下面还有一个小镇，灯一闪一闪的，是那边有人在敲门。"
    },
    {
      id: "series-13",
      imdb: "tt2431438",
      poster: "posters/tt2431438.jpg",
      title: "Sense8",
      years: "2015-2018",
      seasons: "2 季",
      category: "SCI-FI & FANTASY",
      quote: "八个人隔着八座城市一起醒过来，从那天起，没有谁是一个人了。"
    },
    {
      id: "series-14",
      imdb: "tt10048342",
      poster: "posters/tt10048342.jpg",
      title: "The Queen's Gambit",
      years: "2020",
      seasons: "7 集",
      category: "SCI-FI & FANTASY",
      quote: "她在天花板上推演棋局，先赢的不是对手，是那个不肯睡着的自己。"
    },
    {
      id: "series-15",
      imdb: "tt1190634",
      poster: "posters/tt1190634.jpg",
      title: "The Boys",
      years: "2019-2024",
      seasons: "4 季",
      category: "DARK SATIRE",
      quote: "他们披着披风救的是收视率，地上的东西交给别人捡。"
    },
    {
      id: "series-16",
      imdb: "tt1856010",
      poster: "posters/tt1856010.jpg",
      title: "House of Cards",
      years: "2013-2018",
      seasons: "6 季",
      category: "DARK SATIRE",
      quote: "他对着镜头说话，好像只有你一个人可以信任。这就是第一步。"
    },
    {
      id: "series-17",
      imdb: "tt0108778",
      poster: "posters/tt0108778.jpg",
      title: "Friends",
      years: "1994-2004",
      seasons: "10 季",
      category: "FAMILY & LIFE",
      quote: "沙发就那么一张，六个人轮着坐，谁也没想过换个地方。"
    },
    {
      id: "series-18",
      imdb: "tt1442437",
      poster: "posters/tt1442437.jpg",
      title: "Modern Family",
      years: "2009-2020",
      seasons: "11 季",
      category: "FAMILY & LIFE",
      quote: "一家人各拍各的，剪到一起才发现，原来都在同一个屋顶底下。"
    },
    {
      id: "series-19",
      imdb: "tt1586680",
      poster: "posters/tt1586680.jpg",
      title: "Shameless",
      years: "2011-2021",
      seasons: "11 季",
      category: "FAMILY & LIFE",
      quote: "屋子里什么都缺，唯独不缺人回来吃饭。"
    }
  ];
})();
