import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { SERIES, type SectionId, type SeriesItem } from '../data/collections';
import {
  filterAndSortSeries,
  wrapIndex,
  type SortMode,
} from '../utils/collectionLogic';

interface SeriesViewProps {
  onNavigate: (section: SectionId) => void;
}

const CATEGORIES = [
  { id: 'ALL', label: '全部剧集' },
  { id: 'CLASSICS', label: '经典传世' },
  { id: 'CRIME & MYSTERY', label: '悬疑罪案' },
  { id: 'POWER & HISTORY', label: '权谋历史' },
  { id: 'SCI-FI & FANTASY', label: '科幻奇幻' },
  { id: 'DARK SATIRE', label: '黑色讽刺' },
  { id: 'FAMILY & LIFE', label: '家庭人生' },
  { id: 'ROMANCE & MELO', label: '浪漫情感' },
] as const;

export function SeriesView({ onNavigate }: SeriesViewProps) {
  const [category, setCategory] = useState<string>('ALL');
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('curated');
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterAndSortSeries(SERIES, category, query, sortMode),
    [category, query, sortMode],
  );

  const activeIndex = activeId
    ? filtered.findIndex((s) => s.id === activeId)
    : -1;
  const activeSeries: SeriesItem | null =
    activeIndex >= 0 ? filtered[activeIndex] : null;

  useEffect(() => {
    if (!activeSeries) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveId(null);
      else if (e.key === 'ArrowRight') {
        const next = filtered[wrapIndex(activeIndex, 1, filtered.length)];
        if (next) setActiveId(next.id);
      } else if (e.key === 'ArrowLeft') {
        const prev = filtered[wrapIndex(activeIndex, -1, filtered.length)];
        if (prev) setActiveId(prev.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSeries, activeIndex, filtered]);

  return (
    <div className="min-h-dvh bg-[#0b0c0e] pb-24">
      <SectionHeader
        index="06"
        english="Series"
        title="剧集 · 长篇叙事档案"
        subtitle="三十六部跨越年代与类型的剧集海报墙。按氛围筛选或检索关键词，点击开启观影题记与豆瓣档案。"
        countLabel={`${filtered.length} / ${SERIES.length} 部`}
        onNavigate={onNavigate}
      />

      <div className="mx-auto max-w-[1440px] px-6 pt-8 lg:px-10">
        {/* Filter + Search + Sort Bar */}
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 xl:flex-row xl:items-center xl:justify-between">
          <div
            role="tablist"
            aria-label="剧集类型筛选"
            className="flex flex-wrap gap-1.5"
          >
            {CATEGORIES.map((cat) => {
              const selected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setCategory(cat.id)}
                  className={`h-9 cursor-pointer whitespace-nowrap rounded-md px-3.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-[#f2efe9] text-[#0b0c0e]'
                      : 'bg-[#14171d] text-[#a0a5b0] hover:bg-[#1d212a] hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative flex-1 sm:w-52 sm:flex-none">
              <span className="sr-only">搜索剧名或题记</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7c8290]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索剧集名称…"
                className="h-9 w-full rounded-md border border-white/[0.1] bg-[#12141a] pl-9 pr-3 text-xs text-[#f2efe9] placeholder:text-[#6f7582] focus:border-[#d4a853]"
              />
            </label>

            <label className="flex items-center gap-2 text-xs text-[#8f95a2]">
              <span className="sr-only">排序方式</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="h-9 rounded-md border border-white/[0.1] bg-[#12141a] px-3 text-xs text-[#eae7e1] focus:border-[#d4a853]"
              >
                <option value="curated">精选序</option>
                <option value="newest">年份由新到旧</option>
                <option value="oldest">年份由旧到新</option>
              </select>
            </label>
          </div>
        </div>

        {/* Poster Matrix */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-sm text-[#959ba6]">未找到匹配的剧集。</p>
            <button
              type="button"
              onClick={() => {
                setCategory('ALL');
                setQuery('');
              }}
              className="mt-4 cursor-pointer text-xs text-[#d4a853] hover:underline"
            >
              重置筛选
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className="group flex cursor-pointer flex-col text-left"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden border border-white/[0.08] bg-[#14171e] transition-colors group-hover:border-[#d4a853]/65">
                  <img
                    src={item.poster}
                    alt={`${item.title} poster`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                </div>
                <h2 className="mt-2.5 truncate text-sm font-medium text-[#efece6] group-hover:text-[#d4a853]">
                  {item.title}
                </h2>
                <p className="mt-0.5 font-mono-tabular text-[11px] text-[#838996]">
                  {item.years} · {item.seasons}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Screening Dossier Modal */}
      {activeSeries && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`剧集详情：${activeSeries.title}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#060709]/92 p-4 sm:p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveId(null);
          }}
        >
          <div className="relative grid w-full max-w-3xl grid-cols-1 overflow-hidden border border-white/[0.12] bg-[#12151c] shadow-2xl sm:grid-cols-12">
            <button
              type="button"
              onClick={() => setActiveId(null)}
              aria-label="关闭剧集详情"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-black/55 text-[#d8d5ce] hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="bg-[#0b0d11] sm:col-span-5">
              <img
                src={activeSeries.poster}
                alt={`${activeSeries.title} poster`}
                referrerPolicy="no-referrer"
                className="h-full max-h-[420px] w-full object-cover sm:max-h-none"
              />
            </div>

            <div className="flex flex-col justify-between p-7 sm:col-span-7 sm:p-9">
              <div>
                <p className="font-mono-tabular text-xs text-[#d4a853]">
                  {activeSeries.category}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#f5f2ec] sm:text-3xl">
                  {activeSeries.title}
                </h2>
                <p className="mt-1.5 font-mono-tabular text-xs text-[#9197a4]">
                  {activeSeries.years} · {activeSeries.seasons}
                </p>

                <blockquote className="mt-7 border-t border-white/[0.08] pt-6 font-editorial text-base leading-relaxed text-[#e0ddd6]">
                  “{activeSeries.quote}”
                </blockquote>

                <a
                  href={`https://movie.douban.com/subject/${activeSeries.douban}/`}
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
                      filtered[wrapIndex(activeIndex, -1, filtered.length)];
                    if (prev) setActiveId(prev.id);
                  }}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 text-xs text-[#b0b5c0] hover:text-[#d4a853]"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>上一部</span>
                </button>
                <span className="font-mono-tabular text-xs text-[#7d8390]">
                  {String(activeIndex + 1).padStart(2, '0')} /{' '}
                  {String(filtered.length).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next =
                      filtered[wrapIndex(activeIndex, 1, filtered.length)];
                    if (next) setActiveId(next.id);
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
