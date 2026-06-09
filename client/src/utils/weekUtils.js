export function getISOWeek(d) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  dt.setUTCDate(dt.getUTCDate() + 4 - (dt.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return [dt.getUTCFullYear(), Math.ceil(((dt - yearStart) / 86400000 + 1) / 7)];
}

export function getWeekStart(yr, wk) {
  const d = new Date(yr, 0, 1 + (wk - 1) * 7);
  const dw = d.getDay();
  if (dw <= 4) d.setDate(d.getDate() - d.getDay() + 1);
  else d.setDate(d.getDate() + 8 - d.getDay());
  return d;
}

export function buildWeekOptions(count = 12) {
  const now = new Date();
  const [cy, cw] = getISOWeek(now);
  const opts = [];
  for (let i = count - 1; i >= 0; i--) {
    let w = cw - i, y = cy;
    if (w <= 0) { y--; w += 52; }
    const ws = getWeekStart(y, w);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 6);
    opts.push({
      week: w, year: y,
      label: 'W' + w + ' (' + ws.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' - ' + we.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ')',
      start: ws,
      end: we
    });
  }
  return opts;
}

export function formatDateTime(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    '  ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
