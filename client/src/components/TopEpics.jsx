export default function TopEpics({ data, showProject = false }) {
  const all = [];
  data.forEach(d => {
    (d.critical_bugs || []).forEach(cb => {
      if (cb.open > 0) all.push({ proj: d.proj, ...cb });
    });
  });
  all.sort((a, b) => b.open - a.open);
  const rows = all.slice(0, 10);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="tbl">
        <thead>
          <tr>
            <th>Epic</th>
            {showProject && <th>Project</th>}
            <th style={{ textAlign: 'center', width: 60 }}>Open</th>
            <th style={{ textAlign: 'center', width: 70 }}>Critical</th>
            <th style={{ textAlign: 'center', width: 55 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((cb, i) => (
            <tr key={i}>
              <td style={{ whiteSpace: 'normal', fontSize: 12 }}>{cb.epic}</td>
              {showProject && <td style={{ fontSize: 12, color: 'var(--txt3)' }}>{cb.proj}</td>}
              <td style={{ textAlign: 'center' }}>{cb.open}</td>
              <td style={{ textAlign: 'center', color: cb.critical > 0 ? 'var(--red)' : 'var(--txt3)' }}>
                <b>{cb.critical}</b>
              </td>
              <td style={{ textAlign: 'center' }}>{cb.total}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr><td colSpan={showProject ? 5 : 4}><div className="empty">No open bugs</div></td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
