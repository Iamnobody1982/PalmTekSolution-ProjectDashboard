import { getISOWeek } from '../utils/weekUtils';

const CalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="2" width="14" height="13" rx="1.5" stroke="rgba(255,255,255,.7)" strokeWidth="1.2"/>
    <path d="M1 6h14" stroke="rgba(255,255,255,.7)" strokeWidth="1"/>
  </svg>
);

export default function Header({ lastUpdated, onRefresh, loadProgress, totalProjects }) {
  const now = new Date();
  const [, wn] = getISOWeek(now);

  const dateStr = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      '  ' + new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <header className="hdr">
      <div className="hl">
        <div>
          <div className="htitle">PalmTek Solution</div>
          <div className="hsub">Portfolio Executive Dashboard</div>
        </div>
        <div className="hdiv" />
        <div className="live-badge">
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" fill="#16A34A"/>
          </svg>
          LIVE
        </div>
      </div>

      <div className="hr2">
        {loadProgress !== null && loadProgress !== undefined && (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.7)' }}>
            Loading {loadProgress}/{totalProjects}…
          </span>
        )}
        <span className="hdate">Data as of: {dateStr}</span>
        <span className="hcal">
          <CalIcon />
          Calendar Week W{wn}
        </span>
        <button className="hbtn" onClick={onRefresh}>↻ Refresh</button>
      </div>
    </header>
  );
}
