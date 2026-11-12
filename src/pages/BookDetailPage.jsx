import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { STATUSES } from '../constants';
import { useToast } from '../context/ToastContext.jsx';
import useBook from '../hooks/useBook';
import useBookMutations from '../hooks/useBookMutations';
import usePageTitle from '../hooks/usePageTitle';
import AddBookForm from '../components/AddBookForm.jsx';
import BookCover from '../components/BookCover.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import RatingStars from '../components/RatingStars.jsx';
import SelectField from '../components/SelectField.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

function formatReadingTime(pages) {
  const minutes = pages * 2; // ~2 minutes per page
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/**
 * /books/:id. The inner component gets key={id}: opening another book (e.g. from
 * "You may also like") remounts it, so its state (editing, busy, errors) always starts fresh.
 */
export default function BookDetailPage() {
  const { id } = useParams();
  return <BookDetailContent key={id} id={id} />;
}

function BookDetailContent({ id }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { updateBook, deleteBook } = useBookMutations();
  const { status, book, related, error, reload, mergeBook } = useBook(id);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [editing, setEditing] = useState(false);

  usePageTitle(book ? book.title : 'Book');

  // "Back" goes to the previous page (keeps the catalogue's filters and page); if the user opened this
  // URL directly there is no previous page inside the app, so it falls back to the catalogue.
  function handleBack() {
    if (location.key !== 'default') navigate(-1);
    else navigate('/books');
  }

  const nav = (
    <div className="detail__nav">
      <button type="button" className="btn btn--ghost" onClick={handleBack}>
        ← Back
      </button>
      <Link to="/books" className="btn btn--ghost">
        All books
      </Link>
    </div>
  );

  /**
   * One update/delete action at a time (`busy` also disables every control). The caller captures the
   * book id BEFORE the request starts, so the response can only be applied to that book.
   */
  async function runAction(action) {
    if (busy) return;
    setBusy(true);
    setActionError('');
    try {
      await action();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleToggleFavorite() {
    const bookId = book.id;
    const favorite = !book.favorite;
    return runAction(async () => mergeBook(bookId, await updateBook(bookId, { favorite })));
  }

  function handleStatusChange(event) {
    const bookId = book.id;
    const nextStatus = event.target.value;
    return runAction(async () => mergeBook(bookId, await updateBook(bookId, { status: nextStatus })));
  }

  async function handleSaveEdit(values) {
    // errors bubble up to the form, which shows them next to the Save button
    const bookId = book.id;
    mergeBook(bookId, await updateBook(bookId, values));
    setEditing(false);
    showToast('Changes saved.');
  }

  function handleDelete() {
    const target = book; // captured: the confirm dialog and the request refer to this exact book
    if (!window.confirm(`Delete “${target.title}” from the catalogue?`)) return undefined;
    return runAction(async () => {
      await deleteBook(target.id);
      showToast(`“${target.title}” was deleted.`);
      navigate('/books', { replace: true });
    });
  }

  if (status === 'loading' && !book) {
    return (
      <section>
        {nav}
        <Loader label="Loading book details…" />
      </section>
    );
  }

  if (status === 'error') {
    // missing / invalid id → dedicated "not found" screen; anything else → retryable error
    if (error?.name === 'NotFoundError') {
      return (
        <section>
          {nav}
          <div className="state state--error" role="alert">
            <h3>Book not found</h3>
            <p>{error.message}</p>
            <Link to="/books" className="btn">
              Browse all books
            </Link>
          </div>
        </section>
      );
    }
    return (
      <section>
        {nav}
        <ErrorMessage message={error?.message ?? 'Something went wrong.'} onRetry={reload} />
      </section>
    );
  }

  return (
    <section className="detail">
      {nav}

      <div className="panel detail__main">
        <BookCover book={book} size="lg" />

        <div className="detail__info">
          <h2 className="detail__title">{book.title}</h2>
          <p className="detail__author">by {book.author}</p>

          <div className="detail__badges">
            <RatingStars value={book.rating} />
            <StatusBadge status={book.status} />
          </div>

          <dl className="facts">
            <div>
              <dt>Genre</dt>
              <dd>{book.genre}</dd>
            </div>
            <div>
              <dt>Published</dt>
              <dd>{book.year}</dd>
            </div>
            <div>
              <dt>Pages</dt>
              <dd>{book.pages}</dd>
            </div>
            <div>
              <dt>Reading time</dt>
              <dd>≈ {formatReadingTime(book.pages)}</dd>
            </div>
            <div>
              <dt>Added</dt>
              <dd>{new Date(book.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</dd>
            </div>
            <div>
              <dt>Publisher</dt>
              <dd>{book.publisher}</dd>
            </div>
            <div>
              <dt>Edition</dt>
              <dd>{book.edition}</dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>{book.language}</dd>
            </div>
            <div>
              <dt>ISBN</dt>
              <dd>{book.isbn}</dd>
            </div>
            <div>
              <dt>Reviews</dt>
              <dd>{book.reviewsCount}</dd>
            </div>
          </dl>

          <p className="detail__description">{book.description || 'No description yet.'}</p>

          <div className="detail__actions">
            <SelectField
              id="detail-status"
              label="Availability"
              value={book.status}
              onChange={handleStatusChange}
              options={STATUSES}
              disabled={busy || editing}
            />
            <button type="button" className="btn" onClick={() => setEditing(true)} disabled={busy || editing}>
              Edit book
            </button>
            <button type="button" className="btn btn--ghost" onClick={handleToggleFavorite} disabled={busy || editing}>
              {book.favorite ? '♥ Remove from favourites' : '♡ Add to favourites'}
            </button>
            <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={busy || editing}>
              Delete book
            </button>
          </div>

          {actionError && (
            <p className="form__error" role="alert">
              {actionError}
            </p>
          )}
        </div>
      </div>

      {editing && (
        <AddBookForm
          initialValues={book}
          heading="Edit book"
          submitLabel="Save changes"
          onSubmit={handleSaveEdit}
          onCancel={() => setEditing(false)}
        />
      )}

      {related.length > 0 && (
        <div className="related">
          <h3>You may also like</h3>
          <ul className="related__list">
            {related.map((item) => (
              <li key={item.id}>
                <Link to={`/books/${item.id}`} className="related__item">
                  <BookCover book={item} size="sm" />
                  <span className="related__text">
                    <strong>{item.title}</strong>
                    <span>{item.author}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
