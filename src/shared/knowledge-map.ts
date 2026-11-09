import type { KnowledgeLink, KnowledgeNode, KnowledgeWorkspace } from './knowledge';

export type KnowledgeMapProjection = { nodes: readonly KnowledgeNode[]; links: readonly KnowledgeLink[]; hiddenCount: number };

/** Initial atlas plus deliberate, one-hop expansions. Ownership of the project is metadata, never a map spoke. */
export function projectKnowledgeMap(
  workspace: KnowledgeWorkspace,
  expanded: ReadonlySet<number> = new Set(),
  revealEntityId?: number | null,
  anchorEntityId?: number | null,
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

  const seed = new Set(visible);
  const links = typed.filter((link) => seed.has(link.fromEntityId) && seed.has(link.toEntityId)).slice(0, 80);
  for (const link of links) { visible.add(link.fromEntityId); visible.add(link.toEntityId); }
  const selected = byId.get(revealEntityId ?? anchorEntityId ?? -1);
  const ordered = workspace.nodes.filter((node) => visible.has(node.entityId)).slice(0, 40);
  if (selected && !ordered.some((node) => node.entityId === selected.entityId)) ordered.splice(39, 1, selected);
  const boundedIds = new Set(ordered.map((node) => node.entityId));
  const boundedLinks = links.filter((link) => boundedIds.has(link.fromEntityId) && boundedIds.has(link.toEntityId));
  return { nodes: ordered, links: boundedLinks, hiddenCount: Math.max(0, workspace.nodes.length - ordered.length) };
}
