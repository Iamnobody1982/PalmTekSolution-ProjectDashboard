import BugOverview from './BugOverview';
import TopEpics from './TopEpics';
import TeamPerformance from './TeamPerformance';
import WeeklyActivity from './WeeklyActivity';
import InitiativeAccordion from './InitiativeAccordion';

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--green)' }}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const EffortIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--red)' }}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const UtilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--ocean)' }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const MembersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--purple)' }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
  </svg>
);
const BugIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--red)' }}>
    <circle cx="12" cy="13" r="5"/><path d="M12 8V6M5 13H2M22 13h-3"/>
  </svg>
);

function PDKCard({ iconCls, barCls, icon, label, value, unit, oe, cw, rw }) {
  return (
    <div className="pd-kc">
      <div className="pd-kc-top">
        <div className={'pd-kc-icon ' + iconCls}>{icon}</div>
        <div className="pd-kc-lbl">{label}</div>
      </div>
      <div className="pd-kc-main">
        <span className="pd-kc-val">{value}</span>
        {unit && <span className="pd-kc-unit">{unit}</span>}
      </div>
      <div className="pd-kc-delta">—</div>
      {oe !== undefined && oe !== null && (
        <div className="pd-kc-hours">
          <span>OE: <b>{oe}h</b></span>
          <span>CW: <b>{cw}h</b></span>
          <span>RW: <b>{rw}h</b></span>
        </div>
      )}
      <div className={'pd-kc-bar ' + barCls} />
    </div>
  );
}

export default function ProjectDetail({ d, team }) {
  if (!d) return null;

  const projTeam = (team || []).filter(m => m.proj === d.proj);
  const projMemberNames = projTeam.map(m => m.name);

  const bugStates = {};
  let bugTotal = 0;
  if (d.bi && d.bi.states) {
    Object.entries(d.bi.states).forEach(([s, n]) => { bugStates[s] = n; bugTotal += n; });
  }

  return (
    <div>
      <div className="pd-banner">
        <div>
          <div className="pd-title">{d.proj}</div>
          <div className="pd-sub">Project Detail View</div>
        </div>
        <div className="live-badge">
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" fill="#16A34A"/>
          </svg>
          LIVE
        </div>
      </div>

      <div className="pd-kpi-row">
        <PDKCard iconCls="ig" barCls="bg" icon={<CheckIcon/>} label="Completion" value={d.wi.pct} unit="%" />
        <PDKCard iconCls="ir" barCls="br" icon={<EffortIcon/>} label="Remaining" value={d.wi.rw} unit="h" oe={d.wi.oe} cw={d.wi.cw} rw={d.wi.rw} />
        <PDKCard iconCls="ib" barCls="bb" icon={<UtilIcon/>} label="Utilization" value={d.util} unit="%" />
        <PDKCard iconCls="ip" barCls="bp" icon={<MembersIcon/>} label="Members" value={d.members} unit="" />
        <PDKCard iconCls="ir" barCls="br" icon={<BugIcon/>} label="Open Bugs" value={d.bi.total} unit="" />
      </div>

      <div className="card" style={{ marginBottom: 10 }}>
        <div className="sec">▶ Initiative Status</div>
        <InitiativeAccordion features={d.wi.features} />
      </div>

      <div className="pd-bottom3">
        <div className="card">
          <div className="sec">🐛 Bug Overview</div>
          <BugOverview bugStates={bugStates} total={bugTotal} canvasId={'bugc_' + d.proj.replace(/[^a-z0-9]/gi, '_')} />
        </div>
        <div className="card">
          <div className="sec">🚨 Top Epics by Open Bugs</div>
          <TopEpics data={[d]} showProject={false} />
        </div>
        <div className="card">
          <div className="sec">🏆 Team Performance</div>
          <TeamPerformance team={projTeam} showProject={false} />
        </div>
      </div>

      <WeeklyActivity filterMembers={projMemberNames.length > 0 ? projMemberNames : null} />
    </div>
  );
}
