import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GENRES, STATUSES } from '../constants';
import useAllBooks from '../hooks/useAllBooks';
import usePageTitle from '../hooks/usePageTitle';
import { calculateStats } from '../utils/stats';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import SelectField from '../components/SelectField.jsx';

const GENRE_OPTIONS = [{ value: 'all', label: 'All genres' }, ...GENRES.map((genre) => ({ value: genre, label: genre }))];
const STATUS_OPTIONS = [{ value: 'all', label: 'Any availability' }, ...STATUSES];
const STATUS_LABELS = Object.fromEntries(STATUSES.map((item) => [item.value, item.label]));

/** Link to the catalogue with the given filters applied. */
function booksLink(genre, status) {
  const params = new URLSearchParams();
  if (genre && genre !== 'all') params.set('genre', genre);
  if (status && status !== 'all') params.set('status', status);
  const query = params.toString();
  return query ? `/books?${query}` : '/books';
}

function Stat({ label, value, hint }) {
  return (
    <div className="panel stat">
      <p className="stat__label">{label}</p>
      <p className="stat__value">{value}</p>
      {hint && <p className="stat__hint">{hint}</p>}
    </div>
  );
}

/** Horizontal bar list. Each row can link to the matching filtered catalogue. */
function Breakdown({ title, rows, total, getLink, isActive }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <section className="panel breakdown" aria-label={title}>
      <h3>{title}</h3>
      <ul className="bars">
        {rows.map((row) => {
          const label = row.label ?? row.key;
          const content = (
            <>
              <span className="bars__label">{label}</span>
              <span className="bars__track" aria-hidden="true">
                <span className="bars__fill" style={{ width: `${(row.count / max) * 100}%` }} />
              </span>
              <span className="bars__value">
                {row.count}
                <small>{total ? ` · ${Math.round((row.count / total) * 100)}%` : ''}</small>
              </span>
            </>
          );
          return (
            <li key={row.key} className={isActive?.(row) ? 'is-active' : undefined}>
              {getLink ? (
                <Link to={getLink(row)} className="bars__row" title={`Show these books in the catalogue`}>
                  {content}
                </Link>
              ) : (
                <div className="bars__row">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Statistics calculated from the books returned by the API. The two selects (genre, availability)
 * are kept in the URL (?genre=…&status=…) and affect every number on the page.
 */
export default function DashboardPage() {
  usePageTitle('Dashboard');
  const [searchParams, setSearchParams] = useSearchParams();
  const genre = GENRES.includes(searchParams.get('genre')) ? searchParams.get('genre') : 'all';
  const statusParam = searchParams.get('status');
  const status = STATUSES.some((item) => item.value === statusParam) ? statusParam : 'all';

  const { status: requestStatus, books, error, reload } = useAllBooks();

  const view = useMemo(() => {
    const byGenre = (book) => genre === 'all' || book.genre === genre;
    const byStatus = (book) => status === 'all' || book.status === status;
    return {
      filtered: calculateStats(books.filter((book) => byGenre(book) && byStatus(book))),
      // Each breakdown ignores its own filter so the other options stay visible for comparison.
      genreRows: calculateStats(books.filter(byStatus)).byGenre,
      statusRows: calculateStats(books.filter(byGenre)).byStatus.map((row) => ({ ...row, label: STATUS_LABELS[row.key] })),
    };
  }, [books, genre, status]);

  function updateFilter(name, value) {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete(name);
    else next.set(name, value);
    setSearchParams(next);
  }

  if (requestStatus === 'error') return <ErrorMessage message={error} onRetry={reload} />;
  if (requestStatus === 'loading' && books.length === 0) return <Loader label="Calculating statistics…" />;

  const { filtered, genreRows, statusRows } = view;
  const filtersActive = genre !== 'all' || status !== 'all';

  return (
    <section>
      <div className="toolbar">
        <h2 className="toolbar__title">Dashboard</h2>
        <div className="toolbar__actions">
          <Link to={booksLink(genre, status)} className="btn">
            Open in catalogue →
          </Link>
        </div>
      </div>

      <section className="panel controls dash-filters" aria-label="Dashboard filters">
        <SelectField id="dash-genre" label="Genre" value={genre} onChange={(e) => updateFilter('genre', e.target.value)} options={GENRE_OPTIONS} />
        <SelectField id="dash-status" label="Availability" value={status} onChange={(e) => updateFilter('status', e.target.value)} options={STATUS_OPTIONS} />
        {filtersActive && (
          <button type="button" className="btn btn--ghost" onClick={() => setSearchParams({})}>
            Clear filters
          </button>
        )}
      </section>

      {filtered.total === 0 ? (
        <div className="state">
          <h3>No books match these filters</h3>
          <p>Try another genre or availability.</p>
          <button type="button" className="btn" onClick={() => setSearchParams({})}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="stats">
            <Stat label="Books" value={filtered.total} hint={filtersActive ? 'matching the filters' : 'in the catalogue'} />
            <Stat label="Average rating" value={`${filtered.averageRating} ★`} hint="out of 5" />
            <Stat label="Available now" value={filtered.available} hint={`${Math.round((filtered.available / filtered.total) * 100)}% of these books`} />
            <Stat label="Favourites" value={filtered.favorites} hint="marked with ♥" />
            <Stat label="Average length" value={`${filtered.averagePages} pp.`} hint="pages per book" />
            <Stat label="Total pages" value={filtered.totalPages.toLocaleString('en-GB')} hint="across all of them" />
          </div>

          <div className="breakdowns">
            <Breakdown
              title="Books by genre"
              rows={genreRows}
              total={genreRows.reduce((sum, row) => sum + row.count, 0)}
              getLink={(row) => booksLink(row.key, status)}
              isActive={(row) => row.key === genre}
            />
            <Breakdown
              title="Books by availability"
              rows={statusRows}
              total={statusRows.reduce((sum, row) => sum + row.count, 0)}
              getLink={(row) => booksLink(genre, row.key)}
              isActive={(row) => row.key === status}
            />
            <Breakdown title="Books by rating" rows={filtered.byRating} total={filtered.total} />
          </div>

          <section className="panel top-rated" aria-label="Top rated books">
            <h3>Top rated{filtersActive ? ' in this selection' : ''}</h3>
            <ol className="top-rated__list">
              {filtered.topRated.map((book) => (
                <li key={book.id}>
                  <Link to={`/books/${book.id}`}>
                    <strong>{book.title}</strong>
                    <span>
                      {book.author} · {book.genre}
                    </span>
                    <span className="top-rated__rating">{book.rating} ★</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </section>
  );
}
