import React, { useState } from 'react';

type PipelineScenario = 'success' | 'test_failure' | 'cve_block';
type ActiveTab = 'simulator' | 'yaml_inspector' | 'car_wash_analogy';

interface PipelineStage {
  id: string;
  name: string;
  shortName: string;
  stepNum: number;
  description: string;
  command: string;
  color: string;
  status: 'passed' | 'failed' | 'blocked' | 'running' | 'waiting';
  details: string;
}

export default function CiCdPipelineDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');
  const [scenario, setScenario] = useState<PipelineScenario>('success');
  const [selectedStageId, setSelectedStageId] = useState<string>('stage-2');

  const getStageStatus = (stageNum: number): 'passed' | 'failed' | 'blocked' | 'waiting' => {
    if (scenario === 'success') return 'passed';
    if (scenario === 'test_failure') {
      if (stageNum === 1) return 'passed';
      if (stageNum === 2) return 'failed';
      return 'blocked';
    }
    if (scenario === 'cve_block') {
      if (stageNum <= 2) return 'passed';
      if (stageNum === 3) return 'failed';
      return 'blocked';
    }
    return 'passed';
  };

  const stages: PipelineStage[] = [
    {
      id: 'stage-1',
      stepNum: 1,
      name: '1. Trigger & Checkout',
      shortName: 'Git Trigger',
      description: 'GitHub Actions intercepts push/PR event, spins up runner VM, checks out commit.',
      command: 'actions/checkout@v4',
      color: '#38bdf8',
      status: getStageStatus(1),
      details: 'Spins up an isolated Ubuntu runner, clones repository with fetch-depth, sets up credentials.'
    },
    {
      id: 'stage-2',
      stepNum: 2,
      name: '2. Lint, Compile & Test',
      shortName: 'CI Test Suite',
      description: 'Lints code, runs unit & integration test suites, asserts 100% pass rate.',
      command: 'npm test / mvn clean verify',
      color: '#34d399',
      status: getStageStatus(2),
      details: 'Fails fast if any unit test fails or coverage drops below threshold. Generates test reports.'
    },
    {
      id: 'stage-3',
      stepNum: 3,
      name: '3. Docker Build & Scan',
      shortName: 'Image Build',
      description: 'Packages OCI container image, runs Trivy vulnerability scan, signs image.',
      command: 'docker build & trivy image',
      color: '#fbbf24',
      status: getStageStatus(3),
      details: 'Constructs multi-stage Docker image, checks CVE database, tags with immutable commit SHA.'
    },
    {
      id: 'stage-4',
      stepNum: 4,
      name: '4. Staging Deploy',
      shortName: 'Staging CD',
      description: 'Continuous Delivery: deploys artifact to staging environment and runs e2e smoke tests.',
      command: 'kubectl apply / argocd sync',
      color: '#a78bfa',
      status: getStageStatus(4),
      details: 'Automated deployment to ephemeral or staging namespace. Validates health probes.'
    },
    {
      id: 'stage-5',
      stepNum: 5,
      name: '5. Production Release',
      shortName: 'Prod Rollout',
      description: 'Continuous Deployment: Blue-Green rollout to production with instant canary metrics.',
      command: 'helm upgrade --install prod',
      color: '#2dd4bf',
      status: getStageStatus(5),
      details: 'Zero-downtime rolling update. Prometheus monitors error rates for auto-rollback.'
    }
  ];

  const currentStage = stages.find(s => s.id === selectedStageId) || stages[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          CI/CD Pipeline Architecture & GitHub Actions Visualizer
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('simulator')}
            style={{
              background: activeTab === 'simulator' ? '#38bdf822' : 'transparent',
              border: `1px solid ${activeTab === 'simulator' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '6px',
              padding: '3px 10px',
              color: activeTab === 'simulator' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Pipeline Flow
          </button>
          <button
            onClick={() => setActiveTab('yaml_inspector')}
            style={{
              background: activeTab === 'yaml_inspector' ? '#34d39922' : 'transparent',
              border: `1px solid ${activeTab === 'yaml_inspector' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '6px',
              padding: '3px 10px',
              color: activeTab === 'yaml_inspector' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            YAML Spec
          </button>
          <button
            onClick={() => setActiveTab('car_wash_analogy')}
            style={{
              background: activeTab === 'car_wash_analogy' ? '#fbbf2422' : 'transparent',
              border: `1px solid ${activeTab === 'car_wash_analogy' ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '6px',
              padding: '3px 10px',
              color: activeTab === 'car_wash_analogy' ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Car Wash Analogy
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {activeTab === 'simulator' && (
          <div>
            {/* Scenario Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>
                Simulate Scenario:
              </span>
              <button
                onClick={() => setScenario('success')}
                style={{
                  background: scenario === 'success' ? '#34d39922' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${scenario === 'success' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '6px',
                  padding: '4px 10px',
                  color: scenario === 'success' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: scenario === 'success' ? 700 : 500
                }}
              >
                ✅ Happy Path (Full Deploy)
              </button>
              <button
                onClick={() => setScenario('test_failure')}
                style={{
                  background: scenario === 'test_failure' ? '#f8717122' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${scenario === 'test_failure' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '6px',
                  padding: '4px 10px',
                  color: scenario === 'test_failure' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: scenario === 'test_failure' ? 700 : 500
                }}
              >
                ❌ Test Breakage (Fail Fast)
              </button>
              <button
                onClick={() => setScenario('cve_block')}
                style={{
                  background: scenario === 'cve_block' ? '#fbbf2422' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${scenario === 'cve_block' ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '6px',
                  padding: '4px 10px',
                  color: scenario === 'cve_block' ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: scenario === 'cve_block' ? 700 : 500
                }}
              >
                🛡️ Security CVE Block
              </button>
            </div>

            {/* SVG Pipeline Canvas */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
              <svg viewBox="0 0 820 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="arrow-pipe-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
                  </marker>
                  <marker id="arrow-pipe-red" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#f87171" />
                  </marker>
                  <marker id="arrow-pipe-gray" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#64748b" />
                  </marker>
                </defs>

                {/* Stage 1 */}
                <g 
                  onClick={() => setSelectedStageId('stage-1')} 
                  style={{ cursor: 'pointer' }}
                  transform="translate(15, 30)"
                >
                  <rect 
                    x="0" y="0" width="130" height="90" rx="8" 
                    fill={selectedStageId === 'stage-1' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.8)'}
                    stroke={stages[0].status === 'passed' ? '#38bdf8' : '#f87171'}
                    strokeWidth={selectedStageId === 'stage-1' ? '2.5' : '1.5'}
                  />
                  <circle cx="20" cy="22" r="10" fill="#38bdf8" />
                  <text x="17" y="26" fill="#000" fontSize="11" fontWeight="800">1</text>
                  <text x="36" y="25" fill="#38bdf8" fontSize="11" fontWeight="700">Trigger</text>
                  <text x="12" y="52" fill="#e2e8f0" fontSize="10">git push / PR</text>
                  <text x="12" y="72" fill="#94a3b8" fontSize="9">Runner checkout</text>
                  <circle cx="115" cy="22" r="5" fill="#34d399" />
                </g>

                {/* Arrow 1 to 2 */}
                <path 
                  d="M 148 75 L 178 75" 
                  fill="none" 
                  stroke={stages[0].status === 'passed' ? '#34d399' : '#f87171'} 
                  strokeWidth="2" 
                  markerEnd={stages[0].status === 'passed' ? 'url(#arrow-pipe-green)' : 'url(#arrow-pipe-red)'}
                  className={stages[0].status === 'passed' ? 'interactive-diagram-flowing-path' : ''}
                />

                {/* Stage 2 */}
                <g 
                  onClick={() => setSelectedStageId('stage-2')} 
                  style={{ cursor: 'pointer' }}
                  transform="translate(180, 30)"
                >
                  <rect 
                    x="0" y="0" width="130" height="90" rx="8" 
                    fill={selectedStageId === 'stage-2' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(15, 23, 42, 0.8)'}
                    stroke={stages[1].status === 'passed' ? '#34d399' : stages[1].status === 'failed' ? '#f87171' : '#64748b'}
                    strokeWidth={selectedStageId === 'stage-2' ? '2.5' : '1.5'}
                  />
                  <circle cx="20" cy="22" r="10" fill="#34d399" />
                  <text x="17" y="26" fill="#000" fontSize="11" fontWeight="800">2</text>
                  <text x="36" y="25" fill="#34d399" fontSize="11" fontWeight="700">CI Tests</text>
                  <text x="12" y="52" fill="#e2e8f0" fontSize="10">Lint + Unit Tests</text>
                  <text x="12" y="72" fill="#94a3b8" fontSize="9">Coverage report</text>
                  <circle cx="115" cy="22" r="5" fill={stages[1].status === 'passed' ? '#34d399' : '#f87171'} />
                </g>

                {/* Arrow 2 to 3 */}
                <path 
                  d="M 313 75 L 343 75" 
                  fill="none" 
                  stroke={stages[1].status === 'passed' ? '#34d399' : '#f87171'} 
                  strokeWidth="2" 
                  markerEnd={stages[1].status === 'passed' ? 'url(#arrow-pipe-green)' : 'url(#arrow-pipe-red)'}
                  className={stages[1].status === 'passed' ? 'interactive-diagram-flowing-path' : ''}
                />

                {/* Stage 3 */}
                <g 
                  onClick={() => setSelectedStageId('stage-3')} 
                  style={{ cursor: 'pointer' }}
                  transform="translate(345, 30)"
                >
                  <rect 
                    x="0" y="0" width="130" height="90" rx="8" 
                    fill={selectedStageId === 'stage-3' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(15, 23, 42, 0.8)'}
                    stroke={stages[2].status === 'passed' ? '#fbbf24' : stages[2].status === 'failed' ? '#f87171' : '#64748b'}
                    strokeWidth={selectedStageId === 'stage-3' ? '2.5' : '1.5'}
                  />
                  <circle cx="20" cy="22" r="10" fill="#fbbf24" />
                  <text x="17" y="26" fill="#000" fontSize="11" fontWeight="800">3</text>
                  <text x="36" y="25" fill="#fbbf24" fontSize="11" fontWeight="700">Build Image</text>
                  <text x="12" y="52" fill="#e2e8f0" fontSize="10">Docker + Trivy</text>
                  <text x="12" y="72" fill="#94a3b8" fontSize="9">GHCR Push</text>
                  <circle cx="115" cy="22" r="5" fill={stages[2].status === 'passed' ? '#34d399' : stages[2].status === 'failed' ? '#f87171' : '#64748b'} />
                </g>

                {/* Arrow 3 to 4 */}
                <path 
                  d="M 478 75 L 508 75" 
                  fill="none" 
                  stroke={stages[2].status === 'passed' ? '#34d399' : '#64748b'} 
                  strokeWidth="2" 
                  markerEnd={stages[2].status === 'passed' ? 'url(#arrow-pipe-green)' : 'url(#arrow-pipe-gray)'}
                  className={stages[2].status === 'passed' ? 'interactive-diagram-flowing-path' : ''}
                />

                {/* Stage 4 */}
                <g 
                  onClick={() => setSelectedStageId('stage-4')} 
                  style={{ cursor: 'pointer' }}
                  transform="translate(510, 30)"
                >
                  <rect 
                    x="0" y="0" width="130" height="90" rx="8" 
                    fill={selectedStageId === 'stage-4' ? 'rgba(167, 139, 250, 0.25)' : 'rgba(15, 23, 42, 0.8)'}
                    stroke={stages[3].status === 'passed' ? '#a78bfa' : '#64748b'}
                    strokeWidth={selectedStageId === 'stage-4' ? '2.5' : '1.5'}
                  />
                  <circle cx="20" cy="22" r="10" fill="#a78bfa" />
                  <text x="17" y="26" fill="#000" fontSize="11" fontWeight="800">4</text>
                  <text x="36" y="25" fill="#a78bfa" fontSize="11" fontWeight="700">CD Staging</text>
                  <text x="12" y="52" fill="#e2e8f0" fontSize="10">ArgoCD Sync</text>
                  <text x="12" y="72" fill="#94a3b8" fontSize="9">Smoke tests</text>
                  <circle cx="115" cy="22" r="5" fill={stages[3].status === 'passed' ? '#34d399' : '#64748b'} />
                </g>

                {/* Arrow 4 to 5 */}
                <path 
                  d="M 643 75 L 673 75" 
                  fill="none" 
                  stroke={stages[3].status === 'passed' ? '#34d399' : '#64748b'} 
                  strokeWidth="2" 
                  markerEnd={stages[3].status === 'passed' ? 'url(#arrow-pipe-green)' : 'url(#arrow-pipe-gray)'}
                  className={stages[3].status === 'passed' ? 'interactive-diagram-flowing-path' : ''}
                />

                {/* Stage 5 */}
                <g 
                  onClick={() => setSelectedStageId('stage-5')} 
                  style={{ cursor: 'pointer' }}
                  transform="translate(675, 30)"
                >
                  <rect 
                    x="0" y="0" width="130" height="90" rx="8" 
                    fill={selectedStageId === 'stage-5' ? 'rgba(45, 212, 191, 0.25)' : 'rgba(15, 23, 42, 0.8)'}
                    stroke={stages[4].status === 'passed' ? '#2dd4bf' : '#64748b'}
                    strokeWidth={selectedStageId === 'stage-5' ? '2.5' : '1.5'}
                  />
                  <circle cx="20" cy="22" r="10" fill="#2dd4bf" />
                  <text x="17" y="26" fill="#000" fontSize="11" fontWeight="800">5</text>
                  <text x="36" y="25" fill="#2dd4bf" fontSize="11" fontWeight="700">Prod Release</text>
                  <text x="12" y="52" fill="#e2e8f0" fontSize="10">Canary / Blue-Green</text>
                  <text x="12" y="72" fill="#94a3b8" fontSize="9">Auto Rollback</text>
                  <circle cx="115" cy="22" r="5" fill={stages[4].status === 'passed' ? '#34d399' : '#64748b'} />
                </g>

                {/* Bottom Timeline Legend */}
                <text x="20" y="155" fill="#94a3b8" fontSize="11">
                  Continuous Integration (CI): Stages 1-3 ➔ Continuous Delivery (CD): Stage 4 ➔ Continuous Deployment: Stage 5
                </text>
              </svg>
            </div>

            {/* Selected Stage Inspector Details */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${currentStage.color}44`,
              borderLeft: `4px solid ${currentStage.color}`,
              borderRadius: '8px',
              padding: '14px 18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: currentStage.color }}>
                  {currentStage.name}
                </span>
                <span style={{ 
                  fontSize: '11px', 
                  fontFamily: 'monospace', 
                  background: 'rgba(255,255,255,0.06)', 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  color: '#e2e8f0'
                }}>
                  {currentStage.command}
                </span>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: currentStage.status === 'passed' ? '#34d399' : currentStage.status === 'failed' ? '#f87171' : '#94a3b8'
                }}>
                  Status: {currentStage.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5, marginBottom: '6px' }}>
                {currentStage.description}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                <strong>Execution Mechanics:</strong> {currentStage.details}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'yaml_inspector' && (
          <div style={{ background: '#090b14', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', color: '#38bdf8', fontFamily: 'monospace' }}>
              .github/workflows/ci-cd-pipeline.yml
            </div>
            <pre style={{ margin: 0, padding: '16px', background: 'transparent', color: '#e2e8f0', fontSize: '12px', lineHeight: 1.5, overflowX: 'auto' }}>
              <code>{`name: Production CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  # Job 1: Fast test execution on runner
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Java 21 & Cache Maven dependencies
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Run Unit & Integration Tests
        run: mvn clean verify

  # Job 2: Build & Push Docker image (depends on test passing)
  build-and-scan:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Build Container Image
        run: docker build -t myapp:\${{ github.sha }} .

      - name: Run Trivy Vulnerability Scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:\${{ github.sha }}
          severity: 'CRITICAL,HIGH'
          exit-code: '1' # Fails pipeline if critical CVE found

  # Job 3: Automated Staging Deployment
  deploy-staging:
    needs: build-and-scan
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Trigger ArgoCD Sync to Staging
        run: echo "Syncing staging cluster with commit \${{ github.sha }}"`}</code>
            </pre>
          </div>
        )}

        {activeTab === 'car_wash_analogy' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '14px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                🚗 1. Entry / Queue (Git Push)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                Your car pulls up to the automated conveyor track. The system scans the license plate (commit SHA) and queues the job.
              </div>
            </div>

            <div style={{ padding: '14px', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                🧼 2. Soap & Scrub (CI Testing)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                High-pressure jets scrub away mud and dirt (compiler checks, linters, unit tests). If an open window is detected (broken test), the wash stops immediately.
              </div>
            </div>

            <div style={{ padding: '14px', background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>
                🛡️ 3. Wax & Seal (Docker & Scan)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                The car gets a protective clear coat (Docker packaging) and a safety inspection (CVE security scan) ensuring it's sealed and safe for the road.
              </div>
            </div>

            <div style={{ padding: '14px', background: 'rgba(45, 212, 191, 0.05)', border: '1px solid rgba(45, 212, 191, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#2dd4bf', marginBottom: '6px' }}>
                🛣️ 4. Drive Away (Production Release)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                The clean, inspected vehicle rolls seamlessly onto the highway (production users). Fast, repeatable, and 100% automated without human guesswork.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
