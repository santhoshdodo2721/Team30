// IAM Analysis & AI Risk Reasoning Engine

export function calculateNodeRisk(node, allNodes = [], edges = []) {
  let score = 50; // base score

  // Category & Type Factors
  if (node.type === 'ai-agent') {
    score += 25;
    if (node.details?.autonomousExecution) score += 15;
  } else if (node.type === 'policy') {
    if (node.details?.statements) {
      const hasWildcardAction = node.details.statements.some(s => 
        (Array.isArray(s.Action) ? s.Action.includes('*') || s.Action.includes('s3:*') || s.Action.includes('iam:PassRole') : s.Action === '*')
      );
      const hasWildcardResource = node.details.statements.some(s => s.Resource === '*');
      if (hasWildcardAction) score += 30;
      if (hasWildcardResource) score += 20;
    }
  } else if (node.type === 'user') {
    if (node.details?.unusedDays > 90) score += 25;
    if (!node.details?.mfaEnabled) score += 15;
  } else if (node.type === 'resource') {
    if (node.details?.sensitivity?.includes('CRITICAL')) score += 30;
    if (node.details?.publiclyAccessible || node.details?.publicAccessBlock === false) score += 35;
  }

  // Cap score between 10 and 99
  const finalScore = Math.min(Math.max(Math.round(score), 10), 99);
  
  let riskLevel = 'low';
  if (finalScore >= 85) riskLevel = 'critical';
  else if (finalScore >= 70) riskLevel = 'high';
  else if (finalScore >= 45) riskLevel = 'medium';

  return { riskScore: finalScore, riskLevel };
}

export function calculateOverallRiskScore(nodes = [], edges = [], attackPath = []) {
  if (!nodes || nodes.length === 0) return 0;
  
  const totalScore = nodes.reduce((acc, n) => acc + (n.riskScore || 50), 0);
  const avg = totalScore / nodes.length;

  // Path multiplier if critical attack path exists
  const hasCriticalPath = attackPath && attackPath.length >= 3;
  const multiplier = hasCriticalPath ? 1.15 : 1.0;

  return Math.min(Math.round(avg * multiplier), 99);
}

export function generateAIExplanation(node, scenario) {
  if (!node) return null;

  const typeName = node.type.toUpperCase();
  const label = node.label;
  const isAttackPathMember = scenario?.attackPath?.includes(node.id);

  let explanation = '';
  let mitreTechniques = [];
  let threatVector = '';

  switch (node.type) {
    case 'ai-agent':
      explanation = `The AI Agent "${label}" operates with autonomous execution capabilities and direct integration to cloud execution roles. Because LLMs are vulnerable to indirect prompt injection and payload manipulation, granting unrestrained IAM privileges allows an attacker to manipulate AI model tool calls into executing destructive or privileged cloud API requests.`;
      mitreTechniques = ['T1078.004 - Cloud Accounts', 'T1059 - Command & Scripting Interpreter', 'T1548 - Abuse Elevation Control'];
      threatVector = 'Prompt Injection -> Unchecked Tool Call -> Privilege Escalation';
      break;

    case 'policy':
      explanation = `Policy "${label}" violates the Principle of Least Privilege by using broad wildcard actions ("*") or unconstrained "iam:PassRole" assignments. Any principal assuming a role attached to this policy can bypass boundary restrictions, escalate privileges, or modify IAM definitions to achieve persistence.`;
      mitreTechniques = ['T1098 - Account Manipulation', 'T1484 - Group Policy Modification'];
      threatVector = 'Policy Invalidation -> Over-Permissioned API Call -> Account takeover';
      break;

    case 'user':
      explanation = `User account "${label}" represents an ingress vulnerability. ${node.details?.unusedDays ? `The access keys have been inactive for ${node.details.unusedDays} days without rotation, greatly increasing credential leak risks.` : 'Lacks multi-factor authentication enforcement.'}`;
      mitreTechniques = ['T1078.004 - Valid Cloud Credentials', 'T1586 - Compromise Accounts'];
      threatVector = 'Leaked Access Key -> Unauthenticated Cloud Ingress';
      break;

    case 'role':
      explanation = `IAM Role "${label}" has an overly permissive trust policy or high-tier execution permissions. It acts as a pivot bridge for lateral movement across compute instances, containers, or third-party cloud accounts.`;
      mitreTechniques = ['T1550.001 - Application Access Token', 'T1068 - Exploitation for Privilege Escalation'];
      threatVector = 'Stolen Metadata Credentials -> Lateral Pivot';
      break;

    case 'resource':
      explanation = `Cloud Resource "${label}" holds highly sensitive data (${node.details?.sensitivity || 'Confidential Data'}). Excessive access rights attached to this resource create immediate data breach risks under regulatory frameworks (GDPR, HIPAA, SOC2).`;
      mitreTechniques = ['T1530 - Data from Cloud Storage', 'T1567 - Exfiltration Over Web Service'];
      threatVector = 'Direct Data Dump -> Exfiltration';
      break;

    default:
      explanation = `Node "${label}" contains elevated privilege relationships that contribute to the overall blast radius of the cloud workspace.`;
      mitreTechniques = ['T1078 - Valid Accounts'];
      threatVector = 'Unauthorized Access Path';
      break;
  }

  return {
    nodeId: node.id,
    title: `AI Risk Assessment for ${node.label}`,
    typeName,
    isAttackPathMember,
    explanation,
    mitreTechniques,
    threatVector,
    blastRadiusScore: node.riskScore
  };
}

export function generateRemediationFix(node, scenario) {
  if (!node) return null;

  let originalPolicy = {};
  let remediatedPolicy = {};
  let cliCommand = '';
  let terraformCode = '';
  let remediationSummary = '';

  if (node.type === 'policy') {
    originalPolicy = {
      Version: '2012-10-17',
      Statement: node.details?.statements || [
        { Effect: 'Allow', Action: ['*'], Resource: '*' }
      ]
    };

    remediatedPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'ScopedLeastPrivilegeAccess',
          Effect: 'Allow',
          Action: [
            's3:GetObject',
            's3:ListBucket'
          ],
          Resource: [
            'arn:aws:s3:::customer-pii-vault-prod/logs/*',
            'arn:aws:s3:::customer-pii-vault-prod'
          ],
          Condition: {
            StringEquals: {
              'aws:PrincipalTag/Department': 'CustomerSupport'
            },
            Bool: {
              'aws:SecureTransport': 'true'
            }
          }
        }
      ]
    };

    cliCommand = `# 1. Create remediated scoped policy version
aws iam create-policy-version \\
  --policy-arn ${node.details?.arn || 'arn:aws:iam::123456789012:policy/ScopedPolicy'} \\
  --policy-document file://remediated-policy.json \\
  --set-as-default

# 2. Delete vulnerable wildcard policy version
aws iam delete-policy-version \\
  --policy-arn ${node.details?.arn || 'arn:aws:iam::123456789012:policy/ScopedPolicy'} \\
  --version-id v1`;

    terraformCode = `resource "aws_iam_policy" "remediated_policy" {
  name        = "${node.label.replace(/[^a-zA-Z0-9]/g, '_')}_least_privilege"
  description = "AI Remediated Least Privilege IAM Policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:ListBucket"]
        Resource = ["arn:aws:s3:::customer-pii-vault-prod/*"]
        Condition = {
          StringEquals = { "aws:PrincipalTag/Department" = "CustomerSupport" }
        }
      }
    ]
  })
}`;

    remediationSummary = 'Removed wildcard `iam:PassRole` and `s3:*` actions. Restricted access to read-only log paths with enforced TLS and principal department tags.';

  } else if (node.type === 'ai-agent') {
    originalPolicy = {
      AgentMode: 'Autonomous Full Access',
      AllowedRoles: ['arn:aws:iam::123456789012:role/ProductionAdminRole'],
      PromptGuardrails: 'Disabled'
    };

    remediatedPolicy = {
      AgentMode: 'Sandboxed Human-In-The-Loop',
      AllowedRoles: ['arn:aws:iam::123456789012:role/ReadOnlySupportRole'],
      PromptGuardrails: 'Enabled (Bedrock Guardrails v3.2 - Anti-Prompt-Injection)',
      MaxTokenBudgetPerTool: 500
    };

    cliCommand = `# Enforce AI Bedrock Guardrail and restrict execution role
aws bedrock-agent update-agent \\
  --agent-id ${node.id} \\
  --agent-resource-role-arn arn:aws:iam::123456789012:role/ReadOnlySupportRole \\
  --guardrail-configuration guardrailId=gr-sec-strict-v1,guardrailVersion=1`;

    terraformCode = `resource "aws_bedrockagent_agent" "security_hardened_agent" {
  agent_name                  = "${node.label}"
  agent_resource_role_arn     = "arn:aws:iam::123456789012:role/ReadOnlySupportRole"
  foundation_model            = "anthropic.claude-3-5-sonnet-20240620-v1:0"
  
  guardrail_configuration {
    guardrail_identifier = "gr-sec-strict-v1"
    guardrail_version    = "1"
  }
}`;

    remediationSummary = 'Downgraded execution role from ProductionAdminRole to ReadOnlySupportRole and enforced Bedrock prompt-injection guardrails.';

  } else if (node.type === 'user') {
    cliCommand = `# Deactivate stale access key older than 90 days
aws iam update-access-key \\
  --user-name ${node.label.replace('User: ', '')} \\
  --access-key-id AKIAIOSFODNN7EXAMPLE \\
  --status Inactive

# Enforce MFA Requirement Policy
aws iam attach-user-policy \\
  --user-name ${node.label.replace('User: ', '')} \\
  --policy-arn arn:aws:iam::aws:policy/MFAEnforcementPolicy`;

    terraformCode = `resource "aws_iam_user_login_profile" "user_profile" {
  user                    = "${node.label.replace('User: ', '')}"
  password_reset_required = true
}`;

    remediationSummary = `Disabled 184-day-old inactive access keys and attached mandatory multi-factor authentication (MFA) enforcement policies.`;
  } else {
    cliCommand = `# Apply resource policy restriction
aws s3api put-bucket-policy \\
  --bucket customer-pii-vault-prod \\
  --policy file://s3-bucket-policy-secure.json`;

    terraformCode = `resource "aws_s3_bucket_public_access_block" "block_public" {
  bucket = "customer-pii-vault-prod"

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}`;

    remediationSummary = 'Blocked public access and attached KMS customer-managed key encryption.';
  }

  return {
    nodeId: node.id,
    originalPolicy,
    remediatedPolicy,
    cliCommand,
    terraformCode,
    remediationSummary
  };
}

export function applyRemediationToScenario(scenario, targetNodeId) {
  // Deep clone scenario
  const newScenario = JSON.parse(JSON.stringify(scenario));
  
  const targetNode = newScenario.nodes.find(n => n.id === targetNodeId);
  if (!targetNode) return scenario;

  // Drop risk score of target node dramatically
  targetNode.riskScore = Math.max(15, targetNode.riskScore - 60);
  targetNode.riskLevel = targetNode.riskScore < 45 ? 'low' : 'medium';
  targetNode.remediated = true;

  // Remove or neutralize high-risk escalation edge associated with target node
  newScenario.edges = newScenario.edges.map(edge => {
    if (edge.source === targetNodeId || edge.target === targetNodeId) {
      return {
        ...edge,
        riskType: 'safe',
        label: 'Remediated (Blocked Path)'
      };
    }
    return edge;
  });

  // Re-evaluate attack path - if critical node fixed, break attack path!
  if (newScenario.attackPath.includes(targetNodeId)) {
    newScenario.attackPathBroken = true;
    newScenario.attackPathRemediatedAt = targetNode.label;
  }

  // Recalculate remaining node scores
  newScenario.nodes.forEach(node => {
    if (node.remediated) return;
    if (newScenario.attackPathBroken && newScenario.attackPath.includes(node.id)) {
      node.riskScore = Math.max(25, Math.round(node.riskScore * 0.4));
      node.riskLevel = node.riskScore < 45 ? 'low' : node.riskScore < 70 ? 'medium' : 'high';
    }
  });

  newScenario.overallRiskScore = calculateOverallRiskScore(
    newScenario.nodes,
    newScenario.edges,
    newScenario.attackPathBroken ? [] : newScenario.attackPath
  );

  return newScenario;
}

export function analyzeCustomPolicy(policyName, cloudProvider, policyJson) {
  let parsed;
  try {
    parsed = typeof policyJson === 'string' ? JSON.parse(policyJson) : policyJson;
  } catch (e) {
    throw new Error("Invalid JSON");
  }

  const statements = Array.isArray(parsed.Statement) ? parsed.Statement : (parsed.Statement ? [parsed.Statement] : []);
  
  // Base nodes
  const nodes = [];
  const edges = [];
  const attackPath = [];
  const attackNarrative = [];

  const principalNodeId = 'usr-custom-principal';
  nodes.push({
    id: principalNodeId,
    label: 'Ingress Principal (Caller)',
    type: 'user',
    category: 'Custom Ingress',
    riskScore: 40,
    riskLevel: 'medium',
    cloudProvider,
    details: {
      principal: 'arn:aws:iam::123456789012:user/custom-api-user',
      description: 'Caller attempting API requests.'
    }
  });

  const policyNodeId = 'policy-custom-uploaded';
  
  // Analyze statements for risk
  let hasWildcardAction = false;
  let hasPassRole = false;
  let hasS3Wildcard = false;
  let hasAdmin = false;

  statements.forEach(s => {
    if (s.Effect === 'Allow') {
      const actions = Array.isArray(s.Action) ? s.Action : [s.Action];
      if (actions.includes('*')) { hasWildcardAction = true; hasAdmin = true; }
      if (actions.includes('iam:PassRole')) hasPassRole = true;
      if (actions.includes('s3:*')) hasS3Wildcard = true;
      if (actions.some(a => typeof a === 'string' && a.includes('*') && a !== '*')) hasWildcardAction = true;
    }
  });

  let policyRiskScore = 30;
  if (hasAdmin) policyRiskScore = 98;
  else if (hasPassRole && hasS3Wildcard) policyRiskScore = 92;
  else if (hasPassRole || hasS3Wildcard) policyRiskScore = 80;
  else if (hasWildcardAction) policyRiskScore = 60;

  nodes.push({
    id: policyNodeId,
    label: policyName || 'Uploaded Custom Policy',
    type: 'policy',
    category: 'Uploaded Policy',
    riskScore: policyRiskScore,
    riskLevel: policyRiskScore >= 85 ? 'critical' : (policyRiskScore >= 70 ? 'high' : 'medium'),
    cloudProvider,
    details: {
      statements: statements,
      description: 'Uploaded raw IAM policy.'
    }
  });

  edges.push({ id: 'ec1', source: principalNodeId, target: policyNodeId, label: 'Evaluates Policy', riskType: 'policy' });
  attackPath.push(principalNodeId);
  attackPath.push(policyNodeId);
  attackNarrative.push({
    step: 1,
    title: 'Custom Policy Ingestion',
    description: 'AI Engine identified permissions in the uploaded policy definition.',
    affectedNode: policyNodeId
  });

  let stepCount = 2;

  if (hasPassRole || hasAdmin) {
    const roleId = 'role-target-execution';
    nodes.push({
      id: roleId,
      label: 'Role: TargetExecutionRole',
      type: 'role',
      category: 'Target Role',
      riskScore: 82,
      riskLevel: 'high',
      cloudProvider,
      details: {
        arn: 'arn:aws:iam::123456789012:role/TargetExecutionRole',
        description: 'Target privilege role assumed via iam:PassRole or Admin access.'
      }
    });
    edges.push({ id: 'ec2', source: policyNodeId, target: roleId, label: 'Privilege Hop', riskType: 'escalation' });
    attackPath.push(roleId);
    attackNarrative.push({
      step: stepCount++,
      title: 'Privilege Hop to Target Execution Role',
      description: 'Permissions allow assuming or passing another high-privileged role.',
      affectedNode: roleId
    });

    if (hasS3Wildcard || hasAdmin) {
      const resId = 'res-target-storage';
      nodes.push({
        id: resId,
        label: 'Cloud Resource: CrownJewelVault',
        type: 'resource',
        category: 'Sensitive Data',
        riskScore: 95,
        riskLevel: 'critical',
        cloudProvider,
        details: {
          arn: 'arn:aws:s3:::crown-jewel-data-vault',
          sensitivity: 'CRITICAL',
          description: 'Sensitive database resource.'
        }
      });
      edges.push({ id: 'ec3', source: roleId, target: resId, label: 'Unchecked Data Access', riskType: 'data-access' });
      attackPath.push(resId);
      attackNarrative.push({
        step: stepCount++,
        title: 'Vault Access Exfiltration',
        description: 'Access to Crown Jewel Storage Vault achieved.',
        affectedNode: resId
      });
    }
  } else if (hasS3Wildcard) {
    const resId = 'res-target-storage';
    nodes.push({
      id: resId,
      label: 'Cloud Resource: CrownJewelVault',
      type: 'resource',
      category: 'Sensitive Data',
      riskScore: 95,
      riskLevel: 'critical',
      cloudProvider,
      details: {
        arn: 'arn:aws:s3:::crown-jewel-data-vault',
        sensitivity: 'CRITICAL',
        description: 'Sensitive database resource.'
      }
    });
    edges.push({ id: 'ec2', source: policyNodeId, target: resId, label: 'Direct Data Access', riskType: 'data-access' });
    attackPath.push(resId);
    attackNarrative.push({
      step: stepCount++,
      title: 'Vault Access Exfiltration',
      description: 'Direct unchecked access to Crown Jewel Storage Vault.',
      affectedNode: resId
    });
  }

  const overallRiskScore = calculateOverallRiskScore(nodes, edges, attackPath);

  return {
    id: `custom-${Date.now()}`,
    title: `Custom Policy Analysis: ${policyName}`,
    description: `Uploaded custom ${cloudProvider} policy containing ${statements.length} statements evaluated by AI Risk Engine.`,
    cloudProvider,
    overallRiskScore,
    nodes,
    edges,
    attackPath,
    attackNarrative
  };
}

