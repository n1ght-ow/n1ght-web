import { ArrowUpRight, Grid2x2 } from 'lucide-react';
import { PORTAL_ENTRIES, type SectionId } from '../data/collections';

interface TopBarProps {
  activeSection: SectionId;
  onNavigate: (section: SectionId) => void;
  onOpenIndex: () => void;
}

const QUICK_LINKS: Array<{ id: SectionId; label: string }> = [
  { id: 'photo', label: '摄影' },
  { id: 'books', label: '书架' },
  { id: 'paintings', label: '名画' },
  { id: 'films', label: '电影' },
];

export function TopBar({
  activeSection,
  onNavigate,
  onOpenIndex,
}: TopBarProps) {
  const currentEntry = PORTAL_ENTRIES.find((e) => e.id === activeSection);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.08] bg-[#0b0c0e]/92">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-8 px-6 lg:px-10">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="whitespace-nowrap shrink-0 cursor-pointer text-left text-[15px] font-semibold tracking-[0.14em] text-[#f2efe9] transition-colors hover:text-[#d4a853]"
          aria-label="返回 N1GHT CHXN9 首页"
        >
          N1GHT CHXN9
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="主导航"
          className="hidden items-center gap-7 md:flex"
        >
          {QUICK_LINKS.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onNavigate(link.id)}
                className={`whitespace-nowrap shrink-0 cursor-pointer text-sm transition-colors ${
                  isActive
                    ? 'font-medium text-[#d4a853]'
                    : 'text-[#9b9fa8] hover:text-[#f2efe9]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {link.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onOpenIndex}
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer text-sm text-[#c8c5be] transition-colors hover:text-[#f2efe9]"
            aria-label="打开全部十个展区索引"
          >
            <Grid2x2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {currentEntry ? `目录 · ${currentEntry.zhLabel}` : '全部索引'}
            </span>
          </button>
        </nav>

        {/* Zone 3: Single primary action (3D World portal on desktop; index + 3D on mobile) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenIndex}
            className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer px-2 text-sm text-[#c8c5be] transition-colors hover:text-[#f2efe9] md:hidden"
            aria-label="打开全部索引"
          >
            <Grid2x2 className="h-4 w-4" aria-hidden="true" />
            <span>目录</span>
          </button>
          <a
            href="3d/"
            className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-[#d4a853]/45 bg-[#d4a853]/10 px-4 text-xs font-medium tracking-wide text-[#f0d89e] transition-colors hover:border-[#d4a853] hover:bg-[#d4a853] hover:text-[#0b0c0e]"
          >
            <span>3D 世界</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
}
