import React, { useState } from 'react';
import Header from './components/Header';
import RiskDashboard from './components/RiskDashboard';
import VisualGraph from './components/VisualGraph';
import AttackPathSimulator from './components/AttackPathSimulator';
import NodeDetailDrawer from './components/NodeDetailDrawer';
import AIRemediationModal from './components/AIRemediationModal';
import PolicyUploader from './components/PolicyUploader';
import AIChatAssistant from './components/AIChatAssistant';
import SecurityReportModal from './components/SecurityReportModal';

import { SCENARIOS } from './data/scenarios';
import { applyRemediationToScenario } from './services/riskEngine';

export default function App() {
  const [scenariosList, setScenariosList] = useState(SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState(SCENARIOS[0].id);

  // Active scenario state
  const activeScenario = scenariosList.find(s => s.id === activeScenarioId) || scenariosList[0];

  // Drawer & Modal States
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeAttackStep, setActiveAttackStep] = useState(null);
  const [remediationNode, setRemediationNode] = useState(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Handle Scenario Change
  const handleSelectScenario = (scenarioId) => {
    setActiveScenarioId(scenarioId);
    setSelectedNode(null);
    setActiveAttackStep(null);
  };

  // Reset active scenario to original baseline
  const handleResetScenario = () => {
    const original = SCENARIOS.find(s => s.id === activeScenarioId);
    if (!original) return;

    setScenariosList(prev => prev.map(s => s.id === activeScenarioId ? JSON.parse(JSON.stringify(original)) : s));
    setSelectedNode(null);
    setActiveAttackStep(null);
  };

  // Apply AI Remediation fix to active scenario
  const handleApplyFix = (nodeId) => {
    setScenariosList(prev => prev.map(s => {
      if (s.id === activeScenarioId) {
        return applyRemediationToScenario(s, nodeId);
      }
      return s;
    }));
  };

  // Load dynamically generated custom JSON policy scenario
  const handleLoadCustomScenario = (customScenario) => {
    setScenariosList(prev => [customScenario, ...prev]);
    setActiveScenarioId(customScenario.id);
    setSelectedNode(null);
    setActiveAttackStep(null);
  };

  return (
    <div className="min-h-screen bg-[#090c15] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header Nav */}
      <Header
        scenarios={scenariosList}
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
        overallRiskScore={activeScenario.overallRiskScore}
        onOpenUploader={() => setIsUploaderOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onResetScenario={handleResetScenario}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Executive Risk Dashboard Metrics */}
        <RiskDashboard
          scenario={activeScenario}
          onSelectNode={(node) => setSelectedNode(node)}
          onOpenRemediation={(node) => setRemediationNode(node)}
        />

        {/* Visual Graph & Attack Path Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Interactive Visual Graph Canvas (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>Interactive IAM Permission Graph</span>
                  <span className="text-xs px-2 py-0.5 bg-slate-800 text-cyan-400 rounded border border-slate-700 font-mono">
                    D3 Force Simulation
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Drag nodes, zoom/pan canvas, click any entity to inspect permissions & risk reasoning.
                </p>
              </div>
            </div>

            <VisualGraph
              scenario={activeScenario}
              selectedNode={selectedNode}
              onSelectNode={(node) => setSelectedNode(node)}
              activeAttackStep={activeAttackStep}
            />
          </div>

          {/* Attack Path Simulator Side Panel (1 Col) */}
          <div className="space-y-4">
            <AttackPathSimulator
              scenario={activeScenario}
              activeStep={activeAttackStep}
              setActiveStep={setActiveAttackStep}
              onSelectNode={(node) => setSelectedNode(node)}
              onOpenRemediation={(node) => setRemediationNode(node)}
            />
          </div>
        </div>
      </main>

      {/* Node Detail Drawer */}
      {selectedNode && (
        <NodeDetailDrawer
          node={selectedNode}
          scenario={activeScenario}
          onClose={() => setSelectedNode(null)}
          onOpenRemediation={(node) => setRemediationNode(node)}
        />
      )}

      {/* AI Remediation Modal */}
      {remediationNode && (
        <AIRemediationModal
          node={remediationNode}
          scenario={activeScenario}
          onClose={() => setRemediationNode(null)}
          onApplyFix={handleApplyFix}
        />
      )}

      {/* Custom Policy Uploader Modal */}
      {isUploaderOpen && (
        <PolicyUploader
          onClose={() => setIsUploaderOpen(false)}
          onLoadCustomScenario={handleLoadCustomScenario}
        />
      )}

      {/* Security Audit Report Modal */}
      {isReportOpen && (
        <SecurityReportModal
          scenario={activeScenario}
          onClose={() => setIsReportOpen(false)}
        />
      )}

      {/* Floating Security AI Chat Assistant */}
      <AIChatAssistant
        scenario={activeScenario}
        onSelectNode={(node) => setSelectedNode(node)}
        onOpenRemediation={(node) => setRemediationNode(node)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 bg-[#0a0d17] text-center text-xs text-slate-500">
        <p>AI Cloud Permission Risk Visualizer • Enterprise IAM Security Posture & Vulnerability Analysis</p>
      </footer>
    </div>
  );
}
