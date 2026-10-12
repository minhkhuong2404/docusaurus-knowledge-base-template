export interface ParsedCodeLine {
  lineNum: number;
  text: string;
}

/**
 * Parses raw code snippets into structured lines with exact line numbers.
 * Supports snippets that already have embedded leading numbers ("1: ...", "01: ...", "1. ...")
 * as well as unnumbered code blocks by applying 1-based sequential line numbering.
 */
export function parseSnippetLines(rawSnippet?: string | null): ParsedCodeLine[] {
  if (!rawSnippet || rawSnippet.trim().length === 0) return [];
  const clean = rawSnippet.replace(/\\n/g, '\n');
  const lines = clean.split('\n');

  // Check if non-empty lines have leading number prefixes (e.g., "1: ...", "01: ...", "1. ...")
  const leadingNumRegex = /^\s*(\d+)[:.]\s?(.*)$/;
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
  const hasPrefixesOnAll =
    nonEmptyLines.length > 0 && nonEmptyLines.every((l) => leadingNumRegex.test(l));

  if (hasPrefixesOnAll) {
    return lines.map((line, idx) => {
      const match = line.match(leadingNumRegex);
      if (match) {
        return {
          lineNum: parseInt(match[1], 10),
          text: match[2],
        };
      }
      return { lineNum: idx + 1, text: line };
    });
  }

  return lines.map((line, idx) => ({
    lineNum: idx + 1,
    text: line,
  }));
}
