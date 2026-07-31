import React, { useState } from 'react';

export default function GrpcVsRestDiagram(): React.JSX.Element {
  const [arch, setArch] = useState<'rest' | 'grpc'>('grpc');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          gRPC (HTTP/2 Protobuf) vs REST (HTTP/1.1 JSON) Benchmark Inspector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setArch('rest')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: arch === 'rest' ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)', backgroundColor: arch === 'rest' ? 'rgba(248, 113, 113, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            REST API (JSON over HTTP/1.1)
          </button>
          <button onClick={() => setArch('grpc')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: arch === 'grpc' ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)', backgroundColor: arch === 'grpc' ? 'rgba(167, 139, 250, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            gRPC (Protobuf over HTTP/2)
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {arch === 'rest' ? (
            <div>
              <div style={{ fontSize: '12.5px', color: '#f87171', fontWeight: 700, marginBottom: '4px' }}>REST / JSON Overhead</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0 }}>Human-readable text string payload (~240 bytes). Head-of-Line blocking on HTTP/1.1 connections. Strict request-response only.</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '12.5px', color: '#a78bfa', fontWeight: 700, marginBottom: '4px' }}>gRPC / Protobuf Performance</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0 }}>Compact binary wire payload (~38 bytes — 84% size reduction!). Single TCP connection multiplexing, bidirectional streaming, strongly-typed contracts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
