function pfcls(p) { return p >= 70 ? 'gc' : p >= 40 ? 'ac' : 'rc'; }
function hstcls(p) { return p >= 70 ? 'ok' : p >= 40 ? 'risk' : 'bad'; }
function hstlbl(p) { return p >= 70 ? '✓ On Track' : p >= 40 ? '⚠ At Risk' : '✗ Behind'; }

function HealthCard({ d }) {
  const pct = d.wi.pct;
  const cls = pfcls(pct);
  return (
    <div className="hcard">
      <div className="hcard-name">{d.proj}</div>
      <div className={'hcard-pct ' + cls}>{pct}%</div>
      <div className="hbar"><div className={'hfill ' + cls} style={{ width: pct + '%' }} /></div>
      <div className="hmeta">{d.wi.done}/{d.wi.total} items done</div>
      <div className="hitems">{d.members} members · {d.bi.total} bugs</div>
      <span className={'hst ' + hstcls(pct)}>{hstlbl(pct)}</span>
    </div>
  );
}

function ResourceTable({ data }) {
  return (
    <div className="card">
      <div className="sec">📊 Resource Allocation</div>
      <div className="res-table">
        <table className="tbl">
          <thead>
            <tr>
              <th>Project</th>
              <th style={{ textAlign: 'center' }}>Members</th>
              <th style={{ textAlign: 'center' }}>OE (h)</th>
              <th style={{ textAlign: 'center' }}>Burned (h)</th>
              <th style={{ textAlign: 'center' }}>Remaining (h)</th>
              <th style={{ textAlign: 'center', width: 90 }}>Utilization</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.proj}>
                <td style={{ fontWeight: 600 }}>{d.proj}</td>
                <td style={{ textAlign: 'center' }}>{d.members}</td>
                <td style={{ textAlign: 'center' }}>{d.wi.oe || '—'}</td>
                <td style={{ textAlign: 'center', color: 'var(--green)' }}>{d.wi.cw || '—'}</td>
                <td style={{ textAlign: 'center', color: 'var(--amber)' }}>{d.wi.rw || '—'}</td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: d.util + '%', height: '100%', background: d.util >= 80 ? 'var(--red)' : d.util >= 60 ? 'var(--amber)' : 'var(--green)', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt2)', whiteSpace: 'nowrap' }}>{d.util}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PortfolioHealth({ data }) {
  return (
    <div className="row-health">
      <div>
        <div className="sec">🏥 Portfolio Health</div>
        <div className="health-cards">
          {data.map(d => <HealthCard key={d.proj} d={d} />)}
        </div>
      </div>
      <ResourceTable data={data} />
    </div>
  );
}
