import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutGrid,
  Search,
  X,
} from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { FILMS, type FilmItem, type SectionId } from '../data/collections';
import {
  filterAndSortFilms,
  wrapIndex,
  type SortMode,
} from '../utils/collectionLogic';

interface FilmsViewProps {
  onNavigate: (section: SectionId) => void;
}

const GENRES = [
  { id: 'ALL', label: '全部电影' },
  { id: 'CRIME & NOIR', label: '犯罪黑色' },
  { id: 'SCI-FI', label: '科幻思辨' },
  { id: 'DRAMA', label: '剧情人性' },
  { id: 'ROMANCE & CLASSIC', label: '经典浪漫' },
] as const;

const FEATURED_DIRECTORS = [
  'ALL',
  'Christopher Nolan',
  'Quentin Tarantino',
  'Bong Joon-ho',
] as const;

export function FilmsView({ onNavigate }: FilmsViewProps) {
  const [genre, setGenre] = useState<string>('ALL');
  const [director, setDirector] = useState<string>('ALL');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [spotlightId, setSpotlightId] = useState<string>(FILMS[14].id); // Interstellar default spotlight
  const [modalId, setModalId] = useState<string | null>(null);

  const sortMode: SortMode = viewMode === 'timeline' ? 'oldest' : 'curated';

  const filtered = useMemo(
    () => filterAndSortFilms(FILMS, genre, director, query, sortMode),
    [genre, director, query, sortMode],
  );

  const spotlightFilm = useMemo(
    () =>
      filtered.find((f) => f.id === spotlightId) ??
      filtered[0] ??
      FILMS[0],
    [filtered, spotlightId],
  );

  const modalIndex = modalId
    ? filtered.findIndex((f) => f.id === modalId)
    : -1;
  const modalFilm: FilmItem | null =
    modalIndex >= 0 ? filtered[modalIndex] : null;

  useEffect(() => {
    if (!modalFilm) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalId(null);
      else if (e.key === 'ArrowRight') {
        const next = filtered[wrapIndex(modalIndex, 1, filtered.length)];
        if (next) setModalId(next.id);
      } else if (e.key === 'ArrowLeft') {
        const prev = filtered[wrapIndex(modalIndex, -1, filtered.length)];
        if (prev) setModalId(prev.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalFilm, modalIndex, filtered]);

  return (
    <div className="min-h-dvh bg-[#0b0c0e] pb-24">
      <SectionHeader
        index="07"
        english="Films"
        title="电影 · 私人放映资料馆"
        subtitle="二十四部反复重温的银幕杰作。支持按类型与导演索引，并可切换 1936–2023 影史编年时间轴。"
        countLabel={`${filtered.length} / ${FILMS.length} 部`}
        onNavigate={onNavigate}
      />

      <div className="mx-auto max-w-[1440px] px-6 pt-8 lg:px-10">
        {/* Featured Screening Spotlight */}
        {spotlightFilm && (
          <section
            aria-label="焦点放映电影"
            className="mb-10 grid grid-cols-1 overflow-hidden border border-white/[0.1] bg-[#12151b] lg:grid-cols-12"
          >
            <div className="flex flex-col justify-between p-7 sm:p-10 lg:col-span-8">
              <div>
                <p className="font-mono-tabular text-xs text-[#d4a853]">
                  FEATURED SCREENING · {spotlightFilm.genre} ·{' '}
                  {spotlightFilm.year}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#f5f2ec] sm:text-4xl">
                  {spotlightFilm.title}
                </h2>
                <p className="mt-1.5 text-sm text-[#9ca2ae]">
                  Directed by {spotlightFilm.director}
                </p>
                <blockquote className="mt-6 max-w-2xl font-editorial text-lg leading-relaxed text-[#e3e0d9] sm:text-xl">
                  “{spotlightFilm.quote}”
                </blockquote>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setModalId(spotlightFilm.id)}
                  className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[#f2efe9] px-4 text-xs font-medium text-[#0b0c0e] transition-colors hover:bg-[#d4a853]"
                >
                  <span>打开完整影片档案</span>
                </button>
                <a
                  href={`https://movie.douban.com/subject/${spotlightFilm.douban}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-1.5 text-xs text-[#c7cbd3] hover:text-[#d4a853]"
                >
                  <span>豆瓣条目</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-center bg-[#0a0c10] p-6 lg:col-span-4">
              <img
                src={spotlightFilm.poster}
                alt={`${spotlightFilm.title} poster`}
                referrerPolicy="no-referrer"
                className="h-64 w-auto border border-white/10 object-cover shadow-2xl lg:h-72"
              />
            </div>
          </section>
        )}

        {/* Controls Bar */}
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="电影类型筛选">
            {GENRES.map((g) => {
              const selected = genre === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setGenre(g.id)}
                  className={`h-9 cursor-pointer whitespace-nowrap rounded-md px-3.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-[#f2efe9] text-[#0b0c0e]'
                      : 'bg-[#14171d] text-[#a0a5b0] hover:bg-[#1d212a] hover:text-white'
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center">
              <span className="sr-only">按导演筛选</span>
              <select
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                className="h-9 rounded-md border border-white/[0.1] bg-[#12141a] px-3 text-xs text-[#eae7e1] focus:border-[#d4a853]"
              >
                {FEATURED_DIRECTORS.map((d) => (
                  <option key={d} value={d}>
                    {d === 'ALL' ? '全部导演' : d}
                  </option>
                ))}
              </select>
            </label>

            <label className="relative w-48">
              <span className="sr-only">搜索片名或导演</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7c8290]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索片名或导演…"
                className="h-9 w-full rounded-md border border-white/[0.1] bg-[#12141a] pl-9 pr-3 text-xs text-[#f2efe9] placeholder:text-[#6f7582] focus:border-[#d4a853]"
              />
            </label>

            <div
              role="group"
              aria-label="视图模式"
              className="flex items-center rounded-md border border-white/[0.1] bg-[#12141a] p-0.5"
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded px-2.5 text-xs ${
                  viewMode === 'grid'
                    ? 'bg-white/[0.12] text-white'
                    : 'text-[#8c929e] hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                <span>海报墙</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                aria-pressed={viewMode === 'timeline'}
                className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded px-2.5 text-xs ${
                  viewMode === 'timeline'
                    ? 'bg-white/[0.12] text-white'
                    : 'text-[#8c929e] hover:text-white'
                }`}
              >
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>编年轴</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid vs. Chronological Timeline */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-sm text-[#959ba6]">未找到匹配的影片。</p>
            <button
              type="button"
              onClick={() => {
                setGenre('ALL');
                setDirector('ALL');
                setQuery('');
              }}
              className="mt-4 cursor-pointer text-xs text-[#d4a853] hover:underline"
            >
              重置筛选条件
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filtered.map((film) => (
              <button
                key={film.id}
                type="button"
                onClick={() => {
                  setSpotlightId(film.id);
                  setModalId(film.id);
                }}
                className="group flex cursor-pointer flex-col text-left"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden border border-white/[0.08] bg-[#14171e] transition-colors group-hover:border-[#d4a853]/65">
                  <img
                    src={film.poster}
                    alt={`${film.title} poster`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                </div>
                <h3 className="mt-2.5 truncate text-sm font-medium text-[#efece6] group-hover:text-[#d4a853]">
                  {film.title}
                </h3>
                <p className="mt-0.5 truncate font-mono-tabular text-[11px] text-[#838996]">
                  {film.year} · {film.director}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-8 divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {filtered.map((film) => (
              <button
                key={film.id}
                type="button"
                onClick={() => {
                  setSpotlightId(film.id);
                  setModalId(film.id);
                }}
                className="group grid w-full cursor-pointer grid-cols-1 items-center gap-4 py-5 text-left transition-colors hover:bg-[#13161d] sm:grid-cols-[90px_56px_minmax(0,1fr)_auto] sm:px-4"
              >
                <span className="font-mono-tabular text-sm text-[#d4a853]">
                  {film.year}
                </span>
                <img
                  src={film.poster}
                  alt=""
                  loading="lazy"
                  className="hidden h-20 w-14 border border-white/10 object-cover sm:block"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <h3 className="text-lg font-medium text-[#f2efe9] group-hover:text-[#d4a853]">
                      {film.title}
                    </h3>
                    <span className="text-xs text-[#8f95a2]">
                      {film.director}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 font-editorial text-sm text-[#b2b7c2]">
                    {film.quote}
                  </p>
                </div>
                <span className="font-mono-tabular text-[11px] text-[#7c8290]">
                  {film.genre}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Film Dossier Modal */}
      {modalFilm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`电影档案：${modalFilm.title}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#060709]/92 p-4 sm:p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalId(null);
          }}
        >
          <div className="relative grid w-full max-w-3xl grid-cols-1 overflow-hidden border border-white/[0.12] bg-[#12151c] shadow-2xl sm:grid-cols-12">
            <button
              type="button"
              onClick={() => setModalId(null)}
              aria-label="关闭电影档案"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-black/55 text-[#d8d5ce] hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="bg-[#0b0d11] sm:col-span-5">
              <img
                src={modalFilm.poster}
                alt={`${modalFilm.title} poster`}
                referrerPolicy="no-referrer"
                className="h-full max-h-[420px] w-full object-cover sm:max-h-none"
              />
            </div>

            <div className="flex flex-col justify-between p-7 sm:col-span-7 sm:p-9">
              <div>
                <p className="font-mono-tabular text-xs text-[#d4a853]">
                  {modalFilm.genre} · {modalFilm.year}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#f5f2ec] sm:text-3xl">
                  {modalFilm.title}
                </h2>
                <p className="mt-1.5 text-sm text-[#9ca2ae]">
                  {modalFilm.director}
                </p>

                <blockquote className="mt-7 border-t border-white/[0.08] pt-6 font-editorial text-base leading-relaxed text-[#e0ddd6]">
                  “{modalFilm.quote}”
                </blockquote>

                <a
                  href={`https://movie.douban.com/subject/${modalFilm.douban}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex h-10 items-center gap-1.5 rounded-md border border-white/[0.14] px-4 text-xs font-medium text-[#f2efe9] transition-colors hover:border-[#d4a853] hover:text-[#d4a853]"
                >
                  <span>前往豆瓣条目</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-white/[0.08] pt-5">
                <button
                  type="button"
                  onClick={() => {
                    const prev =
                      filtered[wrapIndex(modalIndex, -1, filtered.length)];
                    if (prev) setModalId(prev.id);
                  }}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 text-xs text-[#b0b5c0] hover:text-[#d4a853]"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>上一部</span>
                </button>
                <span className="font-mono-tabular text-xs text-[#7d8390]">
                  {String(modalIndex + 1).padStart(2, '0')} /{' '}
                  {String(filtered.length).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next =
                      filtered[wrapIndex(modalIndex, 1, filtered.length)];
                    if (next) setModalId(next.id);
                  }}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 text-xs text-[#b0b5c0] hover:text-[#d4a853]"
                >
                  <span>下一部</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
