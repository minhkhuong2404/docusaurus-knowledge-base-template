import React, { useState } from 'react';

export default function NginxArchitectureDiagram() {
  const [activeTab, setActiveTab] = useState<'comparison' | 'reload' | 'upgrade'>('comparison');
  const [reloadStep, setReloadStep] = useState<number>(1);

  const reloadSteps = [
    { step: 1, title: 'Step 1: SIGHUP Signal Received', desc: 'Master process receives `nginx -s reload` (SIGHUP) signal and re-parses nginx.conf syntax.', color: '#38bdf8' },
    { step: 2, title: 'Step 2: Fork New Workers', desc: 'Master forks NEW worker processes using updated configuration. New workers inherit port 80/443 sockets.', color: '#34d399' },
    { step: 3, title: 'Step 3: Graceful Drain & Exit', desc: 'Old workers stop accepting new connections and drain active requests. Once finished, old workers exit. Zero dropped connections!', color: '#a78bfa' }
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="4"/>
          <line x1="10" y1="2" x2="10" y2="22"/>
        </svg>
        <span>Master-Worker Architecture & Zero-Downtime Reload</span>

        {/* Tab selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setActiveTab('comparison')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'comparison' ? '#38bdf818' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'comparison' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'comparison' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            C10K Comparison
          </button>

          <button onClick={() => setActiveTab('reload')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'reload' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'reload' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'reload' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Config Reload (SIGHUP)
          </button>

          <button onClick={() => setActiveTab('upgrade')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'upgrade' ? '#a78bfa18' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'upgrade' ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'upgrade' ? '0 0 0 1.5px #a78bfa50' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Binary Upgrade (SIGUSR2)
          </button>
        </div>
      </div>

      {activeTab === 'comparison' && (
        <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px' }} className="nginx-grid">
          <style dangerouslySetInnerHTML={{__html: `
            @media (max-width: 768px) {
              .nginx-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}} />

          {/* Apache Thread per Conn */}
          <div className="interactive-diagram-details-card" style={{ borderColor: '#f8717140' }}>
            <h4 style={{ color: '#f87171', margin: '0 0 6px 0', fontSize: '13px' }}>Traditional Thread-per-Conn (Apache)</h4>
            <p style={{ fontSize: '11.5px', color: '#e2e8f0', margin: 0 }}>
              10,000 connections = 10,000 OS threads. Takes <strong>~80GB RAM</strong> (8MB stack/thread). CPU wasted on thousands of context switches.
            </p>
          </div>

          {/* Nginx Event-Driven */}
          <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39940' }}>
            <h4 style={{ color: '#34d399', margin: '0 0 6px 0', fontSize: '13px' }}>Nginx Event-Driven Model</h4>
            <p style={{ fontSize: '11.5px', color: '#e2e8f0', margin: 0 }}>
              10,000 connections = 4 Worker Processes (1 per CPU core). Takes <strong>~19MB RAM</strong> total (~256B/connection). Zero idle context switching!
            </p>
          </div>
        </div>
      )}

      {activeTab === 'reload' && (
        <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', gap: '14px', alignItems: 'start' }} className="nginx-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {reloadSteps.map(s => {
              const isSelected = reloadStep === s.step;
              return (
                <button key={s.step} onClick={() => setReloadStep(s.step)} style={{
                  padding: '9px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: isSelected ? `${s.color}15` : 'rgba(255,255,255,0.03)',
                  boxShadow: isSelected ? `0 0 0 1.5px ${s.color}50` : '0 0 0 1px rgba(255,255,255,0.06)'
                }}>
                  <strong style={{ fontSize: '12px', color: isSelected ? s.color : '#e2e8f0' }}>{s.title}</strong>
                </button>
              );
            })}
          </div>

          <div className="interactive-diagram-details-card" style={{ borderColor: `${reloadSteps[reloadStep - 1].color}40` }}>
            <h3 style={{ color: reloadSteps[reloadStep - 1].color, margin: '0 0 6px 0', fontSize: '14px' }}>
              {reloadSteps[reloadStep - 1].title}
            </h3>
            <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: 0 }}>
              {reloadSteps[reloadStep - 1].desc}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'upgrade' && (
        <div className="interactive-diagram-details-card" style={{ borderColor: '#a78bfa40' }}>
          <h3 style={{ color: '#a78bfa', margin: '0 0 6px 0', fontSize: '14px' }}>Zero-Downtime Executable Upgrade</h3>
          <p style={{ fontSize: '12.5px', color: '#e2e8f0', marginTop: '6px' }}>
            1. Send <code>kill -SIGUSR2 &lt;old_master_pid&gt;</code> → Spawns NEW Master with new binary.<br/>
            2. Both Masters run side-by-side sharing listening sockets.<br/>
            3. Send <code>SIGWINCH</code> to old master → Shuts down old workers gracefully.<br/>
            4. Send <code>SIGQUIT</code> to old master after connections drain completely.
          </p>
        </div>
      )}
    </div>
  );
}
