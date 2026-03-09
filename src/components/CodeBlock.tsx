
import React from "react"
import Highlight, { defaultProps } from "prism-react-renderer"
import theme from "../theme/prismTheme"

interface Props {
  code: string
  language: string
}

export default function CodeBlock({ code, language }: Props) {
  return (
    <Highlight
      {...defaultProps}
      theme={theme}
      code={code.trim()}
      language={language as any}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={{ ...style, padding: "20px" }}>
          {tokens.map((line, i) => (
            <div {...getLineProps({ line })} key={i}>
              {line.map((token, key) => (
                <span {...getTokenProps({ token })} key={key} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}
