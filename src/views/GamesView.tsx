import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { GAMES, type SectionId } from '../data/collections';
import { filterGames, wrapIndex, type GameEra } from '../utils/collectionLogic';

interface GamesViewProps {
  onNavigate: (section: SectionId) => void;
}

const ERAS: Array<{ id: GameEra; label: string }> = [
  { id: 'ALL', label: '全部典藏' },
  { id: 'FOUNDATIONS', label: '奠基时代 · 1999–2016' },
  { id: 'GOLDEN', label: '黄金年代 · 2018–2020' },
  { id: 'MODERN', label: '当代巨制 · 2021–2025' },
];

export function GamesView({ onNavigate }: GamesViewProps) {
  const [era, setEra] = useState<GameEra>('ALL');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(GAMES[7].id); // RDR2 default spotlight

  const filtered = useMemo(
    () => filterGames(GAMES, era, query),
    [era, query],
  );

  const activeGame = useMemo(
    () =>
      filtered.find((g) => g.id === selectedId) ??
      filtered[0] ??
      GAMES[0],
    [filtered, selectedId],
  );

  const activeIndex = filtered.findIndex((g) => g.id === activeGame.id);

  const stepGame = (delta: number) => {
    if (filtered.length === 0) return;
    const nextIdx = wrapIndex(
      activeIndex >= 0 ? activeIndex : 0,
      delta,
      filtered.length,
    );
    setSelectedId(filtered[nextIdx].id);
  };

  return (
    <div className="min-h-dvh bg-[#0b0c0e] pb-24">
      <SectionHeader
        index="08"
        english="Games"
        title="游戏 · 互动典藏库"
        subtitle="十八款按真实发行编年排列的殿堂级作品。点击下方任意全彩封面即可置入上方主展台。"
        countLabel={`${filtered.length} / ${GAMES.length} 款`}
        onNavigate={onNavigate}
      />

      <div className="mx-auto max-w-[1440px] px-6 pt-8 lg:px-10">
        {/* Monumental Game Spotlight Stage */}
        <section
          aria-label="当前焦点游戏"
          className="relative mb-10 overflow-hidden border border-white/[0.1] bg-[#12151c]"
        >
          <div className="grid grid-cols-1 items-center gap-8 p-7 sm:p-10 lg:grid-cols-12">
            <div className="flex justify-center lg:col-span-4">
              <div className="w-56 overflow-hidden border border-white/[0.14] bg-[#0a0c10] shadow-2xl sm:w-64">
                <img
                  src={activeGame.image}
                  alt={activeGame.alt}
                  referrerPolicy="no-referrer"
                  className="aspect-[3/4] w-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 font-mono-tabular text-xs text-[#d4a853]">
                <span>VAULT #{String(activeGame.rank).padStart(2, '0')}</span>
                <span aria-hidden="true">/</span>
                <span>
                  {activeGame.releaseKind === 'series'
                    ? 'SERIES DEBUT'
                    : 'RELEASED'}
                </span>
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#f5f2ec] sm:text-5xl">
                {activeGame.title}
              </h2>

              <dl className="mt-7 grid max-w-lg grid-cols-2 gap-6 border-y border-white/[0.08] py-5">
                <div>
                  <dt className="font-mono-tabular text-[11px] text-[#7c8290]">
                    {activeGame.releaseKind === 'series'
                      ? '系列首作年份'
                      : '正式发行日期'}
                  </dt>
                  <dd className="mt-1 font-mono-tabular text-sm text-[#efece6]">
                    {activeGame.release}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono-tabular text-[11px] text-[#7c8290]">
                    编年序号
                  </dt>
                  <dd className="mt-1 font-mono-tabular text-sm text-[#efece6]">
                    No. {String(activeGame.rank).padStart(2, '0')} of{' '}
                    {GAMES.length}
                  </dd>
                </div>
              </dl>

              <div className="mt-7 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => stepGame(-1)}
                  className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-md border border-white/[0.14] px-4 text-xs text-[#d8d5ce] transition-colors hover:border-[#d4a853] hover:text-[#d4a853]"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>上一款</span>
                </button>
                <button
                  type="button"
                  onClick={() => stepGame(1)}
                  className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-md border border-white/[0.14] px-4 text-xs text-[#d8d5ce] transition-colors hover:border-[#d4a853] hover:text-[#d4a853]"
                >
                  <span>下一款</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Era Filter + Search */}
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="按发行年代筛选"
            className="flex flex-wrap gap-1.5"
          >
            {ERAS.map((item) => {
              const selected = era === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setEra(item.id)}
                  className={`h-9 cursor-pointer whitespace-nowrap rounded-md px-3.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-[#f2efe9] text-[#0b0c0e]'
                      : 'bg-[#14171d] text-[#a0a5b0] hover:bg-[#1d212a] hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <label className="relative w-full sm:w-56">
            <span className="sr-only">搜索游戏名称</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7c8290]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索游戏名称…"
              className="h-9 w-full rounded-md border border-white/[0.1] bg-[#12141a] pl-9 pr-3 text-xs text-[#f2efe9] placeholder:text-[#6f7582] focus:border-[#d4a853]"
            />
          </label>
        </div>

        {/* Full-Color Vault Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-[#959ba6]">未找到匹配的游戏。</p>
            <button
              type="button"
              onClick={() => {
                setEra('ALL');
                setQuery('');
              }}
              className="mt-4 cursor-pointer text-xs text-[#d4a853] hover:underline"
            >
              重置筛选
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filtered.map((game) => {
              const isSelected = game.id === activeGame.id;
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => setSelectedId(game.id)}
                  aria-pressed={isSelected}
                  className="group flex cursor-pointer flex-col text-left"
                >
                  <div
                    className={`relative aspect-[3/4] w-full overflow-hidden border bg-[#14171e] transition-all ${
                      isSelected
                        ? 'border-[#d4a853] ring-1 ring-[#d4a853]'
                        : 'border-white/[0.08] group-hover:border-white/30'
                    }`}
                  >
                    <img
                      src={game.image}
                      alt={game.alt}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <h3
                    className={`mt-2.5 truncate text-sm font-medium ${
                      isSelected
                        ? 'text-[#d4a853]'
                        : 'text-[#efece6] group-hover:text-white'
                    }`}
                  >
                    {game.title}
                  </h3>
                  <p className="mt-0.5 font-mono-tabular text-[11px] text-[#838996]">
                    #{String(game.rank).padStart(2, '0')} ·{' '}
                    {game.releaseDate.slice(0, 4)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
