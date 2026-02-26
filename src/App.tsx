/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Movie } from './pages/Movie';
import Vibix from './pages/Vibix';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="search/:query" element={<Search />} />
            <Route path="media/:id" element={<Movie />} />
            <Route path="vibix" element={<Vibix />} />
            {/* Legacy route for backwards compatibility */}
            <Route path="movie/:id" element={<Movie />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
