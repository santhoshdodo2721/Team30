import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  Bot, 
  User, 
  ShieldCheck, 
  FileCode, 
  Database, 
  Zap, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Filter, 
  Eye, 
  AlertTriangle,
  Flame,
  CheckCircle2
} from 'lucide-react';

export default function VisualGraph({ 
  scenario, 
  selectedNode, 
  onSelectNode, 
  activeAttackStep = null,
  highlightAttackPath = true 
}) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');

  useEffect(() => {
    if (!scenario || !svgRef.current) return;

    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 650;

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Prepare node and edge deep copies for D3 mutation
    let nodes = scenario.nodes.map(n => ({ ...n }));
    let edges = scenario.edges.map(e => ({ ...e }));

    // Filtering logic
    if (filterType !== 'ALL') {
      nodes = nodes.filter(n => n.type === filterType);
      const validNodeIds = new Set(nodes.map(n => n.id));
      edges = edges.filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target));
    }

    if (filterRisk !== 'ALL') {
      nodes = nodes.filter(n => n.riskLevel === filterRisk.toLowerCase());
      const validNodeIds = new Set(nodes.map(n => n.id));
      edges = edges.filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target));
    }

    // Zoom container
    const g = svg.append('g').attr('class', 'graph-container');

    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Arrow markers definitions
    const defs = svg.append('defs');

    // Risk markers
    const markerTypes = [
      { id: 'arrow-escalation', color: '#ff4757' },
      { id: 'arrow-assumes', color: '#5f27cd' },
      { id: 'arrow-policy', color: '#ff9f43' },
      { id: 'arrow-data-access', color: '#00d2d3' },
      { id: 'arrow-safe', color: '#10ac84' }
    ];

    markerTypes.forEach(m => {
      defs.append('marker')
        .attr('id', m.id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 28)
        .attr('refY', 0)
        .attr('markerWidth', 7)
        .attr('markerHeight', 7)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', m.color);
    });

    // Node Glow filter
    const filter = defs.append('filter')
      .attr('id', 'critical-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '6')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Force Simulation Setup
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-450))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Edges
    const linkGroup = g.append('g').attr('class', 'links');
    
    const link = linkGroup.selectAll('g')
      .data(edges)
      .enter()
      .append('g')
      .attr('class', 'edge-group');

    const linkLines = link.append('line')
      .attr('stroke', d => {
        if (scenario.attackPathBroken && d.riskType === 'safe') return '#10ac84';
        if (d.riskType === 'escalation') return '#ff4757';
        if (d.riskType === 'assumes') return '#9c88ff';
        if (d.riskType === 'policy') return '#ff9f43';
        return '#48dbfb';
      })
      .attr('stroke-width', d => {
        const isAttackEdge = scenario.attackPath?.includes(d.source.id || d.source) && scenario.attackPath?.includes(d.target.id || d.target);
        return isAttackEdge && highlightAttackPath ? 3.5 : 1.8;
      })
      .attr('stroke-dasharray', d => d.riskType === 'escalation' ? '5,5' : 'none')
      .attr('marker-end', d => {
        if (scenario.attackPathBroken && d.riskType === 'safe') return 'url(#arrow-safe)';
        if (d.riskType === 'escalation') return 'url(#arrow-escalation)';
        if (d.riskType === 'assumes') return 'url(#arrow-assumes)';
        if (d.riskType === 'policy') return 'url(#arrow-policy)';
        return 'url(#arrow-data-access)';
      });

    // Edge Labels
    const linkLabels = link.append('text')
      .attr('font-size', '10px')
      .attr('fill', '#a4b0be')
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      .text(d => d.label);

    // Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const node = nodeGroup.selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => {
        event.stopPropagation();
        onSelectNode(d);
      });

    // Node Outer Glow Ring
    node.append('circle')
      .attr('r', 28)
      .attr('fill', 'none')
      .attr('stroke', d => {
        if (selectedNode?.id === d.id) return '#00d2d3';
        if (d.remediated) return '#10ac84';
        if (d.riskLevel === 'critical') return '#ff4757';
        if (d.riskLevel === 'high') return '#ffa502';
        return '#2ed573';
      })
      .attr('stroke-width', d => (selectedNode?.id === d.id ? 4 : 2))
      .attr('filter', d => d.riskLevel === 'critical' ? 'url(#critical-glow)' : 'none')
      .attr('opacity', d => {
        if (activeAttackStep !== null) {
          const currentAttackNodeId = scenario.attackPath?.[activeAttackStep];
          return currentAttackNodeId === d.id ? 1 : 0.4;
        }
        return 1;
      });

    // Node Main Body Circle
    node.append('circle')
      .attr('r', 22)
      .attr('fill', d => {
        if (d.type === 'ai-agent') return '#092532';
        if (d.type === 'user') return '#111b2e';
        if (d.type === 'role') return '#221133';
        if (d.type === 'policy') return '#2b1b0d';
        return '#0d2818';
      })
      .attr('stroke', d => {
        if (d.type === 'ai-agent') return '#00d2d3';
        if (d.type === 'user') return '#54a0ff';
        if (d.type === 'role') return '#5f27cd';
        if (d.type === 'policy') return '#ff9f43';
        return '#10ac84';
      })
      .attr('stroke-width', 2);

    // Node Type Icon Text indicator
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('font-size', '13px')
      .attr('fill', d => {
        if (d.type === 'ai-agent') return '#00d2d3';
        if (d.type === 'user') return '#54a0ff';
        if (d.type === 'role') return '#a55eea';
        if (d.type === 'policy') return '#ff9f43';
        return '#2ed573';
      })
      .text(d => {
        if (d.type === 'ai-agent') return '🤖';
        if (d.type === 'user') return '👤';
        if (d.type === 'role') return '🛡️';
        if (d.type === 'policy') return '📄';
        return '🗄️';
      });

    // Node Risk Badge
    node.append('rect')
      .attr('x', 12)
      .attr('y', -24)
      .attr('width', 22)
      .attr('height', 14)
      .attr('rx', 4)
      .attr('fill', d => {
        if (d.riskLevel === 'critical') return '#ff4757';
        if (d.riskLevel === 'high') return '#ffa502';
        if (d.riskLevel === 'medium') return '#eccc68';
        return '#2ed573';
      });

    node.append('text')
      .attr('x', 23)
      .attr('y', -14)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('fill', '#000')
      .text(d => d.riskScore);

    // Node Label underneath
    node.append('text')
      .attr('dy', 38)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', d => (selectedNode?.id === d.id ? '#00d2d3' : '#f1f2f6'))
      .text(d => d.label.length > 24 ? d.label.substring(0, 22) + '...' : d.label);

    // Node Category Subtitle
    node.append('text')
      .attr('dy', 50)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#a4b0be')
      .text(d => `${d.cloudProvider} • ${d.category}`);

    // Simulation Tick Listener
    simulation.on('tick', () => {
      linkLines
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      linkLabels
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Auto-fit initial zoom
    const zoomTransform = d3.zoomIdentity.translate(0, 0).scale(0.95);
    svg.call(zoom.transform, zoomTransform);

  }, [scenario, selectedNode, activeAttackStep, highlightAttackPath, filterType, filterRisk]);

  const handleZoom = (factor) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(d3.zoom().scaleBy, factor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(d3.zoom().transform, d3.zoomIdentity);
  };

  return (
    <div ref={containerRef} className="relative w-full h-[620px] bg-[#0c1017] rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
      {/* Top Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 bg-[#151b26]/90 backdrop-blur-md px-4 py-2.5 rounded-lg border border-slate-700/60 shadow-lg">
        {/* Filter controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filters:</span>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#0b0e14] border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Types</option>
            <option value="ai-agent">🤖 AI Agents</option>
            <option value="user">👤 Users / Principals</option>
            <option value="role">🛡️ IAM Roles</option>
            <option value="policy">📄 Policies</option>
            <option value="resource">🗄️ Cloud Resources</option>
          </select>

          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="bg-[#0b0e14] border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">🔴 Critical Risk</option>
            <option value="HIGH">🟠 High Risk</option>
            <option value="MEDIUM">🟡 Medium Risk</option>
            <option value="LOW">🟢 Low Risk</option>
          </select>

          {scenario.attackPathBroken && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/50 rounded text-emerald-400 text-xs font-medium animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Attack Path Neutralized</span>
            </div>
          )}
        </div>

        {/* View Zoom Actions */}
        <div className="flex items-center gap-1 bg-[#0b0e14] p-1 rounded-md border border-slate-800">
          <button
            onClick={() => handleZoom(1.2)}
            title="Zoom In"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-cyan-400 transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            title="Zoom Out"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-cyan-400 transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset View"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-cyan-400 transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Bottom Legend */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 bg-[#151b26]/90 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#00d2d3] inline-block shadow-[0_0_8px_#00d2d3]" />
            <span>AI Agent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#54a0ff] inline-block" />
            <span>IAM User</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#5f27cd] inline-block" />
            <span>IAM Role</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff9f43] inline-block" />
            <span>Policy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#10ac84] inline-block" />
            <span>Cloud Resource</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-red-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span>Critical Path</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Remediated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
