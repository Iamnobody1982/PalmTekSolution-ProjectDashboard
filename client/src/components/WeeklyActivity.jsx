import { useState, useEffect } from 'react';
import { buildWeekOptions } from '../utils/weekUtils';
import { fetchWeekly } from '../api/portfolio';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function cellCls(val, isFuture) {
  if (isFuture) return '';
  return val >= 6 ? 'wk-g' : val > 4 ? 'wk-a' : 'wk-r';
}

export default function WeeklyActivity({ filterMembers = null }) {
  const wkOpts = buildWeekOptions(12);
  const [wkIdx, setWkIdx] = useState(wkOpts.length - 1);
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const wk = wkOpts[wkIdx];

  useEffect(() => {
    if (!wk) return;
    setLoading(true);
    setError(null);
    fetchWeekly(wk.start)
      .then(data => { setWeekly(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [wkIdx]);

  const now = new Date(); now.setHours(0, 0, 0, 0);
  const dd = DAYS.map((_, i) => { const d = new Date(wk.start); d.setDate(d.getDate() + i); return d; });

  let rows = [];
  if (weekly && weekly.members) {
    weekly.members.forEach((name, mi) => {
      if (filterMembers && !filterMembers.includes(name)) return;
      const counts = (weekly.days && weekly.days[mi]) || Array(7).fill(0);
      const mm = (weekly._memberMap && weekly._memberMap[name]) || {};
      rows.push({ name, counts, oe: mm.totalOE || 0, rw: mm.totalRW || 0 });
    });
  }

  const colT = Array(7).fill(0);
  let grandCW = 0, grandOE = 0, grandRW = 0;
  rows.forEach(row => {
    const totalCW = row.counts.reduce((a, b) => a + b, 0);
    grandCW += totalCW; grandOE += row.oe; grandRW += row.rw;
    row.counts.forEach((c, i) => { colT[i] += c; });
    row.totalCW = totalCW;
  });

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div className="wkh">
        <div className="sec" style={{ marginBottom: 0 }}>📅 Weekly Activity</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--txt3)' }}>Calendar Week:</span>
          <select className="wksel" value={wkIdx} onChange={e => setWkIdx(Number(e.target.value))}>
            {wkOpts.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="empty">Loading weekly data…</div>}
      {error && <div style={{ color: 'var(--red)', fontSize: 12, padding: '8px 0' }}>Error: {error}</div>}

      {!loading && !error && (
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 160 }}>Member</th>
                {DAYS.map((d, i) => (
                  <th key={d} style={{ textAlign: 'center' }}>{d} {dd[i].getDate()}/{dd[i].getMonth() + 1}</th>
                ))}
                <th style={{ textAlign: 'center', width: 65 }}>Total CW</th>
                <th style={{ textAlign: 'center', width: 55 }}>OE</th>
                <th style={{ textAlign: 'center', width: 55 }}>RW</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{row.name}</td>
                  {row.counts.map((c, i) => {
                    const future = dd[i] > now;
                    return (
                      <td key={i} className={cellCls(c, future)} style={{ textAlign: 'center' }}>
                        {c > 0 ? c.toFixed(1) : '0.0'}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{row.totalCW > 0 ? row.totalCW.toFixed(1) : '0.0'}</td>
                  <td style={{ textAlign: 'center' }}>{row.oe > 0 ? row.oe.toFixed(1) : '—'}</td>
                  <td style={{ textAlign: 'center' }}>{row.rw > 0 ? row.rw.toFixed(1) : '—'}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={11}><div className="empty">No activity data</div></td></tr>
              )}
              <tr className="tot-r">
                <td>TOTAL</td>
                {colT.map((t, i) => <td key={i} style={{ textAlign: 'center' }}>{t > 0 ? t.toFixed(1) : '0'}</td>)}
                <td style={{ textAlign: 'center', fontWeight: 700 }}>{grandCW > 0 ? grandCW.toFixed(1) : '0.0'}</td>
                <td style={{ textAlign: 'center' }}>{grandOE > 0 ? grandOE.toFixed(1) : '—'}</td>
                <td style={{ textAlign: 'center' }}>{grandRW > 0 ? grandRW.toFixed(1) : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
