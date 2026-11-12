import { booksQueries } from '../services/booksApi';
import useQuery from './useQuery';

/** Loads every book (for the dashboard statistics); cached like every other resource. */
export default function useAllBooks() {
  const { status, data, error, reload } = useQuery(booksQueries.all());
  return { status, books: data ?? [], error: error ? error.message : null, reload };
}
