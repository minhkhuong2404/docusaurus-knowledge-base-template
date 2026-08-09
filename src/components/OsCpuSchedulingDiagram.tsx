import React, { useState, useEffect } from 'react';

const ALGOS = [
  {
    id: 'cfs', label: 'Linux CFS', color: '#38bdf8',
    overview: 'The Completely Fair Scheduler uses a red-black tree keyed by vruntime (virtual runtime). The leftmost node (smallest vruntime) is always selected next. Tasks are weighted by nice value (-20 to +19). A task with nice=-5 gets ~3× more CPU time than nice=0.',
    gantt: [
      { task: 'P1 (nice=0)', slots: [1,0,1,0,1,0,1,0], color: '#38bdf8' },
      { task: 'P2 (nice=0)', slots: [0,1,0,1,0,1,0,1], color: '#34d399' },
      { task: 'P3 (nice=5)', slots: [0,0,0,0,0,0,0,0], color: '#fbbf24' },
    ],
    keys: ['O(log n) selection from red-black tree', 'vruntime += delta × (1024/weight)', 'target_latency = 6ms / num_tasks', 'nice value maps to weight table'],
  },
  {
    id: 'rr', label: 'Round Robin', color: '#34d399',
    overview: 'Round Robin assigns a fixed time quantum (time slice) to each ready process in circular order. When the quantum expires, the process is preempted and moved to the back of the ready queue. Prevents starvation but causes frequent context switches if quantum is too small.',
    gantt: [
      { task: 'P1', slots: [1,0,0,1,0,0,1,0], color: '#38bdf8' },
      { task: 'P2', slots: [0,1,0,0,1,0,0,1], color: '#34d399' },
      { task: 'P3', slots: [0,0,1,0,0,1,0,0], color: '#a78bfa' },
    ],
    keys: ['Equal time quantum (e.g. 10ms)', 'FIFO circular ready queue', 'No starvation', 'High context switch overhead if quantum too small'],
  },
  {
    id: 'sjf', label: 'Shortest Job First', color: '#a78bfa',
    overview: 'SJF (non-preemptive) selects the process with the shortest estimated CPU burst duration. Minimizes average waiting time and turnaround time. Cannot be implemented perfectly in practice — CPU burst length must be predicted (exponential averaging of past bursts).',
    gantt: [
      { task: 'P3 (burst=2)', slots: [1,1,0,0,0,0,0,0], color: '#a78bfa' },
      { task: 'P1 (burst=4)', slots: [0,0,1,1,1,1,0,0], color: '#38bdf8' },
      { task: 'P2 (burst=6)', slots: [0,0,0,0,0,0,1,1], color: '#34d399' },
    ],
    keys: ['Shortest burst runs first', 'Non-preemptive: runs to completion', 'Can starve long jobs', 'SRTF (preemptive SJF): interrupt on shorter arrival'],
  },
];

const STATES = [
  { id: 'new', label: 'New', x: 60, y: 120, color: '#a78bfa' },
  { id: 'ready', label: 'Ready', x: 220, y: 120, color: '#38bdf8' },
  { id: 'running', label: 'Running', x: 390, y: 120, color: '#34d399' },
  { id: 'waiting', label: 'Waiting', x: 390, y: 260, color: '#fbbf24' },
  { id: 'terminated', label: 'Terminated', x: 560, y: 120, color: '#f87171' },
];

export default function OsCpuSchedulingDiagram(): React.JSX.Element {
  const [algo, setAlgo] = useState<'cfs' | 'rr' | 'sjf'>('cfs');
  const [animSlot, setAnimSlot] = useState(0);
  const [playing, setPlaying] = useState(false);
  const current = ALGOS.find(a => a.id === algo)!;

  useEffect(() => {
    if (!playing) return;
    if (animSlot >= 8) { setPlaying(false); setAnimSlot(0); return; }
    const t = setTimeout(() => setAnimSlot(s => s + 1), 400);
    return () => clearTimeout(t);
  }, [playing, animSlot]);

  const handlePlay = () => { setAnimSlot(0); setPlaying(true); };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .os-sched-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>CPU Scheduling Algorithms &amp; Process States</span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : `rgba(56,189,248,0.15)`, color: playing ? 'var(--ifm-color-content-secondary)' : '#38bdf8', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)', transition: 'all 0.2s ease' }}>
          {playing ? 'Animating…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Algorithm tabs */}
        <div style={{ display: 'flex', gap: '7px', marginBottom: '14px' }}>
          {ALGOS.map(a => (
            <button key={a.id} onClick={() => { setAlgo(a.id as 'cfs' | 'rr' | 'sjf'); setAnimSlot(0); setPlaying(false); }}
              style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11.5px', background: algo === a.id ? `${a.color}18` : 'rgba(255,255,255,0.04)', color: algo === a.id ? a.color : 'var(--ifm-color-content-secondary)', boxShadow: algo === a.id ? `0 0 0 1.5px ${a.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {a.label}
            </button>
          ))}
        </div>

        <div className="os-sched-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '14px', alignItems: 'start' }}>
          {/* Gantt chart */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Gantt Chart (time slots)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {current.gantt.map(task => (
                <div key={task.task} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10.5px', color: task.color, fontWeight: 600, minWidth: '100px', flexShrink: 0 }}>{task.task}</span>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {task.slots.map((active, si) => {
                      const isLit = active === 1 && (!playing || si < animSlot);
                      return (
                        <div key={si} style={{ width: '32px', height: '24px', borderRadius: '4px', background: isLit ? task.color : `${task.color}18`, border: `1px solid ${task.color}40`, transition: 'background 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '8.5px', color: isLit ? '#000' : task.color, fontWeight: 700, opacity: isLit ? 1 : 0.4 }}>T{si + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {current.keys.map(k => (
                <code key={k} style={{ fontSize: '10px', color: current.color, background: `${current.color}12`, border: `1px solid ${current.color}30`, borderRadius: '4px', padding: '2px 6px' }}>{k}</code>
              ))}
            </div>
          </div>

          {/* Overview */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>How it Works</div>
            <div style={{ background: `${current.color}0d`, border: `1px solid ${current.color}30`, borderRadius: '10px', padding: '12px 14px', marginBottom: '10px' }}>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.65 }}>{current.overview}</p>
            </div>

            {/* Process state machine (simplified) */}
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Process State Transitions</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {[
                { from: 'New', to: 'Ready', label: 'admitted', color: '#a78bfa' },
                { from: 'Ready', to: 'Running', label: 'scheduled', color: '#38bdf8' },
                { from: 'Running', to: 'Waiting', label: 'I/O block', color: '#fbbf24' },
                { from: 'Waiting', to: 'Ready', label: 'I/O done', color: '#fbbf24' },
                { from: 'Running', to: 'Ready', label: 'preempted', color: '#f97316' },
                { from: 'Running', to: 'Terminated', label: 'exit()', color: '#f87171' },
              ].map(t => (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: `${t.color}0d`, border: `1px solid ${t.color}25`, borderRadius: '6px', padding: '4px 8px' }}>
                  <span style={{ fontSize: '9.5px', color: t.color }}>{t.from}</span>
                  <span style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)' }}>→</span>
                  <span style={{ fontSize: '9.5px', color: t.color }}>{t.to}</span>
                  <span style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)', fontStyle: 'italic' }}>({t.label})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}