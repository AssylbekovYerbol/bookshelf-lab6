import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import RootLayout from './layouts/RootLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import BooksPage from './pages/BooksPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Lazy-loaded pages: each one is a separate JS chunk, downloaded only when the route is first visited.
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const BookDetailPage = lazy(() => import('./pages/BookDetailPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

/** App only describes the route table; all UI lives in layouts/, pages/ and components/. */
export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="books">
          <Route index element={<BooksPage />} />
          <Route path=":id" element={<BookDetailPage />} />
        </Route>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        {/* everything inside ProtectedRoute requires a signed-in user */}
        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
