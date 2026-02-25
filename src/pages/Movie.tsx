import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getMovieDetails, getKinopoiskDetails, MediaDetails, getPosterUrl, MediaType, getAllPlayerUrls } from '../services/movieService';
import { motion } from 'framer-motion';
import { Loader2, Play, MonitorPlay, Server, Film, Globe, Tv, Sparkles, Calendar, Clock, Star, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

type PlayerType = 'kodik' | 'alloha' | 'collaps' | 'voidboost' | 'vidsrc' | 'bazon' | 'videocdn' | 'vibix';

interface PlayerOption {
  id: PlayerType;
  name: string;
  icon: React.ElementType;
  description: string;
  type: 'iframe' | 'api';
  supportsAnime: boolean;
  getUrl?: (m: MediaDetails, season?: number, episode?: number) => string;
}

const PLAYERS: PlayerOption[] = [
  { 
    id: 'kodik', 
    name: 'Kodik', 
    icon: Globe, 
    description: 'Kodik плеер',
    type: 'api',
    supportsAnime: true,
  },
  { 
    id: 'alloha', 
    name: 'Alloha', 
    icon: Film, 
    description: 'Alloha плеер',
    type: 'api',
    supportsAnime: false,
  },
  { 
    id: 'collaps', 
    name: 'Collaps', 
    icon: Server, 
    description: 'Collaps балансер',
    type: 'api',
    supportsAnime: true,
  },
  { 
    id: 'bazon', 
    name: 'Bazon', 
    icon: Server, 
    description: 'Bazon балансер',
    type: 'api',
    supportsAnime: true,
  },
  { 
    id: 'videocdn', 
    name: 'VideoCDN', 
    icon: Server, 
    description: 'VideoCDN балансер',
    type: 'api',
    supportsAnime: true,
  },
  { 
    id: 'voidboost', 
    name: 'VoidBoost', 
    icon: Play, 
    description: 'VoidBoost',
    type: 'iframe',
    supportsAnime: true,
    getUrl: (m, season, episode) => {
      if (m.media_type === 'tv' && season) {
        return `https://voidboost.net/serial/${m.tmdb_id}/season/${season}/episode/${episode || 1}`;
      }
      return `https://voidboost.net/iframe/${m.tmdb_id}`;
    }
  },
  { 
    id: 'vidsrc', 
    name: 'VidSrc', 
    icon: MonitorPlay, 
    description: 'Международный плеер',
    type: 'iframe',
    supportsAnime: true,
    getUrl: (m, season, episode) => {
      if (m.media_type === 'tv') {
        return `https://vidsrc.net/embed/tv/${m.tmdb_id}?season=${season}&episode=${episode || 1}`;
      }
      return `https://vidsrc.net/embed/movie/${m.tmdb_id}`;
    }
  },
  { 
    id: 'vibix', 
    name: 'Vibix', 
    icon: Play, 
    description: 'Vibix плеер',
    type: 'iframe',
    supportsAnime: true,
    getUrl: (m, season, episode) => {
      if (m.media_type === 'tv' && season) {
        return `https://vibix.tv/embed/${m.kinopoisk_id}?season=${season}&episode=${episode || 1}`;
      }
      return `https://vibix.tv/embed/${m.kinopoisk_id}`;
    }
  },
];

export function Movie() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const mediaType = (searchParams.get('type') || 'movie') as MediaType;
  
  const [media, setMedia] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerUrls, setPlayerUrls] = useState<Record<string, string>>({});
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [activePlayer, setActivePlayer] = useState<PlayerType>('kodik');
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [iframeKey, setIframeKey] = useState(0);

  const loadMedia = useCallback(async () => {
    if (id) {
      setLoading(true);
      try {
        // First try Kinopoisk API (works from Russia), then fall back to TMDB
        let data = await getKinopoiskDetails(id);
        if (!data) {
          data = await getMovieDetails(id);
        }
        setMedia(data);
      } catch (error) {
        console.error('Failed to load media:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [id]);

  // Load player URLs from APIs
  const loadPlayerUrls = useCallback(async () => {
    if (media) {
      setLoadingPlayers(true);
      try {
        const urls = await getAllPlayerUrls(media, selectedSeason, selectedEpisode);
        console.log('Player URLs:', urls);
        setPlayerUrls(urls);
      } catch (error) {
        console.error('Failed to load player URLs:', error);
      } finally {
        setLoadingPlayers(false);
      }
    }
  }, [media, selectedSeason, selectedEpisode]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  useEffect(() => {
    loadPlayerUrls();
  }, [loadPlayerUrls]);

  const handlePlayerChange = (playerId: PlayerType) => {
    setActivePlayer(playerId);
    setIframeKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="py-20 text-center text-zinc-400">
        Медиафайл не найден.
      </div>
    );
  }

  // Get active player config
  const activePlayerConfig = PLAYERS.find(p => p.id === activePlayer);
  
  // Get iframe URL based on player type
  let iframeUrl = '';
  if (activePlayerConfig?.type === 'api') {
    iframeUrl = playerUrls[activePlayer] || '';
  } else if (activePlayerConfig?.type === 'iframe' && activePlayerConfig.getUrl) {
    iframeUrl = activePlayerConfig.getUrl(media, selectedSeason, selectedEpisode);
  }

  // Filter players based on anime support
  const availablePlayers = PLAYERS.filter(p => 
    media.media_type === 'anime' ? p.supportsAnime : true
  );

  const getMediaTypeIcon = (type: MediaType) => {
    switch (type) {
      case 'tv': return Tv;
      case 'anime': return Sparkles;
      default: return Film;
    }
  };

  const getMediaTypeLabel = (type: MediaType) => {
    switch (type) {
      case 'tv': return 'Сериал';
      case 'anime': return 'Аниме';
      default: return 'Фильм';
    }
  };

  const MediaTypeIcon = getMediaTypeIcon(media.media_type);
  const releaseYear = media.release_date ? media.release_date.split('-')[0] : '';

  return (
    <div className="py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 grid gap-8 md:grid-cols-[300px_1fr]"
      >
        {/* Poster */}
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl">
          <img
            src={getPosterUrl(media.poster_path, 'w780')}
            alt={media.title}
            className="w-full object-cover aspect-[2/3]"
            referrerPolicy="no-referrer"
          />
        </div>
        
        {/* Info */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className={clsx(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border",
              media.media_type === 'tv' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
              media.media_type === 'anime' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
              "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            )}>
              <MediaTypeIcon className="h-4 w-4" />
              {getMediaTypeLabel(media.media_type)}
            </span>
            {media.vote_average > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-400 border border-amber-500/20">
                <Star className="h-4 w-4" />
                {media.vote_average.toFixed(1)}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-zinc-800 px-3 py-1 text-sm font-medium text-zinc-400 border border-zinc-700">
              TMDB: {media.tmdb_id}
            </span>
            {media.imdb_id && (
              <span className="inline-flex items-center rounded-full bg-zinc-800 px-3 py-1 text-sm font-medium text-zinc-400 border border-zinc-700">
                IMDB: {media.imdb_id}
              </span>
            )}
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
            {media.title}
          </h1>
          {(media.original_title || media.original_name) && (
            <p className="mt-2 text-lg text-zinc-400">
              {media.original_title || media.original_name} • {releaseYear}
            </p>
          )}
          
          {/* Meta info */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-400">
            {releaseYear && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {releaseYear}
              </div>
            )}
            {media.runtime && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {media.runtime} мин
              </div>
            )}
            {media.number_of_seasons && (
              <div className="flex items-center gap-1.5">
                <Tv className="h-4 w-4" />
                {media.number_of_seasons} сезон(ов)
              </div>
            )}
          </div>
          
          {/* Genres */}
          {media.genres && media.genres.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {media.genres.map((genre) => (
                <span 
                  key={genre.id}
                  className="inline-flex items-center rounded-full bg-zinc-800 px-3 py-1 text-sm font-medium text-zinc-300"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {/* Overview */}
          {media.overview && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-zinc-200">О {media.media_type === 'tv' ? 'сериале' : media.media_type === 'anime' ? 'аниме' : 'фильме'}</h3>
              <p className="mt-2 text-zinc-400 leading-relaxed max-w-3xl">
                {media.overview}
              </p>
            </div>
          )}

          {/* Seasons/Episodes selector for TV */}
          {(media.media_type === 'tv' || media.media_type === 'anime') && media.seasons && media.seasons.length > 0 && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-4">
                {/* Season selector */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-2">Сезон</h3>
                  <div className="flex flex-wrap gap-2">
                    {media.seasons
                      .filter(s => s.season_number > 0)
                      .slice(0, 10)
                      .map((season) => (
                        <button
                          key={season.season_number}
                          onClick={() => setSelectedSeason(season.season_number)}
                          className={clsx(
                            "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                            selectedSeason === season.season_number
                              ? "bg-indigo-600 text-white"
                              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                          )}
                        >
                          {season.season_number}
                        </button>
                      ))}
                  </div>
                </div>
                
                {/* Episode selector */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-2">Серия</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: Math.min(20, media.number_of_episodes || 12) }, (_, i) => i + 1).map((ep) => (
                      <button
                        key={ep}
                        onClick={() => setSelectedEpisode(ep)}
                        className={clsx(
                          "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                          selectedEpisode === ep
                            ? "bg-indigo-600 text-white"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                        )}
                      >
                        {ep}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Warning for anime */}
      {media.media_type === 'anime' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4"
        >
          <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-rose-400">Аниме</p>
            <p className="text-sm text-zinc-400 mt-1">
              Для аниме рекомендуется: Kodik, Collaps, VoidBoost
            </p>
          </div>
        </motion.div>
      )}

      {/* Player Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 sm:p-6"
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Смотреть онлайн</h2>
            {loadingPlayers && <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {availablePlayers.map((player) => {
              const Icon = player.icon;
              const isActive = activePlayer === player.id;
              return (
                <button
                  key={player.id}
                  onClick={() => handlePlayerChange(player.id)}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                      : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                  title={player.description}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{player.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-2xl">
          {loadingPlayers ? (
            <div className="flex items-center justify-center h-full text-zinc-500">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mr-2" />
              Загрузка плеера...
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
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-4 text-center">
              <p>Плеер недоступен для этого контента.</p>
              <p className="text-sm mt-2">Попробуйте другой плеер.</p>
            </div>
          )}
          
          <div className="pointer-events-none absolute left-4 top-4 rounded-md bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md z-10">
            {activePlayerConfig?.name}
          </div>
        </div>
        
        <p className="mt-4 text-center text-sm text-zinc-500">
          Если плеер не работает, попробуйте другой вариант.
        </p>
      </motion.div>
    </div>
  );
}
