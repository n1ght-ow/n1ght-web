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
      spine: "The Three-Body Problem", title: "三体", author: "Liu Cixin",
      blurb: "We called into the dark, only to hear that the whole forest was already holding its breath.",
      thickness: 39, height: 278, lean: 0,
      cloth: "#2f4858", ink: "#f2ece0", band: "#c8a24a",
    },
    {
      id: "stranger",
      spine: "The Stranger", title: "局外人", author: "Albert Camus",
      blurb: "The sun was so bright that even the tears expected of him would not come.",
      thickness: 24, height: 254, lean: 0,
      cloth: "#8a3b34", ink: "#f6ece4", band: "#e0c07a",
    },
    {
      id: "notre-dame",
      spine: "Notre-Dame de Paris", title: "巴黎圣母院", author: "Victor Hugo",
      blurb: "The bell tower sheltered a man the city would not look at kindly. The cathedral stood between him and their eyes.",
      thickness: 34, height: 288, lean: 0,
      cloth: "#c7a233", ink: "#2b2618", band: "#8a3b34",
    },
    {
      id: "to-live",
      spine: "To Live", title: "活着", author: "Yu Hua",
      blurb: "Life took things from him one by one. He kept living, one day at a time.",
      thickness: 30, height: 245, lean: 0,
      cloth: "#1f4b52", ink: "#eef0e9", band: "#d08a4a",
    },
    {
      id: "steel",
      spine: "How the Steel Was Tempered", title: "钢铁是怎样炼成的", author: "Nikolai Ostrovsky",
      blurb: "He folded a lifetime into a single sentence. The sentence outlived him.",
      thickness: 30, height: 266, lean: 0,
      cloth: "#7d2f2a", ink: "#f4e9d8", band: "#e0c07a",
    },
    {
      id: "fortress",
      spine: "Fortress Besieged", title: "围城", author: "Qian Zhongshu",
      blurb: "Those inside want out; those outside want in. The wall stays where it is.",
      thickness: 41, height: 252, lean: 0,
      cloth: "#5f6b4a", ink: "#f2f2e6", band: "#3b6b6b",
    },
    {
      id: "gatsby",
      spine: "The Great Gatsby", title: "了不起的盖茨比", author: "F. Scott Fitzgerald",
      blurb: "For years he reached across the bay for a green light. It remained so small.",
      thickness: 26, height: 273, lean: 0,
      cloth: "#22304a", ink: "#e9eef5", band: "#c8a24a",
    },
    {
      id: "ming",
      spine: "Ming Dynasty", title: "明朝那些事儿", author: "Dang Nian Ming Yue",
      blurb: "The cold names in history books become people who hunger, fear and make mistakes.",
      thickness: 33, height: 248, lean: 0,
      cloth: "#8c4a1f", ink: "#f6ecdc", band: "#e8cfa0",
    },
    {
      id: "ordinary",
      spine: "Ordinary World", title: "平凡的世界", author: "Lu Yao",
      blurb: "Bricks by day. At night, a book pulled from beneath the pillow and read by a single lamp.",
      thickness: 45, height: 284, lean: 0,
      cloth: "#3b3550", ink: "#efe9df", band: "#a9a0c4",
    },
    {
      id: "red-chamber",
      spine: "Dream of the Red Chamber", title: "红楼梦", author: "Cao Xueqin",
      blurb: "At the garden's busiest hour, no one noticed it had already begun to empty.",
      thickness: 33, height: 258, lean: 0,
      cloth: "#33513f", ink: "#eee7d6", band: "#c9b78b",
    },
    {
      id: "1984",
      spine: "Nineteen Eighty-Four", title: "1984", author: "George Orwell",
      blurb: "The glass paperweight was the only thing in the room that obeyed no one.",
      thickness: 36, height: 262, lean: 0,
      cloth: "#6d4a2f", ink: "#f4ece0", band: "#e8cfa0",
    },
    {
      id: "catcher",
      spine: "The Catcher in the Rye", title: "麦田里的守望者", author: "J. D. Salinger",
      blurb: "The museum's glass cases never changed. He went back to look whenever he came to the city.",
      thickness: 29, height: 240, lean: 0,
      cloth: "#3a4a63", ink: "#eef1f6", band: "#cbb2d6",
    },
    {
      id: "butterfly",
      spine: "The Butterfly Lovers", title: "梁祝", author: "Chinese folklore",
      blurb: "The same long road, walked together again and again. Neither said the words aloud.",
      thickness: 22, height: 268, lean: 0,
      cloth: "#4a4f3c", ink: "#f0eee2", band: "#b9b48f",
    },
    {
      id: "dawn",
      spine: "Dawn Blossoms Plucked at Dusk", title: "朝花夕拾", author: "Lu Xun",
      blurb: "Decades later, childhood returned to the page more clearly than it had been lived.",
      thickness: 34, height: 244, lean: 0,
      cloth: "#5a3f6b", ink: "#f1e9f2", band: "#cbb2d6",
    },
    {
      id: "century",
      spine: "The Century Trilogy", title: "世纪三部曲", author: "Ken Follett",
      blurb: "In the same war, some talk in drawing rooms. Others dig beneath the earth.",
      thickness: 44, height: 280, lean: 0,
      cloth: "#1e4034", ink: "#eaf2ea", band: "#b9b48f",
    },
    {
      id: "condor",
      spine: "The Legend of the Condor Heroes", title: "射雕英雄传", author: "Jin Yong",
      blurb: "Seven masters crossed into the desert to teach one slow learner how to fight.",
      thickness: 42, height: 246, lean: 9,
      cloth: "#2a2723", ink: "#efece4", band: "#c8a24a",
    },
  ];
})();
