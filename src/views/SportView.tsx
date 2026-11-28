import { useEffect, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { SPORT_TEAMS, type SectionId } from '../data/collections';
import { wrapIndex } from '../utils/collectionLogic';

interface SportViewProps {
  onNavigate: (section: SectionId) => void;
}

export function SportView({ onNavigate }: SportViewProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const team = SPORT_TEAMS[activeIdx];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setActiveIdx((i) => wrapIndex(i, 1, SPORT_TEAMS.length));
      } else if (e.key === 'ArrowLeft') {
        setActiveIdx((i) => wrapIndex(i, -1, SPORT_TEAMS.length));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="min-h-dvh bg-[#0b0c0e] pb-24">
      <SectionHeader
        index="05"
        english="Sport"
        title="体育 · 赛场档案"
        subtitle="五支跨越篮球、足球、F1、橄榄球与 CS2 的支持主队，记录冠军记忆与现场瞬间。"
        countLabel={`${SPORT_TEAMS.length} 支主队`}
        onNavigate={onNavigate}
      />

      <div className="mx-auto max-w-[1440px] px-6 pt-8 lg:px-10">
        {/* Cinematic Featured Club Stage */}
        <article
          aria-live="polite"
          className="relative overflow-hidden border border-white/[0.1] bg-[#12151b]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Full-bleed action photograph */}
            <div className="relative aspect-[16/10] overflow-hidden bg-[#0a0b0d] lg:col-span-7 lg:aspect-auto lg:min-h-[480px]">
              <img
                key={team.id}
                src={team.image}
                alt={team.alt}
                referrerPolicy="no-referrer"
                style={{ objectPosition: team.objectPosition }}
                className="h-full w-full object-cover transition-transform duration-700 ease-out"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,12,14,0.08)_0%,rgba(11,12,14,0.72)_100%)] lg:bg-[linear-gradient(90deg,rgba(11,12,14,0.05)_55%,rgba(18,21,27,0.98)_100%)]"
              />
            </div>

            {/* Championship Editorial Dossier */}
            <div className="flex flex-col justify-between p-7 sm:p-10 lg:col-span-5">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono-tabular text-xs tracking-[0.14em] text-[#8f95a2]">
                    0{activeIdx + 1} / 0{SPORT_TEAMS.length} · {team.league}
                  </span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.04] p-2">
                    <img
                      src={team.crest}
                      alt={`${team.club} crest`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>

                <p
                  className="mt-8 text-xs font-medium tracking-wider uppercase"
                  style={{ color: team.accent }}
                >
                  {team.sportLabel}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#f5f2ec] sm:text-4xl">
                  {team.club}
                </h2>

                <div className="mt-7 border-t border-white/[0.09] pt-6">
                  <p className="font-mono-tabular text-[11px] text-[#7e8491]">
                    HONOURS & MILESTONE
                  </p>
                  <p className="mt-2 text-xl font-medium text-[#eae7e1]">
                    {team.honours}
                  </p>
                  <p
                    className="mt-1 font-editorial text-lg italic"
                    style={{ color: team.accent }}
                  >
                    {team.honoursHighlight}
                  </p>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-[#9ca2ae]">
                  {team.alt}
                </p>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.09] pt-6">
                <a
                  href={team.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-1.5 rounded-md border border-[#d4a853]/50 bg-[#d4a853]/10 px-4 text-xs font-medium text-[#f2da9f] transition-colors hover:bg-[#d4a853] hover:text-[#0b0c0e]"
                >
                  <span>访问官网 · {team.sourceLabel}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIdx((i) => wrapIndex(i, -1, SPORT_TEAMS.length))
                    }
                    aria-label="上一支球队"
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-white/[0.12] text-[#d5d2cb] transition-colors hover:border-[#d4a853] hover:text-[#d4a853]"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIdx((i) => wrapIndex(i, 1, SPORT_TEAMS.length))
                    }
                    aria-label="下一支球队"
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-white/[0.12] text-[#d5d2cb] transition-colors hover:border-[#d4a853] hover:text-[#d4a853]"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Five Architectural Club Selector Plates */}
        <div
          role="tablist"
          aria-label="选择主队"
          className="mt-6 grid grid-cols-1 gap-px border border-white/[0.09] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-5"
        >
          {SPORT_TEAMS.map((item, idx) => {
            const selected = idx === activeIdx;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveIdx(idx)}
                className={`relative flex cursor-pointer items-center gap-4 p-5 text-left transition-colors ${
                  selected
                    ? 'bg-[#1a1e27]'
                    : 'bg-[#101217] hover:bg-[#151820]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-[2px] transition-opacity"
                  style={{
                    backgroundColor: item.accent,
                    opacity: selected ? 1 : 0,
                  }}
                />
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white/[0.05] p-1.5">
                  <img
                    src={item.crest}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-mono-tabular text-[11px] text-[#848a97]">
                    {item.league}
                  </p>
                  <p
                    className={`truncate text-sm font-medium ${
                      selected ? 'text-white' : 'text-[#c9c6bf]'
                    }`}
                  >
                    {item.club}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
