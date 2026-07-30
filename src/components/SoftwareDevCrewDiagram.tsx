import React, { useState } from 'react';

interface CrewRole {
  id: string;
  name: string;
  badge: string;
  color: string;
  roleDescription: string;
  outputArtifact: string;
}

const CREW_ROLES: CrewRole[] = [
  {
    id: 'orchestrator',
    name: '1. Orchestrator Agent (Lead)',
    badge: 'LEAD',
    color: '#38bdf8', // Sky Blue
    roleDescription: 'Parses high-level user goals ("Build REST API for inventory management"), decomposes goals into subtasks, and assigns tasks to specialized agents.',
    outputArtifact: 'System Architecture Blueprint & Task Assignment Matrix'
  },
  {
    id: 'architecture',
    name: '2. Architecture Agent',
    badge: 'DESIGN',
    color: '#a78bfa', // Purple
    roleDescription: 'Designs core tech stack parameters (PostgreSQL + Spring Boot + Redis cache) and defines service interfaces.',
    outputArtifact: 'System Design Document & API Interface Specification'
  },
  {
    id: 'coder',
    name: '3. Backend Coder Agent (Parallel)',
    badge: 'CODER',
    color: '#fbbf24', // Amber
    roleDescription: 'Writes production Java Spring Boot controller endpoints, service logic, and DTO data models.',
    outputArtifact: 'Source Code Files (*Controller.java, *Service.java)'
  },
  {
    id: 'database',
    name: '4. Database Agent (Parallel)',
    badge: 'DATABASE',
    color: '#2dd4bf', // Teal
    roleDescription: 'Designs relational entity models, Liquibase/Flyway SQL migrations, and repository queries.',
    outputArtifact: 'V1__init_schema.sql & JPA Repository Interfaces'
  },
  {
    id: 'reviewer',
    name: '5. Code Reviewer Agent',
    badge: 'REVIEW',
    color: '#f87171', // Red
    roleDescription: 'Audits generated code against security standards (OWASP Top 10, SQL injection prevention, null pointer safety).',
    outputArtifact: 'Code Review Comments & Security Patch Requests'
  },
  {
    id: 'tester',
    name: '6. Tester Agent',
    badge: 'QA & TEST',
    color: '#34d399', // Emerald
    roleDescription: 'Writes JUnit 5 / Mockito unit tests and executes test runner inside isolated sandbox environment.',
    outputArtifact: 'Test Suite Execution Report (100% Pass Rate)'
  }
];

export default function SoftwareDevCrewDiagram() {
  const [activeId, setActiveId] = useState<string>('orchestrator');
  const activeRole = CREW_ROLES.find(r => r.id === activeId) || CREW_ROLES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Multi-Agent Software Development Crew Architecture</span>
      </div>

      {/* Role Grid */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '10px'
        }}>
          {CREW_ROLES.map((r) => {
            const isActive = activeId === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setActiveId(r.id)}
                style={{
                  background: isActive ? `${r.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? r.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: r.color, background: `${r.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {r.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {r.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: activeRole.color, marginBottom: '6px' }}>
          {activeRole.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {activeRole.roleDescription}
        </div>

        <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
            Produced Engineering Artifact
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontWeight: 600 }}>
            {activeRole.outputArtifact}
          </div>
        </div>
      </div>
    </div>
  );
}
