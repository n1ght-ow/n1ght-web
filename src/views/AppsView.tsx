import { ArrowUpRight } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { APPS, type SectionId } from '../data/collections';

interface AppsViewProps {
  onNavigate: (section: SectionId) => void;
}

export function AppsView({ onNavigate }: AppsViewProps) {
  return (
    <div className="min-h-dvh bg-[#0b0c0e] pb-24">
      <SectionHeader
        index="09"
        english="Apps"
        title="应用 · 自研作品展厅"
        subtitle="为日常看赛与文字输入亲手打磨的两款 Android 原生应用，以及独立运行的 MyScore 网页端。"
        countLabel={`${APPS.length} 款应用`}
        onNavigate={onNavigate}
      />

      <div className="mx-auto max-w-[1440px] space-y-12 px-6 pt-10 lg:px-10">
        {APPS.map((app, idx) => {
          const reverse = idx % 2 === 1;
          return (
            <article
              key={app.id}
              aria-labelledby={`app-heading-${app.id}`}
              className="grid grid-cols-1 overflow-hidden border border-white/[0.1] bg-[#11141a] lg:grid-cols-12"
            >
              {/* Copy Column */}
              <div
                className={`flex flex-col justify-between p-8 sm:p-11 lg:col-span-7 ${
                  reverse ? 'lg:order-2' : ''
                }`}
              >
                <div>
                  <p className="font-mono-tabular text-xs text-[#d4a853]">
                    0{idx + 1} · {app.kicker}
                  </p>
                  <h2
                    id={`app-heading-${app.id}`}
                    className="mt-3 text-3xl font-semibold tracking-tight text-[#f5f2ec] sm:text-4xl"
                  >
                    {app.name}
                  </h2>
                  <p className="mt-2 text-xs text-[#8f95a2]">{app.platform}</p>

                  <p className="mt-6 text-base leading-relaxed text-[#e5e2dc]">
                    {app.tagline}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#9ca2ae]">
                    {app.description}
                  </p>

                  <div className="mt-8 grid grid-cols-1 gap-5 border-t border-white/[0.08] pt-6 sm:grid-cols-3">
                    {app.highlights.map((item) => (
                      <div key={item.title}>
                        <h3 className="text-sm font-medium text-[#f2efe9]">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-[#8d93a0]">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-9 border-t border-white/[0.08] pt-6">
                  <dl className="mb-6 flex flex-wrap gap-x-8 gap-y-2 font-mono-tabular text-xs">
                    {app.specs.map((spec) => (
                      <div key={spec.label} className="flex items-center gap-2">
                        <dt className="text-[#787f8d]">{spec.label}</dt>
                        <dd className="text-[#d6d3cc]">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={app.detailHref}
                      className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#f2efe9] px-4 text-xs font-medium text-[#0b0c0e] transition-colors hover:bg-[#d4a853]"
                    >
                      <span>完整应用介绍</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                    {app.webHref && (
                      <a
                        href={app.webHref}
                        className="inline-flex h-10 items-center gap-1.5 rounded-md border border-[#d4a853]/50 bg-[#d4a853]/10 px-4 text-xs font-medium text-[#f2da9f] transition-colors hover:bg-[#d4a853] hover:text-[#0b0c0e]"
                      >
                        <span>打开 MyScore 网页版</span>
                        <ArrowUpRight
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      </a>
                    )}
                    <a
                      href={app.releaseHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-1.5 rounded-md border border-white/[0.14] px-4 text-xs font-medium text-[#d8d5ce] transition-colors hover:border-white/35 hover:text-white"
                    >
                      <span>获取最新 APK</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                    <a
                      href={app.githubHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-1 text-xs text-[#9ca2ae] hover:text-[#d4a853]"
                    >
                      <span>GitHub 源码</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Device Visual Column */}
              <div
                className={`flex items-center justify-center border-t border-white/[0.08] bg-[radial-gradient(circle_at_50%_40%,rgba(212,168,83,0.12),rgba(10,11,14,0.98)_72%)] p-8 lg:col-span-5 lg:border-t-0 ${
                  reverse ? 'lg:order-1 lg:border-r' : 'lg:border-l'
                }`}
              >
                <div className="w-56 overflow-hidden rounded-[26px] border-[5px] border-[#262a34] bg-[#07080a] shadow-2xl sm:w-64">
                  <img
                    src={app.image}
                    alt={app.imageAlt}
                    width={720}
                    height={1600}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="block h-auto w-full"
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
