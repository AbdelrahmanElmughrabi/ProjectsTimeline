import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlow, ReactFlowProvider, Background, Controls, Handle, Position, MarkerType, useNodesState } from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import { Dialog } from '@base-ui/react/dialog';
import { Activity, ArrowLeft, ArrowRight, BookOpen, Box, Check, ChevronRight, Circle, Compass, FileText, Focus, GitBranch, Home, Layers, Map, Maximize2, Network, Search, ShieldCheck, X } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import './style.css';
import data from './vivarium.json';
import { makeModel, projectMap, relationLabels } from './model.mjs';

const model = makeModel(data), records = model.records, byId = model.byId;
const project = records.find(r => r.kind === 'project');
const features = records.filter(r => r.kind === 'feature');
const actions = records.filter(r => r.kind === 'action');
const scope = records.find(r => r.kind === 'scope');
const elk = new ELK();
const kindIcon = { project: Compass, component: Box, feature: Layers, requirement: ShieldCheck, action: GitBranch, check: ShieldCheck, decision: BookOpen };
const names = ids => ids.map(id => byId.get(id)?.title).filter(Boolean).join(', ');
const textBody = r => r.narrative.trim().split(/\n\s*\n/).filter(s => !s.startsWith('#')).slice(0, 2).map(s => s.replace(/\r?\n/g, ' ')).join('\n\n');

function Button({ children, icon: Icon, tone = '', className = '', ...props }) {
  return <button className={`button ${tone} ${className}`} {...props}>{Icon && <Icon size={16} aria-hidden="true"/>}{children}</button>;
}
function Chip({ children, kind = '' }) { return <span className={`chip ${kind}`}>{children}</span>; }
function KnowledgeNode({ data: d }) {
  const Icon = kindIcon[d.record.kind] || FileText;
  const linked = features.filter(f => f.component === d.record.id);
  return <div className={`knowledge-node ${d.record.kind}`}>
    <Handle type="target" position={Position.Left}/>
    <div className="node-kind"><Icon size={14}/>{d.record.kind === 'project' ? 'PROJECT MODEL' : d.record.kind.toUpperCase()}</div>
    <strong>{d.record.kind === 'project' ? 'Vivarium' : d.record.title}</strong>
    {linked.length > 0 && <div className="node-capabilities">{linked.map(f => <button key={f.id} className="nodrag" onClick={e => { e.stopPropagation(); d.select(f.id); }}>{f.title}<ChevronRight size={12}/></button>)}</div>}
    {d.record.kind === 'project' && <small>Generation core · PTB source</small>}
    {d.record.kind === 'feature' && <small>{records.filter(r => r.kind === 'requirement' && r.features.includes(d.record.id)).length} linked requirements</small>}
    <Handle type="source" position={Position.Right}/>
  </div>;
}
const nodeTypes = { knowledge: KnowledgeNode };

function MapCanvas({ lens, anchor, expanded, selected, select, onSource, layoutKey }) {
  const projection = useMemo(() => projectMap(model, lens, anchor, expanded), [lens, anchor, expanded]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [flow, setFlow] = useState(null), [busy, setBusy] = useState(true), [error, setError] = useState('');
  const layoutCount = useRef(0);
  useEffect(() => {
    let alive = true, fitTimer;
    setBusy(true); setError('');
    const graph = { id: 'view', layoutOptions: {
      'elk.algorithm': lens === 'focus' ? 'layered' : 'stress', 'elk.direction': 'RIGHT',
      'elk.randomSeed': '7', 'elk.spacing.nodeNode': '60',
      'elk.stress.desiredEdgeLength': '250', 'elk.layered.spacing.nodeNodeBetweenLayers': '90',
    }, children: projection.nodes.map(r => ({ id: r.id, width: 210, height: r.kind === 'component' && features.some(f => f.component === r.id) ? 130 : 104 })),
    edges: projection.links.map(e => ({ id: e.id, sources: [e.from], targets: [e.to] })) };
    elk.layout(graph).then(result => {
      if (!alive) return;
      layoutCount.current++;
      setNodes(result.children.map(n => ({ id: n.id, type: 'knowledge', position: { x: n.x, y: n.y },
        data: { record: byId.get(n.id), select }, ariaLabel: `${byId.get(n.id).kind}: ${byId.get(n.id).title}` })));
      setBusy(false);
      fitTimer = setTimeout(() => flow?.fitView({ padding: .18, maxZoom: 1.1, duration: 0 }), 100);
    }).catch(() => { if (alive) { setBusy(false); setError('Layout unavailable. Use the synchronized list or retry Arrange.'); } });
    return () => { alive = false; clearTimeout(fitTimer); };
  }, [projection, layoutKey, flow]);
  const edges = projection.links.map(e => ({ id: e.id, source: e.from, target: e.to,
    type: 'default', label: lens === 'focus' ? relationLabels[e.relation] : undefined,
    markerEnd: { type: MarkerType.ArrowClosed, color: e.relation === 'project-ownership' ? '#707993' : '#aa9be8', width: 16, height: 16 },
    className: e.relation === 'project-ownership' ? 'ownership-edge' : 'asserted-edge',
    data: e, focusable: true, ariaLabel: `${byId.get(e.from).title} ${relationLabels[e.relation] || 'owns'} ${byId.get(e.to).title}`,
    style: { stroke: e.relation === 'project-ownership' ? '#616a85' : '#aa9be8', strokeWidth: 1.5 },
    labelStyle: { fill: '#c6c9da', fontSize: 12 }, labelBgStyle: { fill: '#191d2b' }, labelBgPadding: [7,4],
  }));
  return <div className="map-canvas" data-testid="engineering-map" data-layouts={layoutCount.current}>
    <ReactFlow nodes={nodes.map(n => ({ ...n, selected: n.id === selected }))} edges={edges} nodeTypes={nodeTypes}
      onNodesChange={onNodesChange} onInit={setFlow} onNodeClick={(_, n) => select(n.id)}
      onEdgeClick={(_, e) => onSource({ title: `${relationLabels[e.data.relation] || 'Project ownership'} · source assertion`, source: e.data.source })}
      nodesConnectable={false} edgesReconnectable={false} deleteKeyCode={null} nodesFocusable edgesFocusable minZoom={.2} maxZoom={1.8}
      proOptions={{ hideAttribution: false }} colorMode="dark" fitView
      ariaLabelConfig={{ 'controls.zoomIn.ariaLabel': 'Zoom in', 'controls.zoomOut.ariaLabel': 'Zoom out', 'controls.fitView.ariaLabel': 'Fit map',
        'node.a11yDescription.default': 'Press Enter to select. Arrow keys move visual position only. Use the outline for text navigation.',
        'edge.a11yDescription.default': 'Press Enter to select this source assertion. Relationships cannot be deleted in this study.' }}>
      <Background gap={24} size={1} color="#303547"/><Controls showInteractive={false}/>
    </ReactFlow>
    <div className="canvas-caption"><span className="tiny-dot"/> {lens === 'focus' ? 'Declared relationships · selected neighborhood' : 'Project ownership + declared structure'}<span>Drag to arrange · scroll to zoom</span></div>
    {busy && <div className="canvas-message" role="status">Arranging this view…</div>}
    {error && <div className="canvas-message" role="alert">{error}</div>}
  </div>;
}

function App() {
  const [opened, setOpened] = useState(false), [view, setView] = useState('Overview');
  const [concept, setConcept] = useState('atlas'), [lens, setLens] = useState('structure'), [anchor, setAnchor] = useState(project.id);
  const [expanded, setExpanded] = useState(false), [selected, setSelected] = useState(null), [layoutKey, setLayoutKey] = useState(0);
  const [query, setQuery] = useState(''), [listOpen, setListOpen] = useState(false), [source, setSource] = useState(null);
  const [committed, setCommitted] = useState(new Set()), [work, setWork] = useState({}), [focus, setFocus] = useState(null);
  const [events, setEvents] = useState([]), [checkpoint, setCheckpoint] = useState(null), [modal, setModal] = useState(null), [ack, setAck] = useState(false);
  const [draft, setDraft] = useState({ accomplishment: '', next: '', problem: '', questions: '' });
  const sourceOpener = useRef(null), inspectorHeading = useRef(null), mapTab = useRef(null);
  const r = byId.get(selected), stateOf = id => !committed.has(id) ? 'Proposed' : work[id] === 'done' ? 'Done · not verification' : work[id] === 'doing' ? 'In progress · simulated' : 'Committed · not started';
  function record(label, target) { setEvents(old => [...old, { id: old.length + 1, label, target, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]); }
  function select(id) { setSelected(id); }
  function inspect(id) { setSelected(id); requestAnimationFrame(() => inspectorHeading.current?.focus()); }
  function explore(id) { setSelected(id); setAnchor(id); setLens('focus'); setView('Map'); }
  function showSource(value, opener) { sourceOpener.current = opener || document.activeElement; setSource(value); }
  function changeConcept(value) { setConcept(value); setLens(value === 'atlas' ? 'structure' : 'features'); setSelected(null); }
  function continueSaved() { setOpened(true); setView(checkpoint.view); setSelected(checkpoint.target); setLens(checkpoint.lens); setAnchor(checkpoint.anchor); requestAnimationFrame(() => inspectorHeading.current?.focus()); }
  const searchResults = query.trim() ? records.filter(item => `${item.title} ${item.id}`.toLowerCase().includes(query.toLowerCase())).slice(0, 15) : [];
  function actionButtons(a) {
    if (!committed.has(a.id)) return <Button tone="primary" onClick={() => { setAck(false); setModal('review'); }}>Review commitment</Button>;
    return <div className="flex flex-wrap gap-2">{work[a.id] !== 'doing' && work[a.id] !== 'done' && <Button tone="primary" onClick={() => { setWork(v => ({ ...v, [a.id]: 'doing' })); setFocus(a.id); record('Started work (simulation)', a.id); }}>Start work</Button>}
      <Button icon={work[a.id] === 'done' ? Activity : Check} onClick={() => { const done = work[a.id] !== 'done'; setWork(v => ({ ...v, [a.id]: done ? 'done' : 'todo' })); record(done ? 'Marked action done; no verification recorded' : 'Reopened action', a.id); }}>{work[a.id] === 'done' ? 'Reopen' : 'Mark done'}</Button></div>;
  }
  function Inspector() {
    if (!r) return null;
    const ownFeatures = r.kind === 'component' ? features.filter(f => f.component === r.id) : r.kind === 'feature' ? [r] : features.filter(f => r.features?.includes(f.id));
    const reqs = r.kind === 'requirement' ? [r] : records.filter(q => q.kind === 'requirement' && (r.requirements?.includes(q.id) || q.features.some(id => ownFeatures.some(f => f.id === id))));
    const relatedActions = actions.filter(a => r.kind === 'action' ? false : a.features.some(id => ownFeatures.some(f => f.id === id)) || a.requirements.includes(r.id));
    const checks = records.filter(c => c.kind === 'check' && c.requirements.some(id => reqs.some(q => q.id === id)));
    const directComponents = records.filter(c => c.kind === 'component' && (c.id === r.component || c.parent === r.id || c.id === r.parent));
    return <aside className="inspector" aria-label="Engineering inspector">
      <div className="inspector-top"><span className={`kind-label ${r.kind}`}><span className="tiny-dot"/>{r.kind}</span><Button icon={X} aria-label="Close inspector" onClick={() => { setSelected(null); mapTab.current?.focus(); }}/></div>
      <h2 ref={inspectorHeading} tabIndex={-1}>{r.title}</h2>
      <div className="mb-4 flex flex-wrap gap-2"><Chip>Explicit source definition</Chip>{r.kind === 'action' && <Chip kind={work[r.id] === 'doing' ? 'violet' : ''}>{stateOf(r.id)}</Chip>}{r.kind === 'requirement' && <Chip>Draft · Not assessed</Chip>}</div>
      <p className="description">{r.kind === 'action' ? r.instructions : textBody(r) || 'Definition is in the captured source. No additional intent is inferred.'}</p>
      <div className="inspector-commands"><Button icon={Focus} onClick={() => explore(r.id)}>Explore connected</Button><Button icon={FileText} onClick={e => showSource(r, e.currentTarget)}>Open source section</Button></div>
      {r.kind === 'action' && <section><h3>Definition of done</h3><p>{r.definition_of_done || 'Not recorded'}</p><details><summary>Applicability & evidence guidance</summary><p>{r.applicability}</p><p>{r.evidence_guidance}</p></details>{actionButtons(r)}</section>}
      {r.kind === 'requirement' && <section><h3>Acceptance statements</h3><ul>{r.acceptance.map(t => <li key={t}>{t}</li>)}</ul><p className="muted">An accepted definition or completed action is not evidence of verification.</p></section>}
      {r.kind === 'decision' && <section><h3>Proposed decision</h3><p>{r.rationale}</p><Chip>No accepted decision recorded</Chip></section>}
      {r.kind === 'check' && <section><h3>Planned check · Not run</h3><p>{r.instructions}</p><ul>{r.expected.map(t => <li key={t}>{t}</li>)}</ul></section>}
      {[["Components", directComponents], ["Features", ownFeatures.filter(f => f.id !== r.id)], ["Requirements", reqs.filter(q => q.id !== r.id)], ["Development work", relatedActions], ["Planned checks", checks]].filter(([,items]) => items.length).map(([title,items]) => <section key={title}><h3>{title} <span>{items.length}</span></h3>{title === 'Development work' && <small>Through declared feature/requirement links; not dependencies.</small>}<div className="context-links">{items.map(item => <button key={item.id} onClick={() => inspect(item.id)}><span>{item.title}</span><ChevronRight size={14}/>{item.kind === 'action' && <small>{stateOf(item.id)}</small>}</button>)}</div></section>)}
      <details className="traceability"><summary>Identity & source traceability</summary><code>{r.id}</code><p>{data.documents.find(d => d.id === r.source.documentId).relativePath} · line {r.source.span.start.line}</p><p>Local simulation state is separate from this original captured definition.</p></details>
    </aside>;
  }
  function MapView() {
    return <div className={`map-layout ${concept} ${r ? 'has-inspector' : ''}`}>
      {concept === 'workbench' && <aside className="capability-index"><p className="eyebrow">EXPLORE BY CAPABILITY</p><h2>One question at a time.</h2><p className="muted">Choose a feature, then follow its declared engineering context.</p>{features.map(f => <button key={f.id} onClick={() => explore(f.id)} aria-current={selected === f.id ? 'true' : undefined}><Layers size={16}/><span>{f.title}</span><ChevronRight size={14}/></button>)}</aside>}
      <section className="map-surface">
        <div className="map-tools"><div><h2>{lens === 'focus' ? 'Connected neighborhood' : lens === 'features' ? 'Product capabilities' : 'Component atlas'}</h2><small>{lens === 'focus' ? byId.get(anchor)?.title : 'Source-backed structure · no inferred dependencies'}</small></div>
          <div className="flex flex-wrap gap-2"><label className="sr-only" htmlFor="map-lens">Map lens</label><select id="map-lens" value={lens} onChange={e => { setLens(e.target.value); setAnchor(selected || project.id); }}><option value="structure">Components</option><option value="features">Features</option><option value="focus">Connected context</option></select><Button icon={Maximize2} onClick={() => setLayoutKey(v => v + 1)}>Arrange</Button></div></div>
        <MapCanvas lens={lens} anchor={anchor} expanded={expanded} selected={selected} select={select} layoutKey={layoutKey} onSource={s => showSource(s)}/>
        <div className="map-bottom"><div className="legend" aria-label="Relationship legend"><span><i className="line solid"/>Source assertion</span><span><i className="line dashed"/>Suggestion: none</span><span><i className="line green"/>Evidence: none</span></div>{lens === 'structure' && <Button icon={expanded ? Layers : Box} onClick={() => setExpanded(v => !v)}>{expanded ? 'Collapse children' : 'Expand child components'}</Button>}</div>
      </section>
      {Inspector()}
    </div>;
  }
  function Overview() {
    return <div className="overview">
      <section className="project-intro"><p className="eyebrow">DETERMINISTIC GENERATION · LOCAL-FIRST</p><h1>A shared model of<br/><span>what you’re building.</span></h1><p>{project.goal}</p><div className="flex flex-wrap gap-2"><Button tone="primary" icon={Network} onClick={() => { setView('Map'); setSelected(null); }}>Explore engineering map</Button><Button icon={GitBranch} onClick={() => setView('Development')}>View development plan</Button></div></section>
      <section className="overview-structure"><div className="section-heading"><div><p className="eyebrow">PRODUCT SHAPE</p><h2>Seven capabilities. Connected context.</h2></div><span className="source-pill"><FileText size={14}/>From the blueprint</span></div><div className="feature-directory">{features.map((f,i) => <button key={f.id} onClick={() => { setView('Map'); explore(f.id); }}><span className="feature-number">0{i+1}</span><div><strong>{f.title}</strong><small>{byId.get(f.component)?.title || 'Project-wide'}</small></div><ArrowRight size={17}/></button>)}</div></section>
      <section className="overview-context"><div><p className="eyebrow">ENGINEERING CONTEXT</p><h2>Plans are not proof.</h2><p>The blueprint describes 10 actions, 4 proposed decisions and 5 planned checks. No completion or verified outcome is present in the source.</p><p className="muted">Development assessment: Not assessed. No schedule or dependency order is recorded.</p></div><div className="context-note"><ShieldCheck size={21}/><h3>Review, then make it yours.</h3><p>Explore requirements in context. Commit work explicitly in the Development simulation.</p><Button icon={BookOpen} onClick={() => { setSelected('dec.stack-choice'); setView('Map'); }}>Inspect proposed stack decision</Button></div></section>
    </div>;
  }
  function Development() {
    return <div className={`development-layout ${r ? 'has-inspector' : ''}`}><section className="development-plan"><div className="section-heading"><div><p className="eyebrow">AUTHORED ROADMAP · NO DATES</p><h2>{scope.title}</h2></div><Chip>{committed.size ? 'Active · simulated' : 'Draft organization'}</Chip></div><p className="muted">Four stages organize the work. Their order does not imply dependencies; later-stage work can happen early.</p><div className="plan-summary"><span>{committed.size} committed · {actions.filter(a => work[a.id] === 'doing').length} in progress · {actions.filter(a => work[a.id] === 'done').length} done <em>in this simulation</em></span><Button tone="primary" onClick={() => { setAck(false); setModal('review'); }}>{committed.size ? 'Review plan effects' : 'Review & commit plan'}</Button></div>
      <div className="roadmap">{scope.workflow.stages.map((stage,i) => <section key={stage.key} className="roadmap-stage"><div className="stage-heading"><span>{i+1}</span><div><h3>{stage.title}</h3><small>Authored stage · not a date</small></div></div><div className="stage-actions">{actions.filter(a => a.scope === scope.id && a.stage === stage.key).map(a => <button key={a.id} className={selected === a.id ? 'selected' : ''} onClick={() => inspect(a.id)}><span className={`work-indicator ${work[a.id] || ''}`}>{work[a.id] === 'done' ? <Check size={13}/> : <Circle size={13}/>}</span><div><strong>{a.title}</strong><small>{names(a.features)}</small></div><Chip kind={work[a.id] === 'doing' ? 'violet' : ''}>{stateOf(a.id)}</Chip><ChevronRight size={15}/></button>)}</div></section>)}</div><section className="unscoped"><h3>Unscoped work</h3>{actions.filter(a => !a.scope).map(a => <button key={a.id} onClick={() => inspect(a.id)}>{a.title}<ChevronRight size={16}/></button>)}</section><p className="muted footnote">Calendar timeline unavailable: no date data. Completion here never confirms a release or passes a check.</p></section>{Inspector()}</div>;
  }
  function History() {
    return <div className={`history-layout ${r ? 'has-inspector' : ''}`}><section className="history-surface"><p className="eyebrow">ACTUAL INTERACTIONS · DESIGN SIMULATION</p><h2>What happened, and where to continue.</h2>{!events.length ? <div className="honest-empty"><Activity size={30}/><h3>No development history in this blueprint.</h3><p>Source definitions are plans. Start work or save your own checkpoint in this simulation to see a recorded interaction here.</p><Button icon={GitBranch} onClick={() => setView('Development')}>Explore planned work</Button></div> : <ol className="event-list">{[...events].reverse().map(e => <li key={e.id}><span className="event-marker"/><div><small>Simulation interaction · {e.time}</small><h3>{e.label}</h3><button onClick={() => inspect(e.target)}>{byId.get(e.target)?.title || project.title}<ArrowRight size={14}/></button></div></li>)}</ol>}</section>{Inspector()}</div>;
  }
  const sourceDoc = source && data.documents.find(d => d.id === source.source.documentId);
  const sourceText = sourceDoc && sourceDoc.text.slice(source.source.span.start.utf16Offset, (source.narrativeSource || source.source).span.end.utf16Offset);
  return <div className="prototype-frame dark">
    <div className="prototype-banner"><span><span className="tiny-dot"/>DESIGN SIMULATION <b>Simulated state · real Vivarium definitions · no app/database writes</b></span><label>Compare concepts <select aria-label="Workspace concept" value={concept} onChange={e => changeConcept(e.target.value)}><option value="atlas">A · Component Atlas</option><option value="workbench">B · Focus Workbench</option></select></label></div>
    <div className="app-shell"><aside className="app-nav"><div className="brand"><div className="brand-mark"><Network size={23}/></div><strong>ProjectsTimeline</strong></div><p className="nav-label">WORKSPACE</p><button className={!opened ? 'active' : ''} onClick={() => setOpened(false)}><Home size={18}/><span>Home</span></button><button className={opened ? 'active' : ''} onClick={() => { setOpened(true); setView('Overview'); }}><Box size={18}/><span>Vivarium</span><span className="nav-dot"/></button><div className="nav-caption"><FileText size={15}/><p>PTB v0.2<br/><span>Source-backed project</span></p></div><div className="nav-bottom"><p>ISOLATED PROTOTYPE</p><small>Workflows, Releases and the working app remain unchanged.</small><Button icon={Activity} onClick={() => { setCommitted(new Set()); setWork({}); setFocus(null); setEvents([]); setCheckpoint(null); setSelected(null); setDraft({ accomplishment: '', next: '', problem: '', questions: '' }); }}>Reset simulation</Button></div></aside>
      <main className="app-main">{!opened ? <section className="home-screen"><p className="eyebrow">YOUR ENGINEERING WORKSPACE</p><h1>Understand the software.<br/><span>Keep the context.</span></h1><p>Open a real blueprint-based design case. No project has been created in ProjectsTimeline.</p><button className="home-project" onClick={() => { setOpened(true); setView('Overview'); }}><div className="project-symbol"><Network size={32}/></div><div><small>VIVARIUM · GENERATION CORE</small><h2>{project.title}</h2><p>Deterministic DNA → anatomy, coat and shareable output.</p><span>7 features · 9 components · 1 draft development scope</span></div><ArrowRight size={22}/></button>{checkpoint && <div className="resume-strip"><BookOpen size={19}/><div><strong>Saved next step</strong><p>{checkpoint.next}</p></div><Button tone="primary" onClick={continueSaved}>Continue saved context</Button></div>}<p className="home-footnote">No checkpoint? No empty Resume panel. Explore the project, then leave your own context.</p></section> : <>
        <header className="workspace-header"><div className="project-heading"><div className="breadcrumb">Projects <ChevronRight size={12}/> Vivarium</div><h1>{project.title}</h1></div><div className="header-actions"><Chip>Development · Not assessed</Chip><Button icon={BookOpen} onClick={() => setModal('checkpoint')}>Save checkpoint</Button></div></header>
        <nav className="view-nav" aria-label="Workspace views">{[['Overview',Compass],['Map',Network],['Development',GitBranch],['History',Activity]].map(([name,Icon]) => <button key={name} ref={name === 'Map' ? mapTab : undefined} aria-current={view === name ? 'page' : undefined} onClick={() => setView(name)}><Icon size={16}/>{name}</button>)}<div className="project-find"><Search size={16}/><input aria-label="Find project context" placeholder="Find a concept or action…" value={query} onChange={e => setQuery(e.target.value)}/></div></nav>
        {query && <div className="search-results" role="region" aria-label="Search results"><p>{searchResults.length} matches (up to 15) <Button aria-label="Close search" icon={X} onClick={() => setQuery('')}/></p>{searchResults.map(item => <button key={item.id} onClick={() => { setView('Map'); setSelected(item.id); setQuery(''); requestAnimationFrame(() => inspectorHeading.current?.focus()); }}><span>{item.title}</span><small>{item.kind}</small></button>)}{!searchResults.length && <p>No matches. Try another word or clear the search.</p>}</div>}
        {(checkpoint || focus) && <div className="resume-strip"><BookOpen size={16}/><div><strong>{checkpoint ? 'Saved next step' : 'Chosen focus · simulated'}</strong><p>{checkpoint ? checkpoint.next : byId.get(focus).title}</p></div>{checkpoint && <><Button onClick={() => setModal('saved')}>Read checkpoint</Button><Button onClick={continueSaved}>Continue saved context<ArrowRight size={14}/></Button></>}</div>}
        <div className={`workspace-content ${r ? 'has-selection' : ''}`}>
          {r && view !== 'Overview' && <Button className="compact-back" icon={ArrowLeft} onClick={() => { setSelected(null); mapTab.current?.focus(); }}>Back to {view.toLowerCase()}</Button>}
          {view === 'Overview' ? Overview() : view === 'Map' ? MapView() : view === 'Development' ? Development() : History()}
        </div>
        {view === 'Map' && <footer className="workspace-footer"><Button icon={Layers} onClick={() => setListOpen(v => !v)}>{listOpen ? 'Hide' : 'Show'} accessible outline</Button><span>Layout is a visual arrangement, not dependency or priority.</span></footer>}
        {listOpen && view === 'Map' && <section className="accessible-outline" aria-label="Engineering outline"><h2>Same records, list navigation</h2><p>All definitions remain reachable without dragging or zooming.</p>{records.filter(item => ['component','feature','requirement'].includes(item.kind)).map(item => <button key={item.id} onClick={() => inspect(item.id)}>{item.title}<small>{item.kind}</small></button>)}</section>}
      </>}</main></div>
    <Dialog.Root open={!!source} onOpenChange={open => { if (!open) setSource(null); }}><Dialog.Portal><Dialog.Backdrop className="dialog-backdrop"/><Dialog.Popup className="source-dialog" finalFocus={() => sourceOpener.current?.isConnected ? sourceOpener.current : mapTab.current}>
      <div className="dialog-header"><div><p className="eyebrow">CAPTURED SOURCE · INERT TEXT</p><Dialog.Title>{source?.title}</Dialog.Title></div><Dialog.Close className="button" aria-label="Close source"><X size={18}/></Dialog.Close></div><Dialog.Description>{sourceDoc?.relativePath} · line {source?.source.span.start.line} · exact captured section. Source assertions are not verification evidence.</Dialog.Description><pre tabIndex={0} aria-label="Exact source section">{sourceText}</pre><details><summary>Capture identity</summary><code>{sourceDoc?.sha256}</code><p>No live file read, HTML execution or database change occurs.</p></details>
    </Dialog.Popup></Dialog.Portal></Dialog.Root>
    <Dialog.Root open={!!modal} onOpenChange={open => { if (!open) setModal(null); }}><Dialog.Portal><Dialog.Backdrop className="dialog-backdrop"/><Dialog.Popup className="action-dialog">
      <div className="dialog-header"><Dialog.Title>{modal === 'review' ? 'Review plan effects' : modal === 'saved' ? 'Saved engineering context' : 'Leave useful context'}</Dialog.Title><Dialog.Close className="button" aria-label="Close dialog"><X size={18}/></Dialog.Close></div><Dialog.Description>{modal === 'review' ? 'Simulation only. Commit actions and activate the authored scope explicitly.' : modal === 'saved' ? 'Your exact authored checkpoint in this simulation. It is separate from source definitions and your current browsing selection.' : 'Save your own accomplishment and intention, linked to the current selection. Reload resets this study.'}</Dialog.Description>
      {modal === 'review' ? <div><ul className="effect-list"><li>Activate Step 1 – Generation Core with its four authored stages.</li><li>Commit 10 actions: 9 scoped, 1 unscoped. No completion imported.</li><li>Requirements remain Draft; decisions Proposed; checks Planned.</li><li>No release, verification outcome or permanent project is created.</li></ul><label className="ack"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)}/>I understand the linked requirements remain Draft. Apply these simulation effects.</label><Button tone="primary" disabled={!ack} onClick={() => { const before = committed.size; setCommitted(new Set(actions.map(a => a.id))); if (before !== actions.length) record('Explicitly committed the plan and activated its inline stages (simulation)', scope.id); setModal(null); }}>Apply simulation choices</Button></div> : modal === 'saved' && checkpoint ? <section className="saved-checkpoint"><p className="linked-target">Linked context: {byId.get(checkpoint.target).title}</p>{[['accomplishment','Accomplishment'],['next','Saved next step'],['problem','Problem'],['questions','Unresolved questions']].filter(([key]) => checkpoint[key]).map(([key,label]) => <div key={key}><h3>{label}</h3><p>{checkpoint[key]}</p></div>)}<Button tone="primary" onClick={() => { setModal(null); continueSaved(); }}>Continue saved target</Button></section> : <form onSubmit={e => { e.preventDefault(); setCheckpoint({ ...draft, target: selected || project.id, view, lens, anchor }); record('Saved authored checkpoint (simulation)', selected || project.id); setDraft({ accomplishment: '', next: '', problem: '', questions: '' }); setModal(null); }}><p className="linked-target">Linked context: {r?.title || project.title}</p>{[['accomplishment','What actually happened'],['next','Next step / saved intention'],['problem','Problem being solved (optional)'],['questions','Unresolved questions (optional)']].map(([key,label]) => <label key={key}>{label}<textarea required={key === 'accomplishment' || key === 'next'} value={draft[key]} onChange={e => setDraft(v => ({ ...v, [key]: e.target.value }))}/></label>)}<Button tone="primary" type="submit">Save simulated checkpoint</Button></form>}
    </Dialog.Popup></Dialog.Portal></Dialog.Root>
  </div>;
}
createRoot(document.getElementById('root')).render(<ReactFlowProvider><App/></ReactFlowProvider>);
