function findCommentIndex(line: string): number {
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;

  for (let i = 0; i < line.length - 1; i++) {
    const ch = line[i];
    const prev = i > 0 ? line[i - 1] : '';

    if (ch === "'" && !inDouble && !inBacktick && prev !== '\\') {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle && !inBacktick && prev !== '\\') {
      inDouble = !inDouble;
    } else if (ch === '`' && !inSingle && !inDouble && prev !== '\\') {
      inBacktick = !inBacktick;
    } else if (!inSingle && !inDouble && !inBacktick) {
      if (ch === '/' && line[i + 1] === '/') {
        return i;
      }
    }
  }
  return -1;
}

const ERROR_COMMENT_REGEX = /(line\s*\d+|missing|hazard|leak|vulnerabilit|bypass|defect|bug|crash|fail|race|deadlock|starvation|overflow|slow|lost update|swallow|never reached|throws|pins|corrupt|reorder|wildcard|untrusted|rce|self-invocation|clean\s*up|decrement|stampede|simultaneous|attacker|null|ttl|exceed|subsequent|enforce|signing key|unvalidated|gadget|cold publisher|nothing happens|auto-commit|without|attempting to read|check-then-act|mutates list|connection is never returned)/i;

/**
 * Strips spoiler error comments from buggy code snippets while
 * strictly preserving line numbers by replacing standalone comment lines with empty lines.
 */
export function sanitizeBugCode(code: string | null | undefined): string {
  if (!code) return '';
  const lines = code.split('\n');

  const cleaned = lines.map((line) => {
    const commentIdx = findCommentIndex(line);
    if (commentIdx === -1) {
      return line;
    }

    const before = line.slice(0, commentIdx);
    const commentPart = line.slice(commentIdx);

    // Standalone comment line (only whitespace before //)
    if (before.trim().length === 0) {
      if (ERROR_COMMENT_REGEX.test(commentPart) || /^\/\/\s*Line\s*\d+/i.test(commentPart.trim())) {
        return ''; // Blank line preserves line numbering
      }
      return line;
    }

    // Trailing inline comment on a line of code: strip it so errors are not spoiled
    return before.trimEnd();
  });

  return cleaned.join('\n');
}
