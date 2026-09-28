import React, { useState } from 'react';

type DiagramMode = 'pipeline' | 'timebucketing' | 'evalengine' | 'statscomparison';

interface PipelineStep {
  id: string;
  name: string;
  location: string;
  spl: string;
  role: string;
  details: string;
  color: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'dispatch',
    name: '1. Query Parsing & Dispatch',
    location: 'Search Head',
    spl: 'index=prod_app sourcetype=nginx:access ...',
    role: 'Search Head validates syntax, resolves macros/lookups, and splits query into streaming vs transforming parts.',
    details: 'The Search Head acts as the master coordinator. It identifies which commands can run concurrently on Indexers (distributable streaming) vs commands that require all results (centralized transforming).',
    color: '#38bdf8'
  },
  {
    id: 'bloom',
    name: '2. TSIDX & Bloom Filter Lookup',
    location: 'Indexers (Parallel)',
    spl: 'index=prod_app status>=500',
    role: 'Indexers inspect 1KB tsidx files and bloom filters to discard non-matching buckets without touching raw disk.',
    details: 'Splunk partitions time into hot/warm/cold buckets. By scoping with index, sourcetype, and time boundaries (earliest/latest), 95%+ of disk I/O is skipped via inverted index keys.',
    color: '#fbbf24'
  },
  {
    id: 'streaming',
    name: '3. Streaming Eval & Field Extraction',
    location: 'Indexers (Map Phase)',
    spl: 'eval latency_sec = duration / 1000 | bin _time span=5m',
    role: 'Streaming commands execute on each Indexer across locally matched events in parallel (Map phase).',
    details: 'Distributable streaming commands like eval, rex, and bin process records on the indexer slice before data traverses the network, minimizing TCP transfer overhead.',
    color: '#2dd4bf'
  },
  {
    id: 'transport',
    name: '4. Intermediary Network Transport',
    location: 'Internal Network (TCP)',
    spl: 'Pre-aggregated hash tables / event stream',
    role: 'Indexers push compact partial aggregates to the Search Head over internal high-speed TCP sockets.',
    details: 'Rather than transmitting millions of raw log strings, indexers transmit pre-aggregated tuples (e.g. partial sums and counts per time bucket), conserving network bandwidth.',
    color: '#a78bfa'
  },
  {
    id: 'reduce',
    name: '5. Search Head Reduce & Presentation',
    location: 'Search Head (Reduce Phase)',
    spl: 'stats count, p95(latency_sec) by _time, service | sort - count',
    role: 'Search Head merges intermediate hash tables from all indexers into the final consolidated result set.',
    details: 'Non-streaming / transforming commands execute on the Search Head. It merges partial results, executes final mathematical formatting, and renders tables or timecharts.',
    color: '#34d399'
  }
];

export default function SplunkQueryPipelineDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<DiagramMode>('pipeline');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedBucketSpan, setSelectedBucketSpan] = useState<'1m' | '5m' | '1h'>('5m');
  const [selectedEvalSample, setSelectedEvalSample] = useState<'latency' | 'status_case' | 'coalesce_ip'>('status_case');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .splunk-grid-2col {
            grid-template-columns: 1fr !important;
          }
          .splunk-tab-btn {
            font-size: 11px !important;
            padding: 6px 8px !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Splunk SPL Query Pipeline &amp; Execution Simulator
        </span>

        {/* Mode Selector Tabs */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'pipeline', label: '⚡ 1. Distributed Pipeline', color: '#38bdf8' },
            { id: 'timebucketing', label: '⏱️ 2. Time Bucketing (bin/span)', color: '#2dd4bf' },
            { id: 'evalengine', label: '🧪 3. eval & case() Engine', color: '#fbbf24' },
            { id: 'statscomparison', label: '📊 4. stats vs streamstats', color: '#a78bfa' }
          ].map(t => (
            <button
              key={t.id}
              className="splunk-tab-btn"
              onClick={() => setMode(t.id as DiagramMode)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: `1px solid ${mode === t.id ? t.color : 'rgba(255,255,255,0.08)'}`,
                background: mode === t.id ? `${t.color}22` : 'rgba(255,255,255,0.03)',
                color: mode === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: mode === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* TAB 1: DISTRIBUTED SPL PIPELINE */}
        {mode === 'pipeline' && (
          <div>
            <div className="interactive-diagram-helper-text" style={{ marginBottom: '10px' }}>
              Select a stage or step through the distributed search lifecycle from Search Head (MapReduce coordinator) to Indexers.
            </div>

            {/* Stage Selector Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '12px' }}>
              {PIPELINE_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStep(idx)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeStep === idx ? `${s.color}28` : 'rgba(255,255,255,0.04)',
                    color: activeStep === idx ? s.color : 'var(--ifm-color-content-secondary)',
                    boxShadow: activeStep === idx ? `0 0 0 1.5px ${s.color}` : 'none',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Step {idx + 1}
                  <div style={{ fontSize: '9.5px', opacity: 0.85, marginTop: '2px' }}>{s.location}</div>
                </button>
              ))}
            </div>

            {/* SVG Flow Canvas */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 220" className="interactive-diagram-svg">
                <defs>
                  <marker id="marker-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#38bdf8" /></marker>
                  <marker id="marker-amber" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#fbbf24" /></marker>
                  <marker id="marker-teal" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#2dd4bf" /></marker>
                  <marker id="marker-purple" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#a78bfa" /></marker>
                  <marker id="marker-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" /></marker>
                </defs>

                {/* Search Head Box (Left) */}
                <g transform="translate(30, 40)">
                  <rect
                    width="150"
                    height="140"
                    rx="8"
                    fill={activeStep === 0 || activeStep === 4 ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255, 255, 255, 0.03)'}
                    stroke={activeStep === 0 ? '#38bdf8' : activeStep === 4 ? '#34d399' : 'rgba(255, 255, 255, 0.12)'}
                    strokeWidth={activeStep === 0 || activeStep === 4 ? 2 : 1}
                  />
                  <text x="75" y="28" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="800">SEARCH HEAD</text>
                  <line x1="15" y1="36" x2="135" y2="36" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <text x="75" y="58" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10" fontWeight="600">Coordinator &amp; UI</text>
                  <text x="75" y="76" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">1. Parse Query</text>
                  <text x="75" y="92" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">2. Generate Plan</text>
                  <text x="75" y="112" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="700">5. Final Reduce</text>
                  <text x="75" y="126" textAnchor="middle" fill="#86efac" fontSize="8.5">stats / timechart</text>
                </g>

                {/* Dispatch Arrow SH -> Indexers */}
                <path
                  d="M 180 75 L 305 75"
                  fill="none"
                  stroke={activeStep >= 1 ? '#38bdf8' : 'rgba(255,255,255,0.15)'}
                  strokeWidth="2"
                  markerEnd="url(#marker-blue)"
                  className={activeStep === 0 ? 'interactive-diagram-flowing-path' : ''}
                />
                <text x="242" y="65" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="700">Dispatch Map</text>

                {/* Indexer Cluster (Middle) */}
                <g transform="translate(315, 25)">
                  <rect
                    width="230"
                    height="170"
                    rx="10"
                    fill={activeStep === 1 || activeStep === 2 ? 'rgba(45, 212, 191, 0.12)' : 'rgba(255, 255, 255, 0.02)'}
                    stroke={activeStep === 1 ? '#fbbf24' : activeStep === 2 ? '#2dd4bf' : 'rgba(255, 255, 255, 0.15)'}
                    strokeWidth={activeStep === 1 || activeStep === 2 ? 2 : 1}
                  />
                  <text x="115" y="24" textAnchor="middle" fill="#2dd4bf" fontSize="12" fontWeight="800">INDEXER PEERS (CLUSTER)</text>
                  <line x1="20" y1="32" x2="210" y2="32" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                  {/* Peer 1 */}
                  <g transform="translate(15, 45)">
                    <rect width="200" height="34" rx="4" fill="rgba(251, 191, 36, 0.12)" stroke="#fbbf24" strokeWidth="1" />
                    <text x="10" y="15" fill="#fbbf24" fontSize="9.5" fontWeight="700">Peer 1: tsidx Bloom filter scan</text>
                    <text x="10" y="27" fill="var(--ifm-color-content-secondary)" fontSize="8">index=prod_app | earliest=-24h</text>
                  </g>

                  {/* Peer 2 */}
                  <g transform="translate(15, 87)">
                    <rect width="200" height="34" rx="4" fill="rgba(45, 212, 191, 0.12)" stroke="#2dd4bf" strokeWidth="1" />
                    <text x="10" y="15" fill="#2dd4bf" fontSize="9.5" fontWeight="700">Peer 2: Streaming eval &amp; bin</text>
                    <text x="10" y="27" fill="var(--ifm-color-content-secondary)" fontSize="8">eval is_error=if(status&gt;=500,1,0)</text>
                  </g>

                  {/* Peer N */}
                  <g transform="translate(15, 129)">
                    <rect width="200" height="30" rx="4" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <text x="10" y="18" fill="var(--ifm-color-content-secondary)" fontSize="9">Peer N: Partial hash table buffer</text>
                  </g>
                </g>

                {/* Return Arrow Indexers -> Search Head */}
                <path
                  d="M 315 145 C 240 165, 210 160, 180 145"
                  fill="none"
                  stroke={activeStep >= 3 ? '#a78bfa' : 'rgba(255,255,255,0.15)'}
                  strokeWidth="2"
                  markerEnd="url(#marker-purple)"
                  className={activeStep === 3 ? 'interactive-diagram-flowing-path' : ''}
                />
                <text x="245" y="180" textAnchor="middle" fill="#a78bfa" fontSize="8.5" fontWeight="700">TCP Partial Aggs</text>

                {/* Presentation Results (Right) */}
                <g transform="translate(605, 40)">
                  <rect
                    width="185"
                    height="140"
                    rx="8"
                    fill={activeStep === 4 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.03)'}
                    stroke={activeStep === 4 ? '#34d399' : 'rgba(255, 255, 255, 0.12)'}
                    strokeWidth={activeStep === 4 ? 2 : 1}
                  />
                  <text x="92" y="24" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">CLIENT / DASHBOARD</text>
                  <line x1="15" y1="32" x2="170" y2="32" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                  {/* Sample table preview */}
                  <rect x="15" y="44" width="155" height="18" fill="rgba(255,255,255,0.06)" rx="3" />
                  <text x="22" y="56" fill="var(--ifm-color-content)" fontSize="8.5" fontWeight="700">_time | count | err_rate</text>

                  <rect x="15" y="68" width="155" height="16" fill="rgba(52,211,153,0.08)" rx="2" />
                  <text x="22" y="80" fill="#34d399" fontSize="8">14:00 | 14,230 | 0.42%</text>

                  <rect x="15" y="88" width="155" height="16" fill="rgba(248,113,113,0.08)" rx="2" />
                  <text x="22" y="100" fill="#f87171" fontSize="8">14:05 | 18,910 | 3.85% ⚠️</text>

                  <text x="92" y="124" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Sub-second rendering</text>
                </g>

                {/* Final arrow from SH to Client */}
                <path
                  d="M 180 110 C 260 215, 520 215, 605 110"
                  fill="none"
                  stroke={activeStep === 4 ? '#34d399' : 'rgba(255,255,255,0.15)'}
                  strokeWidth="2"
                  markerEnd="url(#marker-green)"
                  className={activeStep === 4 ? 'interactive-diagram-flowing-path' : ''}
                />
                <text x="390" y="212" textAnchor="middle" fill="#34d399" fontSize="8.5" fontWeight="700">Final Aggregated Stream</text>
              </svg>
            </div>

            {/* Active Stage Details Card */}
            <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${PIPELINE_STEPS[activeStep].color}` }}>
              <div className="interactive-diagram-card-header" style={{ marginBottom: '8px' }}>
                <span style={{ color: PIPELINE_STEPS[activeStep].color, fontWeight: 800, fontSize: '13.5px' }}>
                  {PIPELINE_STEPS[activeStep].name} [{PIPELINE_STEPS[activeStep].location}]
                </span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '2px' }}>SPL Command Example:</span>
                <code style={{ color: PIPELINE_STEPS[activeStep].color, fontSize: '12px', fontWeight: 600 }}>
                  {PIPELINE_STEPS[activeStep].spl}
                </code>
              </div>
              <p style={{ margin: '0 0 6px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>
                <strong>Role:</strong> {PIPELINE_STEPS[activeStep].role}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                <strong>Under the Hood:</strong> {PIPELINE_STEPS[activeStep].details}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: TIME BUCKETING SIMULATOR */}
        {mode === 'timebucketing' && (
          <div>
            <div className="interactive-diagram-helper-text" style={{ marginBottom: '12px' }}>
              Splunk's <code>bin _time span=...</code> and <code>timechart</code> quantize non-uniform event timestamps into uniform epoch boundaries.
            </div>

            {/* Span Control Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>Selected Span:</span>
              {(['1m', '5m', '1h'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedBucketSpan(s)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${selectedBucketSpan === s ? '#2dd4bf' : 'rgba(255,255,255,0.1)'}`,
                    background: selectedBucketSpan === s ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255,255,255,0.04)',
                    color: selectedBucketSpan === s ? '#2dd4bf' : 'var(--ifm-color-content-secondary)',
                    fontWeight: selectedBucketSpan === s ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  span={s}
                </button>
              ))}

              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8' }}>
                Underlying Math: <code>_time = floor(_time / span_seconds) * span_seconds</code>
              </span>
            </div>

            {/* Interactive Timeline Visualizer */}
            <div className="splunk-grid-2col" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontWeight: 700, fontSize: '12px', color: '#2dd4bf', marginBottom: '10px' }}>
                  Raw Event Ingestion Stream (Irregular Timestamps)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { rawTime: '10:01:23 AM', epoch: 1726480883, status: 200, latency: '42ms' },
                    { rawTime: '10:02:47 AM', epoch: 1726480967, status: 502, latency: '1240ms' },
                    { rawTime: '10:04:12 AM', epoch: 1726481052, status: 200, latency: '35ms' },
                    { rawTime: '10:06:55 AM', epoch: 1726481215, status: 504, latency: '3500ms' },
                    { rawTime: '10:09:10 AM', epoch: 1726481350, status: 200, latency: '58ms' }
                  ].map((evt, idx) => {
                    const bucket = selectedBucketSpan === '1m'
                      ? evt.rawTime.substring(0, 5) + ':00 AM'
                      : selectedBucketSpan === '5m'
                      ? (parseInt(evt.rawTime.substring(3, 5)) < 5 ? '10:00:00 AM' : '10:05:00 AM')
                      : '10:00:00 AM';

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: 'rgba(0,0,0,0.25)',
                          borderRadius: '6px',
                          borderLeft: `3px solid ${evt.status >= 500 ? '#f87171' : '#34d399'}`,
                          fontSize: '11px'
                        }}
                      >
                        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>{evt.rawTime}</span>
                        <span style={{ color: evt.status >= 500 ? '#f87171' : '#34d399', fontWeight: 700 }}>HTTP {evt.status}</span>
                        <span style={{ color: '#94a3b8' }}>{evt.latency}</span>
                        <span style={{ color: '#2dd4bf', fontWeight: 700, background: 'rgba(45,212,191,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          ➔ {bucket}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bucket Result Preview */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontWeight: 700, fontSize: '12px', color: '#fbbf24', marginBottom: '10px' }}>
                  Aggregated Output Table (<code>stats count by _time</code>)
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', textAlign: 'left' }}>
                        <th style={{ padding: '6px', color: '#2dd4bf' }}>_time ({selectedBucketSpan})</th>
                        <th style={{ padding: '6px', color: '#38bdf8' }}>count</th>
                        <th style={{ padding: '6px', color: '#f87171' }}>errors</th>
                        <th style={{ padding: '6px', color: '#fbbf24' }}>avg(latency)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBucketSpan === '5m' ? (
                        <>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '6px', color: 'var(--ifm-color-content)' }}>10:00:00 AM</td>
                            <td style={{ padding: '6px', color: '#38bdf8' }}>3</td>
                            <td style={{ padding: '6px', color: '#f87171' }}>1 (33%)</td>
                            <td style={{ padding: '6px', color: '#fbbf24' }}>439ms</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '6px', color: 'var(--ifm-color-content)' }}>10:05:00 AM</td>
                            <td style={{ padding: '6px', color: '#38bdf8' }}>2</td>
                            <td style={{ padding: '6px', color: '#f87171' }}>1 (50%)</td>
                            <td style={{ padding: '6px', color: '#fbbf24' }}>1779ms</td>
                          </tr>
                        </>
                      ) : selectedBucketSpan === '1m' ? (
                        <>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '6px', color: 'var(--ifm-color-content)' }}>10:01:00 AM</td>
                            <td style={{ padding: '6px', color: '#38bdf8' }}>1</td>
                            <td style={{ padding: '6px', color: '#34d399' }}>0</td>
                            <td style={{ padding: '6px', color: '#fbbf24' }}>42ms</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '6px', color: 'var(--ifm-color-content)' }}>10:02:00 AM</td>
                            <td style={{ padding: '6px', color: '#38bdf8' }}>1</td>
                            <td style={{ padding: '6px', color: '#f87171' }}>1</td>
                            <td style={{ padding: '6px', color: '#fbbf24' }}>1240ms</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '6px', color: 'var(--ifm-color-content)' }}>...</td>
                            <td style={{ padding: '6px', color: '#38bdf8' }}>3 more</td>
                            <td style={{ padding: '6px', color: '#f87171' }}>1</td>
                            <td style={{ padding: '6px', color: '#fbbf24' }}>-</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td style={{ padding: '6px', color: 'var(--ifm-color-content)' }}>10:00:00 AM</td>
                          <td style={{ padding: '6px', color: '#38bdf8' }}>5</td>
                          <td style={{ padding: '6px', color: '#f87171' }}>2 (40%)</td>
                          <td style={{ padding: '6px', color: '#fbbf24' }}>975ms</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(45, 212, 191, 0.08)', borderRadius: '6px', border: '1px solid rgba(45, 212, 191, 0.2)' }}>
                  <div style={{ fontSize: '10.5px', color: '#2dd4bf', fontWeight: 700 }}>Equivalent Query Pattern:</div>
                  <code style={{ fontSize: '10px', color: 'var(--ifm-color-content)', display: 'block', marginTop: '2px' }}>
                    index=app_logs | bin _time span={selectedBucketSpan} | stats count, sum(is_error) as errors, avg(duration) by _time
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EVAL & CASE() ENGINE */}
        {mode === 'evalengine' && (
          <div>
            <div className="interactive-diagram-helper-text" style={{ marginBottom: '12px' }}>
              The <code>eval</code> command creates new fields or recalculates existing fields using conditional statements, string operations, and math expressions.
            </div>

            {/* Sub-sample switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {[
                { id: 'status_case', label: '1. case() & if() Classification', color: '#fbbf24' },
                { id: 'latency', label: '2. SLA Duration & round() Math', color: '#38bdf8' },
                { id: 'coalesce_ip', label: '3. coalesce() Fallback Resolution', color: '#34d399' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedEvalSample(item.id as any)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${selectedEvalSample === item.id ? item.color : 'rgba(255,255,255,0.08)'}`,
                    background: selectedEvalSample === item.id ? `${item.color}20` : 'rgba(255,255,255,0.04)',
                    color: selectedEvalSample === item.id ? item.color : 'var(--ifm-color-content-secondary)',
                    fontWeight: selectedEvalSample === item.id ? 700 : 500,
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {selectedEvalSample === 'status_case' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                  <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700, marginBottom: '4px' }}>SPL Code:</div>
                  <pre style={{ margin: 0, background: 'transparent', fontSize: '11.5px', color: '#fef08a' }}>
{`| eval severity = case(
    status >= 500, "CRITICAL",
    status >= 400 AND status != 404, "WARNING",
    status == 404, "INFO_NOT_FOUND",
    status >= 200 AND status < 300, "HEALTHY",
    1=1, "UNKNOWN"
)`}
                  </pre>
                </div>

                <div className="splunk-grid-2col" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>Input Events</div>
                    <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>Event A: <code>status = 503</code></div>
                      <div style={{ padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>Event B: <code>status = 401</code></div>
                      <div style={{ padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>Event C: <code>status = 200</code></div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>Evaluated Output Fields</div>
                    <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ padding: '6px', background: 'rgba(248,113,113,0.12)', borderRadius: '4px', color: '#f87171', fontWeight: 700 }}>
                        Event A: <code>severity = "CRITICAL"</code>
                      </div>
                      <div style={{ padding: '6px', background: 'rgba(251,191,36,0.12)', borderRadius: '4px', color: '#fbbf24', fontWeight: 700 }}>
                        Event B: <code>severity = "WARNING"</code>
                      </div>
                      <div style={{ padding: '6px', background: 'rgba(52,211,153,0.12)', borderRadius: '4px', color: '#34d399', fontWeight: 700 }}>
                        Event C: <code>severity = "HEALTHY"</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedEvalSample === 'latency' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>SPL Code:</div>
                  <pre style={{ margin: 0, background: 'transparent', fontSize: '11.5px', color: '#bae6fd' }}>
{`| eval response_sec = round(response_time_ms / 1000, 3)
| eval sla_breached = if(response_sec > 1.5, "BREACH", "WITHIN_SLA")
| eval log_hour = strftime(_time, "%Y-%m-%d %H:00")`}
                  </pre>
                </div>
                <div style={{ padding: '10px', background: 'rgba(56,189,248,0.06)', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.15)', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                  💡 <strong>Tip:</strong> Always use <code>round(val, n)</code> on fractional floating-point calculations to prevent unbounded precision artifacts on Splunk dashboards.
                </div>
              </div>
            )}

            {selectedEvalSample === 'coalesce_ip' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                  <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700, marginBottom: '4px' }}>SPL Code:</div>
                  <pre style={{ margin: 0, background: 'transparent', fontSize: '11.5px', color: '#a7f3d0' }}>
{`| eval client_ip = coalesce(http_x_forwarded_for, clientip, remote_addr, "UNKNOWN_IP")
| eval is_internal = if(cidrmatch("10.0.0.0/8", client_ip) OR cidrmatch("192.168.0.0/16", client_ip), 1, 0)`}
                  </pre>
                </div>
                <div style={{ padding: '10px', background: 'rgba(52,211,153,0.06)', borderRadius: '8px', border: '1px solid rgba(52,211,153,0.15)', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                  🔍 <code>coalesce()</code> scans arguments from left to right and returns the first non-null value, perfect for microservices behind reverse proxies (Nginx / ALB / Cloudflare).
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STATS VS STREAMSTATS VS EVENTSTATS */}
        {mode === 'statscomparison' && (
          <div>
            <div className="interactive-diagram-helper-text" style={{ marginBottom: '12px' }}>
              Understanding the row-cardinality lifecycle between <code>stats</code>, <code>eventstats</code>, and <code>streamstats</code> is the hallmark of a senior Splunk developer.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }} className="splunk-grid-2col">
              {/* stats */}
              <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>1. stats (Collapse)</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px' }}>
                  <strong>N Rows ➔ 1 Row per Group</strong>
                </div>
                <div style={{ padding: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontSize: '10.5px', marginBottom: '8px' }}>
                  <code>| stats count, avg(resp) by host</code>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.4 }}>
                  Discards raw events and replaces them with consolidated grouped metrics. Highly memory-efficient.
                </p>
              </div>

              {/* eventstats */}
              <div style={{ background: 'rgba(251, 191, 36, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
                <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>2. eventstats (Broadcast)</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px' }}>
                  <strong>N Rows ➔ N Rows (Preserved)</strong>
                </div>
                <div style={{ padding: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontSize: '10.5px', marginBottom: '8px' }}>
                  <code>| eventstats avg(resp) as avg_resp</code>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.4 }}>
                  Calculates a global summary metric and appends it to <em>every individual row</em>. Used for outlier detection (<code>where resp &gt; 2*avg_resp</code>).
                </p>
              </div>

              {/* streamstats */}
              <div style={{ background: 'rgba(167, 139, 250, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(167, 139, 250, 0.25)' }}>
                <div style={{ color: '#a78bfa', fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>3. streamstats (Running)</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px' }}>
                  <strong>Sequential Windowing</strong>
                </div>
                <div style={{ padding: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontSize: '10.5px', marginBottom: '8px' }}>
                  <code>| streamstats count current=f window=5</code>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.4 }}>
                  Calculates cumulative running sums, sliding moving averages, or deltas between consecutive events row by row.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
