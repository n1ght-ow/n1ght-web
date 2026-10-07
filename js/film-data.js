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
      quote: "He takes power to protect his family, then turns home into a place no one can freely leave."
    },
    {
      id: "film-02",
      douban: "1291832",
      poster: "posters/1291832.jpg",
      title: "Pulp Fiction",
      director: "Quentin Tarantino",
      year: "1994",
      genre: "CRIME & NOIR",
      quote: "Violence makes people interchangeable. One accidental survival opens the question of living differently."
    },
    {
      id: "film-03",
      douban: "1292348",
      poster: "posters/1292348.jpg",
      title: "L.A. Confidential",
      director: "Curtis Hanson",
      year: "1997",
      genre: "CRIME & NOIR",
      quote: "The badge conceals desire, yet makes three flawed men pay their own price for justice."
    },
    {
      id: "film-04",
      douban: "1307914",
      poster: "posters/1307914.jpg",
      title: "无间道",
      director: "Andrew Lau / Alan Mak",
      year: "2002",
      genre: "CRIME & NOIR",
      quote: "Identities can change hands; conscience cannot. The deepest punishment is living without proof that you are good."
    },
    {
      id: "film-05",
      douban: "1300299",
      poster: "posters/1300299.jpg",
      title: "Memories of Murder",
      director: "Bong Joon-ho",
      year: "2003",
      genre: "CRIME & NOIR",
      quote: "When violence reaches an answer before evidence does, the hunters become suspects their era cannot clear."
    },
    {
      id: "film-06",
      douban: "1291580",
      poster: "posters/1291580.jpg",
      title: "Kill Bill",
      director: "Quentin Tarantino",
      year: "2003",
      genre: "CRIME & NOIR",
      quote: "Revenge gives the dispossessed their names back. Once the past is dead, who is left to live for?"
    },
    {
      id: "film-07",
      douban: "1309069",
      poster: "posters/1309069.jpg",
      title: "Batman Begins",
      director: "Christopher Nolan",
      year: "2005",
      genre: "CRIME & NOIR",
      quote: "Before making fear a symbol, he must separate the pleasure of punishment from the duty of protection."
    },
    {
      id: "film-08",
      douban: "1857099",
      poster: "posters/1857099.jpg",
      title: "No Country for Old Men",
      director: "Ethan Coen / Joel Coen",
      year: "2007",
      genre: "CRIME & NOIR",
      quote: "He believes the world is getting worse. Harder to admit: violence never promised to obey his familiar rules."
    },
    {
      id: "film-09",
      douban: "1851857",
      poster: "posters/1851857.jpg",
      title: "The Dark Knight",
      director: "Christopher Nolan",
      year: "2008",
      genre: "CRIME & NOIR",
      quote: "When a city needs a spotless hero, can its protector still afford to tell the truth?"
    },
    {
      id: "film-10",
      douban: "2334904",
      poster: "posters/2334904.jpg",
      title: "Shutter Island",
      director: "Martin Scorsese",
      year: "2010",
      genre: "CRIME & NOIR",
      quote: "He builds a world to keep believing he is good. Waking means dismantling his only shelter."
    },
    {
      id: "film-11",
      douban: "3395373",
      poster: "posters/3395373.jpg",
      title: "The Dark Knight Rises",
      director: "Christopher Nolan",
      year: "2012",
      genre: "CRIME & NOIR",
      quote: "Being a savior has made him forget how to live. Returning means letting both the city and himself outgrow the myth."
    },
    {
      id: "film-12",
      douban: "1292233",
      poster: "posters/1292233.jpg",
      title: "A Clockwork Orange",
      director: "Stanley Kubrick",
      year: "1971",
      genre: "SCI-FI",
      quote: "If a man is stripped of the ability to do wrong, has he become good, or lost his last human freedom?"
    },
    {
      id: "film-13",
      douban: "1291843",
      poster: "posters/1291843.jpg",
      title: "The Matrix",
      director: "Lana Wachowski / Lilly Wachowski",
      year: "1999",
      genre: "SCI-FI",
      quote: "Comfortable illusion asks you to surrender choice. Freedom lets you see truths you may not wish to bear."
    },
    {
      id: "film-14",
      douban: "3541415",
      poster: "posters/3541415.jpg",
      title: "Inception",
      director: "Christopher Nolan",
      year: "2010",
      genre: "SCI-FI",
      quote: "He can enter other minds but cannot release his own past. Guilt mistaken for love makes the strongest prison."
    },
    {
      id: "film-15",
      douban: "1889243",
      poster: "posters/1889243.jpg",
      title: "Interstellar",
      director: "Christopher Nolan",
      year: "2014",
      genre: "SCI-FI",
      quote: "He leaves his daughter for humanity's future. Only a father's private longing can guide him home."
    },
    {
      id: "film-16",
      douban: "1292063",
      poster: "posters/1292063.jpg",
      title: "Life Is Beautiful",
      director: "Roberto Benigni",
      year: "1997",
      genre: "DRAMA",
      quote: "A father makes a lie his last act of protection, preserving a child's ability to believe in a world without dignity."
    },
    {
      id: "film-17",
      douban: "1300374",
      poster: "posters/1300374.jpg",
      title: "The Green Mile",
      director: "Frank Darabont",
      year: "1999",
      genre: "DRAMA",
      quote: "The law can carry out an execution on time. It cannot lift the weight of destroying goodness from those who do it."
    },
    {
      id: "film-18",
      douban: "6879185",
      poster: "posters/6879185.jpg",
      title: "12 Years a Slave",
      director: "Steve McQueen",
      year: "2013",
      genre: "DRAMA",
      quote: "When society writes a man down as property, his struggle is for home and the right to define himself."
    },
    {
      id: "film-19",
      douban: "25773932",
      poster: "posters/25773932.jpg",
      title: "Whiplash",
      director: "Damien Chazelle",
      year: "2014",
      genre: "DRAMA",
      quote: "He accepts destruction as the price of greatness. The louder the applause, the harder it is to tell who won."
    },
    {
      id: "film-20",
      douban: "27119724",
      poster: "posters/27119724.jpg",
      title: "Joker",
      director: "Todd Phillips",
      year: "2019",
      genre: "DRAMA",
      quote: "A man desperate to be seen finally gets attention, as real suffering becomes a violent symbol for public consumption."
    },
    {
      id: "film-21",
      douban: "27010768",
      poster: "posters/27010768.jpg",
      title: "Parasite",
      director: "Bong Joon-ho",
      year: "2019",
      genre: "DRAMA",
      quote: "Class keeps people apart, then makes those closest compete. Even sympathy carries the scent of looking down."
    },
    {
      id: "film-22",
      douban: "35593344",
      poster: "posters/35593344.jpg",
      title: "Oppenheimer",
      director: "Christopher Nolan",
      year: "2023",
      genre: "DRAMA",
      quote: "He can calculate how destruction happens, but not how much responsibility its inventor must bear."
    },
    {
      id: "film-23",
      douban: "1294371",
      poster: "posters/1294371.jpg",
      title: "Modern Times",
      director: "Charlie Chaplin",
      year: "1936",
      genre: "ROMANCE & CLASSIC",
      quote: "Machines promise efficiency; even breathing becomes a fault. Two people without a place still try to make room for each other."
    },
    {
      id: "film-24",
      douban: "1296339",
      poster: "posters/1296339.jpg",
      title: "The Before Trilogy",
      director: "Richard Linklater",
      year: "1995-2013",
      genre: "ROMANCE & CLASSIC",
      quote: "Chance can bring two people together. Staying means choosing, again and again, the person everyday life has worn down."
    }
  ];
})();
