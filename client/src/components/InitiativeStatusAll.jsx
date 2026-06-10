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

function ProjectSwimLane({ d }) {
  const rows = d.wi.features || [];
  if (!rows.length) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Swimlane header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
        background: 'linear-gradient(90deg,#5C0F0F,#AF3331)', borderRadius: '6px 6px 0 0'
      }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="14" height="14" rx="2" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
          <path d="M4 8h8M8 4v8" stroke="white" strokeWidth="1.5"/>
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{d.proj}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>{rows.length} initiative{rows.length > 1 ? 's' : ''}</span>
      </div>

      {/* Table for this project */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--bdr)', borderTop: 'none', borderRadius: '0 0 6px 6px' }}>
        <table className="tbl">
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              <th>Initiative</th>
              <th style={{ textAlign: 'center', width: 60 }}>Todo</th>
              <th style={{ textAlign: 'center', width: 55 }}>Dev</th>
              <th style={{ textAlign: 'center', width: 55 }}>Test</th>
              <th style={{ textAlign: 'center', width: 55 }}>Done</th>
              <th style={{ textAlign: 'center', width: 60 }}>Total</th>
              <th style={{ textAlign: 'center', width: 65 }}>OE (h)</th>
              <th style={{ textAlign: 'center', width: 65 }}>CW (h)</th>
              <th style={{ textAlign: 'center', width: 65 }}>RW (h)</th>
              <th style={{ width: 90 }}>Status</th>
              <th style={{ minWidth: 200 }}>Progress</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, fontSize: 12 }}>{r.title}</td>
                <td style={{ textAlign: 'center', color: 'var(--txt3)' }}>{r.todo}</td>
                <td style={{ textAlign: 'center', color: 'var(--ocean)' }}>{r.dev}</td>
                <td style={{ textAlign: 'center', color: 'var(--amber)' }}>{r.test}</td>
                <td style={{ textAlign: 'center', color: 'var(--green)' }}>{r.done}</td>
                <td style={{ textAlign: 'center' }}>{r.total}</td>
                <td style={{ textAlign: 'center', color: 'var(--txt2)' }}>{r.oe > 0 ? r.oe : '—'}</td>
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

export default function InitiativeStatusAll({ data }) {
  const hasData = data.some(d => (d.wi.features || []).length > 0);
  if (!hasData) return <div className="empty">No initiative data</div>;

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div className="sec">▶ Initiative Status</div>
      {data.map(d => <ProjectSwimLane key={d.proj} d={d} />)}
    </div>
  );
}
