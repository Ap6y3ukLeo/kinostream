import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function Home() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl"
      >
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-indigo-500/10 p-4 text-indigo-400 ring-1 ring-indigo-500/20">
            <PlayCircle className="h-12 w-12" />
          </div>
        </div>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          Смотрите фильмы <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            без ограничений
          </span>
        </h1>
        <p className="mb-10 text-lg text-zinc-400 sm:text-xl">
          Найдите любой фильм и выберите удобный плеер для просмотра. Alloha, Collapse и другие балансеры в одном месте.
        </p>

        <form onSubmit={handleSearch} className="relative mx-auto max-w-xl">
          <div className="relative flex items-center shadow-2xl shadow-indigo-500/10 rounded-full">
            <Search className="absolute left-4 h-6 w-6 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Введите название фильма, например «Интерстеллар»"
              className="w-full rounded-full border border-zinc-700 bg-zinc-900/80 py-4 pl-14 pr-32 text-lg text-zinc-100 placeholder-zinc-500 backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              Найти
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
