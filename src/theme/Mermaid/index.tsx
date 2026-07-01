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

  // Mouse drag handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only drag with left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
      dangerouslySetInnerHTML={{ __html: renderResult.svg }}
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
