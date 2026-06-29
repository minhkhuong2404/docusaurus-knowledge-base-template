import React from "react";
import MDXComponents from "@theme-original/MDXComponents";

// Regex covering the main Unicode emoji ranges:
// - Miscellaneous Symbols and Pictographs (U+1F300–U+1F5FF)
// - Emoticons (U+1F600–U+1F64F)
// - Transport & Map (U+1F680–U+1F6FF)
// - Supplemental Symbols (U+1F900–U+1F9FF)
// - Symbols & Pictographs Extended (U+1FA00–U+1FAFF)
// - Dingbats (U+2702–U+27B0)
// - Misc symbols (U+2600–U+26FF)
// - Regional indicators, variation selectors, ZWJ sequences, etc.
const EMOJI_REGEX =
  /(\p{Emoji_Presentation}|\p{Extended_Pictographic})(\uFE0F|\u20E3)?(\u200D(\p{Emoji_Presentation}|\p{Extended_Pictographic})(\uFE0F|\u20E3)?)*/gu;

/**
 * Split text into alternating text/emoji segments so we can render
 * emoji inside a <span> that resets -webkit-text-fill-color, allowing
 * emoji to display with their natural colors instead of being clipped
 * to the gradient background used on gradient headings (h1, h2, h3).
 */
function wrapEmoji(children: React.ReactNode): React.ReactNode {
  if (typeof children !== "string") {
    // For non-string children (e.g. nested React elements), recurse or pass through.
    if (React.isValidElement(children)) {
      return children;
    }
    if (Array.isArray(children)) {
      return children.map((child, i) =>
        typeof child === "string" ? (
          <React.Fragment key={i}>{wrapEmoji(child)}</React.Fragment>
        ) : (
          <React.Fragment key={i}>{child}</React.Fragment>
        )
      );
    }
    return children;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  EMOJI_REGEX.lastIndex = 0;

  while ((match = EMOJI_REGEX.exec(children)) !== null) {
    // Text before this emoji
    if (match.index > lastIndex) {
      parts.push(children.slice(lastIndex, match.index));
    }
    // Wrap emoji in a span that restores natural rendering
    parts.push(
      <span key={match.index} className="heading-emoji" aria-hidden="true">
        {match[0]}
      </span>
    );
    lastIndex = EMOJI_REGEX.lastIndex;
  }

  // Remaining text after last emoji
  if (lastIndex < children.length) {
    parts.push(children.slice(lastIndex));
  }

  return parts.length > 0 ? parts : children;
}

/** Heading factories — wraps emoji in all gradient headings. */
function makeHeading(
  Tag: "h1" | "h2" | "h3"
): (props: React.HTMLAttributes<HTMLHeadingElement>) => React.ReactElement {
  return function HeadingWithEmoji({ children, ...props }) {
    const wrappedChildren = React.Children.map(children, wrapEmoji);
    return <Tag {...props}>{wrappedChildren}</Tag>;
  };
}

const H1 = makeHeading("h1");
const H2 = makeHeading("h2");
const H3 = makeHeading("h3");

export default {
  ...MDXComponents,
  h1: H1,
  h2: H2,
  h3: H3,
};
