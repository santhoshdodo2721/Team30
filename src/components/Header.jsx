import React from 'react';
import { 
  ShieldAlert, 
  Layers, 
  Upload, 
  FileText, 
  Sparkles, 
  RefreshCw, 
  Activity,
  Zap,
  Globe
} from 'lucide-react';

export default function Header({ 
  scenarios, 
  activeScenarioId, 
  onSelectScenario, 
  overallRiskScore, 
  onOpenUploader, 
  onOpenReport,
  onResetScenario 
}) {
  return (
    <header className="bg-[#0f1420] border-b border-slate-800/80 sticky top-0 z-30 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20 text-slate-950 font-black flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-100 tracking-tight">
                AI Cloud Permission Risk Visualizer
              </h1>
              <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 rounded font-bold uppercase">
                Initial Phase Demo
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cybersecurity IAM Topology • AI Risk Reasoning • Exploit Path Detection
            </p>
          </div>
        </div>

        {/* Global Posture Risk Gauge */}
        <div className="flex items-center gap-4 bg-[#161e2e] px-4 py-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-300">Cloud Posture Risk:</span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono shadow ${
              overallRiskScore >= 80 ? 'bg-red-950 text-red-400 border border-red-500/40' :
              overallRiskScore >= 60 ? 'bg-amber-950 text-amber-400 border border-amber-500/40' :
              'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
            }`}>
              {overallRiskScore} / 100
            </div>

            <span className={`text-[11px] font-bold uppercase ${
              overallRiskScore >= 80 ? 'text-red-400' :
              overallRiskScore >= 60 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {overallRiskScore >= 80 ? 'CRITICAL' : overallRiskScore >= 60 ? 'HIGH RISK' : 'LOW RISK'}
            </span>
          </div>
        </div>

        {/* Actions & Scenario Dropdown */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Preset Scenario Selector */}
          <select
            value={activeScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-[#0b0e14] border border-slate-700 text-xs font-medium text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 max-w-xs truncate"
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.title}
              </option>
            ))}
          </select>

          {/* Reset Scenario */}
          <button
            onClick={onResetScenario}
            title="Reset active scenario to initial state"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Custom Policy Upload */}
          <button
            onClick={onOpenUploader}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import IAM JSON</span>
          </button>

          {/* Download Security Audit Report */}
          <button
            onClick={onOpenReport}
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Report</span>
          </button>
        </div>
      </div>
    </header>
  );
}
