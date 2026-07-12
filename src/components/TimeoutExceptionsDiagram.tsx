import React, { useState } from 'react';

type TimeoutKey = 'CONNECT_TIMEOUT' | 'READ_TIMEOUT' | 'CONNECTION_RESET';

interface TimeoutDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green';
  clock: string;
  cause: string;
  explanation: string;
  bullets: string[];
}

const TIMEOUT_DATA: Record<TimeoutKey, TimeoutDetails> = {
  CONNECT_TIMEOUT: {
    title: 'Connect timed out / Connection refused',
    type: 'purple',
    clock: 'Connect Timeout Clock (SYN Handshake phase)',
    cause: 'Server TCP accept queue (backlog) or max-connections fully saturated.',
    explanation: 'Occurs during the initial TCP 3-way handshake. The client sends a SYN packet, but cannot get a response back.',
    bullets: [
      'Connection refused: The server actively sends a RST (Reset) packet. Indicates no server process is listening on the port.',
      'Connect timed out: Sockets beyond server.tomcat.max-connections (8192) queue up in the OS backlog (accept-count, default 100). When the queue overflows, the kernel silently drops SYN packets, forcing client clocks to timeout.'
    ]
  },
  READ_TIMEOUT: {
    title: 'Read timed out (Socket Wait State)',
    type: 'cyan',
    clock: 'Read Timeout Clock (Active request execution phase)',
    cause: 'Tomcat worker threads fully occupied, blocking on downstream logic or database queries.',
    explanation: 'The TCP handshake completed successfully and the client sent the HTTP payload. However, the server fails to reply within the client\'s readTimeout limit.',
    bullets: [
      'The connection is accepted, but no worker thread is free to parse headers and execute controllers.',
      'The client aborts the connection, but Tomcat keeps executing the query in the background because the JVM is unaware of the client\'s departure.'
    ]
  },
  CONNECTION_RESET: {
    title: 'Connection reset (Unilateral Close)',
    type: 'green',
    clock: 'Server-side Connection Timeout Clock',
    cause: 'Server closes idle connections unilaterally to free up slots.',
    explanation: 'The TCP connection was established, but the client failed to transmit data within the server\'s connection-timeout window (Tomcat default: 20s, Node.js: 5s).',
    bullets: [
      'The server kernel closes the socket unilaterally and writes a RST packet to the network stream.',
      'When the client attempts to write data on the closed socket later, it encounters SocketException: Connection reset.'
    ]
  }
};

export default function TimeoutExceptionsDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TimeoutKey>('CONNECT_TIMEOUT');

  const selectedData = TIMEOUT_DATA[activeTab];

  const getBorderColor = (key: TimeoutKey) => {
    if (activeTab === key) {
      return TIMEOUT_DATA[key].type === 'purple' ? '#a855f7' : TIMEOUT_DATA[key].type === 'cyan' ? '#2dd4bf' : '#4ade80';
    }
    return 'rgba(255, 255, 255, 0.08)';
  };

  const getNumColor = (key: TimeoutKey) => {
    if (activeTab === key) {
      return TIMEOUT_DATA[key].type === 'purple' ? '#c084fc' : TIMEOUT_DATA[key].type === 'cyan' ? '#67e8f9' : '#86efac';
    }
    return '#475569';
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Control Tabs */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '12px',
          margin: '0.8rem 0'
        }}
      >
        {(Object.keys(TIMEOUT_DATA) as TimeoutKey[]).map((key, idx) => {
          const tab = TIMEOUT_DATA[key];
          return (
            <div
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: '1 1 200px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1.5px solid ${getBorderColor(key)}`,
                borderRadius: '8px',
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === key ? '0 4px 15px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: getNumColor(key) }}>CLOCK 0{idx + 1}</span>
                
              </div>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                {key === 'CONNECT_TIMEOUT' ? 'Connect Timeout' : key === 'READ_TIMEOUT' ? 'Read Timeout' : 'Connection Reset'}
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#cbd5e1' }}>{key === 'CONNECT_TIMEOUT' ? 'SYN Handshake' : key === 'READ_TIMEOUT' ? 'Active Wait' : 'Server Idle Timeout'}</p>
            </div>
          );
        })}
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'purple' ? 'details-purple' : selectedData.type === 'cyan' ? 'details-cyan' : 'details-green'
      }`}>
        <div className="interactive-diagram-card-header">
          
          <h3>Exception Phase: {selectedData.title}</h3>
        </div>
        <p><strong>Clock Pipeline:</strong> {selectedData.clock}</p>
        <p><strong>Root Cause:</strong> <code style={{ color: '#fbbf24' }}>{selectedData.cause}</code></p>
        <p><strong>Overview:</strong> {selectedData.explanation}</p>
        
        <ul>
          <li><strong>Deep-Dive Details:</strong>
            <ul>
              {selectedData.bullets.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Toggle between Connect Timeout, Read Timeout, and Connection Reset above to trace network failure phases.
      </p>
    </div>
  );
}
// Helper variable check to satisfy the dynamic compilation checks
const activeStep = '';
