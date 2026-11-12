import { useEffect } from 'react';

/** Sets the browser tab title for the current page. */
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Bookshelf` : 'Bookshelf — Library Catalogue';
  }, [title]);
}
