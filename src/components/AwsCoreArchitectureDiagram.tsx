import React, { useState } from 'react';

type ArchTab = 'multi_az' | 'async_pipeline' | 'security_mesh';
type ServiceKey = 'vpc' | 'alb' | 'ec2_asg' | 'rds_multiaz' | 's3' | 'lambda' | 'sqs' | 'secrets_manager';

export default function AwsCoreArchitectureDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ArchTab>('multi_az');
  const [selectedService, setSelectedService] = useState<ServiceKey>('alb');

  const serviceDetails: Record<ServiceKey, {
    title: string;
    category: string;
    color: string;
    role: string;
    securityRules: string;
    gotcha: string;
  }> = {
    vpc: {
      title: 'Virtual Private Cloud (VPC) & Multi-AZ Subnets',
      category: 'Networking & Isolation',
      color: '#38bdf8',
      role: 'Provides an isolated private network (e.g. 10.0.0.0/16) split across 2+ Availability Zones with Public, Private, and Isolated Subnets.',
      securityRules: 'NACLs at subnet boundary + Route Tables directing 0.0.0.0/0 to IGW (public) or NAT Gateway (private).',
      gotcha: 'Always deploy NAT Gateways across at least 2 AZs in production; a single NAT Gateway creates a single point of failure (SPOF).'
    },
    alb: {
      title: 'Application Load Balancer (ALB)',
      category: 'Traffic Routing & SSL',
      color: '#34d399',
      role: 'Public Layer 7 load balancer terminating HTTPS (TLS) certificates via AWS Certificate Manager (ACM) and routing traffic to healthy EC2 instances.',
      securityRules: 'Security Group: INBOUND 443 (from 0.0.0.0/0), OUTBOUND to EC2 Security Group on port 8080.',
      gotcha: 'Enable cross-zone load balancing and configure proper health check intervals to prevent routing traffic to unhealthy instances.'
    },
    ec2_asg: {
      title: 'EC2 Auto Scaling Group (ASG)',
      category: 'Elastic Compute',
      color: '#fbbf24',
      role: 'Scales backend compute instances dynamically based on CPU utilization and request count across AZ-a and AZ-b.',
      securityRules: 'Security Group: INBOUND only from ALB Security Group on port 8080 (zero direct internet exposure).',
      gotcha: 'Attach IAM Instance Roles instead of hardcoding AWS credentials in configuration files.'
    },
    rds_multiaz: {
      title: 'Amazon RDS Multi-AZ (PostgreSQL / MySQL)',
      category: 'Managed Relational Database',
      color: '#38bdf8',
      role: 'Primary read/write database in AZ-a with synchronous physical replication to a Standby replica in AZ-b. Automated DNS failover in <60s.',
      securityRules: 'Security Group: INBOUND port 5432 ONLY from EC2 App Security Group.',
      gotcha: 'Multi-AZ Standby does NOT serve read traffic (use Read Replicas for scaling reads; Multi-AZ is strictly for disaster recovery).'
    },
    s3: {
      title: 'Amazon S3 (Object Storage)',
      category: 'Storage & Events',
      color: '#f97316',
      role: 'Stores user-uploaded photos and media with 11 9s of durability (99.999999999%). Generates presigned URLs for secure direct-to-S3 uploads.',
      securityRules: 'Bucket Policy: Block Public Access enabled; access granted via IAM Roles or Presigned URLs.',
      gotcha: 'Use S3 Lifecycle Rules (Standard ➔ Glacier Flexible ➔ Deep Archive) to dramatically reduce cold storage costs.'
    },
    lambda: {
      title: 'AWS Lambda (Serverless Compute)',
      category: 'Event-Driven Processing',
      color: '#a78bfa',
      role: 'Triggered asynchronously by S3 `s3:ObjectCreated:*` events to resize images and extract EXIF metadata in milliseconds.',
      securityRules: 'Execution IAM Role granting `s3:GetObject` on input bucket and `s3:PutObject` on thumbnails bucket.',
      gotcha: 'Beware of recursive loops (Lambda writing back to the same S3 bucket triggering the same event indefinitely).'
    },
    sqs: {
      title: 'Amazon SQS (Decoupling & Buffer)',
      category: 'Asynchronous Messaging',
      color: '#f97316',
      role: 'Buffers AI moderation tasks and heavy background jobs so traffic spikes do not crash downstream services.',
      securityRules: 'SQS Access Policy restricting SendMessage to Lambda / App Servers.',
      gotcha: 'Always configure a Dead-Letter Queue (DLQ) with a maxReceiveCount to capture poison pill messages.'
    },
    secrets_manager: {
      title: 'AWS Secrets Manager & KMS',
      category: 'Security & Encryption',
      color: '#f472b6',
      role: 'Stores and automatically rotates database passwords and API keys, encrypted at rest via AWS Key Management Service (KMS).',
      securityRules: 'IAM Policy granting `secretsmanager:GetSecretValue` and `kms:Decrypt` to EC2/Lambda roles.',
      gotcha: 'Cache secrets in application memory with a short TTL to prevent paying per-API-call charges on every web request.'
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          AWS Production Cloud Architecture Blueprint
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'multi_az', label: '🏢 Multi-AZ VPC Architecture', color: '#38bdf8' },
            { id: 'async_pipeline', label: '⚡ S3 + Lambda Media Pipeline', color: '#a78bfa' },
            { id: 'security_mesh', label: '🔒 Security, KMS & Secrets', color: '#f472b6' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as ArchTab)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Visual SVG Topology */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
          <svg viewBox="0 0 820 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="arrow-aws-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
              </marker>
              <marker id="arrow-aws-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
              </marker>
              <marker id="arrow-aws-purple" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#a78bfa" />
              </marker>
            </defs>

            {activeTab === 'multi_az' && (
              <g transform="translate(10, 15)">
                {/* Internet / Users */}
                <rect x="0" y="55" width="80" height="70" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                <text x="10" y="85" fill="#38bdf8" fontSize="10" fontWeight="700">Internet Users</text>
                <text x="10" y="105" fill="#e0f2fe" fontSize="8">Route 53 DNS</text>

                <path d="M 85 90 L 125 90" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-aws-blue)" className="interactive-diagram-flowing-path" />

                {/* VPC Boundary */}
                <rect x="130" y="0" width="670" height="190" rx="10" fill="rgba(15, 23, 42, 0.7)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="145" y="20" fill="#38bdf8" fontSize="11" fontWeight="700">☁️ VPC (10.0.0.0/16) - Region: us-east-1</text>

                {/* Public Subnets (ALB & NAT) */}
                <rect x="145" y="30" width="130" height="145" rx="6" fill="rgba(52, 211, 153, 0.1)" stroke="#34d399" />
                <text x="155" y="48" fill="#34d399" fontSize="10" fontWeight="700">Public Subnets</text>
                <rect x="155" y="60" width="110" height="45" rx="4" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399" />
                <text x="162" y="80" fill="#ffffff" fontSize="9" fontWeight="700">⚖️ ALB (Multi-AZ)</text>
                <text x="162" y="95" fill="#a7f3d0" fontSize="8">SSL / Layer 7</text>
                <rect x="155" y="115" width="110" height="45" rx="4" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                <text x="162" y="135" fill="#ffffff" fontSize="9" fontWeight="700">🌐 NAT Gateway</text>
                <text x="162" y="150" fill="#a7f3d0" fontSize="8">Outbound Egress</text>

                <path d="M 280 82 L 325 82" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-aws-green)" className="interactive-diagram-flowing-path" />

                {/* Private App Subnets (EC2 ASG) */}
                <rect x="330" y="30" width="220" height="145" rx="6" fill="rgba(251, 191, 36, 0.1)" stroke="#fbbf24" />
                <text x="340" y="48" fill="#fbbf24" fontSize="10" fontWeight="700">Private App Subnets (ASG)</text>
                <rect x="340" y="60" width="95" height="100" rx="4" fill="rgba(251, 191, 36, 0.2)" stroke="#fbbf24" />
                <text x="348" y="80" fill="#ffffff" fontSize="9" fontWeight="700">🖥️ EC2 (AZ-a)</text>
                <text x="348" y="98" fill="#fef08a" fontSize="8">Spring / Node</text>
                <text x="348" y="115" fill="#fef08a" fontSize="8">Port 8080</text>
                <text x="348" y="145" fill="#94a3b8" fontSize="8">IAM Role</text>

                <rect x="445" y="60" width="95" height="100" rx="4" fill="rgba(251, 191, 36, 0.2)" stroke="#fbbf24" />
                <text x="453" y="80" fill="#ffffff" fontSize="9" fontWeight="700">🖥️ EC2 (AZ-b)</text>
                <text x="453" y="98" fill="#fef08a" fontSize="8">Auto Scaling</text>
                <text x="453" y="115" fill="#fef08a" fontSize="8">Port 8080</text>
                <text x="453" y="145" fill="#94a3b8" fontSize="8">IAM Role</text>

                <path d="M 555 110 L 595 110" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-aws-blue)" className="interactive-diagram-flowing-path" />

                {/* Isolated Database Subnets (RDS Multi-AZ) */}
                <rect x="600" y="30" width="185" height="145" rx="6" fill="rgba(56, 189, 248, 0.1)" stroke="#38bdf8" />
                <text x="610" y="48" fill="#38bdf8" fontSize="10" fontWeight="700">Isolated DB Subnets</text>
                <rect x="610" y="60" width="165" height="45" rx="4" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" />
                <text x="618" y="80" fill="#ffffff" fontSize="9" fontWeight="700">🗄️ Primary RDS (AZ-a)</text>
                <text x="618" y="95" fill="#93c5fd" fontSize="8">Read/Write (Port 5432)</text>

                <rect x="610" y="115" width="165" height="45" rx="4" fill="rgba(148, 163, 184, 0.2)" stroke="#94a3b8" strokeDasharray="3 3" />
                <text x="618" y="135" fill="#cbd5e1" fontSize="9" fontWeight="700">🛡️ Standby Replica (AZ-b)</text>
                <text x="618" y="150" fill="#94a3b8" fontSize="8">Sync Replication (Auto Failover)</text>
              </g>
            )}

            {activeTab === 'async_pipeline' && (
              <g transform="translate(15, 20)">
                {/* 1. Client Presigned Upload */}
                <rect x="0" y="40" width="130" height="80" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                <text x="12" y="65" fill="#38bdf8" fontSize="11" fontWeight="700">1. Mobile Client</text>
                <text x="12" y="85" fill="#e2e8f0" fontSize="9">Direct S3 Upload</text>
                <text x="12" y="102" fill="#93c5fd" fontSize="8">Presigned URL (Zero Server Load)</text>

                <path d="M 135 80 L 195 80" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-aws-blue)" className="interactive-diagram-flowing-path" />

                {/* 2. S3 Bucket */}
                <rect x="200" y="30" width="150" height="100" rx="6" fill="rgba(249, 115, 22, 0.15)" stroke="#f97316" strokeWidth="1.5" />
                <text x="12" y="55" transform="translate(200, 0)" fill="#f97316" fontSize="11" fontWeight="700">2. S3 Bucket</text>
                <text x="12" y="75" transform="translate(200, 0)" fill="#fed7aa" fontSize="9">`photos-raw/`</text>
                <text x="12" y="95" transform="translate(200, 0)" fill="#e2e8f0" fontSize="8">Event Notification</text>
                <text x="12" y="112" transform="translate(200, 0)" fill="#fdba74" fontSize="8">`s3:ObjectCreated:*`</text>

                <path d="M 355 80 L 415 80" fill="none" stroke="#f97316" strokeWidth="2" markerEnd="url(#arrow-aws-purple)" className="interactive-diagram-flowing-path" />

                {/* 3. AWS Lambda Resizer */}
                <rect x="420" y="30" width="160" height="100" rx="6" fill="rgba(167, 139, 250, 0.15)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="12" y="55" transform="translate(420, 0)" fill="#a78bfa" fontSize="11" fontWeight="700">3. AWS Lambda</text>
                <text x="12" y="75" transform="translate(420, 0)" fill="#e2e8f0" fontSize="9">Serverless Resizer</text>
                <text x="12" y="95" transform="translate(420, 0)" fill="#c4b5fd" fontSize="8">Generates 256x256 Thumb</text>
                <text x="12" y="112" transform="translate(420, 0)" fill="#c4b5fd" fontSize="8">Saves to `photos-thumb/`</text>

                <path d="M 585 80 L 635 80" fill="none" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#arrow-aws-purple)" className="interactive-diagram-flowing-path" />

                {/* 4. SQS Buffer for AI */}
                <rect x="640" y="30" width="150" height="100" rx="6" fill="rgba(249, 115, 22, 0.15)" stroke="#f97316" />
                <text x="12" y="55" transform="translate(640, 0)" fill="#f97316" fontSize="11" fontWeight="700">4. Amazon SQS</text>
                <text x="12" y="75" transform="translate(640, 0)" fill="#e2e8f0" fontSize="9">AI Moderation Queue</text>
                <text x="12" y="95" transform="translate(640, 0)" fill="#fed7aa" fontSize="8">Decouples heavy ML</text>
                <text x="12" y="112" transform="translate(640, 0)" fill="#fed7aa" fontSize="8">DLQ on 3 retries</text>
              </g>
            )}

            {activeTab === 'security_mesh' && (
              <g transform="translate(15, 20)">
                {/* IAM Roles */}
                <rect x="0" y="30" width="180" height="110" rx="6" fill="rgba(244, 114, 182, 0.15)" stroke="#f472b6" />
                <text x="12" y="55" fill="#f472b6" fontSize="11" fontWeight="700">1. IAM Roles & Least Privilege</text>
                <text x="12" y="75" fill="#e2e8f0" fontSize="9">• Instance Profiles for EC2</text>
                <text x="12" y="95" fill="#e2e8f0" fontSize="9">• Execution Roles for Lambda</text>
                <text x="12" y="115" fill="#fbcfe8" fontSize="8">Zero permanent access keys</text>

                <path d="M 185 85 L 245 85" fill="none" stroke="#f472b6" strokeWidth="2" markerEnd="url(#arrow-aws-blue)" className="interactive-diagram-flowing-path" />

                {/* KMS & Secrets Manager */}
                <rect x="250" y="30" width="260" height="110" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                <text x="15" y="55" transform="translate(250, 0)" fill="#38bdf8" fontSize="11" fontWeight="700">2. Secrets Manager & AWS KMS</text>
                <text x="15" y="75" transform="translate(250, 0)" fill="#e2e8f0" fontSize="9">• Automated 30-day DB password rotation</text>
                <text x="15" y="95" transform="translate(250, 0)" fill="#e2e8f0" fontSize="9">• Envelope encryption for S3, RDS, EBS</text>
                <text x="15" y="115" transform="translate(250, 0)" fill="#93c5fd" fontSize="8">Hardware Security Module (HSM) FIPS 140-2</text>

                <path d="M 515 85 L 575 85" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-aws-blue)" className="interactive-diagram-flowing-path" />

                {/* CloudWatch & X-Ray */}
                <rect x="580" y="30" width="210" height="110" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                <text x="15" y="55" transform="translate(580, 0)" fill="#34d399" fontSize="11" fontWeight="700">3. CloudWatch & X-Ray</text>
                <text x="15" y="75" transform="translate(580, 0)" fill="#e2e8f0" fontSize="9">• Centralized application log aggregation</text>
                <text x="15" y="95" transform="translate(580, 0)" fill="#e2e8f0" fontSize="9">• ASG alarms on CPU &gt; 70%</text>
                <text x="15" y="115" transform="translate(580, 0)" fill="#86efac" fontSize="8">Distributed end-to-end trace maps</text>
              </g>
            )}
          </svg>
        </div>

        {/* Interactive Service Inspector */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '6px' }}>
            Click an AWS Building Block to inspect its production configuration:
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {Object.keys(serviceDetails).map(key => {
              const svc = serviceDetails[key as ServiceKey];
              const isSelected = selectedService === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedService(key as ServiceKey)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${isSelected ? svc.color : 'rgba(255,255,255,0.08)'}`,
                    background: isSelected ? `${svc.color}20` : 'rgba(255,255,255,0.02)',
                    color: isSelected ? svc.color : 'var(--ifm-color-content-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  {svc.title.split(' ')[0]} {svc.title.split(' ')[1]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Service Card */}
        <div style={{
          padding: '14px',
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${serviceDetails[selectedService].color}40`,
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: serviceDetails[selectedService].color }}>
              {serviceDetails[selectedService].title}
            </span>
            <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '4px', background: `${serviceDetails[selectedService].color}20`, color: serviceDetails[selectedService].color }}>
              {serviceDetails[selectedService].category}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', marginBottom: '8px', lineHeight: 1.5 }}>
            <strong>Production Role:</strong> {serviceDetails[selectedService].role}
          </div>
          <div style={{ fontSize: '12px', color: '#86efac', marginBottom: '8px', lineHeight: 1.5 }}>
            <strong>🛡️ Security Rules:</strong> {serviceDetails[selectedService].securityRules}
          </div>
          <div style={{ fontSize: '12px', color: '#fef08a', lineHeight: 1.5 }}>
            <strong>⚠️ Production Gotcha:</strong> {serviceDetails[selectedService].gotcha}
          </div>
        </div>
      </div>
    </div>
  );
}
