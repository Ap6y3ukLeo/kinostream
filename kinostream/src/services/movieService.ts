import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Movie {
  id: string;
  title: string;
  original_title: string;
  year: number;
  kinopoisk_id: number;
  imdb_id: string;
  description: string;
  genre: string;
  poster_url: string;
}

export async function searchMovies(query: string): Promise<Movie[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find movies matching the search query: "${query}". 
Return a JSON array of up to 10 movies. 
For each movie, provide: 
- id (a unique string)
- title (in Russian)
- original_title (in English/original language)
- year (integer)
- kinopoisk_id (integer, MUST be the REAL Kinopoisk ID. This is critical for the video player to work. e.g. 258687 for Interstellar. Do not make this up.)
- imdb_id (string, MUST be the REAL IMDB ID, e.g. "tt0816692". Do not make this up.)
- description (in Russian)
- genre (in Russian)

Use your knowledge base to provide accurate kinopoisk_id and imdb_id.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              original_title: { type: Type.STRING },
              year: { type: Type.INTEGER },
              kinopoisk_id: { type: Type.INTEGER },
              imdb_id: { type: Type.STRING },
              description: { type: Type.STRING },
              genre: { type: Type.STRING },
            },
            required: ['id', 'title', 'original_title', 'year', 'kinopoisk_id', 'imdb_id', 'description', 'genre'],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    
    const movies = JSON.parse(text);
    return movies.map((m: any) => ({
      ...m,
      poster_url: `https://picsum.photos/seed/${m.id}/400/600?blur=2`,
    }));
  } catch (e) {
    console.error('Failed to parse movies', e);
    return [];
  }
}

export async function getMovieDetails(id: string, titleHint: string): Promise<Movie | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide detailed information for the movie with title "${titleHint}" (ID: ${id}). 
Return a JSON object with: 
- id
- title (in Russian)
- original_title
- year
- kinopoisk_id (MUST be the REAL Kinopoisk ID, e.g. 258687. Do not make it up.)
- imdb_id (MUST be the REAL IMDB ID, e.g. "tt0816692". Do not make it up.)
- description (in Russian, detailed)
- genre (in Russian).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            original_title: { type: Type.STRING },
            year: { type: Type.INTEGER },
            kinopoisk_id: { type: Type.INTEGER },
            imdb_id: { type: Type.STRING },
            description: { type: Type.STRING },
            genre: { type: Type.STRING },
          },
          required: ['id', 'title', 'original_title', 'year', 'kinopoisk_id', 'imdb_id', 'description', 'genre'],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    
    const movie = JSON.parse(text);
    return {
      ...movie,
      poster_url: `https://picsum.photos/seed/${movie.id}/400/600?blur=2`,
    };
  } catch (e) {
    console.error('Failed to parse movie details', e);
    return null;
  }
}
