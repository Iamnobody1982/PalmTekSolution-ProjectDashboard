import { useState } from 'react';

function pfcls(p) { return p >= 70 ? 'gc' : p >= 40 ? 'ac' : 'rc'; }
function pctcls(p) { return p >= 70 ? 'pct-g' : p >= 40 ? 'pct-a' : 'pct-r'; }
function stcls(s) { return ['Done', 'Closed', 'Resolved'].includes(s) ? 'done' : s === 'Active' || s === 'In Progress' ? 'active' : 'new'; }
function colorOf(cls) { return cls === 'gc' ? 'var(--green)' : cls === 'ac' ? 'var(--amber)' : 'var(--red)'; }

// Azure DevOps-style icons
// Initiative: purple star/diamond
const InitIcon = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <polygon points="8,1 10,6 15,6 11,9.5 12.5,15 8,12 3.5,15 5,9.5 1,6 6,6" fill="white" opacity="0.9"/>
  </svg>
);
// Epic: blue lightning bolt (ADO standard)
const EpicIcon = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <polygon points="9,1 4,9 8,9 7,15 12,7 8,7" fill="white" opacity="0.9"/>
  </svg>
);
// Feature: teal flag/bookmark (ADO standard)
const TaskIcon = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <path d="M3 2h9l-3 4 3 4H3V2z" fill="white" opacity="0.9"/>
    <line x1="3" y1="2" x2="3" y2="14" stroke="white" strokeWidth="1.5" opacity="0.9"/>
  </svg>
);

function RowMeta({ f }) {
  return (
    <>
      <div className="counts-grp">
        <div className="cnt-item"><div className="cnt-v" style={{ color: '#6B7280' }}>{f.todo}</div><div className="cnt-l">Todo</div></div>
        <div className="cnt-item"><div className="cnt-v" style={{ color: 'var(--ocean)' }}>{f.dev}</div><div className="cnt-l">Dev</div></div>
        <div className="cnt-item"><div className="cnt-v" style={{ color: 'var(--amber)' }}>{f.test}</div><div className="cnt-l">Test</div></div>
        <div className="cnt-item"><div className="cnt-v" style={{ color: 'var(--green)' }}>{f.done}</div><div className="cnt-l">Done</div></div>
        <div className="cnt-item"><div className="cnt-v">{f.total}</div><div className="cnt-l">Total</div></div>
      </div>
      <div className="sep" />
      <div className="hrs-grp">
        <div className="hr-item"><div className="hr-v" style={{ color: 'var(--txt2)' }}>{f.oe > 0 ? f.oe + 'h' : '—'}</div><div className="hr-l">OE</div></div>
        <div className="hr-item"><div className="hr-v" style={{ color: 'var(--green)' }}>{f.cw > 0 ? f.cw + 'h' : '—'}</div><div className="hr-l">CW</div></div>
        <div className="hr-item"><div className="hr-v" style={{ color: 'var(--amber)' }}>{f.rw > 0 ? f.rw + 'h' : '—'}</div><div className="hr-l">RW</div></div>
      </div>
      <div className="sep" />
    </>
  );
}

function ProgInline({ p }) {
  const cls = pfcls(p);
  const color = colorOf(cls);
  return (
    <div className="prog-inline">
      <span className="prog-inline-label">Progress</span>
      <div className="prog-inline-bar">
        <div className="prog-inline-fill" style={{ width: p + '%', background: color }} />
      </div>
      <span className={'prog-inline-pct ' + pctcls(p)}>{p}%</span>
    </div>
  );
}

function L3Row({ item }) {
  const sc = stcls(item.state);
  return (
    <div className="l3-row">
      <div className="l3-ic"><TaskIcon /></div>
      <span className="l3-title" title={item.title}>{item.title}</span>
      <span className={'state-pill ' + sc}>{item.state}</span>
      <RowMeta f={item} />
      <ProgInline p={item.pct} />
    </div>
  );
}

function L2Row({ ep, prefix }) {
  const [open, setOpen] = useState(false);
  const esc = stcls(ep.state);
  const items = ep.items || ep.epics || [];

  return (
    <div>
      <div className={'l2-row' + (open ? ' open' : '')} onClick={() => setOpen(o => !o)}>
        <div className="l2-ic"><EpicIcon /></div>
        <span className="l2-title" title={ep.title}>{ep.title}</span>
        <span className={'state-pill ' + esc}>{ep.state}</span>
        <RowMeta f={ep} />
        <ProgInline p={ep.pct} />
        <span className={'chev' + (open ? ' open' : '')}>▼</span>
      </div>
      {open && (
        <div className="l3-wrap open">
          {items.length > 0
            ? items.map((it, i) => <L3Row key={i} item={it} />)
            : <div style={{ padding: '9px 62px', fontSize: 12, color: 'var(--txt3)' }}>No tasks linked</div>
          }
        </div>
      )}
    </div>
  );
}

function L1Row({ f, idx }) {
  const [open, setOpen] = useState(false);
  const fp = f.total > 0 ? Math.round(f.done / f.total * 100) : f.pct || 0;
  const sc = stcls(f.state);
  const epics = f.epics || [];

  return (
    <div className="init-card">
      <div className={'l1-head' + (open ? ' open' : '')} onClick={() => setOpen(o => !o)}>
        <div className="l1-ic"><InitIcon /></div>
        <span className="l1-title" title={f.title}>{f.title}</span>
        <span className={'state-pill ' + sc}>{f.state}</span>
        <RowMeta f={f} />
        <ProgInline p={fp} />
        <span className={'chev' + (open ? ' open' : '')}>▼</span>
      </div>
      {open && (
        <div className="l2-wrap open">
          {epics.length > 0
            ? epics.map((ep, ei) => <L2Row key={ei} ep={ep} prefix={idx + '-' + ei} />)
            : <div style={{ padding: '9px 34px', fontSize: 12, color: 'var(--txt3)' }}>No epics linked</div>
          }
        </div>
      )}
    </div>
  );
}

export default function InitiativeAccordion({ features }) {
  if (!features || !features.length) return <div className="empty">No initiatives</div>;
  return (
    <div className="init-list">
      {features.map((f, i) => <L1Row key={i} f={f} idx={i} />)}
    </div>
  );
}
