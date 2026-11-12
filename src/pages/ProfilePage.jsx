import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import usePageTitle from '../hooks/usePageTitle';

const PROVIDERS = { password: 'Email and password', 'google.com': 'Google' };

function formatDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';
}

/** /profile — reachable only when signed in (see ProtectedRoute). */
export default function ProfilePage() {
  usePageTitle('Profile');
  const navigate = useNavigate();
  const { user, error, logout } = useAuth();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    const ok = await logout();
    setBusy(false);
    if (ok) {
      showToast('You have been signed out.');
      navigate('/', { replace: true });
    }
  }

  if (!user) return null; // ProtectedRoute redirects; this only guards the moment of signing out

  const provider = PROVIDERS[user.providerData[0]?.providerId] ?? user.providerData[0]?.providerId ?? '—';
  const facts = [
    ['Email', user.email ?? '—'],
    ['UID', user.uid],
    ['Name', user.displayName || '—'],
    ['Signed in with', provider],
    ['Email verified', user.emailVerified ? 'Yes' : 'No'],
    ['Account created', formatDate(user.metadata.creationTime)],
    ['Last sign-in', formatDate(user.metadata.lastSignInTime)],
  ];

  return (
    <section className="profile">
      <div className="panel profile__card">
        <h2>Your profile</h2>
        <dl className="facts facts--stacked">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className={label === 'UID' ? 'profile__uid' : undefined}>{value}</dd>
            </div>
          ))}
        </dl>
        {error && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}
        <button type="button" className="btn btn--danger" onClick={handleLogout} disabled={busy}>
          {busy ? 'Signing out…' : 'Log out'}
        </button>
      </div>
    </section>
  );
}
