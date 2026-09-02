import React from 'react';
import OriginalCodeBlock from '@theme-original/CodeBlock';
import type { Props } from '@theme/CodeBlock';

export default function CodeBlock(props: Props): React.JSX.Element {
  return <OriginalCodeBlock {...props} />;
}
