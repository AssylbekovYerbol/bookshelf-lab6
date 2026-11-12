import { DEFAULT_FILTERS, GENRES, RATING_OPTIONS, SORT_OPTIONS, STATUSES } from '../constants';

/**
 * The catalogue's query (search, filters, sort, page) lives in the URL, e.g.
 *   /books?q=silver&genre=Fantasy&status=available&rating=4&fav=1&sort=title-asc&page=2
 * These two helpers convert between URLSearchParams and a plain query object.
 * Values coming from the URL are validated, so a hand-edited URL can never break the page.
 */
export function readQuery(searchParams) {
  const genre = searchParams.get('genre');
  const status = searchParams.get('status');
  const sort = searchParams.get('sort');
  const rating = Number(searchParams.get('rating'));
  const page = parseInt(searchParams.get('page'), 10);

  return {
    search: searchParams.get('q') ?? '',
    genre: GENRES.includes(genre) ? genre : DEFAULT_FILTERS.genre,
    status: STATUSES.some((item) => item.value === status) ? status : DEFAULT_FILTERS.status,
    minRating: RATING_OPTIONS.some((item) => item.value === rating) ? rating : DEFAULT_FILTERS.minRating,
    favoritesOnly: searchParams.get('fav') === '1',
    sort: SORT_OPTIONS.some((item) => item.value === sort) ? sort : DEFAULT_FILTERS.sort,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/** Builds URL parameters from a query object; values equal to the defaults are left out. */
export function writeQuery(query) {
  const params = new URLSearchParams();
  if (query.search.trim() !== '') params.set('q', query.search);
  if (query.genre !== DEFAULT_FILTERS.genre) params.set('genre', query.genre);
  if (query.status !== DEFAULT_FILTERS.status) params.set('status', query.status);
  if (query.minRating !== DEFAULT_FILTERS.minRating) params.set('rating', String(query.minRating));
  if (query.favoritesOnly) params.set('fav', '1');
  if (query.sort !== DEFAULT_FILTERS.sort) params.set('sort', query.sort);
  if (query.page > 1) params.set('page', String(query.page));
  return params;
}
