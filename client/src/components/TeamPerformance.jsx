export default function TeamPerformance({ team, showProject = false }) {
  if (!team || !team.length) return <div className="empty">No team data</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="tbl">
        <thead>
          <tr>
            <th>Member</th>
            {showProject && <th>Project</th>}
            <th style={{ textAlign: 'center', width: 80 }}>Completed</th>
            <th style={{ textAlign: 'center', width: 90 }}>Avg Cycle (d)</th>
            <th style={{ textAlign: 'center', width: 70 }}>Velocity</th>
            <th style={{ textAlign: 'center', width: 95 }}>Performance</th>
          </tr>
        </thead>
        <tbody>
          {team.map((m, i) => {
            const cls = m.perf === 'Fast' ? 'fast' : m.perf === 'Normal' ? 'normal' : 'slow';
            return (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{m.name}</td>
                {showProject && <td style={{ fontSize: 12, color: 'var(--txt3)' }}>{m.proj}</td>}
                <td style={{ textAlign: 'center' }}>{m.completed}</td>
                <td style={{ textAlign: 'center' }}>{m.cycle}</td>
                <td style={{ textAlign: 'center' }}>{m.velocity}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className={'perf ' + cls}>{m.perf}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
