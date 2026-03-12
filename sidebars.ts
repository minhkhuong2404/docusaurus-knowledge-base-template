
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
			items: ['technical-knowledge/backend/spring-boot']
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
		}
	]
}

export default sidebars
