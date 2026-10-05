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
      quote: "最珍惜个体真心的人，偏偏生在一个把婚姻、亲情与体面都计入家族账本的世界。"
    },
    {
      id: "series-02",
      douban: "2156663",
      poster: "posters/2156663.jpg",
      title: "西游记",
      years: "1986",
      seasons: "25 集",
      category: "CLASSICS",
      quote: "一路降伏的既有妖魔也有自己的执念，自由的心必须学会与责任同行。"
    },
    {
      id: "series-03",
      douban: "33447642",
      poster: "posters/33447642.jpg",
      title: "沉默的真相",
      years: "2020",
      seasons: "12 集",
      category: "CRIME & MYSTERY",
      quote: "当正义只能靠好人耗尽一生来换取，真相的抵达也成了对沉默者最沉重的质问。"
    },
    {
      id: "series-04",
      douban: "33404425",
      poster: "posters/33404425.jpg",
      title: "隐秘的角落",
      years: "2020",
      seasons: "12 集",
      category: "CRIME & MYSTERY",
      quote: "孩子懂得谎言能让自己被爱，也渐渐发现，讲出真相可能意味着再没有人愿意留下。"
    },
    {
      id: "series-05",
      douban: "35588177",
      poster: "posters/35588177.jpg",
      title: "漫长的季节",
      years: "2023",
      seasons: "12 集",
      category: "CRIME & MYSTERY",
      quote: "时代夺走工作与亲人之后，一个父亲仍困在自责里，迟来的真相让他重新学着向前活。"
    },
    {
      id: "series-06",
      douban: "26883064",
      poster: "posters/26883064.jpg",
      title: "白夜追凶",
      years: "2017",
      seasons: "32 集",
      category: "CRIME & MYSTERY",
      quote: "血缘让两个人替彼此活着，也把查明真相变成一场亲情与自保都无法全身而退的审判。"
    },
    {
      id: "series-07",
      douban: "2373195",
      poster: "posters/2373195.jpg",
      title: "Breaking Bad",
      years: "2008-2013",
      seasons: "5 季",
      category: "CRIME & MYSTERY",
      quote: "他用家人的未来解释每一次越界，直到所有失去都证明，最需要被满足的是自己的骄傲。"
    },
    {
      id: "series-08",
      douban: "25726259",
      poster: "posters/25726259.jpg",
      title: "Better Call Saul",
      years: "2015-2022",
      seasons: "6 季",
      category: "CRIME & MYSTERY",
      quote: "被最亲近的人认定无可救药之后，他把偏见活成身份，又在承担罪责时夺回自己的名字。"
    },
    {
      id: "series-09",
      douban: "10748120",
      poster: "posters/10748120.jpg",
      title: "True Detective",
      years: "2014-2024",
      seasons: "4 季",
      category: "CRIME & MYSTERY",
      quote: "看透人性的腐烂并没有让人免于责任，追问罪恶的人也必须承认自己仍渴望一点光。"
    },
    {
      id: "series-10",
      douban: "26310143",
      poster: "posters/26310143.jpg",
      title: "信号",
      years: "2016",
      seasons: "16 集",
      category: "CRIME & MYSTERY",
      quote: "过去的呼救抵达今天，修正遗憾的机会也逼人承担另一段命运被改变的责任。"
    },
    {
      id: "series-11",
      douban: "26934346",
      poster: "posters/26934346.jpg",
      title: "秘密森林",
      years: "2017-2020",
      seasons: "2 季",
      category: "CRIME & MYSTERY",
      quote: "不肯用人情替证据作解释的人，必须在一个把忠诚当作遮羞布的体系里学会信任。"
    },
    {
      id: "series-12",
      douban: "25754848",
      poster: "posters/25754848.jpg",
      title: "琅琊榜",
      years: "2015",
      seasons: "54 集",
      category: "POWER & HISTORY",
      quote: "他以复仇者的手段归来，却仍想保住正直者相信的秩序，这使每一步算计都带着代价。"
    },
    {
      id: "series-13",
      douban: "25853071",
      poster: "posters/25853071.jpg",
      title: "庆余年",
      years: "2019-2024",
      seasons: "3 季",
      category: "POWER & HISTORY",
      quote: "带着平等观念进入权力世界，最难的是成为赢家以后，仍拒绝把人当作可以交换的筹码。"
    },
    {
      id: "series-14",
      douban: "7054120",
      poster: "posters/7054120.jpg",
      title: "黑镜",
      years: "2011-2023",
      seasons: "6 季",
      category: "SCI-FI & FANTASY",
      quote: "技术把人的欲望照顾得无微不至，也让控制、惩罚与孤独披上了自愿选择的外衣。"
    },
    {
      id: "series-15",
      douban: "26359270",
      poster: "posters/26359270.jpg",
      title: "Stranger Things",
      years: "2016-2025",
      seasons: "5 季",
      category: "SCI-FI & FANTASY",
      quote: "被成人世界当作异类的孩子们，用彼此的信任抵抗恐惧，也守住了成长尚未夺走的亲密。"
    },
    {
      id: "series-16",
      douban: "23011215",
      poster: "posters/23011215.jpg",
      title: "Sense8",
      years: "2015-2018",
      seasons: "2 季",
      category: "SCI-FI & FANTASY",
      quote: "当别人的痛苦能穿过自己的身体，差异不再是隔离的理由，亲密也成为抵抗控制的力量。"
    },
    {
      id: "series-17",
      douban: "32579283",
      poster: "posters/32579283.jpg",
      title: "The Queen's Gambit",
      years: "2020",
      seasons: "7 集",
      category: "SCI-FI & FANTASY",
      quote: "她把孤独磨成计算的天赋，却要学会接受帮助，才能不再把每一份靠近都当作软弱。"
    },
    {
      id: "series-18",
      douban: "25698722",
      poster: "posters/25698722.jpg",
      title: "来自星星的你",
      years: "2013",
      seasons: "21 集",
      category: "SCI-FI & FANTASY",
      quote: "漫长的生命让他习惯旁观，爱却让永恒第一次有了代价，也让短暂的人生变得无法替代。"
    },
    {
      id: "series-19",
      douban: "24702659",
      poster: "posters/24702659.jpg",
      title: "听见你的声音",
      years: "2013",
      seasons: "18 集",
      category: "SCI-FI & FANTASY",
      quote: "听见心声并不等于懂得一个人，当复仇足够有理由，拒绝让恨替自己作主才最艰难。"
    },
    {
      id: "series-20",
      douban: "26761935",
      poster: "posters/26761935.jpg",
      title: "孤单又灿烂的神：鬼怪",
      years: "2016",
      seasons: "16 集",
      category: "SCI-FI & FANTASY",
      quote: "永生把失去变成无休止的惩罚，爱让他重新想活，也让他终于有勇气面对生命的终点。"
    },
    {
      id: "series-21",
      douban: "26727298",
      poster: "posters/26727298.jpg",
      title: "W-两个世界",
      years: "2016",
      seasons: "16 集",
      category: "SCI-FI & FANTASY",
      quote: "当角色知道人生由别人执笔，爱与自由意志便一起追问：谁有权替真实的生命安排结局。"
    },
    {
      id: "series-22",
      douban: "26887064",
      poster: "posters/26887064.jpg",
      title: "当你沉睡时",
      years: "2017",
      seasons: "32 集",
      category: "SCI-FI & FANTASY",
      quote: "预见灾难的人无法再用不知道来宽恕自己，每一次改变未来，都从愿意相信另一个人开始。"
    },
    {
      id: "series-23",
      douban: "3703650",
      poster: "posters/3703650.jpg",
      title: "The Boys",
      years: "2019-2024",
      seasons: "4 季",
      category: "DARK SATIRE",
      quote: "当英雄成为商品，拯救只是权力的广告，而复仇者也不断接近自己最痛恨的模样。"
    },
    {
      id: "series-24",
      douban: "6037429",
      poster: "posters/6037429.jpg",
      title: "House of Cards",
      years: "2013-2018",
      seasons: "6 季",
      category: "DARK SATIRE",
      quote: "权力把信任变成工具，两个最懂彼此的人也只能靠共同的野心维持随时会互相吞噬的亲密。"
    },
    {
      id: "series-25",
      douban: "26813224",
      poster: "posters/26813224.jpg",
      title: "Succession",
      years: "2018-2023",
      seasons: "4 季",
      category: "DARK SATIRE",
      quote: "他们拥有足以买下世界的财富，却仍把父亲的一次认可当作奖赏，在争夺中继承了他的残忍。"
    },
    {
      id: "series-26",
      douban: "1393859",
      poster: "posters/1393859.jpg",
      title: "Friends",
      years: "1994-2004",
      seasons: "10 季",
      category: "FAMILY & LIFE",
      quote: "他们一边学着各自成家，一边保留一个可以承认失败的地方，让友谊承担血缘以外的亲情。"
    },
    {
      id: "series-27",
      douban: "3754382",
      poster: "posters/3754382.jpg",
      title: "Modern Family",
      years: "2009-2020",
      seasons: "11 季",
      category: "FAMILY & LIFE",
      quote: "家人的形状一直在变，固执的人也得练习让步，才能让爱不只是以自己的方式要求别人。"
    },
    {
      id: "series-28",
      douban: "4729738",
      poster: "posters/4729738.jpg",
      title: "Shameless",
      years: "2011-2021",
      seasons: "11 季",
      category: "FAMILY & LIFE",
      quote: "贫穷逼他们用彼此求生，亲情却也索取每个人的未来，离开与留下都难免带着亏欠。"
    },
    {
      id: "series-29",
      douban: "26302614",
      poster: "posters/26302614.jpg",
      title: "请回答1988",
      years: "2015",
      seasons: "20 集",
      category: "FAMILY & LIFE",
      quote: "长大让人拥有选择，也让那些理所当然的陪伴逐一散去，家的温度常常要在离开之后才懂。"
    },
    {
      id: "series-30",
      douban: "27602137",
      poster: "posters/27602137.jpg",
      title: "我的大叔",
      years: "2018",
      seasons: "16 集",
      category: "FAMILY & LIFE",
      quote: "他们认出彼此不愿示人的狼狈，理解便不再是居高临下的拯救，而是允许一个人保有尊严。"
    },
    {
      id: "series-31",
      douban: "30464551",
      poster: "posters/30464551.jpg",
      title: "浪漫的体质",
      years: "2019",
      seasons: "16 集",
      category: "FAMILY & LIFE",
      quote: "把爱情写成故事的人也无法写好自己的生活，失去与狼狈只能靠笑声和朋友一点点容纳。"
    },
    {
      id: "series-32",
      douban: "34660401",
      poster: "posters/34660401.jpg",
      title: "棒球大联盟",
      years: "2019",
      seasons: "16 集",
      category: "FAMILY & LIFE",
      quote: "改变一支习惯失败的球队，要拆掉以感情维系的利益，也要让被当作数字的人重新得到信任。"
    },
    {
      id: "series-33",
      douban: "33464863",
      poster: "posters/33464863.jpg",
      title: "机智医生生活",
      years: "2020-2021",
      seasons: "2 季",
      category: "FAMILY & LIFE",
      quote: "医生可以熟练处理病痛，却无法替人决定离别的重量，朋友让他们在照顾别人时也被照顾。"
    },
    {
      id: "series-34",
      douban: "25831874",
      poster: "posters/25831874.jpg",
      title: "太阳的后裔",
      years: "2016",
      seasons: "16 集",
      category: "ROMANCE & MELO",
      quote: "同样以保护生命为职责的人，却必须接受彼此不同的使命，爱情因此始终与危险和分歧同行。"
    },
    {
      id: "series-35",
      douban: "34861170",
      poster: "posters/34861170.jpg",
      title: "虽然是精神病但没关系",
      years: "2020",
      seasons: "16 集",
      category: "ROMANCE & MELO",
      quote: "一个靠照顾别人隐藏欲望，一个用伤害掩盖孤独，亲密让他们开始承认自己也需要被照顾。"
    },
    {
      id: "series-36",
      douban: "35402776",
      poster: "posters/35402776.jpg",
      title: "那年，我们的夏天",
      years: "2021",
      seasons: "16 集",
      category: "ROMANCE & MELO",
      quote: "重逢让他们看见，当年最深的误解不是爱得不够，而是谁都不敢把自己的不安交给对方。"
    }
  ];
})();
