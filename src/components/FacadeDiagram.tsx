import React, { useState } from 'react';

interface FacadeSection {
  id: string;
  name: string;
  badge: string;
  color: string;
  interfaceType: string;
  description: string;
  internalComplexity: string[];
}

const SECTIONS: FacadeSection[] = [
  {
    id: 'facade',
    name: '1. VideoConverter Facade (Clean API)',
    badge: 'UNIFIED FACADE',
    color: '#34d399', // Emerald
    interfaceType: 'Single Entrypoint Method: convertVideo(filename, format)',
    description: 'Provides a clean 1-line method interface to client applications, shielding them from 5 complex subsystem classes.',
    internalComplexity: [
      'Hides complex codec initialization calls',
      'Manages audio stream extraction and re-encoding automatically',
      'Handles file buffer flushing and temp file cleanup'
    ]
  },
  {
    id: 'subsystems',
    name: '2. Underlying Subsystem Classes',
    badge: 'COMPLEX SUBSYSTEM',
    color: '#fbbf24', // Amber
    interfaceType: '5 Micro-Services: VideoFile, CodecFactory, BitrateReader, AudioMixer, MPEG4Compressor',
    description: 'Intricate web of low-level video processing operations requiring specific execution sequence order.',
    internalComplexity: [
      'VideoFile.readBuffer() must run before CodecFactory.extract()',
      'AudioMixer.fixAudioOverlap() requires raw PCM buffer access',
      'BitrateReader.calculateBitrate() requires target bitrate metrics'
    ]
  }
];

export default function FacadeDiagram() {
  const [activeId, setActiveId] = useState<string>('facade');
  const current = SECTIONS.find(s => s.id === activeId) || SECTIONS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Facade Design Pattern: Simplified Gateway for Complex Subsystems</span>
      </div>

      {/* Selector Tabs */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {SECTIONS.map((sec) => {
            const isActive = activeId === sec.id;
            return (
              <div
                key={sec.id}
                onClick={() => setActiveId(sec.id)}
                style={{
                  background: isActive ? `${sec.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? sec.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: sec.color, background: `${sec.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {sec.badge}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {sec.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '4px' }}>
          {current.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', fontFamily: 'monospace' }}>
          {current.interfaceType}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {current.description}
        </div>

        <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '6px' }}>
            System Complexity Details
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            {current.internalComplexity.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
