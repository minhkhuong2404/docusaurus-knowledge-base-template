
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
	tutorialSidebar: [
		'intro',
		{
			type: 'category',
			label: '☕ Java',
			items: [
				'technical-knowledge/java/java-overview',
				{
					type: 'category',
					label: '📘 Core Language',
					collapsed: false,
					items: [
						'technical-knowledge/java/java-fundamentals',
						'technical-knowledge/java/java-oop',
						'technical-knowledge/java/java-collections'
					]
				},
				{
					type: 'category',
					label: '🧵 Concurrency & JVM',
					collapsed: false,
					items: [
						'technical-knowledge/java/java-concurrency',
						'technical-knowledge/java/java-jvm'
					]
				},
				{
					type: 'category',
					label: '⚡ I/O & Modern Java',
					collapsed: false,
					items: [
						'technical-knowledge/java/java-io',
						'technical-knowledge/java/java-new-features'
					]
				},
				'technical-knowledge/java/java-interview-questions'
			]
		},
		{
			type: 'category',
			label: '⚙️ Spring Ecosystem',
			items: [
				'technical-knowledge/spring/spring-overview',
				{
					type: 'category',
					label: '🚀 Spring Boot',
					collapsed: false,
					items: [
						'technical-knowledge/spring/spring-boot',
						'technical-knowledge/spring/spring-boot-internals',
						'technical-knowledge/spring/spring-boot-advanced',
						'technical-knowledge/spring/spring-boot-interview-questions'
					]
				},
				{
					type: 'category',
					label: '🌱 Spring Framework',
					collapsed: false,
					items: [
						'technical-knowledge/spring/spring-framework',
						'technical-knowledge/spring/spring-framework-deep-dive',
						'technical-knowledge/spring/spring-interview-questions'
					]
				},
				{
					type: 'category',
					label: '🔐 Security & Data Access',
					collapsed: false,
					items: [
						'technical-knowledge/spring/spring-security',
						'technical-knowledge/spring/spring-data-jpa'
					]
				},
				{
					type: 'category',
					label: '🌐 Web Layer',
					collapsed: false,
					items: ['technical-knowledge/spring/spring-mvc']
				}
			]
		},
		{
			type: 'category',
			label: '🧩 Design Patterns',
			items: [
				'technical-knowledge/design-patterns/design-patterns-overview',
				{
					type: 'category',
					label: '🏗️ Creational',
					collapsed: false,
					items: [
						'technical-knowledge/design-patterns/singleton',
						'technical-knowledge/design-patterns/factory-method',
						'technical-knowledge/design-patterns/abstract-factory',
						'technical-knowledge/design-patterns/builder',
						'technical-knowledge/design-patterns/prototype'
					]
				},
				{
					type: 'category',
					label: '🧱 Structural',
					collapsed: false,
					items: [
						'technical-knowledge/design-patterns/adapter',
						'technical-knowledge/design-patterns/bridge',
						'technical-knowledge/design-patterns/composite',
						'technical-knowledge/design-patterns/decorator',
						'technical-knowledge/design-patterns/facade',
						'technical-knowledge/design-patterns/proxy'
					]
				},
				{
					type: 'category',
					label: '🔄 Behavioral',
					collapsed: false,
					items: [
						'technical-knowledge/design-patterns/chain-of-responsibility',
						'technical-knowledge/design-patterns/observer',
						'technical-knowledge/design-patterns/strategy',
						'technical-knowledge/design-patterns/command',
						'technical-knowledge/design-patterns/template-method'
					]
				}
			]
		},
		{
			type: 'doc',
			id: 'technical-knowledge/system-design/intro',
			label: '📖 Overview',
		},
		{
			type: 'category',
			label: '🏗️ Fundamentals',
			collapsed: false,
			items: [
				'technical-knowledge/system-design/architecture-fundamentals',
				'technical-knowledge/system-design/capacity-planning',
				'technical-knowledge/system-design/interview-framework',
			],
		},
		{
			type: 'category',
			label: '⚡ Scaling Patterns',
			collapsed: false,
			items: [
				'technical-knowledge/system-design/scaling-reads',
				'technical-knowledge/system-design/scaling-writes',
				'technical-knowledge/system-design/caching-strategies',
			],
		},
		{
			type: 'category',
			label: '🔄 Distributed Patterns',
			collapsed: false,
			items: [
				'technical-knowledge/system-design/real-time-updates',
				'technical-knowledge/system-design/handling-contention',
				'technical-knowledge/system-design/multi-step-process',
				'technical-knowledge/system-design/long-running-tasks',
				'technical-knowledge/system-design/data-consistency',
			],
		},
		{
			type: 'category',
			label: '🧩 Architecture',
			collapsed: false,
			items: [
				'technical-knowledge/system-design/microservices-patterns',
				'technical-knowledge/system-design/api-design',
				'technical-knowledge/system-design/database-design',
				'technical-knowledge/system-design/message-queues',
				'technical-knowledge/system-design/search-systems',
			],
		},
		{
			type: 'category',
			label: '🗄️ Storage',
			collapsed: false,
			items: [
				'technical-knowledge/system-design/large-blobs',
			],
		},
		{
			type: 'category',
			label: '🔒 Security & Reliability',
			collapsed: false,
			items: [
				'technical-knowledge/system-design/security-patterns',
				'technical-knowledge/system-design/load-balancing-reliability',
				'technical-knowledge/system-design/observability',
				'technical-knowledge/system-design/distributed-systems',
			],
		},
		{
			type: 'category',
			label: '🎯 Interview Prep',
			collapsed: false,
			items: [
				'technical-knowledge/system-design/common-interview-questions',
			],
		},
		{
			type: 'category',
			label: '📨 Kafka',
			items: [
				'technical-knowledge/kafka/kafka-complete-guide',
				{
					type: 'category',
					label: '🔌 Ecosystem',
					collapsed: false,
					items: [
						'technical-knowledge/kafka/kafka-connect',
						'technical-knowledge/kafka/kafka-streams'
					]
				},
				{
					type: 'category',
					label: '📈 Reliability & Scale',
					collapsed: false,
					items: [
						'technical-knowledge/kafka/kafka-exactly-once',
						'technical-knowledge/kafka/kafka-parallel-consumer'
					]
				}
			]
		},
		{
			type: 'category',
			label: '🗄️ Database',
			items: [
				'technical-knowledge/database/database-overview',
				{
					type: 'category',
					label: '🧱 Relational Databases',
					collapsed: false,
					items: [
						'technical-knowledge/database/relational-fundamentals',
						'technical-knowledge/database/database-design',
						'technical-knowledge/database/advanced-sql',
						'technical-knowledge/database/schema-migrations',
					],
				},
				{
					type: 'category',
					label: '⚡ Performance',
					collapsed: false,
					items: [
						'technical-knowledge/database/indexing-query-optimization',
						'technical-knowledge/database/query-planner-optimizer',
						'technical-knowledge/database/performance-monitoring',
						'technical-knowledge/database/caching-strategies',
					],
				},
				{
					type: 'category',
					label: '⚙️ Internals',
					collapsed: false,
					items: [
						'technical-knowledge/database/transactions-concurrency',
						'technical-knowledge/database/storage-engines-data-structures',
					],
				},
				{
					type: 'category',
					label: '🌍 Scale & Distribution',
					collapsed: false,
					items: [
						'technical-knowledge/database/replication-partitioning',
						'technical-knowledge/database/nosql-distributed',
						'technical-knowledge/database/database-patterns-microservices',
					],
				},
				{
					type: 'category',
					label: '🔎 Specialized',
					collapsed: false,
					items: [
						'technical-knowledge/database/full-text-search',
						'technical-knowledge/database/data-warehousing-olap',
						'technical-knowledge/database/time-series-databases',
					],
				},
				{
					type: 'category',
					label: '🛠️ Operations',
					collapsed: false,
					items: [
						'technical-knowledge/database/backup-recovery',
						'technical-knowledge/database/database-security',
					],
				}
			]
		},
		{
			type: 'category',
			label: '🖥️ Operating Systems',
			items: [
				'technical-knowledge/operating-systems/intro',
				{
					type: 'category',
					label: '⚙️ Core Concepts',
					collapsed: false,
					items: [
						'technical-knowledge/operating-systems/processes-and-threads',
						'technical-knowledge/operating-systems/cpu-scheduling',
						'technical-knowledge/operating-systems/memory-management',
						'technical-knowledge/operating-systems/synchronization-and-deadlocks',
					],
				},
				{
					type: 'category',
					label: '🖥️ Storage & I/O',
					collapsed: false,
					items: [
						'technical-knowledge/operating-systems/file-systems-and-io',
						'technical-knowledge/operating-systems/virtual-memory-deep-dive',
					],
				},
				{
					type: 'category',
					label: '🐧 Linux Internals',
					collapsed: false,
					items: [
						'technical-knowledge/operating-systems/linux-internals-and-syscalls',
						'technical-knowledge/operating-systems/networking-and-ipc',
					],
				},
				'technical-knowledge/operating-systems/interview-questions',
			]
		},
	]
}

export default sidebars
