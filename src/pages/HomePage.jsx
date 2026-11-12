import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import heroImage from '../assets/hero-shelf.svg';

const SHORTCUTS = [
  { to: '/books', title: 'Browse books', text: 'Search, filter, sort and page through 120 titles.' },
  { to: '/dashboard', title: 'Dashboard', text: 'Statistics and breakdowns calculated from the catalogue.' },
  { to: '/about', title: 'About', text: 'How the project is built and which routes it has.' },
];

export default function HomePage() {
  usePageTitle('');
  return (
    <>
      <section className="hero">
        <div className="hero__text">
          <h2 className="hero__title">Your library catalogue, in one place</h2>
          <p className="hero__lead">
            Bookshelf is a small React app for browsing a library: find a book by title or author, narrow the list
            with filters, open its details, add new books and keep track of what is available.
          </p>
          <div className="hero__actions">
            <Link to="/books" className="btn">
              Browse the catalogue
            </Link>
            <Link to="/dashboard" className="btn btn--ghost">
              View dashboard
            </Link>
          </div>
        </div>
        <img className="hero__image" src={heroImage} alt="Illustration of a full bookshelf" width="480" height="360" />
      </section>

      <section aria-label="Where to go next">
        <ul className="shortcuts">
          {SHORTCUTS.map((item) => (
            <li key={item.to}>
              <Link to={item.to} className="panel shortcut">
                <h3>{item.title} →</h3>
                <p>{item.text}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
