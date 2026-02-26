import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Loader2 } from 'lucide-react';

const API_KEY = '23861|hG6BsABzO9l5GUH0Ixwi270wTybAVUJKUQhtSf6Ka33b7d87';
const PUBLISHER_ID = "677077910";

interface VibixMovieInfo {
  name_rus?: string;
  name?: string;
  description?: string;
  type: string;
}

export default function VibixPage() {
  const navigate = useNavigate();
  const [kpId, setKpId] = useState('');
  const [loading, setLoading] = useState(false);
  const [movieInfo, setMovieInfo] = useState<VibixMovieInfo | null>(null);
  const [error, setError] = useState('');

  // Функция перезагрузки SDK
  const reinitSDK = () => {
    // Удаляем старый скрипт, если он есть
    const oldScript = document.getElementById('rendex-sdk');
    if (oldScript) oldScript.remove();

    // Создаем и добавляем новый скрипт
    const script = document.createElement('script');
    script.id = 'rendex-sdk';
    script.src = 'https://graphicslab.io/sdk/v2/rendex-sdk.min.js';
    script.async = true;
    document.head.appendChild(script);
  };

  const searchAndPlay = async () => {
    if (!kpId.trim()) return;

    setLoading(true);
    setError('');
    setMovieInfo(null);

    try {
      // 1. Получаем инфо о типе контента (фильм или сериал)
      const response = await fetch(`https://vibix.org/api/v1/publisher/videos/kp/${kpId}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });

      if (!response.ok) throw new Error("Контент не найден в API");
      const data = await response.json();
      setMovieInfo(data);

      // Определяем тип для тега
      const finalType = (data.type === 'serial' || data.type === 'series') ? 'series' : 'movie';

      // 2. Вставляем тег <ins> вручную в контейнер
      const container = document.getElementById('vibix-player-container');
      if (container) {
        container.innerHTML = `
          <ins data-publisher-id="${PUBLISHER_ID}" 
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
      }

      // 3. Пингуем SDK, чтобы он превратил <ins> в плеер
      reinitSDK();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') searchAndPlay();
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-200 p-6" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      <div className="max-w-[900px] mx-auto">
        
        {/* Кнопка Назад */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> На главную
        </button>

        <h1 className="text-3xl font-bold mb-8 text-white">Vibix SDK Player</h1>

        {/* Поиск */}
        <div className="bg-[#161b2a] p-6 rounded-2xl flex gap-3 mb-8 shadow-xl border border-gray-800">
          <input
            type="text"
            value={kpId}
            onChange={(e) => setKpId(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Введите Kinopoisk ID (напр. 484488)"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-700 bg-[#0b0f19] text-white focus:outline-none focus:border-[#56ceaa]"
          />
          <button
            onClick={searchAndPlay}
            disabled={loading || !kpId.trim()}
            className="px-8 py-3 bg-[#56ceaa] text-black font-bold rounded-xl hover:bg-[#4ab89a] disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" fill="currentColor" />}
            Смотреть
          </button>
        </div>

        {/* Ошибки */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6">
            Ошибка: {error}
          </div>
        )}

        {/* Инфо о фильме */}
        {movieInfo && !loading && (
          <div className="bg-[#161b2a] p-6 rounded-t-2xl border-x border-t border-gray-800 animate-in fade-in slide-in-from-bottom-2">
            <span className="inline-block px-3 py-1 rounded-md text-[10px] font-black bg-[#56ceaa] text-black uppercase mb-3">
              {movieInfo.type === 'serial' || movieInfo.type === 'series' ? 'Сериал' : 'Фильм'}
            </span>
            <h2 className="text-2xl font-bold text-white mb-2">{movieInfo.name_rus || movieInfo.name}</h2>
            <p className="text-gray-400 text-sm line-clamp-2">{movieInfo.description}</p>
          </div>
        )}

        {/* КОНТЕЙНЕР ДЛЯ SDK ПЛЕЕРА */}
        <div 
          id="vibix-player-container" 
          className="w-full bg-black rounded-b-2xl overflow-hidden border border-gray-800 min-h-[500px] flex items-center justify-center"
        >
          {!movieInfo && !loading && (
            <p className="text-gray-600 italic">Введите ID для запуска плеера</p>
          )}
        </div>
      </div>
    </div>
  );
}