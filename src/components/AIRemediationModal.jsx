import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Terminal, 
  Code, 
  ShieldCheck, 
  ArrowRight,
  Shield,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateRemediationFix } from '../services/riskEngine';

export default function AIRemediationModal({ 
  node, 
  scenario, 
  onClose, 
  onApplyFix 
}) {
  if (!node) return null;

  const fixData = generateRemediationFix(node, scenario);
  const [activeTab, setActiveTab] = useState('diff'); // 'diff', 'cli', 'terraform'
  const [copied, setCopied] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    // Trigger confetti effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    onApplyFix(node.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f1420] border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-[#161d2d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950 border border-emerald-500/40 rounded-xl text-emerald-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  AI Least-Privilege Engine
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100">
                Remediate: {node.label}
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

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Summary Box */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-200 leading-relaxed">
              <span className="font-semibold text-emerald-300">AI Recommendation Summary: </span>
              {fixData?.remediationSummary}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('diff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'diff'
                    ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Policy JSON Diff</span>
              </button>

              <button
                onClick={() => setActiveTab('cli')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'cli'
                    ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>AWS CLI Script</span>
              </button>

              <button
                onClick={() => setActiveTab('terraform')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'terraform'
                    ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Terraform HCL</span>
              </button>
            </div>

            {/* Copy Button for CLI / HCL */}
            {activeTab !== 'diff' && (
              <button
                onClick={() => handleCopy(activeTab === 'cli' ? fixData.cliCommand : fixData.terraformCode)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 flex items-center gap-1 transition"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            )}
          </div>

          {/* Tab Contents */}
          {activeTab === 'diff' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Original Policy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-red-400 font-sans font-semibold">
                  <span>Current Risky Configuration</span>
                  <span className="text-[10px] px-2 py-0.5 bg-red-950 border border-red-500/30 rounded">VULNERABLE</span>
                </div>
                <pre className="bg-[#120a0f] border border-red-900/40 p-3.5 rounded-xl text-red-300 max-h-64 overflow-auto">
                  {JSON.stringify(fixData.originalPolicy, null, 2)}
                </pre>
              </div>

              {/* Remediated Policy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-emerald-400 font-sans font-semibold">
                  <span>AI Remediated Policy</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-950 border border-emerald-500/30 rounded">LEAST PRIVILEGE</span>
                </div>
                <pre className="bg-[#091510] border border-emerald-900/40 p-3.5 rounded-xl text-emerald-300 max-h-64 overflow-auto">
                  {JSON.stringify(fixData.remediatedPolicy, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'cli' && (
            <pre className="bg-[#080a0f] border border-slate-800 p-4 rounded-xl text-xs font-mono text-cyan-300 max-h-72 overflow-auto">
              {fixData.cliCommand}
            </pre>
          )}

          {activeTab === 'terraform' && (
            <pre className="bg-[#080a0f] border border-slate-800 p-4 rounded-xl text-xs font-mono text-amber-300 max-h-72 overflow-auto">
              {fixData.terraformCode}
            </pre>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-[#161d2d] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition"
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:shadow-cyan-500/20 flex items-center gap-2 transition"
          >
            <Shield className="w-4 h-4" />
            <span>Apply AI Remediation & Recalculate Risk</span>
          </button>
        </div>
      </div>
    </div>
  );
}
