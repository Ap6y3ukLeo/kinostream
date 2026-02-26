import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Play, Loader2 } from 'lucide-react';

const API_KEY = '23861|hG6BsABzO9l5GUH0Ixwi270wTybAVUJKUQhtSf6Ka33b7d87';

interface VibixMovieInfo {
  name_rus?: string;
  name?: string;
  description?: string;
  type: 'movie' | 'serial' | 'series';
}

export default function VibixPage() {
  const navigate = useNavigate();
  const [kpId, setKpId] = useState('');
  const [loading, setLoading] = useState(false);
  const [movieInfo, setMovieInfo] = useState<VibixMovieInfo | null>(null);
  const [error, setError] = useState('');

  const searchAndPlay = async () => {
    if (!kpId.trim()) return;

    setLoading(true);
    setError('');
    setMovieInfo(null);

    try {
      // 1. Сначала спрашиваем API Vibix, что это за контент
      const response = await fetch(`https://vibix.org/api/v1/publisher/videos/kp/${kpId}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });

      if (!response.ok) throw new Error("Контент не найден в API");
      const data = await response.json();

      setMovieInfo(data);

      // 2. Создаем тег плеера с ПРАВИЛЬНЫМ типом после рендера
      setTimeout(() => {
        const container = document.getElementById('vibix-player-container');
        if (!container) return;

        const finalType = (data.type === 'serial' || data.type === 'series') ? 'series' : 'movie';

        container.innerHTML = `
          <ins data-publisher-id="677077910" 
               data-type="${finalType}" 
               data-id="${kpId}" 
               data-voiceover="147" 
               data-design="1" 
               data-color1="#56ceaa" 
               data-color2="#ffffff" 
               data-color3="#aec7bc" 
               data-color4="#42bd88" 
               data-color5="#000000">
          </ins>
        `;

        // 3. Перезагружаем SDK
        reinitSDK();
      }, 100);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке');
    } finally {
      setLoading(false);
    }
  };

  const reinitSDK = () => {
    const oldScript = document.getElementById('rendex-sdk');
    if (oldScript) oldScript.remove();

    const newScript = document.createElement('script');
    newScript.id = 'rendex-sdk';
    newScript.src = "https://graphicslab.io/sdk/v2/rendex-sdk.min.js";
    document.head.appendChild(newScript);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchAndPlay();
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-200" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      {/* SDK Script */}
      <script id="rendex-sdk" src="https://graphicslab.io/sdk/v2/rendex-sdk.min.js"></script>

      <div className="container mx-auto px-4 py-8" style={{ maxWidth: '900px' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          На главную
        </button>

        <h1 className="text-3xl font-bold mb-8 text-white">Vibix Поиск</h1>

        {/* Search Box */}
        <div className="bg-[#161b2a] p-6 rounded-xl flex gap-3 mb-6 shadow-lg">
          <input
            type="text"
            value={kpId}
            onChange={(e) => setKpId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите Kinopoisk ID (напр. 484488)"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-700 bg-[#0b0f19] text-white text-base focus:outline-none focus:border-[#56ceaa]"
          />
          <button
            onClick={searchAndPlay}
            disabled={loading || !kpId.trim()}
            className="px-6 py-3 bg-[#56ceaa] text-black font-bold rounded-lg hover:bg-[#4ab89a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            Найти
          </button>
        </div>

        {/* Loader */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="border-4 border-gray-700 border-t-[#56ceaa] rounded-full w-10 h-10 animate-spin"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-400 px-6 py-4 rounded-lg mb-6">
            Ошибка: {error}
          </div>
        )}

        {/* Movie Info */}
        {movieInfo && !loading && (
          <div className="bg-[#161b2a] p-5 rounded-xl mb-5 text-left">
            <span className="inline-block px-3 py-1 rounded text-xs font-bold bg-blue-600 text-white mb-2">
              {movieInfo.type === 'serial' || movieInfo.type === 'series' ? 'СЕРИАЛ' : 'ФИЛЬМ'}
            </span>
            <h2 className="text-xl font-bold text-white mb-2">
              {movieInfo.name_rus || movieInfo.name}
            </h2>
            <p className="text-gray-400 text-sm">
              {movieInfo.description ? movieInfo.description.substring(0, 150) + '...' : ''}
            </p>
          </div>
        )}

        {/* Player Container */}
        <div 
          id="vibix-player-container" 
          className="w-full min-h-[500px] bg-black rounded-xl overflow-hidden border border-gray-800"
          style={{ minHeight: '500px' }}
        >
          {!movieInfo && !loading && !error && (
            <div className="flex items-center justify-center h-[500px] text-gray-600">
              Здесь появится плеер после поиска
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
