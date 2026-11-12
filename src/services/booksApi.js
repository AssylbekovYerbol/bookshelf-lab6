import * as api from './service';
import { queryCache } from './queryCache';

/**
 * The books resource as the UI sees it: query keys + fetchers for reading (cached by useQuery),
 * and mutations that write through the API and then invalidate the affected cache entries.
 *
 *   ['books', 'list', query]    one page of the catalogue for a search / filter / sort / page combination
 *   ['books', 'all']            every book (dashboard statistics)
 *   ['books', 'detail', id]     one book with its extra detail fields
 *   ['books', 'related', id]    "You may also like" for one book
 */

export const bookKeys = {
  root: ['books'],
  lists: ['books', 'list'],
  list: (query) => ['books', 'list', query],
  all: ['books', 'all'],
  detail: (id) => ['books', 'detail', String(id)],
  related: (id) => ['books', 'related', String(id)],
  relatedAll: ['books', 'related'],
};

export const booksQueries = {
  list: (query) => ({ key: bookKeys.list(query), fetcher: ({ signal }) => api.getBooks(query, { signal }) }),
  all: () => ({ key: bookKeys.all, fetcher: ({ signal }) => api.getAllBooks({ signal }) }),
  detail: (id) => ({ key: bookKeys.detail(id), fetcher: ({ signal }) => api.getBook(id, { signal }) }),
  related: (id) => ({ key: bookKeys.related(id), fetcher: ({ signal }) => api.getRelatedBooks(id, { signal }) }),
};

/** Create: every list, the dashboard data and every "related" block can change. */
export async function createBook(values) {
  const book = await api.addBook(values);
  queryCache.invalidate(bookKeys.root);
  return book;
}

/**
 * Update: lists (sorting / filters / favourites), dashboard data, related blocks and this book's page
 * are stale. The pages of other books stay cached: nothing on them changed.
 */
export async function editBook(id, patch) {
  const book = await api.updateBook(id, patch);
  queryCache.invalidate(bookKeys.lists);
  queryCache.invalidate(bookKeys.all);
  queryCache.invalidate(bookKeys.relatedAll);
  queryCache.invalidate(bookKeys.detail(id));
  return book;
}

/** Delete: the book's own entries are dropped, everything else that may have listed it is stale. */
export async function removeBook(id) {
  await api.deleteBook(id);
  queryCache.remove(bookKeys.detail(id));
  queryCache.remove(bookKeys.related(id));
  queryCache.invalidate(bookKeys.root);
}

/** Reset demo data: the whole resource is replaced. */
export async function restoreDemoData() {
  const count = await api.resetBooks();
  queryCache.invalidate(bookKeys.root);
  return count;
}

export { NotFoundError } from './service';
