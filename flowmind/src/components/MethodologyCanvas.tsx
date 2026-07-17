import React, { useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, CheckCircle2, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';

// Custom Node Component for sleek premium glassmorphic look
const CustomNode = ({ data, selected }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const [pos, setPos] = useState({ v: 'top', h: 'left' });
  const nodeRef = useRef<HTMLDivElement>(null);

  const showBubble = isHovered || data.isPinned;

  const handleMouseEnter = () => {
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      // If node is close to the top of the window, open bubble at the bottom. Otherwise top.
      const v = rect.top < 320 ? 'bottom' : 'top';
      // If node is close to the right edge, open bubble on the left side (tail on right). Otherwise right side (tail on left).
      const h = rect.left > window.innerWidth - 320 ? 'right' : 'left';
      setPos({ v, h });
    }
    setIsHovered(true);
  };

  return (
    <div
      className={showBubble ? 'show-bubble' : ''}
      ref={nodeRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (data.togglePin) data.togglePin();
      }}
      style={{
        padding: '20px 28px',
        borderRadius: '16px',
        background: '#3f3f46',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: '#e2e8f0',
        border: 'none',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        textAlign: 'center',
        minWidth: '200px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontSize: '15px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        position: 'relative',
        cursor: 'pointer'
      }}
    >
      {data.isPinned && (
        <div style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 0 12px var(--accent)'
        }} />
      )}
      {/* Glossy top edge highlight */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)'
      }} />

      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {data.label}
        {data.sub && <div style={{ fontSize: '11px', color: selected ? 'rgba(56, 189, 248, 0.8)' : 'var(--text3)', marginTop: '6px', fontWeight: 500 }}>{data.sub}</div>}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      {/* Speech Bubble Tooltip */}
      <div style={{
        position: 'absolute',
        ...(pos.v === 'top' ? { bottom: 'calc(100% + 16px)' } : { top: 'calc(100% + 16px)' }),
        ...(pos.h === 'left' ? { left: '-16px' } : { right: '-16px' }),
        width: '340px',
        background: '#333333',
        border: '1px solid var(--border)',
        borderTopLeftRadius: (pos.v === 'bottom' && pos.h === 'left') ? '4px' : '16px',
        borderTopRightRadius: (pos.v === 'bottom' && pos.h === 'right') ? '4px' : '16px',
        borderBottomLeftRadius: (pos.v === 'top' && pos.h === 'left') ? '4px' : '16px',
        borderBottomRightRadius: (pos.v === 'top' && pos.h === 'right') ? '4px' : '16px',
        padding: '20px',
        color: '#f8fafc',
        fontSize: '14.5px',
        lineHeight: 1.65,
        textAlign: 'left',
        opacity: showBubble ? 1 : 0,
        visibility: showBubble ? 'visible' : 'hidden',
        transform: showBubble
          ? 'translateY(0)'
          : (pos.v === 'top' ? 'translateY(10px)' : 'translateY(-10px)'),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: showBubble ? 50 : 1,
        boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
        fontWeight: 400
      }}>
        {/* Triangle Tail */}
        <div style={{
          position: 'absolute',
          ...(pos.v === 'top' ? { bottom: '-7px' } : { top: '-7px' }),
          ...(pos.h === 'left' ? { left: '20px' } : { right: '20px' }),
          width: '12px',
          height: '12px',
          background: '#333333',
          ...(pos.v === 'top'
            ? { borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)' }
            : { borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }
          ),
          transform: 'rotate(45deg)',
        }} />

        <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '8px', fontSize: '15.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {data.label}
          {data.isPinned && <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, background: 'var(--accent-glow)', padding: '2px 8px', borderRadius: '10px' }}>Pinned</span>}
        </div>
        <div style={{ color: '#d1d5db' }}>
          {data.info}
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 2 },
  labelStyle: { fill: '#e2e8f0', fontWeight: 600, fontSize: 11, letterSpacing: '0.02em' },
  labelBgStyle: { fill: '#1a1a1a', fillOpacity: 0.95, stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 },
  labelBgPadding: [12, 6] as [number, number],
  labelBgBorderRadius: 8,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: 'var(--text3)',
  },
};

const MODEL_DETAILS: Record<string, { desc: React.ReactNode, nodes: Node[], edges: Edge[] }> = {
  scrum: {
    desc: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', lineHeight: '1.5' }}>
        <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px' }}>Scrum</h3>
        <p style={{ margin: 0 }}><strong>Scrum</strong> is an agile framework that helps teams work together. It encourages teams to learn through experiences, self-organize, and reflect on their wins and losses to continuously improve. Work is divided into short, time-boxed iterations called <strong>Sprints</strong> (usually 1-4 weeks).</p>
        
        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#60a5fa' }}>Key Ceremonies & Steps</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li><strong>Sprint Planning:</strong> Define what can be delivered in the sprint and how.</li>
            <li><strong>Daily Standup:</strong> 15-minute daily sync for the team.</li>
            <li><strong>Sprint Review:</strong> Demo the work to stakeholders.</li>
            <li><strong>Sprint Retrospective:</strong> Reflect on what went well and what to improve.</li>
          </ul>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#4ade80' }}>Advantages</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>High adaptability to changing requirements.</li>
            <li>Frequent delivery of value to the customer.</li>
            <li>Strong team collaboration and transparency.</li>
          </ul>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#f87171' }}>Disadvantages</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Scope creep can easily happen without a strong Product Owner.</li>
            <li>Requires highly experienced, self-motivated team members.</li>
            <li>Too many meetings if not managed strictly.</li>
          </ul>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#c084fc' }}>Best Applications</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Complex projects with evolving requirements.</li>
            <li>Continuous product development (SaaS).</li>
            <li>Teams that need frequent feedback.</li>
          </ul>
        </div>
      </div>
    ),
    nodes: [
      { id: 's_1', type: 'custom', position: { x: 100, y: 50 }, data: { label: 'Product Backlog', info: 'A prioritized list of everything known to be needed in the product. It is the single source of requirements for any changes.' } },
      { id: 's_2', type: 'custom', position: { x: 250, y: 170 }, data: { label: 'Sprint Planning', info: 'A collaborative event where the team determines which Product Backlog items they will work on during the upcoming Sprint.' } },
      { id: 's_3', type: 'custom', position: { x: 400, y: 290 }, data: { label: 'Sprint (1-4 weeks)', sub: 'Daily Standup', info: 'The fixed-length timebox during which the team develops a shippable product increment. Includes a Daily Standup to synchronize activities.' } },
      { id: 's_4', type: 'custom', position: { x: 550, y: 410 }, data: { label: 'Sprint Review & Retrospective', info: 'At the end of the Sprint, the team inspects the outcome with stakeholders (Review) and reflects on processes to identify improvements (Retrospective).' } },
    ],
    edges: [
      { id: 'se1', source: 's_1', target: 's_2' },
      { id: 'se2', source: 's_2', target: 's_3' },
      { id: 'se3', source: 's_3', target: 's_4' },
      { id: 'se4', source: 's_4', target: 's_1', type: 'smoothstep', label: 'Next Sprint', style: { strokeDasharray: '5,5' } }
    ]
  },
  kanban: {
    desc: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', lineHeight: '1.5' }}>
        <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px' }}>Kanban</h3>
        <p style={{ margin: 0 }}><strong>Kanban</strong> is a visual framework that requires real-time communication of capacity and full transparency of work. Unlike Scrum, it has no fixed timeboxes. Work is pulled continuously, and <strong>WIP limits</strong> prevent bottlenecks.</p>
        
        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#60a5fa' }}>Key Principles & Steps</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li><strong>Visualize the Workflow:</strong> Map out all steps on a physical or digital board.</li>
            <li><strong>Limit WIP (Work In Progress):</strong> Stop starting, start finishing.</li>
            <li><strong>Manage Flow:</strong> Monitor and resolve bottlenecks immediately.</li>
            <li><strong>Make Policies Explicit:</strong> Define exactly what "Done" means.</li>
          </ul>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#4ade80' }}>Advantages</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Highly flexible; changes can be made at any time.</li>
            <li>Reduces waste and maximizes efficiency.</li>
            <li>Continuous, smooth delivery of features.</li>
          </ul>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#f87171' }}>Disadvantages</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Lack of timeframes can lead to endless development loops.</li>
            <li>Can become chaotic if the board is not kept updated.</li>
            <li>Doesn't prescribe specific roles, which can blur responsibilities.</li>
          </ul>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#c084fc' }}>Best Applications</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Support, maintenance, and bug-fixing teams.</li>
            <li>Continuous delivery pipelines.</li>
            <li>Teams struggling with bottlenecks and overloading.</li>
          </ul>
        </div>
      </div>
    ),
    nodes: [
      { id: 'k_1', type: 'custom', position: { x: 100, y: 50 }, data: { label: 'Backlog', info: 'A repository of ideas, requests, and requirements. Items here are not yet committed to but represent potential future work.' } },
      { id: 'k_2', type: 'custom', position: { x: 250, y: 170 }, data: { label: 'To Do (Ready)', info: 'Items pulled from the Backlog that are prioritized and ready for the team to start working on immediately.' } },
      { id: 'k_3', type: 'custom', position: { x: 400, y: 290 }, data: { label: 'In Progress', sub: 'WIP Limit Active', info: 'Work currently being executed. This column strictly enforces a Work In Progress (WIP) limit to prevent bottlenecks.' } },
      { id: 'k_4', type: 'custom', position: { x: 550, y: 410 }, data: { label: 'Code Review', info: 'A quality assurance step where peers review the completed work to ensure it meets coding standards before deployment.' } },
      { id: 'k_5', type: 'custom', position: { x: 700, y: 530 }, data: { label: 'Done', info: 'Completed work that has passed all requirements and is ready for release or has already been delivered.' } },
    ],
    edges: [
      { id: 'ke1', source: 'k_1', target: 'k_2' },
      { id: 'ke2', source: 'k_2', target: 'k_3' },
      { id: 'ke3', source: 'k_3', target: 'k_4' },
      { id: 'ke4', source: 'k_4', target: 'k_5' },
    ]
  },
  waterfall: {
    desc: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', lineHeight: '1.5' }}>
        <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px' }}>Waterfall</h3>
        <p style={{ margin: 0 }}><strong>Waterfall</strong> is a traditional, linear approach to software development. Each phase must be completed before the next phase begins. It emphasizes thorough documentation and upfront planning.</p>
        
        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#60a5fa' }}>Key Phases & Steps</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li><strong>Requirements:</strong> Gather and document all requirements upfront.</li>
            <li><strong>Design:</strong> Create detailed technical architecture and UI designs.</li>
            <li><strong>Implementation:</strong> Write the code based exactly on the designs.</li>
            <li><strong>Testing:</strong> Verify the code against the original requirements.</li>
            <li><strong>Deployment:</strong> Release the finished product.</li>
          </ul>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#4ade80' }}>Advantages</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Clear milestones, deadlines, and expected costs.</li>
            <li>Extensive documentation makes onboarding new developers easy.</li>
            <li>Very easy to manage due to its rigid structure.</li>
          </ul>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#f87171' }}>Disadvantages</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Extremely inflexible to changes later in the process.</li>
            <li>Testing happens very late, making bugs expensive to fix.</li>
            <li>Working software isn't produced until late in the lifecycle.</li>
          </ul>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#c084fc' }}>Best Applications</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Strict regulatory environments (healthcare, aerospace).</li>
            <li>Projects with clearly defined, unchanging requirements.</li>
            <li>Short, simple projects with predictable outcomes.</li>
          </ul>
        </div>
      </div>
    ),
    nodes: [
      { id: 'w_1', type: 'custom', position: { x: 100, y: 50 }, data: { label: 'Requirements', info: 'The initial phase where all possible requirements of the system to be developed are captured in a product requirements document (PRD).' } },
      { id: 'w_2', type: 'custom', position: { x: 250, y: 170 }, data: { label: 'Design', info: 'System and software design is prepared from the requirement specifications. This phase helps in specifying hardware and system requirements.' } },
      { id: 'w_3', type: 'custom', position: { x: 400, y: 290 }, data: { label: 'Implementation / Build', info: 'The system is first developed in small programs called units, which are integrated in the next phase. Each unit is developed and tested.' } },
      { id: 'w_4', type: 'custom', position: { x: 550, y: 410 }, data: { label: 'Testing', info: 'All the units developed in the implementation phase are integrated into a system. Post-integration the entire system is tested for any faults.' } },
      { id: 'w_5', type: 'custom', position: { x: 700, y: 530 }, data: { label: 'Deployment & Maintenance', info: 'Once the functional and non-functional testing is done, the product is deployed in the customer environment or released into the market.' } },
    ],
    edges: [
      { id: 'we1', source: 'w_1', target: 'w_2' },
      { id: 'we2', source: 'w_2', target: 'w_3' },
      { id: 'we3', source: 'w_3', target: 'w_4' },
      { id: 'we4', source: 'w_4', target: 'w_5' },
    ]
  },
  agile: {
    desc: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', lineHeight: '1.5' }}>
        <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px' }}>Agile / Incremental</h3>
        <p style={{ margin: 0 }}><strong>Agile / Incremental</strong> breaks the product down into small, usable increments. Instead of delivering a massive product at the very end, each cycle delivers a functional, tested piece of the system.</p>
        
        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#60a5fa' }}>Key Phases & Steps</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li><strong>Initial Planning:</strong> Establish the core vision and high-level architecture.</li>
            <li><strong>Iterative Cycles:</strong> Loop through Design -&gt; Code -&gt; Test phases in small batches.</li>
            <li><strong>Feedback Loop:</strong> Gather user feedback on the increment and adjust requirements.</li>
            <li><strong>Final Release:</strong> Integrate the polished increments into the final product.</li>
          </ul>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#4ade80' }}>Advantages</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Generates working software quickly and early during the life cycle.</li>
            <li>More flexible and less costly to change scope and requirements.</li>
            <li>Easier to test and debug during smaller iterations.</li>
          </ul>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#f87171' }}>Disadvantages</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Requires good planning and design early on to integrate pieces later.</li>
            <li>Total cost of the complete system is often higher than a single pass.</li>
            <li>Can suffer from "architecture decay" if not carefully refactored.</li>
          </ul>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#c084fc' }}>Best Applications</h4>
          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Startups building Minimum Viable Products (MVPs).</li>
            <li>Projects where user feedback dictates the product roadmap.</li>
            <li>Large, complex systems that can be easily modularized.</li>
          </ul>
        </div>
      </div>
    ),
    nodes: [
      { id: 'a_1', type: 'custom', position: { x: 250, y: 50 }, data: { label: 'Initial Planning & Architecture', info: 'Establishing the core vision, high-level architecture, and foundational requirements needed to guide the iterative development cycles.' } },
      { id: 'a_2', type: 'custom', position: { x: 50, y: 170 }, data: { label: 'Cycle 1', sub: 'Design -> Code -> Test', info: 'The first iterative loop encompassing Design, Code, and Test phases to deliver a foundational, working piece of software (often an MVP).' } },
      { id: 'a_3', type: 'custom', position: { x: 450, y: 170 }, data: { label: 'Cycle 2', sub: 'Design -> Code -> Test', info: 'A subsequent iterative loop that builds upon the previous cycle, incorporating user feedback, refining features, and adding new functionality.' } },
      { id: 'a_4', type: 'custom', position: { x: 250, y: 290 }, data: { label: 'Final Release / Integration', info: 'The culmination of multiple iterative cycles where the finalized, polished product is integrated, validated against all requirements, and released.' } },
    ],
    edges: [
      { id: 'ae1', source: 'a_1', target: 'a_2' },
      { id: 'ae2', source: 'a_2', target: 'a_3', label: 'Feedback & Iterate', style: { strokeDasharray: '5,5' } },
      { id: 'ae3', source: 'a_3', target: 'a_4' },
    ]
  },
};

const MODELS = [
  { id: 'scrum', label: 'Scrum' },
  { id: 'kanban', label: 'Kanban' },
  { id: 'waterfall', label: 'Waterfall' },
  { id: 'agile', label: 'Agile / Incremental' },
];

export default function MethodologyCanvas({ onClose }: { onClose: () => void }) {
  const { team, role, update } = useApp();
  const currentDbModel = team?.sdlcModel?.toLowerCase() || 'none';

  const [activeModel, setActiveModel] = useState<string>(
    currentDbModel !== 'none' ? currentDbModel : 'scrum'
  );

  const [pinnedNodeId, setPinnedNodeId] = useState<string | null>(null);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const reactFlowInstance = useRef<any>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(MODEL_DETAILS[activeModel]?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(MODEL_DETAILS[activeModel]?.edges || []);

  const mappedNodes = React.useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        isPinned: node.id === pinnedNodeId,
        togglePin: () => setPinnedNodeId(prev => prev === node.id ? null : node.id)
      }
    }));
  }, [nodes, pinnedNodeId]);

  useEffect(() => {
    if (reactFlowInstance.current) {
      setTimeout(() => {
        reactFlowInstance.current.fitView({ padding: 0.8, duration: 600 });
      }, 50);
    }
  }, [activeModel]);

  const handleModelSelect = (modelId: string) => {
    setActiveModel(modelId);
    setNodes(MODEL_DETAILS[modelId].nodes);
    setEdges(MODEL_DETAILS[modelId].edges);
    setPinnedNodeId(null);
  };

  const saveModel = async (modelId: string | null) => {
    if (!team?.code || role !== 'leader') return;
    const dbValue = modelId ? modelId.charAt(0).toUpperCase() + modelId.slice(1) : 'None';

    // Update local state immediately
    update({ team: { ...team, sdlcModel: dbValue } });

    // Save to Supabase
    const { error } = await supabase.from('teams').update({ sdlc_model: dbValue }).eq('code', team.code);
    if (error) {
      console.error('Failed to save SDLC model:', error);
      alert('Failed to save methodology.');
    }
  };

  const isViewingCurrent = activeModel === currentDbModel;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: 'transparent',
      backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px)',
      backgroundSize: '24px 24px',
      backgroundPosition: '0 0'
    }}>

      <style>
        {`
          .react-flow__controls-button {
            background-color: var(--surface) !important;
            border-bottom: 1px solid var(--border) !important;
            fill: var(--text) !important;
          }
          .react-flow__controls-button:hover {
            background-color: var(--surface2) !important;
          }
          .react-flow__controls-button:last-child {
            border-bottom: none !important;
          }
          .react-flow__node:has(.show-bubble) {
            z-index: 1000 !important;
          }
          .thin-scrollbar::-webkit-scrollbar {
            width: 0.5px;
          }
          .thin-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .thin-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.15);
            border-radius: 4px;
          }
          .thin-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(255, 255, 255, 0.3);
          }
        `}
      </style>

      {/* Canvas Area (Background layer) */}
      <div style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0
      }}>
        <ReactFlow
          nodes={mappedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.8 }}
          proOptions={{ hideAttribution: true }}
          onInit={(instance) => reactFlowInstance.current = instance}
        >
          <Controls position="bottom-left" style={{ background: 'var(--surface2)', borderColor: 'var(--border)', borderRadius: '8px', overflow: 'hidden' }} showInteractive={false} />
        </ReactFlow>
      </div>

      {/* Top Left - Model Tabs (Floating) */}
      <div style={{
        position: 'absolute',
        top: 24,
        left: 24,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 10
      }}>
        {MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => handleModelSelect(m.id)}
            style={{
              background: activeModel === m.id ? '#4b4b4b' : '#262626',
              color: activeModel === m.id ? '#ffffff' : 'var(--text3)',
              border: 'none',
              padding: '0 20px',
              height: '38px',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: activeModel === m.id ? 600 : 500,
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Top Right - Action Buttons */}
      <div style={{
        position: 'absolute',
        top: 24,
        right: 24,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 10
      }}>
        {role === 'leader' && (
          isViewingCurrent ? (
            <div style={{
              background: 'var(--green)', color: '#ffffff', padding: '0 20px',
              height: '38px', boxSizing: 'border-box',
              borderRadius: '12px', fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '8px',
              border: 'none'
            }}>
              <CheckCircle2 size={16} /> Selected
            </div>
          ) : (
            <button
              onClick={() => saveModel(activeModel)}
              style={{
                background: '#fff', color: '#000', border: 'none',
                padding: '0 20px', height: '38px', boxSizing: 'border-box',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '12px', cursor: 'pointer',
                fontWeight: 600, fontSize: '13px', transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
            >
              Select for Team
            </button>
          )
        )}

        {role === 'leader' && currentDbModel !== 'none' && !isViewingCurrent && (
          <button
            onClick={() => saveModel(null)}
            style={{
              background: '#262626', color: 'var(--text3)', border: 'none',
              padding: '0 20px', height: '38px', boxSizing: 'border-box',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '12px', cursor: 'pointer',
              fontWeight: 500, fontSize: '13px', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text3)'}
          >
            Clear Selection
          </button>
        )}

        <button
          onClick={onClose}
          style={{
            background: '#262626',
            border: 'none',
            color: 'var(--text3)',
            padding: '0 20px',
            height: '38px',
            boxSizing: 'border-box',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text3)'}
        >
          <X size={16} /> Close
        </button>
      </div>

      {/* Bottom Right - Info Panel */}
      <div 
        style={{ position: 'absolute', bottom: 24, right: 24, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}
        onMouseEnter={() => setShowModelInfo(true)}
        onMouseLeave={() => setShowModelInfo(false)}
      >
        {showModelInfo && (
          <div style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            width: '420px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            animation: 'fadeIn 0.2s ease-out',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '24px',
              maxHeight: '400px',
              overflowY: 'auto',
              color: 'var(--text)',
            }}>
              {MODEL_DETAILS[activeModel].desc}
            </div>
          </div>
        )}
        <div style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#3f3f46'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface2)'; }}
        >
          <Info size={20} />
        </div>
      </div>
    </div>
  );
}
