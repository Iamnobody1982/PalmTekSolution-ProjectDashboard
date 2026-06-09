const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > entry.ttl) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

function set(key, data, ttlMs = 5 * 60 * 1000) {
  store.set(key, { data, ts: Date.now(), ttl: ttlMs });
}

function del(key) {
  if (key) store.delete(key);
  else store.clear();
}

function age(key) {
  const entry = store.get(key);
  if (!entry) return null;
  return Date.now() - entry.ts;
}

module.exports = { get, set, del, age };
