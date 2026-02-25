<p align="center">
  <img src="https://img.shields.io/badge/KinoStream-FF6B6B?style=for-the-badge&logo=film&logoColor=white" alt="KinoStream">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/Ap6y3ukLeo/kinostream?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/github/deployments/Ap6y3ukLeo/kinostream/github-pages?style=for-the-badge" alt="Deploy">
  <img src="https://img.shields.io/github/last-commit/Ap6y3ukLeo/kinostream?style=for-the-badge" alt="Last Commit">
</p>

---

# 🎬 KinoStream

**KinoStream** — это веб-приложение для просмотра фильмов, сериалов и аниме онлайн. Работает из России без VPN!

### 🔗 Ссылка на сайт
**[https://ap6y3ukleo.github.io/kinostream/](https://ap6y3ukleo.github.io/kinostream/)**

---

## ✨ Особенности

- 🔍 **Мгновенный поиск** — ищите фильмы по названию
- 🎥 **8 плееров** — Kodik, Alloha, Collaps, Bazon, VideoCDN, VoidBoost, VidSrc, Vibix
- 🇷🇺 **Работает из России** — использует Kinopoisk API
- 📱 **Адаптивный дизайн** — работает на телефоне и ПК
- 🌐 **Мультиязычность** — интерфейс на русском языке
- 🚀 **Быстрая навигация** — SPA с мгновенными переходами

---

## 🛠 Технологии

| Технология | Описание |
|------------|----------|
| **React 19** | UI-фреймворк |
| **TypeScript** | Типизация |
| **Vite** | Сборщик |
| **Tailwind CSS** | Стили |
| **Framer Motion** | Анимации |
| **Kinopoisk API** | База фильмов |

---

## 🚀 Установка и запуск

### Локально

```bash
# Клонирование репозитория
git clone https://github.com/Ap6y3ukLeo/kinostream.git
cd kinostream

# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev
```

Откройте http://localhost:3000

### Production сборка

```bash
npm run build
npm run preview
```

---

## 📁 Структура проекта

```
kinostream/
├── src/
│   ├── components/     # React компоненты
│   │   ├── Layout.tsx
│   │   ├── LazyImage.tsx
│   │   └── ErrorBoundary.tsx
│   ├── pages/          # Страницы
│   │   ├── Home.tsx
│   │   ├── Search.tsx
│   │   └── Movie.tsx
│   ├── services/       # API сервисы
│   │   └── movieService.ts
│   ├── hooks/          # React хуки
│   │   ├── useDebounce.ts
│   │   └── useSearch.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
└── package.json
```

---

## 🎯 Как это работает

1. **Поиск** → Пользователь вводит название фильма
2. **API** → Запрос к Kinopoisk API
3. **Результаты** → Отображение найденных фильмов
4. **Выбор** → Пользователь выбирает плеер
5. **Просмотр** → Открывается плеер с фильмом

---

## 📜 API

Приложение использует следующие API:

- **Kinopoisk Unofficial API** — база фильмов (бесплатный, лимит 20 req/sec)
- **Kodik API** — поиск плееров
- **Alloha API** — видеоплеер
- **Collaps API** — балансер
- **Bazon API** — поиск ссылок
- **VideoCDN API** — видеохостинг

---

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку (`git checkout -b feature/amazing-feature`)
3. Коммитите изменения (`git commit -m 'Add amazing feature'`)
4. Пушьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

---

## 📄 Лицензия

MIT License — смотрите файл [LICENSE](LICENSE) для деталей.

---

## 🙏 Спасибо

- [Kinopoisk Unofficial API](https://kinopoiskapiunofficial.tech/) — за API
- [TMDB](https://www.themoviedb.org/) — за вдохновение
- [React](https://react.dev/) — за отличный фреймворк

---

<p align="center">
  Сделано с ❤️ в России 🇷🇺
</p>

<p align="center">
  <sub>Built by <a href="https://github.com/Ap6y3ukLeo">Ap6y3ukLeo</a></sub>
</p>
