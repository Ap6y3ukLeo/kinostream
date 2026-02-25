import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, PlayCircle, Film, Tv, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDebounce } from '../hooks/useDebounce';
import { getTrending, getPopularMovies, getPopularTVShows, getAnime, Media, getPosterUrl } from '../services/movieService';
import { LazyImage } from '../components/LazyImage';
import clsx from 'clsx';

type TabType = 'trending' | 'movies' | 'tv' | 'anime';

export function Home() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (debouncedQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(debouncedQuery.trim())}`);
    }
  }, [debouncedQuery, navigate]);

  // Load content based on active tab
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        let data: Media[] = [];
        switch (activeTab) {
          case 'trending':
            data = await getTrending();
            break;
          case 'movies':
            data = await getPopularMovies();
            break;
          case 'tv':
            data = await getPopularTVShows();
            break;
          case 'anime':
            data = await getAnime();
            break;
        }
        setMediaList(data);
      } catch (error) {
        console.error('Failed to load content:', error);
        setMediaList([]);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [activeTab]);

  // Memoize the search icon
  const searchIcon = useMemo(() => <Search className="absolute left-4 h-6 w-6 text-zinc-400" />, []);
  
  // Memoize media cards
  const mediaCards = useMemo(() => 
    mediaList.map((media, i) => (
      <motion.div
        key={media.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: i * 0.05 }}
      >
        <MediaCard media={media} index={i} />
      </motion.div>
    )), 
    [mediaList]
  );

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'trending', label: 'Популярное', icon: TrendingUp },
    { id: 'movies', label: 'Фильмы', icon: Film },
    { id: 'tv', label: 'Сериалы', icon: Tv },
    { id: 'anime', label: 'Аниме', icon: Sparkles },
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center py-12">
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
            Найдите любой фильм, сериал или аниме и выберите удобный плеер для просмотра. Yohoho, Alloha, Kodik и другие в одном месте.
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
        </motion.div>
      </div>

      {/* Content Section */}
      <div className="py-8">
        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : mediaList.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-6">
            {mediaCards}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Film className="mb-4 h-12 w-12 opacity-20" />
            <p className="text-lg">Контент не найден</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Media Card component
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
