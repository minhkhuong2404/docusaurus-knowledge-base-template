import React from 'react';
import clsx from 'clsx';
import {useThemeConfig} from '@docusaurus/theme-common';
import Logo from '@theme/Logo';
import CollapseButton from '@theme/DocSidebar/Desktop/CollapseButton';
import Content from '@theme/DocSidebar/Desktop/Content';
import type {Props} from '@theme/DocSidebar/Desktop';

import styles from './styles.module.css';

function DocSidebarDesktop({path, sidebar, onCollapse, isHidden}: Props) {
  const {
    navbar: {hideOnScroll},
    docs: {
      sidebar: {hideable},
    },
  } = useThemeConfig();

  return (
    <div
      className={clsx(
        styles.sidebar,
        hideOnScroll && styles.sidebarWithHideableNavbar,
        isHidden && styles.sidebarHidden,
        'custom-sidebar-container'
      )}>
      {hideOnScroll && <Logo tabIndex={-1} className={styles.sidebarLogo} />}
      
      <div className="custom-sidebar-wrapper">
        <div className="custom-sidebar-menu">
          <Content path={path} sidebar={sidebar} />
        </div>
        <div className="custom-sidebar-footer">
          <a href="https://t.me/" target="_blank" rel="noreferrer" aria-label="Telegram">
            <i className="fab fa-telegram-plane"></i>
          </a>
          <a href="https://twitter.com/" target="_blank" rel="noreferrer" aria-label="Twitter">
            <i className="fab fa-twitter"></i>
          </a>
          <a href="https://discord.com/" target="_blank" rel="noreferrer" aria-label="Discord">
            <i className="fab fa-discord"></i>
          </a>
          <a href="https://reddit.com/" target="_blank" rel="noreferrer" aria-label="Reddit">
            <i className="fab fa-reddit-alien"></i>
          </a>
        </div>
      </div>

      {hideable && <CollapseButton onClick={onCollapse} />}
    </div>
  );
}

export default React.memo(DocSidebarDesktop);
