import React, { useState, useRef } from 'react';
import OriginalCodeBlock from '@theme-original/CodeBlock';
import type { Props } from '@theme/CodeBlock';

// Helper to determine if a code block is an ASCII flow diagram
const isASCIIDiagram = (code: string, className?: string): boolean => {
  const hasTextLanguage = !className || className.includes('language-text') || className.includes('language-plaintext');
  if (!hasTextLanguage) return false;

  const boxCharacters = /[┌┐└┘├┤┬┴┼─│─]/;
  const arrowCharacters = /(──▶|──>|-->|->|▶|◀)/;
  return boxCharacters.test(code) || arrowCharacters.test(code);
};

export default function CodeBlock(props: Props): React.JSX.Element {
  const codeContent = typeof props.children === 'string' 
    ? props.children 
    : Array.isArray(props.children) 
      ? props.children.join('') 
      : '';

  if (!isASCIIDiagram(codeContent, props.className)) {
    return <OriginalCodeBlock {...props} />;
  }

  // Interactive ASCII Diagram State
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleZoom = (factor: number) => {
    setScale(prev => Math.min(Math.max(prev * factor, 0.6), 2));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="interactive-diagram-container" ref={containerRef} style={{ margin: '1.5rem 0' }}>
      <div 
        className="interactive-diagram-card-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.6rem 1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span 
            className="interactive-diagram-indicator-dot card-indicator-cyan" 
            style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2dd4bf' }}
          />
          <h3 style={{ margin: '0 !important', fontSize: '0.9rem', fontWeight: 700, color: '#2dd4bf !important' }}>
            📊 Monospace Schema Inspector
          </h3>
        </div>
        
        {/* Pan / Zoom Canvas Toolbar */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={() => handleZoom(1.1)} 
            title="Zoom In"
            style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '4px', color: '#cbd5e1', cursor: 'pointer', padding: '2px 8px', fontSize: '0.8rem' }}
          >
            ＋
          </button>
          <button 
            onClick={() => handleZoom(0.9)} 
            title="Zoom Out"
            style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '4px', color: '#cbd5e1', cursor: 'pointer', padding: '2px 8px', fontSize: '0.8rem' }}
          >
            －
          </button>
          <button 
            onClick={handleReset} 
            title="Reset"
            style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '4px', color: '#cbd5e1', cursor: 'pointer', padding: '2px 8px', fontSize: '0.8rem' }}
          >
            ⟲
          </button>
        </div>
      </div>

      {/* Interactive ASCII drag-canvas */}
      <div 
        className="interactive-diagram-grid-bg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        style={{
          position: 'relative',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          height: '240px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0d14',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            whiteSpace: 'pre',
            fontFamily: 'Fira Code, monospace',
            fontSize: '0.85rem',
            color: '#818cf8',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        >
          {codeContent}
        </div>
      </div>

      <p className="interactive-diagram-helper-text" style={{ padding: '0.4rem 0' }}>
        💡 Drag the schema to pan. Use (+ / -) to zoom into specific block elements.
      </p>
    </div>
  );
}
