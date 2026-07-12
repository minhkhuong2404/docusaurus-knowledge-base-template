import React, { useState } from 'react';

type Stage = 'code' | 'build' | 'test' | 'gate' | 'deploy' | 'monitor';

export default function DevSecOpsPipelineDiagram(): React.JSX.Element {
  const [activeStage, setActiveStage] = useState<Stage>('code');

  const stages = {
    code: {
      title: '1. Code (IDE & Pre-commit)',
      subtitle: 'Developer Workspace Checks',
      desc: 'Security starts at the developer\'s machine. Pre-commit hooks automatically check for committed secrets, credentials, and API keys before the code ever leaves the local machine.',
      tools: ['Git Hooks (Talisman / detect-secrets)', 'IDE Linters', 'Peer Code Reviews']
    },
    build: {
      title: '2. Build (CI Pipeline)',
      subtitle: 'Artifact Compilation & Dependencies Scan',
      desc: 'During the build phase, Software Composition Analysis (SCA) scanners inspect third-party library dependencies for known CVEs. Vulnerable library bundles trigger automatic build failures.',
      tools: ['Snyk / OWASP Dependency-Check', 'Trivy (Container Image Scanning)', 'Maven / Gradle build validation']
    },
    test: {
      title: '3. Test (CI Automated Testing)',
      subtitle: 'Logic Validation & Integration Tests',
      desc: 'Runs the automated unit and integration tests. Checks that input validations and authentication filters behave exactly as expected.',
      tools: ['JUnit / Mockito', 'Integration Tests', 'Code Coverage checks (JaCoCo)']
    },
    gate: {
      title: '4. Security Gate (Static Scan & Policy Check)',
      subtitle: 'SAST & Quality Gate Enforcement',
      desc: 'Static Application Security Testing (SAST) inspects the source code tree for security issues like SQL Injection vectors, unvalidated inputs, or weak cryptographic algorithms without executing the app.',
      tools: ['SonarQube (SAST)', 'Semgrep / Checkmarx', 'Checkov (IaC scanning for Terraform/Kubernetes configs)']
    },
    deploy: {
      title: '5. Deploy (Continuous Delivery)',
      subtitle: 'Secure Deployment & Verification',
      desc: 'Deploys signed container artifacts to staging/production subnets. Verifies configuration properties and environment boundaries.',
      tools: ['ArgoCD / Jenkins', 'Kubernetes NetworkPolicies', 'AWS IAM permissions validator']
    },
    monitor: {
      title: '6. Monitor (Runtime Monitoring)',
      subtitle: 'DAST & Real-time Threat Hunting',
      desc: 'Performs Dynamic Application Security Testing (DAST) by executing automated penetrative checks on the live, running container environment. Continuously monitors logs and runtime events.',
      tools: ['OWASP ZAP (DAST)', 'Datadog / Prometheus (Logs & Alerts)', 'SIEM (Splunk / Elastic Security)']
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🔄 The Interactive DevSecOps Pipeline
        </h3>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {Object.keys(stages).map((s) => (
            <button
              key={s}
              onClick={() => setActiveStage(s as Stage)}
              style={{
                background: activeStage === s ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeStage === s ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 4,
                color: activeStage === s ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                padding: '4px 8px',
                fontSize: '0.74rem',
                fontWeight: 600
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.2rem' }}>
          {/* Stage information */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1.2rem' }}>
            <h4 style={{ margin: '0 0 2px 0', fontSize: '0.9rem', color: '#38bdf8' }}>
              {stages[activeStage].title}
            </h4>
            <span style={{ fontSize: '0.72rem', color: '#a78bfa', display: 'block', marginBottom: '10px', fontWeight: 700 }}>
              {stages[activeStage].subtitle}
            </span>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.45 }}>
              {stages[activeStage].desc}
            </p>
          </div>

          {/* Tools Checklists */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1.2rem' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>Automation Tools & Actions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stages[activeStage].tools.map((tool, i) => (
                <div key={i} style={{ padding: '6px 10px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontSize: '0.72rem', color: '#e2e8f0', fontFamily: 'monospace' }}>
                  ⚙️ {tool}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
