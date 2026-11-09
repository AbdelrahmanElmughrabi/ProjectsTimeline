export const relationLabels = {
  'parent-component': 'child of', 'primary-component': 'part of',
  'applies-to-feature': 'applies to', 'concerns-feature': 'concerns',
  'concerns-scope': 'planned in', 'addresses-requirement': 'addresses',
  'affects-feature': 'affects', 'affects-requirement': 'affects', 'plans-to-verify': 'plans to verify',
};

export function makeModel(data) {
  const byId = new Map(data.records.map(r => [r.id, r]));
  // Preview relationships refer to occurrence keys; convert through exact source IDs.
  const occurrenceIds = new Map(data.records.map(r => [r.occurrenceKey, r.id]));
  const edges = data.relationships.filter(e => e.status === 'resolved').map(e => ({ ...e,
    from: occurrenceIds.get(e.fromKey), to: occurrenceIds.get(e.targetKeys[0]),
  }));
  return { byId, records: data.records, edges };
}

export function projectMap(model, lens, selectedId, expanded) {
  const { records, byId, edges } = model;
  const project = records.find(r => r.kind === 'project');
  let ids;
  if (lens === 'focus') {
    const target = byId.get(selectedId) || project;
    ids = new Set([target.id]);
    for (const e of edges) {
      if (e.from === target.id && ['component','feature','requirement'].includes(byId.get(e.to)?.kind)) ids.add(e.to);
      if (e.to === target.id && ['component','feature','requirement'].includes(byId.get(e.from)?.kind)) ids.add(e.from);
    }
    // Include each visible feature's declared component, preserving the explicit path.
    for (const id of [...ids]) { const r = byId.get(id); if (r.component) ids.add(r.component); }
  } else {
    ids = new Set([project.id, ...records.filter(r => lens === 'features' ? r.kind === 'feature' : r.kind === 'component' && (!r.parent || expanded)).map(r => r.id)]);
  }
  const nodes = [...ids].map(id => byId.get(id)).filter(Boolean);
  const links = edges.filter(e => ids.has(e.from) && ids.has(e.to));
  if (lens !== 'focus') for (const r of nodes) {
    if (r.id !== project.id && !r.parent) links.push({ id: `owner:${r.id}`, from: project.id, to: r.id,
      relation: 'project-ownership', source: r.source, authority: 'explicit-project-field' });
  }
  return { nodes, links };
}
