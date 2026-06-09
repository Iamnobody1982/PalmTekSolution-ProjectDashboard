import { useState, useEffect } from 'react';

const CACHE_KEY = 'palmtek_kpi_v2';

function cacheLoad() {
  try {
    const c = localStorage.getItem(CACHE_KEY);
    if (!c) return null;
    const p = JSON.parse(c);
    if (!p || !p.ts) return null;
    if ((Date.now() - p.ts) / 3600000 > 168) return null;
    return p.snap;
  } catch (e) { return null; }
}

function cacheSave(snap) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), snap })); } catch (e) {}
}

function delta(cur, prev, unit, inv) {
  if (prev === null || prev === undefined || isNaN(parseFloat(prev)) || isNaN(parseFloat(cur))) return null;
  const d = Math.round((parseFloat(cur) - parseFloat(prev)) * 10) / 10;
  if (d === 0) return { label: 'No change', color: 'var(--txt3)' };
  const better = inv ? (d < 0) : (d > 0);
  return { label: (d > 0 ? '▲ ' : '▼ ') + Math.abs(d) + (unit || ''), color: better ? 'var(--green)' : 'var(--red)' };
}

function KPICard({ iconCls, barCls, icon, label, value, unit, deltaInfo }) {
  return (
    <div className="kc">
      <div className="kc-top">
        <div className={'kc-icon ' + iconCls}>{icon}</div>
        <div className="kc-lbl">{label}</div>
      </div>
      <div>
        <span className="kc-val">{value}</span>
        {unit && <span className="kc-unit">{unit}</span>}
      </div>
      <div className="kc-delta" style={deltaInfo ? { color: deltaInfo.color } : {}}>
        {deltaInfo ? deltaInfo.label : '—'}
      </div>
      <div className={'kc-bar ' + barCls} />
    </div>
  );
}

function countEpics(data) {
  let n = 0;
  data.forEach(d => {
    (d.wi.features || []).forEach(init => {
      n += (init.epics || []).filter(e => e.state !== 'Done').length;
    });
  });
  return n;
}

function avgCycleFromTeam(team) {
  if (!team || !team.length) return '—';
  const t = team.filter(m => m.cycle !== '-' && !isNaN(parseFloat(m.cycle)));
  if (!t.length) return '—';
  return Math.round(t.reduce((a, m) => a + parseFloat(m.cycle), 0) / t.length * 10) / 10;
}

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'var(--green)'}}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const BugIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'var(--red)'}}>
    <circle cx="12" cy="13" r="5"/><path d="M12 8V6M5 13H2M22 13h-3M6.3 6.3l-2-2M19.7 6.3l-2 2M6.3 19.7l-2 2M19.7 19.7l-2-2"/>
  </svg>
);
const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'var(--amber)'}}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const EpicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'var(--purple)'}}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const UtilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'var(--ocean)'}}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const CycleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'var(--ocean)'}}>
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const EffortIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'var(--red)'}}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

export default function KPIStrip({ data, team }) {
  const [prev, setPrev] = useState(() => cacheLoad());

  let tot = 0, dn = 0, rw = 0, bugs = 0, mems = 0, burned = 0, feats = 0;
  data.forEach(d => {
    tot += d.wi.total; dn += d.wi.done; rw += d.wi.rw;
    burned += d.wi.cw; bugs += d.bi.total; mems += d.members;
    feats += (d.wi.features || []).length;
  });
  const pct = tot > 0 ? Math.round(dn / tot * 100) : 0;
  const util = mems > 0 ? Math.min(100, Math.round(burned / (mems * 30) * 100)) : 0;
  const cycle = avgCycleFromTeam(team);
  const epicCount = countEpics(data);

  useEffect(() => {
    cacheSave({ pct, rw, bugs, util, cycle: typeof cycle === 'number' ? cycle : null });
  }, [pct, rw, bugs, util, cycle]);

  return (
    <div className="krow">
      <KPICard iconCls="ig" barCls="bg" icon={<CheckIcon/>} label="Portfolio Completion" value={pct} unit="%" deltaInfo={prev ? delta(pct, prev.pct, '%', false) : null} />
      <KPICard iconCls="ir" barCls="br" icon={<EffortIcon/>} label="Remaining Effort" value={rw} unit="h" deltaInfo={prev ? delta(rw, prev.rw, 'h', true) : null} />
      <KPICard iconCls="iy" barCls="by" icon={<StarIcon/>} label="Active Initiatives" value={feats} unit="" deltaInfo={null} />
      <KPICard iconCls="ip" barCls="bp" icon={<EpicIcon/>} label="Active Epics" value={epicCount} unit="" deltaInfo={null} />
      <KPICard iconCls="ir" barCls="br" icon={<BugIcon/>} label="Open Bugs" value={bugs} unit="" deltaInfo={prev ? delta(bugs, prev.bugs, '', true) : null} />
      <KPICard iconCls="ib" barCls="bb" icon={<UtilIcon/>} label="Team Utilization" value={util} unit="%" deltaInfo={prev ? delta(util, prev.util, '%', false) : null} />
      <KPICard iconCls="ib" barCls="bb" icon={<CycleIcon/>} label="Avg Cycle Time" value={cycle} unit={typeof cycle === 'number' ? 'days' : ''} deltaInfo={prev && typeof cycle === 'number' ? delta(cycle, prev.cycle, 'd', true) : null} />
    </div>
  );
}
