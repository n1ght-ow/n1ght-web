import { useState } from 'react';
import { ArrowUpRight, Pause, Play } from 'lucide-react';
import { HeroScene3D } from '../components/HeroScene3D';
import { PORTAL_ENTRIES, type SectionId } from '../data/collections';

interface HomeViewProps {
  onNavigate: (section: SectionId) => void;
}

export function HomeView({ onNavigate }: HomeViewProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  const activeEntry =
    hoveredIdx !== null ? PORTAL_ENTRIES[hoveredIdx] : null;
  const activeAccentHex = activeEntry?.accentHex ?? '#D4A853';

  return (
    <section
      aria-label="N1GHT CHXN9 首页入口"
      className="relative flex min-h-dvh w-full flex-col justify-between overflow-hidden pt-16 lg:h-dvh"
    >
      {/* Interactive Three.js 3D Architectural Sculpture */}
      <HeroScene3D
        activeAccentHex={activeAccentHex}
        hoveredIndex={hoveredIdx}
        paused={paused}
      />

      {/* Subtle directional vignette scrim to ensure crisp text legibility without muting the 3D centerpiece */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,12,14,0.08)_0%,rgba(11,12,14,0.58)_38%,rgba(11,12,14,0.92)_70%,rgba(11,12,14,0.98)_100%)] lg:bg-[linear-gradient(90deg,rgba(11,12,14,0.88)_0%,rgba(11,12,14,0.52)_38%,rgba(11,12,14,0)_64%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-[linear-gradient(180deg,rgba(11,12,14,0)_0%,rgba(11,12,14,0.88)_65%,rgba(11,12,14,0.99)_100%)]"
      />

      {/* Upper-left Editorial Identity (pushes below 3D centerpiece on narrow mobile) */}
      <div className="pointer-events-none relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-end px-6 pb-8 pt-48 lg:justify-center lg:px-10 lg:py-10">
        <div className="max-w-lg">
          <p className="font-mono-tabular text-xs tracking-[0.2em] text-[#d4a853]">
            PRIVATE ARCHIVE · TEN ROOMS
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[#f5f2ec] sm:text-5xl lg:mt-4 lg:text-[62px] lg:leading-[1.03]">
            N1GHT CHXN9
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#cfd3dc] lg:mt-5">
            摄影、书架、诗歌、名画、体育、剧集、电影、游戏、应用与三维世界。
            <br />
            拖动画面旋转装置，或从下方步入任意展室。
          </p>

          {/* Dynamic preview note synced to hovered entrance */}
          <div className="mt-6 min-h-[52px] border-t border-white/[0.14] pt-4 lg:mt-8">
            {activeEntry ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-mono-tabular text-[#d4a853]">
                    {activeEntry.index}
                  </span>
                  <span className="font-medium text-[#f2efe9]">
                    {activeEntry.label} · {activeEntry.zhLabel}
                  </span>
                  <span aria-hidden="true" className="text-white/30">
                    /
                  </span>
                  <span className="font-mono-tabular text-[#a8aeb9]">
                    {activeEntry.count}
                  </span>
                </div>
                <p className="text-sm text-[#d4d8e0]">{activeEntry.summary}</p>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-[#aeb4c0]">
                悬停下方任一入口可联动 3D 星轨装置，点击直接进入独立展区。
              </p>
            )}
          </div>

          <div className="pointer-events-auto mt-5 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-white/[0.16] bg-[#12141a]/92 px-3.5 text-xs font-medium text-[#e0ddd6] transition-colors hover:border-[#d4a853]/60 hover:text-white"
            >
              {paused ? (
                <>
                  <Play className="h-3.5 w-3.5 text-[#d4a853]" aria-hidden="true" />
                  <span>继续旋转</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5 text-[#d4a853]" aria-hidden="true" />
                  <span>暂停动效</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom 10-Entrance Architectural Portal Matrix */}
      <nav
        aria-label="十个展区入口"
        className="relative z-10 mx-auto w-full max-w-[1440px] px-6 pb-6 lg:px-10 lg:pb-8"
      >
        <div className="grid grid-cols-2 gap-px border border-white/[0.1] bg-white/[0.08] sm:grid-cols-3 lg:grid-cols-5">
          {PORTAL_ENTRIES.map((entry, idx) => {
            const isHovered = hoveredIdx === idx;
            const cardBody = (
              <div
                className="relative flex h-full min-h-[82px] flex-col justify-between bg-[#0f1116]/95 px-4 py-3.5 transition-colors duration-200 hover:bg-[#171b23]"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-[2px] transition-opacity duration-200"
                  style={{
                    backgroundColor: entry.accentHex,
                    opacity: isHovered ? 1 : 0,
                  }}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tabular text-[11px] text-[#7f8694]">
                    {entry.index}
                  </span>
                  <span className="font-mono-tabular text-[11px] text-[#8d94a1]">
                    {entry.count}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-medium tracking-tight text-[#f2efe9] group-hover:text-white">
                      {entry.label}
                    </span>
                    <span className="block truncate text-xs text-[#959ba6]">
                      {entry.zhLabel}
                    </span>
                  </div>
                  <ArrowUpRight
                    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                      isHovered
                        ? 'translate-x-0.5 -translate-y-0.5 text-[#d4a853]'
                        : 'text-white/30'
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </div>
            );

            if (entry.href) {
              return (
                <a
                  key={entry.id}
                  href={entry.href}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => setHoveredIdx(idx)}
                  onBlur={() => setHoveredIdx(null)}
                  className="group block text-left"
                >
                  {cardBody}
                </a>
              );
            }

            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onNavigate(entry.id as SectionId)}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                className="group block cursor-pointer text-left"
              >
                {cardBody}
              </button>
            );
          })}
        </div>
      </nav>
    </section>
  );
}
