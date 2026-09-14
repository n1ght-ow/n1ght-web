(function () {
  "use strict";

  window.SERIES_DATA = [
    {
      id: "series-01",
      douban: "1864810",
      poster: "posters/1864810.jpg",
      title: "红楼梦",
      years: "1987",
      seasons: "36 集",
      category: "CLASSICS",
      quote: "园子刚刚造好，所有人都在往里走，只有一个人站在门口数日子。"
    },
    {
      id: "series-02",
      douban: "2156663",
      poster: "posters/2156663.jpg",
      title: "西游记",
      years: "1986",
      seasons: "25 集",
      category: "CLASSICS",
      quote: "十万八千里走下来，最难的那一难，是让这四个人一直走同一条路。"
    },
    {
      id: "series-03",
      douban: "33447642",
      poster: "posters/33447642.jpg",
      title: "沉默的真相",
      years: "2020",
      seasons: "12 集",
      category: "CRIME & MYSTERY",
      quote: "有人把真相背在身上太久了，最后只能交给别人替他扛。"
    },
    {
      id: "series-04",
      douban: "33404425",
      poster: "posters/33404425.jpg",
      title: "隐秘的角落",
      years: "2020",
      seasons: "12 集",
      category: "CRIME & MYSTERY",
      quote: "三个孩子在山上按下了快门，下山以后，每个人都在演。"
    },
    {
      id: "series-05",
      douban: "35588177",
      poster: "posters/35588177.jpg",
      title: "漫长的季节",
      years: "2023",
      seasons: "12 集",
      category: "CRIME & MYSTERY",
      quote: "这里的秋天特别长，长到够一个人把一个案子想上二十年。"
    },
    {
      id: "series-06",
      douban: "26883064",
      poster: "posters/26883064.jpg",
      title: "白夜追凶",
      years: "2017",
      seasons: "32 集",
      category: "CRIME & MYSTERY",
      quote: "一张脸，两个名字，白天和黑夜轮着用。"
    },
    {
      id: "series-07",
      douban: "2373195",
      poster: "posters/2373195.jpg",
      title: "Breaking Bad",
      years: "2008-2013",
      seasons: "5 季",
      category: "CRIME & MYSTERY",
      quote: "他一辈子都在配比，最后配出一个自己也不认识的人。"
    },
    {
      id: "series-08",
      douban: "25726259",
      poster: "posters/25726259.jpg",
      title: "Better Call Saul",
      years: "2015-2022",
      seasons: "6 季",
      category: "CRIME & MYSTERY",
      quote: "他一步一步往前挪，每一步都小得不像错；回头看时，已经没有路了。"
    },
    {
      id: "series-09",
      douban: "10748120",
      poster: "posters/10748120.jpg",
      title: "True Detective",
      years: "2014-2024",
      seasons: "4 季",
      category: "CRIME & MYSTERY",
      quote: "两个人在车里说了很久的话，窗外的田地一直是黑的。"
    },
    {
      id: "series-10",
      douban: "26310143",
      poster: "posters/26310143.jpg",
      title: "信号",
      years: "2016",
      seasons: "16 集",
      category: "CRIME & MYSTERY",
      quote: "对讲机在半夜响起来，那头的人报的是一桩旧案。"
    },
    {
      id: "series-11",
      douban: "26934346",
      poster: "posters/26934346.jpg",
      title: "秘密森林",
      years: "2017-2020",
      seasons: "2 季",
      category: "CRIME & MYSTERY",
      quote: "检察官的脸上什么也读不出来，证据只好自己说话。"
    },
    {
      id: "series-12",
      douban: "25754848",
      poster: "posters/25754848.jpg",
      title: "琅琊榜",
      years: "2015",
      seasons: "54 集",
      category: "POWER & HISTORY",
      quote: "他带着一身病回到京城，把整座朝廷当成一盘下了十二年的棋。"
    },
    {
      id: "series-13",
      douban: "25853071",
      poster: "posters/25853071.jpg",
      title: "庆余年",
      years: "2019-2024",
      seasons: "3 季",
      category: "POWER & HISTORY",
      quote: "他带着一个不属于这里的脑子，走进了最不讲道理的地方。"
    },
    {
      id: "series-14",
      douban: "7054120",
      poster: "posters/7054120.jpg",
      title: "黑镜",
      years: "2011-2023",
      seasons: "6 季",
      category: "SCI-FI & FANTASY",
      quote: "每一集都只往前多走一小步，然后停下来，让你看清那一步踩在哪儿。"
    },
    {
      id: "series-15",
      douban: "26359270",
      poster: "posters/26359270.jpg",
      title: "Stranger Things",
      years: "2016-2025",
      seasons: "5 季",
      category: "SCI-FI & FANTASY",
      quote: "小镇下面还有一个小镇，灯一闪一闪的，是那边有人在敲门。"
    },
    {
      id: "series-16",
      douban: "23011215",
      poster: "posters/23011215.jpg",
      title: "Sense8",
      years: "2015-2018",
      seasons: "2 季",
      category: "SCI-FI & FANTASY",
      quote: "八个人隔着八座城市一起醒过来，从那天起，没有谁是一个人了。"
    },
    {
      id: "series-17",
      douban: "32579283",
      poster: "posters/32579283.jpg",
      title: "The Queen's Gambit",
      years: "2020",
      seasons: "7 集",
      category: "SCI-FI & FANTASY",
      quote: "她在天花板上推演棋局，先赢的不是对手，是那个不肯睡着的自己。"
    },
    {
      id: "series-18",
      douban: "25698722",
      poster: "posters/25698722.jpg",
      title: "来自星星的你",
      years: "2013",
      seasons: "21 集",
      category: "SCI-FI & FANTASY",
      quote: "时间停下来的那几秒，只够他接住一杯要洒的咖啡。"
    },
    {
      id: "series-19",
      douban: "24702659",
      poster: "posters/24702659.jpg",
      title: "听见你的声音",
      years: "2013",
      seasons: "18 集",
      category: "SCI-FI & FANTASY",
      quote: "他没开口，她也知道下一句是什么。"
    },
    {
      id: "series-20",
      douban: "26761935",
      poster: "posters/26761935.jpg",
      title: "孤单又灿烂的神：鬼怪",
      years: "2016",
      seasons: "16 集",
      category: "SCI-FI & FANTASY",
      quote: "他难过的时候全城下雨，只有她还带着伞。"
    },
    {
      id: "series-21",
      douban: "26727298",
      poster: "posters/26727298.jpg",
      title: "W-两个世界",
      years: "2016",
      seasons: "16 集",
      category: "SCI-FI & FANTASY",
      quote: "她从屏幕里被拉进去，漫画格子的边还在动。"
    },
    {
      id: "series-22",
      douban: "26887064",
      poster: "posters/26887064.jpg",
      title: "当你沉睡时",
      years: "2017",
      seasons: "32 集",
      category: "SCI-FI & FANTASY",
      quote: "他挡在她前面，因为他已经梦见过这一幕。"
    },
    {
      id: "series-23",
      douban: "3703650",
      poster: "posters/3703650.jpg",
      title: "The Boys",
      years: "2019-2024",
      seasons: "4 季",
      category: "DARK SATIRE",
      quote: "他们披着披风救的是收视率，地上的东西交给别人捡。"
    },
    {
      id: "series-24",
      douban: "6037429",
      poster: "posters/6037429.jpg",
      title: "House of Cards",
      years: "2013-2018",
      seasons: "6 季",
      category: "DARK SATIRE",
      quote: "他对着镜头说话，好像只有你一个人可以信任。这就是第一步。"
    },
    {
      id: "series-25",
      douban: "26813224",
      poster: "posters/26813224.jpg",
      title: "Succession",
      years: "2018-2023",
      seasons: "4 季",
      category: "DARK SATIRE",
      quote: "他们隔着长桌互相喊，谁也没有站起来。"
    },
    {
      id: "series-26",
      douban: "1393859",
      poster: "posters/1393859.jpg",
      title: "Friends",
      years: "1994-2004",
      seasons: "10 季",
      category: "FAMILY & LIFE",
      quote: "沙发就那么一张，六个人轮着坐，谁也没想过换个地方。"
    },
    {
      id: "series-27",
      douban: "3754382",
      poster: "posters/3754382.jpg",
      title: "Modern Family",
      years: "2009-2020",
      seasons: "11 季",
      category: "FAMILY & LIFE",
      quote: "一家人各拍各的，剪到一起才发现，原来都在同一个屋顶底下。"
    },
    {
      id: "series-28",
      douban: "4729738",
      poster: "posters/4729738.jpg",
      title: "Shameless",
      years: "2011-2021",
      seasons: "11 季",
      category: "FAMILY & LIFE",
      quote: "屋子里什么都缺，唯独不缺人回来吃饭。"
    },
    {
      id: "series-29",
      douban: "26302614",
      poster: "posters/26302614.jpg",
      title: "请回答1988",
      years: "2015",
      seasons: "20 集",
      category: "FAMILY & LIFE",
      quote: "胡同里那几家总是互相端菜，谁也不肯让谁的碗空着。"
    },
    {
      id: "series-30",
      douban: "27602137",
      poster: "posters/27602137.jpg",
      title: "我的大叔",
      years: "2018",
      seasons: "16 集",
      category: "FAMILY & LIFE",
      quote: "他把她送到楼下，站着听了一会儿，才转身走。"
    },
    {
      id: "series-31",
      douban: "30464551",
      poster: "posters/30464551.jpg",
      title: "浪漫的体质",
      years: "2019",
      seasons: "16 集",
      category: "FAMILY & LIFE",
      quote: "三个人挤在沙发上看电视，谁的工作都还没着落。"
    },
    {
      id: "series-32",
      douban: "34660401",
      poster: "posters/34660401.jpg",
      title: "棒球大联盟",
      years: "2019",
      seasons: "16 集",
      category: "FAMILY & LIFE",
      quote: "交易截止那天，他把最好的球员一个一个送走。"
    },
    {
      id: "series-33",
      douban: "33464863",
      poster: "posters/33464863.jpg",
      title: "机智医生生活",
      years: "2020-2021",
      seasons: "2 季",
      category: "FAMILY & LIFE",
      quote: "五个人挤在一间办公室里练歌，谁也不想先回家。"
    },
    {
      id: "series-34",
      douban: "25831874",
      poster: "posters/25831874.jpg",
      title: "太阳的后裔",
      years: "2016",
      seasons: "16 集",
      category: "ROMANCE & MELO",
      quote: "他把军靴上的土拍干净，才肯走进那间病房。"
    },
    {
      id: "series-35",
      douban: "34861170",
      poster: "posters/34861170.jpg",
      title: "虽然是精神病但没关系",
      years: "2020",
      seasons: "16 集",
      category: "ROMANCE & MELO",
      quote: "她把童话书合上，说里面的公主从来没有等过人。"
    },
    {
      id: "series-36",
      douban: "35402776",
      poster: "posters/35402776.jpg",
      title: "那年，我们的夏天",
      years: "2021",
      seasons: "16 集",
      category: "ROMANCE & MELO",
      quote: "画册翻到最后一页，两个人的名字还挨着。"
    }
  ];
})();
