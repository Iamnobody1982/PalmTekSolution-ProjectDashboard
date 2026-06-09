import { useEffect, useRef } from 'react';
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

const BUG_COLORS = ['#e53935','#ef6c00','#f59e0b','#fdd835','#43a047','#1e88e5','#8e24aa'];

export default function BugOverview({ bugStates, total, canvasId }) {
  const chartRef = useRef(null);
  const instanceRef = useRef(null);

  const labels = Object.keys(bugStates || {});
  const vals = Object.values(bugStates || {});
  const tot = total || vals.reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (!chartRef.current) return;
    if (instanceRef.current) { instanceRef.current.destroy(); instanceRef.current = null; }
    if (!labels.length) return;
    instanceRef.current = new Chart(chartRef.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: vals, backgroundColor: BUG_COLORS.slice(0, labels.length), borderWidth: 2, borderColor: '#fff', hoverOffset: 3 }]
      },
      options: {
        cutout: '60%',
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#fff', titleColor: '#111', bodyColor: '#555', borderColor: '#e0e0e0', borderWidth: 1, padding: 8 }
        },
        animation: { duration: 400 }
      }
    });
    return () => { if (instanceRef.current) instanceRef.current.destroy(); };
  }, [JSON.stringify(bugStates)]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 125, height: 125 }}>
        <canvas ref={chartRef} id={canvasId} width={125} height={125} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>{tot}</div>
          <div style={{ fontSize: 9, color: 'var(--txt3)', textTransform: 'uppercase', fontWeight: 600 }}>Bugs</div>
        </div>
      </div>
      <div style={{ width: '100%' }}>
        {labels.map((l, i) => {
          const p = tot > 0 ? Math.round(vals[i] / tot * 100) : 0;
          return (
            <div key={l} className="bl-row">
              <div className="bl-l">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: BUG_COLORS[i], flexShrink: 0 }} />
                <span>{l}</span>
              </div>
              <span className="bl-r">{vals[i]} <span style={{ color: 'var(--txt3)', fontWeight: 400 }}>({p}%)</span></span>
            </div>
          );
        })}
        {!labels.length && <div className="empty">No bug data</div>}
      </div>
    </div>
  );
}
