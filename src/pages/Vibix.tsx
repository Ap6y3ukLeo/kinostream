import { useState, useEffect } from 'react';
import { Play, Loader2, Info, ArrowLeft } from 'lucide-react';

const API_KEY = '23861|hG6BsABzO9l5GUH0Ixwi270wTybAVUJKUQhtSf6Ka33b7d87';

export default function VibixPage() {
  const [kpId, setKpId] = useState('');
  const [loading, setLoading] = useState(false);
  const [movieData, setMovieData] = useState<any>(null);
  const [error, setError] = useState('');

  // Функция перезагрузки SDK Rendex
  const reinitSDK = () => {
    const oldScript = document.getElementById('rendex-sdk');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.id = 'rendex-sdk';
    script.src = 'https://graphicslab.io/sdk/v2/rendex-sdk.min.js';
    script.async = true;
    document.head.appendChild(script);
  };

  const searchMovie = async () => {
    if (!kpId.trim()) return;

    setLoading(true);
    setError('');
    setMovieData(null);

    try {
      const response = await fetch(`https://vibix.org/api/v1/publisher/videos/kp/${kpId}`, {
        headers: { 
            'Authorization': `Bearer ${API_KEY}`,
            'Accept': 'application/json'
        }
      });

      if (!response.ok) throw new Error("Видео не найдено");
      const data = await response.json();
      setMovieData(data);

      // Парсим внутренний ID из ссылки iframe
      const internalId = data.iframe_url.split('/').pop();
      const finalType = (data.type === 'serial' || data.type === 'series') ? 'series' : 'movie';

      // Вставляем плеер через 100мс, чтобы React успел создать контейнер
      setTimeout(() => {
        const container = document.getElementById('player-container');
        if (container) {
          container.innerHTML = `
            <ins data-publisher-id="677077910" 
                 data-type="${finalType}" 
                 data-id="${internalId}" 
                 data-voiceover="147" 
                 data-design="1" 
                 data-color1="#56ceaa" 
                 data-color2="#ffffff" 
                 data-color3="#aec7bc" 
                 data-color4="#42bd88" 
                 data-color5="#000000">
            </ins>
          `;
          reinitSDK();
        }
      }, 100);

    } catch (err) {
      setError("Ошибка: контент не найден или заблокирован");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white p-4 sm:p-8" style={{ fontFamily: 'sans-serif' }}>
      <div className="max-w-5xl mx-auto">
        
        {/* Кнопка назад через обычный href, чтобы не ломать React Router */}
        <a 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-6 transition-colors no-underline"
        >
          <ArrowLeft size={18} /> На главную
        </a>

        {/* Поисковая панель */}
        <div className="bg-[#161b2a] p-6 sm:p-10 rounded-3xl shadow-2xl border border-gray-800/50 mb-10">
          <h1 className="text-3xl font-black mb-6 tracking-tight flex items-center gap-3">
            VIBIX <span className="text-[#56ceaa]">PLAYER</span>
          </h1>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={kpId}
              onChange={(e) => setKpId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchMovie()}
              placeholder="Введите Kinopoisk ID (напр. 484488)"
              className="flex-1 bg-[#0b0f19] border border-gray-700 rounded-2xl px-6 py-4 outline-none focus:border-[#56ceaa] transition-all text-lg"
            />
            <button
              onClick={searchMovie}
              disabled={loading}
              className="bg-[#56ceaa] text-black font-bold px-12 py-4 rounded-2xl hover:bg-[#46b392] transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Play size={20} fill="currentColor" />}
              ПОИСК
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl mb-8 text-red-400 text-center animate-pulse">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Левая колонка: Плеер */}
          <div className="lg:col-span-8">
            <div 
              id="player-container" 
              className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800 flex items-center justify-center relative"
            >
              {!movieData && !loading && (
                <div className="text-gray-700 flex flex-col items-center gap-4">
                  <Play size={48} className="opacity-20" />
                  <p className="italic">Введите ID фильма для просмотра</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex items-start gap-4 p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl text-blue-400 text-sm">
              <Info className="shrink-0 w-5 h-5" />
              <p>
                Если плеер выдает ошибку 403, это значит, что ваш домен <b>{window.location.hostname}</b> 
                не добавлен в White List в личном кабинете Vibix.org.
              </p>
            </div>
          </div>

          {/* Правая колонка: Информация */}
          <div className="lg:col-span-4">
            {movieData ? (
              <div className="bg-[#161b2a] p-6 rounded-3xl border border-gray-800 animate-in fade-in slide-in-from-right-4 duration-500">
                <img 
                  src={movieData.poster_url} 
                  className="w-full aspect-[2/3] object-cover rounded-2xl mb-6 shadow-2xl" 
                  alt="poster" 
                />
                <h2 className="text-2xl font-bold mb-3">{movieData.name_rus}</h2>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="bg-[#56ceaa] text-black text-[10px] font-black px-2 py-1 rounded">
                    {movieData.type === 'movie' ? 'ФИЛЬМ' : 'СЕРИАЛ'}
                  </span>
                  <span className="bg-gray-800 text-gray-300 text-[10px] font-bold px-2 py-1 rounded">
                    {movieData.year}
                  </span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  {movieData.description_short || movieData.description}
                </p>
                
                <div className="space-y-2 border-t border-gray-800 pt-4 text-xs text-gray-500">
                  <p><b>Жанр:</b> {movieData.genre?.join(', ')}</p>
                  <p><b>Страна:</b> {movieData.country?.join(', ')}</p>
                  <p><b>Рейтинг КП:</b> {movieData.kp_rating}</p>
                </div>
              </div>
            ) : (
              <div className="h-full bg-[#161b2a]/30 p-10 rounded-3xl border border-dashed border-gray-800 flex items-center justify-center text-center text-gray-600">
                Здесь будет информация о фильме
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}