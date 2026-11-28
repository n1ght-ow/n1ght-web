import { useEffect, useRef } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { PORTAL_ENTRIES, type SectionId } from '../data/collections';

interface IndexDrawerProps {
  open: boolean;
  activeSection: SectionId;
  onClose: () => void;
  onNavigate: (section: SectionId) => void;
}

export function IndexDrawer({
  open,
  activeSection,
  onClose,
  onNavigate,
}: IndexDrawerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        ) ?? [],
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="全部展区索引"
      className="fixed inset-0 z-50 flex flex-col bg-[#0b0c0e]/98"
    >
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between border-b border-white/[0.08] px-6 lg:px-10">
        <button
          type="button"
          onClick={() => {
            onNavigate('home');
            onClose();
          }}
          className="cursor-pointer text-[15px] font-semibold tracking-[0.14em] text-[#f2efe9] hover:text-[#d4a853]"
        >
          N1GHT CHXN9
        </button>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="inline-flex h-10 cursor-pointer items-center gap-2 px-3 text-sm text-[#c8c5be] transition-colors hover:text-white"
          aria-label="关闭索引"
        >
          <span>关闭</span>
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-start overflow-y-auto px-6 py-6 lg:justify-center lg:px-10 lg:py-10">
        <div className="mb-8 flex items-baseline justify-between border-b border-white/[0.08] pb-4">
          <div>
            <p className="font-mono-tabular text-xs text-[#8f95a0]">
              Index · 10 Entrances
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#f2efe9] md:text-3xl">
              全部空间与馆藏
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              onNavigate('home');
              onClose();
            }}
            className="cursor-pointer text-sm text-[#d4a853] hover:underline"
          >
            返回 3D 首页
          </button>
        </div>

        <div className="grid grid-cols-1 gap-px bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-5">
          {PORTAL_ENTRIES.map((entry) => {
            const isCurrent = activeSection === entry.id;
            const inner = (
              <div className="flex h-full flex-col justify-between bg-[#0f1115] p-5 transition-colors group-hover:bg-[#171a21]">
                <div className="flex items-center justify-between">
                  <span className="font-mono-tabular text-xs text-[#8a909b]">
                    {entry.index}
                  </span>
                  <span className="font-mono-tabular text-xs text-[#8a909b]">
                    {entry.count}
                  </span>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-lg font-medium tracking-tight ${
                        isCurrent
                          ? 'text-[#d4a853]'
                          : 'text-[#f2efe9] group-hover:text-[#d4a853]'
                      }`}
                    >
                      {entry.label}
                    </span>
                    {entry.href && (
                      <ArrowUpRight
                        className="h-4 w-4 text-[#d4a853]"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-[#a6abb5]">
                    {entry.zhLabel}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-[#7e8490]">
                    {entry.summary}
                  </p>
                </div>
              </div>
            );

            if (entry.href) {
              return (
                <a
                  key={entry.id}
                  href={entry.href}
                  className="group block text-left"
                >
                  {inner}
                </a>
              );
            }

            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  onNavigate(entry.id as SectionId);
                  onClose();
                }}
                className="group block cursor-pointer text-left"
              >
                {inner}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
