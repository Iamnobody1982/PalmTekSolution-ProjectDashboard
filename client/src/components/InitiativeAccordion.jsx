import { useState } from 'react';

function pfcls(p) { return p >= 70 ? 'gc' : p >= 40 ? 'ac' : 'rc'; }
function pctcls(p) { return p >= 70 ? 'pct-g' : p >= 40 ? 'pct-a' : 'pct-r'; }
function stcls(s) { return ['Done', 'Closed', 'Resolved'].includes(s) ? 'done' : s === 'Active' || s === 'In Progress' ? 'active' : 'new'; }
function colorOf(cls) { return cls === 'gc' ? 'var(--green)' : cls === 'ac' ? 'var(--amber)' : 'var(--red)'; }

// Azure DevOps-style icons
const InitIcon = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <polygon points="8,1 10,6 15,6 11,9.5 12.5,15 8,12 3.5,15 5,9.5 1,6 6,6" fill="white" opacity="0.9"/>
  </svg>
);
const EpicIcon = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <polygon points="9,1 4,9 8,9 7,15 12,7 8,7" fill="white" opacity="0.9"/>
  </svg>
);
const FeatureIcon = () => (
  <svg viewBox="0 0 16 16" fill="none">
    <path d="M3 2h9l-3 4 3 4H3V2z" fill="white" opacity="0.9"/>
    <line x1="3" y1="2" x2="3" y2="14" stroke="white" strokeWidth="1.5" opacity="0.9"/>
  </svg>
);

/* Shared right-side meta: counts | sep | hrs | sep — renders inside the grid */
function CountsCell({ f }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', lineHeight: 1 }}>{f.todo}</div>
        <div style={{ fontSize: 9, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px', marginTop: 1 }}>Todo</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ocean)', lineHeight: 1 }}>{f.dev}</div>
        <div style={{ fontSize: 9, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px', marginTop: 1 }}>Dev</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)', lineHeight: 1 }}>{f.test}</div>
        <div style={{ fontSize: 9, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px', marginTop: 1 }}>Test</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', lineHeight: 1 }}>{f.done}</div>
        <div style={{ fontSize: 9, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px', marginTop: 1 }}>Done</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>{f.total}</div>
        <div style={{ fontSize: 9, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px', marginTop: 1 }}>Total</div>
      </div>
    </div>
  );
}

function HrsCell({ f }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-end' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt2)', lineHeight: 1 }}>{f.oe > 0 ? f.oe + 'h' : '—'}</div>
        <div style={{ fontSize: 9, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px', marginTop: 1 }}>OE</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', lineHeight: 1 }}>{f.cw > 0 ? f.cw + 'h' : '—'}</div>
        <div style={{ fontSize: 9, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px', marginTop: 1 }}>CW</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', lineHeight: 1 }}>{f.rw > 0 ? f.rw + 'h' : '—'}</div>
        <div style={{ fontSize: 9, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px', marginTop: 1 }}>RW</div>
      </div>
    </div>
  );
}

function ProgCell({ p }) {
  const cls = pfcls(p);
  const color = colorOf(cls);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 5, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: p + '%', height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, flexShrink: 0, minWidth: 32, textAlign: 'right' }}>{p}%</span>
    </div>
  );
}

/* Divider cell */
function Sep() {
  return <div style={{ width: 1, background: 'var(--bdr)', alignSelf: 'stretch', margin: '4px 0' }} />;
}

function L3Row({ item }) {
  const sc = stcls(item.state);
  const fp = item.total > 0 ? Math.round(item.done / item.total * 100) : item.pct || 0;
  return (
    <div className="l3-head-indent">
      <div className="acc-row">
        <div className="l3-ic"><FeatureIcon /></div>
        <span className="l3-title" title={item.title}>{item.title}</span>
        <span className={'state-pill ' + sc} style={{ justifySelf: 'start' }}>{item.state}</span>
        <CountsCell f={item} />
        <Sep />
        <HrsCell f={item} />
        <Sep />
        <ProgCell p={fp} />
        <span />
      </div>
    </div>
  );
}

function L2Row({ ep, prefix }) {
  const [open, setOpen] = useState(false);
  const esc = stcls(ep.state);
  const items = ep.items || ep.epics || [];
  const fp = ep.total > 0 ? Math.round(ep.done / ep.total * 100) : ep.pct || 0;

  return (
    <div>
      <div className={'l2-head-indent' + (open ? ' open' : '')} onClick={() => setOpen(o => !o)}>
        <div className="acc-row">
          <div className="l2-ic"><EpicIcon /></div>
          <span className="l2-title" title={ep.title}>{ep.title}</span>
          <span className={'state-pill ' + esc} style={{ justifySelf: 'start' }}>{ep.state}</span>
          <CountsCell f={ep} />
          <Sep />
          <HrsCell f={ep} />
          <Sep />
          <ProgCell p={fp} />
          <span className={'chev' + (open ? ' open' : '')}>▼</span>
        </div>
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
        <div className="acc-row">
          <div className="l1-ic"><InitIcon /></div>
          <span className="l1-title" title={f.title}>{f.title}</span>
          <span className={'state-pill ' + sc} style={{ justifySelf: 'start' }}>{f.state}</span>
          <CountsCell f={f} />
          <Sep />
          <HrsCell f={f} />
          <Sep />
          <ProgCell p={fp} />
          <span className={'chev' + (open ? ' open' : '')}>▼</span>
        </div>
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
