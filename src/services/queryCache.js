/**
 * A small in-memory cache for server data (the same ideas as TanStack Query, in ~100 lines).
 *
 *  - Entries are addressed by a query key: an array such as ['books', 'list', { page: 2, genre: 'Fantasy' }].
 *    Keys are serialised with sorted object keys, so { a: 1, b: 2 } and { b: 2, a: 1 } are the same entry.
 *  - FRESH  (younger than staleTime, default 30 s): served from the cache, no request is made.
 *  - STALE  (older than staleTime, or invalidated): served immediately, then revalidated in the background
 *    (stale-while-revalidate), so navigation feels instant but data never stays old for long.
 *  - EXPIRED (not used for gcTime, default 5 min): removed from the cache.
 *  - Identical requests that are already in flight are shared (deduplicated).
 *  - invalidate(prefix) marks every entry whose key starts with the prefix as stale, aborts its request
 *    that is still in flight (it may carry pre-change data) and tells subscribers to refetch.
 *    A `version` counter guarantees that a response from before an invalidation can never be stored.
 */

export const DEFAULT_STALE_TIME = 30 * 1000;
export const DEFAULT_GC_TIME = 5 * 60 * 1000;

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((name) => `${JSON.stringify(name)}:${stableStringify(value[name])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export function serializeKey(key) {
  return stableStringify(key);
}

/** True when `key` starts with every element of `prefix`. */
export function keyStartsWith(key, prefix) {
  return prefix.length <= key.length && prefix.every((part, index) => stableStringify(part) === stableStringify(key[index]));
}

function createAbortError() {
  return new DOMException('The request was superseded', 'AbortError');
}

export class QueryCache {
  constructor({ gcTime = DEFAULT_GC_TIME, now = () => Date.now() } = {}) {
    this.gcTime = gcTime;
    this.now = now;
    this.entries = new Map();
    this.listeners = new Set();
  }

  /** Cached value for a key: { data, fresh } or null. */
  read(key, staleTime = DEFAULT_STALE_TIME) {
    this.collectGarbage();
    const entry = this.entries.get(serializeKey(key));
    if (!entry || !entry.hasData) return null;
    const fresh = !entry.invalidated && this.now() - entry.updatedAt < staleTime;
    return { data: entry.data, fresh };
  }

  /**
   * Returns the data for a key: from the cache while it is fresh, otherwise from `fetcher({ signal })`.
   * Concurrent calls for the same key share one request.
   */
  fetch(key, fetcher, { staleTime = DEFAULT_STALE_TIME, force = false } = {}) {
    const id = serializeKey(key);
    let entry = this.entries.get(id);
    if (!entry) {
      entry = { key, hasData: false, data: undefined, updatedAt: 0, invalidated: false, version: 0, promise: null, controller: null };
      this.entries.set(id, entry);
    }

    if (!force && entry.hasData && !entry.invalidated && this.now() - entry.updatedAt < staleTime) {
      return Promise.resolve(entry.data);
    }
    if (entry.promise) return entry.promise;

    const controller = new AbortController();
    const version = entry.version;
    entry.controller = controller;

    const promise = Promise.resolve()
      .then(() => fetcher({ signal: controller.signal }))
      .then((data) => {
        // An invalidation happened while the request was running: this response may be outdated.
        if (entry.version !== version) throw createAbortError();
        entry.data = data;
        entry.hasData = true;
        entry.updatedAt = this.now();
        entry.invalidated = false;
        return data;
      })
      .finally(() => {
        if (entry.promise === promise) {
          entry.promise = null;
          entry.controller = null;
        }
        if (!entry.hasData && !entry.promise && this.entries.get(id) === entry) this.entries.delete(id); // failed first load: nothing to keep
      });

    entry.promise = promise;
    return promise;
  }

  /** Marks matching entries stale, cancels their pending requests and notifies subscribers. */
  invalidate(prefix) {
    for (const entry of this.entries.values()) {
      if (!keyStartsWith(entry.key, prefix)) continue;
      entry.invalidated = true;
      entry.version += 1;
      entry.controller?.abort();
      entry.controller = null;
      entry.promise = null;
    }
    this.listeners.forEach((listener) => listener(prefix));
  }

  /** Replaces the cached value without touching its age (used for small local patches). */
  setData(key, updater) {
    const entry = this.entries.get(serializeKey(key));
    if (entry?.hasData) entry.data = updater(entry.data);
  }

  /** Deletes matching entries (e.g. the page of a book that no longer exists). */
  remove(prefix) {
    for (const [id, entry] of this.entries) {
      if (keyStartsWith(entry.key, prefix)) {
        entry.version += 1;
        entry.controller?.abort();
        this.entries.delete(id);
      }
    }
  }

  clear() {
    this.remove([]);
  }

  /** Listener receives the invalidated key prefix. Returns an unsubscribe function. */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  collectGarbage() {
    const limit = this.now() - this.gcTime;
    for (const [id, entry] of this.entries) {
      if (!entry.promise && entry.updatedAt < limit) this.entries.delete(id);
    }
  }
}

/** The one cache instance shared by the whole app. */
export const queryCache = new QueryCache();
