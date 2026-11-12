import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import FormField from '../components/FormField.jsx';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import usePageTitle from '../hooks/usePageTitle';
import { getRedirectTarget } from '../utils/redirect';
import { EMAIL_PATTERN } from '../utils/validation';

export default function LoginPage() {
  usePageTitle('Log in');
  const location = useLocation();
  const { user, loading, error, isConfigured, clearError, login, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [values, setValues] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => clearError, [clearError]); // do not carry an old error to another page

  if (loading) return <Loader label="Checking your session…" />;
  if (user) return <Navigate to={getRedirectTarget(location)} replace />;

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    clearError();
  }

  function validate() {
    const next = {};
    if (!EMAIL_PATTERN.test(values.email.trim())) next.email = 'Enter a valid email address.';
    if (!values.password) next.password = 'Enter your password.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy || !validate()) return;
    setBusy(true);
    const ok = await login(values.email, values.password);
    setBusy(false);
    if (ok) showToast('Welcome back! You are signed in.');
  }

  async function handleGoogle() {
    if (busy) return;
    setBusy(true);
    const ok = await loginWithGoogle();
    setBusy(false);
    if (ok) showToast('Signed in with Google.');
  }

  return (
    <div className="auth">
      <form className="panel auth__card" onSubmit={handleSubmit} noValidate>
        <h2>Welcome back</h2>
        <p className="auth__lead">Log in to your Bookshelf account.</p>

        <FormField id="login-email" label="Email" error={fieldErrors.email}>
          <input
            id="login-email"
            name="email"
            type="email"
            className="input"
            placeholder="you@example.com"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.email)}
          />
        </FormField>
        <FormField id="login-password" label="Password" error={fieldErrors.password}>
          <input
            id="login-password"
            name="password"
            type="password"
            className="input"
            placeholder="••••••••"
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.password)}
          />
        </FormField>

        {error && (
          <p className="form__error auth__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn auth__submit" disabled={busy || !isConfigured}>
          {busy ? 'Please wait…' : 'Log in'}
        </button>
        <div className="auth__divider">
          <span>or</span>
        </div>
        <button type="button" className="btn btn--ghost auth__submit" onClick={handleGoogle} disabled={busy || !isConfigured}>
          Continue with Google
        </button>

        <p className="auth__switch">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
