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
      quote: "他以守护家人为名接过权力，终于让家成为所有人都无法自由离开的地方。"
    },
    {
      id: "film-02",
      douban: "1291832",
      poster: "posters/1291832.jpg",
      title: "Pulp Fiction",
      director: "Quentin Tarantino",
      year: "1994",
      genre: "CRIME & NOIR",
      quote: "暴力把人活成可替换的角色，偶然的一次幸存，却让有人开始追问自己能否换一种活法。"
    },
    {
      id: "film-03",
      douban: "1292348",
      poster: "posters/1292348.jpg",
      title: "L.A. Confidential",
      director: "Curtis Hanson",
      year: "1997",
      genre: "CRIME & NOIR",
      quote: "警徽既替欲望遮羞，也让三个各有污点的人不得不为正义支付自己的代价。"
    },
    {
      id: "film-04",
      douban: "1307914",
      poster: "posters/1307914.jpg",
      title: "无间道",
      director: "刘伟强、麦兆辉",
      year: "2002",
      genre: "CRIME & NOIR",
      quote: "身份可以被交换，良心却无法移交，最深的惩罚是活着也得不到成为好人的证明。"
    },
    {
      id: "film-05",
      douban: "1300299",
      poster: "posters/1300299.jpg",
      title: "Memories of Murder",
      director: "Bong Joon-ho",
      year: "2003",
      genre: "CRIME & NOIR",
      quote: "当暴力比证据更快抵达答案，追凶的人也成了那个时代无法洗清的嫌疑人。"
    },
    {
      id: "film-06",
      douban: "1291580",
      poster: "posters/1291580.jpg",
      title: "Kill Bill",
      director: "Quentin Tarantino",
      year: "2003",
      genre: "CRIME & NOIR",
      quote: "复仇替被剥夺的人夺回名字，却必须面对一个问题：杀尽过去之后，还能为谁活着。"
    },
    {
      id: "film-07",
      douban: "1309069",
      poster: "posters/1309069.jpg",
      title: "Batman Begins",
      director: "Christopher Nolan",
      year: "2005",
      genre: "CRIME & NOIR",
      quote: "把恐惧变成象征的人，必须先分清惩罚罪恶的快感与守护他人的责任。"
    },
    {
      id: "film-08",
      douban: "1857099",
      poster: "posters/1857099.jpg",
      title: "No Country for Old Men",
      director: "Ethan Coen / Joel Coen",
      year: "2007",
      genre: "CRIME & NOIR",
      quote: "他坚信世界正在变坏，最难承认的却是暴力从未答应服从他熟悉的道理。"
    },
    {
      id: "film-09",
      douban: "1851857",
      poster: "posters/1851857.jpg",
      title: "The Dark Knight",
      director: "Christopher Nolan",
      year: "2008",
      genre: "CRIME & NOIR",
      quote: "当城市需要一个无瑕的英雄，守护它的人是否还拥有说出真相的自由。"
    },
    {
      id: "film-10",
      douban: "2334904",
      poster: "posters/2334904.jpg",
      title: "Shutter Island",
      director: "Martin Scorsese",
      year: "2010",
      genre: "CRIME & NOIR",
      quote: "为了继续把自己当成好人，他造出一个世界，而醒来意味着亲手拆掉唯一的庇护。"
    },
    {
      id: "film-11",
      douban: "3395373",
      poster: "posters/3395373.jpg",
      title: "The Dark Knight Rises",
      director: "Christopher Nolan",
      year: "2012",
      genre: "CRIME & NOIR",
      quote: "救世的身份让他忘了如何生活，真正的归来，是允许城市与自己都不再依赖那个神话。"
    },
    {
      id: "film-12",
      douban: "1292233",
      poster: "posters/1292233.jpg",
      title: "A Clockwork Orange",
      director: "Stanley Kubrick",
      year: "1971",
      genre: "SCI-FI",
      quote: "一个被强行剥夺作恶能力的人，究竟获得了善良，还是失去了作为人的最后自由。"
    },
    {
      id: "film-13",
      douban: "1291843",
      poster: "posters/1291843.jpg",
      title: "The Matrix",
      director: "Lana Wachowski / Lilly Wachowski",
      year: "1999",
      genre: "SCI-FI",
      quote: "舒适的幻觉要求人交出选择，而自由最残酷的诚意，是允许你看见自己不愿承受的真实。"
    },
    {
      id: "film-14",
      douban: "3541415",
      poster: "posters/3541415.jpg",
      title: "Inception",
      director: "Christopher Nolan",
      year: "2010",
      genre: "SCI-FI",
      quote: "能潜入别人的意识，却无法说服自己放过过去，最牢固的囚笼是被误认成爱情的愧疚。"
    },
    {
      id: "film-15",
      douban: "1889243",
      poster: "posters/1889243.jpg",
      title: "Interstellar",
      director: "Christopher Nolan",
      year: "2014",
      genre: "SCI-FI",
      quote: "为人类的未来离开女儿，却只能以一个父亲最私人的牵挂寻找回去的路。"
    },
    {
      id: "film-16",
      douban: "1292063",
      poster: "posters/1292063.jpg",
      title: "Life Is Beautiful",
      director: "Roberto Benigni",
      year: "1997",
      genre: "DRAMA",
      quote: "父亲把谎言变成最后的保护，让孩子在没有尊严的世界里仍保有选择相信的能力。"
    },
    {
      id: "film-17",
      douban: "1300374",
      poster: "posters/1300374.jpg",
      title: "The Green Mile",
      director: "Frank Darabont",
      year: "1999",
      genre: "DRAMA",
      quote: "法律可以按时完成处决，却没有办法让执行的人卸下亲手毁掉善良的重量。"
    },
    {
      id: "film-18",
      douban: "6879185",
      poster: "posters/6879185.jpg",
      title: "12 Years a Slave",
      director: "Steve McQueen",
      year: "2013",
      genre: "DRAMA",
      quote: "当整个社会把一个人写成财产，他坚持的不只是回家，更是没有谁能替他定义自己。"
    },
    {
      id: "film-19",
      douban: "25773932",
      poster: "posters/25773932.jpg",
      title: "Whiplash",
      director: "Damien Chazelle",
      year: "2014",
      genre: "DRAMA",
      quote: "他把被摧毁当作成为伟大的代价，掌声越响，越难辨认那一刻究竟是谁赢了。"
    },
    {
      id: "film-20",
      douban: "27119724",
      poster: "posters/27119724.jpg",
      title: "Joker",
      director: "Todd Phillips",
      year: "2019",
      genre: "DRAMA",
      quote: "一个渴望被看见的人终于获得注视，代价是让真实的痛苦变成众人消费的暴力符号。"
    },
    {
      id: "film-21",
      douban: "27010768",
      poster: "posters/27010768.jpg",
      title: "Parasite",
      director: "Bong Joon-ho",
      year: "2019",
      genre: "DRAMA",
      quote: "阶级把人隔开，又逼迫最接近的人彼此争夺，连同情也带着居高临下的气味。"
    },
    {
      id: "film-22",
      douban: "35593344",
      poster: "posters/35593344.jpg",
      title: "Oppenheimer",
      director: "Christopher Nolan",
      year: "2023",
      genre: "DRAMA",
      quote: "他能算出毁灭如何发生，却算不清一个发明者应该为被释放的力量承担多少责任。"
    },
    {
      id: "film-23",
      douban: "1294371",
      poster: "posters/1294371.jpg",
      title: "Modern Times",
      director: "Charlie Chaplin",
      year: "1936",
      genre: "ROMANCE & CLASSIC",
      quote: "机器许诺效率，人却连喘息都成了过错，两个没有位置的人仍试着为彼此留下位置。"
    },
    {
      id: "film-24",
      douban: "1296339",
      poster: "posters/1296339.jpg",
      title: "The Before Trilogy",
      director: "Richard Linklater",
      year: "1995-2013",
      genre: "ROMANCE & CLASSIC",
      quote: "相遇可以靠偶然，长久却要一次次面对那个被日常磨损、仍不肯轻易放弃的爱人。"
    }
  ];
})();
