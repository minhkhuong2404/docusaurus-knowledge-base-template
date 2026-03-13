import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/',
    component: ComponentCreator('/', 'add'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', 'fef'),
        routes: [
          {
            path: '/tags',
            component: ComponentCreator('/tags', 'ce1'),
            exact: true
          },
          {
            path: '/tags/abstract-factory',
            component: ComponentCreator('/tags/abstract-factory', 'e00'),
            exact: true
          },
          {
            path: '/tags/adapter',
            component: ComponentCreator('/tags/adapter', '153'),
            exact: true
          },
          {
            path: '/tags/advanced',
            component: ComponentCreator('/tags/advanced', 'c89'),
            exact: true
          },
          {
            path: '/tags/async',
            component: ComponentCreator('/tags/async', 'db2'),
            exact: true
          },
          {
            path: '/tags/authentication',
            component: ComponentCreator('/tags/authentication', 'ae2'),
            exact: true
          },
          {
            path: '/tags/auto-configuration',
            component: ComponentCreator('/tags/auto-configuration', '2b4'),
            exact: true
          },
          {
            path: '/tags/backend',
            component: ComponentCreator('/tags/backend', '4ee'),
            exact: true
          },
          {
            path: '/tags/beginner',
            component: ComponentCreator('/tags/beginner', '823'),
            exact: true
          },
          {
            path: '/tags/behavioral',
            component: ComponentCreator('/tags/behavioral', 'd8c'),
            exact: true
          },
          {
            path: '/tags/bridge',
            component: ComponentCreator('/tags/bridge', '60f'),
            exact: true
          },
          {
            path: '/tags/builder',
            component: ComponentCreator('/tags/builder', 'b96'),
            exact: true
          },
          {
            path: '/tags/chain-of-responsibility',
            component: ComponentCreator('/tags/chain-of-responsibility', 'ba3'),
            exact: true
          },
          {
            path: '/tags/collections',
            component: ComponentCreator('/tags/collections', 'f92'),
            exact: true
          },
          {
            path: '/tags/command',
            component: ComponentCreator('/tags/command', 'cc0'),
            exact: true
          },
          {
            path: '/tags/composite',
            component: ComponentCreator('/tags/composite', 'fb3'),
            exact: true
          },
          {
            path: '/tags/concurrency',
            component: ComponentCreator('/tags/concurrency', '800'),
            exact: true
          },
          {
            path: '/tags/consumers',
            component: ComponentCreator('/tags/consumers', '15c'),
            exact: true
          },
          {
            path: '/tags/core-java',
            component: ComponentCreator('/tags/core-java', 'd50'),
            exact: true
          },
          {
            path: '/tags/creational',
            component: ComponentCreator('/tags/creational', '081'),
            exact: true
          },
          {
            path: '/tags/data-integration',
            component: ComponentCreator('/tags/data-integration', 'e30'),
            exact: true
          },
          {
            path: '/tags/data-structures',
            component: ComponentCreator('/tags/data-structures', 'b54'),
            exact: true
          },
          {
            path: '/tags/decorator',
            component: ComponentCreator('/tags/decorator', 'cea'),
            exact: true
          },
          {
            path: '/tags/dependency-injection',
            component: ComponentCreator('/tags/dependency-injection', '206'),
            exact: true
          },
          {
            path: '/tags/design-patterns',
            component: ComponentCreator('/tags/design-patterns', '52a'),
            exact: true
          },
          {
            path: '/tags/distributed-systems',
            component: ComponentCreator('/tags/distributed-systems', '808'),
            exact: true
          },
          {
            path: '/tags/documentation',
            component: ComponentCreator('/tags/documentation', '9e6'),
            exact: true
          },
          {
            path: '/tags/engineering',
            component: ComponentCreator('/tags/engineering', '869'),
            exact: true
          },
          {
            path: '/tags/event-streaming',
            component: ComponentCreator('/tags/event-streaming', '91a'),
            exact: true
          },
          {
            path: '/tags/exactly-once-semantics',
            component: ComponentCreator('/tags/exactly-once-semantics', '4a2'),
            exact: true
          },
          {
            path: '/tags/facade',
            component: ComponentCreator('/tags/facade', '8ac'),
            exact: true
          },
          {
            path: '/tags/factory-method',
            component: ComponentCreator('/tags/factory-method', '45a'),
            exact: true
          },
          {
            path: '/tags/files',
            component: ComponentCreator('/tags/files', '407'),
            exact: true
          },
          {
            path: '/tags/fundamentals',
            component: ComponentCreator('/tags/fundamentals', 'b95'),
            exact: true
          },
          {
            path: '/tags/garbage-collection',
            component: ComponentCreator('/tags/garbage-collection', '218'),
            exact: true
          },
          {
            path: '/tags/generics',
            component: ComponentCreator('/tags/generics', 'cb5'),
            exact: true
          },
          {
            path: '/tags/internals',
            component: ComponentCreator('/tags/internals', '874'),
            exact: true
          },
          {
            path: '/tags/interview-questions',
            component: ComponentCreator('/tags/interview-questions', '387'),
            exact: true
          },
          {
            path: '/tags/io',
            component: ComponentCreator('/tags/io', 'a3e'),
            exact: true
          },
          {
            path: '/tags/java',
            component: ComponentCreator('/tags/java', '7e9'),
            exact: true
          },
          {
            path: '/tags/java-21',
            component: ComponentCreator('/tags/java-21', 'b99'),
            exact: true
          },
          {
            path: '/tags/jvm',
            component: ComponentCreator('/tags/jvm', 'c85'),
            exact: true
          },
          {
            path: '/tags/kafka',
            component: ComponentCreator('/tags/kafka', '472'),
            exact: true
          },
          {
            path: '/tags/kafka-connect',
            component: ComponentCreator('/tags/kafka-connect', '3eb'),
            exact: true
          },
          {
            path: '/tags/kafka-streams',
            component: ComponentCreator('/tags/kafka-streams', '48b'),
            exact: true
          },
          {
            path: '/tags/knowledge-base',
            component: ComponentCreator('/tags/knowledge-base', '6af'),
            exact: true
          },
          {
            path: '/tags/language-features',
            component: ComponentCreator('/tags/language-features', '35c'),
            exact: true
          },
          {
            path: '/tags/microservices',
            component: ComponentCreator('/tags/microservices', '565'),
            exact: true
          },
          {
            path: '/tags/modern-java',
            component: ComponentCreator('/tags/modern-java', 'f10'),
            exact: true
          },
          {
            path: '/tags/multithreading',
            component: ComponentCreator('/tags/multithreading', '7b2'),
            exact: true
          },
          {
            path: '/tags/nio',
            component: ComponentCreator('/tags/nio', '835'),
            exact: true
          },
          {
            path: '/tags/object-oriented-programming',
            component: ComponentCreator('/tags/object-oriented-programming', '696'),
            exact: true
          },
          {
            path: '/tags/observer',
            component: ComponentCreator('/tags/observer', '8ee'),
            exact: true
          },
          {
            path: '/tags/onboarding',
            component: ComponentCreator('/tags/onboarding', 'b8e'),
            exact: true
          },
          {
            path: '/tags/oop',
            component: ComponentCreator('/tags/oop', '1ef'),
            exact: true
          },
          {
            path: '/tags/parallelism',
            component: ComponentCreator('/tags/parallelism', '118'),
            exact: true
          },
          {
            path: '/tags/performance',
            component: ComponentCreator('/tags/performance', '69d'),
            exact: true
          },
          {
            path: '/tags/persistence',
            component: ComponentCreator('/tags/persistence', 'af7'),
            exact: true
          },
          {
            path: '/tags/prototype',
            component: ComponentCreator('/tags/prototype', 'cdc'),
            exact: true
          },
          {
            path: '/tags/proxy',
            component: ComponentCreator('/tags/proxy', 'd73'),
            exact: true
          },
          {
            path: '/tags/reliability',
            component: ComponentCreator('/tags/reliability', '48a'),
            exact: true
          },
          {
            path: '/tags/singleton',
            component: ComponentCreator('/tags/singleton', '93b'),
            exact: true
          },
          {
            path: '/tags/software-design',
            component: ComponentCreator('/tags/software-design', '5b9'),
            exact: true
          },
          {
            path: '/tags/solid',
            component: ComponentCreator('/tags/solid', 'f87'),
            exact: true
          },
          {
            path: '/tags/spring-boot',
            component: ComponentCreator('/tags/spring-boot', '9e5'),
            exact: true
          },
          {
            path: '/tags/spring-data-jpa',
            component: ComponentCreator('/tags/spring-data-jpa', '630'),
            exact: true
          },
          {
            path: '/tags/spring-framework',
            component: ComponentCreator('/tags/spring-framework', '706'),
            exact: true
          },
          {
            path: '/tags/spring-mvc',
            component: ComponentCreator('/tags/spring-mvc', '15d'),
            exact: true
          },
          {
            path: '/tags/spring-security',
            component: ComponentCreator('/tags/spring-security', '6d7'),
            exact: true
          },
          {
            path: '/tags/strategy',
            component: ComponentCreator('/tags/strategy', 'c95'),
            exact: true
          },
          {
            path: '/tags/stream-processing',
            component: ComponentCreator('/tags/stream-processing', '3f6'),
            exact: true
          },
          {
            path: '/tags/streaming',
            component: ComponentCreator('/tags/streaming', '957'),
            exact: true
          },
          {
            path: '/tags/structural',
            component: ComponentCreator('/tags/structural', '4a2'),
            exact: true
          },
          {
            path: '/tags/template-method',
            component: ComponentCreator('/tags/template-method', '4e8'),
            exact: true
          },
          {
            path: '/tags/topology',
            component: ComponentCreator('/tags/topology', 'c1c'),
            exact: true
          },
          {
            path: '/tags/web',
            component: ComponentCreator('/tags/web', '4aa'),
            exact: true
          },
          {
            path: '/',
            component: ComponentCreator('/', '6a4'),
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
                path: '/technical-knowledge/java/java-oop',
                component: ComponentCreator('/technical-knowledge/java/java-oop', '49b'),
                exact: true
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
