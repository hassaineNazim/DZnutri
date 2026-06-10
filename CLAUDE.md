# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DZnutri** is a mobile app (React Native/Expo) that helps Algerian consumers analyze food products via barcode scanning, additive risk assessment, and Nutri-Score evaluation. It has a Python FastAPI backend and a separate React admin dashboard.

## Commands

### Frontend (React Native/Expo)
```bash
npm start           # Start Expo dev server
npm run android     # Build and run on Android
npm run ios         # Build and run on iOS
npm run web         # Run in web browser
npm run lint        # Run ESLint
```

### Backend (FastAPI)
```bash
cd backend
uvicorn main:app --reload        # Start dev server (port 8000)
alembic upgrade head             # Run DB migrations
alembic revision --autogenerate -m "description"  # Create new migration
```

### Admin Frontend
```bash
cd admin-frontend
npm start   # Start admin React app
```

## Architecture

### Frontend (`/app/`)

File-based routing with `expo-router`. Entry point is `app/index.tsx` which checks AsyncStorage for a JWT token, validates it via `/auth/me`, then redirects to `/(tabs)/historique` (logged in) or `/auth` (not logged in).

**Root layout** (`app/_layout.tsx`) wraps the app with:
- `PersistQueryClientProvider` — React Query with AsyncStorage persistence (5min stale, 24hr GC)
- `ToastProvider` — in-app toast notifications
- `NotificationListener` — polls `/api/notifications` every 10 seconds
- `SafeAreaProvider`

**Navigation layers:**
- `app/auth/` — Login, register, password reset
- `app/(tabs)/` — Bottom tab nav with custom `BottomNavBar`:
  - `historique` — scan history
  - `analyse` — stats/analysis dashboard
  - `rech` — product search with filter modal
  - `reglage/` — settings submenu (language, profile, health profile, about)
- `app/scanner.tsx` — barcode scanner
- `app/screens/` — modal workflows (product submission 3-step flow, product detail, favorites, reports)

**State management:**
- React Query (`@tanstack/react-query`) for all server state
- AsyncStorage for auth tokens and language preference
- `ToastContext` for notifications

**API client** (`app/services/axios.js`): Axios instance with an auth interceptor that auto-attaches `Authorization: Bearer {token}`. API URL is dynamically detected from Expo's debuggerHost manifest (dev) or falls back to `http://172.20.10.2:8000`.

**i18n** (`app/i18n/`): French, English, Arabic. Arabic triggers `I18nManager.forceRTL(true)`. Language persisted in AsyncStorage.

**Styling**: NativeWind (Tailwind CSS for React Native). Dark mode supported via class strategy.

### Backend (`/backend/`)

FastAPI with async SQLAlchemy + asyncpg (PostgreSQL). CORS allows all origins in dev.

**Routers** (`backend/routers/`):
| Router | Key endpoints |
|--------|--------------|
| `auth.py` | Google/Facebook OAuth, login, `/auth/me`, password reset |
| `products.py` | `GET /api/product/{barcode}` — local DB first, then OpenFoodFacts fallback |
| `submissions.py` | 3-step user product submission with Cloudinary image upload + Google Vision OCR |
| `search.py` | Full-text search with category/score filters |
| `history.py` | Scan history tracking |
| `favorites.py` | Add/remove/list favorites |
| `notifications.py` | Read and retrieve notifications |
| `profile.py` | User health profile (height, weight, allergies, diet, goals) |
| `admin.py` | Review submissions, manage additives, view reports |
| `report.py` | User and automatic issue reports |

**Core business logic** (`backend/bdproduitdz/`):
- `scoring.py` — Nutri-Score, NOVA group, EcoScore calculation
- `additives_parser.py` — Additive detection and danger-level analysis
- `crud.py` — All database operations
- `schemas.py` — Pydantic request/response models
- `models.py` — SQLAlchemy models: Product, Submission, ScanHistory, Additif, Report, Favorite, Notification

**External services**: Cloudinary (image hosting), Google Vision API (OCR), OpenFoodFacts (product DB fallback), Gmail/SMTP (email).

### Admin Frontend (`/admin-frontend/`)

Separate React web app for admin tasks: reviewing product submissions, managing additives, viewing reports.

## Key Conventions

- **Auth token**: Always stored in AsyncStorage under the auth key; validated on every screen focus.
- **Product data**: Always check local DB first; fall back to OpenFoodFacts if not found.
- **Images**: All user-uploaded images go to Cloudinary; never store binaries in the DB.
- **Async pattern**: Both frontend (Expo modules) and backend (FastAPI + asyncpg) use async/await throughout.
- **Env vars**: Backend uses `.env` for `DATABASE_URL`, Cloudinary credentials, and `ENVIRONMENT` flag. Social auth credentials (Google client IDs, Facebook App ID) are in `app.json`.
