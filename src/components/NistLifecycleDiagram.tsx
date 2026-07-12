import React, { useState } from 'react';

type Phase = 'prep' | 'detect' | 'contain' | 'eradicate' | 'recover' | 'lessons';

export default function NistLifecycleDiagram(): React.JSX.Element {
  const [activePhase, setActivePhase] = useState<Phase>('prep');

  const phases = {
    prep: {
      title: '1. Preparation',
      desc: 'Build capabilities, define severity SLAs, set up communication tools, and train team members BEFORE an incident occurs. This establishes the incident response plan structure.',
      checklist: ['Establish IR team and roles', 'Define incident severity levels', 'Set up emergency communications', 'Implement secrets scanning in pipelines']
    },
    detect: {
      title: '2. Detection & Analysis',
      desc: 'Identify that an event has occurred and evaluate if it represents a threat. Analyze security alerts, anomalous logs, and system dashboards.',
      checklist: ['Monitor SIEM dashboards', 'Alert validation', 'Determine blast radius & scope', 'Triage severity metrics']
    },
    contain: {
      title: '3. Containment',
      desc: 'Stop the threat from spreading and causing further damage. This is a critical step to limit impact while planning permanent fixes.',
      checklist: ['Isolate compromised instances', 'Rotate leaked API keys / credentials', 'Disable compromised user accounts', 'Apply temporary firewall blocks']
    },
    eradicate: {
      title: '4. Eradication',
      desc: 'Permanently remove the threat from the environment. Clean infected nodes, rebuild compromised servers, and plug security gaps.',
      checklist: ['Remove malware & malicious scripts', 'Patch software vulnerabilities', 'Rebuild systems from secure base images', 'Delete residual backdoor entries']
    },
    recover: {
      title: '5. Recovery',
      desc: 'Restore affected systems back to normal operations. Validate that systems are clean and monitor them closely for any signs of secondary attacks.',
      checklist: ['Restore databases from clean backups', 'Verify application integrity tests', 'Enable normal user ingress', 'Implement enhanced logging/alerts']
    },
    lessons: {
      title: '6. Post-Incident Activity',
      desc: 'Conduct a post-mortem review. Analyze what went well, what delayed response, and define corrective actions to prevent recurrence.',
      checklist: ['Conduct Post-Incident Review meeting', 'Document root cause and contributing factors', 'Define action items with clear owners', 'Update playbooks and response rules']
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🔄 NIST Incident Response Lifecycle Phases
        </h3>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {Object.keys(phases).map((p) => (
            <button
              key={p}
              onClick={() => setActivePhase(p as Phase)}
              style={{
                background: activePhase === p ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activePhase === p ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 4,
                color: activePhase === p ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                padding: '4px 8px',
                fontSize: '0.74rem',
                fontWeight: 600
              }}
            >
              {phases[p as Phase].title.split('.')[0]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.2rem' }}>
          {/* Phase Details */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1.2rem' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#38bdf8' }}>
              {phases[activePhase].title}
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.45 }}>
              {phases[activePhase].desc}
            </p>
          </div>

          {/* Checklist */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1.2rem' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>Key Responsibilities</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {phases[activePhase].checklist.map((item, i) => (
                <div key={i} style={{ padding: '6px 10px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontSize: '0.72rem', color: '#e2e8f0', fontFamily: 'monospace' }}>
                  ✓ {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
