import React, { useState } from 'react';

interface FileNode {
  name: string;
  isFolder: boolean;
  color: string;
  desc: string;
  detail?: string;
  children?: FileNode[];
}

const JAR_TREE: FileNode = {
  name: 'my-app.jar (Fat JAR)',
  isFolder: true,
  color: '#34d399',
  desc: 'Executable Fat JAR containing all application components, compiled classes, and libraries.',
  children: [
    {
      name: 'BOOT-INF',
      isFolder: true,
      color: '#38bdf8',
      desc: 'Holds the main application components, classes, and library dependencies.',
      children: [
        {
          name: 'classes/',
          isFolder: true,
          color: '#38bdf8',
          desc: 'Your compiled custom java files (controllers, services, entities).',
          detail: 'All compiled user class files live here. These are loaded directly into the child application context on startup.',
        },
        {
          name: 'lib/',
          isFolder: true,
          color: '#a78bfa',
          desc: 'Nested third-party dependency JARs (Spring frameworks, Hibernate, database drivers).',
          detail: 'Spring Boot packages libraries inside lib/ directly. Standard classloaders cannot read nested jars, which is why a custom ClassLoader is needed.',
        },
        {
          name: 'classpath.idx',
          isFolder: false,
          color: '#fbbf24',
          desc: 'Class path index listing the exact loading order of library JAR files.',
          detail: 'Ensures reliable classpath order loading, preventing inconsistent class definition overrides across different runs.',
        },
      ],
    },
    {
      name: 'META-INF',
      isFolder: true,
      color: '#f472b6',
      desc: 'Contains jar manifest meta descriptions and parameters.',
      children: [
        {
          name: 'MANIFEST.MF',
          isFolder: false,
          color: '#f472b6',
          desc: 'Declares JarLauncher as Main-Class and your application as Start-Class.',
          detail: `Manifest-Version: 1.0\nMain-Class: org.springframework.boot.loader.JarLauncher\nStart-Class: com.example.MyApplication\nSpring-Boot-Version: 3.x`,
        },
      ],
    },
    {
      name: 'org/springframework/boot/loader',
      isFolder: true,
      color: '#2dd4bf',
      desc: 'Custom classloader code packaged directly in the root of the JAR.',
      children: [
        {
          name: 'JarLauncher.class',
          isFolder: false,
          color: '#2dd4bf',
          desc: 'Bootstrap entry point loaded by the JVM first.',
          detail: 'Initializes the custom ClassLoader, maps the nested lib/ jars to the classpath, and delegates execution context to the Start-Class.',
        },
      ],
    },
  ],
};

export default function SpringBootFatJarDiagram(): React.JSX.Element {
  const [selectedNode, setSelectedNode] = useState<FileNode | null>({
    name: 'JarLauncher.class',
    isFolder: false,
    color: '#2dd4bf',
    desc: 'Bootstrap entry point loaded by the JVM first.',
    detail: 'Initializes the custom ClassLoader, maps the nested lib/ jars to the classpath, and delegates execution context to the Start-Class.',
  });

  function renderTree(node: FileNode, depth = 0) {
    const isSelected = selectedNode?.name === node.name;
    return (
      <div key={node.name} style={{ marginLeft: `${depth * 14}px` }}>
        <div
          onClick={() => setSelectedNode(node)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 8px', borderRadius: '4px', cursor: 'pointer',
            background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
            margin: '2px 0',
          }}
        >
          <span style={{ fontSize: '11.5px' }}>{node.isFolder ? '📁' : '📄'}</span>
          <span style={{
            fontSize: '11px', fontFamily: 'monospace', fontWeight: 600,
            color: node.isFolder ? 'var(--ifm-color-content-secondary)' : node.color,
          }}>
            {node.name.split('/').pop()}
          </span>
        </div>
        {node.children && node.children.map(child => renderTree(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <span>Executable Fat JAR Packaging Structure</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px' }}>
        
        {/* Tree List */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '2px',
        }}>
          {renderTree(JAR_TREE)}
        </div>

        {/* Detail Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: selectedNode ? 'flex-start' : 'center',
        }}>
          {selectedNode ? (
            <div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: selectedNode.color, fontFamily: 'monospace', display: 'block', marginBottom: '6px' }}>
                {selectedNode.name.split('/').pop()}
              </span>
              <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5, marginBottom: '10px' }}>
                {selectedNode.desc}
              </p>

              {selectedNode.detail && (
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: selectedNode.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Context Detail
                  </div>
                  <pre style={{
                    fontFamily: 'monospace', fontSize: '10.5px', margin: 0,
                    background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px',
                    color: '#e2e8f0', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                  }}>
                    {selectedNode.detail}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              💡 Click on any directory node in the executable JAR structure on the left to inspect loader specifications.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
