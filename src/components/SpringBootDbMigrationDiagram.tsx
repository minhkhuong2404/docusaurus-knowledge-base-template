import React, { useState } from 'react';

interface ToolDetails {
  name: string;
  color: string;
  concept: string;
  metadataTable: string;
  tableDesc: string;
  lifecycle: string[];
  fileFormat: string;
  namingConvention: string;
  exampleCode: string;
}

const TOOLS: Record<'flyway' | 'liquibase', ToolDetails> = {
  flyway: {
    name: 'Flyway (SQL-centric)',
    color: '#f87171',
    concept: 'Opinionated database migration relying on pure SQL scripts. It executes files sequentially based on version stamps.',
    metadataTable: 'flyway_schema_history',
    tableDesc: 'Tracks script version, description, checksum hash, execution time, and success status. Any manual alteration of executed scripts triggers a validation checksum mismatch error on startup.',
    lifecycle: [
      'Validate: Calculate checksums of local SQL files and match with flyway_schema_history.',
      'Migrate: Run missing migrations in ascending numerical order.',
      'Baseline: Tag existing schemas when introducing Flyway into a legacy DB.',
      'Repair: Clear failed migration records manually.',
    ],
    fileFormat: 'SQL Scripts (.sql)',
    namingConvention: 'V{Version}__{Description}.sql (e.g. V1__Create_users_table.sql)',
    exampleCode: `-- V1__Create_users_table.sql\nCREATE TABLE users (\n    id BIGSERIAL PRIMARY KEY,\n    username VARCHAR(50) NOT NULL UNIQUE,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);`,
  },
  liquibase: {
    name: 'Liquibase (XML/YAML declarative)',
    color: '#38bdf8',
    concept: 'Format-agnostic database migration using abstract changeSets. Supports rollbacks out of the box and is database-independent.',
    metadataTable: 'DATABASECHANGELOG & DATABASECHANGELOGLOCK',
    tableDesc: 'DATABASECHANGELOG records execute changeSets. DATABASECHANGELOGLOCK locks the DB during migration to prevent multiple concurrent application context instances from running migrations simultaneously.',
    lifecycle: [
      'Lock: Acquire a lock row in DATABASECHANGELOGLOCK table.',
      'Parse: Read master changelog file and evaluate current changeSets.',
      'Execute: Execute missing changeSets and register them in DATABASECHANGELOG.',
      'Release: Release the lock.',
    ],
    fileFormat: 'XML, YAML, JSON, or SQL',
    namingConvention: 'Abstract ChangeSets identified by id + author combination.',
    exampleCode: `databaseChangeLog:\n  - changeSet:\n      id: 1\n      author: lead-dev\n      changes:\n        - createTable:\n            tableName: users\n            columns:\n              - column:\n                  name: id\n                  type: BIGINT\n                  autoIncrement: true\n                  constraints:\n                    primaryKey: true`,
  },
};

export default function SpringBootDbMigrationDiagram(): React.JSX.Element {
  const [activeTool, setActiveTool] = useState<'flyway' | 'liquibase'>('flyway');
  const [activeStep, setActiveStep] = useState<number | null>(1);

  const current = TOOLS[activeTool];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
        <span>Database Migration: Flyway vs. Liquibase</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['flyway', 'liquibase'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setActiveTool(t); setActiveStep(0); }}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: '13px',
              background: activeTool === t ? `${TOOLS[t].color}18` : 'rgba(255,255,255,0.04)',
              color: activeTool === t ? TOOLS[t].color : 'var(--ifm-color-content-secondary)',
              boxShadow: activeTool === t ? `0 0 0 1.5px ${TOOLS[t].color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {TOOLS[t].name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        
        {/* Step-by-Step Flow */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '8px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '16px', justifyContent: 'center',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', textAlign: 'center' }}>
            Database Startup Migration Lifecycle
          </div>

          {current.lifecycle.map((step, idx) => {
            const isSelected = activeStep === idx;
            return (
              <div
                key={idx}
                onClick={() => setActiveStep(isSelected ? null : idx)}
                style={{
                  padding: '10px 12px', borderRadius: '6px', cursor: 'pointer',
                  background: isSelected ? `${current.color}15` : 'rgba(255,255,255,0.03)',
                  border: `1.2px solid ${isSelected ? current.color : 'rgba(255,255,255,0.05)'}`,
                  color: isSelected ? current.color : 'var(--ifm-color-content)',
                  fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
                }}
              >
                {step.split(':')[0]}
              </div>
            );
          })}
        </div>

        {/* Details Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: activeStep !== null ? 'flex-start' : 'center',
        }}>
          {activeStep !== null ? (
            <div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: current.color, display: 'block', marginBottom: '4px' }}>
                {current.lifecycle[activeStep].split(':')[0]}
              </span>
              <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                {current.lifecycle[activeStep].split(':')[1]}
              </p>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  Metadata Table Strategy: <code style={{ color: current.color }}>{current.metadataTable}</code>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                  {current.tableDesc}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  File Format &amp; Convention
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontWeight: 600, marginBottom: '4px' }}>
                  {current.fileFormat} — {current.namingConvention}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Script Pattern
                </div>
                <pre style={{
                  fontFamily: 'monospace', fontSize: '10px', margin: 0,
                  background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px',
                  color: '#e2e8f0', overflowX: 'auto',
                }}>
                  {current.exampleCode}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '12.5px' }}>
              💡 Click on any step in the database startup migration flow on the left to see action details, constraints, and configuration setups.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
