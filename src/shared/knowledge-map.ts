import type { KnowledgeLink, KnowledgeNode, KnowledgeWorkspace } from './knowledge';

export type KnowledgeMapProjection = { nodes: readonly KnowledgeNode[]; links: readonly KnowledgeLink[]; hiddenCount: number };
export type KnowledgeMapPriorities = {
  selectedEntityId?: number | null;
  expandedEntityId?: number | null;
  newNeighborEntityId?: number | null;
  previousVisibleIds?: ReadonlySet<number>;
  focusedRelationshipId?: number | null;
};

/** Initial atlas plus deliberate, one-hop expansions. Ownership of the project is metadata, never a map spoke. */
export function projectKnowledgeMap(
  workspace: KnowledgeWorkspace,
  expanded: ReadonlySet<number> = new Set(),
  revealEntityId?: number | null,
  anchorEntityId?: number | null,
  priorities: KnowledgeMapPriorities = {},
): KnowledgeMapProjection {
  const byId = new Map(workspace.nodes.map((node) => [node.entityId, node]));
  const typed = workspace.links.filter((link) => byId.has(link.fromEntityId) && byId.has(link.toEntityId));
  const parents = new Set(typed.filter((link) => link.relation === 'parent-component').map((link) => link.fromEntityId));
  const roots = workspace.nodes.filter((node) => node.kind === 'component' && !parents.has(node.entityId));
  const visible = new Set<number>(anchorEntityId ? [anchorEntityId] : roots.map((node) => node.entityId));
  const assignedFeatures = new Set(typed.filter(link => link.relation === 'primary-component').map(link => link.fromEntityId));
  if (!anchorEntityId) workspace.nodes.filter(n => n.kind === 'feature' && !assignedFeatures.has(n.entityId)).forEach(n => visible.add(n.entityId));

  for (const link of typed) {
    if (!anchorEntityId && link.relation === 'primary-component' && roots.some((node) => node.entityId === link.toEntityId)) {
      visible.add(link.fromEntityId);
    }
  }
  for (const id of expanded) {
    if (!byId.has(id)) continue;
    visible.add(id);
    for (const link of typed) {
      if (link.fromEntityId === id) visible.add(link.toEntityId);
      if (link.toEntityId === id) visible.add(link.fromEntityId);
    }
  }
  if (revealEntityId && byId.has(revealEntityId)) visible.add(revealEntityId);
  if (priorities.selectedEntityId != null && byId.has(priorities.selectedEntityId)) visible.add(priorities.selectedEntityId);
  const focused = typed.find(link => link.relationshipId === priorities.focusedRelationshipId);
  if (focused) { visible.add(focused.fromEntityId); visible.add(focused.toEntityId); }

  // Preserve requested context first. Expansion reserves a new neighbor only through an authored link.
  const connecting = priorities.expandedEntityId != null && priorities.newNeighborEntityId != null
    ? typed.find(link =>
      (link.fromEntityId === priorities.expandedEntityId && link.toEntityId === priorities.newNeighborEntityId) ||
      (link.toEntityId === priorities.expandedEntityId && link.fromEntityId === priorities.newNeighborEntityId))
    : undefined;
  const chosen = new Set<number>();
  const reserve = (id: number | null | undefined) => {
    if (id != null && visible.has(id) && chosen.size < 40) chosen.add(id);
  };
  reserve(priorities.selectedEntityId);
  reserve(anchorEntityId);
  reserve(priorities.expandedEntityId);
  reserve(revealEntityId);
  if (focused) { reserve(focused.fromEntityId); reserve(focused.toEntityId); }
  if (connecting) reserve(priorities.newNeighborEntityId);
  // Retain prior canvas cards where possible; return them in original authored order.
  if (priorities.previousVisibleIds) {
    for (const node of workspace.nodes) if (priorities.previousVisibleIds.has(node.entityId)) reserve(node.entityId);
  }
  for (const node of workspace.nodes) reserve(node.entityId);
  const ordered = workspace.nodes.filter(node => chosen.has(node.entityId));
  const boundedLinks = typed.filter(link => chosen.has(link.fromEntityId) && chosen.has(link.toEntityId));
  const chosenLinks = new Set<number>();
  const reserveLink = (link: KnowledgeLink | undefined) => {
    if (link && chosenLinks.size < 80) chosenLinks.add(link.relationshipId);
  };
  reserveLink(connecting);
  reserveLink(focused);
  for (const id of [priorities.selectedEntityId, anchorEntityId, priorities.expandedEntityId]) {
    if (id != null) for (const link of boundedLinks) {
      if (link.fromEntityId === id || link.toEntityId === id) reserveLink(link);
    }
  }
  for (const link of boundedLinks) reserveLink(link);
  return {
    nodes: ordered,
    links: boundedLinks.filter(link => chosenLinks.has(link.relationshipId)),
    hiddenCount: Math.max(0, workspace.nodes.length - ordered.length),
  };
}
