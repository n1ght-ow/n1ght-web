import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { BOOKS, type BookItem, type SectionId } from '../data/collections';
import { filterBooks, wrapIndex } from '../utils/collectionLogic';

interface BooksViewProps {
  onNavigate: (section: SectionId) => void;
}

function BookCoverArt({
  book,
  large = false,
}: {
  book: BookItem;
  large?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden border border-black/15 transition-transform duration-300 ${
        large ? 'aspect-[3/4.2] w-full max-w-[230px] p-6' : 'aspect-[3/4] w-full p-4'
      }`}
      style={{ backgroundColor: book.cloth, color: book.ink }}
    >
      {/* Subtle architectural cloth spine groove */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-2.5 w-px opacity-25"
        style={{ backgroundColor: book.ink }}
      />
      {/* Top accent band */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
        style={{ backgroundColor: book.band }}
      />

      <div className="pl-2">
        <p className="font-mono-tabular text-[10px] uppercase tracking-[0.14em] opacity-75">
          {book.author}
        </p>
      </div>

      <div className="pl-2">
        <h3
          className={`font-editorial font-semibold leading-snug ${
            large ? 'text-2xl' : 'text-lg'
          }`}
        >
          {book.title}
        </h3>
        <p
          className={`mt-1.5 leading-snug opacity-80 ${
            large ? 'text-xs' : 'text-[11px]'
          }`}
        >
          {book.spine}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-current/20 pl-2 pt-2.5 font-mono-tabular text-[10px] opacity-70">
        <span>FOLIO</span>
        <span>{book.thickness}mm</span>
      </div>
    </div>
  );
}

export function BooksView({ onNavigate }: BooksViewProps) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(BOOKS[0].id);

  const filtered = useMemo(() => filterBooks(BOOKS, query), [query]);

  const activeBook = useMemo(() => {
    return (
      filtered.find((b) => b.id === selectedId) ??
      filtered[0] ??
      BOOKS[0]
    );
  }, [filtered, selectedId]);

  const activeIndex = filtered.findIndex((b) => b.id === activeBook.id);

  const stepBook = (delta: number) => {
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
        index="02"
        english="Books"
        title="书架 · 私人阅览室"
        subtitle="十六部装帧布面典藏。左侧按瑞士平面网格检阅书封，右侧在纸面阅读台上展读藏书笔记。"
        countLabel={`${filtered.length} / ${BOOKS.length} 册`}
        onNavigate={onNavigate}
      />

      <div className="mx-auto max-w-[1440px] px-6 pt-8 lg:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <p className="text-xs text-[#8f95a0]">
            点击任意装帧书封，在右侧阅览台查看完整中英书名与批注。
          </p>
          <label className="relative w-full sm:w-64">
            <span className="sr-only">搜索书名、英文名或作者</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7c8290]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索书名或作者…"
              className="h-9 w-full rounded-md border border-white/[0.1] bg-[#12141a] pl-9 pr-3 text-xs text-[#f2efe9] placeholder:text-[#6f7582] focus:border-[#d4a853]"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          {/* Left: Cloth-Bound Cover Monograph Grid */}
          <div className="lg:col-span-7">
            {filtered.length === 0 ? (
              <div className="border border-white/[0.08] bg-[#12141a] py-20 text-center">
                <p className="text-sm text-[#959ba6]">未找到匹配的藏书。</p>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="mt-3 cursor-pointer text-xs text-[#d4a853] hover:underline"
                >
                  显示全部十六册
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {filtered.map((book) => {
                  const isSelected = book.id === activeBook.id;
                  return (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => setSelectedId(book.id)}
                      aria-pressed={isSelected}
                      className={`group cursor-pointer text-left transition-all ${
                        isSelected
                          ? 'ring-2 ring-[#d4a853] ring-offset-2 ring-offset-[#0b0c0e]'
                          : 'opacity-85 hover:-translate-y-1 hover:opacity-100'
                      }`}
                    >
                      <BookCoverArt book={book} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Warm Alabaster Paper Reading Sheet */}
          <aside
            aria-label="当前选中藏书详情"
            className="lg:sticky lg:top-24 lg:col-span-5"
          >
            <div className="border border-black/10 bg-[#f4f1ea] p-7 text-[#16181c] sm:p-9">
              <div className="flex items-center justify-between border-b border-black/10 pb-4 font-mono-tabular text-xs text-[#5d626c]">
                <span>
                  NO.{' '}
                  {String(
                    BOOKS.findIndex((b) => b.id === activeBook.id) + 1,
                  ).padStart(2, '0')}{' '}
                  / {BOOKS.length}
                </span>
                <span>READING FOLIO</span>
              </div>

              <div className="mt-7 flex flex-col items-center gap-7 sm:flex-row sm:items-start">
                <div className="w-44 shrink-0 shadow-lg">
                  <BookCoverArt book={activeBook} large />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium tracking-wider text-[#6a6e77]">
                    {activeBook.author}
                  </p>
                  <h2 className="mt-1.5 font-editorial text-2xl font-semibold text-[#111317] sm:text-3xl">
                    {activeBook.title}
                  </h2>
                  <p className="mt-1 text-sm text-[#4a4f59]">
                    {activeBook.spine}
                  </p>

                  <div className="mt-6 border-t border-black/10 pt-5">
                    <p className="font-mono-tabular text-[11px] text-[#747984]">
                      PERSONAL NOTE
                    </p>
                    <blockquote className="mt-2 font-editorial text-[16px] leading-relaxed text-[#22252c]">
                      “{activeBook.blurb}”
                    </blockquote>
                  </div>
                </div>
              </div>

              {/* Volume Physical Proportions + Navigation */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-5">
                <div className="flex items-center gap-4 font-mono-tabular text-xs text-[#5e636d]">
                  <span>书脊厚度 {activeBook.thickness}mm</span>
                  <span aria-hidden="true">·</span>
                  <span>开本高度 {activeBook.height}mm</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stepBook(-1)}
                    aria-label="上一本书"
                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded border border-black/15 text-[#16181c] transition-colors hover:bg-black hover:text-[#f4f1ea]"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepBook(1)}
                    aria-label="下一本书"
                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded border border-black/15 text-[#16181c] transition-colors hover:bg-black hover:text-[#f4f1ea]"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
