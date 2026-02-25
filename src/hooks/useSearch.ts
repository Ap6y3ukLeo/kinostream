import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { searchMulti, getMovieDetails, Media, MediaDetails } from '../services/movieService';
import { useDebounce } from './useDebounce';

// Cache for API responses
const searchCache = new Map<string, { data: Media[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface UseSearchOptions {
  debounceDelay?: number;
  cacheEnabled?: boolean;
}

interface UseSearchResult {
  query: string;
  setQuery: (value: string) => void;
  results: Media[];
  loading: boolean;
  error: string | null;
  executeSearch: (searchQuery: string) => Promise<void>;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchResult {
  const { debounceDelay = 300, cacheEnabled = true } = options;
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const debouncedQuery = useDebounce(query, debounceDelay);

  // Clear old cache entries
  useEffect(() => {
    const now = Date.now();
    for (const [key, value] of searchCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        searchCache.delete(key);
      }
    }
  }, []);

  const executeSearch = useCallback(async (searchQuery: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Check cache
    if (cacheEnabled) {
      const cached = searchCache.get(trimmedQuery.toLowerCase());
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setResults(cached.data);
        return;
      }
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    try {
      const data = await searchMulti(trimmedQuery, abortControllerRef.current.signal);
      
      // Store in cache
      if (cacheEnabled) {
        searchCache.set(trimmedQuery.toLowerCase(), {
          data,
          timestamp: Date.now(),
        });
      }
      
      setResults(data);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || 'Failed to search');
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, [cacheEnabled]);

  // Execute search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      executeSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, executeSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoize the result
  const result = useMemo(() => ({
    query,
    setQuery,
    results,
    loading,
    error,
    executeSearch,
  }), [query, results, loading, error, executeSearch]);

  return result;
}

// Hook for media details with cancellation support
export function useMediaDetails(mediaId: string | undefined, mediaType: string = 'movie') {
  const [media, setMedia] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!mediaId) {
      setMedia(null);
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    getMovieDetails(mediaId, abortControllerRef.current.signal)
      .then((data) => {
        setMedia(data);
      })
      .catch((err) => {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message || 'Failed to load details');
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [mediaId]);

  return { media, loading, error };
}
