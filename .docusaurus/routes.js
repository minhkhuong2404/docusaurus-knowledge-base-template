import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docusaurus-knowledge-base-template/__docusaurus/debug',
    component: ComponentCreator('/docusaurus-knowledge-base-template/__docusaurus/debug', '37d'),
    exact: true
  },
  {
    path: '/docusaurus-knowledge-base-template/__docusaurus/debug/config',
    component: ComponentCreator('/docusaurus-knowledge-base-template/__docusaurus/debug/config', '08b'),
    exact: true
  },
  {
    path: '/docusaurus-knowledge-base-template/__docusaurus/debug/content',
    component: ComponentCreator('/docusaurus-knowledge-base-template/__docusaurus/debug/content', 'dc8'),
    exact: true
  },
  {
    path: '/docusaurus-knowledge-base-template/__docusaurus/debug/globalData',
    component: ComponentCreator('/docusaurus-knowledge-base-template/__docusaurus/debug/globalData', 'cf7'),
    exact: true
  },
  {
    path: '/docusaurus-knowledge-base-template/__docusaurus/debug/metadata',
    component: ComponentCreator('/docusaurus-knowledge-base-template/__docusaurus/debug/metadata', 'f50'),
    exact: true
  },
  {
    path: '/docusaurus-knowledge-base-template/__docusaurus/debug/registry',
    component: ComponentCreator('/docusaurus-knowledge-base-template/__docusaurus/debug/registry', '052'),
    exact: true
  },
  {
    path: '/docusaurus-knowledge-base-template/__docusaurus/debug/routes',
    component: ComponentCreator('/docusaurus-knowledge-base-template/__docusaurus/debug/routes', 'ed8'),
    exact: true
  },
  {
    path: '/docusaurus-knowledge-base-template/',
    component: ComponentCreator('/docusaurus-knowledge-base-template/', '4af'),
    routes: [
      {
        path: '/docusaurus-knowledge-base-template/',
        component: ComponentCreator('/docusaurus-knowledge-base-template/', '80c'),
        routes: [
          {
            path: '/docusaurus-knowledge-base-template/',
            component: ComponentCreator('/docusaurus-knowledge-base-template/', '664'),
            routes: [
              {
                path: '/docusaurus-knowledge-base-template/architecture/microservices',
                component: ComponentCreator('/docusaurus-knowledge-base-template/architecture/microservices', '175'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docusaurus-knowledge-base-template/backend/spring-boot',
                component: ComponentCreator('/docusaurus-knowledge-base-template/backend/spring-boot', '7c2'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docusaurus-knowledge-base-template/kafka/saga-pattern',
                component: ComponentCreator('/docusaurus-knowledge-base-template/kafka/saga-pattern', '250'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docusaurus-knowledge-base-template/',
                component: ComponentCreator('/docusaurus-knowledge-base-template/', '531'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
