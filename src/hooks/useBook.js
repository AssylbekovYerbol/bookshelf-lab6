import { booksQueries } from '../services/booksApi';
import useQuery from './useQuery';

/**
 * Loads one book (with its extra detail fields) plus related books by id. Both are cached separately.
 * The page waits only for the book itself; a missing "You may also like" block is just empty.
 */
export default function useBook(id) {
  const detail = useQuery(booksQueries.detail(id));
  const related = useQuery(booksQueries.related(id));

  /** Merges a server response into the loaded book, but only if it is still the same book. */
  function mergeBook(bookId, updated) {
    detail.setData((prev) => (prev && prev.id === bookId ? { ...prev, ...updated } : prev));
  }

  function reload() {
    detail.reload();
    related.reload();
  }

  return {
    status: detail.status,
    book: detail.data,
    related: related.data ?? [],
    error: detail.error,
    reload,
    mergeBook,
  };
}
