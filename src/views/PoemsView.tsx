import { useEffect, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { POEMS, type SectionId } from '../data/collections';
import { wrapIndex } from '../utils/collectionLogic';

interface PoemsViewProps {
  onNavigate: (section: SectionId) => void;
}

export function PoemsView({ onNavigate }: PoemsViewProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [highlightRefrains, setHighlightRefrains] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [focusedStanza, setFocusedStanza] = useState(0);
  const [paperTheme, setPaperTheme] = useState<'paper' | 'night'>('paper');

  const poem = POEMS[activeIdx];
  const totalLines = poem.stanzas.reduce((sum, s) => sum + s.length, 0);

  useEffect(() => {
    setFocusedStanza(0);
  }, [activeIdx]);

  useEffect(() => {
    if (!focusMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedStanza((s) => wrapIndex(s, 1, poem.stanzas.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedStanza((s) => wrapIndex(s, -1, poem.stanzas.length));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusMode, poem.stanzas.length]);

  const isPaper = paperTheme === 'paper';

  let runningLineNumber = 0;

  return (
    <div className="min-h-dvh bg-[#0b0c0e] pb-24">
      <SectionHeader
        index="03"
        english="Poems"
        title="诗歌 · 夜间排印室"
        subtitle="三首完整保留原文与标点的诗篇。可切换叠句高亮、逐节聚焦或纸墨底色静心细读。"
        countLabel={`${POEMS.length} 首诗作`}
        onNavigate={onNavigate}
      />

      <div className="mx-auto max-w-[1160px] px-6 pt-8 lg:px-10">
        {/* Poem Chapter Selector + Reading Controls */}
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 md:flex-row md:items-center md:justify-between">
          <div
            role="tablist"
            aria-label="选择诗篇"
            className="flex flex-wrap gap-2"
          >
            {POEMS.map((item, idx) => {
              const selected = idx === activeIdx;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveIdx(idx)}
                  className={`flex h-10 cursor-pointer items-center gap-2.5 rounded-md px-4 text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-[#f2efe9] text-[#0b0c0e]'
                      : 'bg-[#14171d] text-[#9fa5b0] hover:bg-[#1d2129] hover:text-white'
                  }`}
                >
                  <span className="font-mono-tabular opacity-65">
                    0{idx + 1}
                  </span>
                  <span>{item.author}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setHighlightRefrains((v) => !v)}
              aria-pressed={highlightRefrains}
              className={`h-9 cursor-pointer rounded-md border px-3 text-xs transition-colors ${
                highlightRefrains
                  ? 'border-[#d4a853]/60 bg-[#d4a853]/15 text-[#f0d89e]'
                  : 'border-white/[0.12] bg-[#12141a] text-[#9aa0ac] hover:text-white'
              }`}
            >
              叠句高亮
            </button>

            <button
              type="button"
              onClick={() => setFocusMode((v) => !v)}
              aria-pressed={focusMode}
              className={`h-9 cursor-pointer rounded-md border px-3 text-xs transition-colors ${
                focusMode
                  ? 'border-[#d4a853]/60 bg-[#d4a853]/15 text-[#f0d89e]'
                  : 'border-white/[0.12] bg-[#12141a] text-[#9aa0ac] hover:text-white'
              }`}
            >
              逐节聚焦
            </button>

            <button
              type="button"
              onClick={() =>
                setPaperTheme((t) => (t === 'paper' ? 'night' : 'paper'))
              }
              className="h-9 cursor-pointer rounded-md border border-white/[0.12] bg-[#12141a] px-3 text-xs text-[#c7cbd3] transition-colors hover:border-white/30 hover:text-white"
            >
              {isPaper ? '切换暗室墨底' : '切换宣纸纸面'}
            </button>
          </div>
        </div>

        {/* Broadsheet Typography Stage */}
        <article
          aria-labelledby="active-poem-title"
          className={`mt-8 border transition-colors duration-300 ${
            isPaper
              ? 'border-black/10 bg-[#f4f1ea] text-[#17191d]'
              : 'border-white/[0.1] bg-[#111318] text-[#eae7e1]'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Monograph Margin */}
            <div
              className={`flex flex-col justify-between border-b p-8 lg:col-span-4 lg:border-b-0 lg:border-r lg:p-10 ${
                isPaper ? 'border-black/10' : 'border-white/[0.08]'
              }`}
            >
              <div>
                <p
                  className={`font-mono-tabular text-xs ${
                    isPaper ? 'text-[#6c7079]' : 'text-[#8c929f]'
                  }`}
                >
                  {poem.form} · {poem.year}
                </p>
                <h2
                  id="active-poem-title"
                  className="mt-3 font-editorial text-2xl font-semibold leading-snug sm:text-3xl"
                >
                  {poem.title}
                </h2>
                <a
                  href={poem.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-3 inline-flex items-center gap-1 text-sm font-medium hover:underline ${
                    isPaper ? 'text-[#8c651c]' : 'text-[#d4a853]'
                  }`}
                >
                  <span>{poem.author}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>

                <p
                  className={`mt-6 text-sm leading-relaxed ${
                    isPaper ? 'text-[#42464f]' : 'text-[#a8adb8]'
                  }`}
                >
                  {poem.standfirst}
                </p>
              </div>

              <div
                className={`mt-10 border-t pt-5 ${
                  isPaper ? 'border-black/10' : 'border-white/[0.08]'
                }`}
              >
                <p
                  className={`font-mono-tabular text-[11px] ${
                    isPaper ? 'text-[#6d727c]' : 'text-[#828895]'
                  }`}
                >
                  CURATORIAL NOTE
                </p>
                <p
                  className={`mt-2 font-editorial text-sm leading-relaxed ${
                    isPaper ? 'text-[#2c3038]' : 'text-[#d3d0c8]'
                  }`}
                >
                  {poem.note}
                </p>
                <div className="mt-6 flex items-center justify-between text-xs">
                  <span
                    className={`font-mono-tabular ${
                      isPaper ? 'text-[#6d727c]' : 'text-[#828895]'
                    }`}
                  >
                    {totalLines} lines · {poem.stanzas.length} stanzas
                  </span>
                  <a
                    href={poem.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 font-medium hover:underline ${
                      isPaper ? 'text-[#17191d]' : 'text-[#f2efe9]'
                    }`}
                  >
                    <span>{poem.sourceLabel}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Poem Verse Setting */}
            <div className="p-8 sm:p-12 lg:col-span-8">
              {focusMode && (
                <p
                  className={`mb-6 font-mono-tabular text-xs ${
                    isPaper ? 'text-[#7c5a18]' : 'text-[#d4a853]'
                  }`}
                >
                  逐节聚焦已开启 · 点击任意诗节或按 ↑ ↓ 方向键切换焦点（当前第{' '}
                  {focusedStanza + 1} / {poem.stanzas.length} 节）
                </p>
              )}

              <div className="space-y-7">
                {poem.stanzas.map((stanza, stanzaIdx) => {
                  const isDimmed = focusMode && focusedStanza !== stanzaIdx;
                  return (
                    <div
                      key={`${poem.id}-stanza-${stanzaIdx}`}
                      onClick={() => {
                        if (focusMode) setFocusedStanza(stanzaIdx);
                      }}
                      className={`transition-opacity duration-300 ${
                        focusMode ? 'cursor-pointer' : ''
                      } ${isDimmed ? 'opacity-25 hover:opacity-55' : 'opacity-100'}`}
                    >
                      {stanza.map((line, lineIdx) => {
                        runningLineNumber += 1;
                        const isRefrain =
                          highlightRefrains && poem.refrains.includes(line);
                        return (
                          <div
                            key={`${poem.id}-${stanzaIdx}-${lineIdx}`}
                            className="grid grid-cols-[2.2rem_1fr] items-baseline gap-3 py-0.5"
                          >
                            <span
                              className={`font-mono-tabular text-[11px] select-none ${
                                isPaper ? 'text-[#8f949e]' : 'text-[#5c6270]'
                              }`}
                            >
                              {String(runningLineNumber).padStart(2, '0')}
                            </span>
                            <p
                              className={`font-editorial text-lg leading-[1.75] sm:text-[20px] ${
                                isRefrain
                                  ? isPaper
                                    ? 'font-semibold text-[#8c5e12]'
                                    : 'font-semibold text-[#e6bd6a]'
                                  : ''
                              }`}
                            >
                              {line}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </article>

        {/* Bottom Poem Stepper */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              setActiveIdx((i) => wrapIndex(i, -1, POEMS.length))
            }
            className="inline-flex h-10 cursor-pointer items-center gap-2 text-xs text-[#a5abb6] transition-colors hover:text-[#d4a853]"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span>上一首</span>
          </button>
          <span className="font-mono-tabular text-xs text-[#7e8490]">
            0{activeIdx + 1} / 0{POEMS.length}
          </span>
          <button
            type="button"
            onClick={() =>
              setActiveIdx((i) => wrapIndex(i, 1, POEMS.length))
            }
            className="inline-flex h-10 cursor-pointer items-center gap-2 text-xs text-[#a5abb6] transition-colors hover:text-[#d4a853]"
          >
            <span>下一首</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
