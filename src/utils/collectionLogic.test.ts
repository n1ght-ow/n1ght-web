import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOOKS,
  FILMS,
  GAMES,
  PAINTINGS,
  PHOTOS,
  POEMS,
  PORTAL_ENTRIES,
  SERIES,
  SPORT_TEAMS,
  APPS,
} from '../data/collections.ts';
import {
  extractStartYear,
  filterAndSortFilms,
  filterAndSortSeries,
  filterBooks,
  filterGames,
  filterPaintings,
  filterPhotos,
  parseSectionFromHash,
  wrapIndex,
} from './collectionLogic.ts';

test('catalogue completeness matches all authentic collections and omits curate', () => {
  assert.equal(PHOTOS.length, 46);
  assert.equal(BOOKS.length, 16);
  assert.equal(POEMS.length, 3);
  assert.equal(PAINTINGS.length, 12);
  assert.equal(SPORT_TEAMS.length, 5);
  assert.equal(SERIES.length, 36);
  assert.equal(FILMS.length, 24);
  assert.equal(GAMES.length, 18);
  assert.equal(APPS.length, 2);
  assert.equal(PORTAL_ENTRIES.length, 10);
  assert.equal(
    PORTAL_ENTRIES.some((entry) => entry.id === ('curate' as string)),
    false,
  );
});

test('parseSectionFromHash resolves valid routes and defaults unknown or curate to home', () => {
  assert.equal(parseSectionFromHash('#photo'), 'photo');
  assert.equal(parseSectionFromHash('#/books'), 'books');
  assert.equal(parseSectionFromHash('#FILMS'), 'films');
  assert.equal(parseSectionFromHash('#curate'), 'home');
  assert.equal(parseSectionFromHash(''), 'home');
  assert.equal(parseSectionFromHash('#nonexistent'), 'home');
});

test('filterPhotos filters by act and search text accurately', () => {
  const nightPhotos = filterPhotos(PHOTOS, 'NIGHT', '');
  assert.equal(nightPhotos.length, 4);
  assert.ok(nightPhotos.every((p) => p.act === 'NIGHT'));

  const shanghai = filterPhotos(PHOTOS, 'ALL', 'shanghai');
  assert.equal(shanghai.length, 1);
  assert.equal(shanghai[0].number, '25');
});

test('filterBooks searches Chinese title, English spine, and author', () => {
  assert.equal(filterBooks(BOOKS, '三体').length, 1);
  assert.equal(filterBooks(BOOKS, 'Camus').length, 1);
  assert.equal(filterBooks(BOOKS, 'Orwell').length, 1);
});

test('filterPaintings filters by artistShort', () => {
  assert.equal(filterPaintings(PAINTINGS, 'Van Gogh').length, 2);
  assert.equal(filterPaintings(PAINTINGS, 'Monet').length, 2);
  assert.equal(filterPaintings(PAINTINGS, 'ALL').length, 12);
});

test('filterAndSortFilms filters by genre, director, and chronological order', () => {
  const nolanFilms = filterAndSortFilms(FILMS, 'ALL', 'Christopher Nolan', '', 'oldest');
  assert.equal(nolanFilms.length, 6);
  assert.equal(nolanFilms[0].year, '2005');
  assert.equal(nolanFilms[nolanFilms.length - 1].year, '2023');

  const sciFi = filterAndSortFilms(FILMS, 'SCI-FI', 'ALL', '', 'newest');
  assert.equal(sciFi.length, 4);
  assert.equal(sciFi[0].title, 'Interstellar');
});

test('filterAndSortSeries filters by category and sorts by year', () => {
  const classics = filterAndSortSeries(SERIES, 'CLASSICS', '', 'oldest');
  assert.equal(classics.length, 2);
  assert.equal(classics[0].title, '西游记');
  assert.equal(classics[1].title, '红楼梦');
});

test('filterGames filters by release era and query', () => {
  const foundations = filterGames(GAMES, 'FOUNDATIONS', '');
  assert.equal(foundations.length, 5);
  const modern = filterGames(GAMES, 'MODERN', '');
  assert.equal(modern.length, 6);
  assert.equal(filterGames(GAMES, 'ALL', 'wukong').length, 1);
});

test('extractStartYear and wrapIndex handle edge cases cleanly', () => {
  assert.equal(extractStartYear('1995-2013'), 1995);
  assert.equal(extractStartYear('2024'), 2024);
  assert.equal(wrapIndex(0, -1, 3), 2);
  assert.equal(wrapIndex(2, 1, 3), 0);
  assert.equal(wrapIndex(0, 1, 0), 0);
});
