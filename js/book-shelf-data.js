(function () {
  "use strict";

  /* What is on the shelf.

     Fifteen upright and one leaning, because a shelf with room left in it
     always has one. Thickness and height are what make a row of spines read
     as a shelf rather than as a bar chart, and no two neighbours share a
     cloth. Every ink clears 4.5:1 on the cloth it is printed on - measured,
     not estimated; the pairings run 5.05:1 (sage) to 12.59:1 (charcoal).

     Two titles each, and that is the point of the shelf: `spine` is what is
     printed down the back, `title` is what is printed on the cover and read
     out once the book is out of the row. A spine is the one face of a book
     that has to survive being a 21px strip, so it carries the short form;
     the cover has room for the name the book is actually known by. The
     collection's own note and the author are Chinese either way. */
  window.BOOK_SHELF = [
    {
      id: "three-body",
      spine: "The Three-Body Problem", title: "三体", author: "刘慈欣",
      blurb: "我们朝黑暗里喊了一声，才听见整片森林早就屏住了呼吸。",
      thickness: 39, height: 278, lean: 0,
      cloth: "#2f4858", ink: "#f2ece0", band: "#c8a24a",
    },
    {
      id: "stranger",
      spine: "The Stranger", title: "局外人", author: "加缪",
      blurb: "太阳太亮了，亮到他连一滴该流的眼泪都挤不出来。",
      thickness: 24, height: 254, lean: 0,
      cloth: "#8a3b34", ink: "#f6ece4", band: "#e0c07a",
    },
    {
      id: "notre-dame",
      spine: "Notre-Dame de Paris", title: "巴黎圣母院", author: "雨果",
      blurb: "钟楼收留了一个太丑的人，教堂替他挡住了整座城市的眼睛。",
      thickness: 48, height: 288, lean: 0,
      cloth: "#c7a233", ink: "#2b2618", band: "#8a3b34",
    },
    {
      id: "to-live",
      spine: "To Live", title: "活着", author: "余华",
      blurb: "日子一件一件从他手里拿走，他一件一件地接着过。",
      thickness: 30, height: 245, lean: 0,
      cloth: "#1f4b52", ink: "#eef0e9", band: "#d08a4a",
    },
    {
      id: "steel",
      spine: "How the Steel Was Tempered", title: "钢铁是怎样炼成的", author: "奥斯特洛夫斯基",
      blurb: "他把一辈子折进一句话里，那句话后来比他活得久。",
      thickness: 21, height: 266, lean: 0,
      cloth: "#7d2f2a", ink: "#f4e9d8", band: "#e0c07a",
    },
    {
      id: "fortress",
      spine: "Fortress Besieged", title: "围城", author: "钱钟书",
      blurb: "城里的人想出去，城外的人想进来，墙一直在原地不动。",
      thickness: 41, height: 252, lean: 0,
      cloth: "#5f6b4a", ink: "#f2f2e6", band: "#3b6b6b",
    },
    {
      id: "gatsby",
      spine: "The Great Gatsby", title: "了不起的盖茨比", author: "菲茨杰拉德",
      blurb: "他隔着海湾去够对岸那盏绿灯，够了很多年，灯一直那么小。",
      thickness: 26, height: 273, lean: 0,
      cloth: "#22304a", ink: "#e9eef5", band: "#c8a24a",
    },
    {
      id: "ming",
      spine: "Ming Dynasty", title: "明朝那些事儿", author: "当年明月",
      blurb: "史书上那些冷名字，被他写得会饿、会怕、会犯错。",
      thickness: 33, height: 248, lean: 0,
      cloth: "#8c4a1f", ink: "#f6ecdc", band: "#e8cfa0",
    },
    {
      id: "ordinary",
      spine: "Ordinary World", title: "平凡的世界", author: "路遥",
      blurb: "白天搬砖，晚上把书从枕头底下摸出来，就着一盏灯看。",
      thickness: 45, height: 284, lean: 0,
      cloth: "#3b3550", ink: "#efe9df", band: "#a9a0c4",
    },
    {
      id: "red-chamber",
      spine: "Dream of the Red Chamber", title: "红楼梦", author: "曹雪芹",
      blurb: "园子最热闹的时候，没人留意它已经开始空了。",
      thickness: 23, height: 258, lean: 0,
      cloth: "#33513f", ink: "#eee7d6", band: "#c9b78b",
    },
    {
      id: "1984",
      spine: "Nineteen Eighty-Four", title: "1984", author: "奥威尔",
      blurb: "屋里唯一不听任何人使唤的，是那块玻璃镇纸。",
      thickness: 36, height: 262, lean: 0,
      cloth: "#6d4a2f", ink: "#f4ece0", band: "#e8cfa0",
    },
    {
      id: "catcher",
      spine: "The Catcher in the Rye", title: "麦田里的守望者", author: "塞林格",
      blurb: "博物馆的玻璃柜一直没变过，他每次进城都去看一眼。",
      thickness: 29, height: 240, lean: 0,
      cloth: "#3a4a63", ink: "#eef1f6", band: "#cbb2d6",
    },
    {
      id: "butterfly",
      spine: "The Butterfly Lovers", title: "梁祝", author: "民间传说",
      blurb: "十八里路送了一遍又一遍，谁也没把那句话说出口。",
      thickness: 22, height: 268, lean: 0,
      cloth: "#4a4f3c", ink: "#f0eee2", band: "#b9b48f",
    },
    {
      id: "dawn",
      spine: "Dawn Blossoms Plucked at Dusk", title: "朝花夕拾", author: "鲁迅",
      blurb: "隔了几十年回头写童年，写得比当时还要清楚。",
      thickness: 34, height: 244, lean: 0,
      cloth: "#5a3f6b", ink: "#f1e9f2", band: "#cbb2d6",
    },
    {
      id: "century",
      spine: "The Century Trilogy", title: "世纪三部曲", author: "肯·福莱特",
      blurb: "同一场战争，有人在客厅里谈，有人在地底下挖。",
      thickness: 44, height: 280, lean: 0,
      cloth: "#1e4034", ink: "#eaf2ea", band: "#b9b48f",
    },
    {
      id: "condor",
      spine: "The Legend of the Condor Heroes", title: "射雕英雄传", author: "金庸",
      blurb: "江南七怪跑进大漠，就为了教一个笨孩子练拳。",
      thickness: 31, height: 246, lean: 9,
      cloth: "#2a2723", ink: "#efece4", band: "#c8a24a",
    },
  ];
})();
