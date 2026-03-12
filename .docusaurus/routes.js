import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/',
    component: ComponentCreator('/', 'dd2'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '3b9'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '225'),
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
                path: '/technical-knowledge/backend/spring-boot-advanced',
                component: ComponentCreator('/technical-knowledge/backend/spring-boot-advanced', '06f'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/backend/spring-boot-internals',
                component: ComponentCreator('/technical-knowledge/backend/spring-boot-internals', '8c8'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/backend/spring-boot-interview-questions',
                component: ComponentCreator('/technical-knowledge/backend/spring-boot-interview-questions', '5b5'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/backend/spring-data-jpa',
                component: ComponentCreator('/technical-knowledge/backend/spring-data-jpa', '2c0'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/backend/spring-framework',
                component: ComponentCreator('/technical-knowledge/backend/spring-framework', 'c82'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/backend/spring-framework-deep-dive',
                component: ComponentCreator('/technical-knowledge/backend/spring-framework-deep-dive', 'f64'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/backend/spring-interview-questions',
                component: ComponentCreator('/technical-knowledge/backend/spring-interview-questions', '15c'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/backend/spring-mvc',
                component: ComponentCreator('/technical-knowledge/backend/spring-mvc', '3a4'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/backend/spring-security',
                component: ComponentCreator('/technical-knowledge/backend/spring-security', '2dd'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/abstract-factory',
                component: ComponentCreator('/technical-knowledge/design-patterns/abstract-factory', '287'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/adapter',
                component: ComponentCreator('/technical-knowledge/design-patterns/adapter', 'f59'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/bridge',
                component: ComponentCreator('/technical-knowledge/design-patterns/bridge', '517'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/builder',
                component: ComponentCreator('/technical-knowledge/design-patterns/builder', '8f2'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/chain-of-responsibility',
                component: ComponentCreator('/technical-knowledge/design-patterns/chain-of-responsibility', '557'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/command',
                component: ComponentCreator('/technical-knowledge/design-patterns/command', 'cbe'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/composite',
                component: ComponentCreator('/technical-knowledge/design-patterns/composite', 'bed'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/decorator',
                component: ComponentCreator('/technical-knowledge/design-patterns/decorator', 'f76'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/design-patterns-overview',
                component: ComponentCreator('/technical-knowledge/design-patterns/design-patterns-overview', '5f5'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/facade',
                component: ComponentCreator('/technical-knowledge/design-patterns/facade', '80c'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/factory-method',
                component: ComponentCreator('/technical-knowledge/design-patterns/factory-method', 'f63'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/observer',
                component: ComponentCreator('/technical-knowledge/design-patterns/observer', 'a3d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/prototype',
                component: ComponentCreator('/technical-knowledge/design-patterns/prototype', 'f4f'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/proxy',
                component: ComponentCreator('/technical-knowledge/design-patterns/proxy', 'c17'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/singleton',
                component: ComponentCreator('/technical-knowledge/design-patterns/singleton', '5cf'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/strategy',
                component: ComponentCreator('/technical-knowledge/design-patterns/strategy', '090'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/technical-knowledge/design-patterns/template-method',
                component: ComponentCreator('/technical-knowledge/design-patterns/template-method', '5f8'),
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
