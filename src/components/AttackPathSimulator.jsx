import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ShieldAlert, 
  AlertTriangle, 
  Flame,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function AttackPathSimulator({ 
  scenario, 
  activeStep, 
  setActiveStep, 
  onSelectNode,
  onOpenRemediation 
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  const attackNarrative = scenario?.attackNarrative || [];
  const totalSteps = attackNarrative.length;

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveStep((prevStep) => {
          if (prevStep === null || prevStep >= totalSteps - 1) {
            return 0;
          }
          return prevStep + 1;
        });
      }, 3500);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalSteps, setActiveStep]);

  if (totalSteps === 0) return null;

  const currentStepData = activeStep !== null ? attackNarrative[activeStep] : null;
  const currentAffectedNode = currentStepData 
    ? scenario.nodes.find(n => n.id === currentStepData.affectedNode)
    : null;

  return (
    <div className="bg-[#111622] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-950/80 border border-red-500/30 rounded-lg text-red-400">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Attack Path Vector Simulator
              {scenario.attackPathBroken && (
                <span className="text-xs px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-400 rounded-full font-normal">
                  Remediated Path
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Interactive multi-hop exploit simulation & blast radius propagation
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 bg-[#0a0d14] p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              setIsPlaying(false);
              setActiveStep(prev => (prev === null || prev <= 0 ? totalSteps - 1 : prev - 1));
            }}
            title="Previous Step"
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded transition"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause Simulation" : "Auto Play Simulation"}
            className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-md transition"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Attack</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setActiveStep(prev => (prev === null || prev >= totalSteps - 1 ? 0 : prev + 1));
            }}
            title="Next Step"
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Steps Timeline */}
      <div className="grid grid-cols-5 gap-2">
        {attackNarrative.map((narrative, idx) => {
          const isActive = activeStep === idx;
          const isPassed = activeStep !== null && idx < activeStep;
          const targetNode = scenario.nodes.find(n => n.id === narrative.affectedNode);

          return (
            <button
              key={idx}
              onClick={() => {
                setIsPlaying(false);
                setActiveStep(idx);
                if (targetNode) onSelectNode(targetNode);
              }}
              className={`p-2.5 rounded-lg border text-left transition relative flex flex-col justify-between ${
                isActive
                  ? 'bg-red-950/60 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : isPassed
                  ? 'bg-slate-900/80 border-slate-700 text-slate-300'
                  : 'bg-[#0a0d14] border-slate-800 text-slate-500 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                <span>Step {idx + 1}</span>
                {isActive && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
              </div>
              <p className="text-xs font-medium truncate leading-tight mb-2">
                {narrative.title}
              </p>
              <span className="text-[10px] text-slate-400 truncate">
                {targetNode?.label || 'Node'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current Step Focus Card */}
      {currentStepData && (
        <div className="bg-[#0b0e15] border border-red-900/50 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-red-900/30 border border-red-700/40 text-red-400 rounded-lg shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  Attack Stage {activeStep + 1} of {totalSteps}: {currentStepData.title}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                {currentStepData.description}
              </p>
            </div>
          </div>

          {/* Action to target node & Remediation trigger */}
          {currentAffectedNode && (
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                onClick={() => onSelectNode(currentAffectedNode)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
              >
                <span>Inspect Node</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>

              <button
                onClick={() => onOpenRemediation(currentAffectedNode)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-semibold rounded-lg shadow-md flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fix Vector</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
