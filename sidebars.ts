
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
			type: 'category',
			label: '📖 System Design',
			items: [
				'technical-knowledge/system-design/intro',
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
			]
		},
		{
			type: 'category',
			label: '🔐 Security',
			items: [
				'technical-knowledge/security/security-intro',
				{
					type: 'category',
					label: '🔐 Core Security',
					collapsed: false,
					items: [
						'technical-knowledge/security/authentication-authorization',
						'technical-knowledge/security/web-vulnerabilities',
						'technical-knowledge/security/cryptography-secure-design',
						'technical-knowledge/security/api-security',
					],
				},
				{
					type: 'category',
					label: '🏛️ Governance & Compliance',
					collapsed: false,
					items: [
						'technical-knowledge/security/privacy-compliance',
						'technical-knowledge/security/identity-access-management',
					],
				},
				{
					type: 'category',
					label: '🛡️ Operations & Infrastructure',
					collapsed: false,
					items: [
						'technical-knowledge/security/network-security',
						'technical-knowledge/security/secure-sdlc',
						'technical-knowledge/security/incident-response',
					],
				},
				{
					type: 'category',
					label: '🎯 Interview Prep',
					collapsed: false,
					items: [
						'technical-knowledge/security/security-interview-questions',
					],
				},
			]
		},
		{
			type: 'category',
			label: '🌐 Network Overview',
			items: [
				'technical-knowledge/networking/networking-overview',
				{
					type: 'category',
					label: '🔩 Foundations',
					collapsed: false,
					items: [
						'technical-knowledge/networking/osi-tcpip-models',
						'technical-knowledge/networking/ip-addressing-routing',
						'technical-knowledge/networking/tcp-udp-transport-layer',
						'technical-knowledge/networking/quic-modern-transport',
					],
				},
				{
					type: 'category',
					label: '🌍 Application Layer',
					collapsed: false,
					items: [
						'technical-knowledge/networking/http-https-application-layer',
						'technical-knowledge/networking/dns-resolution',
						'technical-knowledge/networking/websockets-realtime',
						'technical-knowledge/networking/application-protocols-reference',
					],
				},
				{
					type: 'category',
					label: '🏗️ Infrastructure',
					collapsed: false,
					items: [
						'technical-knowledge/networking/cdn-load-balancing',
						'technical-knowledge/networking/proxies-nat-firewalls',
						'technical-knowledge/networking/socket-programming-io-models',
					],
				},
				{
					type: 'category',
					label: '🔌 API Design',
					collapsed: false,
					items: [
						'technical-knowledge/networking/rest-grpc-api-design',
						'technical-knowledge/networking/api-authentication-security',
					],
				},
				{
					type: 'category',
					label: '☁️ Distributed & Cloud',
					collapsed: false,
					items: [
						'technical-knowledge/networking/service-mesh-microservices',
						'technical-knowledge/networking/network-performance-optimization',
					],
				},
				{
					type: 'category',
					label: '🛡️ Security',
					collapsed: false,
					items: [
						'technical-knowledge/networking/network-security',
					],
				},
				{
					type: 'category',
					label: '🔧 Tools & Interview Prep',
					collapsed: false,
					items: [
						'technical-knowledge/networking/network-troubleshooting-tools',
						'technical-knowledge/networking/networking-interview-questions',
					],
				},
			]
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
		{
			type: 'category',
			label: '🐳 DevOps & Containerization',
			items: [
				'technical-knowledge/devops/devops-intro',
				{
					type: 'category',
					label: '🐳 Docker',
					collapsed: false,
					items: [
						'technical-knowledge/devops/docker-fundamentals',
						'technical-knowledge/devops/dockerfile',
						'technical-knowledge/devops/docker-commands',
						'technical-knowledge/devops/docker-networking',
						'technical-knowledge/devops/docker-volumes',
						'technical-knowledge/devops/docker-compose',
					],
				},
				{
					type: 'category',
					label: '☸️ Kubernetes',
					collapsed: false,
					items: [
						'technical-knowledge/devops/kubernetes-fundamentals',
						'technical-knowledge/devops/kubernetes-pods',
						'technical-knowledge/devops/kubernetes-workloads',
						'technical-knowledge/devops/kubernetes-networking',
						'technical-knowledge/devops/kubernetes-storage',
						'technical-knowledge/devops/kubernetes-configuration',
					],
				},
				{
					type: 'category',
					label: '🛠️ Tooling',
					collapsed: false,
					items: [
						'technical-knowledge/devops/kubectl-commands',
						'technical-knowledge/devops/helm',
					],
				},
				{
					type: 'category',
					label: '🎯 Interview Prep',
					collapsed: false,
					items: [
						'technical-knowledge/devops/devops-interview-questions',
					],
				},
			]
		},
		{
			type: 'category',
			label: '🏛️ Banking & Finance',
			items: [
				'technical-knowledge/banking/overview',
				{
					type: 'category',
					label: '📨 ISO 20022 Messages',
					collapsed: false,
					items: [
						'technical-knowledge/banking/pain001',
						'technical-knowledge/banking/pacs008'
					]
				},
				{
					type: 'category',
					label: '🔄 ISO 20022 Migration',
					collapsed: false,
					items: ['technical-knowledge/banking/iso20022_migration']
				},
				{
					type: 'category',
					label: '🛤️ Payment Rails & Networks',
					collapsed: false,
					items: [
						'technical-knowledge/banking/npp',
						'technical-knowledge/banking/bpay'
					]
				},
				{
					type: 'category',
					label: '🏛️ Parties & Institutions',
					collapsed: false,
					items: ['technical-knowledge/banking/account_types']
				},
				{
					type: 'category',
					label: '📒 Accounting & Posting',
					collapsed: false,
					items: ['technical-knowledge/banking/fx']
				},
				{
					type: 'category',
					label: '🛡️ Risk & Compliance',
					collapsed: false,
					items: ['technical-knowledge/banking/fraud']
				},
				{
					type: 'category',
					label: '⚙️ Operations',
					collapsed: false,
					items: [
						'technical-knowledge/banking/reconciliation',
						'technical-knowledge/banking/payment_exceptions'
					]
				},
				{
					type: 'category',
					label: '🚀 Modern Banking',
					collapsed: false,
					items: ['technical-knowledge/banking/open_banking']
				},
				{
					type: 'category',
					label: '📚 Banking References',
					collapsed: true,
					items: [
						'technical-knowledge/banking/inbound',
						'technical-knowledge/banking/outbound',
						'technical-knowledge/banking/clearing',
						'technical-knowledge/banking/settlement',
						'technical-knowledge/banking/onus',
						'technical-knowledge/banking/debtor',
						'technical-knowledge/banking/direct_debit',
						'technical-knowledge/banking/debit_post',
						'technical-knowledge/banking/credit_post',
						'technical-knowledge/banking/payment_return',
						'technical-knowledge/banking/debit_reversal',
						'technical-knowledge/banking/sanction',
						'technical-knowledge/banking/swift',
						'technical-knowledge/banking/fis',
						'technical-knowledge/banking/aml_kyc',
						'technical-knowledge/banking/camt053',
						'technical-knowledge/banking/camt054',
						'technical-knowledge/banking/pacs002'
					]
				}
			]
		}
	]
}

export default sidebars
