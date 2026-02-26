import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDebounce } from '../hooks/useDebounce';

export function Home() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  // Add Yandex Metrika
  useEffect(() => {
    // Add Yandex Metrika script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    script.onload = () => {
      if ((window as any).ym) {
        (window as any).ym(107008941, 'init', {
          ssr: true,
          webvisor: true,
          clickmap: true,
          ecommerce: "dataLayer",
          referrer: document.referrer,
          url: location.href,
          accurateTrackBounce: true,
          trackLinks: true
        });
      }
    };
    document.head.appendChild(script);

    // Add noscript image
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.src = 'https://mc.yandex.ru/watch/107008941';
    img.style.position = 'absolute';
    img.style.left = '-9999px';
    img.alt = '';
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    return () => {
      // Cleanup
      document.head.removeChild(script);
      document.body.removeChild(noscript);
    };
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (debouncedQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(debouncedQuery.trim())}`);
    }
  }, [debouncedQuery, navigate]);

  // Memoize the search icon
  const searchIcon = useMemo(() => <Search className="absolute left-4 h-6 w-6 text-zinc-400" />, []);

  return (
    <div>
      {/* Hero Section */}
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-indigo-500/10 p-4 text-indigo-400 ring-1 ring-indigo-500/20">
              <PlayCircle className="h-12 w-12" />
            </div>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Смотрите фильмы <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              без ограничений
            </span>
          </h1>
          <p className="mb-10 text-lg text-zinc-400 sm:text-xl">
            Найдите любой фильм, сериал или аниме и выберите удобный плеер для просмотра.
          </p>

          <form onSubmit={handleSearch} className="relative mx-auto max-w-xl">
            <div className="relative flex items-center shadow-2xl shadow-indigo-500/10 rounded-full">
              {searchIcon}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Введите название, например «Интерстеллар»"
                className="w-full rounded-full border border-zinc-700 bg-zinc-900/80 py-4 pl-14 pr-32 text-lg text-zinc-100 placeholder-zinc-500 backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
              >
                Найти
              </button>
            </div>
          </form>

          {/* Vibix Button */}
          <div className="mt-8">
            <a
              href="https://vibix.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              <PlayCircle className="h-5 w-5" />
              Открыть Vibix плеер
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
