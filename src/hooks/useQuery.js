import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_STALE_TIME, keyStartsWith, queryCache, serializeKey } from '../services/queryCache';

/**
 * Reads one cache entry for a component.
 *   useQuery({ key, fetcher: ({ signal }) => Promise })
 * Returns { status, data, error, isFetching, reload, setData }.
 *  - status: 'loading' (first load or manual reload), 'success' or 'error'. While a stale value is being
 *    revalidated in the background the status stays 'success' and `isFetching` is true.
 *  - When the key changes the previous data stays on screen until the new data arrives.
 *  - A response is applied only while its effect is still current (`cancelled` flag), so a slow answer for an
 *    old key can never overwrite the result for a newer one.
 *  - Invalidating a matching key in the cache refetches it automatically.
 */
export default function useQuery({ key, fetcher, staleTime = DEFAULT_STALE_TIME }) {
  const keyId = serializeKey(key);
  const keyRef = useRef(key);
  keyRef.current = key;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const runRef = useRef(null);

  const [state, setState] = useState(() => {
    const hit = queryCache.read(key, staleTime);
    return hit
      ? { status: 'success', data: hit.data, error: null, isFetching: !hit.fresh }
      : { status: 'loading', data: null, error: null, isFetching: true };
  });

  useEffect(() => {
    let cancelled = false;
    const currentKey = keyRef.current;

    function run({ force = false, showLoading = false } = {}) {
      const hit = queryCache.read(currentKey, staleTime);

      if (hit && !force) {
        setState({ status: 'success', data: hit.data, error: null, isFetching: !hit.fresh });
        if (hit.fresh) return;
      } else {
        setState((prev) => ({
          status: hit && !showLoading ? 'success' : 'loading',
          data: hit ? hit.data : prev.data, // keep what is on screen while loading
          error: null,
          isFetching: true,
        }));
      }

      queryCache
        .fetch(currentKey, (context) => fetcherRef.current(context), { staleTime, force })
        .then((data) => {
          if (!cancelled) setState({ status: 'success', data, error: null, isFetching: false });
        })
        .catch((error) => {
          // AbortError: superseded by an invalidation, which triggers its own refetch below.
          if (cancelled || error?.name === 'AbortError') return;
          setState((prev) => ({ ...prev, status: 'error', error, isFetching: false }));
        });
    }

    runRef.current = run;
    run();
    const unsubscribe = queryCache.subscribe((prefix) => {
      if (keyStartsWith(currentKey, prefix)) run({ force: true });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyId, staleTime]);

  const reload = useCallback(() => runRef.current?.({ force: true, showLoading: true }), []);

  /** Patches the value on screen and in the cache (for instant feedback after a mutation). */
  const setData = useCallback((updater) => {
    queryCache.setData(keyRef.current, updater);
    setState((prev) => (prev.data ? { ...prev, data: updater(prev.data) } : prev));
  }, []);

  return { ...state, reload, setData };
}
