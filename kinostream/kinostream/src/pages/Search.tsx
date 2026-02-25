import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchMovies, Movie } from '../services/movieService';
import { motion } from 'framer-motion';
import { Loader2, Film } from 'lucide-react';

export function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      setLoading(true);
      searchMovies(query)
        .then((data) => setMovies(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [query]);

  return (
    <div className="py-6">
      <h2 className="mb-8 text-2xl font-semibold tracking-tight">
        Результаты поиска по запросу: <span className="text-indigo-400">«{query}»</span>
      </h2>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-6">
          {movies.map((movie, i) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                to={`/movie/${movie.id}?title=${encodeURIComponent(movie.title)}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl bg-zinc-900/50 border border-zinc-800/50 transition-all hover:border-indigo-500/50 hover:bg-zinc-800/50 hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-800">
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="inline-flex items-center rounded-md bg-zinc-950/80 px-2 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm">
                      {movie.year}
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors">
                    {movie.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                    {movie.genre}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
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
