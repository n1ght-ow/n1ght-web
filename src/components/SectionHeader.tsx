import { ArrowLeft } from 'lucide-react';
import type { SectionId } from '../data/collections';

interface SectionHeaderProps {
  index: string;
  english: string;
  title: string;
  subtitle: string;
  countLabel: string;
  onNavigate: (section: SectionId) => void;
}

export function SectionHeader({
  index,
  english,
  title,
  subtitle,
  countLabel,
  onNavigate,
}: SectionHeaderProps) {
  return (
    <header className="border-b border-white/[0.08] pb-8 pt-24">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex h-10 cursor-pointer items-center gap-2 text-xs font-medium tracking-wide text-[#a3a8b3] transition-colors hover:text-[#d4a853]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>返回 3D 首页</span>
          </button>
          <div className="flex items-center gap-3 font-mono-tabular text-xs text-[#8a909b]">
            <span>{index}</span>
            <span aria-hidden="true">/</span>
            <span>{english}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#d4a853]">{countLabel}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h1 className="text-3xl font-semibold tracking-[-0.025em] text-[#f5f2ec] md:text-5xl">
            {title}
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-[#a8adb8] [text-wrap:balance] md:text-right">
            {subtitle}
          </p>
        </div>
      </div>
    </header>
  );
}
