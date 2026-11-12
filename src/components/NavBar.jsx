import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/books', label: 'Books' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/about', label: 'About' },
];

const linkClass = ({ isActive }) => `nav__link${isActive ? ' is-active' : ''}`;
const ghostClass = ({ isActive }) => `btn btn--ghost nav__login${isActive ? ' is-active' : ''}`;

export default function NavBar() {
  const { user, loading, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    const ok = await logout();
    setSigningOut(false);
    if (ok) {
      showToast('You have been signed out.');
      navigate('/', { replace: true });
    }
  }

  let account;
  if (loading) {
    account = <span className="nav__placeholder" aria-hidden="true" />; // session is being restored: avoid a flash of "Log in"
  } else if (user) {
    account = (
      <>
        <NavLink to="/profile" className={ghostClass}>
          Profile
        </NavLink>
        <button type="button" className="btn nav__login" onClick={handleLogout} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Log out'}
        </button>
      </>
    );
  } else {
    account = (
      <>
        <NavLink to="/login" className={ghostClass}>
          Log in
        </NavLink>
        <NavLink to="/signup" className="btn nav__login">
          Sign up
        </NavLink>
      </>
    );
  }

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="brand" aria-label="Bookshelf — home">
          <span className="header__logo" aria-hidden="true">
            📚
          </span>
          <span className="header__title">Bookshelf</span>
        </Link>

        <nav className="nav" aria-label="Main">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav__account">{account}</div>
      </div>
    </header>
  );
}
