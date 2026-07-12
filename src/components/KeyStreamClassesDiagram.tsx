import React, { useState } from 'react';

interface StreamClass {
  name: string;
  purpose: string;
  role: 'Source/Sink' | 'Decorator' | 'Adapter';
  example: string;
  note: string;
}

const INPUT_STREAMS: StreamClass[] = [
  {
    name: 'FileInputStream',
    purpose: 'Reads raw bytes from a file on disk.',
    role: 'Source/Sink',
    example: 'new FileInputStream("input.dat")',
    note: 'Good for binary data (images, compressed files). Triggers system call for every read operation unless buffered.',
  },
  {
    name: 'ByteArrayInputStream',
    purpose: 'Reads bytes from an in-memory byte array.',
    role: 'Source/Sink',
    example: 'new ByteArrayInputStream(byteArray)',
    note: 'Useful when you have data already in memory and want to parse it using stream APIs.',
  },
  {
    name: 'BufferedInputStream',
    purpose: 'Adds memory buffering to reduce slow system calls.',
    role: 'Decorator',
    example: 'new BufferedInputStream(new FileInputStream("input.dat"))',
    note: 'Reads large chunks (default 8KB) into memory. Always wrap physical streams in this for performance.',
  },
  {
    name: 'DataInputStream',
    purpose: 'Reads machine-independent Java primitive types.',
    role: 'Decorator',
    example: 'new DataInputStream(new BufferedInputStream(new FileInputStream("data.bin")))',
    note: 'Allows reading fields like readInt(), readDouble() directly from the stream in binary format.',
  },
  {
    name: 'ObjectInputStream',
    purpose: 'Deserializes Java objects written by ObjectOutputStream.',
    role: 'Decorator',
    example: 'new ObjectInputStream(new FileInputStream("object.ser"))',
    note: 'Deserializes objects from stream. Warning: poses severe security risks if used with untrusted input.',
  },
];

const OUTPUT_STREAMS: StreamClass[] = [
  {
    name: 'FileOutputStream',
    purpose: 'Writes raw bytes to a file on disk.',
    role: 'Source/Sink',
    example: 'new FileOutputStream("output.dat")',
    note: 'Creates or overwrites a file. Triggers a system call per write unless wrapped in BufferedOutputStream.',
  },
  {
    name: 'ByteArrayOutputStream',
    purpose: 'Writes bytes into an in-memory buffer that grows dynamically.',
    role: 'Source/Sink',
    example: 'new ByteArrayOutputStream()',
    note: 'Use to accumulate bytes before sending them over the network or saving to a file.',
  },
  {
    name: 'BufferedOutputStream',
    purpose: 'Buffers write operations to minimize system calls.',
    role: 'Decorator',
    example: 'new BufferedOutputStream(new FileOutputStream("output.dat"))',
    note: 'Stores bytes in a buffer and flushes them to disk only when the buffer is full or flush() is called.',
  },
  {
    name: 'DataOutputStream',
    purpose: 'Writes primitive Java data types in binary format.',
    role: 'Decorator',
    example: 'new DataOutputStream(new FileOutputStream("data.bin"))',
    note: 'Provides methods like writeInt(), writeBoolean() to serialize primitives.',
  },
  {
    name: 'ObjectOutputStream',
    purpose: 'Serializes Java objects to an underlying stream.',
    role: 'Decorator',
    example: 'new ObjectOutputStream(new FileOutputStream("object.ser"))',
    note: 'Class must implement java.io.Serializable. Writes object graphs to the output sink.',
  },
];

const READERS: StreamClass[] = [
  {
    name: 'FileReader',
    purpose: 'Reads text characters from a file on disk.',
    role: 'Source/Sink',
    example: 'new FileReader("text.txt")',
    note: 'Reads 16-bit characters. Uses system default character encoding unless specified otherwise.',
  },
  {
    name: 'InputStreamReader',
    purpose: 'Bridges byte streams to character streams.',
    role: 'Adapter',
    example: 'new InputStreamReader(new FileInputStream("text.txt"), StandardCharsets.UTF_8)',
    note: 'Crucial bridge component. Translates binary bytes to characters using a specified charset.',
  },
  {
    name: 'BufferedReader',
    purpose: 'Buffers character inputs and provides line-by-line reading.',
    role: 'Decorator',
    example: 'new BufferedReader(new FileReader("text.txt"))',
    note: 'Extremely common for text parsing. Provides the convenient readLine() method.',
  },
  {
    name: 'StringReader',
    purpose: 'Adapts a Java String into a Character Reader.',
    role: 'Source/Sink',
    example: 'new StringReader("sample text")',
    note: 'Helpful for testing components that expect a Reader without creating a physical file.',
  },
];

const WRITERS: StreamClass[] = [
  {
    name: 'FileWriter',
    purpose: 'Writes text characters to a file on disk.',
    role: 'Source/Sink',
    example: 'new FileWriter("text.txt")',
    note: 'Encodes characters to bytes before writing to disk using system default charset.',
  },
  {
    name: 'OutputStreamWriter',
    purpose: 'Bridges character streams to byte streams.',
    role: 'Adapter',
    example: 'new OutputStreamWriter(new FileOutputStream("text.txt"), StandardCharsets.UTF_8)',
    note: 'Acts as an adapter that converts characters to bytes using a specific charset decoder.',
  },
  {
    name: 'BufferedWriter',
    purpose: 'Buffers character output streams for performance.',
    role: 'Decorator',
    example: 'new BufferedWriter(new FileWriter("text.txt"))',
    note: 'Avoids frequent disk writes by accumulation in memory.',
  },
  {
    name: 'PrintWriter',
    purpose: 'Provides formatted printing of text data.',
    role: 'Decorator',
    example: 'new PrintWriter(new BufferedWriter(new FileWriter("log.txt")))',
    note: 'Adds methods like print(), println(), format(). Does not throw IOException; sets internal error flag instead.',
  },
];

const CATEGORIES = [
  { id: 'input', label: 'InputStream (Byte Input)', color: '#38bdf8', data: INPUT_STREAMS },
  { id: 'output', label: 'OutputStream (Byte Output)', color: '#34d399', data: OUTPUT_STREAMS },
  { id: 'reader', label: 'Reader (Char Input)', color: '#fbbf24', data: READERS },
  { id: 'writer', label: 'Writer (Char Output)', color: '#a78bfa', data: WRITERS },
];

export default function KeyStreamClassesDiagram(): React.JSX.Element {
  const [activeCat, setActiveCat] = useState('input');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const currentCat = CATEGORIES.find(c => c.id === activeCat)!;
  const filteredData = currentCat.data.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.purpose.toLowerCase().includes(search.toLowerCase())
  );
  
  const selectedDetails = currentCat.data.find(c => c.name === selectedClass);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        <span>Classic I/O Stream Classes Explorer</span>
        <input
          type="text"
          placeholder="Filter stream classes..."
          value={search}
          onChange={e => { setSearch(e.target.value); setSelectedClass(null); }}
          style={{
            marginLeft: 'auto', padding: '6px 12px', borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.05)', color: 'var(--ifm-color-content)',
            fontSize: '12px', outline: 'none', width: '180px',
          }}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => { setActiveCat(c.id); setSelectedClass(null); setSearch(''); }}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              background: activeCat === c.id ? `${c.color}18` : 'rgba(255,255,255,0.04)',
              color: activeCat === c.id ? c.color : 'var(--ifm-color-content-secondary)',
              boxShadow: activeCat === c.id ? `0 0 0 1.5px ${c.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid container */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* List of classes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
          {filteredData.map(c => {
            const roleColor = c.role === 'Decorator' ? '#fbbf24' : c.role === 'Adapter' ? '#a78bfa' : '#38bdf8';
            return (
              <button
                key={c.name}
                onClick={() => setSelectedClass(selectedClass === c.name ? null : c.name)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: '4px',
                  padding: '10px 14px', borderRadius: '8px', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  background: selectedClass === c.name ? `${currentCat.color}15` : 'rgba(255,255,255,0.03)',
                  boxShadow: selectedClass === c.name
                    ? `0 0 0 1.5px ${currentCat.color}50`
                    : '0 0 0 1px rgba(255,255,255,0.07)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <code style={{ fontSize: '13px', fontWeight: 700, color: currentCat.color }}>
                    {c.name}
                  </code>
                  <span style={{
                    fontSize: '9.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                    background: `${roleColor}15`, color: roleColor, border: `1px solid ${roleColor}30`
                  }}>
                    {c.role}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                  {c.purpose}
                </span>
              </button>
            );
          })}
          {filteredData.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ifm-color-content-secondary)' }}>
              No classes matched.
            </div>
          )}
        </div>

        {/* Details Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: selectedDetails ? 'flex-start' : 'center'
        }}>
          {selectedDetails ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: currentCat.color }}>
                  {selectedDetails.name}
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: selectedDetails.role === 'Decorator' ? '#fbbf24' : selectedDetails.role === 'Adapter' ? '#a78bfa' : '#38bdf8'
                }}>
                  {selectedDetails.role} Pattern
                </span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: currentCat.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  Purpose
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                  {selectedDetails.purpose}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: currentCat.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  Code Example
                </div>
                <div style={{
                  fontFamily: 'monospace', fontSize: '11.5px',
                  background: 'rgba(0,0,0,0.3)', borderRadius: '6px',
                  padding: '8px 10px', color: '#e2e8f0', wordBreak: 'break-all'
                }}>
                  {selectedDetails.example}
                </div>
              </div>

              <div style={{
                background: `${currentCat.color}08`, border: `1px solid ${currentCat.color}30`,
                borderRadius: '8px', padding: '10px 12px'
              }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: currentCat.color, marginBottom: '3px' }}>
                  Implementation Note / Gotcha
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  {selectedDetails.note}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              Select a stream class to inspect details, patterns, and examples.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
