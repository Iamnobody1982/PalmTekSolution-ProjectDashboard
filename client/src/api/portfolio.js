const BASE = import.meta.env.VITE_API_URL || '';

export async function fetchPortfolio(refresh = false) {
  const url = BASE + '/api/portfolio' + (refresh ? '?refresh=1' : '');
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch portfolio');
  }
  return res.json();
}

export async function fetchWeekly(weekStart, refresh = false) {
  const params = new URLSearchParams({ weekStart: weekStart.toISOString().slice(0, 10) });
  if (refresh) params.set('refresh', '1');
  const url = BASE + '/api/portfolio/weekly?' + params.toString();
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch weekly data');
  }
  return res.json();
}

export async function clearCache() {
  const url = BASE + '/api/portfolio/cache';
  const res = await fetch(url, { method: 'DELETE' });
  return res.json();
}
