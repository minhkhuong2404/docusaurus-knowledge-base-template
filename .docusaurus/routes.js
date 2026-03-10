import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docusaurus-knowledge-base-template/',
    component: ComponentCreator('/docusaurus-knowledge-base-template/', 'e05'),
    routes: [
      {
        path: '/docusaurus-knowledge-base-template/',
        component: ComponentCreator('/docusaurus-knowledge-base-template/', '42d'),
        routes: [
          {
            path: '/docusaurus-knowledge-base-template/',
            component: ComponentCreator('/docusaurus-knowledge-base-template/', 'd6b'),
            routes: [
              {
                path: '/docusaurus-knowledge-base-template/technical-knowledge/architecture/microservices',
                component: ComponentCreator('/docusaurus-knowledge-base-template/technical-knowledge/architecture/microservices', '7c8'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docusaurus-knowledge-base-template/technical-knowledge/backend/spring-boot',
                component: ComponentCreator('/docusaurus-knowledge-base-template/technical-knowledge/backend/spring-boot', '00d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docusaurus-knowledge-base-template/technical-knowledge/java/java-collections',
                component: ComponentCreator('/docusaurus-knowledge-base-template/technical-knowledge/java/java-collections', '7ba'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docusaurus-knowledge-base-template/technical-knowledge/java/java-concurrency',
                component: ComponentCreator('/docusaurus-knowledge-base-template/technical-knowledge/java/java-concurrency', '50d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docusaurus-knowledge-base-template/technical-knowledge/java/java-fundamentals',
                component: ComponentCreator('/docusaurus-knowledge-base-template/technical-knowledge/java/java-fundamentals', '354'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docusaurus-knowledge-base-template/technical-knowledge/java/java-io',
                component: ComponentCreator('/docusaurus-knowledge-base-template/technical-knowledge/java/java-io', '61d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docusaurus-knowledge-base-template/technical-knowledge/java/java-jvm',
                component: ComponentCreator('/docusaurus-knowledge-base-template/technical-knowledge/java/java-jvm', '762'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docusaurus-knowledge-base-template/technical-knowledge/java/java-new-features',
                component: ComponentCreator('/docusaurus-knowledge-base-template/technical-knowledge/java/java-new-features', '113'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docusaurus-knowledge-base-template/technical-knowledge/kafka/kafka-complete-guide',
                component: ComponentCreator('/docusaurus-knowledge-base-template/technical-knowledge/kafka/kafka-complete-guide', 'e2f'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docusaurus-knowledge-base-template/technical-knowledge/kafka/kafka-connect',
                component: ComponentCreator('/docusaurus-knowledge-base-template/technical-knowledge/kafka/kafka-connect', '6a9'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docusaurus-knowledge-base-template/technical-knowledge/kafka/kafka-exactly-once',
                component: ComponentCreator('/docusaurus-knowledge-base-template/technical-knowledge/kafka/kafka-exactly-once', '1f2'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docusaurus-knowledge-base-template/technical-knowledge/kafka/kafka-parallel-consumer',
                component: ComponentCreator('/docusaurus-knowledge-base-template/technical-knowledge/kafka/kafka-parallel-consumer', 'a10'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docusaurus-knowledge-base-template/technical-knowledge/kafka/kafka-streams',
                component: ComponentCreator('/docusaurus-knowledge-base-template/technical-knowledge/kafka/kafka-streams', '4a5'),
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
