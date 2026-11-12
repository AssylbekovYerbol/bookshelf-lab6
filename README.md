**Live demo:** https://bookshelf-lab6.vercel.app
**Repository:** https://github.com/AssylbekovYerbol/bookshelf-lab6

# 📚 Bookshelf — React SPA (Lab 6: Server Data, Caching & Firebase Authentication)

A library catalogue built with **React 18 + Vite + React Router + Firebase Authentication**. Everything from the previous homework still works (routes, search, filters, sorting, pagination, details, create / edit / delete, dashboard); this version adds **cached server data**, **environment variables** and **sign-up / log-in / protected profile**.

**Live demo:** https://bookshelf-lab6.vercel.app
**Repository:** https://github.com/AssylbekovYerbol/bookshelf-lab6

## Routes

| Route | Page | Access |
| --- | --- | --- |
| `/` | Home | public |
| `/about` | About | public |
| `/books` | Catalogue (search, filters, sorting, pagination in the URL) | public |
| `/books/:id` | Book details | public |
| `/dashboard` | Statistics | public |
| `/login` | Email / password login + Google sign-in | public (signed-in users are redirected) |
| `/signup` | Email, password, confirm password, validation + Google | public (signed-in users are redirected) |
| `/profile` | Email, UID, log out | **protected** → unauthenticated users go to `/login` |
| `*` | 404 | public |

After logging in the user returns to the page that sent them to `/login` (e.g. `/profile`). The NavBar shows **Log in / Sign up** or **Profile / Log out**, and shows neither while the saved session is being restored (no flash of the wrong state).

## Setup

```bash
npm install
cp .env.example .env.local      # then fill in the Firebase values
npm run dev                     # http://localhost:5173
```

### Firebase

1. [Firebase console](https://console.firebase.google.com) → **Add project**.
2. **Build → Authentication → Get started → Sign-in method**: enable **Email/Password** and **Google**.
3. **Project settings → General → Your apps → Web (`</>`)** → register an app and copy the config into `.env.local` (`VITE_FIREBASE_*`, see `.env.example`).
4. **Authentication → Settings → Authorized domains**: add your deployed domain (e.g. `your-app.vercel.app` or `<user>.github.io`). `localhost` is already allowed.

`.env.local` is in `.gitignore`; only `.env.example` (without values) is committed. If the variables are missing the site still works and the auth pages show a "not configured" message instead of crashing.

### Deploy variables

- **Vercel / Netlify** — add the six `VITE_FIREBASE_*` variables in the project's Environment Variables settings, then redeploy.
- **GitHub Pages** — add the same six names as repository **secrets** (Settings → Secrets and variables → Actions); the workflow passes them to `npm run build`.

## Authentication

- `src/firebase.js` — the only place where Firebase is initialised (config from `import.meta.env.VITE_*`).
- `src/services/authService.js` — sign up, log in, Google pop-up, log out, `onAuthStateChanged` subscription, readable error messages.
- `src/context/AuthContext.jsx` — `AuthProvider` + `useAuth()` → `{ user, loading, error, clearError, signup, login, loginWithGoogle, logout }`. `loading` stays true until Firebase has restored the saved session; `error` holds the last authentication error. Actions never throw: they resolve to `true` / `false`.
- **Persistent sessions** — `browserLocalPersistence` is set explicitly, so the user stays signed in after a refresh or restart.
- `src/components/ProtectedRoute.jsx` — layout route that waits for `loading`, then renders the page or redirects to `/login`.
- Sign-up validation (`src/utils/validation.js`): valid email, password of at least 6 characters (Firebase's minimum), matching confirmation.

## Server data caching

The API is still the simulated one (`src/services/service.js`: Promises, 350–800 ms delay, `localStorage`, `AbortSignal`, `?simulateError`). A caching layer sits between it and the UI:

```
component → custom hook (useBooks / useBook / useAllBooks / useBookMutations)
          → useQuery (subscribes to the cache)
          → services/booksApi.js (query keys, fetchers, mutations)
          → services/queryCache.js (the cache) → services/service.js (the API)
```

**Query keys**

| Key | Data |
| --- | --- |
| `['books', 'list', query]` | one catalogue page for a search / filter / sort / page combination |
| `['books', 'all']` | all books (dashboard) |
| `['books', 'detail', id]` | one book with its extra detail fields |
| `['books', 'related', id]` | "You may also like" for one book |

Keys are serialised with sorted object keys, so equal queries always hit the same entry.

**Expiration / revalidation (stale-while-revalidate)**

- **Fresh** (younger than 30 s): returned from the cache, no request.
- **Stale** (older than 30 s, or invalidated): returned immediately, then refetched in the background; the screen updates when the new data arrives (`status` stays `success`, `isFetching` is true, so there is no loading flash).
- **Expired**: an entry unused for 5 minutes is removed.
- Identical requests that are in flight are shared (one request, many consumers).
- The cache lives in memory only, so a full page reload starts empty; the **↻ Reload** button always forces a fresh request.

**When cached data is invalidated** (`services/booksApi.js`)

| Operation | Invalidated |
| --- | --- |
| Add book | everything under `['books']` |
| Edit book / change availability / toggle favourite | all lists, `['books','all']`, all `related` blocks and `['books','detail',id]` (details of *other* books stay cached) |
| Delete book | the book's own `detail` / `related` entries are removed, everything else under `['books']` is invalidated |
| Reset demo data | everything under `['books']` |

Invalidation marks the entries stale, and every mounted component that uses one of them refetches it automatically.

**Loading, error and empty states** — `BookResults`, `Loader`, `ErrorMessage` and `EmptyState` as before; `?simulateError` shows the error state with a Retry button (failed responses are never cached).

**Outdated requests never overwrite newer results**

1. `useQuery` ignores a response when its effect is no longer current (the key changed or the component unmounted).
2. Each cache entry has a version counter: `invalidate()` bumps it and aborts the in-flight request, and a response that finishes after an invalidation is discarded instead of stored, so data fetched before a create / update / delete can never replace data fetched after it.
3. Requests receive an `AbortSignal` and are cancelled on cleanup.

## Project structure

```
src/
├── firebase.js                 Firebase init from VITE_ variables
├── main.jsx                    AuthProvider + BrowserRouter
├── App.jsx                     route table (ProtectedRoute for /profile)
├── layouts/RootLayout.jsx      NavBar + Suspense + Outlet + footer + ToastProvider
├── pages/                      Home, About, Books, BookDetail, Dashboard, Login, Signup, Profile, NotFound
├── components/                 UI (NavBar, ProtectedRoute, BookCard, FilterPanel, forms, …)
├── context/                    AuthContext.jsx, ToastContext.jsx
├── hooks/                      useQuery, useBooks, useBook, useAllBooks, useBookMutations, usePageTitle
├── services/
│   ├── service.js              simulated API (the only file that touches localStorage)
│   ├── queryCache.js           cache: keys, staleness, dedupe, invalidation
│   ├── booksApi.js             query keys, fetchers, mutations with invalidation
│   └── authService.js          Firebase Authentication calls
├── utils/                      bookQuery.js, stats.js, validation.js, redirect.js
└── styles/                     main.css, pages.css
```

UI components never call the API, `localStorage` or Firebase directly: they use hooks and context.

## Scripts

```bash
npm run dev      # development server
npm run build    # production build in dist/
npm run preview  # preview the production build
```

## Deploy

The app uses `BrowserRouter`, so the host must serve `index.html` for every path. `vercel.json` and `public/_redirects` contain the rule; the GitHub Pages workflow builds with `VITE_BASE=/<repo>/` and copies `index.html` to `404.html`. Do not forget the environment variables and the Firebase authorized domain (see Setup).
