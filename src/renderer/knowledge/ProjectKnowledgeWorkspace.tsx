import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactFlow, Background, Controls, Handle, MiniMap, Position, applyNodeChanges, useEdgesState, useNodesState, type Edge, type Node, type NodeProps, type NodeChange, type Viewport, type ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ELK from 'elkjs/lib/elk.bundled.js';
import type { KnowledgeKind, KnowledgeLink, KnowledgeNode, KnowledgeRecord, KnowledgeSource, KnowledgeSourceTarget, KnowledgeWorkspace } from '../../shared/knowledge';
import { projectKnowledgeMap } from '../../shared/knowledge-map';
import './knowledge.css';

const elk = new ELK();
const kindName: Record<KnowledgeKind, string> = { project: 'Project', component: 'Component', feature: 'Feature', requirement: 'Requirement', scope: 'Scope', action: 'Proposed action', decision: 'Decision', check: 'Planned check' };
const relationName: Record<KnowledgeLink['relation'], string> = {
  'parent-component': 'parent component', 'primary-component': 'primary component', 'applies-to-feature': 'applies to feature', 'concerns-feature': 'concerns feature', 'concerns-scope': 'concerns scope', 'addresses-requirement': 'addresses requirement', 'affects-feature': 'affects feature', 'affects-requirement': 'affects requirement', 'plans-to-verify': 'plans to verify',
};
const statusByKind: Partial<Record<KnowledgeKind, string>> = { requirement: 'Draft · acceptance not assessed', scope: 'Draft plan', action: 'Proposed · uncommitted', decision: 'Proposed · not accepted', check: 'Planned · not run' };

type CardData = { item: KnowledgeNode; selected: boolean; expandable: boolean; expanded: boolean; onSelect: (id: number, opener: HTMLElement) => void; onExpand: (id: number) => void };
function KnowledgeCard({ data }: NodeProps<Node<CardData>>) {
  return <div className={`kw-node kw-node-${data.item.kind}${data.selected ? ' is-selected' : ''}`}>
    <Handle type="target" position={Position.Left} />
    <div className="kw-drag-handle" aria-hidden="true" title="Drag to move this node">⠿</div>
    <button type="button" className="kw-node-button" onClick={(event) => data.onSelect(data.item.entityId, event.currentTarget)} aria-label={`${kindName[data.item.kind]}: ${data.item.title}`} aria-pressed={data.selected}>
      <span className="kw-node-kind">{kindName[data.item.kind]}</span><strong>{data.item.title}</strong>
      {statusByKind[data.item.kind] && <span className="kw-node-status">{statusByKind[data.item.kind]}</span>}
    </button>
    {data.expandable && <button type="button" className="kw-node-expand" onClick={() => data.onExpand(data.item.entityId)} aria-label={`${data.expanded ? 'Collapse' : 'Expand'} ${data.item.title}`}>{data.expanded ? '−' : '+'}</button>}
    <Handle type="source" position={Position.Right} />
  </div>;
}
const nodeTypes = { knowledge: KnowledgeCard };

function layout(projected: ReturnType<typeof projectKnowledgeMap>, current: Node<CardData>[]): Promise<Node<CardData>[]> {
  const sizes = new Map(current.map((node) => [node.id, node]));
  const initialAtlas = projected.nodes.every((node) => node.kind === 'component' || (node.kind === 'feature' && projected.links.some(l => l.relation === 'primary-component' && l.fromEntityId === node.entityId))) && projected.links.every((link) => link.relation === 'primary-component');
  if (initialAtlas) {
    const components = projected.nodes.filter((node) => node.kind === 'component').sort((a, b) => a.presentationOrder - b.presentationOrder);
    const positions = new Map<number, { x: number; y: number }>();
    let y = 0;
    for (let row = 0; row < components.length; row += 2) {
      let rowHeight = 110;
      components.slice(row, row + 2).forEach((component, column) => {
      const x = column * 610;
      const features = projected.links.filter((link) => link.relation === 'primary-component' && link.toEntityId === component.entityId)
        .map((link) => projected.nodes.find((node) => node.entityId === link.fromEntityId))
        .filter((node): node is KnowledgeNode => node !== undefined)
        .sort((a, b) => a.presentationOrder - b.presentationOrder);
      positions.set(component.entityId, { x: x + 360, y: y + Math.max(0, features.length - 1) * 63 });
      features.forEach((feature, featureIndex) => positions.set(feature.entityId, { x, y: y + featureIndex * 126 }));
      rowHeight = Math.max(rowHeight, 110 + Math.max(0, features.length - 1) * 126);
      });
      y += rowHeight + 24;
    }
    return Promise.resolve(projected.nodes.map((item) => ({ id: String(item.entityId), type: 'knowledge', position: positions.get(item.entityId) ?? { x: 0, y: 0 }, data: sizes.get(String(item.entityId))?.data ?? { item, selected: false, expandable: false, expanded: false, onSelect: () => undefined, onExpand: () => undefined } })));
  }
  return elk.layout({
    id: 'atlas', layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'RIGHT', 'elk.spacing.nodeNode': '34', 'elk.layered.spacing.nodeNodeBetweenLayers': '96', 'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX' },
    children: projected.nodes.map((node) => ({ id: String(node.entityId), width: sizes.get(String(node.entityId))?.measured?.width ?? 220, height: sizes.get(String(node.entityId))?.measured?.height ?? 110 })),
    edges: projected.links.map((link) => ({ id: String(link.relationshipId), sources: [String(link.fromEntityId)], targets: [String(link.toEntityId)] })),
  }).then((result) => projected.nodes.map((node) => {
    const placed = result.children?.find((child) => child.id === String(node.entityId));
    const old = sizes.get(String(node.entityId));
    return { id: String(node.entityId), type: 'knowledge', position: { x: placed?.x ?? 0, y: placed?.y ?? 0 }, data: old?.data ?? { item: node, selected: false, expandable: false, expanded: false, onSelect: () => undefined, onExpand: () => undefined } };
  }));
}

function applyLayoutPositions(current: Node<CardData>[], laidOut: Node<CardData>[]): Node<CardData>[] {
  const positions = new Map(laidOut.map((node) => [node.id, node.position]));
  return current.map((node) => ({ ...node, position: positions.get(node.id) ?? node.position }));
}

function seedPosition(item: KnowledgeNode, links: readonly KnowledgeLink[], positioned: ReadonlyMap<string, Node<CardData>>): { x: number; y: number } {
  for (const link of links) {
    const neighborId = link.fromEntityId === item.entityId ? link.toEntityId : link.toEntityId === item.entityId ? link.fromEntityId : null;
    const neighbor = neighborId === null ? undefined : positioned.get(String(neighborId));
    if (!neighbor) continue;
    const isChild = item.kind === 'component' && link.relation === 'parent-component' && link.fromEntityId === item.entityId;
    return { x: neighbor.position.x + (isChild ? -330 : 330), y: neighbor.position.y + (item.presentationOrder % 4) * 46 };
  }
  return { x: 330, y: (item.presentationOrder % 8) * 150 };
}

function SourceDialog({ source, close, dialogRef }: { source: KnowledgeSource | null; close: () => void; dialogRef: React.RefObject<HTMLDialogElement | null> }) {
  const active = source?.selection;
  const markRef = useRef<HTMLElement | null>(null);
  useEffect(() => { if (source && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal(); }, [source, dialogRef]);
  useEffect(() => { if (source && source.selection) requestAnimationFrame(() => markRef.current?.scrollIntoView({ block: 'center' })); }, [source]);
  const text = source?.document.text ?? '';
  const span = active && source && active.documentId === source.document.id ? active.span : null;
  const start = span && span.start.utf16Offset >= 0 && span.end.utf16Offset >= span.start.utf16Offset && span.end.utf16Offset <= text.length ? span.start.utf16Offset : -1;
  const end = start >= 0 && span ? span.end.utf16Offset : -1;
  return <dialog ref={dialogRef} className="kw-source-dialog" aria-labelledby="kw-source-title" onCancel={(event) => { event.preventDefault(); close(); }}>
    {source && <><header className="kw-source-head"><div><p className="kw-kicker">Stored source · captured copy, not live file</p><h2 id="kw-source-title">{source.document.relativePath}</h2></div><button type="button" className="kw-button" onClick={close}>Close</button></header>
      <p className="kw-source-meta">SHA-256 <code>{source.document.sha256}</code><span>{source.document.byteLength} UTF-8 bytes</span></p>
      {active?.headingPath.length ? <p className="kw-source-meta">Heading: {active.headingPath.join(' › ')}</p> : null}
      {span && <p className="kw-source-meta">Selected source range · line {span.start.line}, column {span.start.column} to line {span.end.line}, column {span.end.column}</p>}
      <pre className="kw-source-text" tabIndex={0} aria-label={`Exact captured source text from ${source.document.relativePath}`}>{start >= 0 && end > start && span ? <>{text.slice(0, start)}<mark ref={markRef}>{text.slice(start, end)}</mark>{text.slice(end)}</> : text}</pre>
    </>}
  </dialog>;
}

export function ProjectKnowledgeWorkspace({ data, onProjectTools }: { data: KnowledgeWorkspace; onProjectTools?: () => void }) {
  const [tab, setTab] = useState<'map' | 'overview'>('map');
  const [isNarrow, setIsNarrow] = useState(() => window.matchMedia('(max-width: 930px)').matches);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [showAllDefinitions, setShowAllDefinitions] = useState(false);
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(() => new Set());
  const [anchor, setAnchor] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [compactDetail, setCompactDetail] = useState(false);
  const [record, setRecord] = useState<KnowledgeRecord | null>(null);
  const [recordError, setRecordError] = useState('');
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordAttempt, setRecordAttempt] = useState(0);
  const [source, setSource] = useState<KnowledgeSource | null>(null);
  const [sourceError, setSourceError] = useState('');
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceTarget, setSourceTarget] = useState<KnowledgeSourceTarget | null>(null);
  const [revealId, setRevealId] = useState<number | null>(null);
  const [layoutError, setLayoutError] = useState('');
  const savedContext = useRef<{ expanded: ReadonlySet<number>; revealId: number | null; selectedId: number | null; geometry: Map<string, {x:number;y:number}> } | null>(null);
  const viewport = useRef<Viewport | null>(null);
  const flow = useRef<ReactFlowInstance<Node<CardData>, Edge> | null>(null);
  const geometry = useRef(new Map<string, { x: number; y: number }>());
  const anchorViewport = useRef<Viewport | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inspectorTitleRef = useRef<HTMLHeadingElement>(null);
  const dialogOpener = useRef<HTMLElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const request = useRef(0);
  const sourceRequest = useRef(0);
  const layoutGeneration = useRef(0);
  const topologyKey = useRef('');
  const projection = useMemo(() => projectKnowledgeMap(data, expanded, revealId, anchor), [data, expanded, revealId, anchor]);
  const visibleIds = useMemo(() => new Set(projection.nodes.map((node) => node.entityId)), [projection]);
  const [nodes, setNodes] = useNodesState<Node<CardData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const selected = data.nodes.find((node) => node.entityId === selectedId) ?? null;

  useEffect(() => { const media = window.matchMedia('(max-width: 930px)'); const update = () => setIsNarrow(media.matches); update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => { if (isNarrow && compactDetail) inspectorTitleRef.current?.focus(); }, [isNarrow, compactDetail, selectedId]);

  const choose = useCallback((id: number, focus: HTMLElement | null = null) => {
    setSelectedId(id); if (isNarrow) { setCompactDetail(true); setOutlineOpen(false); } if (focus) returnFocus.current = focus;
  }, [isNarrow]);
  const toggleExpand = useCallback((id: number) => setExpanded((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }), []);

  useEffect(() => {
    if (selectedId === null) { setRecord(null); setRecordError(''); setRecordLoading(false); return; }
    const token = ++request.current; setRecord(null); setRecordError(''); setRecordLoading(true);
    void window.workspace.getKnowledgeRecord({ projectId: data.project.id, entityId: selectedId }).then((result) => {
      if (token !== request.current) return;
      if (result.ok) setRecord(result.value); else setRecordError(result.error.message);
    }).catch((error: unknown) => { if (token === request.current) setRecordError(error instanceof Error ? error.message : 'Could not load this record.'); })
      .finally(() => { if (token === request.current) setRecordLoading(false); });
    return () => { request.current += 1; };
  }, [data.project.id, selectedId, recordAttempt]);

  const nodeChange = useCallback((changes: NodeChange<Node<CardData>>[]) => { if (changes.some((change) => change.type === 'position')) layoutGeneration.current += 1; setNodes((current) => {
    const next = applyNodeChanges(changes, current);
    next.forEach(n => geometry.current.set(n.id, n.position));
    return next;
  }); }, [setNodes]);
  const placeNodes = useCallback((laidOut: Node<CardData>[]) => setNodes(current => {
    const next = applyLayoutPositions(current, laidOut);
    next.forEach(n => geometry.current.set(n.id, n.position));
    return next;
  }), [setNodes]);
  useEffect(() => {
    const nextTopology = `${projection.nodes.map((node) => node.entityId).join(',')}/${projection.links.map((link) => link.relationshipId).join(',')}`;
    if (topologyKey.current !== nextTopology) { topologyKey.current = nextTopology; layoutGeneration.current += 1; }
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const positioned = new Map(byId);
    const nextNodes: Node<CardData>[] = projection.nodes.map((item) => {
      const id = String(item.entityId);
      let position = byId.get(id)?.position ?? geometry.current.get(id);
      if (!position) {
        position = seedPosition(item, projection.links, positioned);
        while ([...positioned.values()].some(n => Math.abs(n.position.x - position!.x) < 250 && Math.abs(n.position.y - position!.y) < 130)) position = { x: position.x, y: position.y + 140 };
      }
      const next: Node<CardData> = {
      id, type: 'knowledge', position,
      data: { item, selected: selectedId === item.entityId, expandable: item.kind === 'component' || item.kind === 'feature' || item.kind === 'requirement', expanded: expanded.has(item.entityId), onSelect: (id, opener) => choose(id, opener), onExpand: toggleExpand },
      draggable: true, dragHandle: '.kw-drag-handle', selectable: false, connectable: false,
      };
      positioned.set(id, next);
      return next;
    });
    setNodes(nextNodes);
    setEdges(projection.links.map((link) => ({ id: String(link.relationshipId), source: String(link.fromEntityId), target: String(link.toEntityId), label: relationName[link.relation], labelStyle: { fill: '#b9b4d4', fontSize: 14 }, labelBgStyle: { fill: '#171923' }, markerEnd: { type: 'arrowclosed', color: '#8175b8' }, style: { stroke: '#70668f', strokeWidth: 1.5 }, animated: false } as Edge)));
  // Position state is retained; this effect only synchronizes topology and selection styling.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projection, selectedId, expanded, choose, toggleExpand]);

  const arrange = useCallback(async () => {
    setLayoutError('');
    const generation = ++layoutGeneration.current;
    try { const laidOut = await layout(projection, nodes); if (generation === layoutGeneration.current) placeNodes(laidOut); }
    catch { if (generation === layoutGeneration.current) setLayoutError('Arrange could not calculate a layout. Existing positions were kept.'); }
  }, [projection, nodes, placeNodes]);
  const didLayout = useRef('');
  useEffect(() => {
    const key = `${data.project.id}:${data.receipt.importId}:${projection.nodes.map((node) => node.entityId).join(',')}:${projection.links.map((link) => link.relationshipId).join(',')}`;
    if (key === didLayout.current) return;
    if (didLayout.current) return;
    didLayout.current = key;
    const generation = ++layoutGeneration.current;
    void layout(projection, nodes).then((laidOut) => { if (generation === layoutGeneration.current) placeNodes(laidOut); }).catch(() => { if (generation === layoutGeneration.current) setLayoutError('Map layout is unavailable. Use the outline or retry Arrange.'); });
  // topology-only automatic layout; ordinary selection never changes this key.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.project.id, data.receipt.importId, projection]);

  useEffect(() => {
    if (anchor === null) return;
    const generation = ++layoutGeneration.current;
    void layout(projection, nodes).then(laidOut => {
      if (generation !== layoutGeneration.current) return;
      placeNodes(laidOut);
      requestAnimationFrame(() => { if (generation === layoutGeneration.current) void flow.current?.fitView({ padding: .2 }); });
    }).catch(() => { if (generation === layoutGeneration.current) setLayoutError('Connections are available in the outline. Arrange can retry the layout.'); });
  // Entering a neighborhood is deliberate; ordinary selection never runs a layout.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  const openSource = async (target: KnowledgeSourceTarget, opener: HTMLElement) => {
    const token = ++sourceRequest.current;
    dialogOpener.current = opener; setSourceTarget(target); setSourceError(''); setSource(null); setSourceLoading(true);
    try { const result = await window.workspace.getKnowledgeSource({ projectId: data.project.id, target }); if (token !== sourceRequest.current) return; if (result.ok) setSource(result.value); else setSourceError(result.error.message); }
    catch (error) { if (token === sourceRequest.current) setSourceError(error instanceof Error ? error.message : 'Could not load the stored source.'); }
    finally { if (token === sourceRequest.current) setSourceLoading(false); }
  };
  const closeSource = () => { sourceRequest.current += 1; dialogRef.current?.close(); setSource(null); setSourceTarget(null); setSourceLoading(false); requestAnimationFrame(() => { const opener = dialogOpener.current; const fallback = returnFocus.current; (opener?.isConnected && opener.getClientRects().length ? opener : fallback?.isConnected && fallback.getClientRects().length ? fallback : document.getElementById('knowledge-map-heading'))?.focus(); }); };
  const closeInspector = () => {
    setSelectedId(null); setCompactDetail(false); sourceRequest.current++; setSource(null); setSourceLoading(false); setSourceError('');
    requestAnimationFrame(() => (returnFocus.current?.isConnected && returnFocus.current.getClientRects().length ? returnFocus.current : document.getElementById('knowledge-map-heading'))?.focus());
  };
  const exploreConnections = () => {
    if (selectedId === null) return;
    if (anchor === null) {
      savedContext.current = { expanded: new Set(expanded), revealId, selectedId, geometry: new Map(geometry.current) };
      anchorViewport.current = viewport.current;
    }
    setAnchor(selectedId); setExpanded(new Set([selectedId])); setRevealId(null); setCompactDetail(false);
  };
  const returnToMap = () => {
    layoutGeneration.current++;
    setAnchor(null);
    if (savedContext.current) {
      const saved = savedContext.current;
      geometry.current = new Map(saved.geometry);
      setNodes(current => current.map(n => ({ ...n, position: geometry.current.get(n.id) ?? n.position })));
      setExpanded(saved.expanded); setRevealId(saved.revealId); setSelectedId(saved.selectedId); savedContext.current = null;
    }
    if (anchorViewport.current) void flow.current?.setViewport(anchorViewport.current);
  };

  const filtered = useMemo(() => {
    const text = query.trim().toLocaleLowerCase();
    return data.nodes.filter((item) => !text || `${item.title} ${kindName[item.kind]} ${item.externalId}`.toLocaleLowerCase().includes(text));
  }, [data.nodes, query]);
  const diagnostics = data.review.diagnostics;
  const selectAndFocus = (node: KnowledgeNode, element: HTMLElement) => { if (!visibleIds.has(node.entityId)) setRevealId(node.entityId); choose(node.entityId, element); };
  const directoryItems = filtered.filter((item) => query.trim() || showAllDefinitions || item.kind === 'component' || item.kind === 'feature');
  const displayRecord = record?.entityId === selectedId ? record : null;
  const sourceButton = (label: string, target: KnowledgeSourceTarget) => <button type="button" className="kw-text-button" onClick={(event) => void openSource(target, event.currentTarget)}>{label}</button>;

  return <section className="kw-workspace" aria-label="Project knowledge workspace">
    <header className="kw-topbar"><div><p className="kw-kicker">Knowledge project · stored definitions</p><h1>{data.project.name}</h1><p className="kw-subtitle">{data.goal || 'No goal statement was captured.'}</p></div><div className="kw-header-meta"><span>Not assessed</span><span>{data.nodes.length} definitions</span>{onProjectTools && <button className="kw-button" onClick={onProjectTools}>Project tools</button>}</div></header>
    <div className="kw-tabs" role="tablist" aria-label="Project knowledge views"><button role="tab" aria-selected={tab === 'map'} onClick={() => { setTab('map'); setCompactDetail(false); }}>Map</button><button role="tab" aria-selected={tab === 'overview'} onClick={() => setTab('overview')}>Overview</button></div>
    {tab === 'overview' ? <section className="kw-overview" aria-label="Project overview"><div className="kw-overview-lead"><p className="kw-kicker">Project overview</p><h2>Project intent</h2><p>{data.goal || 'No goal statement was captured.'}</p><p>This workspace preserves the source definitions. Development readiness has not been assessed.</p><p className="kw-muted">Existing project journals remain separate from these knowledge definitions.</p></div><div className="kw-count-grid">{Object.entries(data.counts).map(([kind, count]) => <div key={kind}><span>{kindName[kind as KnowledgeKind]}</span><strong>{count}</strong></div>)}</div><div className="kw-overview-section"><h3>Captured files</h3>{data.documents.map((doc) => <div className="kw-file" key={`${doc.importId}/${doc.documentKey}`}><button className="kw-related-link" onClick={(event) => void openSource({ kind: 'document', importId: doc.importId, documentKey: doc.documentKey }, event.currentTarget)}>{doc.relativePath}</button><code>{doc.sha256.slice(0, 16)}…</code><span>{doc.byteLength} bytes</span></div>)}</div><p className="kw-muted">Formed {new Date(data.receipt.appliedAt).toLocaleString()} · source copy is stored, not live</p><button className="kw-button kw-primary" onClick={() => { setTab('map'); setCompactDetail(false); }}>Open knowledge map</button></section> : <div className={`kw-layout${selected ? ' has-inspector' : ''}${anchor !== null ? ' is-neighborhood' : ''}${compactDetail ? ' is-detail' : ''}${outlineOpen ? ' is-outline-open' : ''}`}>
      <aside className="kw-directory" aria-label="Knowledge outline"><label className="kw-search-label" htmlFor="kw-search">Search all definitions</label><input id="kw-search" className="kw-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, type, or source ID" /><button className="kw-text-button kw-directory-toggle" onClick={() => setShowAllDefinitions((shown) => !shown)} aria-pressed={showAllDefinitions}>{showAllDefinitions ? 'Show components & features' : `All definitions · ${data.nodes.length}`}</button>
        <div className="kw-directory-summary">{directoryItems.length} shown <span>·</span> {data.nodes.length} total</div><ul className="kw-outline">{directoryItems.map((item) => <li key={item.entityId}><button type="button" className={`kw-outline-row${item.entityId === selectedId ? ' is-active' : ''}`} aria-current={item.entityId === selectedId ? 'true' : undefined} onClick={(event) => selectAndFocus(item, event.currentTarget)}><span className={`kw-kind-mark kw-mark-${item.kind}`} aria-hidden="true" /><span><small>{kindName[item.kind]}</small><strong>{item.title}</strong></span><span className="kw-outline-count" title="Recorded native relationships">{data.links.filter((link) => link.fromEntityId === item.entityId || link.toEntityId === item.entityId).length}</span></button></li>)}</ul>
        <p className="kw-directory-foot">Counts show recorded native relationships. Missing links do not imply an engineering defect.</p>
      </aside>
      <section id="knowledge-map-heading" className="kw-map-region" aria-label="Connected knowledge map" tabIndex={-1}><div className="kw-map-toolbar"><div><p className="kw-kicker">Source-linked structure</p><p className="kw-map-hint">Select a node to inspect. Expand to reveal related definitions.</p></div><div className="kw-map-actions"><button className="kw-button kw-outline-toggle" onClick={() => setOutlineOpen((open) => !open)} aria-expanded={outlineOpen}>Browse definitions</button><button className="kw-button" disabled={!projection.nodes.length} onClick={() => void arrange()}>Arrange</button><button className="kw-button" disabled={!projection.nodes.length} onClick={() => void flow.current?.fitView({ padding: .2 })}>Fit map</button></div></div>
        {anchor !== null && <div className="kw-anchor-banner"><span>Connections around <strong>{data.nodes.find((node) => node.entityId === anchor)?.title}</strong></span><button className="kw-text-button" onClick={returnToMap}>Back to prior map</button></div>}
        <div className="kw-flow"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={nodeChange} onEdgesChange={onEdgesChange} onMoveEnd={(_, current) => { viewport.current = current; }} onInit={instance => { flow.current = instance; viewport.current = instance.getViewport(); }} nodesConnectable={false} deleteKeyCode={null} edgesReconnectable={false} elementsSelectable={false} defaultViewport={viewport.current ?? { x: 12, y: 12, zoom: 0.82 }} minZoom={0.8} maxZoom={1.8} proOptions={{ hideAttribution: true }}><Background color="#323244" gap={24} size={1} />{!!projection.nodes.length && <><Controls showFitView={false} showInteractive={false} /><MiniMap style={{ width: 125, height: 84 }} maskColor="rgba(12,14,23,.65)" pannable zoomable nodeColor={(node) => `var(--kw-${(node.data as CardData).item.kind})`} /></>}</ReactFlow>{!projection.nodes.length && <div className="kw-empty-map"><h2>No components or features declared</h2><p>This capture has {data.nodes.length} saved definitions. Use the outline to inspect them; no architecture relationships are invented.</p><button className="kw-button" onClick={() => { setShowAllDefinitions(true); setOutlineOpen(true); }}>Browse saved definitions</button></div>}</div>
        {projection.hiddenCount > 0 && <p className="kw-hidden-note">{projection.hiddenCount} more definitions remain in the outline. Expand a component or feature to bring related records into the map.</p>}
        <p className="kw-legend"><span><i className="kw-legend-line" /> {projection.links.length} of {data.links.length} native relationships</span><span>Arrows preserve authored direction</span></p>{layoutError && <div className="kw-error" role="alert">{layoutError} <button className="kw-text-button" onClick={() => void arrange()}>Retry Arrange</button></div>}
      </section>
      {selected && <aside className="kw-inspector" aria-label="Selected record details">
        <div className="kw-inspector-head"><div><p className="kw-kicker">{selected ? kindName[selected.kind] : 'Record'}</p><h2 ref={inspectorTitleRef} tabIndex={-1}>{selected?.title ?? 'Select a record'}</h2></div><button className="kw-button kw-close-inspector" aria-label="Close record details" onClick={closeInspector}>×</button><button className="kw-mobile-back" onClick={() => { setCompactDetail(false); if (returnFocus.current?.classList.contains('kw-outline-row')) setOutlineOpen(true); requestAnimationFrame(() => { const opener = returnFocus.current; (opener?.isConnected && opener.getClientRects().length ? opener : document.getElementById('knowledge-map-heading'))?.focus(); }); }}>← Map</button></div>
        {recordLoading && <p className="kw-muted" role="status">Loading record…</p>}{recordError && <div className="kw-error" role="alert">{recordError}<button className="kw-text-button" onClick={() => setRecordAttempt((n) => n + 1)}>Retry</button></div>}
        {displayRecord && <Inspector record={displayRecord} links={data.links} nodes={data.nodes} onExplore={exploreConnections} onNavigate={(id) => { const item = data.nodes.find((node) => node.entityId === id); if (item) { if (!visibleIds.has(id)) setRevealId(id); choose(id); } }} onSource={(target, el) => void openSource(target, el)} />}
        <div className="kw-inspector-footer"><p>Revision {selected.revision} · source {selected.externalId}</p><div>{sourceButton('Metadata source', { kind: 'record', entityId: selected.entityId, revision: selected.revision, part: 'metadata' })}{sourceButton('Narrative source', { kind: 'record', entityId: selected.entityId, revision: selected.revision, part: 'narrative' })}</div></div>
        {data.review.needsReviewScopeEntityIds.includes(selected.entityId) && <div className="kw-review-banner"><strong>Needs review</strong><span>Workflow reference requires review; no stages are assumed.</span></div>}
      </aside>}
    </div>}
    {diagnostics.length > 0 && <details className="kw-diagnostics"><summary>Source diagnostics <span>{diagnostics.length}</span></summary><ul>{diagnostics.map((item) => <li key={item.id}><span className={`kw-diagnostic-level kw-level-${item.severity}`}>{item.severity}</span><span>{item.message}</span>{(item.source || item.relatedSources.length > 0) && <button className="kw-text-button" onClick={(event) => { const target: KnowledgeSourceTarget = item.source ? { kind: 'diagnostic', importId: data.review.importId, diagnosticId: item.id } : { kind: 'diagnostic', importId: data.review.importId, diagnosticId: item.id, relatedIndex: 0 }; void openSource(target, event.currentTarget); }}>Open source</button>}</li>)}</ul></details>}
    {sourceError && !source && <div className="kw-toast" role="alert">{sourceError}{sourceTarget && <button className="kw-text-button" onClick={() => { const opener = dialogOpener.current; if (opener) void openSource(sourceTarget, opener); }}>Retry source</button>}</div>}{sourceLoading && <div className="kw-toast" role="status">Loading stored source…</div>}
    <SourceDialog source={source} close={closeSource} dialogRef={dialogRef} />
  </section>;
}

function Inspector({ record, links, nodes, onNavigate, onSource, onExplore }: { record: KnowledgeRecord; links: readonly KnowledgeLink[]; nodes: readonly KnowledgeNode[]; onNavigate: (id: number) => void; onSource: (target: KnowledgeSourceTarget, el: HTMLElement) => void; onExplore: () => void }) {
  const related = links.filter((link) => link.fromEntityId === record.entityId || link.toEntityId === record.entityId);
  const other = (link: KnowledgeLink) => nodes.find((node) => node.entityId === (link.fromEntityId === record.entityId ? link.toEntityId : link.fromEntityId));
  const field = (name: string, value: unknown) => <div className="kw-field"><dt>{name}</dt><dd>{Array.isArray(value) ? value.length ? <ul>{value.map((item, idx) => <li key={idx}>{String(item)}</li>)}</ul> : 'None recorded' : value === null || value === undefined || value === '' ? 'Not provided' : String(value)}</dd></div>;
  const state = statusByKind[record.kind];
  const narrativeTarget: KnowledgeSourceTarget = { kind: 'record', entityId: record.entityId, revision: record.revision, part: 'narrative' };
  return <div className="kw-inspector-body"><span className="kw-state-pill">{state ?? 'Captured definition'}</span><dl className="kw-fields">
    {record.kind === 'project' && <>{field('Goal', record.goal)}{field('Documents', record.documents)}{field('Capabilities', record.capabilities)}</>}
    {record.kind === 'requirement' && <>{field('Requirement type', record.requirementType)}{field('Acceptance criteria', record.acceptance)}</>}
    {record.kind === 'scope' && <>{field('Workflow status', record.workflowStatus)}{field('Workflow request', record.workflow ? ('stages' in record.workflow ? record.workflow.stages.map((stage) => `${stage.title} (${stage.key})`) : `${record.workflow.template_key} · v${record.workflow.version}`) : 'No workflow')}</>}
    {record.kind === 'action' && <>{field('Type', record.details.actionType)}{field('Instructions', record.details.instructions)}{field('Applicability', record.details.applicability)}{field('Definition of done', record.details.definitionOfDone)}{field('Evidence guidance', record.details.evidenceGuidance)}{field('Proposed stage', record.proposedStageKey)}{field('Covers rule IDs', record.coversRuleIds)}</>}
    {record.kind === 'decision' && <>{field('Rationale', record.rationale)}{field('Alternatives', record.alternatives)}</>}
    {record.kind === 'check' && <>{field('Method', record.method)}{field('Instructions', record.instructions)}{field('Expected results', record.expected)}</>}
    <div className="kw-field"><dt>Narrative</dt><dd>{record.narrativeMarkdown ? <><p className="kw-narrative">{record.narrativeMarkdown}</p><button className="kw-text-button" onClick={(event) => onSource(narrativeTarget, event.currentTarget)}>Open exact narrative source</button></> : 'No narrative captured'}</dd></div>
  </dl><section className="kw-related"><header className="kw-related-heading"><h3>Explicit relationships <span>{related.length}</span></h3><button className="kw-button" onClick={onExplore}>Explore connections</button></header>{related.length ? <ul>{related.map((link) => { const node = other(link); return <li key={link.relationshipId}><span className="kw-relation-label">{relationName[link.relation]}</span><span className="kw-direction">{link.fromEntityId === record.entityId ? '→' : '←'}</span>{node ? <button className="kw-related-link" onClick={() => onNavigate(node.entityId)}>{node.title}<small>{kindName[node.kind]}</small></button> : <span>Record {link.fromEntityId === record.entityId ? link.toEntityId : link.fromEntityId}</span>}<button title="Open relationship source" className="kw-source-icon" onClick={(event) => onSource({ kind: 'relationship', relationshipId: link.relationshipId }, event.currentTarget)}>Source</button></li>; })}</ul> : <p className="kw-muted">No explicit relationships recorded.</p>}</section>
  </div>;
}
