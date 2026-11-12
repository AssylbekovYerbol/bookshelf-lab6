import { Link } from 'react-router-dom';
import BookCover from './BookCover.jsx';
import RatingStars from './RatingStars.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function BookCard({ book, onToggleFavorite, favoritePending = false }) {
  return (
    <article className="card">
      <BookCover book={book} />
      <div className="card__body">
        <h3 className="card__title">
          <Link to={`/books/${book.id}`} className="link-button">
            {book.title}
          </Link>
        </h3>
        <p className="card__author">{book.author}</p>
        <p className="card__meta">
          {book.genre} · {book.year}
        </p>
        <div className="card__footer">
          <RatingStars value={book.rating} />
          <StatusBadge status={book.status} />
        </div>
      </div>
      <button
        type="button"
        className={`fav-btn${book.favorite ? ' is-active' : ''}`}
        onClick={() => onToggleFavorite(book)}
        disabled={favoritePending}
        aria-pressed={book.favorite}
        aria-label={book.favorite ? `Remove ${book.title} from favourites` : `Add ${book.title} to favourites`}
      >
        ♥
      </button>
    </article>
  );
}
