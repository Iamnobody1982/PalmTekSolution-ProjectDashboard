function pfcls(p) { return p >= 70 ? 'gc' : p >= 40 ? 'ac' : 'rc'; }
function stcls(s) { return ['Done', 'Closed', 'Resolved'].includes(s) ? 'done' : s === 'Active' || s === 'In Progress' ? 'active' : 'new'; }

function ProgBar({ pct }) {
  const cls = pfcls(pct);
  const color = cls === 'gc' ? 'var(--green)' : cls === 'ac' ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 200, flex: 1 }}>
      <div style={{ flex: 1, height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, whiteSpace: 'nowrap' }}>{pct}%</span>
    </div>
  );
}

export default function InitiativeStatusAll({ data }) {
  const rows = [];
  data.forEach(d => {
    (d.wi.features || []).forEach(init => {
      rows.push({ proj: d.proj, ...init });
    });
  });

  if (!rows.length) return <div className="empty">No initiative data</div>;

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div className="sec">▶ Initiative Status</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Initiative</th>
              <th>Project</th>
              <th style={{ textAlign: 'center', width: 70 }}>Todo</th>
              <th style={{ textAlign: 'center', width: 60 }}>Dev</th>
              <th style={{ textAlign: 'center', width: 60 }}>Test</th>
              <th style={{ textAlign: 'center', width: 60 }}>Done</th>
              <th style={{ textAlign: 'center', width: 60 }}>Total</th>
              <th style={{ textAlign: 'center', width: 70 }}>OE (h)</th>
              <th style={{ textAlign: 'center', width: 70 }}>CW (h)</th>
              <th style={{ textAlign: 'center', width: 70 }}>RW (h)</th>
              <th style={{ width: 100 }}>Status</th>
              <th style={{ minWidth: 200 }}>Progress</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, fontSize: 12 }}>{r.title}</td>
                <td style={{ fontSize: 12, color: 'var(--txt3)' }}>{r.proj}</td>
                <td style={{ textAlign: 'center', color: 'var(--txt3)' }}>{r.todo}</td>
                <td style={{ textAlign: 'center', color: 'var(--ocean)' }}>{r.dev}</td>
                <td style={{ textAlign: 'center', color: 'var(--amber)' }}>{r.test}</td>
                <td style={{ textAlign: 'center', color: 'var(--green)' }}>{r.done}</td>
                <td style={{ textAlign: 'center' }}>{r.total}</td>
                <td style={{ textAlign: 'center' }}>{r.oe > 0 ? r.oe : '—'}</td>
                <td style={{ textAlign: 'center', color: 'var(--green)' }}>{r.cw > 0 ? r.cw : '—'}</td>
                <td style={{ textAlign: 'center', color: 'var(--amber)' }}>{r.rw > 0 ? r.rw : '—'}</td>
                <td><span className={'state-pill ' + stcls(r.state)}>{r.state}</span></td>
                <td><ProgBar pct={r.pct} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
