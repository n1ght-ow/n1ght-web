import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  LayoutGrid,
  Search,
  X,
} from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { PHOTOS, type PhotoItem, type SectionId } from '../data/collections';
import { filterPhotos, wrapIndex } from '../utils/collectionLogic';

interface PhotographyViewProps {
  onNavigate: (section: SectionId) => void;
}

const ACTS = [
  { id: 'ALL', label: '全部' },
  { id: 'BLOOM', label: '花期 Bloom' },
  { id: 'HORIZON', label: '地平线 Horizon' },
  { id: 'CITY', label: '城市 City' },
  { id: 'NIGHT', label: '夜色 Night' },
  { id: 'LAND', label: '山川 Land' },
  { id: 'WINTER', label: '冬雪 Winter' },
] as const;

export function PhotographyView({ onNavigate }: PhotographyViewProps) {
  const [act, setAct] = useState<string>('ALL');
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<'editorial' | 'contact'>('editorial');
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterPhotos(PHOTOS, act, query),
    [act, query],
  );

  const activeIndex = useMemo(() => {
    if (!activePhotoId) return -1;
    return filtered.findIndex((p) => p.id === activePhotoId);
  }, [filtered, activePhotoId]);

  const activePhoto: PhotoItem | null =
    activeIndex >= 0 ? filtered[activeIndex] : null;

  useEffect(() => {
    if (!activePhoto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePhotoId(null);
      } else if (e.key === 'ArrowRight') {
        const next = filtered[wrapIndex(activeIndex, 1, filtered.length)];
        if (next) setActivePhotoId(next.id);
      } else if (e.key === 'ArrowLeft') {
        const prev = filtered[wrapIndex(activeIndex, -1, filtered.length)];
        if (prev) setActivePhotoId(prev.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePhoto, activeIndex, filtered]);

  return (
    <div className="min-h-dvh bg-[#0b0c0e] pb-24">
      <SectionHeader
        index="01"
        english="Photography"
        title="摄影 · 光影暗房"
        subtitle="四十六张按章节归档的胶片与数码瞬间。点击任意画幅开启高分辨率光圈检视器。"
        countLabel={`${filtered.length} / ${PHOTOS.length} 帧`}
        onNavigate={onNavigate}
      />

      <div className="mx-auto max-w-[1440px] px-6 pt-8 lg:px-10">
        {/* Control Bar */}
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="摄影章节筛选"
            className="flex flex-wrap items-center gap-1.5"
          >
            {ACTS.map((item) => {
              const selected = act === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setAct(item.id)}
                  className={`h-9 cursor-pointer whitespace-nowrap rounded-md px-3.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-[#f2efe9] text-[#0b0c0e]'
                      : 'bg-[#14171d] text-[#a0a5b0] hover:bg-[#1c2028] hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative flex-1 sm:w-56 sm:flex-none">
              <span className="sr-only">搜索照片题注或画面</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7c8290]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索画面或编号…"
                className="h-9 w-full rounded-md border border-white/[0.1] bg-[#12141a] pl-9 pr-3 text-xs text-[#f2efe9] placeholder:text-[#6f7582] focus:border-[#d4a853]"
              />
            </label>

            <div
              role="group"
              aria-label="视图排版切换"
              className="flex items-center rounded-md border border-white/[0.1] bg-[#12141a] p-0.5"
            >
              <button
                type="button"
                onClick={() => setDensity('editorial')}
                aria-pressed={density === 'editorial'}
                className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded px-2.5 text-xs transition-colors ${
                  density === 'editorial'
                    ? 'bg-white/[0.12] text-white'
                    : 'text-[#8c929e] hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                <span>画廊</span>
              </button>
              <button
                type="button"
                onClick={() => setDensity('contact')}
                aria-pressed={density === 'contact'}
                className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded px-2.5 text-xs transition-colors ${
                  density === 'contact'
                    ? 'bg-white/[0.12] text-white'
                    : 'text-[#8c929e] hover:text-white'
                }`}
              >
                <Grid className="h-3.5 w-3.5" aria-hidden="true" />
                <span>印样</span>
              </button>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-sm text-[#959ba6]">没有找到匹配的照片。</p>
            <button
              type="button"
              onClick={() => {
                setAct('ALL');
                setQuery('');
              }}
              className="mt-4 cursor-pointer text-xs text-[#d4a853] hover:underline"
            >
              重置筛选条件
            </button>
          </div>
        ) : density === 'editorial' ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((photo) => {
              const isPanoramic = photo.width / photo.height > 1.9;
              return (
                <figure
                  key={photo.id}
                  className={`group flex flex-col ${
                    isPanoramic ? 'sm:col-span-2' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActivePhotoId(photo.id)}
                    aria-label={`打开第 ${photo.number} 帧：${photo.caption}`}
                    className="relative block w-full cursor-pointer overflow-hidden border border-white/[0.08] bg-[#13161c] text-left transition-colors hover:border-[#d4a853]/50"
                  >
                    <div
                      className={
                        isPanoramic ? 'aspect-[21/9]' : 'aspect-[4/3]'
                      }
                    >
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        width={photo.width}
                        height={photo.height}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    </div>
                  </button>
                  <figcaption className="mt-2.5 flex items-baseline justify-between gap-4">
                    <span className="truncate text-sm text-[#e5e2dc]">
                      {photo.caption}
                    </span>
                    <span className="shrink-0 font-mono-tabular text-[11px] text-[#7e8592]">
                      {photo.number} · {photo.act}
                    </span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {filtered.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setActivePhotoId(photo.id)}
                aria-label={`查看印样第 ${photo.number} 帧：${photo.caption}`}
                className="group cursor-pointer border border-white/[0.08] bg-[#12151b] p-2 text-left transition-colors hover:border-[#d4a853]/60"
              >
                <div className="mb-1.5 flex items-center justify-between font-mono-tabular text-[10px] text-[#7d8491]">
                  <span>F{photo.number}</span>
                  <span>{photo.act}</span>
                </div>
                <div className="aspect-[4/3] overflow-hidden bg-[#0a0b0e]">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 truncate text-[11px] text-[#c8c5be]">
                  {photo.caption}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Precision Lightbox */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`正在查看照片 ${activePhoto.number}：${activePhoto.caption}`}
          className="fixed inset-0 z-50 flex flex-col bg-[#08090b]/98"
        >
          <div className="flex h-16 items-center justify-between border-b border-white/[0.08] px-6">
            <div className="flex items-center gap-3 font-mono-tabular text-xs text-[#9aa0ac]">
              <span className="text-[#d4a853]">FRAME {activePhoto.number}</span>
              <span aria-hidden="true">/</span>
              <span>{String(filtered.length).padStart(2, '0')}</span>
              <span aria-hidden="true">·</span>
              <span>{activePhoto.act}</span>
              <span className="hidden sm:inline" aria-hidden="true">
                ·
              </span>
              <span className="hidden sm:inline">
                {activePhoto.width} × {activePhoto.height}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActivePhotoId(null)}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 px-3 text-xs text-[#c9c6bf] hover:text-white"
              aria-label="关闭大图检视"
            >
              <span>关闭</span>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6 sm:px-16">
            <button
              type="button"
              onClick={() => {
                const prev =
                  filtered[wrapIndex(activeIndex, -1, filtered.length)];
                if (prev) setActivePhotoId(prev.id);
              }}
              aria-label="上一张照片"
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border border-white/[0.12] bg-[#12151b]/90 text-[#e8e5df] transition-colors hover:border-[#d4a853] hover:text-[#d4a853] sm:left-6"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            <img
              src={activePhoto.full}
              alt={activePhoto.alt}
              referrerPolicy="no-referrer"
              className="max-h-[68vh] max-w-full object-contain shadow-2xl"
            />

            <button
              type="button"
              onClick={() => {
                const next =
                  filtered[wrapIndex(activeIndex, 1, filtered.length)];
                if (next) setActivePhotoId(next.id);
              }}
              aria-label="下一张照片"
              className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border border-white/[0.12] bg-[#12151b]/90 text-[#e8e5df] transition-colors hover:border-[#d4a853] hover:text-[#d4a853] sm:right-6"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="border-t border-white/[0.08] bg-[#0c0e12] px-6 py-4">
            <div className="mx-auto flex max-w-[1200px] flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-medium text-[#f2efe9]">
                  {activePhoto.caption}
                </h2>
                <p className="text-xs text-[#8a909d]">{activePhoto.alt}</p>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {filtered.map((thumb) => {
                  const current = thumb.id === activePhoto.id;
                  return (
                    <button
                      key={thumb.id}
                      type="button"
                      onClick={() => setActivePhotoId(thumb.id)}
                      aria-label={`跳转到第 ${thumb.number} 帧`}
                      className={`h-11 w-16 shrink-0 cursor-pointer overflow-hidden border transition-opacity ${
                        current
                          ? 'border-[#d4a853] opacity-100'
                          : 'border-white/10 opacity-45 hover:opacity-85'
                      }`}
                    >
                      <img
                        src={thumb.src}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
