// KinoStream API Service
// Uses TMDB API and Kinopoisk Unofficial API

// Kinopoisk API Configuration
const KINOPOISK_API_BASE = 'https://kinopoiskapiunofficial.tech';
const KINOPOISK_API_KEY = 'a926c834-5942-4c1e-88f6-54f11502e626'; // User provided token

// Types
export type MediaType = 'movie' | 'tv' | 'anime';

export interface Media {
  id: number;
  tmdb_id: number;
  imdb_id: string | null;
  kinopoisk_id: number | null;
  shikimori_id?: string | null;
  title: string;
  original_title: string;
  name?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  media_type: MediaType;
  genre_ids: number[];
  genres?: Genre[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface MediaDetails extends Media {
  runtime: number | null;
  episode_run_time?: number[];
  status: string;
  tagline: string | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  seasons: Season[];
}

export interface Season {
  season_number: number;
  name: string;
  poster_path: string | null;
  episode_count: number;
  air_date: string | null;
}

// TMDB API
const TMDB_API_KEY = '2dca580c2a14b55200e784d157207b4d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Proxy configuration - user can set this via environment variable
// Or use a local proxy: http://localhost:7890 (common for V2Ray/Clash)
const PROXY_URL = import.meta.env.VITE_PROXY_URL || '';

// Player API tokens
const KODIK_TOKEN = 'b7cc4293ed475c4ad1fd599d114f4435';
const ALLOHA_TOKEN = 'd317441359e505c343c2063edc97e7';
const COLLAPS_TOKEN = 'eedefb541aeba871dcfc756e6b31c02e';
const BAZON_TOKEN = '2848f79ca09d4bbbf419bcdb464b4d11';
const VIDEOCDN_TOKEN = 'pfp3D870PGEY3Afjti0gMtSfmn2aZqih';

// Get poster URL
export const getPosterUrl = (path: string | null, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string => {
  if (!path) return '';
  // Handle Shikimori URLs
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

// Search movies, TV shows, and anime using Kinopoisk API (works from Russia)
export async function searchKinopoisk(query: string, signal?: AbortSignal): Promise<Media[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  try {
    const url = new URL(`${KINOPOISK_API_BASE}/api/v2.1/films/search-by-keyword`);
    url.searchParams.append('keyword', trimmedQuery);
    url.searchParams.append('page', '1');

    console.log('Kinopoisk search:', url.toString());
    const response = await fetch(url.toString(), {
      signal,
      headers: {
        'X-API-KEY': KINOPOISK_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Kinopoisk API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Kinopoisk response:', data);
    
    if (!data.films || data.films.length === 0) {
      return [];
    }

    // Transform Kinopoisk results to our Media format
    const mediaResults: Media[] = data.films.slice(0, 20).map((film: any) => ({
      id: film.filmId,
      tmdb_id: 0, // Will be fetched later if needed
      kinopoisk_id: film.filmId,
      imdb_id: null,
      title: film.nameRu || film.nameEn || '',
      original_title: film.nameEn || film.nameOriginal || '',
      name: film.nameRu || film.nameEn || '',
      original_name: film.nameEn || film.nameOriginal || '',
      overview: film.description || '',
      poster_path: film.posterUrl ? film.posterUrl.replace('https://kinopoiskapiunofficial.tech', '') : null,
      backdrop_path: null,
      release_date: film.year || '',
      first_air_date: film.year,
      vote_average: parseFloat(film.rating) || 0,
      vote_count: film.ratingVoteCount || 0,
      media_type: film.type === 'SERIAL' ? 'tv' : 'movie',
      genre_ids: [],
    }));

    return mediaResults;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw e;
    }
    console.error('Kinopoisk search error:', e);
    return [];
  }
}

// Search movies, TV shows, and anime (TMDB - may be blocked in Russia)
export async function searchMulti(query: string, signal?: AbortSignal): Promise<Media[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  try {
    const url = new URL(`${TMDB_BASE_URL}/search/multi`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    url.searchParams.append('query', trimmedQuery);
    url.searchParams.append('include_adult', 'false');
    url.searchParams.append('language', 'ru-RU');

    console.log('TMDB search:', url.toString());
    const response = await fetch(url.toString(), { signal });
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    const mediaResults = data.results
      .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
      .slice(0, 20)
      .map(transformMedia);

    return mediaResults;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw e;
    }
    console.error('Search error:', e);
    return [];
  }
}

// Get popular movies from Kinopoisk API (works from Russia)
export async function getKinopoiskPopular(signal?: AbortSignal): Promise<Media[]> {
  try {
    // Kinopoisk API has /api/v2.2/films/premieres endpoint
    const url = new URL(`${KINOPOISK_API_BASE}/api/v2.2/films/premieres`);
    url.searchParams.append('year', String(new Date().getFullYear()));
    url.searchParams.append('month', '1'); // January - we'll just get any premieres
    
    console.log('Kinopoisk popular:', url.toString());
    const response = await fetch(url.toString(), {
      signal,
      headers: {
        'X-API-KEY': KINOPOISK_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Kinopoisk API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Kinopoisk premieres:', data);
    
    if (!data.items || data.items.length === 0) {
      return [];
    }

    // Transform Kinopoisk results to our Media format
    const mediaResults: Media[] = data.items.slice(0, 20).map((film: any) => ({
      id: film.kinopoiskId,
      tmdb_id: 0,
      kinopoisk_id: film.kinopoiskId,
      imdb_id: null,
      title: film.nameRu || film.nameEn || '',
      original_title: film.nameEn || '',
      name: film.nameRu || film.nameEn || '',
      original_name: film.nameEn || '',
      overview: film.description || '',
      poster_path: film.posterUrl ? film.posterUrl.replace('https://kinopoiskapiunofficial.tech', '') : null,
      backdrop_path: null,
      release_date: film.year || '',
      first_air_date: film.year,
      vote_average: film.ratingKinopoisk || 0,
      vote_count: film.ratingKinopoiskVoteCount || 0,
      media_type: film.type === 'SERIAL' ? 'tv' : 'movie',
      genre_ids: [],
    }));

    return mediaResults;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw e;
    }
    console.error('Kinopoisk popular error:', e);
    return [];
  }
}

// Get movie details from Kinopoisk API (works from Russia)
export async function getKinopoiskDetails(id: string, signal?: AbortSignal): Promise<MediaDetails | null> {
  if (!id) return null;

  const kpId = parseInt(id, 10);
  if (isNaN(kpId)) return null;

  try {
    const url = new URL(`${KINOPOISK_API_BASE}/api/v2.2/films/${kpId}`);
    
    console.log('Kinopoisk details:', url.toString());
    const response = await fetch(url.toString(), {
      signal,
      headers: {
        'X-API-KEY': KINOPOISK_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Kinopoisk API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Kinopoisk film data:', data);

    // Transform Kinopoisk data to our MediaDetails format
    return {
      id: data.kinopoiskId,
      tmdb_id: 0,
      kinopoisk_id: data.kinopoiskId,
      imdb_id: data.imdbId || null,
      title: data.nameRu || data.nameEn || data.nameOriginal || '',
      original_title: data.nameOriginal || data.nameEn || '',
      name: data.nameRu || data.nameEn || '',
      original_name: data.nameOriginal || data.nameEn || '',
      overview: data.description || data.shortDescription || '',
      poster_path: data.posterUrl ? data.posterUrl.replace('https://kinopoiskapiunofficial.tech', '') : null,
      backdrop_path: data.coverUrl ? data.coverUrl.replace('https://avatars.mds.yandex.net', '') : null,
      release_date: String(data.year) || '',
      first_air_date: String(data.year),
      vote_average: data.ratingKinopoisk || 0,
      vote_count: data.ratingKinopoiskVoteCount || 0,
      media_type: data.serial ? 'tv' : 'movie',
      genre_ids: data.genres?.map((g: any) => 0) || [],
      genres: data.genres?.map((g: any) => ({ id: 0, name: g.genre })) || [],
      runtime: data.filmLength || null,
      episode_run_time: data.filmLength ? [data.filmLength] : [],
      status: data.productionStatus || '',
      tagline: data.slogan || null,
      number_of_seasons: null,
      number_of_episodes: null,
      seasons: [],
    };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw e;
    }
    console.error('Kinopoisk details error:', e);
    return null;
  }
}

// Get movie/TV details
export async function getMovieDetails(id: string, signal?: AbortSignal): Promise<MediaDetails | null> {
  if (!id) return null;

  try {
    // First try as movie
    let url = new URL(`${TMDB_BASE_URL}/movie/${id}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    url.searchParams.append('language', 'ru-RU');

    let response = await fetch(url.toString(), { signal });
    
    let data: any;
    
    if (response.ok) {
      data = await response.json();
      data.media_type = 'movie';
    } else {
      // Try as TV show
      url = new URL(`${TMDB_BASE_URL}/tv/${id}`);
      url.searchParams.append('api_key', TMDB_API_KEY);
      url.searchParams.append('language', 'ru-RU');
      
      response = await fetch(url.toString(), { signal });
      
      if (!response.ok) {
        throw new Error('Media not found');
      }
      
      data = await response.json();
      data.media_type = 'tv';
    }

    // Get external IDs for kinopoisk_id
    let kinopoiskId: number | null = null;
    try {
      const extUrl = new URL(`${TMDB_BASE_URL}/${data.media_type}/${data.id}/external_ids`);
      extUrl.searchParams.append('api_key', TMDB_API_KEY);
      const extResponse = await fetch(extUrl.toString(), { signal });
      if (extResponse.ok) {
        const extData = await extResponse.json();
        kinopoiskId = extData.kinopoisk_id || null;
        console.log('External IDs:', extData);
      }
    } catch (e) {
      console.error('Failed to get external IDs:', e);
    }

    return {
      id: data.id,
      tmdb_id: data.id,
      imdb_id: data.imdb_id || null,
      kinopoisk_id: kinopoiskId,
      title: data.title || data.name || '',
      original_title: data.original_title || data.original_name || '',
      name: data.name,
      original_name: data.original_name,
      overview: data.overview || '',
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      release_date: data.release_date || data.first_air_date || '',
      first_air_date: data.first_air_date,
      vote_average: data.vote_average || 0,
      vote_count: data.vote_count || 0,
      media_type: data.media_type === 'tv' ? 'tv' : 'movie',
      genre_ids: data.genres?.map((g: Genre) => g.id) || [],
      genres: data.genres || [],
      runtime: data.runtime || null,
      episode_run_time: data.episode_run_time,
      status: data.status || '',
      tagline: data.tagline || null,
      number_of_seasons: data.number_of_seasons || null,
      number_of_episodes: data.number_of_episodes || null,
      seasons: data.seasons?.map((s: any) => ({
        season_number: s.season_number,
        name: s.name,
        poster_path: s.poster_path,
        episode_count: s.episode_count,
        air_date: s.air_date
      })) || [],
    };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw e;
    }
    console.error('Get details error:', e);
    return null;
  }
}

// Get all available player URLs
export async function getAllPlayerUrls(media: MediaDetails, season?: number, episode?: number): Promise<Record<string, string>> {
  const players: Record<string, string> = {};
  
  // Use Kinopoisk ID if available, otherwise fall back to TMDB/IMDB
  const kpId = media.kinopoisk_id;
  const tmdbId = media.tmdb_id;
  const imdbId = media.imdb_id;
  
  // Get Kodik URL
  if (kpId) {
    const kodikUrl = await getKodikPlayerUrl(kpId);
    if (kodikUrl) {
      if (season && episode && media.media_type === 'tv') {
        players.kodik = `${kodikUrl}?season=${season}&episode=${episode}`;
      } else {
        players.kodik = kodikUrl;
      }
    }
  }
  
  // Get Alloha URL
  if (kpId) {
    const allohaUrl = await getAllohaPlayerUrl(kpId);
    if (allohaUrl) {
      if (season && episode && media.media_type === 'tv') {
        players.alloha = `${allohaUrl}?season=${season}&episode=${episode}`;
      } else {
        players.alloha = allohaUrl;
      }
    }
  }

  // Get Collaps URL
  if (kpId) {
    const collapsUrl = await getCollapsPlayerUrl(kpId);
    if (collapsUrl) {
      if (season && episode && media.media_type === 'tv') {
        players.collaps = `${collapsUrl}?season=${season}&episode=${episode}`;
      } else {
        players.collaps = collapsUrl;
      }
    }
  }

  // Get Bazon URL
  if (kpId) {
    const bazonUrl = await getBazonPlayerUrl(kpId);
    if (bazonUrl) {
      if (season && episode && media.media_type === 'tv') {
        players.bazon = `${bazonUrl}?season=${season}&episode=${episode}`;
      } else {
        players.bazon = bazonUrl;
      }
    }
  }

  // Get Videocdn URL
  if (kpId) {
    const videocdnUrl = await getVideocdnPlayerUrl(kpId);
    if (videocdnUrl) {
      if (season && episode && media.media_type === 'tv') {
        players.videocdn = `${videocdnUrl}?season=${season}&episode=${episode}`;
      } else {
        players.videocdn = videocdnUrl;
      }
    }
  }

  // Add VoidBoost iframe (works with TMDB ID)
  if (tmdbId) {
    players.voidboost = `https://voidboost.net/embed/${tmdbId}?poster=${encodeURIComponent(media.poster_path || '')}&title=${encodeURIComponent(media.title || '')}`;
  }

  // Add VidSrc iframe (works with IMDB ID)
  if (imdbId) {
    players.vidsrc = `https://vidsrc.me/embed/${imdbId}/`;
  }

  // Add Vibix iframe (works with Kinopoisk ID)
  if (kpId) {
    players.vibix = `https://vibix.tv/embed/${kpId}`;
  }

  return players;
}

// Get player URLs from Kodik API (using Kinopoisk ID)
export async function getKodikPlayerUrl(kpId: number): Promise<string | null> {
  if (!kpId) return null;
  
  try {
    const url = new URL('https://kodikapi.com/search');
    url.searchParams.append('token', KODIK_TOKEN);
    url.searchParams.append('kinopoisk_id', String(kpId));
    console.log('Kodik request:', url.toString());
    const response = await fetch(url.toString());
    if (response.ok) {
      const data = await response.json();
      console.log('Kodik response:', data);
      if (data.results && data.results.length > 0 && data.results[0].link) {
        return data.results[0].link;
      }
    }
  } catch (e) {
    console.error('Kodik error:', e);
  }
  return null;
}

// Get Alloha URL (using Kinopoisk ID)
async function getAllohaPlayerUrl(kpId: number): Promise<string | null> {
  try {
    const url = new URL('https://api.alloha.tv/');
    url.searchParams.append('token', ALLOHA_TOKEN);
    url.searchParams.append('kp', String(kpId));
    console.log('Alloha request:', url.toString());
    const response = await fetch(url.toString());
    if (response.ok) {
      const data = await response.json();
      console.log('Alloha response:', data);
      if (data.link) {
        return data.link;
      }
    }
  } catch (e) {
    console.error('Alloha error:', e);
  }
  return null;
}

// Get Collaps URL (using Kinopoisk ID)
async function getCollapsPlayerUrl(kpId: number): Promise<string | null> {
  try {
    const url = new URL('https://apicollaps.cc/list');
    url.searchParams.append('token', COLLAPS_TOKEN);
    url.searchParams.append('kinopoisk_id', String(kpId));
    console.log('Collaps request:', url.toString());
    const response = await fetch(url.toString());
    if (response.ok) {
      const data = await response.json();
      console.log('Collaps response:', data);
      if (data.results && data.results[0] && data.results[0].link) {
        return data.results[0].link;
      }
    }
  } catch (e) {
    console.error('Collaps error:', e);
  }
  return null;
}

// Get Bazon URL (using Kinopoisk ID)
async function getBazonPlayerUrl(kpId: number): Promise<string | null> {
  try {
    const url = new URL('https://bazon.cc/api/search');
    url.searchParams.append('token', BAZON_TOKEN);
    url.searchParams.append('kp', String(kpId));
    console.log('Bazon request:', url.toString());
    const response = await fetch(url.toString());
    if (response.ok) {
      const data = await response.json();
      console.log('Bazon response:', data);
      if (data.results && data.results[0] && data.results[0].link) {
        return data.results[0].link;
      }
    }
  } catch (e) {
    console.error('Bazon error:', e);
  }
  return null;
}

// Get Videocdn URL (using Kinopoisk ID)
async function getVideocdnPlayerUrl(kpId: number): Promise<string | null> {
  try {
    const url = new URL('https://videocdn.tv/api/short');
    url.searchParams.append('api_token', VIDEOCDN_TOKEN);
    url.searchParams.append('kinopoisk_id', String(kpId));
    console.log('Videocdn request:', url.toString());
    const response = await fetch(url.toString());
    if (response.ok) {
      const data = await response.json();
      console.log('Videocdn response:', data);
      if (data.results && data.results[0] && data.results[0].link) {
        return data.results[0].link;
      }
    }
  } catch (e) {
    console.error('Videocdn error:', e);
  }
  return null;
}

// Get trending
export async function getTrending(signal?: AbortSignal): Promise<Media[]> {
  try {
    const url = new URL(`${TMDB_BASE_URL}/trending/all/week`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    url.searchParams.append('language', 'ru-RU');

    const response = await fetch(url.toString(), { signal });
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.results.slice(0, 10).map(transformMedia);
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw e;
    }
    console.error('Trending error:', e);
    return [];
  }
}

// Get popular movies
export async function getPopularMovies(signal?: AbortSignal): Promise<Media[]> {
  try {
    const url = new URL(`${TMDB_BASE_URL}/movie/popular`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    url.searchParams.append('language', 'ru-RU');
    url.searchParams.append('page', '1');

    const response = await fetch(url.toString(), { signal });
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.results.slice(0, 10).map(transformMedia);
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw e;
    }
    console.error('Popular movies error:', e);
    return [];
  }
}

// Get popular TV shows
export async function getPopularTVShows(signal?: AbortSignal): Promise<Media[]> {
  try {
    const url = new URL(`${TMDB_BASE_URL}/tv/popular`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    url.searchParams.append('language', 'ru-RU');
    url.searchParams.append('page', '1');

    const response = await fetch(url.toString(), { signal });
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.results.slice(0, 10).map((r: any) => ({
      ...transformMedia(r),
      media_type: 'tv' as MediaType
    }));
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw e;
    }
    console.error('Popular TV shows error:', e);
    return [];
  }
}

// Get anime (Japanese movies)
export async function getAnime(signal?: AbortSignal): Promise<Media[]> {
  try {
    const url = new URL(`${TMDB_BASE_URL}/discover/movie`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    url.searchParams.append('language', 'ru-RU');
    url.searchParams.append('with_origin_country', 'JP');
    url.searchParams.append('page', '1');
    url.searchParams.append('sort_by', 'popularity.desc');

    const response = await fetch(url.toString(), { signal });
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.results.slice(0, 10).map((r: any) => ({
      ...transformMedia(r),
      media_type: 'anime' as MediaType
    }));
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw e;
    }
    console.error('Anime error:', e);
    return [];
  }
}

// Get genres
export async function getGenres(signal?: AbortSignal): Promise<Genre[]> {
  try {
    const url = new URL(`${TMDB_BASE_URL}/genre/movie/list`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    url.searchParams.append('language', 'ru-RU');

    const response = await fetch(url.toString(), { signal });
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    return data.genres || [];
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw e;
    }
    console.error('Genres error:', e);
    return [];
  }
}

// Helper to detect media type
function getMediaType(result: any): MediaType {
  // Check for anime (Japanese animation)
  if (result.genre_ids && result.genre_ids.includes(16)) {
    return 'anime';
  }
  return (result.media_type as MediaType) || 'movie';
}

// Transform TMDB result to our Media interface
function transformMedia(result: any): Media {
  const mediaType = getMediaType(result);
  const title = mediaType === 'tv' ? (result.name || result.original_name) : (result.title || result.original_title);
  const originalTitle = result.original_title || result.original_name || '';
  
  return {
    id: result.id,
    tmdb_id: result.id,
    imdb_id: result.imdb_id || null,
    kinopoisk_id: result.kinopoisk_id || null,
    title: title,
    original_title: originalTitle,
    name: result.name,
    original_name: result.original_name,
    overview: result.overview || '',
    poster_path: result.poster_path,
    backdrop_path: result.backdrop_path,
    release_date: result.release_date || result.first_air_date || '',
    first_air_date: result.first_air_date,
    vote_average: result.vote_average || 0,
    vote_count: result.vote_count || 0,
    media_type: mediaType,
    genre_ids: result.genre_ids || [],
  };
}
