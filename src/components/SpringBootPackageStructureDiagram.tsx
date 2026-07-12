import React, { useState } from 'react';

interface FileNode {
  name: string;
  isFolder: boolean;
  desc: string;
  status: 'scanned' | 'missed' | 'main';
  children?: FileNode[];
}

const CORRECT_TREE: FileNode = {
  name: 'com.myapp',
  isFolder: true,
  status: 'scanned',
  desc: 'Root package. Scan boundary starts here (com.myapp.*)',
  children: [
    { name: 'MyApplication.java', isFolder: false, status: 'main', desc: 'Main class with @SpringBootApplication annotation. Triggers ComponentScan on com.myapp.' },
    {
      name: 'controller',
      isFolder: true,
      status: 'scanned',
      desc: 'Sub-package within boundary.',
      children: [{ name: 'UserController.java', isFolder: false, status: 'scanned', desc: 'Annotated with @RestController. Successfully scanned & loaded!' }],
    },
    {
      name: 'service',
      isFolder: true,
      status: 'scanned',
      desc: 'Sub-package within boundary.',
      children: [{ name: 'UserService.java', isFolder: false, status: 'scanned', desc: 'Annotated with @Service. Successfully scanned & loaded!' }],
    },
    {
      name: 'repository',
      isFolder: true,
      status: 'scanned',
      desc: 'Sub-package within boundary.',
      children: [{ name: 'UserRepository.java', isFolder: false, status: 'scanned', desc: 'Annotated with @Repository. Successfully scanned & loaded!' }],
    },
  ],
};

const WRONG_TREE: FileNode = {
  name: 'com.myapp',
  isFolder: true,
  status: 'missed',
  desc: 'Outer package. Outside ComponentScan scope of MyApplication.',
  children: [
    {
      name: 'config',
      isFolder: true,
      status: 'scanned',
      desc: 'Root scan boundary starts here (com.myapp.config.*)',
      children: [
        { name: 'MyApplication.java', isFolder: false, status: 'main', desc: 'Main class with @SpringBootApplication. ComponentScan starts at com.myapp.config and scans sub-folders.' },
      ],
    },
    {
      name: 'controller',
      isFolder: true,
      status: 'missed',
      desc: 'Outside scan boundary (com.myapp.controller is NOT a sub-package of com.myapp.config).',
      children: [{ name: 'UserController.java', isFolder: false, status: 'missed', desc: 'Annotated with @RestController, but NOT found. Bean is completely missing in context!' }],
    },
    {
      name: 'service',
      isFolder: true,
      status: 'missed',
      desc: 'Outside scan boundary.',
      children: [{ name: 'UserService.java', isFolder: false, status: 'missed', desc: 'Annotated with @Service, but NOT found. Injection will fail with NoSuchBeanDefinitionException!' }],
    },
  ],
};

export default function SpringBootPackageStructureDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'correct' | 'wrong'>('correct');
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);

  const root = activeTab === 'correct' ? CORRECT_TREE : WRONG_TREE;
  const themeColor = activeTab === 'correct' ? '#34d399' : '#f87171';

  function renderTree(node: FileNode, depth = 0) {
    const isSelected = selectedNode?.name === node.name;
    const statusColor = node.status === 'main' ? '#fbbf24' : node.status === 'scanned' ? '#34d399' : '#f87171';

    return (
      <div key={node.name} style={{ marginLeft: `${depth * 16}px` }}>
        <div
          onClick={() => setSelectedNode(node)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 8px', borderRadius: '4px', cursor: 'pointer',
            background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
            transition: 'background 0.2s', margin: '2px 0',
          }}
        >
          <span style={{ fontSize: '12px' }}>{node.isFolder ? '📁' : '📄'}</span>
          <span style={{
            fontSize: '12.5px', fontFamily: 'monospace', fontWeight: 600,
            color: node.status === 'main' ? '#fbbf24' : node.status === 'scanned' ? 'var(--ifm-color-content)' : 'var(--ifm-color-content-secondary)',
          }}>
            {node.name}
          </span>
          <span style={{
            fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px',
            background: `${statusColor}15`, color: statusColor,
          }}>
            {node.status === 'main' ? 'MAIN APP' : node.status === 'scanned' ? 'SCANNED' : 'MISSED'}
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
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span>Component Scan Package Structure Gotcha</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => { setActiveTab('correct'); setSelectedNode(null); }}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
            cursor: 'pointer', fontWeight: 700, fontSize: '13px',
            background: activeTab === 'correct' ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'correct' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'correct' ? '0 0 0 1.5px rgba(52,211,153,0.4)' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ✓ Correct Structure (Hierarchy-based)
        </button>
        <button
          onClick={() => { setActiveTab('wrong'); setSelectedNode(null); }}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
            cursor: 'pointer', fontWeight: 700, fontSize: '13px',
            background: activeTab === 'wrong' ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'wrong' ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'wrong' ? '0 0 0 1.5px rgba(248,113,113,0.4)' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ✗ Wrong Structure (Parallel packages)
        </button>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        
        {/* Package Tree */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          {renderTree(root)}
        </div>

        {/* Node detail panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: selectedNode ? 'flex-start' : 'center',
        }}>
          {selectedNode ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px' }}>{selectedNode.isFolder ? '📁' : '📄'}</span>
                <span style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: selectedNode.status === 'main' ? '#fbbf24' : selectedNode.status === 'scanned' ? '#34d399' : '#f87171' }}>
                  {selectedNode.name}
                </span>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Scanning Status
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                  background: selectedNode.status === 'main' ? 'rgba(251,191,36,0.15)' : selectedNode.status === 'scanned' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                  color: selectedNode.status === 'main' ? '#fbbf24' : selectedNode.status === 'scanned' ? '#34d399' : '#f87171',
                }}>
                  {selectedNode.status === 'main' ? 'Main Startup Class' : selectedNode.status === 'scanned' ? 'Scanned Successfully' : 'Component Scan Missed'}
                </span>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Scan Behavior Detail
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                  {selectedNode.desc}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              💡 Click on any folder or file inside the package hierarchy tree to check its component scanning detail.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
