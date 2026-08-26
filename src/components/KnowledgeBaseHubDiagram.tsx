import React, { useState } from 'react';
import Link from '@docusaurus/Link';

interface DomainNode {
  id: string;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  link: string;
  iconPath: string;
  topics: string[];
  description: string;
  targetAudience: string;
}

const DOMAIN_NODES: DomainNode[] = [
  {
    id: 'interview',
    title: 'Interview Preparation',
    subtitle: 'System Design & Core Java',
    x: 30,
    y: 110,
    w: 165,
    h: 58,
    color: '#fbbf24',
    link: '/technical-knowledge/system-design/interview-framework',
    iconPath: 'M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m4 6h.01M5 20h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z',
    topics: ['System Design Framework', 'Java 21+ & JVM Internals', 'Distributed Transactions', 'Behavioral STAR Matrix'],
    description: 'Comprehensive senior engineering interview prep covering 4-step system design blueprints, JVM internals, concurrency primitives, and behavioral leadership principles.',
    targetAudience: 'Software Engineers targeting Senior, Staff, and Backend roles.'
  },
  {
    id: 'dsa',
    title: 'DSA Master Training',
    subtitle: '20-Week Pattern Curriculum',
    x: 215,
    y: 110,
    w: 165,
    h: 58,
    color: '#34d399',
    link: '/technical-knowledge/dsa/20-week-dsa-roadmap-intro',
    iconPath: 'M18 20V10M12 20V4M6 20v-6',
    topics: ['20-Week Pattern Roadmap', 'Two Pointers & Sliding Window', 'Dynamic Programming', 'Company-Wise Question Sets'],
    description: 'Structured 20-week pattern recognition curriculum from Arrays & Two Pointers to DSU and Dynamic Programming, plus frequently asked company interview sets.',
    targetAudience: 'Engineers preparing for coding rounds and algorithmic mastery.'
  },
  {
    id: 'banking',
    title: 'Banking & Financial Core',
    subtitle: 'ISO 20022 & Global Rails',
    x: 400,
    y: 110,
    w: 165,
    h: 58,
    color: '#2dd4bf',
    link: '/technical-knowledge/banking/overview',
    iconPath: 'M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3',
    topics: ['10-Step Payment Lifecycle', 'ISO 20022 (pain/pacs/camt)', 'NPP / SWIFT / RTGS', 'Core Banking Ledger & EOD'],
    description: 'Deep dive into financial engineering architecture: real-time payment rails, ISO 20022 XML schemas, double-entry accounting ledgers, and sanctions screening.',
    targetAudience: 'Fintech, Payment Hub, and Banking Backend Engineers.'
  },
  {
    id: 'ai-agents',
    title: 'AI Agents & Vibe Coding',
    subtitle: 'Agentic Loops & Context Eng',
    x: 30,
    y: 190,
    w: 165,
    h: 58,
    color: '#a855f7',
    link: '/technical-knowledge/ai-agents/overview',
    iconPath: 'M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM4 12a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM16 12a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2zM12 18a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z',
    topics: ['ReAct Agent Design Loops', 'Custom Skill Registries', 'Evaluation Test Harnesses', 'Context Engineering & RAG'],
    description: 'Modern agentic AI architectures, tool-calling protocols, prompt regression harnesses, and natural language vibe coding development workflows.',
    targetAudience: 'Engineers building LLM applications and agentic workflows.'
  },
  {
    id: 'devops',
    title: 'DevOps, Cloud & K8s',
    subtitle: 'GitOps & AWS DVA-C02',
    x: 215,
    y: 190,
    w: 165,
    h: 58,
    color: '#f97316',
    link: '/devops',
    iconPath: 'M2 16.1A5 5 0 0 1 5.9 10 9 9 0 0 1 20 12.36 7 7 0 0 1 18 20H4a4 4 0 0 1-2-3.9z',
    topics: ['Docker Engine Internals', 'Kubernetes Architecture', 'GitOps with ArgoCD', 'AWS DVA-C02 Complete Path'],
    description: 'Production infrastructure patterns covering container runtimes, Kubernetes control plane topologies, declarative GitOps pipelines, and AWS certification paths.',
    targetAudience: 'Cloud Developers, Platform Engineers, and DevOps Specialists.'
  },
  {
    id: 'books',
    title: 'Engineering Books',
    subtitle: 'DDIA & Effective Java',
    x: 400,
    y: 190,
    w: 165,
    h: 58,
    color: '#f472b6',
    link: '/books/effective-java/introduction',
    iconPath: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
    topics: ['Designing Data-Intensive Apps', 'Effective Java (90 Best Practices)', 'Clean Code & Clean Architecture', 'System Design Interview Vol 1 & 2'],
    description: 'Condensed takeaways, architectural mental models, and production principles from cornerstone software engineering literature.',
    targetAudience: 'Engineers investing in foundational, long-term mastery.'
  }
];

export default function KnowledgeBaseHubDiagram(): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string>('interview');

  const selectedNode = DOMAIN_NODES.find((n) => n.id === selectedId) || DOMAIN_NODES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .hub-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Knowledge Base Architecture & Learning Tracks
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11.5px',
            color: 'var(--ifm-color-content-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#38bdf8' }} />
          Click any domain node to explore
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div
          className="hub-split-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '58% 42%',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          {/* Left Pane: Interactive SVG Node Graph */}
          <div
            className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg"
            style={{ borderRadius: '12px', overflow: 'hidden' }}
          >
            <svg viewBox="0 0 595 270" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="hub-arr-cyan" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
                </marker>
                <marker id="hub-arr-amber" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" />
                </marker>
                <marker id="hub-arr-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#34d399" />
                </marker>
                <marker id="hub-arr-teal" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#2dd4bf" />
                </marker>
                <marker id="hub-arr-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#a855f7" />
                </marker>
                <marker id="hub-arr-orange" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#f97316" />
                </marker>
                <marker id="hub-arr-pink" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#f472b6" />
                </marker>
              </defs>

              {/* Central Hub Root Node */}
              <g
                onClick={() => setSelectedId('interview')}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x="180"
                  y="15"
                  width="235"
                  height="50"
                  rx="10"
                  fill="rgba(56, 189, 248, 0.15)"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
                <text
                  x="297"
                  y="36"
                  textAnchor="middle"
                  fill="#38bdf8"
                  fontSize="12.5"
                  fontWeight="800"
                  fontFamily="var(--ifm-font-family-base)"
                >
                  ENGINEERING KNOWLEDGE BASE
                </text>
                <text
                  x="297"
                  y="52"
                  textAnchor="middle"
                  fill="var(--ifm-color-content-secondary)"
                  fontSize="9.5"
                  fontWeight="500"
                >
                  Production Hub & Interactive Practice Platform
                </text>
              </g>

              {/* Connecting Conduits / Directed Edges */}
              {/* Row 1 Conduits */}
              <path
                d="M 230 65 C 230 85, 112 85, 112 104"
                fill="none"
                stroke={selectedId === 'interview' ? '#fbbf24' : 'rgba(255, 255, 255, 0.15)'}
                strokeWidth={selectedId === 'interview' ? 2 : 1.2}
                strokeDasharray={selectedId === 'interview' ? '4 3' : 'none'}
                markerEnd="url(#hub-arr-amber)"
              />
              <path
                d="M 297 65 L 297 104"
                fill="none"
                stroke={selectedId === 'dsa' ? '#34d399' : 'rgba(255, 255, 255, 0.15)'}
                strokeWidth={selectedId === 'dsa' ? 2 : 1.2}
                strokeDasharray={selectedId === 'dsa' ? '4 3' : 'none'}
                markerEnd="url(#hub-arr-green)"
              />
              <path
                d="M 365 65 C 365 85, 482 85, 482 104"
                fill="none"
                stroke={selectedId === 'banking' ? '#2dd4bf' : 'rgba(255, 255, 255, 0.15)'}
                strokeWidth={selectedId === 'banking' ? 2 : 1.2}
                strokeDasharray={selectedId === 'banking' ? '4 3' : 'none'}
                markerEnd="url(#hub-arr-teal)"
              />

              {/* Row 2 Conduits */}
              <path
                d="M 112 168 L 112 184"
                fill="none"
                stroke={selectedId === 'ai-agents' ? '#a855f7' : 'rgba(255, 255, 255, 0.15)'}
                strokeWidth={selectedId === 'ai-agents' ? 2 : 1.2}
                strokeDasharray={selectedId === 'ai-agents' ? '4 3' : 'none'}
                markerEnd="url(#hub-arr-purple)"
              />
              <path
                d="M 297 168 L 297 184"
                fill="none"
                stroke={selectedId === 'devops' ? '#f97316' : 'rgba(255, 255, 255, 0.15)'}
                strokeWidth={selectedId === 'devops' ? 2 : 1.2}
                strokeDasharray={selectedId === 'devops' ? '4 3' : 'none'}
                markerEnd="url(#hub-arr-orange)"
              />
              <path
                d="M 482 168 L 482 184"
                fill="none"
                stroke={selectedId === 'books' ? '#f472b6' : 'rgba(255, 255, 255, 0.15)'}
                strokeWidth={selectedId === 'books' ? 2 : 1.2}
                strokeDasharray={selectedId === 'books' ? '4 3' : 'none'}
                markerEnd="url(#hub-arr-pink)"
              />

              {/* Domain Nodes */}
              {DOMAIN_NODES.map((node) => {
                const isSelected = selectedId === node.id;
                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedId(node.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.w}
                      height={node.h}
                      rx="8"
                      fill={isSelected ? `${node.color}22` : 'rgba(15, 23, 42, 0.8)'}
                      stroke={node.color}
                      strokeWidth={isSelected ? 2 : 1.2}
                      filter={isSelected ? 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' : 'none'}
                    />

                    {/* Left Color Indicator Pill */}
                    <rect
                      x={node.x + 8}
                      y={node.y + 12}
                      width="3.5"
                      height={node.h - 24}
                      rx="1.5"
                      fill={node.color}
                    />

                    <text
                      x={node.x + 18}
                      y={node.y + 24}
                      fill={isSelected ? '#ffffff' : 'var(--ifm-color-content)'}
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="var(--ifm-font-family-base)"
                    >
                      {node.title}
                    </text>

                    <text
                      x={node.x + 18}
                      y={node.y + 42}
                      fill="var(--ifm-color-content-secondary)"
                      fontSize="9"
                      fontWeight="500"
                    >
                      {node.subtitle}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right Pane: Interactive Detail Panel */}
          <div
            className="interactive-diagram-details-card"
            style={{
              borderColor: `${selectedNode.color}40`,
              background: `${selectedNode.color}08`,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '270px',
              padding: '18px',
              borderRadius: '12px',
            }}
          >
            {/* Detail Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: `${selectedNode.color}20`,
                    border: `1px solid ${selectedNode.color}50`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: selectedNode.color,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={selectedNode.iconPath} />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: selectedNode.color }}>
                    {selectedNode.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                    {selectedNode.subtitle}
                  </div>
                </div>
              </div>

              <Link
                to={selectedNode.link}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  background: `${selectedNode.color}20`,
                  border: `1px solid ${selectedNode.color}50`,
                  color: selectedNode.color,
                  fontWeight: 700,
                  fontSize: '11.5px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease',
                }}
              >
                Open Track ➔
              </Link>
            </div>

            {/* Description */}
            <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.55 }}>
              {selectedNode.description}
            </p>

            {/* Core Curriculum Modules */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: selectedNode.color, marginBottom: '6px', letterSpacing: '0.04em' }}>
                Core Modules & Focus Areas
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {selectedNode.topics.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 600,
                      padding: '2.5px 7px',
                      borderRadius: '5px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.10)',
                      color: 'var(--ifm-color-content)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Target Audience */}
            <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: 'auto', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)' }}>
              <strong style={{ color: 'var(--ifm-color-content)' }}>Target: </strong>
              {selectedNode.targetAudience}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
