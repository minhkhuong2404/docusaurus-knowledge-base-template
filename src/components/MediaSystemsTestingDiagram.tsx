import React, { useState } from 'react';

type MediaTab = 'transcoding' | 'drm' | 'k6-load' | 'statsig';

export default function MediaSystemsTestingDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<MediaTab>('transcoding');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .media-grid-layout {
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
          stroke="#fbbf24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Media Streaming Pipelines, DRM & Modern Production Testing
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'transcoding', label: '🎬 Video Transcoding & ABR', color: '#fbbf24' },
            { id: 'drm', label: '🔒 DRM & CDM Key Exchange', color: '#f87171' },
            { id: 'k6-load', label: '📊 k6 Load Testing & Coordinated Omission', color: '#38bdf8' },
            { id: 'statsig', label: '🧪 Statsig & CUPED Experimentation', color: '#34d399' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as MediaTab)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255, 255, 255, 0.1)'}`,
                background: activeTab === t.id ? `${t.color}22` : 'transparent',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas with Dynamic Flowing Conduits */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg
          viewBox="0 0 940 180"
          className="interactive-diagram-svg"
          style={{ minHeight: '180px' }}
          role="img"
          aria-label="Video streaming chunk pipeline and adaptive bitrate delivery"
        >
          <defs>
            <marker
              id="arrow-amber-med"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
            </marker>
            <marker
              id="arrow-green-med"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
            </marker>
          </defs>

          {/* Raw Video Upload */}
          <g>
            <rect x="30" y="45" width="160" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#fbbf24" strokeWidth="1.5" />
            <circle cx="55" cy="72" r="14" fill="#fbbf2422" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="55" y="77" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="800">1</text>
            <text x="115" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Raw Ingestion</text>
            <text x="115" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">ProRes / MP4 Source</text>
            <text x="115" y="112" textAnchor="middle" fill="#fbbf24" fontSize="9.5" fontWeight="600">S3 Multi-Part Upload</text>
          </g>

          {/* Flow Line 1 to 2 */}
          <line x1="190" y1="90" x2="270" y2="90" stroke="#fbbf24" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="190"
            y1="90"
            x2="270"
            y2="90"
            stroke="#fbbf24"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-amber-med)"
          />

          {/* Parallel Chunk Transcoder Fleet */}
          <g>
            <rect x="275" y="45" width="180" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="300" cy="72" r="14" fill="#38bdf822" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="300" y="77" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="800">2</text>
            <text x="370" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Chunk Transcoder</text>
            <text x="370" y="88" textAnchor="middle" fill="#38bdf8" fontSize="10">FFmpeg / GPU Fleet</text>
            <text x="370" y="112" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">4s GOP Chunks (H.264/AV1)</text>
          </g>

          {/* Flow Line 2 to 3 */}
          <line x1="455" y1="90" x2="535" y2="90" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="455"
            y1="90"
            x2="535"
            y2="90"
            stroke="#38bdf8"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
          />

          {/* ABR Manifest Generator */}
          <g>
            <rect x="540" y="45" width="180" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#a78bfa" strokeWidth="1.5" />
            <circle cx="565" cy="72" r="14" fill="#a78bfa22" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="565" y="77" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="800">3</text>
            <text x="635" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">ABR Ladder Gen</text>
            <text x="635" y="88" textAnchor="middle" fill="#a78bfa" fontSize="10">HLS (m3u8) / DASH (mpd)</text>
            <text x="635" y="112" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">1080p, 720p, 480p, 360p</text>
          </g>

          {/* Flow Line 3 to 4 */}
          <line x1="720" y1="90" x2="795" y2="90" stroke="#34d399" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="720"
            y1="90"
            x2="795"
            y2="90"
            stroke="#34d399"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-green-med)"
          />

          {/* Client Playback Player */}
          <g>
            <rect x="800" y="45" width="120" height="90" rx="10" fill="rgba(6, 78, 59, 0.25)" stroke="#34d399" strokeWidth="1.5" />
            <circle cx="820" cy="72" r="14" fill="#34d39922" stroke="#34d399" strokeWidth="1.5" />
            <text x="820" y="77" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">▶</text>
            <text x="860" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11" fontWeight="700">Player Edge</text>
            <text x="860" y="88" textAnchor="middle" fill="#34d399" fontSize="9.5">MSE / Shaka</text>
            <text x="860" y="112" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Smooth Playback</text>
          </g>
        </svg>
      </div>

      {/* Details Split Pane */}
      {activeTab === 'transcoding' && (
        <div className="media-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #fbbf24' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Chunk-Based Video Transcoding Pipeline
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              Monolithic transcoding (transcoding a 2-hour 4K movie as a single job) takes 45 minutes; a failure at 90% requires restarting from zero.
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>
              <li><strong>Split into GOP Chunks:</strong> Split video at I-frame boundaries into 4-second independent chunks.</li>
              <li><strong>Distributed Worker Queue:</strong> Thousands of serverless workers or GPU spot instances transcode chunks in parallel in <strong>&lt; 2 minutes</strong>!</li>
              <li><strong>Stitching:</strong> An indexer writes the HLS <code>.m3u8</code> master playlist mapping chunks to quality tiers.</li>
            </ul>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#38bdf8', fontSize: '15px' }}>
              Adaptive Bitrate (ABR) Ladder Design
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              The video player measures download speeds per 4-second chunk:
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>
              <li><strong>Bandwidth Drop:</strong> If connection drops from 10 Mbps to 2 Mbps, the player seamlessly requests the next 4-second chunk in 720p without buffering or playback interruption.</li>
              <li><strong>Codec Selection:</strong> AV1 for modern mobile clients (saves 30% bandwidth over HEVC/H.264), falling back to H.264 for legacy browsers.</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'drm' && (
        <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #f87171', marginTop: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#f87171', fontSize: '15px' }}>
            Digital Rights Management (DRM): EME, CDM & Key Exchange
          </h4>
          <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            Encrypted Media Extensions (EME) allow browsers to play encrypted commercial streams without third-party plugins:
          </p>
          <div style={{ background: '#080a12', padding: '10px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11.5px', color: '#f87171' }}>
            <div>1. Video chunks encrypted with AES-128 CBC/CTR via Common Encryption (CENC).</div>
            <div style={{ color: '#fbbf24', marginTop: '4px' }}>2. Browser encounters encrypted initData ➔ fires needkey event to JavaScript player.</div>
            <div style={{ color: '#38bdf8', marginTop: '4px' }}>3. Browser asks native OS Content Decryption Module (CDM: Widevine on Chrome, FairPlay on Apple, PlayReady on Windows).</div>
            <div style={{ color: '#34d399', marginTop: '4px' }}>4. CDM sends license challenge to DRM License Server ➔ decrypts key directly in protected GPU hardware pipeline (never exposed to JavaScript memory).</div>
          </div>
        </div>
      )}

      {activeTab === 'k6-load' && (
        <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #38bdf8', marginTop: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#38bdf8', fontSize: '15px' }}>
            k6 Load Testing: Solving the Coordinated Omission Fallacy
          </h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.55 }}>
            Traditional load tools (JMeter, ApacheBench) execute requests in a closed loop (a thread sends a request, waits for a response, and only then sends the next).
          </p>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>
            <li><strong>Coordinated Omission:</strong> When the server stalls for 5 seconds under load, closed-loop tools stop sending requests during those 5 seconds. The tool reports artificially low 99th percentile latencies because it failed to measure the thousands of requests that would have arrived in reality!</li>
            <li><strong>k6 Open Model (Arrival Rate):</strong> k6 uses arrival-rate executors (<code>constant-arrival-rate</code>) to generate requests at fixed target rates regardless of whether previous requests have completed, exposing true production degradation.</li>
          </ul>
        </div>
      )}

      {activeTab === 'statsig' && (
        <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #34d399', marginTop: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#34d399', fontSize: '15px' }}>
            Statsig & Experimentation: Variance Reduction with CUPED
          </h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.55 }}>
            In A/B testing, detecting small improvements (e.g. +0.5% checkout conversion) traditionally requires weeks of traffic to achieve statistical significance ($p &lt; 0.05$).
          </p>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>
            <li><strong>CUPED (Controlled-experiment Using Pre-Experiment Data):</strong> Uses each user\'s pre-experiment historical baseline data to remove preexisting variance from the experiment metrics.</li>
            <li><strong>50% Faster Experiments:</strong> Shrinks metric variance by up to 50%, allowing product teams to reach statistically significant conclusions with half the sample size in half the time.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
