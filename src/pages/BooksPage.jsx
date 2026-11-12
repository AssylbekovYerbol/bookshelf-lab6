import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_FILTERS, PAGE_SIZE, SORT_OPTIONS } from '../constants';
import { useToast } from '../context/ToastContext.jsx';
import useBookMutations from '../hooks/useBookMutations';
import useBooks from '../hooks/useBooks';
import usePageTitle from '../hooks/usePageTitle';
import { readQuery, writeQuery } from '../utils/bookQuery';
import AddBookForm from '../components/AddBookForm.jsx';
import BookResults from '../components/BookResults.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import Pagination from '../components/Pagination.jsx';
import SearchBar from '../components/SearchBar.jsx';
import SelectField from '../components/SelectField.jsx';

function hasActiveFilters(query) {
  return (
    query.search.trim() !== '' ||
    query.genre !== DEFAULT_FILTERS.genre ||
    query.status !== DEFAULT_FILTERS.status ||
    query.minRating !== DEFAULT_FILTERS.minRating ||
    query.favoritesOnly !== DEFAULT_FILTERS.favoritesOnly
  );
}

/**
 * Catalogue page (/books). The search text, filters, sort order and page number are kept in the
 * URL (useSearchParams), so they survive refresh, can be shared as a link and work with Back/Forward.
 */
export default function BooksPage() {
  usePageTitle('Books');
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = readQuery(searchParams); // { search, genre, status, minRating, favoritesOnly, sort, page }

  const { addBook, updateBook, resetBooks } = useBookMutations(); // every mutation invalidates the cache
  const { status, data, error, reload, replaceItem } = useBooks({ ...query, pageSize: PAGE_SIZE });
  const [showForm, setShowForm] = useState(false);
  const [pendingFavoriteId, setPendingFavoriteId] = useState(null);

  // The server clamps an out-of-range page (e.g. ?page=999); mirror that in the URL.
  useEffect(() => {
    if (data && data.page !== query.page) {
      setSearchParams(writeQuery({ ...query, page: data.page }), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // --- URL updates ------------------------------------------------------------------------
  // Any filter/sort/search change goes back to page 1. Typing replaces the history entry
  // (so Back does not step through every keystroke); other changes add a new entry.
  function updateFilter(name, value) {
    setSearchParams(writeQuery({ ...query, [name]: value, page: 1 }), { replace: name === 'search' });
  }

  function handleResetFilters() {
    setSearchParams({});
  }

  function handlePageChange(nextPage) {
    setSearchParams(writeQuery({ ...query, page: nextPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- actions ----------------------------------------------------------------------------
  async function handleToggleFavorite(book) {
    if (pendingFavoriteId !== null) return; // one favourite toggle at a time
    const bookId = book.id; // captured now: the response must update exactly this book
    setPendingFavoriteId(bookId);
    try {
      const updated = await updateBook(bookId, { favorite: !book.favorite });
      replaceItem(bookId, updated); // instant feedback; the invalidated list refreshes itself in the background
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPendingFavoriteId(null);
    }
  }

  async function handleAddBook(values) {
    const book = await addBook(values); // errors bubble up to the form, which shows them
    // show the new book: default filters, newest first, page 1
    setSearchParams({}); // the invalidated list refetches by itself
    setShowForm(false);
    showToast(`“${book.title}” was added to the catalogue.`);
  }

  async function handleResetData() {
    if (!window.confirm('Restore the original 120 demo books? Your changes will be lost.')) return;
    try {
      await resetBooks();
      setSearchParams({});
      showToast('Demo data restored.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const filtersActive = hasActiveFilters(query);
  const firstItem = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const lastItem = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <>
      <div className="toolbar">
        <h2 className="toolbar__title">Catalogue</h2>
        <div className="toolbar__actions">
          <button type="button" className="btn btn--ghost" onClick={reload} disabled={status === 'loading'}>
            {status === 'loading' ? 'Loading…' : '↻ Reload'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleResetData}>
            Reset demo data
          </button>
          <button type="button" className="btn" onClick={() => setShowForm((open) => !open)} aria-expanded={showForm}>
            {showForm ? 'Close form' : '+ Add book'}
          </button>
        </div>
      </div>

      {showForm && <AddBookForm onSubmit={handleAddBook} onCancel={() => setShowForm(false)} />}

      <section className="panel controls" aria-label="Search and filters">
        <SearchBar value={query.search} onChange={(value) => updateFilter('search', value)} />
        <FilterPanel filters={query} onChange={updateFilter} onReset={handleResetFilters} canReset={filtersActive} />
      </section>

      <div className="results-bar">
        <p className="results-bar__count" aria-live="polite">
          {data
            ? data.total > 0
              ? `Showing ${firstItem}–${lastItem} of ${data.total} books`
              : '0 books found'
            : 'Loading…'}
        </p>
        <div className="results-bar__sort">
          <SelectField
            id="sort"
            label="Sort by"
            value={query.sort}
            onChange={(event) => updateFilter('sort', event.target.value)}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      <BookResults
        request={{ status, data, error }}
        hasFilters={filtersActive}
        onRetry={reload}
        onClearFilters={handleResetFilters}
        onToggleFavorite={handleToggleFavorite}
        pendingFavoriteId={pendingFavoriteId}
      />

      {data && status !== 'error' && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
          disabled={status === 'loading'}
        />
      )}
    </>
  );
}
