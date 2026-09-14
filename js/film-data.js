(function () {
  "use strict";

  window.FILM_DATA = [
    {
      id: "film-01",
      douban: "1291841",
      poster: "posters/1291841.jpg",
      title: "The Godfather",
      director: "Francis Ford Coppola",
      year: "1972",
      genre: "CRIME & NOIR",
      quote: "门在他身后关上。光从缝里进来，照着一张没有他的全家福。"
    },
    {
      id: "film-02",
      douban: "1291832",
      poster: "posters/1291832.jpg",
      title: "Pulp Fiction",
      director: "Quentin Tarantino",
      year: "1994",
      genre: "CRIME & NOIR",
      quote: "箱子里到底装着什么，三十年过去，还是没有人肯说。"
    },
    {
      id: "film-03",
      douban: "1292348",
      poster: "posters/1292348.jpg",
      title: "L.A. Confidential",
      director: "Curtis Hanson",
      year: "1997",
      genre: "CRIME & NOIR",
      quote: "圣诞夜，三枚警徽摊在桌上，谁也没先伸手去拿。"
    },
    {
      id: "film-04",
      douban: "1307914",
      poster: "posters/1307914.jpg",
      title: "无间道",
      director: "刘伟强、麦兆辉",
      year: "2002",
      genre: "CRIME & NOIR",
      quote: "天台上风很大，两个人都不肯先说出自己是谁。"
    },
    {
      id: "film-05",
      douban: "1300299",
      poster: "posters/1300299.jpg",
      title: "Memories of Murder",
      director: "Bong Joon-ho",
      year: "2003",
      genre: "CRIME & NOIR",
      quote: "雨停了，田里没有答案，只有一条通往隧道口的路。"
    },
    {
      id: "film-06",
      douban: "1291580",
      poster: "posters/1291580.jpg",
      title: "Kill Bill",
      director: "Quentin Tarantino",
      year: "2003",
      genre: "CRIME & NOIR",
      quote: "她列了一张很长的名单，然后从第一个开始，一个一个地走过去。"
    },
    {
      id: "film-07",
      douban: "1309069",
      poster: "posters/1309069.jpg",
      title: "Batman Begins",
      director: "Christopher Nolan",
      year: "2005",
      genre: "CRIME & NOIR",
      quote: "他掉进井里，从此记住了黑暗里有什么。"
    },
    {
      id: "film-08",
      douban: "1857099",
      poster: "posters/1857099.jpg",
      title: "No Country for Old Men",
      director: "Ethan Coen / Joel Coen",
      year: "2007",
      genre: "CRIME & NOIR",
      quote: "硬币还没落地，谁也不知道自己能不能看到明天。"
    },
    {
      id: "film-09",
      douban: "1851857",
      poster: "posters/1851857.jpg",
      title: "The Dark Knight",
      director: "Christopher Nolan",
      year: "2008",
      genre: "CRIME & NOIR",
      quote: "炸药埋在医院里，他穿着护士服走出来，还回头看了一眼。"
    },
    {
      id: "film-10",
      douban: "2334904",
      poster: "posters/2334904.jpg",
      title: "Shutter Island",
      director: "Martin Scorsese",
      year: "2010",
      genre: "CRIME & NOIR",
      quote: "灯塔在岛的另一头，雨没停过，他走了很久。"
    },
    {
      id: "film-11",
      douban: "3395373",
      poster: "posters/3395373.jpg",
      title: "The Dark Knight Rises",
      director: "Christopher Nolan",
      year: "2012",
      genre: "CRIME & NOIR",
      quote: "从井底跳出去那一次，身上没有绑绳子。"
    },
    {
      id: "film-12",
      douban: "1292233",
      poster: "posters/1292233.jpg",
      title: "A Clockwork Orange",
      director: "Stanley Kubrick",
      year: "1971",
      genre: "SCI-FI",
      quote: "他们治好了他打人的手，顺手也拿走了他听音乐的能力。"
    },
    {
      id: "film-13",
      douban: "1291843",
      poster: "posters/1291843.jpg",
      title: "The Matrix",
      director: "Lana Wachowski / Lilly Wachowski",
      year: "1999",
      genre: "SCI-FI",
      quote: "一颗药丸，一面镜子，一部响了很久的电话。"
    },
    {
      id: "film-14",
      douban: "3541415",
      poster: "posters/3541415.jpg",
      title: "Inception",
      director: "Christopher Nolan",
      year: "2010",
      genre: "SCI-FI",
      quote: "陀螺一直在转，没有人敢等它停下来。"
    },
    {
      id: "film-15",
      douban: "1889243",
      poster: "posters/1889243.jpg",
      title: "Interstellar",
      director: "Christopher Nolan",
      year: "2014",
      genre: "SCI-FI",
      quote: "他离开的时候女儿十岁，回来的时候，她比他老。"
    },
    {
      id: "film-16",
      douban: "1292063",
      poster: "posters/1292063.jpg",
      title: "Life Is Beautiful",
      director: "Roberto Benigni",
      year: "1997",
      genre: "DRAMA",
      quote: "他把营地编成一场游戏，规则只有一条：不要出声，要赢。"
    },
    {
      id: "film-17",
      douban: "1300374",
      poster: "posters/1300374.jpg",
      title: "The Green Mile",
      director: "Frank Darabont",
      year: "1999",
      genre: "DRAMA",
      quote: "走廊的地板是绿的，走上去的人，一个也没有回头。"
    },
    {
      id: "film-18",
      douban: "6879185",
      poster: "posters/6879185.jpg",
      title: "12 Years a Slave",
      director: "Steve McQueen",
      year: "2013",
      genre: "DRAMA",
      quote: "名字被拿走了十二年，他一直记得自己叫什么。"
    },
    {
      id: "film-19",
      douban: "25773932",
      poster: "posters/25773932.jpg",
      title: "Whiplash",
      director: "Damien Chazelle",
      year: "2014",
      genre: "DRAMA",
      quote: "血滴在鼓面上，节拍没有慢下来，也没有变快。"
    },
    {
      id: "film-20",
      douban: "27119724",
      poster: "posters/27119724.jpg",
      title: "Joker",
      director: "Todd Phillips",
      year: "2019",
      genre: "DRAMA",
      quote: "他在楼梯上跳舞，整座城市都以为他在哭。"
    },
    {
      id: "film-21",
      douban: "27010768",
      poster: "posters/27010768.jpg",
      title: "Parasite",
      director: "Bong Joon-ho",
      year: "2019",
      genre: "DRAMA",
      quote: "雨从山上一直流到山下，住在低处的人，得自己把水舀出去。"
    },
    {
      id: "film-22",
      douban: "35593344",
      poster: "posters/35593344.jpg",
      title: "Oppenheimer",
      director: "Christopher Nolan",
      year: "2023",
      genre: "DRAMA",
      quote: "看台在踩地板，声音很响，他站在中间，什么也没听见。"
    },
    {
      id: "film-23",
      douban: "1294371",
      poster: "posters/1294371.jpg",
      title: "Modern Times",
      director: "Charlie Chaplin",
      year: "1936",
      genre: "ROMANCE & CLASSIC",
      quote: "传送带越转越快，他越转越小，小到只剩一顶圆礼帽还在动。"
    },
    {
      id: "film-24",
      douban: "1296339",
      poster: "posters/1296339.jpg",
      title: "The Before Trilogy",
      director: "Richard Linklater",
      year: "1995-2013",
      genre: "ROMANCE & CLASSIC",
      quote: "他们每九年见一次，每次都说了很多话，只是越来越不敢停下。"
    }
  ];
})();
