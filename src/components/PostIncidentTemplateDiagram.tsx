import React, { useState } from 'react';

type Tab = 'overview' | 'timeline' | 'actions';

export default function PostIncidentTemplateDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});

  const timeline = [
    { time: '14:00', event: 'Alert: Anomalous S3 access patterns detected.' },
    { time: '14:15', event: 'On-call engineer acknowledges the paging alert.' },
    { time: '14:45', event: 'Identified blast radius: 50,000 user email records accessed.' },
    { time: '15:30', event: 'Action: Compromised long-lived AWS Access Key deleted/rotated.' },
    { time: '18:23', event: 'All-clear declared: S3 logs verify zero subsequent leaks.' }
  ];

  const actions = [
    { task: 'Add Gitleaks scanning to CI pipelines', owner: 'DevOps', due: '+7 Days' },
    { task: 'Audit and delete legacy IAM access keys', owner: 'Security', due: '+7 Days' },
    { task: 'Configure CloudTrail anomaly notifications for S3', owner: 'Security', due: '+14 Days' }
  ];

  const toggleAction = (idx: number) => {
    setCheckedActions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          📋 Post-Incident Review Dashboard (INC-2024-001)
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActiveTab('overview')} style={{ background: activeTab === 'overview' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeTab === 'overview' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeTab === 'overview' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Overview</button>
          <button onClick={() => setActiveTab('timeline')} style={{ background: activeTab === 'timeline' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeTab === 'timeline' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeTab === 'timeline' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Timeline</button>
          <button onClick={() => setActiveTab('actions')} style={{ background: activeTab === 'actions' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeTab === 'actions' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeTab === 'actions' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Action Items</button>
        </div>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#f87171' }}>Metrics</h4>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>🔴 <strong>Severity:</strong> P1 Critical</div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>⏱️ <strong>Duration:</strong> 4 Hours 23 Minutes</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#fb923c' }}>Root Cause</h4>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Long-lived AWS administrator access key was accidentally committed to a public GitHub repository (exposed for 6 months).
              </p>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {timeline.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: 4 }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: '#38bdf8', fontWeight: 800 }}>{item.time}</span>
                <span style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>{item.event}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'actions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actions.map((item, idx) => (
              <div
                key={idx}
                onClick={() => toggleAction(idx)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: checkedActions[idx] ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${checkedActions[idx] ? '#4ade80' : 'rgba(255,255,255,0.04)'}`,
                  padding: '10px 14px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={!!checkedActions[idx]}
                    readOnly
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.76rem', color: checkedActions[idx] ? '#94a3b8' : '#e2e8f0', textDecoration: checkedActions[idx] ? 'line-through' : 'none' }}>
                    {item.task}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                  Owner: <strong>{item.owner}</strong> | Due: {item.due}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
