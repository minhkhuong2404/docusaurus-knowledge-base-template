import React, { useState } from 'react';

type AlgoKey = 'mark-copy' | 'mark-sweep' | 'mark-compact' | 'concurrent-mark';

type CollectorKey = 'serial' | 'parallel' | 'cms' | 'g1' | 'zgc';

const ALGOS: Record<
  AlgoKey,
  { title: string; color: string; lead: string; underTheHood: string[]; notes: string[] }
> = {
  'mark-copy': {
    title: 'Mark-Copy (Copying)',
    color: '#34d399',
    lead: 'Split space into From/To. Trace live objects from roots, copy them into To, then drop From entirely. Young gen Minor GC is this algorithm.',
    underTheHood: [
      'Cost scales with live data, not heap size — dead objects are never visited individually.',
      'Leaves To compacted; no fragmentation inside the evacuated space.',
      'Needs spare Survivor capacity — “wastes” half of Young for the empty To.',
    ],
    notes: [
      'Default story for Eden + S0/S1.',
      'Not used for the whole Old heap historically (memory doubling is painful at large sizes).',
    ],
  },
  'mark-sweep': {
    title: 'Mark-Sweep',
    color: '#fbbf24',
    lead: 'Mark reachable objects from GC Roots, then sweep unmarked regions back to free lists. Does not move survivors.',
    underTheHood: [
      'Fragmentation: free holes scatter; large contiguous allocations can fail despite free bytes.',
      'Cheaper than compacting when live set is huge and you accept fragmentation risk.',
      'CMS used concurrent mark + sweep historically; paid for it with fragmentation and Free List complexity.',
    ],
    notes: [
      'Interview: name fragmentation as the key weakness vs Mark-Compact.',
    ],
  },
  'mark-compact': {
    title: 'Mark-Compact',
    color: '#a78bfa',
    lead: 'Mark live objects, then slide/relocate them together and update references. Produces a contiguous free region for bump allocation.',
    underTheHood: [
      'Extra STW or concurrent relocate work to fix pointers after moves.',
      'Classic Parallel Old / Full GC path; G1 evacuates regions (copy) rather than whole-heap slide.',
      'Best when Old must stay dense for throughput allocators.',
    ],
    notes: [
      'Trade pause CPU for predictable allocation success.',
    ],
  },
  'concurrent-mark': {
    title: 'Concurrent Mark (+ barriers)',
    color: '#38bdf8',
    lead: 'Application threads keep running while GC marks the heap. Write barriers (SATB, colored pointers, etc.) keep the concurrent snapshot correct.',
    underTheHood: [
      'Short STW phases remain (e.g. initial mark / remark) but long tracing is concurrent.',
      'G1: SATB buffers; ZGC: load barriers + colored pointers; Shenandoah: Brooks pointers / barriers.',
      'Goal: shrink Stop-The-World from “scan whole Old” to milliseconds or less.',
    ],
    notes: [
      'Concurrency ≠ zero pause — it relocates work off the STW critical path.',
    ],
  },
};

const COLLECTORS: Record<
  CollectorKey,
  {
    title: string;
    color: string;
    era: string;
    stw: string;
    algos: AlgoKey[];
    lead: string;
    underTheHood: string[];
    failureModes: string[];
    notes: string[];
    flags: string[];
  }
> = {
  serial: {
    title: 'Serial GC',
    color: '#94a3b8',
    era: 'Single-thread STW',
    stw: 'Long STW — entire young/old work on one GC thread',
    algos: ['mark-copy', 'mark-compact'],
    lead: 'Simplest HotSpot collector. One thread does all GC work while the application is fully stopped. Fine for tiny heaps / client VMs; unacceptable for multi-core server latency.',
    underTheHood: [
      'Young: serial Mark-Copy; Old: serial Mark-Compact.',
      'No parallel GC threads — wall-clock pause ≈ total GC CPU work.',
      'Still appears as fallback in some constrained environments.',
    ],
    failureModes: [
      'Multi-second pauses on modest heaps under load.',
      'k8s probe failures during STW look like “pod hung”.',
    ],
    notes: [
      'Baseline for “why we needed better collectors.”',
    ],
    flags: ['-XX:+UseSerialGC'],
  },
  parallel: {
    title: 'Parallel (Throughput)',
    color: '#38bdf8',
    era: 'Multi-thread STW',
    stw: 'Shorter wall STW via many GC threads — app still fully frozen',
    algos: ['mark-copy', 'mark-compact'],
    lead: 'Parallelizes young and old collections across GC worker threads. Optimizes for throughput (max work done per CPU-second), not for soft real-time latency.',
    underTheHood: [
      'Still Stop-The-World for the whole collection — just finishes faster on big machines.',
      'Default-ish historical server choice before G1 became default (JDK 9+).',
      'Great when batch jobs care about ops/sec more than p99 pauses.',
    ],
    failureModes: [
      'Large Old → STW still hundreds of ms to seconds.',
      'Wrong choice for interactive APIs with tight SLOs.',
    ],
    notes: [
      '“Parallel” ≠ concurrent with mutators — both words get confused in interviews.',
    ],
    flags: ['-XX:+UseParallelGC', '-XX:ParallelGCThreads=N'],
  },
  cms: {
    title: 'CMS (legacy)',
    color: '#fbbf24',
    era: 'Concurrent mark + sweep',
    stw: 'Mostly concurrent Old mark; short STW remark; fragmentation risk',
    algos: ['mark-copy', 'mark-sweep', 'concurrent-mark'],
    lead: 'Concurrent Mark Sweep tried to cut Old-gen STW by marking concurrently. Removed from newer JDKs — remember it as the stepping stone that taught the industry about concurrent barriers and fragmentation.',
    underTheHood: [
      'Young still copying; Old concurrent mark + sweep (no compact by default).',
      'Fragmentation → occasional expensive Full GC fallback.',
      'Write barriers + concurrent phases increased CPU overhead vs Parallel.',
    ],
    failureModes: [
      'Concurrent mode failure → Full GC STW spike.',
      'Promotion failures under fragmentation.',
    ],
    notes: [
      'Do not recommend for new systems — prefer G1/ZGC.',
      'Useful history when explaining why G1 evacuates regions.',
    ],
    flags: ['-XX:+UseConcMarkSweepGC (removed in modern JDKs)'],
  },
  g1: {
    title: 'G1 (Garbage-First)',
    color: '#a78bfa',
    era: 'Region + pause goal',
    stw: 'Bounded STW evacuations; concurrent mark; mixed GC for Old',
    algos: ['mark-copy', 'concurrent-mark'],
    lead: 'Default on modern HotSpot. Heap is split into equal regions (Eden/Survivor/Old/Humongous). G1 collects regions with the most garbage first under a pause-time goal, using concurrent marking and young/mixed evacuations.',
    underTheHood: [
      'Remembered sets track cross-region refs so a region can be collected without scanning the world.',
      'SATB write barrier during concurrent mark.',
      'Mixed GC: young + selected old regions in one pause window.',
      'Still has STW — engineered to meet -XX:MaxGCPauseMillis, not zero.',
    ],
    failureModes: [
      'to-space exhausted / evacuation failure → Full GC (look for Pause Full in logs).',
      'Humongous allocation storms fragment region map.',
    ],
    notes: [
      'Tune pause goal + heap size together; tiny heap + tiny pause is impossible.',
      'Default choice unless latency SLO demands ZGC.',
    ],
    flags: ['-XX:+UseG1GC', '-XX:MaxGCPauseMillis=200', '-XX:InitiatingHeapOccupancyPercent'],
  },
  zgc: {
    title: 'ZGC / Shenandoah',
    color: '#2dd4bf',
    era: 'Concurrent relocate',
    stw: 'Sub-millisecond STW; marking + relocating concurrent with mutators',
    algos: ['concurrent-mark'],
    lead: 'Ultra-low-pause collectors. ZGC uses colored pointers + load barriers; Shenandoah uses its own barrier design. Both move objects while application threads run. Generational ZGC (Java 21+) restores young/old cycles for allocation-heavy services.',
    underTheHood: [
      'Load/store barriers keep threads correct when objects move concurrently.',
      'Pauses limited to root scanning / handshake-scale work — typically < 1 ms.',
      'Higher steady CPU/barrier cost; shines when p99 latency is the product constraint.',
      'Allocation stall if concurrent cycle cannot reclaim fast enough under extreme alloc rates.',
    ],
    failureModes: [
      'Allocation stall under pathological allocation rate.',
      'Mis-sized heap still OOMs — low pause ≠ infinite memory.',
    ],
    notes: [
      'Pick ZGC when G1 cannot meet latency SLOs after tuning.',
      'Generational ZGC: -XX:+UseZGC -XX:+ZGenerational (JDK 21+).',
    ],
    flags: ['-XX:+UseZGC', '-XX:+ZGenerational', '-XX:+UseShenandoahGC'],
  },
};

function Section({
  label,
  color,
  items,
}: {
  label: string;
  color: string;
  items: string[];
}): React.JSX.Element {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color,
          marginBottom: '5px',
        }}
      >
        {label}
      </div>
      <ul
        style={{
          margin: 0,
          paddingLeft: '16px',
          fontSize: '12px',
          color: 'var(--ifm-color-content-secondary)',
          lineHeight: 1.55,
        }}
      >
        {items.map((item) => (
          <li key={item} style={{ marginBottom: '4px' }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const COLLECTOR_ORDER: CollectorKey[] = ['serial', 'parallel', 'cms', 'g1', 'zgc'];
const ALGO_ORDER: AlgoKey[] = ['mark-copy', 'mark-sweep', 'mark-compact', 'concurrent-mark'];

export default function GcStwEvolutionDiagram(): React.JSX.Element {
  const [collector, setCollector] = useState<CollectorKey>('g1');
  const [algo, setAlgo] = useState<AlgoKey | null>(null);

  const c = COLLECTORS[collector];
  const a = algo ? ALGOS[algo] : null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .gc-stw-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          GC Algorithms & STW Evolution
        </span>
      </div>

      <div style={{ padding: '18px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Collectors (how STW shrank over time)
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {COLLECTOR_ORDER.map((key) => {
            const item = COLLECTORS[key];
            const on = collector === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setCollector(key);
                  setAlgo(null);
                }}
                style={{
                  flex: '1 1 16%',
                  minWidth: '100px',
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '11px',
                  background: on ? `${item.color}18` : 'rgba(255,255,255,0.03)',
                  color: on ? item.color : 'var(--ifm-color-content-secondary)',
                  boxShadow: on ? `0 0 0 1.5px ${item.color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                  transition: 'all 0.2s',
                }}
              >
                <div>{item.title}</div>
                <div style={{ fontSize: '9px', fontWeight: 600, marginTop: '4px', opacity: 0.85 }}>{item.era}</div>
              </button>
            );
          })}
        </div>

        {/* Timeline strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '16px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            overflowX: 'auto',
          }}
        >
          {COLLECTOR_ORDER.map((key, i) => {
            const item = COLLECTORS[key];
            const on = collector === key;
            return (
              <React.Fragment key={key}>
                <div
                  onClick={() => {
                    setCollector(key);
                    setAlgo(null);
                  }}
                  style={{
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: on ? `${item.color}22` : 'transparent',
                    color: on ? item.color : 'var(--ifm-color-content-secondary)',
                    fontSize: '10px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.title.split(' ')[0]}
                </div>
                {i < COLLECTOR_ORDER.length - 1 && (
                  <span style={{ color: 'var(--ifm-color-content-secondary)', fontSize: '12px' }}>→</span>
                )}
              </React.Fragment>
            );
          })}
          <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#34d399', fontWeight: 700, whiteSpace: 'nowrap' }}>
            STW ↓ latency-critical
          </span>
        </div>

        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Algorithm primitives
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {ALGO_ORDER.map((key) => {
            const item = ALGOS[key];
            const related = c.algos.includes(key);
            const on = algo === key;
            return (
              <button
                key={key}
                onClick={() => setAlgo(algo === key ? null : key)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '11px',
                  background: on ? `${item.color}20` : related ? `${item.color}10` : 'rgba(255,255,255,0.03)',
                  color: on || related ? item.color : 'var(--ifm-color-content-secondary)',
                  boxShadow: on ? `0 0 0 1.5px ${item.color}50` : related ? `0 0 0 1px ${item.color}35` : '0 0 0 1px rgba(255,255,255,0.06)',
                  opacity: related || on ? 1 : 0.45,
                  transition: 'all 0.2s',
                }}
              >
                {item.title}
              </button>
            );
          })}
        </div>

        <div className="gc-stw-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
          <div className="interactive-diagram-details-card" style={{ borderColor: c.color, minHeight: '280px' }}>
            <div
              className="interactive-diagram-card-header"
              style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}
            >
              <span className="interactive-diagram-indicator-dot" style={{ background: c.color }} />
              <span style={{ fontSize: '14px', fontWeight: 800, color: c.color }}>{c.title}</span>
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#f87171',
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.25)',
                borderRadius: '6px',
                padding: '6px 10px',
                marginBottom: '12px',
              }}
            >
              STW: {c.stw}
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.55 }}>
              {c.lead}
            </p>
            <Section label="Under the hood" color={c.color} items={c.underTheHood} />
            <Section label="Failure modes" color="#f87171" items={c.failureModes} />
            <Section label="Notes" color="#fbbf24" items={c.notes} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {c.flags.map((f) => (
                <code
                  key={f}
                  style={{
                    fontSize: '11px',
                    color: '#38bdf8',
                    background: 'rgba(56,189,248,0.08)',
                    border: '1px solid rgba(56,189,248,0.25)',
                    borderRadius: '5px',
                    padding: '4px 8px',
                  }}
                >
                  {f}
                </code>
              ))}
            </div>
          </div>

          <div>
            {a ? (
              <div className="interactive-diagram-details-card" style={{ borderColor: a.color, minHeight: '280px' }}>
                <div
                  className="interactive-diagram-card-header"
                  style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}
                >
                  <span className="interactive-diagram-indicator-dot" style={{ background: a.color }} />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: a.color }}>{a.title}</span>
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.55 }}>
                  {a.lead}
                </p>
                <Section label="Under the hood" color={a.color} items={a.underTheHood} />
                <Section label="Notes" color="#fbbf24" items={a.notes} />
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '28px 16px',
                  border: '1px dashed rgba(255,255,255,0.10)',
                  borderRadius: '12px',
                  color: 'var(--ifm-color-content-secondary)',
                  fontSize: '13px',
                  minHeight: '280px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1.55,
                }}
              >
                Select an algorithm chip (highlighted ones apply to {c.title}). Mark-Copy powers Young; concurrent mark is how modern collectors cut STW.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
