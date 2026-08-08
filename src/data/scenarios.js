// Cloud IAM Scenarios for AI Cloud Permission Risk Visualizer

export const SCENARIOS = [
  {
    id: 'beginner-web-s3',
    title: '🔰 Scenario 0: Beginner Cloud Starter (Simple Web Server & S3 Bucket)',
    description: 'A classic beginner setup: A web application running on an EC2 virtual machine is granted full S3 wildcard access ("s3:*"). If an attacker compromises the web app, they can delete or download all files in the S3 bucket.',
    cloudProvider: 'AWS',
    overallRiskScore: 74,
    nodes: [
      {
        id: 'usr-web-visitor',
        label: 'User: Web App Visitor',
        type: 'user',
        category: 'Internet User',
        riskScore: 25,
        riskLevel: 'low',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:iam::123456789012:user/web-visitor',
          description: 'Regular website user accessing public HTTP port 80/443.',
          beginnerTip: 'An IAM User represents a person or external client interacting with your cloud.'
        }
      },
      {
        id: 'ec2-web-server',
        label: 'Compute: MyFirstWebServer (EC2)',
        type: 'resource',
        category: 'EC2 Virtual Machine',
        riskScore: 55,
        riskLevel: 'medium',
        cloudProvider: 'AWS',
        details: {
          instanceId: 'i-0a1b2c3d4e5f67890',
          instanceType: 't3.micro (Free Tier)',
          publicIP: '54.210.12.44',
          description: 'Beginner Node.js web server running on an Amazon EC2 instance.',
          beginnerTip: 'An EC2 instance is a virtual server in the cloud that runs your application code.'
        }
      },
      {
        id: 'role-web-instance',
        label: 'Role: WebServerRole',
        type: 'role',
        category: 'IAM Instance Role',
        riskScore: 68,
        riskLevel: 'medium',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:iam::123456789012:role/WebServerRole',
          assumableBy: ['ec2.amazonaws.com'],
          description: 'IAM Role assigned to the EC2 web server so code can talk to AWS services.',
          beginnerTip: 'An IAM Role is a set of temporary permissions that a cloud service (like EC2) can assume.'
        }
      },
      {
        id: 'policy-overly-permissive',
        label: 'Policy: EasyS3FullAccessPolicy',
        type: 'policy',
        category: 'IAM Policy',
        riskScore: 88,
        riskLevel: 'critical',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:iam::123456789012:policy/EasyS3FullAccessPolicy',
          statements: [
            {
              Effect: 'Allow',
              Action: 's3:*',
              Resource: '*'
            }
          ],
          description: 'Overly broad IAM Policy granting full read, write, and delete permissions to ALL S3 buckets.',
          beginnerTip: 'Wildcard "s3:*" means ANY S3 operation (delete, read, modify) is allowed on EVERY bucket in the account.'
        }
      },
      {
        id: 'res-s3-uploads',
        label: 'S3: my-app-user-uploads',
        type: 'resource',
        category: 'S3 Object Storage',
        riskScore: 82,
        riskLevel: 'high',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:s3:::my-app-user-uploads',
          publicAccessBlock: false,
          sensitivity: 'HIGH (User Profile Pictures & Confidential Files)',
          description: 'S3 Storage Bucket holding user profile pictures and uploaded documents.',
          beginnerTip: 'S3 (Simple Storage Service) is cloud file storage where files are stored as objects inside buckets.'
        }
      }
    ],
    edges: [
      { id: 'eb1', source: 'usr-web-visitor', target: 'ec2-web-server', label: 'HTTP GET /api/upload', riskType: 'assumes' },
      { id: 'eb2', source: 'ec2-web-server', target: 'role-web-instance', label: 'Uses Instance Profile', riskType: 'assumes' },
      { id: 'eb3', source: 'role-web-instance', target: 'policy-overly-permissive', label: 'Attached Policy', riskType: 'policy' },
      { id: 'eb4', source: 'policy-overly-permissive', target: 'res-s3-uploads', label: 's3:* Unrestricted Control', riskType: 'escalation' }
    ],
    attackPath: ['usr-web-visitor', 'ec2-web-server', 'role-web-instance', 'policy-overly-permissive', 'res-s3-uploads'],
    attackNarrative: [
      {
        step: 1,
        title: 'Beginner Web App Exploitation',
        description: 'An attacker finds a file upload vulnerability in the web server application running on EC2 instance i-0a1b2c3d4e5f67890.',
        affectedNode: 'ec2-web-server'
      },
      {
        step: 2,
        title: 'Metadata Credential Theft',
        description: 'The attacker queries the EC2 Instance Metadata Service (IMDSv1) to steal the temporary security credentials of WebServerRole.',
        affectedNode: 'role-web-instance'
      },
      {
        step: 3,
        title: 'Wildcard Policy Abuse',
        description: 'Because the role uses EasyS3FullAccessPolicy ("s3:*"), the attacker has total control over all S3 buckets instead of just upload rights.',
        affectedNode: 'policy-overly-permissive'
      },
      {
        step: 4,
        title: 'S3 Storage Exfiltration & Deletion',
        description: 'The attacker uses the stolen credentials to download or delete all customer files inside s3:::my-app-user-uploads.',
        affectedNode: 'res-s3-uploads'
      }
    ]
  },
  {
    id: 'ai-agent-escalation',
    title: '🚨 Scenario 1: AI Agent Shadow Escalation',
    description: 'An autonomous Bedrock AI Customer Support Agent is granted iam:PassRole and s3:* without resource restriction. An attacker uses indirect prompt injection to escalate to AdministratorAccess and exfiltrate PII Customer DB.',
    cloudProvider: 'AWS',
    overallRiskScore: 94,
    nodes: [
      {
        id: 'usr-ext-prompt',
        label: 'External User (Attacker)',
        type: 'user',
        category: 'External',
        riskScore: 20,
        riskLevel: 'low',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:iam::123456789012:user/external-api-client',
          created: '2025-01-10',
          mfaEnabled: false,
          unusedDays: 0,
          description: 'Public facing API requester interacting with LLM backend.'
        }
      },
      {
        id: 'agent-support-llm',
        label: 'SupportAI Agent (Bedrock)',
        type: 'ai-agent',
        category: 'AI Agent',
        riskScore: 88,
        riskLevel: 'critical',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:bedrock:us-east-1:123456789012:agent/support-assistant-v2',
          model: 'Claude 3.5 Sonnet',
          autonomousExecution: true,
          toolCount: 14,
          created: '2026-02-01',
          description: 'Autonomous AI agent processing customer service inquiries with tool calling privileges.'
        }
      },
      {
        id: 'role-support-exec',
        label: 'Role: SupportAgentExecRole',
        type: 'role',
        category: 'IAM Role',
        riskScore: 78,
        riskLevel: 'high',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:iam::123456789012:role/SupportAgentExecRole',
          assumableBy: ['bedrock.amazonaws.com'],
          maxSessionDuration: 36000,
          created: '2026-02-01',
          description: 'Execution role assigned to Bedrock support agent.'
        }
      },
      {
        id: 'policy-passrole-wildcard',
        label: 'Policy: AllowPassRoleAndS3',
        type: 'policy',
        category: 'IAM Policy',
        riskScore: 92,
        riskLevel: 'critical',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:iam::123456789012:policy/AllowPassRoleAndS3',
          isManaged: false,
          statements: [
            {
              Effect: 'Allow',
              Action: ['iam:PassRole', 'ec2:RunInstances', 's3:*'],
              Resource: '*'
            }
          ],
          description: 'Wildcard iam:PassRole combined with unrestricted S3 full access.'
        }
      },
      {
        id: 'role-prod-admin',
        label: 'Role: ProductionAdminRole',
        type: 'role',
        category: 'IAM Role',
        riskScore: 98,
        riskLevel: 'critical',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:iam::123456789012:role/ProductionAdminRole',
          assumableBy: ['ec2.amazonaws.com'],
          created: '2024-05-12',
          description: 'Superuser admin execution role for infrastructure management.'
        }
      },
      {
        id: 'policy-admin-access',
        label: 'Policy: AdministratorAccess',
        type: 'policy',
        category: 'Managed Policy',
        riskScore: 100,
        riskLevel: 'critical',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:iam::aws:policy/AdministratorAccess',
          isManaged: true,
          statements: [
            {
              Effect: 'Allow',
              Action: '*',
              Resource: '*'
            }
          ],
          description: 'AWS Managed AdministratorAccess policy with total cloud control.'
        }
      },
      {
        id: 'res-s3-pii-db',
        label: 'S3: customer-pii-vault-prod',
        type: 'resource',
        category: 'S3 Storage',
        riskScore: 95,
        riskLevel: 'critical',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:s3:::customer-pii-vault-prod',
          encryption: 'AES256 (Default Key)',
          publicAccessBlock: true,
          sensitivity: 'CRITICAL (PII, SSN, Credit Cards)',
          objectCount: 4500000,
          sizeGB: 1280
        }
      },
      {
        id: 'res-rds-finance',
        label: 'RDS: finance-db-primary',
        type: 'resource',
        category: 'RDS Database',
        riskScore: 90,
        riskLevel: 'critical',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:rds:us-east-1:123456789012:db:finance-db-primary',
          engine: 'PostgreSQL 15.4',
          publiclyAccessible: false,
          sensitivity: 'HIGH (Financial Ledger)',
          allocatedStorageGB: 500
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'usr-ext-prompt', target: 'agent-support-llm', label: 'Sends Prompt Injection', riskType: 'escalation' },
      { id: 'e2', source: 'agent-support-llm', target: 'role-support-exec', label: 'Assumes Role', riskType: 'assumes' },
      { id: 'e3', source: 'role-support-exec', target: 'policy-passrole-wildcard', label: 'Attached Policy', riskType: 'policy' },
      { id: 'e4', source: 'policy-passrole-wildcard', target: 'role-prod-admin', label: 'iam:PassRole Privilege Escalation', riskType: 'escalation' },
      { id: 'e5', source: 'role-prod-admin', target: 'policy-admin-access', label: 'Attached Policy', riskType: 'policy' },
      { id: 'e6', source: 'policy-admin-access', target: 'res-s3-pii-db', label: 's3:GetObject Exfiltration', riskType: 'data-access' },
      { id: 'e7', source: 'policy-admin-access', target: 'res-rds-finance', label: 'rds:* Full Control', riskType: 'data-access' }
    ],
    attackPath: ['usr-ext-prompt', 'agent-support-llm', 'role-support-exec', 'policy-passrole-wildcard', 'role-prod-admin', 'policy-admin-access', 'res-s3-pii-db'],
    attackNarrative: [
      {
        step: 1,
        title: 'Indirect Prompt Injection',
        description: 'Attacker submits a malicious customer support ticket containing an embedded prompt payload overriding LLM system instructions.',
        affectedNode: 'agent-support-llm'
      },
      {
        step: 2,
        title: 'Tool Execution via Role',
        description: 'The hijacked AI Agent executes cloud tools using its execution role SupportAgentExecRole.',
        affectedNode: 'role-support-exec'
      },
      {
        step: 3,
        title: 'Privilege Escalation via iam:PassRole',
        description: 'The agent leverages iam:PassRole to spawn a rogue compute instance attached to ProductionAdminRole.',
        affectedNode: 'policy-passrole-wildcard'
      },
      {
        step: 4,
        title: 'Administrator Privilege Acquisition',
        description: 'Attacker accesses instance metadata service (IMDS) on the spawned instance to obtain short-lived admin credentials.',
        affectedNode: 'role-prod-admin'
      },
      {
        step: 5,
        title: 'Crown Jewel Data Exfiltration',
        description: 'Using AdministratorAccess permissions, attacker dumps 4.5M PII records from customer-pii-vault-prod S3 bucket.',
        affectedNode: 'res-s3-pii-db'
      }
    ]
  },
  {
    id: 'k8s-multi-cloud',
    title: '⚠️ Scenario 2: Over-Privileged K8s Service Account',
    description: 'A dev Kubernetes pod with service account token exchange can assume cross-cloud AWS & GCP roles with unconstrained KMS decryption and database permissions.',
    cloudProvider: 'Multi-Cloud',
    overallRiskScore: 76,
    nodes: [
      {
        id: 'k8s-pod-analytics',
        label: 'Pod: analytics-worker-app',
        type: 'resource',
        category: 'K8s Workload',
        riskScore: 65,
        riskLevel: 'medium',
        cloudProvider: 'GCP',
        details: {
          namespace: 'analytics-prod',
          image: 'internal-registry/analytics:v1.4.2',
          cveCount: 4,
          description: 'Kubernetes deployment processing telemetry logs.'
        }
      },
      {
        id: 'sa-analytics-gcp',
        label: 'GCP SA: analytics-gcp-sa',
        type: 'user',
        category: 'Service Account',
        riskScore: 72,
        riskLevel: 'high',
        cloudProvider: 'GCP',
        details: {
          email: 'analytics-gcp-sa@prod-project.iam.gserviceaccount.com',
          workloadIdentity: true,
          description: 'GCP Workload Identity Service Account linked to K8s.'
        }
      },
      {
        id: 'role-aws-federated',
        label: 'AWS Role: MultiCloudDataRole',
        type: 'role',
        category: 'IAM Role',
        riskScore: 84,
        riskLevel: 'high',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:iam::998877665544:role/MultiCloudDataRole',
          oidcProvider: 'oidc.eks.us-west-2.amazonaws.com/id/123456789',
          description: 'AWS federated role trust for GCP workloads.'
        }
      },
      {
        id: 'policy-kms-decrypt',
        label: 'Policy: KMSUnrestrictedDecrypt',
        type: 'policy',
        category: 'IAM Policy',
        riskScore: 89,
        riskLevel: 'critical',
        cloudProvider: 'AWS',
        details: {
          statements: [
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:ReEncrypt*', 'kms:DescribeKey'],
              Resource: '*'
            }
          ],
          description: 'Grants decrypt access across all KMS customer master keys.'
        }
      },
      {
        id: 'res-kms-master-key',
        label: 'KMS: master-database-key',
        type: 'resource',
        category: 'KMS Encryption',
        riskScore: 92,
        riskLevel: 'critical',
        cloudProvider: 'AWS',
        details: {
          keyId: 'mrk-8849201948201',
          keySpec: 'SYMMETRIC_DEFAULT',
          keyUsage: 'ENCRYPT_DECRYPT',
          description: 'Master key encrypting all production database backups.'
        }
      }
    ],
    edges: [
      { id: 'ek1', source: 'k8s-pod-analytics', target: 'sa-analytics-gcp', label: 'Binds Identity', riskType: 'assumes' },
      { id: 'ek2', source: 'sa-analytics-gcp', target: 'role-aws-federated', label: 'sts:AssumeRoleWithWebIdentity', riskType: 'assumes' },
      { id: 'ek3', source: 'role-aws-federated', target: 'policy-kms-decrypt', label: 'Attached Policy', riskType: 'policy' },
      { id: 'ek4', source: 'policy-kms-decrypt', target: 'res-kms-master-key', label: 'kms:Decrypt All Secrets', riskType: 'data-access' }
    ],
    attackPath: ['k8s-pod-analytics', 'sa-analytics-gcp', 'role-aws-federated', 'policy-kms-decrypt', 'res-kms-master-key'],
    attackNarrative: [
      {
        step: 1,
        title: 'Pod Vulnerability Exploitation',
        description: 'Vulnerability CVE-2024-3094 in analytics container allows remote code execution inside pod.',
        affectedNode: 'k8s-pod-analytics'
      },
      {
        step: 2,
        title: 'Workload Token Exchange',
        description: 'Attacker extracts mounted K8s token to authenticate as GCP Service Account.',
        affectedNode: 'sa-analytics-gcp'
      },
      {
        step: 3,
        title: 'Cross-Cloud Privilege Hopping',
        description: 'GCP Service Account uses OIDC to assume AWS MultiCloudDataRole without IP restriction.',
        affectedNode: 'role-aws-federated'
      },
      {
        step: 4,
        title: 'Global Master Key Decryption',
        description: 'Attacker uses kms:Decrypt wildcard to decrypt all master database backups.',
        affectedNode: 'res-kms-master-key'
      }
    ]
  },
  {
    id: 'unused-contractor-keys',
    title: '⚡ Scenario 3: Stale Contractor IAM Credentials',
    description: 'An offboarded contractor user account retains active access keys created 180 days ago with inline iam:CreatePolicyVersion escalation.',
    cloudProvider: 'AWS',
    overallRiskScore: 82,
    nodes: [
      {
        id: 'usr-contractor-dev',
        label: 'User: dev-contractor-alex',
        type: 'user',
        category: 'IAM User',
        riskScore: 85,
        riskLevel: 'high',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:iam::123456789012:user/dev-contractor-alex',
          unusedDays: 184,
          accessKeyAgeDays: 184,
          mfaEnabled: false,
          status: 'Inactive User (Offboarded)',
          description: 'Contractor developer account abandoned after project completion.'
        }
      },
      {
        id: 'policy-inline-policy-edit',
        label: 'Policy: DevManagePolicies',
        type: 'policy',
        category: 'Inline Policy',
        riskScore: 88,
        riskLevel: 'critical',
        cloudProvider: 'AWS',
        details: {
          statements: [
            {
              Effect: 'Allow',
              Action: ['iam:CreatePolicyVersion', 'iam:SetDefaultPolicyVersion'],
              Resource: '*'
            }
          ],
          description: 'Allows creating new default versions of IAM policies.'
        }
      },
      {
        id: 'role-devops-lead',
        label: 'Role: DevOpsLeadRole',
        type: 'role',
        category: 'IAM Role',
        riskScore: 91,
        riskLevel: 'critical',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:iam::123456789012:role/DevOpsLeadRole',
          description: 'High-privilege infrastructure lead deployment role.'
        }
      },
      {
        id: 'res-secrets-mgr',
        label: 'SecretsManager: prod/api-tokens',
        type: 'resource',
        category: 'Secrets Vault',
        riskScore: 94,
        riskLevel: 'critical',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/api-tokens',
          secretCount: 32,
          rotationEnabled: false,
          description: 'Contains Stripe API keys, OpenAI master keys, and GitHub access tokens.'
        }
      }
    ],
    edges: [
      { id: 'eu1', source: 'usr-contractor-dev', target: 'policy-inline-policy-edit', label: 'Has Inline Policy', riskType: 'policy' },
      { id: 'eu2', source: 'policy-inline-policy-edit', target: 'role-devops-lead', label: 'Modifies Policy Version', riskType: 'escalation' },
      { id: 'eu3', source: 'role-devops-lead', target: 'res-secrets-mgr', label: 'secretsmanager:GetSecretValue', riskType: 'data-access' }
    ],
    attackPath: ['usr-contractor-dev', 'policy-inline-policy-edit', 'role-devops-lead', 'res-secrets-mgr'],
    attackNarrative: [
      {
        step: 1,
        title: 'Leaked Stale Access Key',
        description: '184-day-old unrotated AWS Access Key for offboarded contractor is leaked in a public GitHub repository.',
        affectedNode: 'usr-contractor-dev'
      },
      {
        step: 2,
        title: 'IAM Policy Version Injection',
        description: 'Attacker leverages iam:CreatePolicyVersion to add Effect: Allow Action: * to an existing managed policy attached to DevOpsLeadRole.',
        affectedNode: 'policy-inline-policy-edit'
      },
      {
        step: 3,
        title: 'Secrets Manager Vault Dump',
        description: 'Attacker assumes updated DevOpsLeadRole and dumps all production API tokens and Stripe private keys.',
        affectedNode: 'res-secrets-mgr'
      }
    ]
  },
  {
    id: 'public-s3-trust',
    title: '🌐 Scenario 4: Public S3 & Unconstrained Trust',
    description: 'Cross-account trust policy allows any external AWS principal to assume storage reader role and access customer financial ledgers.',
    cloudProvider: 'AWS',
    overallRiskScore: 68,
    nodes: [
      {
        id: 'usr-unauth-web',
        label: 'Public Internet / Any AWS Account',
        type: 'user',
        category: 'External Principal',
        riskScore: 30,
        riskLevel: 'low',
        cloudProvider: 'AWS',
        details: {
          principal: 'AWS: "*"',
          description: 'Unrestricted external AWS account or anonymous caller.'
        }
      },
      {
        id: 'role-cross-account-reader',
        label: 'Role: ExternalAnalyticsReader',
        type: 'role',
        category: 'IAM Role',
        riskScore: 82,
        riskLevel: 'high',
        cloudProvider: 'AWS',
        details: {
          trustPolicy: {
            Principal: { AWS: '*' },
            Condition: {}
          },
          description: 'Role with trust relationship Principal AWS: * missing ExternalId condition.'
        }
      },
      {
        id: 'res-s3-billing-logs',
        label: 'S3: company-financial-ledgers',
        type: 'resource',
        category: 'S3 Storage',
        riskScore: 88,
        riskLevel: 'critical',
        cloudProvider: 'AWS',
        details: {
          arn: 'arn:aws:s3:::company-financial-ledgers',
          versioning: true,
          publicAccessBlock: false,
          description: 'Contains quarterly revenue figures, bank reconciliation statements, and audit reports.'
        }
      }
    ],
    edges: [
      { id: 'ep1', source: 'usr-unauth-web', target: 'role-cross-account-reader', label: 'sts:AssumeRole (No ExternalId)', riskType: 'assumes' },
      { id: 'ep2', source: 'role-cross-account-reader', target: 'res-s3-billing-logs', label: 's3:GetObject & ListBucket', riskType: 'data-access' }
    ],
    attackPath: ['usr-unauth-web', 'role-cross-account-reader', 'res-s3-billing-logs'],
    attackNarrative: [
      {
        step: 1,
        title: 'Discovery of Misconfigured Trust Policy',
        description: 'Security scanner detects ExternalAnalyticsReader role trusting Principal AWS: * without Condition ExternalId.',
        affectedNode: 'usr-unauth-web'
      },
      {
        step: 2,
        title: 'Cross-Account Role Assumption',
        description: 'External attacker executes aws sts assume-role --role-arn arn:aws:iam::... from their personal AWS account.',
        affectedNode: 'role-cross-account-reader'
      },
      {
        step: 3,
        title: 'Financial Ledger Download',
        description: 'Attacker lists and downloads all confidential financial spreadsheets.',
        affectedNode: 'res-s3-billing-logs'
      }
    ]
  }
];
