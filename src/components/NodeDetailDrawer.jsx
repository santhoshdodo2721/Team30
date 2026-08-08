import React from 'react';
import { 
  X, 
  Bot, 
  ShieldAlert, 
  Sparkles, 
  Key, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  ExternalLink,
  Layers,
  Zap
} from 'lucide-react';
import { generateAIExplanation } from '../services/riskEngine';

export default function NodeDetailDrawer({ 
  node, 
  scenario, 
  onClose, 
  onOpenRemediation 
}) {
  if (!node) return null;

  const aiAssessment = generateAIExplanation(node, scenario);

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0e131d] border-l border-slate-800 shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div>
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-[#141b27]/80 backdrop-blur">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-lg border text-xl shrink-0 ${
              node.riskLevel === 'critical' ? 'bg-red-950/60 border-red-500/50 text-red-400' :
              node.riskLevel === 'high' ? 'bg-amber-950/60 border-amber-500/50 text-amber-400' :
              'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
            }`}>
              {node.type === 'ai-agent' ? '🤖' :
               node.type === 'user' ? '👤' :
               node.type === 'role' ? '🛡️' :
               node.type === 'policy' ? '📄' : '🗄️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-cyan-400">
                  {node.cloudProvider} • {node.category}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  node.riskLevel === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  node.riskLevel === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {node.riskLevel} ({node.riskScore}/100)
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-1 leading-snug">
                {node.label}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Explanation Box */}
        <div className="p-5 space-y-5">
          <div className="bg-[#121927] border border-cyan-900/40 rounded-xl p-4 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-l from-cyan-500/20 to-transparent text-[10px] font-bold text-cyan-300 uppercase tracking-widest rounded-bl">
              AI Risk Reasoning
            </div>

            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
              <Bot className="w-4 h-4" />
              <span>AI Security Insight</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {aiAssessment?.explanation}
            </p>

            {/* MITRE ATT&CK Badges */}
            {aiAssessment?.mitreTechniques?.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                  Mapped MITRE ATT&CK Techniques:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {aiAssessment.mitreTechniques.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-[10px] text-amber-300 rounded font-mono"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Beginner Cloud Concept Explanation Tip */}
          {node.details?.beginnerTip && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span>🔰 Beginner Cloud Concept</span>
              </div>
              <p className="text-xs text-emerald-200 leading-relaxed">
                {node.details.beginnerTip}
              </p>
            </div>
          )}

          {/* Detailed Attributes */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>IAM Node Attributes</span>
            </h3>

            <div className="bg-[#0a0d14] rounded-xl border border-slate-800 p-3 space-y-2.5 text-xs font-mono text-slate-300">
              {node.details && Object.entries(node.details).map(([key, val]) => {
                if (key === 'statements' || key === 'trustPolicy') return null;
                return (
                  <div key={key} className="flex justify-between items-start border-b border-slate-900/60 pb-1.5 last:border-none">
                    <span className="text-slate-500 capitalize">{key}:</span>
                    <span className="text-slate-200 font-medium text-right max-w-[200px] truncate">
                      {typeof val === 'boolean' ? (val ? 'True' : 'False') : String(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* JSON Statement Viewer if available */}
          {node.details?.statements && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Raw Policy Statements</span>
              </h3>
              <pre className="bg-[#080a0f] p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48">
                {JSON.stringify(node.details.statements, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Drawer Action Footer */}
      <div className="p-5 border-t border-slate-800 bg-[#141b27] flex items-center justify-between gap-3">
        <button
          onClick={onClose}
          className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
        >
          Close Drawer
        </button>

        <button
          onClick={() => {
            onClose();
            onOpenRemediation(node);
          }}
          className="w-1/2 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg flex items-center justify-center gap-1.5 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Remediate</span>
        </button>
      </div>
    </div>
  );
}
