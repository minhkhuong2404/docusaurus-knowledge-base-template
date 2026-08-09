import React, { useState } from 'react';

const TABS = [
  {
    id: 'untracked',
    label: 'Untracked Files',
    color: '#f87171',
    badge: 'git status: Untracked files',
    diffCmd: 'git status',
    output: `# On branch main
# Untracked files:
#   (use "git add <file>..." to include in what will be committed)
#
#	new-feature.js
#	temp-notes.txt`,
    detail: 'Untracked files exist in your working directory but have never been added to Git\'s index tracking table. Git does not track changes to these files until you run git add <file>. They are ignored by git diff unless added.',
  },
  {
    id: 'modified',
    label: 'Modified (Unstaged)',
    color: '#fbbf24',
    badge: 'git diff (Working Directory vs Index)',
    diffCmd: 'git diff app.js',
    output: `diff --git a/app.js b/app.js
index 83b4821..a91f342 100644
--- a/app.js
+++ b/app.js
@@ -10,3 +10,4 @@ function init() {
-  console.log("old logic");
+  console.log("new optimized logic");
+  connectDatabase();
 }`,
    detail: 'Modified files have changes in the working directory that differ from what is currently staged in the Index. Running git diff shows line-by-line insertions (+ green) and deletions (- red) between your disk and the staging area.',
  },
  {
    id: 'staged',
    label: 'Staged (Index)',
    color: '#34d399',
    badge: 'git diff --cached (Index vs HEAD)',
    diffCmd: 'git diff --cached',
    output: `diff --git a/app.js b/app.js
index a91f342..c48e912 100644
--- a/app.js
+++ b/app.js
@@ -12,2 +12,3 @@ function init() {
+  connectDatabase();
 }
+ new file mode 100644 README.md`,
    detail: 'Staged files are prepared in the Index (staging area) and ready for the next commit. Running git diff --cached compares the Staging Area against the last commit (HEAD). Running git commit will snapshot this exact state.',
  },
];

export default function GitStatusDiffDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('modified');
  const tab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .git-sd-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Status &amp; Diff File State Inspector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11.5px', background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)', color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)', boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '11px', background: `${tab.color}15`, border: `1px solid ${tab.color}40`, borderRadius: '6px', padding: '4px 10px', marginBottom: '12px', color: tab.color, display: 'inline-block', fontWeight: 600 }}>
          {tab.badge}
        </div>

        <div className="git-sd-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '14px', alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Terminal Output ({tab.diffCmd})</div>
            <pre style={{ margin: 0, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px', fontSize: '11px', color: '#f3f4f6', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
              {tab.output}
            </pre>
          </div>

          <div style={{ background: `${tab.color}0d`, border: `1px solid ${tab.color}30`, borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '12.5px', color: tab.color, marginBottom: '8px' }}>State Details</div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.6 }}>{tab.detail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
