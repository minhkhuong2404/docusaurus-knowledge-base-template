import React, { useState } from 'react';

export default function NginxGotchasChecklistDiagram() {
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({
    lua: true,
    workers: true,
    headers: false,
    addheader: false,
    realip: true,
    rlimit: true
  });

  const toggleItem = (key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const total = Object.keys(checkedItems).length;
  const completed = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <span>Nginx Production Pre-Flight Audit Checklist ({completed}/{total} Verified)</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '10px 0' }} className="checklist-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .checklist-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        <div onClick={() => toggleItem('lua')} style={{
          padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          background: checkedItems.lua ? '#34d39912' : 'rgba(255,255,255,0.03)',
          boxShadow: checkedItems.lua ? '0 0 0 1px #34d39940' : '0 0 0 1px rgba(255,255,255,0.06)'
        }}>
          <input type="checkbox" checked={checkedItems.lua} readOnly />
          <span style={{ fontSize: '11.5px', color: '#e2e8f0' }}>Non-blocking async Lua cosockets used</span>
        </div>

        <div onClick={() => toggleItem('workers')} style={{
          padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          background: checkedItems.workers ? '#34d39912' : 'rgba(255,255,255,0.03)',
          boxShadow: checkedItems.workers ? '0 0 0 1px #34d39940' : '0 0 0 1px rgba(255,255,255,0.06)'
        }}>
          <input type="checkbox" checked={checkedItems.workers} readOnly />
          <span style={{ fontSize: '11.5px', color: '#e2e8f0' }}>worker_processes set to auto with affinity</span>
        </div>

        <div onClick={() => toggleItem('headers')} style={{
          padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          background: checkedItems.headers ? '#34d39912' : 'rgba(255,255,255,0.03)',
          boxShadow: checkedItems.headers ? '0 0 0 1px #34d39940' : '0 0 0 1px rgba(255,255,255,0.06)'
        }}>
          <input type="checkbox" checked={checkedItems.headers} readOnly />
          <span style={{ fontSize: '11.5px', color: '#e2e8f0' }}>proxy_set_header Connection "" set</span>
        </div>

        <div onClick={() => toggleItem('addheader')} style={{
          padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          background: checkedItems.addheader ? '#34d39912' : 'rgba(255,255,255,0.03)',
          boxShadow: checkedItems.addheader ? '0 0 0 1px #34d39940' : '0 0 0 1px rgba(255,255,255,0.06)'
        }}>
          <input type="checkbox" checked={checkedItems.addheader} readOnly />
          <span style={{ fontSize: '11.5px', color: '#e2e8f0' }}>add_header block inheritance verified</span>
        </div>
      </div>
    </div>
  );
}
