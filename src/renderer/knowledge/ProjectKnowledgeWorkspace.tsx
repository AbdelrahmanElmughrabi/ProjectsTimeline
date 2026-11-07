import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ReactFlow, Background, Handle, MiniMap, Position, MarkerType, applyNodeChanges, getNodesBounds, getViewportForBounds, useNodesState, useUpdateNodeInternals, type Edge, type Node, type NodeProps, type NodeChange, type Viewport, type ReactFlowInstance, type XYPosition } from '@xyflow/react';
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

const openingViewport = { x: 12, y: 12, zoom: .82 };
const minZoom = .0001;
const maxZoom = 1.8;
const tabs = ['map', 'overview', 'sources'] as const;
const tabTitle = { map: 'Map', overview: 'Overview', sources: 'Captured sources' };

type CardData = {
  item: KnowledgeNode; selected: boolean; expandable: boolean; expanded: boolean;
  incoming: string[]; outgoing: string[];
  onSelect: (id: number, opener: HTMLElement) => void; onExpand: (id: number) => void;
};
function KnowledgeCard({ id, data }: NodeProps<Node<CardData>>) {
  const updateHandles = useUpdateNodeInternals();
  const connections = `${data.incoming.join(',')}|${data.outgoing.join(',')}`;
  useLayoutEffect(() => updateHandles(id), [connections, id, updateHandles]);
  const handles = (ids: string[], type: 'source' | 'target', position: Position) => ids.map((id, index) =>
    <Handle key={id} id={id} type={type} position={position} style={{ top: `${((index + 1) / (ids.length + 1)) * 100}%` }} />);
  return <div className={`kw-node kw-node-${data.item.kind}${data.selected ? ' is-selected' : ''}`}>
    {handles(data.incoming, 'target', Position.Left)}
    <div className="kw-drag-handle" aria-hidden="true" title="Drag to move this node">⠿</div>
    <button type="button" className="kw-node-button" onClick={(event) => data.onSelect(data.item.entityId, event.currentTarget)} aria-label={`${kindName[data.item.kind]}: ${data.item.title}`} aria-pressed={data.selected}>
      <span className="kw-node-kind">{kindName[data.item.kind]}</span><strong>{data.item.title}</strong>
      {statusByKind[data.item.kind] && <span className="kw-node-status">{statusByKind[data.item.kind]}</span>}
    </button>
    {data.expandable && <button type="button" className="kw-node-expand" onClick={() => data.onExpand(data.item.entityId)} aria-expanded={data.expanded} aria-label={`${data.expanded ? 'Collapse' : 'Expand'} ${data.item.title}`}>{data.expanded ? '−' : '+'}</button>}
    {handles(data.outgoing, 'source', Position.Right)}
  </div>;
}
const nodeTypes = { knowledge: KnowledgeCard };

function layout(projected: ReturnType<typeof projectKnowledgeMap>, current: Node<CardData>[]): Promise<Map<string, XYPosition>> {
  const sizes = new Map(current.map((node) => [node.id, node]));
  const initialAtlas = projected.nodes.every((node) => node.kind === 'component' || (node.kind === 'feature' && projected.links.some(l => l.relation === 'primary-component' && l.fromEntityId === node.entityId))) && projected.links.every((link) => link.relation === 'primary-component');
  if (initialAtlas) {
    const components = projected.nodes.filter((node) => node.kind === 'component').sort((a, b) => a.presentationOrder - b.presentationOrder);
    const positions = new Map<string, XYPosition>();
    let y = 0;
    for (let row = 0; row < components.length; row += 2) {
      let rowHeight = 110;
      components.slice(row, row + 2).forEach((component, column) => {
        const x = column * 610;
        const features = projected.links.filter((link) => link.relation === 'primary-component' && link.toEntityId === component.entityId)
          .map((link) => projected.nodes.find((node) => node.entityId === link.fromEntityId))
          .filter((node): node is KnowledgeNode => node !== undefined)
          .sort((a, b) => a.presentationOrder - b.presentationOrder);
        let featureY = y;
        for (const feature of features) {
          positions.set(String(feature.entityId), { x, y: featureY });
          featureY += Math.max(84, sizes.get(String(feature.entityId))?.measured?.height ?? 110) + 16;
        }
        const height = sizes.get(String(component.entityId))?.measured?.height ?? 110;
        const offset = Math.max(0, (featureY - y - 16 - height) / 2);
        positions.set(String(component.entityId), { x: x + 360, y: y + offset });
        rowHeight = Math.max(rowHeight, featureY - y, height + offset);
      });
      y += rowHeight + 24;
    }
    return Promise.resolve(positions);
  }
  return elk.layout({
    id: 'atlas', layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'RIGHT', 'elk.spacing.nodeNode': '34', 'elk.layered.spacing.nodeNodeBetweenLayers': '96', 'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX' },
    children: projected.nodes.map((node) => ({ id: String(node.entityId), width: sizes.get(String(node.entityId))?.measured?.width ?? 220, height: sizes.get(String(node.entityId))?.measured?.height ?? 110 })),
    edges: projected.links.map((link) => ({ id: String(link.relationshipId), sources: [String(link.fromEntityId)], targets: [String(link.toEntityId)] })),
  }).then((result) => new Map(result.children?.map(({ id, x = 0, y = 0 }) => [id, { x, y }])));
}

function seedPosition(item: KnowledgeNode, links: readonly KnowledgeLink[], positioned: ReadonlyMap<string, XYPosition>, branch?: number): XYPosition {
  const parent = branch === undefined ? undefined : positioned.get(String(branch));
  if (parent) return { x: parent.x + 330, y: parent.y };
  for (const link of links) {
    const neighborId = link.fromEntityId === item.entityId ? link.toEntityId : link.toEntityId === item.entityId ? link.fromEntityId : null;
    const neighbor = neighborId === null ? undefined : positioned.get(String(neighborId));
    if (!neighbor) continue;
    const isChild = item.kind === 'component' && link.relation === 'parent-component' && link.fromEntityId === item.entityId;
    return { x: neighbor.x + (isChild ? -330 : 330), y: neighbor.y + (item.presentationOrder % 4) * 46 };
  }
  return { x: 330, y: (item.presentationOrder % 8) * 150 };
}

function focusVisible(...targets: (HTMLElement | null | undefined)[]) {
  targets.find(target => target?.isConnected && target.getClientRects().length)?.focus({ preventScroll: true });
}

type CameraIntent = { kind: 'fit' } | { kind: 'reveal'; ids: string[] } | { kind: 'restore'; viewport: Viewport };
type MapFrame = {
  anchor: number | null; expanded: ReadonlySet<number>; revealId: number | null; selectedId: number | null;
  geometry: Map<string, XYPosition>; viewport: Viewport; compactDetail: boolean; outlineOpen: boolean;
  scroll: number; opener: HTMLElement; selectionOpener: HTMLElement | null;
};

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

export function ProjectKnowledgeWorkspace({ data, active, hasResume, onProjectTools }: {
  data: KnowledgeWorkspace; active: boolean; hasResume: boolean;
  onProjectTools: (opener: HTMLElement, destination: 'tools' | 'journal' | 'resume') => void;
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('map');
  const [width, setWidth] = useState(() => window.innerWidth);
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
  const [edgeId, setEdgeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(openingViewport.zoom);
  const [cameraTask, setCameraTask] = useState<(CameraIntent & { generation: number }) | null>(null);
  const history = useRef<MapFrame[]>([]);
  const viewport = useRef<Viewport>(openingViewport);
  const flow = useRef<ReactFlowInstance<Node<CardData>, Edge> | null>(null);
  const geometry = useRef(new Map<string, XYPosition>());
  const canvas = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mapHeading = useRef<HTMLElement>(null);
  const neighborhoodBack = useRef<HTMLButtonElement>(null);
  const exploreButton = useRef<HTMLButtonElement>(null);
  const inspector = useRef<HTMLElement>(null);
  const inspectorTitle = useRef<HTMLHeadingElement>(null);
  const dialogOpener = useRef<HTMLElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const inspectorScroll = useRef<number | null>(null);
  const request = useRef(0);
  const sourceRequest = useRef(0);
  const layoutGeneration = useRef(0);
  const cameraGeneration = useRef(0);
  const layoutNeeded = useRef<'initial' | 'neighborhood' | null>('initial');
  const branch = useRef<number | undefined>(undefined);
  const projection = useMemo(() => projectKnowledgeMap(data, expanded, revealId, anchor), [data, expanded, revealId, anchor]);
  const visibleIds = useMemo(() => new Set(projection.nodes.map(node => node.entityId)), [projection]);
  const [nodes, setNodes] = useNodesState<Node<CardData>>([]);
  const { byId, adjacency } = useMemo(() => {
    const byId = new Map(data.nodes.map(node => [node.entityId, node]));
    const adjacency = new Map<number, KnowledgeLink[]>();
    for (const link of data.links) {
      for (const id of [link.fromEntityId, link.toEntityId]) {
        const links = adjacency.get(id) ?? [];
        links.push(link);
        adjacency.set(id, links);
      }
    }
    return { byId, adjacency };
  }, [data.nodes, data.links]);
  const selected = byId.get(selectedId ?? -1);
  const related = selected ? adjacency.get(selected.entityId) ?? [] : [];
  const displayRecord = record?.entityId === selectedId ? record : null;
  const isNarrow = width <= 930;
  const usesDrawer = isNarrow || anchor !== null || (selected && width <= 1300);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useLayoutEffect(() => {
    if (inspector.current) inspector.current.scrollTop = inspectorScroll.current ?? 0;
  }, [selectedId]);
  useLayoutEffect(() => {
    if (displayRecord && inspector.current && inspectorScroll.current !== null) {
      inspector.current.scrollTop = inspectorScroll.current;
      inspectorScroll.current = null;
    }
  }, [displayRecord, compactDetail]);

  const queueCamera = useCallback((intent: CameraIntent) => {
    setCameraTask({ ...intent, generation: ++cameraGeneration.current });
  }, []);
  const interruptMovement = useCallback(() => {
    cameraGeneration.current++;
    layoutGeneration.current++;
    layoutNeeded.current = null;
    setCameraTask(null);
  }, []);
  const choose = useCallback((id: number, opener?: HTMLElement) => {
    inspectorScroll.current = null;
    if (opener) returnFocus.current = opener;
    setSelectedId(id);
    setCompactDetail(true);
    if (isNarrow) setOutlineOpen(false);
    requestAnimationFrame(() => focusVisible(inspectorTitle.current));
  }, [isNarrow]);
  const toggleExpand = useCallback((id: number) => {
    interruptMovement();
    const next = new Set(expanded);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      branch.current = id;
      const added = (adjacency.get(id) ?? []).map(link => link.fromEntityId === id ? link.toEntityId : link.fromEntityId)
        .filter(neighbor => !visibleIds.has(neighbor));
      queueCamera({ kind: 'reveal', ids: [id, ...added].map(String) });
    }
    setExpanded(next);
  }, [adjacency, expanded, interruptMovement, queueCamera, visibleIds]);

  useEffect(() => {
    if (selectedId === null) { setRecord(null); setRecordError(''); setRecordLoading(false); return; }
    const token = ++request.current;
    setRecord(null); setRecordError(''); setRecordLoading(true);
    void window.workspace.getKnowledgeRecord({ projectId: data.project.id, entityId: selectedId }).then((result) => {
      if (token !== request.current) return;
      if (result.ok) setRecord(result.value); else setRecordError(result.error.message);
    }).catch((error: unknown) => { if (token === request.current) setRecordError(error instanceof Error ? error.message : 'Could not load this record.'); })
      .finally(() => { if (token === request.current) setRecordLoading(false); });
    return () => { request.current += 1; };
  }, [data.project.id, selectedId, recordAttempt]);

  const edges = useMemo<Edge[]>(() => projection.links.map(link => {
    const id = String(link.relationshipId);
    return {
      id, source: String(link.fromEntityId), target: String(link.toEntityId), sourceHandle: id, targetHandle: id,
      ariaLabel: `${byId.get(link.fromEntityId)?.title} · ${relationName[link.relation]} → ${byId.get(link.toEntityId)?.title}`,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#bfb1f2', width: 16, height: 16 },
      domAttributes: { onFocus: () => setEdgeId(id), onBlur: () => setEdgeId(current => current === id ? null : current) },
    };
  }), [byId, projection.links]);
  const activeEdge = edges.find(edge => edge.id === edgeId);

  const nodeChange = (changes: NodeChange<Node<CardData>>[]) => {
    const moves = changes.filter(change => change.type === 'position' && change.position);
    if (moves.length) interruptMovement();
    for (const move of moves) if (move.type === 'position' && move.position) geometry.current.set(move.id, move.position);
    setNodes(current => applyNodeChanges(changes, current));
  };
  useEffect(() => {
    const newBranch = branch.current;
    branch.current = undefined;
    setNodes(current => {
      const previous = new Map(current.map(node => [node.id, node]));
      const placed = new Map<string, XYPosition>();
      for (const item of projection.nodes) {
        const id = String(item.entityId);
        const old = previous.get(id);
        const position = geometry.current.get(id) ?? old?.position;
        if (position) placed.set(id, position);
      }
      return projection.nodes.map(item => {
        const id = String(item.entityId);
        const old = previous.get(id);
        let position = placed.get(id);
        if (!position) {
          position = seedPosition(item, projection.links, placed, newBranch);
          while ([...placed].some(([key, node]) => {
            const height = previous.get(key)?.measured?.height ?? 110;
            const dx = Math.abs(node.x - position!.x);
            const dy = position!.y - node.y;
            return dx < 246 && dy > -134 && dy < height + 24;
          })) position = { x: position.x, y: position.y + 134 };
        }
        geometry.current.set(id, position);
        const node: Node<CardData> = {
          ...old, id, type: 'knowledge', position, draggable: true, dragHandle: '.kw-drag-handle', selectable: false, connectable: false,
          data: {
            item, selected: selectedId === item.entityId, expanded: expanded.has(item.entityId),
            expandable: expanded.has(item.entityId) || (adjacency.get(item.entityId) ?? []).some(link =>
              !visibleIds.has(link.fromEntityId === item.entityId ? link.toEntityId : link.fromEntityId)),
            incoming: projection.links.filter(link => link.toEntityId === item.entityId).map(link => String(link.relationshipId)),
            outgoing: projection.links.filter(link => link.fromEntityId === item.entityId).map(link => String(link.relationshipId)),
            onSelect: choose, onExpand: toggleExpand,
          },
        };
        placed.set(id, position);
        return node;
      });
    });
  }, [adjacency, choose, expanded, projection, selectedId, setNodes, toggleExpand, visibleIds]);

  const measured = nodes.length === projection.nodes.length && nodes.every(node =>
    visibleIds.has(Number(node.id)) && node.measured?.width && node.measured.height);
  const runLayout = (fit: boolean) => {
    setLayoutError('');
    const token = ++layoutGeneration.current;
    void layout(projection, nodes).then(positions => {
      if (token !== layoutGeneration.current) return;
      for (const [id, position] of positions) geometry.current.set(id, position);
      setNodes(current => current.map(node => ({ ...node, position: positions.get(node.id) ?? node.position })));
      if (fit) queueCamera({ kind: 'fit' });
    }).catch(() => {
      if (token === layoutGeneration.current) setLayoutError('Arrange could not calculate a layout. Existing positions were kept.');
    });
  };
  useEffect(() => {
    if (!active || !measured || !layoutNeeded.current) return;
    const fit = layoutNeeded.current === 'neighborhood';
    layoutNeeded.current = null;
    if (nodes.length) runLayout(fit);
  }, [active, measured, nodes, projection]);

  useEffect(() => {
    if (!active || !cameraTask || tab !== 'map' || (isNarrow && compactDetail)) return;
    if (cameraTask.kind !== 'restore' && (!measured || !nodes.length)) return;
    const frame = requestAnimationFrame(() => {
      const area = canvas.current;
      const instance = flow.current;
      if (!area?.clientWidth || !area.clientHeight || !instance || cameraTask.generation !== cameraGeneration.current) return;
      if (cameraTask.kind === 'restore') {
        void instance.setViewport(cameraTask.viewport);
        setCameraTask(null);
        return;
      }
      const targets = cameraTask.kind === 'reveal' ? nodes.filter(node => cameraTask.ids.includes(node.id)) : nodes;
      if (targets.length) {
        const bounds = getNodesBounds(targets);
        const width = area.clientWidth;
        const height = area.clientHeight;
        const bottom = width >= 930 ? 104 : 16;
        const current = viewport.current;
        const limit = cameraTask.kind === 'fit' ? maxZoom : current.zoom;
        const fitted = getViewportForBounds(bounds, width, height, minZoom, limit, { top: '16px', left: '16px', right: '16px', bottom: `${bottom}px` });
        if (cameraTask.kind === 'reveal' && fitted.zoom >= current.zoom) {
          fitted.x = Math.max(16 - bounds.x * current.zoom, Math.min(current.x, width - 16 - (bounds.x + bounds.width) * current.zoom));
          fitted.y = Math.max(16 - bounds.y * current.zoom, Math.min(current.y, height - bottom - (bounds.y + bounds.height) * current.zoom));
        }
        void instance.setViewport(fitted);
      }
      setCameraTask(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [active, cameraTask, compactDetail, isNarrow, measured, nodes, tab]);

  const changeZoom = (value: number, readable = false) => {
    const area = canvas.current;
    if (!area) return;
    interruptMovement();
    const current = viewport.current;
    const next = Math.max(minZoom, Math.min(maxZoom, value));
    const x = area.clientWidth / 2;
    const y = area.clientHeight / 2;
    let center = { x: (x - current.x) / current.zoom, y: (y - current.y) / current.zoom };
    if (readable) {
      const target = nodes.find(node => node.id === String(selectedId)) ?? nodes.reduce<Node<CardData> | undefined>((closest, node) => {
        const distance = (point: XYPosition) => Math.hypot(point.x - center.x, point.y - center.y);
        return !closest || distance(node.position) < distance(closest.position) ? node : closest;
      }, undefined);
      if (target) {
        const bounds = getNodesBounds([target]);
        center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
      }
    }
    void flow.current?.setViewport({ x: x - center.x * next, y: y - center.y * next, zoom: next });
  };
  useEffect(() => {
    if (active) return;
    sourceRequest.current++;
    dialogRef.current?.close();
    setSource(null); setSourceLoading(false); setSourceError('');
  }, [active]);
  const openSource = async (target: KnowledgeSourceTarget, opener: HTMLElement) => {
    const token = ++sourceRequest.current;
    dialogOpener.current = opener; setSourceTarget(target); setSourceError(''); setSource(null); setSourceLoading(true);
    try { const result = await window.workspace.getKnowledgeSource({ projectId: data.project.id, target }); if (token !== sourceRequest.current) return; if (result.ok) setSource(result.value); else setSourceError(result.error.message); }
    catch (error) { if (token === sourceRequest.current) setSourceError(error instanceof Error ? error.message : 'Could not load the stored source.'); }
    finally { if (token === sourceRequest.current) setSourceLoading(false); }
  };
  const tabButton = (view: (typeof tabs)[number]) => document.getElementById(`kw-tab-${view}`);
  const closeSource = () => {
    sourceRequest.current++;
    dialogRef.current?.close();
    setSource(null); setSourceTarget(null); setSourceLoading(false);
    requestAnimationFrame(() => focusVisible(dialogOpener.current, inspectorTitle.current, mapHeading.current, tabButton(tab)));
  };
  const dismissDetails = (clearSelection: boolean) => {
    if (clearSelection) {
      interruptMovement();
      setSelectedId(null);
    }
    setCompactDetail(false);
    if (returnFocus.current?.classList.contains('kw-outline-row')) setOutlineOpen(true);
    sourceRequest.current++;
    setSource(null); setSourceLoading(false); setSourceError('');
    requestAnimationFrame(() => focusVisible(returnFocus.current, mapHeading.current));
  };
  const exploreConnections = (opener: HTMLElement) => {
    if (selectedId === null || selectedId === anchor) return;
    interruptMovement();
    // Keep the atlas frame reachable when the oldest neighborhood falls out of history.
    if (history.current.length === 20) history.current.splice(1, 1);
    history.current.push({
      anchor, expanded, revealId, selectedId, geometry: new Map(geometry.current), viewport: viewport.current,
      compactDetail, outlineOpen, scroll: inspector.current?.scrollTop ?? 0, opener, selectionOpener: returnFocus.current,
    });
    layoutNeeded.current = 'neighborhood';
    setAnchor(selectedId); setExpanded(new Set([selectedId])); setRevealId(null); setCompactDetail(false); setOutlineOpen(false);
    requestAnimationFrame(() => focusVisible(neighborhoodBack.current, mapHeading.current));
  };
  const returnToMap = () => {
    const saved = history.current.pop();
    if (!saved) return;
    interruptMovement();
    geometry.current = saved.geometry;
    inspectorScroll.current = saved.scroll;
    returnFocus.current = saved.selectionOpener;
    setAnchor(saved.anchor); setExpanded(saved.expanded); setRevealId(saved.revealId); setSelectedId(saved.selectedId);
    setCompactDetail(saved.compactDetail); setOutlineOpen(saved.outlineOpen);
    queueCamera({ kind: 'restore', viewport: saved.viewport });
    requestAnimationFrame(() => {
      if (displayRecord?.entityId === saved.selectedId && inspector.current && inspectorScroll.current !== null) {
        inspector.current.scrollTop = saved.scroll;
        inspectorScroll.current = null;
      }
      focusVisible(saved.opener, exploreButton.current, inspectorTitle.current, neighborhoodBack.current, mapHeading.current);
    });
  };
  const navigateRecord = (id: number, opener?: HTMLElement) => {
    if (!visibleIds.has(id)) {
      setRevealId(id);
      queueCamera({ kind: 'reveal', ids: [String(id)] });
    } else if (!opener) {
      queueCamera({ kind: 'reveal', ids: [String(id)] });
    }
    if (!opener) returnFocus.current = null;
    choose(id, opener);
  };
  const switchTab = (next: (typeof tabs)[number], focus = false) => {
    if (next !== tab) {
      sourceRequest.current++;
      setSourceError(''); setSourceLoading(false); setEdgeId(null); setTab(next);
    }
    if (focus) focusVisible(tabButton(next));
  };
  const tabKey = (event: KeyboardEvent, index: number) => {
    const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    const next = offset ? tabs[(index + offset + tabs.length) % tabs.length] : event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[tabs.length - 1] : undefined;
    if (next) { event.preventDefault(); switchTab(next, true); }
  };
  const filtered = useMemo(() => {
    const text = query.trim().toLocaleLowerCase();
    return data.nodes.filter(item => text
      ? `${item.title} ${kindName[item.kind]} ${item.externalId}`.toLocaleLowerCase().includes(text)
      : showAllDefinitions || item.kind === 'component' || item.kind === 'feature');
  }, [data.nodes, query, showAllDefinitions]);
  const diagnostics = data.review.diagnostics;
  const sourceButton = (label: string, target: KnowledgeSourceTarget) =>
    <button type="button" className="kw-text-button" onClick={event => void openSource(target, event.currentTarget)}>{label}</button>;

  return <section className="kw-workspace" aria-label="Project knowledge workspace">
    <header className="kw-topbar">
      <div><p className="kw-kicker">Knowledge project · stored definitions</p><h1>{data.project.name}</h1><p className="kw-subtitle">{data.goal || 'No goal statement was captured.'}</p></div>
      <div className="kw-header-meta"><span>Not assessed</span><span>{data.nodes.length} definitions</span>
        {hasResume && <button className="kw-button kw-primary" onClick={event => onProjectTools(event.currentTarget, 'resume')}>Resume</button>}
      </div>
    </header>
    <div className="kw-navigation">
      <div className="kw-tabs" role="tablist" aria-label="Project knowledge views">{tabs.map((view, index) =>
        <button key={view} id={`kw-tab-${view}`} role="tab" aria-selected={tab === view} aria-controls={`kw-panel-${view}`} tabIndex={tab === view ? 0 : -1}
          onClick={() => switchTab(view)} onKeyDown={event => tabKey(event, index)}>{tabTitle[view]}</button>)}</div>
      <div className="kw-project-links">
        <button className="kw-text-button" onClick={event => onProjectTools(event.currentTarget, 'journal')}>Journal</button>
        <button className="kw-text-button" onClick={event => onProjectTools(event.currentTarget, 'tools')}>Project tools</button>
      </div>
    </div>
    <div id="kw-panel-overview" role="tabpanel" aria-labelledby="kw-tab-overview" hidden={tab !== 'overview'} tabIndex={0}>
      <section className="kw-overview" aria-label="Project overview">
        <div className="kw-overview-lead"><p className="kw-kicker">Project overview</p><h2>Project intent</h2><p>{data.goal || 'No goal statement was captured.'}</p><p>Development readiness has not been assessed.</p></div>
        <div className="kw-count-grid">{Object.entries(data.counts).map(([kind, count]) => <div key={kind}><span>{kindName[kind as KnowledgeKind]}</span><strong>{count}</strong></div>)}</div>
        <p className="kw-muted">Formed {new Date(data.receipt.appliedAt).toLocaleString()}</p>
      </section>
    </div>
    <div id="kw-panel-sources" role="tabpanel" aria-labelledby="kw-tab-sources" hidden={tab !== 'sources'}>
      <section className="kw-overview" aria-label="Captured files">
        <div className="kw-overview-lead"><p className="kw-kicker">Project provenance</p><h2>Captured files</h2><p>Stored source copies from project formation.</p></div>
        <div>{data.documents.map(doc => <div className="kw-file" key={`${doc.importId}/${doc.documentKey}`}>
          <button className="kw-related-link" onClick={event => void openSource({ kind: 'document', importId: doc.importId, documentKey: doc.documentKey }, event.currentTarget)}>{doc.relativePath}</button>
          <code>{doc.sha256.slice(0, 16)}…</code><span>{doc.byteLength} bytes</span>
        </div>)}</div>
        {diagnostics.length > 0 && <details className="kw-diagnostics"><summary>Source diagnostics <span>{diagnostics.length}</span></summary><ul>{diagnostics.map(item =>
          <li key={item.id}><span className={`kw-diagnostic-level kw-level-${item.severity}`}>{item.severity}</span><span>{item.message}</span>
            {(item.source || item.relatedSources.length > 0) && sourceButton('Open source', { kind: 'diagnostic', importId: data.review.importId, diagnosticId: item.id, relatedIndex: item.source ? undefined : 0 })}
          </li>)}</ul></details>}
      </section>
    </div>
    <div id="kw-panel-map" role="tabpanel" aria-labelledby="kw-tab-map" hidden={tab !== 'map'}>
      <div className={`kw-layout${selected ? ' has-inspector' : ''}${anchor !== null ? ' is-neighborhood' : ''}${compactDetail ? ' is-detail' : ''}${usesDrawer ? ' uses-outline-drawer' : ''}${outlineOpen ? ' is-outline-open' : ''}`}>
        <aside className="kw-directory" id="kw-outline" aria-label="Knowledge outline" onKeyDown={event => {
          if (event.key === 'Escape' && outlineOpen) { setOutlineOpen(false); focusVisible(document.getElementById('kw-browse')); }
        }}>
          <label className="kw-search-label" htmlFor="kw-search">Search all definitions</label>
          <input id="kw-search" className="kw-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, type, or source ID" />
          <button className="kw-text-button kw-directory-toggle" onClick={() => setShowAllDefinitions(shown => !shown)} aria-pressed={showAllDefinitions}>{showAllDefinitions ? 'Show components & features' : `All definitions · ${data.nodes.length}`}</button>
          <div className="kw-directory-summary">{filtered.length} shown <span>·</span> {data.nodes.length} total</div>
          <ul className="kw-outline">{filtered.map(item =>
            <li key={item.entityId}><button type="button" className={`kw-outline-row${item.entityId === selectedId ? ' is-active' : ''}`} aria-current={item.entityId === selectedId ? 'true' : undefined} onClick={event => navigateRecord(item.entityId, event.currentTarget)}>
              <span className={`kw-kind-mark kw-mark-${item.kind}`} aria-hidden="true" /><span><small>{kindName[item.kind]}</small><strong>{item.title}</strong></span>
              <span className="kw-outline-count" title="Recorded native relationships">{adjacency.get(item.entityId)?.length ?? 0}</span>
            </button></li>)}</ul>
          <p className="kw-directory-foot">Counts show recorded native relationships.</p>
        </aside>
        <section ref={mapHeading} id="knowledge-map-heading" className="kw-map-region" aria-label="Connected knowledge map" tabIndex={-1}>
          <div className="kw-map-toolbar">
            <div><p className="kw-kicker">Source-linked structure</p><p className="kw-map-hint">Drag the canvas to pan. Drag a node by its grip.</p></div>
            <div className="kw-map-actions">
              <button id="kw-browse" className="kw-button kw-outline-toggle" onClick={() => {
                setOutlineOpen(!outlineOpen);
                if (!outlineOpen) requestAnimationFrame(() => document.getElementById('kw-search')?.focus());
              }} aria-expanded={outlineOpen} aria-controls="kw-outline">Browse definitions</button>
              <button className="kw-button" disabled={!measured || !nodes.length} onClick={() => runLayout(false)} title="Rearrange nodes without moving the camera">Arrange</button>
              <button className="kw-button" disabled={!measured || !nodes.length} onClick={() => { interruptMovement(); queueCamera({ kind: 'fit' }); }}>Fit map</button>
              <div className="kw-zoom" aria-label="Map zoom">
                <button className="kw-button" aria-label="Zoom out" disabled={!nodes.length || zoom <= minZoom} onClick={() => changeZoom(zoom / 1.2)}>−</button>
                <button className="kw-button kw-zoom-value" aria-label={`${Math.round(zoom * 100)}% zoom. Reset to readable zoom`} title="Reset to readable zoom" disabled={!nodes.length} onClick={() => changeZoom(openingViewport.zoom, true)}>{Number((zoom * 100).toFixed(zoom < .1 ? 1 : 0))}%</button>
                <button className="kw-button" aria-label="Zoom in" disabled={!nodes.length || zoom >= maxZoom} onClick={() => changeZoom(zoom * 1.2)}>+</button>
              </div>
            </div>
          </div>
          {anchor !== null && <div className="kw-anchor-banner">
            <span>Map <span aria-hidden="true">›</span> <strong>{byId.get(anchor)?.title}</strong></span>
            <button ref={neighborhoodBack} className="kw-text-button" onClick={returnToMap}>Back to prior map</button>
          </div>}
          <div className="kw-flow" ref={canvas} onFocusCapture={event => {
            const target = event.target;
            if (!(target instanceof HTMLElement) || !target.matches(':focus-visible')) return;
            const card = target.closest<HTMLElement>('.react-flow__node');
            const id = card?.dataset.id;
            if (!card || !id) return;
            const bounds = card.getBoundingClientRect();
            const area = event.currentTarget.getBoundingClientRect();
            if (bounds.left < area.left || bounds.right > area.right || bounds.top < area.top || bounds.bottom > area.bottom) {
              queueCamera({ kind: 'reveal', ids: [id] });
            }
          }}>
            <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={nodeChange}
              onMoveStart={event => { if (event) interruptMovement(); }}
              onMove={(_, current) => { viewport.current = current; setZoom(current.zoom); }}
              onInit={instance => { flow.current = instance; }}
              onEdgeMouseEnter={(_, edge) => setEdgeId(edge.id)}
              onEdgeMouseLeave={(_, edge) => setEdgeId(current => current === edge.id ? null : current)}
              nodesConnectable={false} deleteKeyCode={null} edgesReconnectable={false} elementsSelectable={false} nodesFocusable={false} edgesFocusable autoPanOnNodeFocus={false}
              defaultViewport={openingViewport} minZoom={minZoom} maxZoom={maxZoom} proOptions={{ hideAttribution: true }}>
              <Background color="#323244" gap={24} size={1} />
              {!!projection.nodes.length && <MiniMap style={{ width: 125, height: 84 }} maskColor="rgba(12,14,23,.65)" pannable zoomable nodeColor={node => `var(--kw-${(node.data as CardData).item.kind})`} />}
            </ReactFlow>
            {!projection.nodes.length && <div className="kw-empty-map"><h2>No components or features declared</h2><p>Use the outline to inspect the {data.nodes.length} saved definitions.</p>
              <button className="kw-button" onClick={() => { setShowAllDefinitions(true); setOutlineOpen(true); requestAnimationFrame(() => document.getElementById('kw-search')?.focus()); }}>Browse saved definitions</button></div>}
          </div>
          <p className="kw-edge-caption">{activeEdge?.ariaLabel ?? (projection.links.length ? 'Hover or focus a relationship line to read its label and direction.' : 'No authored relationships in this view.')}</p>
          <p className="kw-legend"><span>{projection.links.length} of {data.links.length} native relationships</span>{projection.hiddenCount > 0 && <span>{projection.hiddenCount} more definitions in the outline</span>}</p>
          {layoutError && <div className="kw-error" role="alert">{layoutError} <button className="kw-text-button" onClick={() => runLayout(false)}>Retry Arrange</button></div>}
        </section>
        {selected && <aside ref={inspector} className="kw-inspector" aria-label="Selected record details">
          <div className="kw-inspector-head">
            <div className="kw-inspector-title"><div><p className="kw-kicker">{kindName[selected.kind]}</p><h2 ref={inspectorTitle} tabIndex={-1}>{selected.title}</h2></div>
              <button className="kw-button kw-close-inspector" aria-label="Close record details" onClick={() => dismissDetails(true)}>×</button>
              <button className="kw-button kw-mobile-back" onClick={() => dismissDetails(false)}>← Map</button>
            </div>
            <div className="kw-inspector-actions">
              {related.length > 0 && selectedId !== anchor && <button ref={exploreButton} className="kw-button" onClick={event => exploreConnections(event.currentTarget)}>Explore connections</button>}
              {sourceButton('Metadata source', { kind: 'record', entityId: selected.entityId, revision: selected.revision, part: 'metadata' })}
              {sourceButton('Narrative source', { kind: 'record', entityId: selected.entityId, revision: selected.revision, part: 'narrative' })}
            </div>
          </div>
          {recordLoading && <p className="kw-muted" role="status">Loading record…</p>}
          {recordError && <div className="kw-error" role="alert">{recordError}<button className="kw-text-button" onClick={() => setRecordAttempt(n => n + 1)}>Retry</button></div>}
          {data.review.needsReviewScopeEntityIds.includes(selected.entityId) && <div className="kw-review-banner"><strong>Needs review</strong><span>Workflow reference requires review. No stages are assumed.</span></div>}
          {displayRecord && <Inspector record={displayRecord} related={related} byId={byId} onNavigate={navigateRecord} onSource={(target, el) => void openSource(target, el)} />}
          <p className="kw-inspector-footer">Revision {selected.revision} · source {selected.externalId}</p>
        </aside>}
      </div>
    </div>
    {sourceError && !source && <div className="kw-toast" role="alert">{sourceError}{sourceTarget && <button className="kw-text-button" onClick={() => {
      const opener = dialogOpener.current; if (opener) void openSource(sourceTarget, opener);
    }}>Retry source</button>}</div>}
    {sourceLoading && <div className="kw-toast" role="status">Loading stored source…</div>}
    <SourceDialog source={source} close={closeSource} dialogRef={dialogRef} />
  </section>;
}

function Inspector({ record, related, byId, onNavigate, onSource }: {
  record: KnowledgeRecord; related: readonly KnowledgeLink[]; byId: ReadonlyMap<number, KnowledgeNode>;
  onNavigate: (id: number) => void; onSource: (target: KnowledgeSourceTarget, el: HTMLElement) => void;
}) {
  const field = (name: string, value: string | readonly string[] | null) => <div className="kw-field"><dt>{name}</dt><dd>{
    typeof value === 'string' || value === null ? value || 'Not provided' : value.length ? <ul>{value.map((item, index) => <li key={index}>{item}</li>)}</ul> : 'None recorded'
  }</dd></div>;
  const narrative = record.narrativeMarkdown.replace(/^(?:[^\S\r\n]*\r?\n)+|(?:\r?\n[^\S\r\n]*)+$/g, '');
  return <div className="kw-inspector-body">
    <span className="kw-state-pill">{statusByKind[record.kind] ?? 'Captured definition'}</span>
    <dl className="kw-fields">
      {record.kind === 'project' && <>{field('Goal', record.goal)}{field('Documents', record.documents)}{field('Capabilities', record.capabilities)}</>}
      {record.kind === 'requirement' && <>{field('Requirement type', record.requirementType)}{field('Acceptance criteria', record.acceptance)}</>}
      {record.kind === 'scope' && <>{field('Workflow status', record.workflowStatus)}{field('Workflow request', record.workflow ? ('stages' in record.workflow ? record.workflow.stages.map(stage => `${stage.title} (${stage.key})`) : `${record.workflow.template_key} · v${record.workflow.version}`) : 'No workflow')}</>}
      {record.kind === 'action' && <>{field('Type', record.details.actionType)}{field('Instructions', record.details.instructions)}{field('Applicability', record.details.applicability)}{field('Definition of done', record.details.definitionOfDone)}{field('Evidence guidance', record.details.evidenceGuidance)}{field('Proposed stage', record.proposedStageKey)}{field('Covers rule IDs', record.coversRuleIds)}</>}
      {record.kind === 'decision' && <>{field('Rationale', record.rationale)}{field('Alternatives', record.alternatives)}</>}
      {record.kind === 'check' && <>{field('Method', record.method)}{field('Instructions', record.instructions)}{field('Expected results', record.expected)}</>}
      {field('Narrative', narrative || 'No narrative captured')}
    </dl>
    <section className="kw-related">
      <h3>Explicit relationships <span>{related.length}</span></h3>
      {related.length ? <ul>{related.map(link => {
        const outgoing = link.fromEntityId === record.entityId;
        const node = byId.get(outgoing ? link.toEntityId : link.fromEntityId);
        const relation = relationName[link.relation];
        return <li key={link.relationshipId}>
          <span className="kw-relation-label"><span aria-hidden="true">{outgoing ? '→' : '←'} </span><span className="sr-only">{outgoing ? 'Outgoing: ' : 'Incoming: '}</span>{relation}</span>
          <button title="Open relationship source" aria-label={`Source: ${relation} · ${node?.title ?? 'record'}`} className="kw-source-icon" onClick={event => onSource({ kind: 'relationship', relationshipId: link.relationshipId }, event.currentTarget)}>Source</button>
          {node && <button className="kw-related-link" onClick={() => onNavigate(node.entityId)}>{node.title}<small>{kindName[node.kind]}</small></button>}
        </li>;
      })}</ul> : <p className="kw-muted">No explicit relationships recorded.</p>}
    </section>
  </div>;
}
