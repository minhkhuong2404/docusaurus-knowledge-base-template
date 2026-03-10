
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
			label: 'Java',
			items: [
				'technical-knowledge/java/java-fundamentals',
				'technical-knowledge/java/java-collections',
				'technical-knowledge/java/java-concurrency',
				'technical-knowledge/java/java-io',
				'technical-knowledge/java/java-jvm',
				'technical-knowledge/java/java-new-features'
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
