import { booksQueries } from '../services/booksApi';
import useQuery from './useQuery';

/**
 * One page of the catalogue for the given query (cached by query key, see services/queryCache.js).
 * Going back to a page you have already seen shows it instantly and refreshes it in the background.
 */
export default function useBooks(query) {
  const { status, data, error, isFetching, reload, setData } = useQuery(booksQueries.list(query));

  /** Replaces one book in the loaded page (e.g. after toggling a favourite) without refetching. */
  function replaceItem(id, book) {
    setData((prev) => ({ ...prev, items: prev.items.map((item) => (item.id === id ? book : item)) }));
  }

  return { status, data, error: error ? error.message : null, isFetching, reload, replaceItem };
}
