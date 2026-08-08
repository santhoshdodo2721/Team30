import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, X, Minimize2, ShieldAlert, Cpu } from 'lucide-react';

export default function AIChatAssistant({ scenario, onSelectNode, onOpenRemediation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello! I am your AI Cloud IAM Risk Assistant. Ask me anything about permission paths, risky IAM policies, or prompt injection vectors in ${scenario.title}.`
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');

    // Simulate AI LLM reasoning response
    setTimeout(() => {
      let reply = '';
      const lower = userText.toLowerCase();

      if (lower.includes('pii') || lower.includes('database') || lower.includes('s3') || lower.includes('data')) {
        reply = `Analyzing data access paths for ${scenario.title}:\n\n- Node **${scenario.nodes.find(n => n.type === 'resource')?.label}** holds critical sensitive data.\n- It is accessible via the attack path starting at **${scenario.nodes[0]?.label}** through **${scenario.nodes.find(n => n.type === 'policy')?.label}** which grants unrestricted permissions.\n\nWould you like me to generate a 1-click remediation policy?`;
      } else if (lower.includes('ai agent') || lower.includes('bedrock') || lower.includes('prompt')) {
        reply = `The Bedrock AI Agent (**${scenario.nodes.find(n => n.type === 'ai-agent')?.label || 'SupportAI'}**) has execution privileges allowing autonomous tool execution. An attacker can exploit this via indirect prompt injection to execute \`iam:PassRole\` calls.`;
      } else if (lower.includes('remediat') || lower.includes('fix') || lower.includes('policy')) {
        reply = `To fix this environment, select any high-risk policy (e.g. **${scenario.nodes.find(n => n.type === 'policy')?.label}**) and click "AI Remediate". This replaces wildcards with scoped ARNs and condition tags.`;
      } else {
        reply = `Based on my IAM graph analysis of **${scenario.title}**:\n- Total Nodes Scanned: ${scenario.nodes.length}\n- Overall Risk Score: ${scenario.overallRiskScore}/100\n- Attack Path Status: ${scenario.attackPathBroken ? 'COMPLETELY NEUTRALIZED' : 'ACTIVE EXPLOIT VECTOR'}\n\nTop risk contributor: ${scenario.nodes.find(n => n.riskLevel === 'critical')?.label || 'Unrestricted IAM Policy'}.`;
      }

      setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 600);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-cyan-400/40 hover:scale-105 transition duration-200"
      >
        <Bot className="w-5 h-5 text-cyan-200" />
        <span>Ask Security AI</span>
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 bg-[#0f1522] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
      {/* Chat Header */}
      <div className="p-3.5 bg-[#172033] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-950 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Security AI Copilot</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded font-mono">
                v3.6
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">Context aware IAM risk reasoning</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Window */}
      <div className="p-4 space-y-3 h-80 overflow-y-auto bg-[#0a0e17] text-xs">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="p-1 bg-cyan-950 text-cyan-400 rounded-md shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`p-3 rounded-xl max-w-[85%] leading-relaxed whitespace-pre-line ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-none font-medium'
                  : 'bg-[#151c2c] border border-slate-800 text-slate-200 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>

            {msg.sender === 'user' && (
              <div className="p-1 bg-slate-800 text-slate-300 rounded-md shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-2.5 bg-[#172033] border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI about IAM permissions..."
          className="flex-1 bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
