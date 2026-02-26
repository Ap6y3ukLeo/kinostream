// KinoStream API Service
// Uses Kinopoisk Unofficial API (works from Russia)

// Kinopoisk API Configuration
const KINOPOISK_API_BASE = 'https://kinopoiskapiunofficial.tech';
const KINOPOISK_API_KEY = 'a926c834-5942-4c1e-88f6-54f11502e626';

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

// Player API tokens
const KODIK_TOKEN = 'b7cc4293ed475c4ad1fd599d114f4435';
const ALLOHA_TOKEN = 'd317441359e505c343c2063edc97e7';
const VIBIX_TOKEN = '23861|hG6BsABzO9l5GUH0Ixwi270wTybAVUJKUQhtSf6Ka33b7d87';
const COLLAPS_TOKEN = 'eedefb541aeba871dcfc756e6b31c02e';
const BAZON_TOKEN = '2848f79ca09d4bbbf419bcdb464b4d11';
const VIDEOCDN_TOKEN = 'pfp3D870PGEY3Afjti0gMtSfmn2aZqih';

// Get poster URL - uses Kinopoisk CDN
export const getPosterUrl = (path: string | null, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string => {
  if (!path) return '';
  // Handle Shikimori URLs
  if (path.startsWith('http')) return path;
  // Handle relative paths - add base URL
  if (path.startsWith('/')) {
    return `https://kinopoiskapiunofficial.tech${path}`;
  }
  // Already a full URL
  return path;
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
      tmdb_id: 0,
      kinopoisk_id: film.filmId,
      imdb_id: null,
      title: film.nameRu || film.nameEn || '',
      original_title: film.nameEn || film.nameOriginal || '',
      name: film.nameRu || film.nameEn || '',
      original_name: film.nameEn || film.nameOriginal || '',
      overview: film.description || '',
      poster_path: film.posterUrl || null,
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
      poster_path: data.posterUrl || null,
      backdrop_path: data.coverUrl || null,
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

// Get all available player URLs using Kinopoisk ID only
export async function getAllPlayerUrls(media: MediaDetails, season?: number, episode?: number): Promise<Record<string, string>> {
  const players: Record<string, string> = {};
  
  // Use Kinopoisk ID
  const kpId = media.kinopoisk_id;
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

  // Add VoidBoost iframe (works with Kinopoisk ID)
  if (kpId) {
    if (media.media_type === 'tv' && season) {
      players.voidboost = `https://voidboost.net/serial/${kpId}/season/${season}/episode/${episode || 1}`;
    } else {
      players.voidboost = `https://voidboost.net/iframe/${kpId}`;
    }
  }

  // Add VidSrc iframe (works with IMDB ID)
  if (imdbId) {
    if (media.media_type === 'tv') {
      players.vidsrc = `https://vidsrc.net/embed/tv/${imdbId}?season=${season}&episode=${episode || 1}`;
    } else {
      players.vidsrc = `https://vidsrc.net/embed/movie/${imdbId}`;
    }
  }

  // Add Vibix iframe (works with Kinopoisk ID)
  if (kpId) {
    if (media.media_type === 'tv' && season) {
      players.vibix = `https://vibix.tv/embed/${kpId}?season=${season}&episode=${episode || 1}`;
    } else {
      players.vibix = `https://vibix.tv/embed/${kpId}`;
    }
  }

  // Add KPPlayer iframe (works with Kinopoisk ID)
  if (kpId) {
    players.kpplayer = `https://kpplayer.net/iframe/${kpId}`;
  }

  // Add MovieShot iframe (works with Kinopoisk ID)
  if (kpId) {
    players.movieshot = `https://movieshot.info/iframe/${kpId}`;
  }

  // Add CDNmovies iframe (works with Kinopoisk ID)
  if (kpId) {
    players.cdnmovies = `https://cdnmovies.com/embed/${kpId}`;
  }

  return players;
}

// Get player URLs from Kodik API (using Kinopoisk ID)
async function getKodikPlayerUrl(kpId: number): Promise<string | null> {
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

// Get Collaps URL (using Kinopoisk ID - public API)
async function getCollapsPlayerUrl(kpId: number): Promise<string | null> {
  try {
    const url = new URL('https://apicollaps.cc/list');
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
  // Fallback: try with a different endpoint
  try {
    const url2 = new URL('https://collaps.tv/iframe');
    url2.searchParams.append('kp', String(kpId));
    return url2.toString();
  } catch (e) {
    console.error('Collaps fallback error:', e);
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

// Get Vibix iframe URL using their API
export async function getVibixPlayerUrl(kpId: number, season?: number, episode?: number): Promise<string | null> {
  if (!kpId) return null;
  
  try {
    const url = new URL(`https://vibix.org/api/v1/publisher/videos/kp/${kpId}`);
    console.log('Vibix request:', url.toString());
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${VIBIX_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Vibix response:', data);
      
      // Try different possible field names for iframe URL
      const iframeUrl = data.iframe_url || data.embed_url || data.url || data.player_url || data.src;
      if (iframeUrl) {
        // Add season/episode params if it's a TV show
        if (season && episode) {
          const separator = iframeUrl.includes('?') ? '&' : '?';
          return `${iframeUrl}${separator}season=${season}&episode=${episode}`;
        }
        return iframeUrl;
      } else {
        console.log('Vibix response fields:', Object.keys(data));
      }
    } else {
      console.error('Vibix API error:', response.status, await response.text());
    }
  } catch (e) {
    console.error('Vibix error:', e);
  }
  // Fallback: try direct iframe URL
  if (season && episode) {
    return `https://vibix.tv/embed/${kpId}?season=${season}&episode=${episode}`;
  }
  return `https://vibix.tv/embed/${kpId}`;
}

// Legacy exports for backward compatibility
export async function getMovieDetails(id: string, signal?: AbortSignal): Promise<MediaDetails | null> {
  return getKinopoiskDetails(id, signal);
}

export async function getTrending(signal?: AbortSignal): Promise<Media[]> {
  return getKinopoiskPopular(signal);
}

export async function getPopularMovies(signal?: AbortSignal): Promise<Media[]> {
  return getKinopoiskPopular(signal);
}

export async function getPopularTVShows(signal?: AbortSignal): Promise<Media[]> {
  return getKinopoiskPopular(signal);
}

export async function getAnime(signal?: AbortSignal): Promise<Media[]> {
  return getKinopoiskPopular(signal);
}

// Get popular from Kinopoisk API (works from Russia)
export async function getKinopoiskPopular(signal?: AbortSignal): Promise<Media[]> {
  try {
    const url = new URL(`${KINOPOISK_API_BASE}/api/v2.2/films/premieres`);
    url.searchParams.append('year', String(new Date().getFullYear()));
    url.searchParams.append('month', '1');
    
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
      poster_path: film.posterUrl || null,
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

// Get seasons for TV series/anime from Kinopoisk API
export async function getKinopoiskSeasons(id: string, signal?: AbortSignal): Promise<Season[]> {
  if (!id) return [];

  const kpId = parseInt(id, 10);
  if (isNaN(kpId)) return [];

  try {
    const url = new URL(`${KINOPOISK_API_BASE}/api/v2.2/films/${kpId}/seasons`);
    
    console.log('Kinopoisk seasons:', url.toString());
    const response = await fetch(url.toString(), {
      signal,
      headers: {
        'X-API-KEY': KINOPOISK_API_KEY,
        'accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Seasons API error:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('Kinopoisk seasons data:', data);
    
    // API returns { total: number, items: [{ number: 1, episodes: [...] }] }
    if (!data.items || data.items.length === 0) {
      return [];
    }

    // Transform seasons data from items array
    return data.items.map((item: any) => ({
      season_number: item.number || 0,
      name: `Сезон ${item.number}`,
      poster_path: null,
      episode_count: item.episodes?.length || 0,
      air_date: null,
    }));
  } catch (e) {
    console.error('Kinopoisk seasons error:', e);
    return [];
  }
}
