// Fetching JSON with a short-lived cache, and making sure only the newest request is shown.
// Switching cities quickly can make an older, slower response arrive last; `latest()` drops it.

export class Cache {
  constructor(ttlMs = 10 * 60 * 1000, now = () => Date.now()) {
    this.ttl = ttlMs;
    this.now = now;
    this.map = new Map();
  }

  get(key) {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (this.now() - hit.at > this.ttl) {
      this.map.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key, value) {
    this.map.set(key, { value, at: this.now() });
    if (this.map.size > 50) this.map.delete(this.map.keys().next().value); // keep it small
    return value;
  }
}

/** Fetches a URL as JSON through the cache; failed requests aren't cached. */
export async function getJson(url, { cache, fetchImpl = fetch, signal } = {}) {
  const cached = cache?.get(url);
  if (cached) return cached;
  const res = await fetchImpl(url, { signal });
  if (!res.ok) throw new Error(res.status === 429 ? 'Too many requests right now. Try again in a minute.' : `The weather service answered ${res.status}.`);
  const json = await res.json();
  if (json?.error) throw new Error(json.reason || 'The weather service returned an error.');
  return cache ? cache.set(url, json) : json;
}

/** Wraps an async function so a result is only delivered if no newer call started since. */
export function latest() {
  let ticket = 0;
  return async (fn, deliver) => {
    const mine = ++ticket;
    const result = await fn();
    if (mine === ticket) deliver(result);
    return mine === ticket;
  };
}
