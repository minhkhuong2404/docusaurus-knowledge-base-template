
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
	tutorialSidebar: [
		'intro',
		{
			type: 'category',
			label: 'Architecture',
			items: ['technical-knowledge/architecture/microservices']
		},
		{
			type: 'category',
			label: 'Backend',
			items: [
				'technical-knowledge/backend/spring-boot',
				'technical-knowledge/backend/spring-boot-internals',
				'technical-knowledge/backend/spring-boot-advanced',
				'technical-knowledge/backend/spring-boot-interview-questions',
				'technical-knowledge/backend/spring-framework',
				'technical-knowledge/backend/spring-framework-deep-dive',
				'technical-knowledge/backend/spring-interview-questions',
				'technical-knowledge/backend/spring-security',
				'technical-knowledge/backend/spring-mvc',
				'technical-knowledge/backend/spring-data-jpa'
			]
		},
		{
			type: 'category',
			label: 'Design Patterns',
			items: [
				'technical-knowledge/design-patterns/design-patterns-overview',
				'technical-knowledge/design-patterns/singleton',
				'technical-knowledge/design-patterns/factory-method',
				'technical-knowledge/design-patterns/abstract-factory',
				'technical-knowledge/design-patterns/builder',
				'technical-knowledge/design-patterns/prototype',
				'technical-knowledge/design-patterns/adapter',
				'technical-knowledge/design-patterns/bridge',
				'technical-knowledge/design-patterns/composite',
				'technical-knowledge/design-patterns/decorator',
				'technical-knowledge/design-patterns/facade',
				'technical-knowledge/design-patterns/proxy',
				'technical-knowledge/design-patterns/chain-of-responsibility',
				'technical-knowledge/design-patterns/observer',
				'technical-knowledge/design-patterns/strategy',
				'technical-knowledge/design-patterns/command',
				'technical-knowledge/design-patterns/template-method'
			]
		},
		{
			type: 'category',
			label: 'Java',
			items: [
				'technical-knowledge/java/java-fundamentals',
				'technical-knowledge/java/java-oop',
				'technical-knowledge/java/java-collections',
				'technical-knowledge/java/java-concurrency',
				'technical-knowledge/java/java-io',
				'technical-knowledge/java/java-jvm',
				'technical-knowledge/java/java-new-features',
				'technical-knowledge/java/java-interview-questions'
			]
		},
		{
			type: 'category',
			label: 'Kafka',
			items: [
				'technical-knowledge/kafka/kafka-complete-guide',
				'technical-knowledge/kafka/kafka-connect',
				'technical-knowledge/kafka/kafka-streams',
				'technical-knowledge/kafka/kafka-exactly-once',
				'technical-knowledge/kafka/kafka-parallel-consumer'
			]
		},
		{
			type: 'doc',
			id: 'technical-knowledge/database/database-overview',
			label: '🗄️ Overview',
		},
		{
			type: 'category',
			label: 'Relational Databases',
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
			label: 'Performance',
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
			label: 'Internals',
			collapsed: false,
			items: [
				'technical-knowledge/database/transactions-concurrency',
				'technical-knowledge/database/storage-engines-data-structures',
			],
		},
		{
			type: 'category',
			label: 'Scale & Distribution',
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
			label: 'Operations',
			collapsed: false,
			items: [
				'technical-knowledge/database/backup-recovery',
				'technical-knowledge/database/database-security',
			],
		},
		{
			type: 'doc',
			id: 'technical-knowledge/operating-systems/intro',
			label: '📖 Introduction',
		},
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
		{
			type: 'doc',
			id: 'technical-knowledge/operating-systems/interview-questions',
			label: '🎯 Interview Questions',
		},
	]
}

export default sidebars
