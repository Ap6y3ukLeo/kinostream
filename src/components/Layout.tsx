import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Film } from 'lucide-react';
import React, { useState } from 'react';

export function Layout() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30">
      <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-indigo-400 transition-colors hover:text-indigo-300">
            <Film className="h-6 w-6" />
            <span className="text-xl font-bold tracking-tight">KinoStream</span>
          </Link>

          <form onSubmit={handleSearch} className="relative hidden sm:block w-full max-w-md">
            <div className="relative flex items-center">
              <SearchIcon className="absolute left-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск фильмов..."
                className="w-full rounded-full border border-zinc-800 bg-zinc-900/50 py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
