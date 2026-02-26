import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getKinopoiskDetails, getKinopoiskSeasons, MediaDetails, getPosterUrl, MediaType, Season, getVibixEmbedData, VibixEmbedData } from '../services/movieService';
import { motion } from 'framer-motion';
import { Loader2, Play, Film, Tv, Sparkles, Calendar, Clock, Star, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

type PlayerType = 'vidsrc' | 'vibix' | 'rendex';

interface PlayerOption {
  id: PlayerType;
  name: string;
  icon: React.ElementType;
  description: string;
}

const PLAYERS: PlayerOption[] = [
  { 
    id: 'vidsrc', 
    name: 'VidSrc', 
    icon: Play, 
    description: 'VidSrc плеер',
  },
  { 
    id: 'vibix', 
    name: 'Vibix', 
    icon: Play, 
    description: 'Vibix плеер',
  },
  { 
    id: 'rendex', 
    name: 'Rendex', 
    icon: Play, 
    description: 'Rendex плеер',
  },
];

export function Movie() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const mediaType = (searchParams.get('type') || 'movie') as MediaType;
  
  const [media, setMedia] = useState<MediaDetails | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlayer, setActivePlayer] = useState<PlayerType>('vidsrc');
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [iframeKey, setIframeKey] = useState(0);
  const [playerUrl, setPlayerUrl] = useState<string>('');
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [vibixEmbedData, setVibixEmbedData] = useState<VibixEmbedData | null>(null);
  const rendexRef = React.useRef<HTMLModElement | null>(null);
  const vibixRef = React.useRef<HTMLModElement | null>(null);

  // Initialize Rendex SDK when switching to rendex player
  useEffect(() => {
    if (activePlayer === 'rendex') {
      if ((window as any).rendex) {
        setTimeout(() => {
          (window as any).rendex.init();
        }, 100);
      }
    }
  }, [activePlayer, media?.kinopoisk_id]);

  // Load Vibix embed data when switching to vibix player
  useEffect(() => {
    const kpId = media?.kinopoisk_id;
    if (activePlayer === 'vibix' && kpId) {
      const loadVibixData = async () => {
        const data = await getVibixEmbedData(
          kpId,
          media.media_type === 'tv' || media.media_type === 'anime' ? selectedSeason : undefined,
          media.media_type === 'tv' || media.media_type === 'anime' ? selectedEpisode : undefined
        );
        setVibixEmbedData(data);
        
        // Initialize Rendex SDK for Vibix as well (same player)
        if ((window as any).rendex) {
          setTimeout(() => {
            (window as any).rendex.init();
          }, 100);
        }
      };
      loadVibixData();
    }
  }, [activePlayer, media?.kinopoisk_id, selectedSeason, selectedEpisode, media?.media_type]);

  const loadMedia = useCallback(async () => {
    if (id) {
      setLoading(true);
      try {
        const data = await getKinopoiskDetails(id);
        setMedia(data);
        
        // Load seasons for TV shows/anime
        if (data && (data.media_type === 'tv' || data.media_type === 'anime')) {
          const seasonsData = await getKinopoiskSeasons(id);
          setSeasons(seasonsData);
          console.log('Loaded seasons:', seasonsData);
        }
      } catch (error) {
        console.error('Failed to load media:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Reset season/episode when media changes
  useEffect(() => {
    if (media) {
      setSelectedSeason(1);
      setSelectedEpisode(1);
      setIframeKey(prev => prev + 1);
    }
  }, [media?.id]);

  const getPlayerUrl = useCallback(async (): Promise<string> => {
    if (!media) return '';
    
    const imdbId = media.imdb_id;
    const kpId = media.kinopoisk_id;
    
    if (activePlayer === 'vidsrc') {
      // VidSrc uses IMDB ID, fallback to KP ID format
      if (media.media_type === 'tv' || media.media_type === 'anime') {
        // For TV shows, try to use season/episode
        const idToUse = imdbId || (kpId ? `kp-${kpId}` : '');
        if (idToUse) {
          return `https://vidsrc.net/embed/tv/${idToUse}?season=${selectedSeason}&episode=${selectedEpisode}`;
        }
      } else {
        // For movies
        const idToUse = imdbId || (kpId ? `kp-${kpId}` : '');
        if (idToUse) {
          return `https://vidsrc.net/embed/movie/${idToUse}`;
        }
      }
    }

    if (activePlayer === 'vibix' && kpId) {
      // Vibix uses API with Bearer token - embed data is loaded via useEffect
      // Return iframe URL as fallback if embed data is not available
      return vibixEmbedData?.iframeUrl || '';
    }
    
    return '';
  }, [media, activePlayer, selectedSeason, selectedEpisode]);

  // Load player URL when player or episode changes
  useEffect(() => {
    const loadPlayerUrl = async () => {
      if (!media) return;
      setLoadingPlayer(true);
      try {
        const url = await getPlayerUrl();
        console.log('Player URL:', url);
        setPlayerUrl(url);
      } catch (error) {
        console.error('Error loading player URL:', error);
        setPlayerUrl('');
      } finally {
        setLoadingPlayer(false);
      }
    };
    loadPlayerUrl();
  }, [getPlayerUrl, media, activePlayer, selectedSeason, selectedEpisode]);



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

  const isTV = media.media_type === 'tv' || media.media_type === 'anime';

  // Get max episodes for current season
  const currentSeasonData = seasons.find(s => s.season_number === selectedSeason);
  const maxEpisodes = currentSeasonData?.episode_count || 12;
  const episodesArray = Array.from({ length: Math.max(maxEpisodes, 1) }, (_, i) => i + 1);

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
              KP: {media.kinopoisk_id}
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
            {seasons.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tv className="h-4 w-4" />
                {seasons.length} сезон(ов)
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

          {/* Season/Episode selector for TV and Anime */}
          {isTV && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-6">
                {/* Season selector */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-3">Сезон</h3>
                  <div className="flex flex-wrap gap-2 max-w-[400px]">
                    {seasons.length > 0 ? (
                      seasons.map((season) => (
                        <button
                          key={season.season_number}
                          onClick={() => {
                            setSelectedSeason(season.season_number);
                            setSelectedEpisode(1);
                            setIframeKey(prev => prev + 1);
                          }}
                          className={clsx(
                            "rounded-lg px-3 py-1.5 text-sm font-medium transition-all min-w-[50px]",
                            selectedSeason === season.season_number
                              ? "bg-indigo-600 text-white"
                              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                          )}
                          title={`${season.name} (${season.episode_count} серий)`}
                        >
                          {season.season_number}
                        </button>
                      ))
                    ) : (
                      // Fallback if no seasons data
                      Array.from({ length: 10 }, (_, i) => i + 1).map((season) => (
                        <button
                          key={season}
                          onClick={() => {
                            setSelectedSeason(season);
                            setSelectedEpisode(1);
                            setIframeKey(prev => prev + 1);
                          }}
                          className={clsx(
                            "rounded-lg px-3 py-1.5 text-sm font-medium transition-all min-w-[50px]",
                            selectedSeason === season
                              ? "bg-indigo-600 text-white"
                              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                          )}
                        >
                          {season}
                        </button>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Episode selector */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-3">Серия</h3>
                  <div className="flex flex-wrap gap-2 max-w-[400px]">
                    {episodesArray.map((ep) => (
                      <button
                        key={ep}
                        onClick={() => {
                          setSelectedEpisode(ep);
                          setIframeKey(prev => prev + 1);
                        }}
                        className={clsx(
                          "rounded-lg px-3 py-1.5 text-sm font-medium transition-all min-w-[50px]",
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
              Выберите сезон и серию выше для просмотра.
            </p>
          </div>
        </motion.div>
      )}

      {/* Player Section */}
      <motion.div
        id="player-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 sm:p-6"
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Смотреть онлайн</h2>
            {isTV && (
              <span className="text-sm text-zinc-400">
                (Сезон {selectedSeason}, Серия {selectedEpisode})
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {PLAYERS.map((player) => {
              const Icon = player.icon;
              const isActive = activePlayer === player.id;
              return (
                <button
                  key={player.id}
                  onClick={() => setActivePlayer(player.id as PlayerType)}
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
          {loadingPlayer ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
              <p className="mt-2">Загрузка плеера...</p>
            </div>
          ) : activePlayer === 'rendex' ? (
            <ins 
              ref={rendexRef}
              className="rendex-player w-full h-full min-h-[370px]"
              data-publisher-id="677077910"
              data-type={(media?.media_type === 'tv' || media?.media_type === 'anime') ? 'series' : 'kp'}
              data-id={media?.kinopoisk_id?.toString() || ''}
              data-season={media && (media.media_type === 'tv' || media.media_type === 'anime') ? selectedSeason : undefined}
              data-episodes={media && (media.media_type === 'tv' || media.media_type === 'anime') ? selectedEpisode : undefined}
              data-design="1"
            ></ins>
          ) : activePlayer === 'vibix' && vibixEmbedData?.publisherId && vibixEmbedData?.videoId ? (
            <ins 
              ref={vibixRef}
              className="rendex-player w-full h-full min-h-[370px]"
              data-publisher-id={vibixEmbedData.publisherId}
              data-type={vibixEmbedData.videoType || 'kp'}
              data-id={vibixEmbedData.videoId}
              data-season={media && (media.media_type === 'tv' || media.media_type === 'anime') ? selectedSeason : undefined}
              data-episodes={media && (media.media_type === 'tv' || media.media_type === 'anime') ? selectedEpisode : undefined}
              data-design="1"
            ></ins>
          ) : activePlayer === 'vibix' && vibixEmbedData?.iframeUrl ? (
            <iframe
              key={iframeKey}
              src={vibixEmbedData.iframeUrl}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              referrerPolicy="no-referrer"
              title="Player"
            ></iframe>
          ) : playerUrl ? (
            <iframe
              key={iframeKey}
              src={playerUrl}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              referrerPolicy="no-referrer"
              title="Player"
            ></iframe>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-4 text-center">
              <p>Плеер недоступен.</p>
              <p className="text-sm mt-2">Попробуйте позже.</p>
            </div>
          )}
          
          <div className="pointer-events-none absolute left-4 top-4 rounded-md bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md z-10">
            {activePlayer === 'vidsrc' ? 'VidSrc' : activePlayer === 'vibix' ? 'Vibix' : 'Rendex'}
          </div>
        </div>
        
        <p className="mt-4 text-center text-sm text-zinc-500">
          Если плеер не работает, попробуйте выбрать другой сезон или серию.
        </p>
      </motion.div>
    </div>
  );
}
