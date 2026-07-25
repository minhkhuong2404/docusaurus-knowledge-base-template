import React, { useEffect, type ReactNode } from 'react';
import { useWindowSize } from '@docusaurus/theme-common';
import DocSidebarOriginal from '@theme-original/DocSidebar';
import CustomSidebarDesktop from './CustomSidebarDesktop';
import type DocSidebarType from '@theme/DocSidebar';
import type { WrapperProps } from '@docusaurus/types';
import { useUserProgress } from '@site/src/context/UserProgressContext';
import { isTrackableArticle } from '@site/src/utils/trackablePages';

type Props = WrapperProps<typeof DocSidebarType>;

function getUniqueTrackableDocHrefs(items: any[], seen = new Set<string>()): Set<string> {
  if (!items || !Array.isArray(items)) return seen;
  items.forEach((item) => {
    // Only count leaf doc links (not category wrappers with child items)
    if (item.type === 'doc' || (item.type === 'link' && (!Array.isArray(item.items) || item.items.length === 0))) {
      const rawHref = item.href || item.docId || item.id || '';
      const cleanHref = rawHref.split('#')[0].split('?')[0].replace(/\/$/, '').toLowerCase();
      if (cleanHref && isTrackableArticle(cleanHref)) {
        seen.add(cleanHref);
      }
    }
    if (item.type === 'category' && Array.isArray(item.items)) {
      getUniqueTrackableDocHrefs(item.items, seen);
    }
  });
  return seen;
}

export default function DocSidebarWrapper(props: Props): ReactNode {
  const windowSize = useWindowSize();
  const isDesktop = windowSize === 'desktop' || windowSize === 'ssr';
  const { setTotalArticlesCount } = useUserProgress();

  useEffect(() => {
    if (props.sidebar && Array.isArray(props.sidebar)) {
      const uniqueHrefs = getUniqueTrackableDocHrefs(props.sidebar);
      const count = uniqueHrefs.size;
      if (count > 0) {
        setTotalArticlesCount(count);
      }
    }
  }, [props.sidebar, setTotalArticlesCount]);

  if (isDesktop) {
    return <CustomSidebarDesktop {...props} />;
  }

  return <DocSidebarOriginal {...props} />;
}
