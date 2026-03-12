import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', 'caa'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '1a2'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', 'eba'),
            routes: [
              {
                path: '/technical-knowledge/architecture/microservices',
                component: ComponentCreator('/technical-knowledge/architecture/microservices', '46b'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/backend/spring-boot',
                component: ComponentCreator('/technical-knowledge/backend/spring-boot', '8b6'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/java/java-collections',
                component: ComponentCreator('/technical-knowledge/java/java-collections', '5a4'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/java/java-concurrency',
                component: ComponentCreator('/technical-knowledge/java/java-concurrency', 'b3c'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/java/java-fundamentals',
                component: ComponentCreator('/technical-knowledge/java/java-fundamentals', '3b1'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/java/java-interview-questions',
                component: ComponentCreator('/technical-knowledge/java/java-interview-questions', '6a3'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/java/java-io',
                component: ComponentCreator('/technical-knowledge/java/java-io', '5ec'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/java/java-jvm',
                component: ComponentCreator('/technical-knowledge/java/java-jvm', 'd96'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/java/java-new-features',
                component: ComponentCreator('/technical-knowledge/java/java-new-features', '0f9'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/kafka/kafka-complete-guide',
                component: ComponentCreator('/technical-knowledge/kafka/kafka-complete-guide', '8ec'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/kafka/kafka-connect',
                component: ComponentCreator('/technical-knowledge/kafka/kafka-connect', '503'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/kafka/kafka-exactly-once',
                component: ComponentCreator('/technical-knowledge/kafka/kafka-exactly-once', 'd9b'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/kafka/kafka-parallel-consumer',
                component: ComponentCreator('/technical-knowledge/kafka/kafka-parallel-consumer', '75a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/kafka/kafka-streams',
                component: ComponentCreator('/technical-knowledge/kafka/kafka-streams', '5c9'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/',
                component: ComponentCreator('/', 'fc9'),
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
