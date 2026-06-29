import React, { type ReactNode } from 'react';
import { useWindowSize } from '@docusaurus/theme-common';
import DocSidebarOriginal from '@theme-original/DocSidebar';
import CustomSidebarDesktop from './CustomSidebarDesktop';
import type DocSidebarType from '@theme/DocSidebar';
import type { WrapperProps } from '@docusaurus/types';

type Props = WrapperProps<typeof DocSidebarType>;

export default function DocSidebarWrapper(props: Props): ReactNode {
  const windowSize = useWindowSize();
  const isDesktop = windowSize === 'desktop' || windowSize === 'ssr';

  if (isDesktop) {
    return <CustomSidebarDesktop {...props} />;
  }

  return <DocSidebarOriginal {...props} />;
}
