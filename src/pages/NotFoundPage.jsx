import { Link, useLocation } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Page not found');
  const { pathname } = useLocation();
  return (
    <div className="state state--notfound">
      <p className="notfound__code">404</p>
      <h2>Page not found</h2>
      <p>
        There is nothing at <code>{pathname}</code>. The link may be broken or the page may have moved.
      </p>
      <div className="hero__actions">
        <Link to="/" className="btn">
          Go to Home
        </Link>
        <Link to="/books" className="btn btn--ghost">
          Browse books
        </Link>
      </div>
    </div>
  );
}
