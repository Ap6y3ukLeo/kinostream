import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getMovieDetails, Movie as MovieType } from '../services/movieService';
import { motion } from 'framer-motion';
import { Loader2, Play, MonitorPlay, Server, Film, Globe } from 'lucide-react';
import clsx from 'clsx';

type PlayerType = 'yohoho' | 'vidsrc' | 'embedsu' | 'multiembed';

interface PlayerOption {
  id: PlayerType;
  name: string;
  icon: React.ElementType;
  description: string;
  type: 'iframe' | 'script';
  getUrl?: (movie: MovieType) => string;
}

const PLAYERS: PlayerOption[] = [
  { 
    id: 'yohoho', 
    name: 'Yohoho (RU)', 
    icon: Server, 
    description: 'Русский агрегатор (Alloha, Kodik и др.)',
    type: 'script'
  },
  { 
    id: 'vidsrc', 
    name: 'VidSrc', 
    icon: Film, 
    description: 'Международный плеер (EN)',
    type: 'iframe',
    getUrl: (m) => `https://vidsrc.me/embed/movie?imdb=${m.imdb_id}`
  },
  { 
    id: 'embedsu', 
    name: 'Embed.su', 
    icon: Globe, 
    description: 'Международный плеер (EN/RU субтитры)',
    type: 'iframe',
    getUrl: (m) => `https://embed.su/embed/movie/${m.imdb_id}`
  },
  { 
    id: 'multiembed', 
    name: 'MultiEmbed', 
    icon: MonitorPlay, 
    description: 'Резервный плеер',
    type: 'iframe',
    getUrl: (m) => `https://multiembed.mov/directstream.php?video_id=${m.imdb_id}`
  },
];

export function Movie() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const titleHint = searchParams.get('title') || '';
  
  const [movie, setMovie] = useState<MovieType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePlayer, setActivePlayer] = useState<PlayerType>('yohoho');
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getMovieDetails(id, titleHint)
        .then(setMovie)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, titleHint]);

  // Handle Yohoho script injection for Single Page Application
  useEffect(() => {
    if (activePlayer === 'yohoho' && movie) {
      const initYohoho = () => {
        // Yohoho exposes a global `yo()` function to re-initialize the player
        if (typeof (window as any).yo === 'function') {
          (window as any).yo();
        }
      };

      const scriptId = 'yohoho-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement;

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = '//yohoho.cc/yo.js';
        script.async = true;
        script.onload = initYohoho;
        document.body.appendChild(script);
      } else {
        // Small delay to ensure the DOM element #yohoho is rendered
        setTimeout(initYohoho, 100);
      }
    }
  }, [activePlayer, movie, iframeKey]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="py-20 text-center text-zinc-400">
        Фильм не найден.
      </div>
    );
  }

  const activePlayerConfig = PLAYERS.find(p => p.id === activePlayer);
  const iframeUrl = activePlayerConfig?.type === 'iframe' && activePlayerConfig.getUrl 
    ? activePlayerConfig.getUrl(movie) 
    : '';

  return (
    <div className="py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 grid gap-8 md:grid-cols-[300px_1fr]"
      >
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl">
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full object-cover aspect-[2/3]"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
            {movie.title}
          </h1>
          <p className="mt-2 text-lg text-zinc-400">
            {movie.original_title} • {movie.year}
          </p>
          
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-zinc-800 px-3 py-1 text-sm font-medium text-zinc-300">
              {movie.genre}
            </span>
            <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-400 ring-1 ring-indigo-500/20">
              KP: {movie.kinopoisk_id}
            </span>
            {movie.imdb_id && (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-400 ring-1 ring-amber-500/20">
                IMDB: {movie.imdb_id}
              </span>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-zinc-200">О фильме</h3>
            <p className="mt-2 text-zinc-400 leading-relaxed max-w-3xl">
              {movie.description}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 sm:p-6"
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold">Смотреть онлайн</h2>
          
          <div className="flex flex-wrap gap-2">
            {PLAYERS.map((player) => {
              const Icon = player.icon;
              const isActive = activePlayer === player.id;
              return (
                <button
                  key={player.id}
                  onClick={() => {
                    setActivePlayer(player.id);
                    setIframeKey(prev => prev + 1);
                  }}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                      : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                  title={player.description}
                >
                  <Icon className="h-4 w-4" />
                  {player.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-2xl">
          {activePlayerConfig?.type === 'script' ? (
            <div 
              id="yohoho" 
              data-kinopoisk={movie.kinopoisk_id} 
              className="absolute inset-0 h-full w-full bg-zinc-950 flex items-center justify-center text-zinc-500"
            >
              Загрузка плеера Yohoho... (Отключите блокировщик рекламы, если плеер не появляется)
            </div>
          ) : iframeUrl ? (
            <iframe
              key={iframeKey}
              src={iframeUrl}
              className="absolute inset-0 h-full w-full border-0"
              allowFullScreen
              allow="autoplay; fullscreen"
              title={`Player ${activePlayer}`}
            ></iframe>
          ) : (
             <div className="flex h-full w-full items-center justify-center text-zinc-500">
               Плеер недоступен
             </div>
          )}
          
          <div className="pointer-events-none absolute left-4 top-4 rounded-md bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md z-10">
            Источник: {activePlayerConfig?.name}
          </div>
        </div>
        
        <p className="mt-4 text-center text-sm text-zinc-500">
          Если видео не работает или не загружается, попробуйте выбрать другой плеер или отключить блокировщик рекламы (AdBlock/uBlock).
        </p>
      </motion.div>
    </div>
  );
}
