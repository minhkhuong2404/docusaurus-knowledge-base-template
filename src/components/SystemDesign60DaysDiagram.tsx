import React, { useState } from 'react';
import { SYSTEM_DESIGN_60_DAYS, DayScenarioData } from '../data/systemDesign60DaysData';

// 7 Modules Metadata
interface ModuleDef {
  id: number;
  name: string;
  daysRange: string;
  color: string;
  description: string;
  x: number;
  y: number;
}

const MODULES: ModuleDef[] = [
  { id: 1, name: 'Decoupling', daysRange: '01–08', color: '#38bdf8', description: 'API Gateways, BFF, Rate Limiting, Idempotency, Sharding & Caching Sync', x: 20, y: 35 },
  { id: 2, name: 'Distribution', daysRange: '09–16', color: '#34d399', description: 'CQRS, Sagas, 2PC, Webhook Ingestion, High-Ingest Indexes & Bloom Filters', x: 125, y: 35 },
  { id: 3, name: 'Resilience', daysRange: '17–24', color: '#fbbf24', description: 'Backpressure, Circuit Breakers, Read-Your-Writes, Outbox & Fan-out', x: 230, y: 35 },
  { id: 4, name: 'Storage & Search', daysRange: '25–32', color: '#2dd4bf', description: 'Queue Buffering, RAG Vector Stores, Blobs, Edge CDNs & Vaults', x: 335, y: 35 },
  { id: 5, name: 'Concurrency', daysRange: '33–40', color: '#a78bfa', description: 'Event Sourcing, Geospatial Quadtrees, HTTP/3, CRDTs & Overspend Locks', x: 440, y: 35 },
  { id: 6, name: 'AI & Streaming', daysRange: '41–50', color: '#f472b6', description: 'Stream Processing, Episodic Memory, Inverted Indexes & Strangler Fig', x: 545, y: 35 },
  { id: 7, name: 'Platform & SaaS', daysRange: '51–60', color: '#f97316', description: 'Multi-Tenant Isolation, Zero-Downtime Schemas, Tracing & Modular Monoliths', x: 650, y: 35 },
];

interface Props {
  initialView?: 'syllabus' | 'scenarios';
  initialScenario?: number;
}

export default function SystemDesign60DaysDiagram({
  initialView = 'syllabus',
  initialScenario = 1,
}: Props): React.JSX.Element {
  const [viewMode, setViewMode] = useState<'syllabus' | 'scenarios'>(initialView);
  const [activeModule, setActiveModule] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);
  const [activeScenarioDay, setActiveScenarioDay] = useState<number>(initialScenario);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const curModule = MODULES.find(m => m.id === activeModule) ?? MODULES[0];
  const curDay = SYSTEM_DESIGN_60_DAYS.find(d => d.day === selectedDayNum) ?? SYSTEM_DESIGN_60_DAYS[0];
  const curScenario = SYSTEM_DESIGN_60_DAYS.find(d => d.day === activeScenarioDay) ?? SYSTEM_DESIGN_60_DAYS[0];
  const curScenarioMod = MODULES.find(m => m.id === curScenario.moduleId) ?? MODULES[0];

  const filteredDays = SYSTEM_DESIGN_60_DAYS.filter(d => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.focus.toLowerCase().includes(q) ||
        d.question.toLowerCase().includes(q) ||
        `day ${d.day}`.includes(q) ||
        String(d.day) === q
      );
    }
    return d.moduleId === activeModule;
  });

  const scenarioFilterDays = SYSTEM_DESIGN_60_DAYS.filter(d => d.moduleId === curScenario.moduleId);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', marginBottom: '24px' }}>
      <style>{`
        @media (max-width: 768px) {
          .sd-split-grid { grid-template-columns: 1fr !important; }
          .sd-mode-btn-group { flex-wrap: wrap !important; }
          .sd-pipeline-svg { min-width: 700px; }
          .sd-pipeline-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '14px' }}>
            60 Days System Design: Interactive Explorer & Scenario Simulator
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="sd-mode-btn-group" style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setViewMode('syllabus')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11.5px',
              background: viewMode === 'syllabus' ? '#38bdf818' : 'rgba(255,255,255,0.04)',
              color: viewMode === 'syllabus' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              boxShadow: viewMode === 'syllabus' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            Syllabus (60 Days)
          </button>
          <button
            onClick={() => setViewMode('scenarios')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11.5px',
              background: viewMode === 'scenarios' ? '#34d39918' : 'rgba(255,255,255,0.04)',
              color: viewMode === 'scenarios' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              boxShadow: viewMode === 'scenarios' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            Scenario Simulator (60 Breakdowns)
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* VIEW 1: SYLLABUS & ROADMAP VIEW */}
        {viewMode === 'syllabus' ? (
          <div>
            {/* Top SVG Pipeline of 7 Architectural Modules */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Architectural Domains Pipeline (Click module to filter)
              </div>
              <div className="sd-pipeline-scroll" style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: '#070913', overflow: 'hidden' }}>
                <svg viewBox="0 0 760 85" className="sd-pipeline-svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
                  {/* Flowing connector line between modules */}
                  <line x1="90" y1="42" x2="670" y2="42" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
                  <line x1="90" y1="42" x2="670" y2="42" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" />

                  {/* Module Nodes */}
                  {MODULES.map(m => {
                    const isSelected = activeModule === m.id && searchQuery === '';
                    return (
                      <g
                        key={m.id}
                        onClick={() => {
                          setActiveModule(m.id);
                          setSearchQuery('');
                          const firstDay = SYSTEM_DESIGN_60_DAYS.find(d => d.moduleId === m.id);
                          if (firstDay) setSelectedDayNum(firstDay.day);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <rect
                          x={m.x}
                          y={16}
                          width={90}
                          height={52}
                          rx={8}
                          fill={isSelected ? `${m.color}25` : '#0d1020'}
                          stroke={m.color}
                          strokeWidth={isSelected ? 2 : 1}
                        />
                        <text x={m.x + 45} y={34} textAnchor="middle" fill={m.color} fontSize="10.5" fontWeight="700">
                          {`M${m.id}: ${m.name}`}
                        </text>
                        <text x={m.x + 45} y={48} textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">
                          {`Days ${m.daysRange}`}
                        </text>
                        {isSelected && (
                          <circle cx={m.x + 45} cy={60} r="2.5" fill={m.color} />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <input
                  type="text"
                  placeholder="Search 60 days by topic, question, or day number..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px 7px 30px',
                    borderRadius: '7px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--ifm-color-content)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--ifm-color-content-secondary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ position: 'absolute', left: '10px', top: '9px' }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.08)',
                    color: 'var(--ifm-color-content-secondary)',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Clear Search
                </button>
              )}

              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                Showing {filteredDays.length} {filteredDays.length === 1 ? 'day' : 'days'}
              </div>
            </div>

            {/* Split Pane: Days Grid on Left (55%), Day Details on Right (45%) */}
            <div className="sd-split-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '14px', alignItems: 'start' }}>
              {/* Left Column: Days List */}
              <div
                style={{
                  maxHeight: '430px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  paddingRight: '6px',
                }}
              >
                {filteredDays.map(d => {
                  const isDaySel = selectedDayNum === d.day;
                  const mod = MODULES.find(m => m.id === d.moduleId) ?? MODULES[0];
                  return (
                    <div
                      key={d.day}
                      onClick={() => setSelectedDayNum(d.day)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: isDaySel ? `${mod.color}15` : 'rgba(255,255,255,0.03)',
                        boxShadow: isDaySel ? `0 0 0 1.5px ${mod.color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            color: mod.color,
                            background: `${mod.color}20`,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            flexShrink: 0,
                          }}
                        >
                          {String(d.day).padStart(2, '0')}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: isDaySel ? mod.color : 'var(--ifm-color-content)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {d.title.split('(')[0]}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                            {d.focus}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: '#34d399',
                          background: 'rgba(52,211,153,0.12)',
                          border: '1px solid rgba(52,211,153,0.3)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          flexShrink: 0,
                        }}
                      >
                        Scenario
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Selected Day Inspector */}
              <div
                className="interactive-diagram-details-card"
                style={{
                  border: `1px solid ${curModule.color}40`,
                  background: '#0a0d18',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: curModule.color,
                      background: `${curModule.color}18`,
                      border: `1px solid ${curModule.color}35`,
                      padding: '3px 8px',
                      borderRadius: '5px',
                    }}
                  >
                    Day {String(curDay.day).padStart(2, '0')} · Module {curDay.moduleId}
                  </span>

                  <button
                    onClick={() => {
                      setActiveScenarioDay(curDay.day);
                      setSelectedOption(null);
                      setViewMode('scenarios');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '5px',
                      border: 'none',
                      background: '#34d39920',
                      color: '#34d399',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span>Simulate Breakdown</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>

                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
                  {curDay.title}
                </div>
                <div style={{ fontSize: '11.5px', color: curModule.color, fontWeight: 600, marginBottom: '12px' }}>
                  Key Focus: {curDay.focus}
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', fontWeight: 700, letterSpacing: '0.4px', marginBottom: '3px' }}>
                    The Architectural Scenario
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5, background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {curDay.scenario}
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#34d399', fontWeight: 700, letterSpacing: '0.4px', marginBottom: '3px' }}>
                    The Core Dilemma
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                    {curDay.question}
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#fbbf24', fontWeight: 700, letterSpacing: '0.4px', marginBottom: '3px' }}>
                    Architecture Takeaway
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                    {curDay.summary}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <a
                    href={curDay.docLink}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: curModule.color,
                      textDecoration: 'none',
                    }}
                  >
                    <span>Read Deep-Dive Guide</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </a>

                  <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                    Module {curDay.moduleId} of 7
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: SCENARIO SIMULATOR (ALL 60 BREAKDOWNS) */
          <div>
            {/* Module Picker Bar */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {MODULES.map(m => {
                const isModActive = curScenario.moduleId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      const firstInMod = SYSTEM_DESIGN_60_DAYS.find(d => d.moduleId === m.id);
                      if (firstInMod) {
                        setActiveScenarioDay(firstInMod.day);
                        setSelectedOption(null);
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '5px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      background: isModActive ? `${m.color}20` : 'rgba(255,255,255,0.03)',
                      color: isModActive ? m.color : 'var(--ifm-color-content-secondary)',
                      boxShadow: isModActive ? `0 0 0 1px ${m.color}60` : 'none',
                    }}
                  >
                    M{m.id}: {m.name}
                  </button>
                );
              })}
            </div>

            {/* Days in selected module */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select Day Scenario ({curScenarioMod.name} — Days {curScenarioMod.daysRange})
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {scenarioFilterDays.map(s => {
                  const isActive = activeScenarioDay === s.day;
                  return (
                    <button
                      key={s.day}
                      onClick={() => {
                        setActiveScenarioDay(s.day);
                        setSelectedOption(null);
                      }}
                      style={{
                        padding: '5px 9px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: isActive ? `${curScenarioMod.color}20` : 'rgba(255,255,255,0.03)',
                        color: isActive ? curScenarioMod.color : 'var(--ifm-color-content-secondary)',
                        boxShadow: isActive ? `0 0 0 1.5px ${curScenarioMod.color}60` : '0 0 0 1px rgba(255,255,255,0.06)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Day {String(s.day).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Scenario Header & Problem Card */}
            <div
              style={{
                background: `${curScenarioMod.color}08`,
                border: `1px solid ${curScenarioMod.color}30`,
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: curScenarioMod.color, background: `${curScenarioMod.color}20`, padding: '2px 6px', borderRadius: '4px' }}>
                  Scenario Day {String(curScenario.day).padStart(2, '0')}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {curScenario.title}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.5 }}>
                {curScenario.scenario}
              </p>
            </div>

            {/* Split layout: Architectural Flow on Left (50%), Interactive Multiple-Choice on Right (50%) */}
            <div className="sd-split-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
              {/* Left Column: Dynamic Visual SVG Architecture Canvas */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Architecture Topology & Flow Mechanics
                </div>
                <div
                  className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg"
                  style={{
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: '#070913',
                    padding: '12px 6px',
                    overflow: 'hidden',
                  }}
                >
                  <svg viewBox="0 0 500 130" style={{ width: '100%', height: 'auto', display: 'block' }}>
                    <defs>
                      <marker id="arr-sim-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
                      </marker>
                      <marker id="arr-sim-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
                      </marker>
                      <marker id="arr-sim-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L8,3 z" fill="#fbbf24" />
                      </marker>
                    </defs>

                    {/* Flowing animated conduit paths */}
                    <line x1="125" y1="65" x2="185" y2="65" stroke="rgba(56,189,248,0.3)" strokeWidth="2" />
                    <line x1="125" y1="65" x2="185" y2="65" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#arr-sim-blue)" />

                    <line x1="315" y1="50" x2="365" y2="40" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
                    <line x1="315" y1="50" x2="365" y2="40" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#arr-sim-green)" />

                    <line x1="315" y1="80" x2="365" y2="90" stroke="rgba(251,191,36,0.3)" strokeWidth="2" />
                    <line x1="315" y1="80" x2="365" y2="90" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#arr-sim-amber)" />

                    {/* Node 1: Ingest/Client */}
                    <rect x="20" y="40" width="105" height="50" rx="7" fill="#38bdf815" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="72" y="62" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">Client / Traffic</text>
                    <text x="72" y="78" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="7.5">Workload Ingestion</text>

                    {/* Node 2: Core Subsystem / Handler */}
                    <rect x="185" y="38" width="130" height="54" rx="7" fill={`${curScenarioMod.color}15`} stroke={curScenarioMod.color} strokeWidth="1.5" />
                    <text x="250" y="60" textAnchor="middle" fill={curScenarioMod.color} fontSize="9.5" fontWeight="700">
                      {curScenario.title.split('(')[0].slice(0, 18)}
                    </text>
                    <text x="250" y="76" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="7.5">Domain Strategy</text>

                    {/* Node 3: Target Store / Service */}
                    <rect x="365" y="20" width="115" height="38" rx="7" fill="#34d39915" stroke="#34d399" strokeWidth="1.5" />
                    <text x="422" y="38" textAnchor="middle" fill="#34d399" fontSize="9.5" fontWeight="700">Committed State</text>
                    <text x="422" y="50" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="7">ACID / Replicas</text>

                    {/* Node 4: Fallback / Invalidation */}
                    <rect x="365" y="72" width="115" height="38" rx="7" fill="#fbbf2415" stroke="#fbbf24" strokeWidth="1.5" />
                    <text x="422" y="90" textAnchor="middle" fill="#fbbf24" fontSize="9.5" fontWeight="700">Async Projection</text>
                    <text x="422" y="102" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="7">CDC / Event Bus</text>
                  </svg>
                </div>

                {/* Technical summary callout */}
                <div
                  style={{
                    marginTop: '10px',
                    fontSize: '11.5px',
                    color: 'var(--ifm-color-content-secondary)',
                    lineHeight: 1.5,
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <strong style={{ color: curScenarioMod.color }}>Architecture Takeaway: </strong>
                  {curScenario.summary}
                </div>
              </div>

              {/* Right Column: Architectural Options & Trap Simulator */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  The Architectural Decision (Click to test)
                </div>

                {/* Highlighted Question Container */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%)',
                    border: '1.5px solid rgba(56, 189, 248, 0.45)',
                    borderLeft: '4px solid #38bdf8',
                    borderRadius: '9px',
                    padding: '12px 14px',
                    marginBottom: '12px',
                    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.25), 0 0 16px rgba(56, 189, 248, 0.16)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        letterSpacing: '0.6px',
                        textTransform: 'uppercase',
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.18)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        padding: '2px 8px',
                        borderRadius: '5px',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      ARCHITECTURAL QUESTION
                    </span>
                    {selectedOption && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: selectedOption === curScenario.options.find(o => o.isCorrect)?.key ? '#34d399' : '#f87171',
                          background: selectedOption === curScenario.options.find(o => o.isCorrect)?.key ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.18)',
                          border: `1px solid ${selectedOption === curScenario.options.find(o => o.isCorrect)?.key ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}`,
                          padding: '2px 7px',
                          borderRadius: '4px',
                        }}
                      >
                        {selectedOption === curScenario.options.find(o => o.isCorrect)?.key ? '✅ Recommended Architecture' : '⚠️ Pitfall Encountered'}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', lineHeight: 1.5 }}>
                    {curScenario.question}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {curScenario.options.map(opt => {
                    const isSelected = selectedOption === opt.key;
                    const isRevealed = selectedOption !== null;
                    const isWinner = opt.isCorrect;

                    let borderColor = 'rgba(255,255,255,0.08)';
                    let bg = 'rgba(255,255,255,0.03)';
                    let boxShadow = 'none';

                    if (isRevealed) {
                      if (isWinner) {
                        borderColor = '#34d399';
                        bg = 'rgba(52,211,153,0.16)';
                        boxShadow = '0 0 16px rgba(52,211,153,0.35), inset 0 0 10px rgba(52,211,153,0.12)';
                      } else if (isSelected) {
                        borderColor = '#f87171';
                        bg = 'rgba(248,113,113,0.16)';
                        boxShadow = '0 0 16px rgba(248,113,113,0.35), inset 0 0 10px rgba(248,113,113,0.1)';
                      } else {
                        borderColor = 'rgba(255,255,255,0.05)';
                        bg = 'rgba(255,255,255,0.015)';
                      }
                    }

                    return (
                      <div
                        key={opt.key}
                        onClick={() => setSelectedOption(opt.key)}
                        style={{
                          padding: '11px 13px',
                          borderRadius: '8px',
                          border: `1.5px solid ${borderColor}`,
                          background: bg,
                          boxShadow: boxShadow,
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 800,
                              color: !isRevealed
                                ? '#38bdf8'
                                : isWinner
                                ? '#064e3b'
                                : isSelected
                                ? '#450a0a'
                                : 'var(--ifm-color-content-secondary)',
                              background: !isRevealed
                                ? 'rgba(56,189,248,0.15)'
                                : isWinner
                                ? '#34d399'
                                : isSelected
                                ? '#f87171'
                                : 'rgba(255,255,255,0.06)',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              flexShrink: 0,
                              boxShadow: isRevealed && (isWinner || isSelected) ? '0 0 8px rgba(0,0,0,0.3)' : 'none',
                            }}
                          >
                            {opt.key}
                          </span>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: isRevealed ? '5px' : '0' }}>
                              <span style={{ fontSize: '12px', fontWeight: isWinner && isRevealed ? 700 : 600, color: 'var(--ifm-color-content)' }}>
                                {opt.text}
                              </span>
                              {isRevealed && isWinner && (
                                <span
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 800,
                                    color: '#34d399',
                                    background: 'rgba(52,211,153,0.22)',
                                    border: '1px solid #34d399',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    boxShadow: '0 0 8px rgba(52,211,153,0.3)',
                                  }}
                                >
                                  RECOMMENDED WINNER
                                </span>
                              )}
                              {isRevealed && isSelected && !isWinner && (
                                <span
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 800,
                                    color: '#f87171',
                                    background: 'rgba(248,113,113,0.22)',
                                    border: '1px solid #f87171',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    boxShadow: '0 0 8px rgba(248,113,113,0.3)',
                                  }}
                                >
                                  PRODUCTION PITFALL
                                </span>
                              )}
                            </div>

                            {isRevealed && (
                              <div
                                style={{
                                  fontSize: '11px',
                                  color: isWinner ? '#34d399' : isSelected ? '#f87171' : 'var(--ifm-color-content-secondary)',
                                  lineHeight: 1.45,
                                  fontWeight: isWinner || isSelected ? 500 : 400,
                                }}
                              >
                                {opt.explanation}
                              </div>
                            )}
                          </div>

                          {isRevealed && (
                            <span style={{ fontSize: '14px', flexShrink: 0 }}>
                              {isWinner ? '✅' : isSelected ? '❌' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Prominent Glowing Feedback Banner */}
                {selectedOption && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: selectedOption === curScenario.options.find(o => o.isCorrect)?.key ? '1.5px solid #34d399' : '1.5px solid #fbbf24',
                      background: selectedOption === curScenario.options.find(o => o.isCorrect)?.key ? 'rgba(52, 211, 153, 0.14)' : 'rgba(251, 191, 36, 0.12)',
                      boxShadow: selectedOption === curScenario.options.find(o => o.isCorrect)?.key ? '0 0 16px rgba(52, 211, 153, 0.28)' : '0 0 16px rgba(251, 191, 36, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: selectedOption === curScenario.options.find(o => o.isCorrect)?.key ? '#34d399' : '#fbbf24' }}>
                        {selectedOption === curScenario.options.find(o => o.isCorrect)?.key
                          ? `🏆 Architectural Decision Approved: Option ${selectedOption}`
                          : `⚠️ Trap Encountered: Option ${selectedOption}. Winner: Option ${curScenario.options.find(o => o.isCorrect)?.key}`}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                        {selectedOption === curScenario.options.find(o => o.isCorrect)?.key
                          ? 'Optimal resilience and performance characteristics verified.'
                          : 'Review the technical failure modes below to understand why this option collapses under load.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reset or explore prompt */}
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => setSelectedOption(null)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '5px',
                      border: 'none',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--ifm-color-content-secondary)',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Reset Choices
                  </button>

                  <a
                    href={`#day-${String(curScenario.day).padStart(2, '0')}-${curScenario.title.split('(')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: curScenarioMod.color,
                      textDecoration: 'none',
                    }}
                  >
                    Jump to Full Text Breakdown ↓
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
