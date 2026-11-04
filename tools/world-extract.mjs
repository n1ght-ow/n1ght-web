#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceCandidates = [
  "tools/world-source.html",
  ".work/world-rebuild/original-index.html",
  "index.html",
];
const sourceIndex = sourceCandidates
  .map((entry) => path.join(root, entry))
  .find((entry) => fs.existsSync(entry));

if (!sourceIndex) {
  throw new Error("No source index found.");
}

const readText = (file) => fs.readFileSync(path.join(root, file), "utf8");
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const html = fs.readFileSync(sourceIndex, "utf8");

function decodeEntities(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, digits) =>
      String.fromCodePoint(Number.parseInt(digits, 16)),
    )
    .replace(/&#(\d+);/g, (_, digits) =>
      String.fromCodePoint(Number.parseInt(digits, 10)),
    )
    .replace(/&([a-z]+);/gi, (match, name) => named[name] ?? match);
}

function cleanText(value) {
  return decodeEntities(
    String(value)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, ""),
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function attributes(source) {
  const result = {};
  for (const match of source.matchAll(/([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g)) {
    result[match[1]] = decodeEntities(match[2] ?? match[3] ?? "");
  }
  return result;
}

function loadBrowserData(files) {
  const window = {};
  const context = vm.createContext({
    console: { error() {}, log() {}, warn() {} },
    window,
  });
  for (const file of files) {
    vm.runInContext(readText(file), context, { filename: file });
  }
  return window;
}

function extractPhotos(source) {
  const records = [];
  const pattern =
    /<figure class="photo-frame"([^>]*)>([\s\S]*?)<\/figure>/g;
  for (const match of source.matchAll(pattern)) {
    const frameAttributes = attributes(match[1]);
    const body = match[2];
    const imageMatch = body.match(/<img\s+([^>]+)>/i);
    const buttonMatch = body.match(
      /<button class="photo-frame-btn" type="button" aria-label="([^"]+)">/i,
    );
    const captionMatch = body.match(
      /<span class="photo-frame-text">([\s\S]*?)<\/span>/i,
    );
    const numberMatch = body.match(
      /<span class="photo-frame-no mono">([\s\S]*?)<\/span>/i,
    );
    if (!imageMatch) continue;
    const imageAttributes = attributes(imageMatch[1]);
    const index = Number(frameAttributes["data-photo-index"]);
    const original = imageAttributes["data-original"] || "";
    records.push({
      id: `photo-${String(index + 1).padStart(2, "0")}`,
      title: cleanText(numberMatch?.[1] || String(index + 1).padStart(2, "0")),
      subtitle: cleanText(captionMatch?.[1] || imageAttributes.alt || ""),
      text: cleanText(imageAttributes.alt || ""),
      image: imageAttributes["data-full"] || imageAttributes.src || "",
      thumb:
        imageAttributes["data-rail"] || imageAttributes.src || "",
      meta: frameAttributes["data-act"] || "",
      link: "",
      links: [],
      type: "photo",
      originalFields: {
        photoIndex: index,
        act: frameAttributes["data-act"] || "",
        isNew: frameAttributes["data-new"] === "true",
        number: cleanText(numberMatch?.[1] || ""),
        caption: cleanText(captionMatch?.[1] || ""),
        alt: cleanText(imageAttributes.alt || ""),
        ariaLabel: cleanText(buttonMatch?.[1] || ""),
        width: Number(imageAttributes.width) || null,
        height: Number(imageAttributes.height) || null,
        wall: imageAttributes.src || "",
        print: imageAttributes["data-full"] || "",
        original,
      },
    });
  }
  return records;
}

function extractSports(source) {
  const records = [];
  const pattern = /<div class="sport-card">([\s\S]*?)<\/div>/g;
  for (const match of source.matchAll(pattern)) {
    const body = match[1];
    const buttonAttributes = attributes(
      body.match(/<button class="sport-item"([^>]*)>/i)?.[1] || "",
    );
    const images = Array.from(body.matchAll(/<img class="(sport-photo|sport-crest)"([^>]*)>/g));
    const photoAttributes = attributes(
      images.find((image) => image[1] === "sport-photo")?.[2] || "",
    );
    const crestAttributes = attributes(
      images.find((image) => image[1] === "sport-crest")?.[2] || "",
    );
    const name = cleanText(
      body.match(/<span class="sport-name">([\s\S]*?)<\/span>/i)?.[1] || "",
    );
    const honours = cleanText(
      body.match(/<span class="sport-hon"[^>]*>([\s\S]*?)<\/span>/i)?.[1] || "",
    );
    const linkAttributes = attributes(
      body.match(/<a class="sport-link"([^>]*)>/i)?.[1] || "",
    );
    const linkLabel = cleanText(
      body.match(/<a class="sport-link"[^>]*>([\s\S]*?)<\/a>/i)?.[1] || "",
    );
    const [team = name, league = ""] = name.split(/\s+·\s+/, 2);
    const key = buttonAttributes["data-sport"] || `sport-${records.length + 1}`;
    records.push({
      id: key,
      title: team,
      subtitle: league,
      text: honours,
      image: photoAttributes.src || "",
      thumb: photoAttributes.src || "",
      meta: honours,
      link: linkAttributes.href || "",
      links: [
        ...(linkAttributes.href
          ? [
              {
                label: linkLabel || linkAttributes.href,
                url: linkAttributes.href,
                kind: "official",
                newTab: linkAttributes.target === "_blank",
              },
            ]
          : []),
        {
          label: "MyScore",
          url: "myscore/",
          kind: "sports-data",
          newTab: false,
        },
      ],
      type: "sport",
      originalFields: {
        key,
        name,
        team,
        league,
        honours,
        photo: photoAttributes.src || "",
        photoAlt: photoAttributes.alt || "",
        photoPosition: photoAttributes.style || "",
        crest: crestAttributes.src || "",
        officialLabel: linkLabel,
        officialUrl: linkAttributes.href || "",
      },
    });
  }
  return records;
}

function extractGames(source) {
  const records = [];
  const itemPattern =
    /<div class="hof-item"([^>]*)>\s*<div class="hof-img-wrap"><img src="([^"]+)" alt="([^"]*)"[^>]*><\/div>\s*<span class="hof-name">([\s\S]*?)<\/span>\s*<time class="mono hof-release" datetime="([^"]*)">([\s\S]*?)<\/time>\s*<\/div>/g;
  for (const match of source.matchAll(itemPattern)) {
    const itemAttributes = attributes(match[1]);
    const originalId = itemAttributes["data-game"] || `game-${records.length + 1}`;
    const name = cleanText(match[4]);
    const release = cleanText(match[6]);
    const releaseKind = itemAttributes["data-release-kind"] || "title";
    records.push({
      id: originalId,
      title: name,
      subtitle: release,
      text: "",
      image: decodeEntities(match[2]),
      thumb: decodeEntities(match[2]),
      meta: release,
      link: "",
      links: [],
      type: "game",
      originalFields: {
        dataGame: originalId,
        releaseKind,
        releaseDatetime: decodeEntities(match[5]),
        release,
        cover: decodeEntities(match[2]),
        coverAlt: cleanText(match[3]),
      },
    });
  }
  return records;
}

function wordsTitle(record, fallback) {
  return record.title || record.english || fallback;
}

function exposeOriginalFields(item) {
  const originalFields = item.originalFields || {};
  const exposed = { ...originalFields, ...item, originalFields };

  if (exposed.type === "book") {
    // The old shelf used CSS width; thickness is the source geometry.
    exposed.width = exposed.width ?? exposed.thickness;
  }

  if (exposed.type === "photo") {
    exposed.act = exposed.act ?? originalFields.act ?? exposed.meta;
  }

  if (exposed.type === "painting") {
    const sourceRecord = originalFields.sourceRecord || {};
    exposed.width = exposed.width ?? sourceRecord.width;
    exposed.height = exposed.height ?? sourceRecord.height;
  }

  if (exposed.type === "music-track") {
    exposed.group = originalFields.group || null;
    exposed.groupIndex = originalFields.groupIndex;
    exposed.trackIndex = originalFields.trackIndex;
    exposed.playlist = originalFields.group?.playlist || "";
  }

  return exposed;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const data = loadBrowserData([
  "js/film-data.js",
  "js/series-data.js",
  "js/book-shelf-data.js",
  "js/music-data.js",
  "js/poems-data.js",
  "js/paintings-data.js",
  "js/music-covers.js",
]);

const paintingSources = JSON.parse(readText("assets/paintings/sources.json"));
const paintingSourceById = new Map(
  paintingSources.works.map((entry) => [entry.id, entry]),
);

const photos = extractPhotos(html).map((item) => ({
  ...item,
  meta: item.meta || item.originalFields.act,
}));

const books = data.BOOK_SHELF.map((book) => ({
  id: book.id,
  title: book.title,
  subtitle: book.author,
  text: book.blurb,
  image: "",
  thumb: "",
  meta: book.spine,
  link: "",
  links: [],
  type: "book",
  originalFields: { ...book },
}));

const poems = data.POEM_DATA.map((poem) => ({
  id: poem.id,
  title: poem.title,
  subtitle: [poem.author, poem.year].filter(Boolean).join(" · "),
  text: poem.stanzas.map((stanza) => stanza.join("\n")).join("\n\n"),
  image: "",
  thumb: "",
  meta: poem.form || "",
  link: poem.sourceUrl || "",
  links: [
    ...(poem.authorUrl
      ? [
          {
            label: poem.author,
            url: poem.authorUrl,
            kind: "author",
            newTab: true,
          },
        ]
      : []),
    ...(poem.sourceUrl
      ? [
          {
            label: poem.sourceLabel || "Source",
            url: poem.sourceUrl,
            kind: "source",
            newTab: true,
          },
        ]
      : []),
  ],
  type: "poem",
  originalFields: { ...poem },
}));

const paintings = data.PAINTING_DATA.map((painting) => {
  const source = paintingSourceById.get(painting.id);
  return {
    id: painting.id,
    title: painting.title,
    subtitle: painting.english,
    text: painting.note,
    image: painting.image,
    thumb: painting.thumbnail,
    meta: [painting.artist, painting.year, painting.medium, painting.museum]
      .filter(Boolean)
      .join(" · "),
    link: painting.museumUrl || "",
    links: [
      ...(painting.museumUrl
        ? [
            {
              label: painting.museum,
              url: painting.museumUrl,
              kind: "museum",
              newTab: true,
            },
          ]
        : []),
      ...(source?.source
        ? [
            {
              label: "Image & source",
              url: source.source,
              kind: "image-source",
              newTab: true,
            },
          ]
        : []),
    ],
    type: "painting",
    originalFields: {
      ...painting,
      sourceRecord: source || null,
    },
  };
});

const musicGroups = data.MUSIC_DATA.map((group, groupIndex) => ({
  ...group,
  tracks: group.tracks.map((track) => ({ ...track })),
  groupIndex,
  trackCount: group.tracks.length,
  link: `https://music.163.com/#/playlist?id=${group.playlist}`,
}));

const music = data.MUSIC_DATA.flatMap((group, groupIndex) => {
  const { tracks: groupTracks, ...groupMetadata } = group;
  return groupTracks.map((track, trackIndex) => {
    const coverFile = data.MUSIC_COVERS?.[track.id] || "";
    const cover = coverFile ? `album-covers/${coverFile}` : "";
    const thumb = coverFile
      ? `album-covers/thumbs/${coverFile.replace(/\.[^.]+$/, ".webp")}`
      : "";
    const playlistLink = `https://music.163.com/#/playlist?id=${group.playlist}`;
    const songLink = `https://music.163.com/#/song?id=${track.id}`;
    return {
      id: track.id,
      title: track.title,
      subtitle: track.artist,
      text: "",
      image: cover,
      thumb,
      meta: `${group.en} · ${track.artist}`,
      link: songLink,
      links: [
        {
          label: "Open in NetEase",
          url: songLink,
          kind: "listen",
          newTab: true,
        },
        {
          label: `${group.en} playlist`,
          url: playlistLink,
          kind: "playlist",
          newTab: true,
        },
      ],
      type: "music-track",
      originalFields: {
        track,
        groupIndex,
        trackIndex,
        group: groupMetadata,
        coverFile,
      },
    };
  });
});

const series = data.SERIES_DATA.map((entry) => ({
  id: entry.id,
  title: entry.title,
  subtitle: [entry.years, entry.seasons].filter(Boolean).join(" · "),
  text: entry.quote || "",
  image: entry.poster || "",
  thumb: entry.poster || "",
  meta: [entry.category, entry.years, entry.seasons].filter(Boolean).join(" · "),
  link: entry.douban
    ? `https://movie.douban.com/subject/${entry.douban}/`
    : "",
  links: entry.douban
    ? [
        {
          label: "Open on Douban",
          url: `https://movie.douban.com/subject/${entry.douban}/`,
          kind: "catalogue",
          newTab: true,
        },
      ]
    : [],
  type: "series",
  originalFields: { ...entry },
}));

const films = data.FILM_DATA.map((entry) => ({
  id: entry.id,
  title: entry.title,
  subtitle: [entry.director, entry.year].filter(Boolean).join(" · "),
  text: entry.quote || "",
  image: entry.poster || "",
  thumb: entry.poster || "",
  meta: [entry.genre, entry.year, entry.director].filter(Boolean).join(" · "),
  link: entry.douban
    ? `https://movie.douban.com/subject/${entry.douban}/`
    : "",
  links: entry.douban
    ? [
        {
          label: "Open on Douban",
          url: `https://movie.douban.com/subject/${entry.douban}/`,
          kind: "catalogue",
          newTab: true,
        },
      ]
    : [],
  type: "film",
  originalFields: { ...entry },
}));

const sport = extractSports(html);
const games = extractGames(html);

const curateSlots = [
  { id: "photo", label: "Photo 1", accepts: ["photo"] },
  { id: "photo2", label: "Photo 2", accepts: ["photo"] },
  { id: "photo3", label: "Photo 3", accepts: ["photo"] },
  { id: "book", label: "Book", accepts: ["book"] },
  { id: "film", label: "Film", accepts: ["film"] },
  { id: "series", label: "Series", accepts: ["series"] },
  { id: "music", label: "Song", accepts: ["music-track"] },
];

const categories = [
  {
    id: "photo",
    title: "光轨暗房",
    english: "PHOTOGRAPHY",
    description:
      "Branching suspended light rails hold the original photographs; drag the track, focus a print, and inspect it without a decorative overlay.",
    items: photos,
  },
  {
    id: "books",
    title: "重力书库",
    english: "BOOKS",
    description:
      "A radial physical shelf of extruded book spines; extract a volume to read the existing title, author, and note.",
    items: books,
  },
  {
    id: "poems",
    title: "回声井",
    english: "POEMS",
    description:
      "A vertical typographic well and verse ribbons; advance through real poems and read their complete source text.",
    items: poems,
  },
  {
    id: "paintings",
    title: "恒光穹殿",
    english: "PAINTINGS",
    description:
      "Monumental curved niches present the masterworks at correct proportions; orbit, inspect, zoom, and open the museum or image source.",
    items: paintings,
  },
  {
    id: "music",
    title: "声纹反应堆",
    english: "MUSIC",
    description:
      "A concentric vinyl mechanism and kinetic spectral rods; select a real track and open its existing NetEase pages.",
    items: music,
    groups: musicGroups,
  },
  {
    id: "sport",
    title: "竞技观测场",
    english: "SPORT",
    description:
      "A stadium bowl with crests on masts and pitch markings; inspect the five clubs and continue to MyScore.",
    items: sport,
    links: [
      {
        label: "MyScore",
        url: "myscore/",
        kind: "sports-data",
        newTab: false,
      },
    ],
  },
  {
    id: "series",
    title: "连续信号塔",
    english: "SERIES",
    description:
      "A stacked vertical signal structure inspired by seasons; climb or select a series and read its preserved catalogue metadata.",
    items: series,
  },
  {
    id: "films",
    title: "轨道放映厅",
    english: "FILMS",
    description:
      "A swept cinema screen and film frames along a curved dolly; scrub, select, and inspect the projection and source record.",
    items: films,
  },
  {
    id: "games",
    title: "交互试验场",
    english: "GAMES",
    description:
      "Staggered floating platforms and mechanical cartridge pedestals carry the original game covers and release metadata.",
    items: games,
  },
  {
    id: "curate",
    title: "记忆装配坞",
    english: "CURATE",
    description:
      "A seven-slot fabrication rig for three photographs and one book, film, series, and song, with three layouts and a real PNG export.",
    items: [],
    slots: curateSlots,
    curatorSource: {
      types: curateSlots.map((slot) => slot.id),
      layouts: ["gallery", "contact", "night"],
      nameMaxLength: 48,
      bylineMaxLength: 32,
      noteMaxLength: 120,
      draftStorageKey: "night:creation-desk:v1",
      legacyStorageKeys: [
        "night:curator-desk:v1",
        "night:wandering-room:v1",
      ],
    },
  },
];

categories.forEach((category) => {
  category.items = category.items.map(exposeOriginalFields);
});

const expectedCounts = {
  photo: 46,
  books: 16,
  poems: 3,
  paintings: 12,
  music: 534,
  sport: 5,
  series: 36,
  films: 24,
  games: 18,
  curate: 0,
};

assert(categories.length === 10, "Expected exactly ten categories.");
for (const category of categories) {
  assert(
    category.items.length === expectedCounts[category.id],
    `${category.id}: expected ${expectedCounts[category.id]} items, found ${category.items.length}.`,
  );
  const ids = category.items.map((item) => String(item.id));
  assert(new Set(ids).size === ids.length, `${category.id}: duplicate item IDs.`);
}
assert(photos.length === 46, "Photograph extraction failed.");
assert(sport.length === 5, "Sport extraction failed.");
assert(games.length === 18, "Game extraction failed.");
assert(musicGroups.length === 15, "Music group extraction failed.");

const missingMedia = [];
for (const category of categories) {
  for (const item of category.items) {
    for (const key of ["image", "thumb"]) {
      const url = item[key];
      if (!url || /^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith("data:")) {
        continue;
      }
      const local = decodeURIComponent(url.split(/[?#]/, 1)[0]);
      if (!fs.existsSync(path.join(root, local))) {
        missingMedia.push(`${category.id}/${item.id}/${key}: ${url}`);
      }
    }
  }
}
assert(
  missingMedia.length === 0,
  `Missing local media:\n${missingMedia.join("\n")}`,
);

const output = {
  formatVersion: 1,
  source: {
    index: path.relative(root, sourceIndex).replaceAll("\\", "/"),
    indexSha256: sha256(html),
    dataFiles: [
      "js/film-data.js",
      "js/series-data.js",
      "js/book-shelf-data.js",
      "js/music-data.js",
      "js/poems-data.js",
      "js/paintings-data.js",
      "js/music-covers.js",
      "assets/paintings/sources.json",
    ],
  },
  categories,
  services: {
    myscore: {
      title: "MyScore",
      url: "myscore/",
      description:
        "ESPN, 5EPlay, and League of Legends schedules, scores, team data, match details, watch links, and verified player profiles.",
      sourceModules: [
        "myscore/app.mjs",
        "myscore/provider.mjs",
        "myscore/sources.mjs",
        "myscore/presentation.mjs",
        "myscore/reading.css",
      ],
    },
  },
  counts: Object.fromEntries(
    categories.map((category) => [category.id, category.items.length]),
  ),
};

const destination = path.join(root, "assets", "world", "collection.json");
await fsp.mkdir(path.dirname(destination), { recursive: true });
await fsp.writeFile(destination, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      output: path.relative(root, destination).replaceAll("\\", "/"),
      source: output.source.index,
      counts: output.counts,
      musicGroups: musicGroups.length,
      localMediaChecked: categories.reduce(
        (total, category) =>
          total +
          category.items.reduce(
            (subtotal, item) =>
              subtotal +
              Number(Boolean(item.image)) +
              Number(Boolean(item.thumb)),
            0,
          ),
        0,
      ),
    },
    null,
    2,
  ),
);
