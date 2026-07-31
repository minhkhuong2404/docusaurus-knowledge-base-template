import React, { useState } from 'react';

export default function NetworkPerformanceOptimizationDiagram(): React.JSX.Element {
  const [rttMs, setRttMs] = useState<number>(100);
  const [bandwidthGbps, setBandwidthGbps] = useState<number>(1);

  // BDP = Bandwidth * RTT
  // 1 Gbps * 0.1s = 100 Mbit = 12.5 MB
  const bdpMB = (bandwidthGbps * 1000 * (rttMs / 1000) / 8).toFixed(2);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Bandwidth-Delay Product (BDP) &amp; TCP Buffer Size Calculator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ gridTemplateColumns: '1fr 1fr', display: 'grid', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Round-Trip Time (RTT): {rttMs} ms</label>
            <input type="range" min="10" max="300" step="10" value={rttMs} onChange={(e) => setRttMs(parseInt(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Link Bandwidth: {bandwidthGbps} Gbps</label>
            <input type="range" min="0.1" max="10" step="0.5" value={bandwidthGbps} onChange={(e) => setBandwidthGbps(parseFloat(e.target.value))} style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
            Calculated BDP (In-Flight Data Required to Fill Pipe):
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399' }}>
            {bdpMB} MB Window Size
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            Without TCP Window Scaling (`wscale`), TCP is capped at 64 KB, wasting over 99% of your link bandwidth on high-latency links!
          </p>
        </div>
      </div>
    </div>
  );
}
