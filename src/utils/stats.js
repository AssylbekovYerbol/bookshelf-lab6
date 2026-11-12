import { GENRES, STATUSES } from '../constants';

const round = (value, digits = 1) => Number(value.toFixed(digits));

/** Counts books per key, in the order of `keys`. */
function countBy(books, keys, getKey) {
  return keys.map((key) => ({ key, count: books.filter((book) => getKey(book) === key).length }));
}

/** Everything the dashboard shows, calculated from the list of books returned by the API. */
export function calculateStats(books) {
  const total = books.length;
  const sum = (getValue) => books.reduce((acc, book) => acc + getValue(book), 0);
  return {
    total,
    averageRating: total ? round(sum((book) => book.rating) / total, 2) : 0,
    available: books.filter((book) => book.status === 'available').length,
    favorites: books.filter((book) => book.favorite).length,
    totalPages: sum((book) => book.pages),
    averagePages: total ? Math.round(sum((book) => book.pages) / total) : 0,
    byGenre: countBy(books, GENRES, (book) => book.genre),
    byStatus: countBy(
      books,
      STATUSES.map((status) => status.value),
      (book) => book.status,
    ),
    byRating: [
      { key: '4.5 – 5.0', count: books.filter((book) => book.rating >= 4.5).length },
      { key: '4.0 – 4.4', count: books.filter((book) => book.rating >= 4 && book.rating < 4.5).length },
      { key: '3.0 – 3.9', count: books.filter((book) => book.rating >= 3 && book.rating < 4).length },
      { key: 'Below 3.0', count: books.filter((book) => book.rating < 3).length },
    ],
    topRated: [...books].sort((a, b) => b.rating - a.rating || a.id - b.id).slice(0, 5),
  };
}
