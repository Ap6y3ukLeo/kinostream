import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchKinopoisk, Media, getPosterUrl } from '../services/movieService';
import { motion } from 'framer-motion';
import { Loader2, Film, Tv, Sparkles } from 'lucide-react';
import { LazyImage, MovieCard } from '../components/LazyImage';
import { useDebounce } from '../hooks/useDebounce';
import clsx from 'clsx';

type FilterType = 'all' | 'movie' | 'tv' | 'anime';

export function Search() {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const debouncedQuery = useDebounce(query, 300);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log('Searching for:', searchQuery);
      // Use Kinopoisk API (works from Russia)
      const data = await searchKinopoisk(searchQuery);
      console.log('Search results:', data.length);
      setResults(data);
      if (data.length === 0) {
        setError('Ничего не найдено. Попробуйте другой запрос.');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setError(error?.message || 'Ошибка поиска. Проверьте подключение к интернету.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, performSearch]);

  // Filter results based on selected filter
  const filteredResults = useMemo(() => {
    if (filter === 'all') return results;
    return results.filter(media => {
      if (filter === 'movie') return media.media_type === 'movie';
      if (filter === 'tv') return media.media_type === 'tv';
      if (filter === 'anime') return media.media_type === 'anime';
      return true;
    });
  }, [results, filter]);

  // Memoize movie cards
  const mediaCards = useMemo(() => 
    filteredResults.map((media, i) => (
      <motion.div
        key={media.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: i * 0.05 }}
      >
        <MediaCard media={media} index={i} />
      </motion.div>
    )), 
    [filteredResults]
  );

  const filters: { id: FilterType; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'Все', icon: Film },
    { id: 'movie', label: 'Фильмы', icon: Film },
    { id: 'tv', label: 'Сериалы', icon: Tv },
    { id: 'anime', label: 'Аниме', icon: Sparkles },
  ];

  return (
    <div className="py-6">
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => {
          const Icon = f.icon;
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={clsx(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              )}
            >
              <Icon className="h-4 w-4" />
              {f.label}
            </button>
          );
        })}
      </div>

      <h2 className="mb-8 text-2xl font-semibold tracking-tight">
        Результаты поиска: <span className="text-indigo-400">«{query}»</span>
        {filteredResults.length > 0 && (
          <span className="ml-2 text-base font-normal text-zinc-500">
            ({filteredResults.length} {filteredResults.length === 1 ? 'результат' : filteredResults.length < 5 ? 'результата' : 'результатов'})
          </span>
        )}
      </h2>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : filteredResults.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-6">
          {mediaCards}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Film className="mb-4 h-12 w-12 opacity-20" />
          <p className="text-lg text-red-400">{error}</p>
          <p className="text-sm">Попробуйте изменить поисковый запрос.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Film className="mb-4 h-12 w-12 opacity-20" />
          <p className="text-lg">По вашему запросу ничего не найдено.</p>
          <p className="text-sm">Попробуйте изменить поисковый запрос.</p>
        </div>
      )}
    </div>
  );
}

// Media Card component for all types
interface MediaCardProps {
  media: Media;
  index: number;
}

function MediaCard({ media, index }: MediaCardProps) {
  const mediaTypeLabel = {
    movie: 'Фильм',
    tv: 'Сериал',
    anime: 'Аниме'
  }[media.media_type] || 'Фильм';

  const mediaTypeColor = {
    movie: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    tv: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    anime: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  }[media.media_type] || 'bg-indigo-500/20 text-indigo-400';

  const year = media.release_date ? media.release_date.split('-')[0] : '';
  
  return (
    <Link
      to={`/media/${media.id}?type=${media.media_type}&title=${encodeURIComponent(media.title)}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl bg-zinc-900/50 border border-zinc-800/50 transition-all hover:border-indigo-500/50 hover:bg-zinc-800/50 hover:shadow-xl hover:shadow-indigo-500/10"
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-800">
        <LazyImage
          src={getPosterUrl(media.poster_path)}
          alt={media.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
        
        {/* Media type badge */}
        <div className="absolute top-3 left-3">
          <span className={clsx(
            "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border backdrop-blur-sm",
            mediaTypeColor
          )}>
            {mediaTypeLabel}
          </span>
        </div>
        
        {/* Rating */}
        {media.vote_average > 0 && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-amber-400 backdrop-blur-sm">
              ★ {media.vote_average.toFixed(1)}
            </span>
          </div>
        )}
        
        <div className="absolute bottom-3 left-3 right-3">
          {year && (
            <div className="inline-flex items-center rounded-md bg-zinc-950/80 px-2 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm">
              {year}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors">
          {media.title}
        </h3>
        {media.original_title && media.original_title !== media.title && (
          <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
            {media.original_title}
          </p>
        )}
      </div>
    </Link>
  );
}
