import { createBook, editBook, removeBook, restoreDemoData } from '../services/booksApi';

const mutations = {
  addBook: createBook,
  updateBook: editBook,
  deleteBook: removeBook,
  resetBooks: restoreDemoData,
};

/** Create / update / delete / reset. Each one invalidates the cache entries it makes outdated. */
export default function useBookMutations() {
  return mutations;
}
