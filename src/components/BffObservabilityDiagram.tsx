import React, { useState } from 'react';

export default function BffObservabilityDiagram() {
  const [selectedMetric, setSelectedMetric] = useState<'latency' | 'degraded' | 'error' | 'cache'>('latency');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>BFF Telemetry &amp; Prometheus Alerting Dashboard</span>
      </div>

      {/* Metric Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { id: 'latency', label: 'Dashboard Latency (p99 SLA > 3s)', color: '#38bdf8' },
          { id: 'degraded', label: 'Degraded Response Rate (> 5%)', color: '#fbbf24' },
          { id: 'error', label: 'Downstream Call Error Spike', color: '#f87171' },
          { id: 'cache', label: 'Cache Hit Rate (< 50%)', color: '#34d399' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedMetric(m.id as any)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 700,
              background: selectedMetric === m.id ? `${m.color}20` : 'rgba(255,255,255,0.04)',
              color: selectedMetric === m.id ? m.color : 'var(--ifm-color-content-secondary)',
              boxShadow: selectedMetric === m.id ? `0 0 0 1.5px ${m.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        {selectedMetric === 'latency' && (
          <pre style={{ margin: 0, padding: '12px', background: 'rgba(0,0,0,0.4)', color: '#38bdf8', fontSize: '11px', fontFamily: 'monospace', borderRadius: '8px' }}>
            {`alert: BffDashboardLatencyHigh
expr: histogram_quantile(0.99, rate(bff_dashboard_latency_seconds_bucket[5m])) > 3
for: 2m
labels: { severity: warning }
annotations: { summary: "Web BFF p99 latency > 3s SLA threshold" }`}
          </pre>
        )}
        {selectedMetric === 'degraded' && (
          <pre style={{ margin: 0, padding: '12px', background: 'rgba(0,0,0,0.4)', color: '#fbbf24', fontSize: '11px', fontFamily: 'monospace', borderRadius: '8px' }}>
            {`alert: BffDegradedResponseRateHigh
expr: rate(bff_dashboard_degraded_total[5m]) / rate(bff_dashboard_total[5m]) > 0.05
for: 5m
labels: { severity: warning }
annotations: { summary: ">5% of dashboard responses rendered degraded without analytics" }`}
          </pre>
        )}
        {selectedMetric === 'error' && (
          <pre style={{ margin: 0, padding: '12px', background: 'rgba(0,0,0,0.4)', color: '#f87171', fontSize: '11px', fontFamily: 'monospace', borderRadius: '8px' }}>
            {`alert: BffDownstreamErrorRateHigh
expr: rate(bff_downstream_latency_total{status!="success"}[5m]) > 10
for: 2m
labels: { severity: critical }
annotations: { summary: "BFF downstream call error rate spike on service {{ $labels.service }}" }`}
          </pre>
        )}
        {selectedMetric === 'cache' && (
          <pre style={{ margin: 0, padding: '12px', background: 'rgba(0,0,0,0.4)', color: '#34d399', fontSize: '11px', fontFamily: 'monospace', borderRadius: '8px' }}>
            {`alert: BffCacheHitRateLow
expr: rate(bff_dashboard_cache_total{result="hit"}[10m]) / rate(bff_dashboard_cache_total[10m]) < 0.5
for: 5m
labels: { severity: info }
annotations: { summary: "BFF dashboard cache hit rate below 50% threshold" }`}
          </pre>
        )}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        <strong>Golden Signal Telemetry:</strong> Automatically track per-downstream-service call latency using Spring AOP aspects and Micrometer timers. Trigger Prometheus alerts if overall dashboard composition latency exceeds the 3s SLA or degraded response ratios spike.
      </div>
    </div>
  );
}
