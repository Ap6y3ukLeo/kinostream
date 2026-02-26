import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Loader2, AlertTriangle } from 'lucide-react';

const API_KEY = '23861|hG6BsABzO9l5GUH0Ixwi270wTybAVUJKUQhtSf6Ka33b7d87';
const PUBLISHER_ID = "677077910";

interface VibixData {
  id: number; // Внутренний ID Vibix
  name_rus?: string;
  name?: string;
  type: string;
  description?: string;
}

export default function VibixPage() {
  const navigate = useNavigate();
  const [kpId, setKpId] = useState('');
  const [loading, setLoading] = useState(false);
  const [movieData, setMovieData] = useState<VibixData | null>(null);
  const [error, setError] = useState('');

  // 1. Функция полной перезагрузки SDK Rendex
  const reloadRendex = () => {
    const scriptId = 'rendex-sdk';
    const oldScript = document.getElementById(scriptId);
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://graphicslab.io/sdk/v2/rendex-sdk.min.js?t=${Date.now()}`; // добавляем timestamp для сброса кеша
    script.async = true;
    document.head.appendChild(script);
  };

  const handleSearch = async () => {
    if (!kpId.trim()) return;

    setLoading(true);
    setError('');
    setMovieData(null);

    try {
      // 2. Получаем внутренние данные видео через API
      const response = await fetch(`https://vibix.org/api/v1/publisher/videos/kp/${kpId}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });

      if (!response.ok) throw new Error("Видео не найдено в базе Vibix.");
      const data: VibixData = await response.json();
      
      setMovieData(data);

      // 3. Формируем тег <ins> динамически
      // Важно: используем data.id (внутренний), а не kpId!
      const finalType = (data.type === 'serial' || data.type === 'series') ? 'series' : 'movie';
      const playerContainer = document.getElementById('player-box');
      
      if (playerContainer) {
        playerContainer.innerHTML = `
          <ins data-publisher-id="${PUBLISHER_ID}" 
               data-type="${finalType}" 
               data-id="${data.id}" 
               data-voiceover="147" 
               data-design="1" 
               data-color1="#56ceaa" 
               data-color2="#ffffff" 
               data-color3="#aec7bc" 
               data-color4="#42bd88" 
               data-color5="#000000">
          </ins>
        `;
        
        // 4. Перезапускаем SDK
        reloadRendex();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 mb-8">
          <ArrowLeft size={20} /> Назад
        </button>

        <div className="bg-[#161b2a] p-6 rounded-2xl shadow-xl mb-8 border border-gray-800">
          <h1 className="text-xl font-bold mb-4">Поиск по Kinopoisk ID</h1>
          <div className="flex gap-3">
            <input
              type="text"
              value={kpId}
              onChange={(e) => setKpId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Введите ID (например 484488)"
              className="flex-1 bg-[#0b0f19] border border-gray-700 rounded-lg px-4 py-3 outline-none focus:border-[#56ceaa]"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-[#56ceaa] text-black font-bold px-8 rounded-lg hover:bg-[#46b392] transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Найти'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl mb-6 text-red-400 flex items-center gap-2">
            <AlertTriangle size={20} /> {error}
          </div>
        )}

        {/* Секция плеера */}
        <div className="bg-[#161b2a] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
          {movieData && (
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold">{movieData.name_rus || movieData.name}</h2>
              <p className="text-gray-400 text-sm mt-1">{movieData.type === 'movie' ? 'Полнометражный фильм' : 'Сериал'}</p>
            </div>
          )}
          
          <div id="player-box" className="w-full aspect-video bg-black flex items-center justify-center">
             {!movieData && !loading && <p className="text-gray-600">Введите ID и нажмите поиск</p>}
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-900/10 border border-yellow-700/30 rounded-lg text-sm text-yellow-200/70">
          <strong>Заметка по ошибке 400:</strong> Если плеер пишет "Контент не добавлен" или выдает 400, 
          обязательно добавьте домен <u>kinostream.vercel.app</u> в настройках площадки в личном кабинете Vibix.
        </div>
      </div>
    </div>
  );
}