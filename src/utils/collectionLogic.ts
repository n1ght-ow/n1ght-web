import type {
  BookItem,
  FilmItem,
  GameItem,
  PaintingItem,
  PhotoItem,
  SectionId,
  SeriesItem,
} from '../data/collections';

export const VALID_SECTIONS: ReadonlyArray<SectionId> = [
  'home',
  'photo',
  'books',
  'poems',
  'paintings',
  'sport',
  'series',
  'films',
  'games',
  'apps',
];

export function parseSectionFromHash(hash: string): SectionId {
  const cleaned = hash.replace(/^#\/?/, '').trim().toLowerCase();
  if ((VALID_SECTIONS as ReadonlyArray<string>).includes(cleaned)) {
    return cleaned as SectionId;
  }
  return 'home';
}

export function extractStartYear(yearRange: string): number {
  const match = yearRange.match(/\d{4}/);
  return match ? Number(match[0]) : 0;
}

export function filterPhotos(
  photos: PhotoItem[],
  act: string,
  query: string,
): PhotoItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  return photos.filter((photo) => {
    if (act !== 'ALL' && photo.act !== act) return false;
    if (!normalizedQuery) return true;
    return (
      photo.caption.toLowerCase().includes(normalizedQuery) ||
      photo.alt.toLowerCase().includes(normalizedQuery) ||
      photo.act.toLowerCase().includes(normalizedQuery) ||
      photo.number.includes(normalizedQuery)
    );
  });
}

export function filterBooks(books: BookItem[], query: string): BookItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return books;
  return books.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.spine.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.blurb.toLowerCase().includes(q),
  );
}

export function filterPaintings(
  paintings: PaintingItem[],
  artistFilter: string,
): PaintingItem[] {
  if (artistFilter === 'ALL') return paintings;
  return paintings.filter((p) => p.artistShort === artistFilter);
}

export type SortMode = 'curated' | 'newest' | 'oldest';

export function filterAndSortSeries(
  series: SeriesItem[],
  category: string,
  query: string,
  sortMode: SortMode,
): SeriesItem[] {
  const q = query.trim().toLowerCase();
  const filtered = series.filter((item) => {
    if (category !== 'ALL' && item.category !== category) return false;
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.quote.toLowerCase().includes(q) ||
      item.years.toLowerCase().includes(q)
    );
  });

  if (sortMode === 'curated') return filtered;
  return [...filtered].sort((a, b) => {
    const diff = extractStartYear(a.years) - extractStartYear(b.years);
    return sortMode === 'newest' ? -diff : diff;
  });
}

export function filterAndSortFilms(
  films: FilmItem[],
  genre: string,
  director: string,
  query: string,
  sortMode: SortMode,
): FilmItem[] {
  const q = query.trim().toLowerCase();
  const filtered = films.filter((film) => {
    if (genre !== 'ALL' && film.genre !== genre) return false;
    if (director !== 'ALL' && !film.director.includes(director)) return false;
    if (!q) return true;
    return (
      film.title.toLowerCase().includes(q) ||
      film.director.toLowerCase().includes(q) ||
      film.quote.toLowerCase().includes(q) ||
      film.year.includes(q)
    );
  });

  if (sortMode === 'curated') return filtered;
  return [...filtered].sort((a, b) => {
    const diff = extractStartYear(a.year) - extractStartYear(b.year);
    return sortMode === 'newest' ? -diff : diff;
  });
}

export type GameEra = 'ALL' | 'FOUNDATIONS' | 'GOLDEN' | 'MODERN';

export function filterGames(
  games: GameItem[],
  era: GameEra,
  query: string,
): GameItem[] {
  const q = query.trim().toLowerCase();
  return games.filter((game) => {
    const year = extractStartYear(game.releaseDate);
    if (era === 'FOUNDATIONS' && year > 2016) return false;
    if (era === 'GOLDEN' && (year < 2018 || year > 2020)) return false;
    if (era === 'MODERN' && year < 2021) return false;
    if (!q) return true;
    return (
      game.title.toLowerCase().includes(q) ||
      game.release.toLowerCase().includes(q)
    );
  });
}

export function wrapIndex(current: number, step: number, length: number): number {
  if (length <= 0) return 0;
  return ((current + step) % length + length) % length;
}
