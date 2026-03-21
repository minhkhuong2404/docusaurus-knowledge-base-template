
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
				{
					type: 'category',
					label: '🎯 Interview Questions',
					collapsed: false,
					items: [
						'technical-knowledge/java/java-interview-questions',
					]
				}
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
						'technical-knowledge/security/keys-signing-tls',
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
						'technical-knowledge/security/interview-questions',
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
				'technical-knowledge/kafka/intro',
				{
					type: 'category',
					label: '🏗️ Core Concepts',
					collapsed: false,
					items: [
						'technical-knowledge/kafka/core/kafka-overview',
						'technical-knowledge/kafka/core/topic',
						'technical-knowledge/kafka/core/partition',
						'technical-knowledge/kafka/core/broker',
						'technical-knowledge/kafka/core/replication'
					]
				},
				{
					type: 'category',
					label: '📤 Producer',
					collapsed: false,
					items: [
						'technical-knowledge/kafka/producer/producer-overview',
						'technical-knowledge/kafka/producer/producer-acks',
						'technical-knowledge/kafka/producer/producer-idempotency',
						'technical-knowledge/kafka/producer/producer-transactions'
					]
				},
				{
					type: 'category',
					label: '📥 Consumer',
					collapsed: false,
					items: [
						'technical-knowledge/kafka/consumer/consumer-overview',
						'technical-knowledge/kafka/consumer/consumer-group',
						'technical-knowledge/kafka/consumer/parallel-consumer',
						'technical-knowledge/kafka/consumer/parallel-consumer-deep-dive'
					]
				},
				{
					type: 'category',
					label: '🔌 Ecosystem',
					collapsed: false,
					items: [
						'technical-knowledge/kafka/advanced/kafka-connect',
						'technical-knowledge/kafka/advanced/kafka-streams',
						'technical-knowledge/kafka/advanced/kafka-streams-deep-dive',
						'technical-knowledge/kafka/advanced/schema-registry',
						'technical-knowledge/kafka/advanced/exactly-once-vs-dedup'
					]
				},
				{
					type: 'category',
					label: '📈 Reliability & Operations',
					collapsed: false,
					items: [
						'technical-knowledge/kafka/advanced/exactly-once',
						'technical-knowledge/kafka/advanced/order-messages',
						'technical-knowledge/kafka/advanced/monitoring-operations'
					]
				},
				{
					type: 'category',
					label: '🎯 Interview Prep',
					collapsed: false,
					items: [
						'technical-knowledge/kafka/interview/interview-core',
						'technical-knowledge/kafka/interview/interview-producer-consumer',
						'technical-knowledge/kafka/interview/interview-advanced'
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
			label: '☁️ AWS',
			items: [
				'technical-knowledge/aws/overview',
				{
					type: 'category',
					label: '🔐 Identity & Access',
					collapsed: false,
					items: [
						'technical-knowledge/aws/iam/index',
						'technical-knowledge/aws/iam/cognito',
					],
				},
				{
					type: 'category',
					label: '🧠 Compute & APIs',
					collapsed: false,
					items: [
						'technical-knowledge/aws/lambda/index',
						'technical-knowledge/aws/lambda/layers-and-versions',
						'technical-knowledge/aws/api-gateway/index',
						'technical-knowledge/aws/beanstalk/index',
					],
				},
				{
					type: 'category',
					label: '🗄️ Storage & Databases',
					collapsed: false,
					items: [
						'technical-knowledge/aws/s3/index',
						'technical-knowledge/aws/s3/advanced',
						'technical-knowledge/aws/dynamodb/index',
						'technical-knowledge/aws/dynamodb/advanced',
						'technical-knowledge/aws/elasticache/index',
					],
				},
				{
					type: 'category',
					label: '📨 Messaging & Workflows',
					collapsed: false,
					items: [
						'technical-knowledge/aws/messaging/sns',
						'technical-knowledge/aws/messaging/sqs',
						'technical-knowledge/aws/messaging/kinesis',
						'technical-knowledge/aws/step-functions/index',
					],
				},
				{
					type: 'category',
					label: '🛠️ DevOps & Infrastructure',
					collapsed: false,
					items: [
						'technical-knowledge/aws/cloudformation/index',
						'technical-knowledge/aws/cloudformation/sam',
						'technical-knowledge/aws/cicd/index',
						'technical-knowledge/aws/cicd/code-build',
						'technical-knowledge/aws/cicd/code-deploy',
						'technical-knowledge/aws/cicd/code-pipeline',
						'technical-knowledge/aws/containers/ecs-ecr',
					],
				},
				{
					type: 'category',
					label: '📈 Monitoring & Security',
					collapsed: false,
					items: [
						'technical-knowledge/aws/monitoring/cloudwatch',
						'technical-knowledge/aws/monitoring/cloudtrail',
						'technical-knowledge/aws/monitoring/x-ray',
						'technical-knowledge/aws/security/kms',
						'technical-knowledge/aws/security/secrets-manager',
						'technical-knowledge/aws/security/ssm-parameter-store',
					],
				},
				'technical-knowledge/aws/exam-tips',
			],
		},
		{
			type: 'category',
			label: '🏛️ Banking & Finance',
			items: [
				{ type: 'doc', id: 'technical-knowledge/banking/overview', label: '🏦 Overview' },
				{
					type: 'category',
					label: '🎓 New Learner Guide',
					collapsed: false,
					items: [
						{ type: 'doc', id: 'technical-knowledge/banking/payment_lifecycle_101', label: 'Payment Lifecycle 101' },
						{ type: 'doc', id: 'technical-knowledge/banking/banking_roles', label: 'Roles & Teams' },
						{ type: 'doc', id: 'technical-knowledge/banking/glossary', label: 'A-Z Glossary' },
					]
				},
				{
					type: 'category',
					label: '📨 ISO 20022 Messages',
					collapsed: false,
					items: [
						{
							type: 'category',
							label: '💸 Payment Initiation (pain)',
							collapsed: false,
							items: [
								{ type: 'doc', id: 'technical-knowledge/banking/pain001', label: 'pain.001 - Credit Transfer Initiation' },
								{ type: 'doc', id: 'technical-knowledge/banking/pain004', label: 'pain.004 - Clarification' },
								{ type: 'doc', id: 'technical-knowledge/banking/pain007_pacs007', label: 'pain.007 / pacs.007 - Reversal' }
							]
						},
						{
							type: 'category',
							label: '🏦 Payment Clearing & Settlement (pacs)',
							collapsed: false,
							items: [
								{ type: 'doc', id: 'technical-knowledge/banking/pacs008', label: 'pacs.008 - FI-to-FI Credit Transfer' },
								{ type: 'doc', id: 'technical-knowledge/banking/pacs002', label: 'pacs.002 - FI-to-FI Status Report' },
								{ type: 'doc', id: 'technical-knowledge/banking/pacs004', label: 'pacs.004 - Payment Return' }
							]
						},
						{
							type: 'category',
							label: '📒 Cash Management (camt)',
							collapsed: false,
							items: [
								{ type: 'doc', id: 'technical-knowledge/banking/camt054', label: 'camt.054 - Debit/Credit Notification' },
								{ type: 'doc', id: 'technical-knowledge/banking/camt053', label: 'camt.053 - Account Statement' },
								{ type: 'doc', id: 'technical-knowledge/banking/camt055_camt056', label: 'camt.055 / camt.056 - Cancellation' }
							]
						}
					]
				},
				{
					type: 'category',
					label: '🔄 ISO 20022 Migration',
					collapsed: true,
					items: [{ type: 'doc', id: 'technical-knowledge/banking/iso20022_migration', label: 'MT to MX Migration Guide' }]
				},
				{
					type: 'category',
					label: '💸 Payment Flows',
					collapsed: false,
					items: [
						{ type: 'doc', id: 'technical-knowledge/banking/inbound', label: 'Inbound Payments' },
						{ type: 'doc', id: 'technical-knowledge/banking/outbound', label: 'Outbound Payments' },
						{ type: 'doc', id: 'technical-knowledge/banking/onus', label: 'On-Us & Off-Us' }
					]
				},
				{
					type: 'category',
					label: '🛤️ Payment Rails & Networks',
					collapsed: false,
					items: [
						{ type: 'doc', id: 'technical-knowledge/banking/npp', label: 'NPP - New Payments Platform' },
						{ type: 'doc', id: 'technical-knowledge/banking/swift', label: 'SWIFT - International' },
						{ type: 'doc', id: 'technical-knowledge/banking/direct_debit', label: 'Direct Debit (BECS & PayTo)' },
						{ type: 'doc', id: 'technical-knowledge/banking/bpay', label: 'BPAY - Bill Payments' }
					]
				},
				{
					type: 'category',
					label: '🏛️ Parties & Institutions',
					collapsed: false,
					items: [
						{ type: 'doc', id: 'technical-knowledge/banking/debtor', label: 'Debtor & Creditor' },
						{ type: 'doc', id: 'technical-knowledge/banking/fis', label: 'Financial Institutions' },
						{ type: 'doc', id: 'technical-knowledge/banking/account_types', label: 'Account Types' },
						{ type: 'doc', id: 'technical-knowledge/banking/core_banking', label: 'Core Banking System (CBS)' }
					]
				},
				{
					type: 'category',
					label: '📒 Accounting & Posting',
					collapsed: false,
					items: [
						{ type: 'doc', id: 'technical-knowledge/banking/debit_post', label: 'Debit Posting' },
						{ type: 'doc', id: 'technical-knowledge/banking/credit_post', label: 'Credit Posting' },
						{ type: 'doc', id: 'technical-knowledge/banking/debit_reversal', label: 'Debit Reversal' },
						{ type: 'doc', id: 'technical-knowledge/banking/payment_return', label: 'Payment Return' },
						{ type: 'doc', id: 'technical-knowledge/banking/fx', label: 'FX in Payments' },
						{ type: 'doc', id: 'technical-knowledge/banking/interest_fees', label: 'Interest & Fees' }
					]
				},
				{
					type: 'category',
					label: '⚖️ Clearing & Settlement',
					collapsed: false,
					items: [
						{ type: 'doc', id: 'technical-knowledge/banking/clearing', label: 'Clearing' },
						{ type: 'doc', id: 'technical-knowledge/banking/settlement', label: 'Settlement' }
					]
				},
				{
					type: 'category',
					label: '💳 Cards',
					collapsed: false,
					items: [{ type: 'doc', id: 'technical-knowledge/banking/cards', label: 'Cards & Card Schemes' }]
				},
				{
					type: 'category',
					label: '🛡️ Risk & Compliance',
					collapsed: false,
					items: [
						{ type: 'doc', id: 'technical-knowledge/banking/fraud', label: 'Fraud Detection & Prevention' },
						{ type: 'doc', id: 'technical-knowledge/banking/sanction', label: 'Sanctions Screening' },
						{ type: 'doc', id: 'technical-knowledge/banking/aml_kyc', label: 'AML, CTF & KYC' }
					]
				},
				{
					type: 'category',
					label: '⚙️ Operations',
					collapsed: false,
					items: [
						{ type: 'doc', id: 'technical-knowledge/banking/reconciliation', label: 'Reconciliation' },
						{ type: 'doc', id: 'technical-knowledge/banking/payment_exceptions', label: 'Exceptions & Investigations' }
					]
				},
				{
					type: 'category',
					label: '🧑‍💻 Engineering',
					collapsed: false,
					items: [{ type: 'doc', id: 'technical-knowledge/banking/testing_banking', label: 'Testing in Payments' }]
				},
				{
					type: 'category',
					label: '🚀 Modern Banking',
					collapsed: true,
					items: [{ type: 'doc', id: 'technical-knowledge/banking/open_banking', label: 'Open Banking & CDR' }]
				}

			]
		},
		{
			type: 'category',
			label: '📚 Books',
			collapsed: false,
			items: [
				{
					type: 'category',
					label: '☕ Effective Java',
					collapsed: false,
					items: [
						'books/effective-java/introduction',
						'books/effective-java/items-index',
						'books/effective-java/chapter-02-creating-destroying-objects',
						'books/effective-java/chapter-03-methods-common-to-all-objects',
						'books/effective-java/chapter-04-classes-and-interfaces',
						'books/effective-java/chapter-05-generics',
						'books/effective-java/chapter-06-enums-and-annotations',
						'books/effective-java/chapter-07-lambdas-and-streams',
						'books/effective-java/chapter-08-methods',
						'books/effective-java/chapter-09-general-programming',
						'books/effective-java/chapter-10-exceptions',
						'books/effective-java/chapter-11-concurrency',
						'books/effective-java/chapter-12-serialization'
					]
				}
			]
		},
		{
			type: 'category',
			label: '🎯 Frequently Asked Interview Questions',
			collapsed: false,
			items: [
				{
					type: 'category',
					label: '☕ Core Java',
					collapsed: false,
					items: [
						'technical-knowledge/interview-questions/java/break-singleton-java',
						'technical-knowledge/interview-questions/java/concurrent-collections-interview',
						'technical-knowledge/interview-questions/java/concurrent-collections-tricky',
						'technical-knowledge/interview-questions/java/exception-handling-advanced',
						'technical-knowledge/interview-questions/java/experienced-java-backend-interview',
						'technical-knowledge/interview-questions/java/java-8-optional-crud',
						'technical-knowledge/interview-questions/java/java-8-tricky-interview-questions',
						'technical-knowledge/interview-questions/java/java-collections-differences',
						'technical-knowledge/interview-questions/java/java-collections-interview',
						'technical-knowledge/interview-questions/java/java-collections-interview-p2',
						'technical-knowledge/interview-questions/java/java-comprehensive-interview',
						'technical-knowledge/interview-questions/java/java-experienced-interview-p1',
						'technical-knowledge/interview-questions/java/java-lead-interview-scenarios',
						'technical-knowledge/interview-questions/java/java-multithreading-interview',
						'technical-knowledge/interview-questions/java/java-runtime-exceptions',
						'technical-knowledge/interview-questions/java/java-string-basics',
						'technical-knowledge/interview-questions/java/java-string-rotation',
						'technical-knowledge/interview-questions/java/java-date-time-api',
						'technical-knowledge/interview-questions/java/java-tricky-core-questions',
						'technical-knowledge/interview-questions/java/spring-boot-interview',
						'technical-knowledge/interview-questions/java/spring-boot-real-time-questions',
						'technical-knowledge/interview-questions/java/sql-interview-questions',
						'technical-knowledge/interview-questions/java/tricky-java-interview',
					]
				},
				{
					type: 'category',
					label: '💼 GenZ Career',
					collapsed: false,
					items: [
						'technical-knowledge/interview-questions/genz-career/java-collections-interview-questions',
						'technical-knowledge/interview-questions/genz-career/java-interview-questions-100',
						'technical-knowledge/interview-questions/genz-career/java-interview-questions-trickiest',
						'technical-knowledge/interview-questions/genz-career/java-oops-interview-guide',
						'technical-knowledge/interview-questions/genz-career/java-multithreading-interview-guide',
						{
							type: 'category',
							label: '🏢 Company',
							collapsed: false,
							items: [
								'technical-knowledge/interview-questions/genz-career/company/accenture-java-interview',
								'technical-knowledge/interview-questions/genz-career/company/accenture-java-developer-interview-questions',
								'technical-knowledge/interview-questions/genz-career/company/accenture-java-developer-interview-16lpa',
								'technical-knowledge/interview-questions/genz-career/company/airtel-java-developer-interview-questions',
								'technical-knowledge/interview-questions/genz-career/company/capgemini-java-developer-interview-questions',
								'technical-knowledge/interview-questions/genz-career/company/coforge-java-developer-interview-22lpa',
								'technical-knowledge/interview-questions/genz-career/company/cognizant-fresher-java-developer-interview',
								'technical-knowledge/interview-questions/genz-career/company/deloitte-java-developer-interview-questions',
								'technical-knowledge/interview-questions/genz-career/company/deloitte-java-developer-interview-17lpa',
								'technical-knowledge/interview-questions/genz-career/company/epam-java-developer-interview-22lpa',
								'technical-knowledge/interview-questions/genz-career/company/hashedin-java-developer-interview-questions',
								'technical-knowledge/interview-questions/genz-career/company/hcl-java-fullstack-developer-interview',
								'technical-knowledge/interview-questions/genz-career/company/ibm-java-developer-interview-experience',
								'technical-knowledge/interview-questions/genz-career/company/infosys-java-developer-interview-17lpa',
								'technical-knowledge/interview-questions/genz-career/company/java-developer-interview-iris',
								'technical-knowledge/interview-questions/genz-career/company/ltimindtree-java-developer-interview-questions',
								'technical-knowledge/interview-questions/genz-career/company/nagarro-java-developer-interview-questions',
								'technical-knowledge/interview-questions/genz-career/company/ntt-data-java-developer-interview',
								'technical-knowledge/interview-questions/genz-career/company/oracle-java-developer-interview-questions',
								'technical-knowledge/interview-questions/genz-career/company/paytm-java-developer-interview-questions',
								'technical-knowledge/interview-questions/genz-career/company/pwc-java-developer-interview-questions',
								'technical-knowledge/interview-questions/genz-career/company/tcs-java-developer-interview-13lpa',
								'technical-knowledge/interview-questions/genz-career/company/tech-mahindra-java-developer-interview',
								'technical-knowledge/interview-questions/genz-career/company/walmart-java-developer-interview-30lpa',
								'technical-knowledge/interview-questions/genz-career/company/wipro-fullstack-java-developer-interview',
								'technical-knowledge/interview-questions/genz-career/company/wipro-java-developer-interview-questions'
							]
						},
						{
							type: 'category',
							label: '🧪 Mock',
							collapsed: false,
							items: [
								'technical-knowledge/interview-questions/genz-career/mock/accenture-java-springboot-interview-3-years',
								'technical-knowledge/interview-questions/genz-career/mock/cognizant-java-developer-interview-3-years',
								'technical-knowledge/interview-questions/genz-career/mock/epam-java-developer-interview-experience',
								'technical-knowledge/interview-questions/genz-career/mock/hcl-java-developer-interview-experience',
								'technical-knowledge/interview-questions/genz-career/mock/ibm-java-springboot-interview-3-years',
								'technical-knowledge/interview-questions/genz-career/mock/tcs-ninja-nqt-interview-experience',
								'technical-knowledge/interview-questions/genz-career/mock/paytm-java-developer-interview-first-round',
								'technical-knowledge/interview-questions/genz-career/mock/tcs-java-springboot-interview-3-years',
								'technical-knowledge/interview-questions/genz-career/mock/wipro-java-springboot-interview-3-years'
							]
						},
						{
							type: 'category',
							label: '🚀 Spring Boot',
							collapsed: false,
							items: [
								'technical-knowledge/interview-questions/genz-career/spring-boot/real-time-spring-boot-interview-questions',
								'technical-knowledge/interview-questions/genz-career/spring-boot/scenario-based-springboot-interview-questions',
								'technical-knowledge/interview-questions/genz-career/spring-boot/spring-boot-tricky-interview-questions',
								'technical-knowledge/interview-questions/genz-career/spring-boot/spring-boot-tricky-interview-questions-2',
								'technical-knowledge/interview-questions/genz-career/spring-boot/spring-boot-tricky-interview-questions-3',
								'technical-knowledge/interview-questions/genz-career/spring-boot/spring-boot-tricky-interview-questions-4',
								'technical-knowledge/interview-questions/genz-career/spring-boot/top-spring-security-interview-questions'
							]
						}
					]
				}
			]
		},
	]
}

export default sidebars
