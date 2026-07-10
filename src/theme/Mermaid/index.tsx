import React, { useState, useRef, useEffect } from 'react';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import { ErrorBoundaryErrorMessageFallback } from '@docusaurus/theme-common';
import {
  MermaidContainerClassName,
  useMermaidRenderResult,
} from '@docusaurus/theme-mermaid/client';
import styles from './styles.module.css';

interface MermaidRenderResultProps {
  renderResult: any;
}

function MermaidRenderResult({ renderResult }: MermaidRenderResultProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Duplicate path elements to create a background solid connection line and a foreground flowing line
  const enhancedSvg = React.useMemo(() => {
    if (!renderResult?.svg) return '';
    return renderResult.svg.replace(
      /<path([^>]*)class="([^"]*(path|relation|messageLine)[^"]*)"([^>]*)>/g,
      (match: string, p1: string, p2: string, p3: string) => {
        const dMatch = match.match(/d="([^"]+)"/);
        if (!dMatch) return match;
        const d = dMatch[1];
        
        // Detect if path flows backwards (has marker-start in its attributes)
        const isReverse = match.includes('marker-start') || p1.includes('marker-start') || p3.includes('marker-start');
        
        if (isReverse) {
          return `<path class="path-bg flow-reverse" d="${d}" />${match.replace('class="', 'class="flow-reverse ')}`;
        }
        return `<path class="path-bg" d="${d}" />${match}`;
      }
    );
  }, [renderResult.svg]);

  useEffect(() => {
    const div = containerRef.current;
    renderResult.bindFunctions?.(div);
  }, [renderResult]);

  // Handle Zoom In
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 4));
  };

  // Handle Zoom Out
  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.4));
  };

  // Handle Reset
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Toggle Full Screen Overlay
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Reset view when entering or exiting fullscreen
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const [clickStart, setClickStart] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeLabel, setSelectedNodeLabel] = useState<string | null>(null);

  // Mouse drag handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only drag with left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    setClickStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    
    // Calculate movement distance to distinguish dragging from clicking
    const dx = Math.abs(e.clientX - clickStart.x);
    const dy = Math.abs(e.clientY - clickStart.y);
    if (dx < 5 && dy < 5) {
      // It's a click!
      const target = e.target as SVGElement;
      const nodeGroup = target.closest('.node');
      if (nodeGroup) {
        const nodeId = nodeGroup.id || '';
        const labelEl = nodeGroup.querySelector('.label') || nodeGroup.querySelector('text');
        const labelText = labelEl ? labelEl.textContent || '' : 'Node Details';
        setSelectedNodeId(nodeId);
        setSelectedNodeLabel(labelText.trim());
      } else {
        setSelectedNodeId(null);
        setSelectedNodeLabel(null);
      }
    }
  };

  // Touch handlers for mobile pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // 1. Reset all nodes
    container.querySelectorAll('.node').forEach((node) => {
      node.classList.remove('node-active-cyan');
      (node as HTMLElement).style.opacity = '';
    });
    
    // 2. Reset all paths
    container.querySelectorAll('.path, .relation, .messageLine, .path-bg').forEach((path) => {
      (path as HTMLElement).style.opacity = '';
      (path as HTMLElement).style.strokeWidth = '';
    });
    
    if (selectedNodeId) {
      // 3. Highlight selected node
      const allNodes = container.querySelectorAll('.node');
      allNodes.forEach((node) => {
        const isMatch = node.id === selectedNodeId || node.classList.contains(selectedNodeId) || node.id.includes(selectedNodeId) || selectedNodeId.includes(node.id);
        if (isMatch) {
          node.classList.add('node-active-cyan');
          (node as HTMLElement).style.opacity = '1';
        } else {
          (node as HTMLElement).style.opacity = '0.35';
        }
      });
      
      // 4. Highlight connected paths
      container.querySelectorAll('.path, .relation, .messageLine').forEach((path) => {
        const classList = path.classList;
        let isConnected = false;
        classList.forEach((cls) => {
          if (cls.includes(selectedNodeId) || selectedNodeId.includes(cls)) {
            isConnected = true;
          }
        });
        
        if (isConnected) {
          (path as HTMLElement).style.opacity = '1';
          (path as HTMLElement).style.strokeWidth = '2.5px';
          
          const prevSibling = path.previousElementSibling;
          if (prevSibling && prevSibling.classList.contains('path-bg')) {
            (prevSibling as HTMLElement).style.opacity = '1';
            (prevSibling as HTMLElement).style.strokeWidth = '3.5px';
          }
        } else {
          (path as HTMLElement).style.opacity = '0.25';
          const prevSibling = path.previousElementSibling;
          if (prevSibling && prevSibling.classList.contains('path-bg')) {
            (prevSibling as HTMLElement).style.opacity = '0.15';
          }
        }
      });
    }
  }, [selectedNodeId, enhancedSvg]);

  // Render controls toolbar
  const controls = (
    <div className={styles.toolbar}>
      <button onClick={handleZoomIn} title="Zoom In" className={styles.btn} type="button">
        ➕
      </button>
      <button onClick={handleZoomOut} title="Zoom Out" className={styles.btn} type="button">
        ➖
      </button>
      <button onClick={handleReset} title="Reset View" className={styles.btn} type="button">
        🔄
      </button>
      <button onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} className={styles.btn} type="button">
        {isFullscreen ? "📴" : "🖥️"}
      </button>
    </div>
  );

  const containerContent = (
    <div
      ref={containerRef}
      className={`${MermaidContainerClassName} ${styles.mermaidSvg}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        transformOrigin: 'center center',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
      }}
      dangerouslySetInnerHTML={{ __html: enhancedSvg }}
    />
  );

  if (isFullscreen) {
    return (
      <div className={styles.fullscreenOverlay}>
        <div 
          className={styles.fullscreenWrapper}
          ref={wrapperRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {containerContent}
        </div>
        {controls}
      </div>
    );
  }

  return (
    <div className={styles.interactiveContainer}>
      <div
        className={styles.viewerWrapper}
        ref={wrapperRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {containerContent}
      </div>
      {controls}
      
      {/* Dynamic Global Diagram Inspector Card Footer */}
      <div className="interactive-diagram-details-card details-cyan" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '0 0 16px 16px', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', minHeight: 'auto', padding: '1rem 1.25rem' }}>
        <div className="interactive-diagram-card-header" style={{ marginBottom: '0.5rem', paddingBottom: '0.25rem' }}>
          <span className="interactive-diagram-indicator-dot card-indicator-cyan" />
          <h3 style={{ fontSize: '0.95rem' }}>{selectedNodeLabel ? 'Component Details' : 'Diagram Inspector'}</h3>
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem' }}>
          {selectedNodeLabel ? (
            <>
              <strong>Node Content:</strong> {selectedNodeLabel}
            </>
          ) : (
            '💡 Click on any component or connection node in the diagram to inspect its contents.'
          )}
        </p>
      </div>
    </div>
  );
}

interface MermaidProps {
  value: string;
}

function MermaidRenderer({ value }: MermaidProps) {
  const renderResult = useMermaidRenderResult({ text: value });
  if (renderResult === null) {
    return null;
  }
  return <MermaidRenderResult renderResult={renderResult} />;
}

export default function Mermaid(props: MermaidProps) {
  return (
    <ErrorBoundary
      fallback={(params) => <ErrorBoundaryErrorMessageFallback {...params} />}
    >
      <MermaidRenderer {...props} />
    </ErrorBoundary>
  );
}
