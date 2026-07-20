import React, { useState } from 'react';

export default function BulkheadTypesDiagram() {
  const [activeTab, setActiveTab] = useState<'threadpool' | 'semaphore' | 'matrix'>('threadpool');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
        <span>Bulkhead Types — Thread Pool vs. Semaphore</span>

        {/* Tab Selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setActiveTab('threadpool')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'threadpool' ? '#38bdf818' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'threadpool' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'threadpool' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Thread Pool
          </button>
          <button onClick={() => setActiveTab('semaphore')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'semaphore' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'semaphore' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'semaphore' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Semaphore
          </button>
          <button onClick={() => setActiveTab('matrix')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'matrix' ? '#a78bfa18' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'matrix' ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'matrix' ? '0 0 0 1.5px #a78bfa50' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Decision Matrix
          </button>
        </div>
      </div>

      {activeTab === 'threadpool' && (
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="type-grid">
          <style dangerouslySetInnerHTML={{__html: `
            @media (max-width: 768px) {
              .type-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}} />

          {/* SVG Thread Pool Flow */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
            <svg viewBox="0 0 500 240" className="interactive-diagram">
              <defs>
                <marker id="arr-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
                </marker>
              </defs>

              {/* Tomcat Thread */}
              <rect x="20" y="90" width="100" height="45" rx="6" fill="#38bdf818" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="70" y="112" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">Caller Thread</text>
              <text x="70" y="126" textAnchor="middle" fill="#38bdf8" fontSize="8.5">(Tomcat Request)</text>

              {/* Queue */}
              <rect x="180" y="90" width="80" height="45" rx="6" fill="#a78bfa18" stroke="#a78bfa" strokeWidth="1.5" />
              <text x="220" y="112" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="bold">Pool Queue</text>
              <text x="220" y="126" textAnchor="middle" fill="#94a3b8" fontSize="8.5">(Cap: 20)</text>

              {/* Pool Thread */}
              <rect x="330" y="90" width="130" height="45" rx="6" fill="#34d39918" stroke="#34d399" strokeWidth="1.5" />
              <text x="395" y="112" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold">Dedicated Worker</text>
              <text x="395" y="126" textAnchor="middle" fill="#34d399" fontSize="8.5">(Executes HTTP Call)</text>

              {/* Paths */}
              <path d="M 120 112 L 172 112" fill="none" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arr-blue)" />
              <path d="M 260 112 L 322 112" fill="none" stroke="#a78bfa" strokeWidth="1.5" markerEnd="url(#arr-blue)" />

              {/* Return Future Arrow */}
              <path d="M 170 140 L 70 140" fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="120" y="156" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold">Returns CompletableFuture immediately</text>
            </svg>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderColor: '#38bdf840' }}>
            <div className="interactive-diagram-card-header">
              <h3 style={{ color: '#38bdf8' }}>Thread Pool Bulkhead</h3>
            </div>
            <p style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
              Submits task to a dedicated <code>ThreadPoolExecutor</code>. The calling thread is freed immediately after submission!
            </p>
            <div style={{ fontSize: '11.5px', marginTop: '10px' }}>
              <div style={{ color: '#34d399', marginBottom: '4px' }}>✅ <strong>Calling Thread Freed:</strong> Zero caller thread blocking.</div>
              <div style={{ color: '#fbbf24', marginBottom: '4px' }}>⚡ <strong>Ideal For:</strong> Synchronous blocking I/O (RestTemplate, JDBC).</div>
              <div style={{ color: '#f87171' }}>⚠️ <strong>Overhead:</strong> Thread stack memory (~1MB/thread) + context switches.</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'semaphore' && (
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="type-grid">
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
            <svg viewBox="0 0 500 240" className="interactive-diagram">
              {/* Caller Thread */}
              <rect x="40" y="90" width="130" height="50" rx="6" fill="#34d39918" stroke="#34d399" strokeWidth="1.5" />
              <text x="105" y="113" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold">Caller Thread</text>
              <text x="105" y="128" textAnchor="middle" fill="#94a3b8" fontSize="8.5">(Acquires Permit & Executes)</text>

              {/* Atomic Counter */}
              <rect x="250" y="90" width="200" height="50" rx="6" fill="#fbbf2418" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="350" y="113" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold">Atomic Semaphore Permits</text>
              <text x="350" y="128" textAnchor="middle" fill="#fbbf24" fontSize="9">Max Concurrent Calls: 20</text>

              <line x1="170" y1="115" x2="240" y2="115" stroke="#34d399" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39940' }}>
            <div className="interactive-diagram-card-header">
              <h3 style={{ color: '#34d399' }}>Semaphore Bulkhead</h3>
            </div>
            <p style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
              Limits concurrent execution count using an atomic counter on the calling thread. Zero thread pool allocation!
            </p>
            <div style={{ fontSize: '11.5px', marginTop: '10px' }}>
              <div style={{ color: '#34d399', marginBottom: '4px' }}>✅ <strong>Zero Thread Overhead:</strong> Extremely low memory & CPU cost.</div>
              <div style={{ color: '#fbbf24', marginBottom: '4px' }}>⚡ <strong>Ideal For:</strong> Non-blocking reactive code (WebFlux, R2DBC).</div>
              <div style={{ color: '#f87171' }}>⚠️ <strong>No Thread Isolation:</strong> Caller thread STILL BLOCKS if call is synchronous I/O!</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matrix' && (
        <div className="interactive-diagram-details-card" style={{ borderColor: '#a78bfa40' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: '#a78bfa' }}>Isolation Selection Matrix</h3>
          </div>
          <table style={{ width: '100%', fontSize: '11.5px', borderCollapse: 'collapse', color: '#cbd5e1' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Feature</th>
                <th style={{ padding: '8px', color: '#38bdf8' }}>Thread Pool Bulkhead</th>
                <th style={{ padding: '8px', color: '#34d399' }}>Semaphore Bulkhead</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Caller Thread Isolation</td>
                <td style={{ padding: '8px', color: '#34d399' }}>✅ Full (Freed immediately)</td>
                <td style={{ padding: '8px', color: '#f87171' }}>❌ None (Caller executes)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Execution Model</td>
                <td style={{ padding: '8px' }}>Blocking I/O (RestTemplate, JDBC)</td>
                <td style={{ padding: '8px' }}>Reactive / Non-blocking (WebFlux)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Memory Cost</td>
                <td style={{ padding: '8px', color: '#f87171' }}>High (~1MB per thread stack)</td>
                <td style={{ padding: '8px', color: '#34d399' }}>Minimal (Atomic counter)</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Return Type</td>
                <td style={{ padding: '8px' }}><code>CompletableFuture&lt;T&gt;</code></td>
                <td style={{ padding: '8px' }}>Direct Type / Mono / Flux</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
