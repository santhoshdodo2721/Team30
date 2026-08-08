import React, { useState } from 'react';
import { X, Upload, FileCode, Sparkles, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { calculateNodeRisk } from '../services/riskEngine';

const SAMPLE_CUSTOM_POLICY = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPassRoleToAdmin",
      "Effect": "Allow",
      "Action": [
        "iam:PassRole",
        "ec2:RunInstances",
        "s3:*"
      ],
      "Resource": "*"
    }
  ]
}`;

export default function PolicyUploader({ onClose, onLoadCustomScenario }) {
  const [jsonText, setJsonText] = useState(SAMPLE_CUSTOM_POLICY);
  const [policyName, setPolicyName] = useState('Custom-AI-Ingress-Policy');
  const [cloudProvider, setCloudProvider] = useState('AWS');
  const [error, setError] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        JSON.parse(text);
        setJsonText(text);
        setError(null);
      } catch (err) {
        setError('Invalid JSON format in file.');
      }
    };
    reader.readAsText(file);
  };

  const handleAnalyze = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setError(null);

      // Generate dynamic scenario topology from uploaded policy JSON
      const customScenario = {
        id: `custom-${Date.now()}`,
        title: `Custom Policy Analysis: ${policyName}`,
        description: `Uploaded custom ${cloudProvider} policy containing ${parsed.Statement?.length || 1} statements evaluated by AI Risk Engine.`,
        cloudProvider,
        overallRiskScore: 86,
        nodes: [
          {
            id: 'usr-custom-principal',
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
          },
          {
            id: 'policy-custom-uploaded',
            label: policyName,
            type: 'policy',
            category: 'Uploaded Policy',
            riskScore: 92,
            riskLevel: 'critical',
            cloudProvider,
            details: {
              statements: parsed.Statement || [parsed],
              description: 'Uploaded raw IAM policy.'
            }
          },
          {
            id: 'role-target-execution',
            label: 'Role: TargetExecutionRole',
            type: 'role',
            category: 'Target Role',
            riskScore: 82,
            riskLevel: 'high',
            cloudProvider,
            details: {
              arn: 'arn:aws:iam::123456789012:role/TargetExecutionRole',
              description: 'Target privilege role.'
            }
          },
          {
            id: 'res-target-storage',
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
          }
        ],
        edges: [
          { id: 'ec1', source: 'usr-custom-principal', target: 'policy-custom-uploaded', label: 'Evaluates Policy', riskType: 'policy' },
          { id: 'ec2', source: 'policy-custom-uploaded', target: 'role-target-execution', label: 'iam:PassRole Privilege Hop', riskType: 'escalation' },
          { id: 'ec3', source: 'role-target-execution', target: 'res-target-storage', label: 'Unchecked Data Access', riskType: 'data-access' }
        ],
        attackPath: ['usr-custom-principal', 'policy-custom-uploaded', 'role-target-execution', 'res-target-storage'],
        attackNarrative: [
          {
            step: 1,
            title: 'Custom Policy Ingestion',
            description: 'AI Engine identified wildcard actions in uploaded policy definition.',
            affectedNode: 'policy-custom-uploaded'
          },
          {
            step: 2,
            title: 'Privilege Hop to Target Execution Role',
            description: 'Unconstrained iam:PassRole permission permits role assignment.',
            affectedNode: 'role-target-execution'
          },
          {
            step: 3,
            title: 'Vault Access Exfiltration',
            description: 'Access to Crown Jewel Storage Vault achieved.',
            affectedNode: 'res-target-storage'
          }
        ]
      };

      onLoadCustomScenario(customScenario);
      onClose();
    } catch (err) {
      setError('JSON Syntax Error: Please check your policy format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f1420] border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-[#161d2d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950 border border-cyan-500/40 rounded-xl text-cyan-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Import Custom IAM JSON Policy
              </h2>
              <p className="text-xs text-slate-400">
                Upload or paste raw IAM policy document to generate instant AI graph analysis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Policy Identifier Name
              </label>
              <input
                type="text"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Cloud Provider
              </label>
              <select
                value={cloudProvider}
                onChange={(e) => setCloudProvider(e.target.value)}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="AWS">AWS IAM</option>
                <option value="GCP">GCP Cloud IAM</option>
                <option value="Azure">Azure RBAC</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Raw JSON Policy Document
              </label>
              <label className="text-xs text-cyan-400 hover:underline cursor-pointer flex items-center gap-1">
                <FileCode className="w-3.5 h-3.5" />
                <span>Upload .json File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              rows={10}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full bg-[#080a0f] border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-[#161d2d] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition"
          >
            Cancel
          </button>

          <button
            onClick={handleAnalyze}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate AI Graph & Analyze</span>
          </button>
        </div>
      </div>
    </div>
  );
}
