import React, { useState } from 'react';

export default function DatabaseSecurityRbacDiagram(): React.JSX.Element {
  const [userInput, setUserInput] = useState<string>("' OR '1'='1");
  const [mode, setMode] = useState<'vulnerable' | 'parameterized'>('vulnerable');

  const unsafeQuery = `SELECT * FROM users WHERE username = '${userInput}' AND password = 'xxx';`;
  const safeQuery = `SELECT * FROM users WHERE username = ? AND password = ?;\n// Parameter 1 bound as literal string: "${userInput}"`;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Database Security: SQL Injection & Parameterized Query PreparedStatement Simulator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Input Field */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', display: 'block', marginBottom: '4px' }}>
            Simulate Untrusted User Input (Username Field):
          </label>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: '#05070e',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#38bdf8',
              fontFamily: 'monospace',
              fontSize: '13px',
            }}
          />
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setMode('vulnerable')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: mode === 'vulnerable' ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: mode === 'vulnerable' ? 'rgba(248, 113, 113, 0.15)' : '#0c0e17',
              color: mode === 'vulnerable' ? '#f87171' : 'var(--ifm-color-content-secondary)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ❌ String Concatenation (Vulnerable)
          </button>

          <button
            onClick={() => setMode('parameterized')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: mode === 'parameterized' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: mode === 'parameterized' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17',
              color: mode === 'parameterized' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✅ Parameterized PreparedStatement (Safe)
          </button>
        </div>

        {/* Output Code & Outcome */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: mode === 'vulnerable' ? '1px solid #f87171' : '1px solid #34d399' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
            Generated SQL Command Executed by Engine:
          </div>
          <pre style={{ margin: '0 0 12px 0', padding: '10px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: mode === 'vulnerable' ? '#f87171' : '#34d399', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
            <code>{mode === 'vulnerable' ? unsafeQuery : safeQuery}</code>
          </pre>

          <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
            {mode === 'vulnerable' ? (
              <span style={{ color: '#f87171', fontWeight: 600 }}>
                🚨 VULNERABILITY EXPLOITED! The string input alters the AST syntax structure. `WHERE '1'='1'` evaluates to true for EVERY row, dumping the entire database user table and bypassing authentication completely!
              </span>
            ) : (
              <span style={{ color: '#34d399', fontWeight: 600 }}>
                ✅ SAFE FROM INJECTION! The SQL AST parser compiled the query structure FIRST. The user input is safely bound as a raw literal string constant. The database searches for a literal username string equal to <code>"{userInput}"</code> and returns 0 rows.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
