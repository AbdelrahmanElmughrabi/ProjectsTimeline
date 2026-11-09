import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Layers3, ShieldCheck } from 'lucide-react';
import type { BlueprintPreviewSnapshot } from '../shared/blueprint-preview';
import type { FormationPreparation, FormationReceipt, PreparedFormation } from '../shared/knowledge';
import './blueprint-formation.css';

export function BlueprintFormation({ snapshot, onApply, onCreated, onOpenExisting, onBlocked }: {
  snapshot: BlueprintPreviewSnapshot;
  onApply: (plan: PreparedFormation) => Promise<FormationReceipt>;
  onCreated: (receipt: FormationReceipt) => void;
  onOpenExisting: (projectId: number) => void;
  onBlocked: (blocked: boolean) => void;
}) {
  const root = snapshot.records.find(o => o.key === snapshot.projectKey);
  const project = root?.state === 'record' && root.record.kind === 'project' ? root.record : null;
  const [name, setName] = useState(project?.title ?? '');
  const [review, setReview] = useState<FormationPreparation | null>(null);
  const [phase, setPhase] = useState<'editing' | 'preparing' | 'prepared' | 'applying' | 'uncertain'>('editing');
  const [error, setError] = useState('');
  const request = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current++; }; }, []);
  useEffect(() => { request.current++; setName(project?.title ?? ''); setReview(null); setPhase('editing'); setError(''); }, [snapshot.snapshotId]);
  const saving = phase === 'applying' || phase === 'uncertain';
  useEffect(() => { onBlocked(saving || phase === 'preparing'); }, [saving, phase, onBlocked]);
  const records = snapshot.records.filter(o => o.state === 'record').map(o => o.record);
  const components = records.filter(r => r.kind === 'component'), features = records.filter(r => r.kind === 'feature');

  async function prepare(event: React.FormEvent) {
    event.preventDefault(); const token = ++request.current; setError(''); setPhase('preparing');
    try {
      const result = await window.workspace.prepareKnowledgeFormation({ sessionId: snapshot.sessionId, snapshotId: snapshot.snapshotId, name });
      if (!mounted.current || token !== request.current) return;
      if (!result.ok) throw new Error(result.error.message);
      setReview(result.value); setPhase('prepared');
      requestAnimationFrame(() => heading.current?.focus());
    } catch (e) { if (mounted.current && token === request.current) { setError(e instanceof Error ? e.message : 'Could not prepare the captured blueprint.'); setPhase('editing'); } }
  }
  async function apply() {
    if (review?.kind !== 'prepared') return;
    const token = ++request.current; setPhase('applying'); setError('');
    try {
      const receipt = await onApply(review);
      if (mounted.current && token === request.current) { onBlocked(false); onCreated(receipt); }
    } catch (e) {
      if (!mounted.current || token !== request.current) return;
      const code = (e as { code?: string }).code;
      setError(e instanceof Error ? e.message : 'The save result could not be confirmed.');
      if (code === 'NOT_FOUND' || code === 'VALIDATION') { setReview(null); setPhase('editing'); }
      else setPhase('uncertain');
    }
  }
  return <section className="formation" aria-label="Knowledge formation">
    <header className="formation-heading"><div className="formation-symbol" aria-hidden="true"><Layers3 size={25}/></div><div><p className="eyebrow">Captured blueprint · PTB 0.2</p><h2>{project?.title ?? 'Blueprint needs correction'}</h2><p>{project?.goal || 'Inspect the captured source before creating a knowledge project.'}</p></div><span className="formation-status">{snapshot.validation === 'invalid' ? 'Blocked' : snapshot.validation === 'needs-review' ? 'Needs review' : 'Ready to review'}</span></header>
    <div className="formation-body"><div className="formation-intro"><h3>Understand the system. Keep the context.</h3><p>Save a connected engineering model with its original source. Explore it without creating a release or accepting work.</p><div className="formation-facts"><span><strong>{components.length}</strong> components</span><span><strong>{features.length}</strong> features</span><span><strong>{records.length}</strong> definitions</span><span><strong>{snapshot.relationships.length}</strong> native links</span></div><p className="formation-source"><BookOpen size={15} aria-hidden="true"/> {snapshot.documents.length} captured {snapshot.documents.length === 1 ? 'document' : 'documents'} · {new Date(snapshot.capturedAt).toLocaleString()}</p><p className="field-note">Exact stored copy, not a live file. Requirements stay Draft, actions Proposed, scopes Draft, decisions Proposed and checks Not run.</p></div>
    <div className="formation-review">
      {error && <p role="alert" className="formation-error">{error}</p>}
      {review?.kind === 'existing' ? <><h3 ref={heading} tabIndex={-1}>This source is already bound</h3><p>PTB project ID <code>{project?.id}</code> belongs to <strong>{review.project.name}</strong>.</p><p>{review.captureComparison === 'same' ? 'The captured document set is unchanged.' : 'This capture differs from the saved source. Updating an existing project is outside this slice.'}</p><button className="button button-primary" onClick={() => onOpenExisting(review.project.id)}>Open existing project <ArrowRight size={16}/></button><button className="text-button" onClick={() => { setReview(null); setPhase('editing'); }}>Back to capture</button></> : review?.kind === 'prepared' ? <><h3 ref={heading} tabIndex={-1}>Review new knowledge project</h3><p className="formation-target">{review.projectName}</p><p>{Object.values(review.counts).reduce((a,b) => a+b,0)} definitions · {review.relationshipCount} native relationships</p><p><ShieldCheck size={16} aria-hidden="true"/> All definitions remain unaccepted. Zero operational actions, releases or verification results will be created.</p><p className="field-note">Captured {new Date(review.capturedAt).toLocaleString()}. Formation is atomic; after saving there is no destructive Undo.</p><details><summary>Captured source fingerprints</summary>{review.documents.map(d => <p className="formation-fingerprint" key={d.documentKey}>{d.relativePath}<code>{d.sha256}</code></p>)}</details><div className="form-actions"><button className="button button-primary" disabled={phase === 'applying'} onClick={() => void apply()}>{phase === 'applying' ? 'Saving…' : phase === 'uncertain' ? 'Check saved result / Retry' : 'Create knowledge project'}<ArrowRight size={16}/></button><button className="text-button" disabled={saving} onClick={() => { setReview(null); setPhase('editing'); }}>Edit review</button></div>{phase === 'uncertain' && <p className="field-note">Retry uses the same operation ID. A committed receipt returns the existing project rather than creating another.</p>}</> : <form onSubmit={event => void prepare(event)}><label htmlFor="formation-name">New knowledge project</label><input id="formation-name" maxLength={120} value={name} onChange={e => setName(e.target.value)} disabled={phase === 'preparing' || snapshot.validation === 'invalid'} required/><p className="field-note">PTB project IDs identify a source binding within this profile. A repeated ID opens its existing project; it cannot silently create a clone.</p><button type="submit" className="button button-primary" disabled={phase === 'preparing' || !project || snapshot.validation === 'invalid'}>{phase === 'preparing' ? 'Preparing review…' : 'Review project formation'} <ArrowRight size={16}/></button>{snapshot.validation === 'invalid' && <p className="formation-error">Resolve blocking diagnostics below. Invalid source remains inspectable; nothing has been saved.</p>}</form>}
    </div></div>
  </section>;
}
