const fs = require('fs');
const path = require('path');

const mapping = {
  'docs/technical-knowledge/git/basics/add.md': 'GitAddStagingDiagram',
  'docs/technical-knowledge/git/basics/commit.md': 'GitCommitInternalsDiagram',
  'docs/technical-knowledge/git/basics/status-diff.md': 'GitStatusDiffDiagram',
  'docs/technical-knowledge/git/basics/fetch-pull.md': 'GitFetchVsPullDiagram',
  'docs/technical-knowledge/git/basics/push.md': 'GitPushRefspecsDiagram',
  'docs/technical-knowledge/git/branching/branches.md': 'GitBranchesInternalsDiagram',
  'docs/technical-knowledge/git/branching/merge.md': 'GitMergeMechanicsDiagram',
  'docs/technical-knowledge/git/branching/rebase.md': 'GitRebaseInternalsDiagram',
  'docs/technical-knowledge/git/branching/conflict-resolution.md': 'GitConflictResolutionDiagram',
  'docs/technical-knowledge/git/history/reset-revert.md': 'GitResetVsRevertDiagram',
  'docs/technical-knowledge/git/history/reflog.md': 'GitReflogSafetyDiagram',
  'docs/technical-knowledge/git/history/cherry-pick.md': 'GitCherryPickDiagram',
  'docs/technical-knowledge/git/history/squash.md': 'GitSquashFixupDiagram',
  'docs/technical-knowledge/git/history/fixup.md': 'GitSquashFixupDiagram',
  'docs/technical-knowledge/git/history/log-blame.md': 'GitLogBlameExplorerDiagram',
  'docs/technical-knowledge/git/collaboration/stash.md': 'GitStashStackDiagram',
  'docs/technical-knowledge/git/collaboration/submodules.md': 'GitSubmodulesDiagram',
  'docs/technical-knowledge/git/collaboration/remotes.md': 'GitRemotesDiagram',
  'docs/technical-knowledge/git/collaboration/tags.md': 'GitTagsDiagram',
  'docs/technical-knowledge/git/workflows/git-flow.md': 'GitFlowWorkflowDiagram',
  'docs/technical-knowledge/git/workflows/trunk-based.md': 'GitTrunkBasedDiagram',
  'docs/technical-knowledge/git/workflows/conventional-commits.md': 'GitConventionalCommitsDiagram',
  'docs/technical-knowledge/git/workflows/pull-request-best-practices.md': 'GitPullRequestBestPracticesDiagram',
  'docs/technical-knowledge/git/advanced/bisect.md': 'GitBisectDiagram',
  'docs/technical-knowledge/git/advanced/worktree.md': 'GitWorktreeDiagram',
  'docs/technical-knowledge/git/advanced/hooks.md': 'GitHooksPipelineDiagram',
  'docs/technical-knowledge/git/advanced/config-aliases.md': 'GitConfigAliasesDiagram',
};

Object.entries(mapping).forEach(([filePath, componentName]) => {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check if component already imported
  if (content.includes(componentName)) {
    console.log(`Already embedded in ${filePath}`);
    return;
  }

  const importLine = `import ${componentName} from '@site/src/components/${componentName}';\n`;
  const jsxTag = `\n<${componentName} />\n`;

  // Insert import after frontmatter (second ---)
  const parts = content.split('---');
  if (parts.length >= 3) {
    const frontmatter = `---${parts[1]}---\n\n` + importLine;
    let rest = parts.slice(2).join('---');

    // Embed tag right after the H1 title
    const h1Match = rest.match(/#\s+[^\n]+\n/);
    if (h1Match) {
      const titleIndex = rest.indexOf(h1Match[0]) + h1Match[0].length;
      rest = rest.slice(0, titleIndex) + jsxTag + rest.slice(titleIndex);
    } else {
      rest = jsxTag + rest;
    }

    fs.writeFileSync(filePath, frontmatter + rest, 'utf8');
    console.log(`Successfully embedded ${componentName} into ${filePath}`);
  } else {
    console.error(`Frontmatter split failed for ${filePath}`);
  }
});
