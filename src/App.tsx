import { useCallback, useEffect, useState } from 'react';
import { IndexDrawer } from './components/IndexDrawer';
import { TopBar } from './components/TopBar';
import { PORTAL_ENTRIES, type SectionId } from './data/collections';
import { parseSectionFromHash } from './utils/collectionLogic';
import { AppsView } from './views/AppsView';
import { BooksView } from './views/BooksView';
import { FilmsView } from './views/FilmsView';
import { GamesView } from './views/GamesView';
import { HomeView } from './views/HomeView';
import { PaintingsView } from './views/PaintingsView';
import { PhotographyView } from './views/PhotographyView';
import { PoemsView } from './views/PoemsView';
import { SeriesView } from './views/SeriesView';
import { SportView } from './views/SportView';

const SUBVIEW_ORDER: SectionId[] = [
  'photo',
  'books',
  'poems',
  'paintings',
  'sport',
  'series',
  'films',
  'games',
  'apps',
];

export function App() {
  const [section, setSection] = useState<SectionId>(() =>
    parseSectionFromHash(window.location.hash),
  );
  const [indexOpen, setIndexOpen] = useState(false);
  const closeIndex = useCallback(() => setIndexOpen(false), []);

  const navigate = useCallback((next: SectionId) => {
    setSection(next);
    const nextHash = next === 'home' ? '' : `#${next}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, '', nextHash || window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const onHashOrPop = () => {
      setSection(parseSectionFromHash(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('hashchange', onHashOrPop);
    window.addEventListener('popstate', onHashOrPop);
    return () => {
      window.removeEventListener('hashchange', onHashOrPop);
      window.removeEventListener('popstate', onHashOrPop);
    };
  }, []);

  const currentIdx = SUBVIEW_ORDER.indexOf(section);
  const prevSection =
    currentIdx >= 0
      ? SUBVIEW_ORDER[
          (currentIdx - 1 + SUBVIEW_ORDER.length) % SUBVIEW_ORDER.length
        ]
      : null;
  const nextSection =
    currentIdx >= 0
      ? SUBVIEW_ORDER[(currentIdx + 1) % SUBVIEW_ORDER.length]
      : null;

  const prevEntry = prevSection
    ? PORTAL_ENTRIES.find((e) => e.id === prevSection)
    : null;
  const nextEntry = nextSection
    ? PORTAL_ENTRIES.find((e) => e.id === nextSection)
    : null;

  return (
    <div
      data-active-section={section}
      className="min-h-dvh bg-[#0b0c0e] text-[#eae7e1]"
    >
      <TopBar
        activeSection={section}
        onNavigate={navigate}
        onOpenIndex={() => setIndexOpen(true)}
      />

      <main id="main-content">
        {section === 'home' && <HomeView onNavigate={navigate} />}
        {section === 'photo' && <PhotographyView onNavigate={navigate} />}
        {section === 'books' && <BooksView onNavigate={navigate} />}
        {section === 'poems' && <PoemsView onNavigate={navigate} />}
        {section === 'paintings' && <PaintingsView onNavigate={navigate} />}
        {section === 'sport' && <SportView onNavigate={navigate} />}
        {section === 'series' && <SeriesView onNavigate={navigate} />}
        {section === 'films' && <FilmsView onNavigate={navigate} />}
        {section === 'games' && <GamesView onNavigate={navigate} />}
        {section === 'apps' && <AppsView onNavigate={navigate} />}
      </main>

      {section !== 'home' && (
        <footer className="border-t border-white/[0.08] bg-[#090a0d]">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-8 lg:px-10">
            {prevEntry && prevSection ? (
              <button
                type="button"
                onClick={() => navigate(prevSection)}
                className="cursor-pointer text-left text-xs text-[#9ca2ae] transition-colors hover:text-[#d4a853]"
              >
                <span className="block font-mono-tabular text-[10px] text-[#6d7380]">
                  上一展区 · {prevEntry.index}
                </span>
                <span className="mt-0.5 block text-sm font-medium text-[#eae7e1]">
                  ← {prevEntry.label} · {prevEntry.zhLabel}
                </span>
              </button>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={() => navigate('home')}
              className="cursor-pointer font-mono-tabular text-xs tracking-[0.14em] text-[#8a909d] transition-colors hover:text-[#d4a853]"
            >
              N1GHT CHXN9 · 返回首页
            </button>

            {nextEntry && nextSection ? (
              <button
                type="button"
                onClick={() => navigate(nextSection)}
                className="cursor-pointer text-right text-xs text-[#9ca2ae] transition-colors hover:text-[#d4a853]"
              >
                <span className="block font-mono-tabular text-[10px] text-[#6d7380]">
                  下一展区 · {nextEntry.index}
                </span>
                <span className="mt-0.5 block text-sm font-medium text-[#eae7e1]">
                  {nextEntry.label} · {nextEntry.zhLabel} →
                </span>
              </button>
            ) : (
              <span />
            )}
          </div>
        </footer>
      )}

      <IndexDrawer
        open={indexOpen}
        activeSection={section}
        onClose={closeIndex}
        onNavigate={navigate}
      />
    </div>
  );
}
export default App;
