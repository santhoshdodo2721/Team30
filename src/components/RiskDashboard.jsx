import React from 'react';
import { 
  ShieldAlert, 
  Bot, 
  Flame, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingDown,
  Sparkles,
  Zap,
  Activity,
  Layers
} from 'lucide-react';

export default function RiskDashboard({ 
  scenario, 
  onSelectNode, 
  onOpenRemediation 
}) {
  if (!scenario) return null;

  const criticalNodes = scenario.nodes.filter(n => n.riskLevel === 'critical');
  const highNodes = scenario.nodes.filter(n => n.riskLevel === 'high');
  const aiAgentNodes = scenario.nodes.filter(n => n.type === 'ai-agent');
  const highestRiskNode = [...scenario.nodes].sort((a, b) => b.riskScore - a.riskScore)[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Card 1: Overall Risk Posture */}
      <div className="bg-[#111622] rounded-xl border border-slate-800 p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Infrastructure Risk
          </span>
          <Activity className="w-4 h-4 text-cyan-400" />
        </div>

        <div className="my-2 flex items-baseline gap-2">
          <span className={`text-3xl font-black font-mono tracking-tight ${
            scenario.overallRiskScore >= 80 ? 'text-red-400' :
            scenario.overallRiskScore >= 60 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {scenario.overallRiskScore}
          </span>
          <span className="text-xs text-slate-400">/ 100 CVSS Score</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
          <span>Target Cloud: <strong className="text-slate-200">{scenario.cloudProvider}</strong></span>
          {scenario.attackPathBroken ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Secured
            </span>
          ) : (
            <span className="text-red-400 font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 animate-pulse" /> Vector Active
            </span>
          )}
        </div>
      </div>

      {/* Card 2: Risk Level Distribution */}
      <div className="bg-[#111622] rounded-xl border border-slate-800 p-4 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Permission Vulnerabilities
          </span>
          <Layers className="w-4 h-4 text-amber-400" />
        </div>

        <div className="my-2 flex items-center gap-4">
          <div>
            <div className="text-xl font-bold text-red-400">{criticalNodes.length}</div>
            <div className="text-[10px] text-slate-400">Critical Risk</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <div className="text-xl font-bold text-amber-400">{highNodes.length}</div>
            <div className="text-[10px] text-slate-400">High Risk</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <div className="text-xl font-bold text-cyan-400">{scenario.nodes.length}</div>
            <div className="text-[10px] text-slate-400">Total Nodes</div>
          </div>
        </div>

        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden flex">
          <div style={{ width: `${(criticalNodes.length / scenario.nodes.length) * 100}%` }} className="bg-red-500 h-full" />
          <div style={{ width: `${(highNodes.length / scenario.nodes.length) * 100}%` }} className="bg-amber-500 h-full" />
          <div style={{ width: `${((scenario.nodes.length - criticalNodes.length - highNodes.length) / scenario.nodes.length) * 100}%` }} className="bg-emerald-500 h-full" />
        </div>
      </div>

      {/* Card 3: Shadow AI & Agent Risk */}
      <div className="bg-[#111622] rounded-xl border border-slate-800 p-4 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Shadow AI & Agent Risk
          </span>
          <Bot className="w-4 h-4 text-cyan-400" />
        </div>

        <div className="my-2 flex items-center gap-3">
          <div className="p-2 bg-cyan-950 border border-cyan-500/30 text-cyan-400 rounded-lg text-lg">
            🤖
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">
              {aiAgentNodes.length > 0 ? aiAgentNodes[0].label : 'No AI Agent Detected'}
            </div>
            <div className="text-[10px] text-slate-400">
              {aiAgentNodes.length > 0 ? 'Prompt-Injection Target • Autonomous Tools' : 'Standard IAM Topology'}
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
          <span>Status:</span>
          <span className="text-cyan-300 font-mono font-semibold">
            {aiAgentNodes.length > 0 ? 'iam:PassRole Attached' : 'Standard Baseline'}
          </span>
        </div>
      </div>

      {/* Card 4: Top Vulnerable Principal Action */}
      <div className="bg-gradient-to-br from-[#151d2c] to-[#0f1522] rounded-xl border border-cyan-500/30 p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Highest Risk Node
          </span>
          <span className="text-xs font-mono font-bold text-red-400 bg-red-950 border border-red-500/30 px-1.5 py-0.5 rounded">
            {highestRiskNode?.riskScore}/100
          </span>
        </div>

        <div className="my-1">
          <div className="text-xs font-bold text-slate-100 truncate">
            {highestRiskNode?.label}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {highestRiskNode?.category} • {highestRiskNode?.cloudProvider}
          </div>
        </div>

        {highestRiskNode && (
          <button
            onClick={() => onOpenRemediation(highestRiskNode)}
            className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow flex items-center justify-center gap-1 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Remediate High Risk Node</span>
          </button>
        )}
      </div>
    </div>
  );
}
