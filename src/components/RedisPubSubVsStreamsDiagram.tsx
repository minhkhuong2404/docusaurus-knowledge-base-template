import React, { useState } from 'react';

interface MessagingMode {
  id: string;
  name: string;
  badge: string;
  color: string;
  summary: string;
  persistence: string;
  consumerPattern: string;
  commands: string;
  useCase: string;
}

const MODES: MessagingMode[] = [
  {
    id: 'pubsub',
    name: '1. Redis Pub/Sub (At-Most-Once Messaging)',
    badge: 'Fire-and-Forget',
    color: '#f87171',
    summary: 'Messages are broadcast immediately to all connected subscribers listening to a channel. Unconnected subscribers miss messages permanently.',
    persistence: 'Zero persistence — messages exist only in memory during broadcast.',
    consumerPattern: 'Broadcast / Fan-out: every active subscriber receives a copy of every message.',
    commands: `PUBLISH orders "order_1001"\nSUBSCRIBE orders\nPSUBSCRIBE order.*`,
    useCase: 'Real-time notifications, chat rooms, live dashboard updates where missing an entry is acceptable.',
  },
  {
    id: 'streams',
    name: '2. Redis Streams (At-Least-Once Log Engine)',
    badge: 'Append-Only Log + Consumer Groups',
    color: '#34d399',
    summary: 'Messages are appended to a persistent stream log (`XADD`). Consumer Groups track processing offsets, Pending Entries List (PEL), and support manual ack (`XACK`).',
    persistence: 'Persistent log — retained on disk according to MAXLEN stream truncation rules.',
    consumerPattern: 'Consumer Groups / Work Queues: load-balance stream messages across worker pods with automatic redelivery on crash.',
    commands: `XADD mystream * user "alice" action "login"\nXREADGROUP GROUP mygroup worker1 COUNT 10 STREAMS mystream >\nXACK mystream mygroup 152637482-0`,
    useCase: 'Event-driven microservice orchestration, audit logging, Kafka-like message queues with consumer offset tracking.',
  },
];

export default function RedisPubSubVsStreamsDiagram(): React.JSX.Element {
  const [selectedMode, setSelectedMode] = useState<MessagingMode>(MODES[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11a9 9 0 0 1 9 9"/>
          <path d="M4 4a16 16 0 0 1 16 16"/>
          <circle cx="5" cy="19" r="1"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Redis Messaging Paradigm: Pub/Sub vs Redis Streams & Consumer Groups
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {MODES.map((m) => {
            const isSelected = m.id === selectedMode.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMode(m)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${m.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${m.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '13px',
                }}
              >
                {m.name}
              </button>
            );
          })}
        </div>

        {/* Mode Overview */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedMode.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedMode.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedMode.color}22`, color: selectedMode.color, fontWeight: 700 }}>
              {selectedMode.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedMode.summary}
          </p>
        </div>

        {/* Technical Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Persistence Guarantee
            </div>
            <div style={{ fontSize: '13px', color: selectedMode.color, fontWeight: 600, marginBottom: '12px' }}>
              {selectedMode.persistence}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Consumer Dispatch Model
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              {selectedMode.consumerPattern}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Primary Use Cases
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', marginBottom: '12px', lineHeight: 1.4 }}>
              {selectedMode.useCase}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Core Redis Commands
            </div>
            <pre style={{ margin: 0, padding: '8px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '11.5px', fontFamily: 'monospace', color: '#38bdf8', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
              <code>{selectedMode.commands}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
