import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
} from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import {
  PAINTINGS,
  type PaintingItem,
  type SectionId,
} from '../data/collections';
import { filterPaintings, wrapIndex } from '../utils/collectionLogic';

interface PaintingsViewProps {
  onNavigate: (section: SectionId) => void;
}

type WallTone = 'obsidian' | 'limestone' | 'daylight';

const WALL_STYLES: Record<
  WallTone,
  { label: string; stageBg: string; matBg: string; textClass: string }
> = {
  obsidian: {
    label: '暗室展墙',
    stageBg: 'bg-[#090a0d]',
    matBg: 'bg-[#151820] border-white/10',
    textClass: 'text-[#e5e2dc]',
  },
  limestone: {
    label: '温润石灰',
    stageBg: 'bg-[#e6e0d5]',
    matBg: 'bg-[#f4f0e8] border-black/10',
    textClass: 'text-[#1b1d22]',
  },
  daylight: {
    label: '白昼画廊',
    stageBg: 'bg-[#f6f6f4]',
    matBg: 'bg-white border-black/10',
    textClass: 'text-[#17191d]',
  },
};

export function PaintingsView({ onNavigate }: PaintingsViewProps) {
  const [artistFilter, setArtistFilter] = useState('ALL');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [wallTone, setWallTone] = useState<WallTone>('obsidian');
  const [loupeEnabled, setLoupeEnabled] = useState(false);
  const [loupePos, setLoupePos] = useState<{
    visible: boolean;
    xPct: number;
    yPct: number;
    px: number;
    py: number;
  }>({ visible: false, xPct: 50, yPct: 50, px: 0, py: 0 });

  const artists = useMemo(() => {
    const unique = Array.from(new Set(PAINTINGS.map((p) => p.artistShort)));
    return ['ALL', ...unique];
  }, []);

  const filtered = useMemo(
    () => filterPaintings(PAINTINGS, artistFilter),
    [artistFilter],
  );

  const activeIndex = activeId
    ? filtered.findIndex((p) => p.id === activeId)
    : -1;
  const activePainting: PaintingItem | null =
    activeIndex >= 0 ? filtered[activeIndex] : null;

  useEffect(() => {
    if (!activePainting) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveId(null);
      } else if (e.key === 'ArrowRight') {
        const next = filtered[wrapIndex(activeIndex, 1, filtered.length)];
        if (next) setActiveId(next.id);
      } else if (e.key === 'ArrowLeft') {
        const prev = filtered[wrapIndex(activeIndex, -1, filtered.length)];
        if (prev) setActiveId(prev.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePainting, activeIndex, filtered]);

  const handleLoupeMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!loupeEnabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, (px / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (py / rect.height) * 100));
    setLoupePos({ visible: true, xPct, yPct, px, py });
  };

  const currentWall = WALL_STYLES[wallTone];

  return (
    <div className="min-h-dvh bg-[#0b0c0e] pb-24">
      <SectionHeader
        index="04"
        english="Paintings"
        title="名画 · 展墙与笔触室"
        subtitle="十二幅世界馆藏经典。点击任意画作进入检视室，可切换展墙光环境并开启 2.5 倍笔触放大镜。"
        countLabel={`${filtered.length} / ${PAINTINGS.length} 幅`}
        onNavigate={onNavigate}
      />

      <div className="mx-auto max-w-[1440px] px-6 pt-8 lg:px-10">
        {/* Artist Filter Strip */}
        <div
          role="tablist"
          aria-label="按画家筛选"
          className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.08] pb-6"
        >
          {artists.map((artist) => {
            const selected = artistFilter === artist;
            return (
              <button
                key={artist}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setArtistFilter(artist)}
                className={`h-9 cursor-pointer whitespace-nowrap rounded-md px-3.5 text-xs font-medium transition-colors ${
                  selected
                    ? 'bg-[#f2efe9] text-[#0b0c0e]'
                    : 'bg-[#14171d] text-[#a0a5b0] hover:bg-[#1d212a] hover:text-white'
                }`}
              >
                {artist === 'ALL' ? '全部画家' : artist}
              </button>
            );
          })}
        </div>

        {/* Exhibition Wall Grid */}
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((work, idx) => (
            <article key={work.id} className="group flex flex-col">
              <button
                type="button"
                onClick={() => {
                  setActiveId(work.id);
                  setLoupeEnabled(false);
                }}
                aria-label={`进入展室检视《${work.title}》`}
                className="relative block w-full cursor-pointer overflow-hidden border border-white/[0.09] bg-[#13161d] p-4 text-left transition-colors hover:border-[#d4a853]/55"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#0a0b0d]">
                  <img
                    src={work.thumbnail}
                    alt={work.alt}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <h2 className="font-editorial text-lg font-medium text-[#f2efe9] group-hover:text-[#d4a853]">
                    {work.title}
                  </h2>
                  <span className="shrink-0 font-mono-tabular text-[11px] text-[#7f8592]">
                    {String(idx + 1).padStart(2, '0')} · {work.year}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#9ca2ae]">
                  {work.artist} · {work.museum}
                </p>
                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[#7c828f]">
                  {work.note}
                </p>
              </button>
            </article>
          ))}
        </div>
      </div>

      {/* Museum Viewing Room Modal with Wall Lighting & 2.5x Brushstroke Loupe */}
      {activePainting && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`画作检视室：${activePainting.title}`}
          className="fixed inset-0 z-50 flex flex-col bg-[#08090c]/98"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#0b0c0e] px-6 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 font-mono-tabular text-xs text-[#8a909d]">
                展墙光环境
              </span>
              {(Object.keys(WALL_STYLES) as WallTone[]).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setWallTone(tone)}
                  aria-pressed={wallTone === tone}
                  className={`h-8 cursor-pointer rounded px-3 text-xs transition-colors ${
                    wallTone === tone
                      ? 'bg-[#f2efe9] font-medium text-[#0b0c0e]'
                      : 'bg-[#151820] text-[#a0a5b0] hover:text-white'
                  }`}
                >
                  {WALL_STYLES[tone].label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setLoupeEnabled((v) => !v);
                  setLoupePos((p) => ({ ...p, visible: false }));
                }}
                aria-pressed={loupeEnabled}
                className={`ml-1 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded border px-3 text-xs transition-colors ${
                  loupeEnabled
                    ? 'border-[#d4a853] bg-[#d4a853]/20 text-[#f2d99d]'
                    : 'border-white/[0.12] bg-[#151820] text-[#b4b9c3] hover:text-white'
                }`}
              >
                <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{loupeEnabled ? '笔触放大镜：开' : '笔触放大镜'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveId(null)}
              aria-label="关闭画作检视室"
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 px-3 text-xs text-[#c8c5be] hover:text-white"
            >
              <span>关闭</span>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12">
            {/* Painting Stage */}
            <div
              className={`relative flex items-center justify-center p-6 transition-colors duration-300 sm:p-10 lg:col-span-8 ${currentWall.stageBg}`}
            >
              <div
                onMouseMove={handleLoupeMove}
                onMouseLeave={() =>
                  setLoupePos((p) => ({ ...p, visible: false }))
                }
                className={`relative inline-block border p-3 shadow-2xl transition-colors duration-300 sm:p-5 ${
                  currentWall.matBg
                } ${loupeEnabled ? 'cursor-crosshair' : ''}`}
              >
                <img
                  src={activePainting.image}
                  alt={activePainting.alt}
                  referrerPolicy="no-referrer"
                  className="block max-h-[68vh] max-w-full object-contain select-none"
                />

                {loupeEnabled && loupePos.visible && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#d4a853] shadow-2xl"
                    style={{
                      left: loupePos.px,
                      top: loupePos.py,
                      backgroundImage: `url(${activePainting.image})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '260%',
                      backgroundPosition: `${loupePos.xPct}% ${loupePos.yPct}%`,
                    }}
                  />
                )}
              </div>

              {loupeEnabled && (
                <p
                  className={`pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/75 px-3 py-1 font-mono-tabular text-[11px] text-[#f2efe9]`}
                >
                  移动鼠标至画布上以 2.6× 检视笔触细节
                </p>
              )}
            </div>

            {/* Museum Placard */}
            <aside className="flex flex-col justify-between border-t border-white/[0.08] bg-[#101217] p-7 lg:col-span-4 lg:border-l lg:border-t-0 lg:p-9">
              <div>
                <p className="font-mono-tabular text-xs text-[#d4a853]">
                  {activePainting.year} · {activePainting.medium}
                </p>
                <h2 className="mt-2 font-editorial text-2xl font-semibold text-[#f5f2ec] sm:text-3xl">
                  {activePainting.title}
                </h2>
                <p className="mt-1 text-sm text-[#a0a5b1]">
                  {activePainting.english}
                </p>

                <dl className="mt-6 space-y-3 border-y border-white/[0.08] py-5 text-xs">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#7c8290]">画家</dt>
                    <dd className="text-right text-[#e5e2dc]">
                      {activePainting.artist}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#7c8290]">馆藏机构</dt>
                    <dd className="text-right text-[#e5e2dc]">
                      {activePainting.museum}
                    </dd>
                  </div>
                </dl>

                <p className="mt-6 font-editorial text-[15px] leading-relaxed text-[#d7d4cd]">
                  {activePainting.note}
                </p>

                <a
                  href={activePainting.museumUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-md border border-white/[0.15] px-4 text-xs font-medium text-[#f2efe9] transition-colors hover:border-[#d4a853] hover:text-[#d4a853]"
                >
                  <span>访问博物馆原始馆藏页</span>
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
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 text-xs text-[#b2b7c2] hover:text-[#d4a853]"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>上一幅</span>
                </button>
                <span className="font-mono-tabular text-xs text-[#7d8491]">
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
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 text-xs text-[#b2b7c2] hover:text-[#d4a853]"
                >
                  <span>下一幅</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
