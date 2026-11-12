import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import FormField from '../components/FormField.jsx';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import usePageTitle from '../hooks/usePageTitle';
import { getRedirectTarget } from '../utils/redirect';
import { MIN_PASSWORD_LENGTH, validateSignup } from '../utils/validation';

export default function SignupPage() {
  usePageTitle('Sign up');
  const location = useLocation();
  const { user, loading, error, isConfigured, clearError, signup, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [values, setValues] = useState({ email: '', password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => clearError, [clearError]);

  if (loading) return <Loader label="Checking your session…" />;
  if (user) return <Navigate to={getRedirectTarget(location)} replace />;

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    clearError();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    const errors = validateSignup(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setBusy(true);
    const ok = await signup(values.email, values.password);
    setBusy(false);
    if (ok) showToast('Account created. Welcome to Bookshelf!');
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
        <h2>Create an account</h2>
        <p className="auth__lead">Sign up with your email or a Google account.</p>

        <FormField id="signup-email" label="Email" error={fieldErrors.email}>
          <input
            id="signup-email"
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
        <FormField
          id="signup-password"
          label="Password"
          error={fieldErrors.password}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
        >
          <input
            id="signup-password"
            name="password"
            type="password"
            className="input"
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.password)}
          />
        </FormField>
        <FormField id="signup-confirm" label="Confirm password" error={fieldErrors.confirm}>
          <input
            id="signup-confirm"
            name="confirm"
            type="password"
            className="input"
            autoComplete="new-password"
            value={values.confirm}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.confirm)}
          />
        </FormField>

        {error && (
          <p className="form__error auth__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn auth__submit" disabled={busy || !isConfigured}>
          {busy ? 'Please wait…' : 'Sign up'}
        </button>
        <div className="auth__divider">
          <span>or</span>
        </div>
        <button type="button" className="btn btn--ghost auth__submit" onClick={handleGoogle} disabled={busy || !isConfigured}>
          Sign up with Google
        </button>

        <p className="auth__switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
