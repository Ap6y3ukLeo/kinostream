import { useState, useCallback, ImgHTMLAttributes, memo } from 'react';
import { Image } from 'lucide-react';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad'> {
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
}

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  fallbackSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"%3E%3Crect fill="%2327171a" width="400" height="600"/%3E%3Ctext fill="%2371717a" font-family="system-ui" font-size="16" x="50%25" y="50%25" text-anchor="middle"%3EЗагрузка...%3C/text%3E%3C/svg%3E',
  placeholder,
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  return (
    <div className={`relative ${className || ''}`}>
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
          {placeholder || (
            <div className="flex flex-col items-center gap-2 text-zinc-500">
              <Image className="h-8 w-8 animate-pulse" />
              <span className="text-xs">Загрузка...</span>
            </div>
          )}
        </div>
      )}
      
      {/* Image */}
      <img
        src={hasError ? fallbackSrc : src}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className || ''}`}
        {...props}
      />
    </div>
  );
});

// Memoized Movie Card component
interface MovieCardProps {
  movie: {
    id: string;
    title: string;
    poster_url: string;
    year: number;
    genre: string;
  };
  index: number;
}

export const MovieCard = memo(function MovieCard({ movie, index }: MovieCardProps) {
  return (
    <a
      href={`/movie/${movie.id}?title=${encodeURIComponent(movie.title)}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl bg-zinc-900/50 border border-zinc-800/50 transition-all hover:border-indigo-500/50 hover:bg-zinc-800/50 hover:shadow-xl hover:shadow-indigo-500/10"
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-800">
        <LazyImage
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
    </a>
  );
});
