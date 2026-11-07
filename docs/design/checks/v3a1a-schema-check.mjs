// Disposable final-design checks: Markdown SQL in :memory:, actual unchanged store
// compiled under artifacts. No application profile, production module or migration writes.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const folder='artifacts/v3a1a-proposal-checks';
const compile=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','-p','tsconfig.node.json','--outDir',folder+'/current-main'],{encoding:'utf8'});
assert.equal(compile.status,0,compile.stdout+compile.stderr);
const require=createRequire(import.meta.url);
const { WorkspaceStore }=require(resolve(folder,'current-main/main/data/database.js'));
const ddl=readFileSync('docs/design/v3a1a-schema-proposal.md','utf8').replace(/\r\n/g,'\n').match(/```sql\n([\s\S]*?)\n```/)[1];
const db=new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON');
for(const name of readdirSync('src/main/data/migrations').filter(x=>x.endsWith('.sql')).sort())
  db.exec(readFileSync('src/main/data/migrations/'+name,'utf8'));
const store=new WorkspaceStore(db);
const legacy=store.createProject({name:'Legacy'});
const done=store.addAction({projectId:legacy.id,title:'Existing completed work'});
store.completeAction({projectId:legacy.id,actionId:done.id});
store.saveCheckpoint({projectId:legacy.id,accomplished:'Original journal',nextSteps:'Original next step'});
const release=store.createRelease({projectId:legacy.id,name:'Existing active release'});
const stage=store.openProject({projectId:legacy.id}).releases[0].stages[0];
const legacyTables=db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r=>r.name);
const snapshot=tables=>Object.fromEntries(tables.map(t=>[t,db.prepare('SELECT * FROM '+t).all()]));
const original=snapshot(legacyTables);
let count=0;
const check=(name,fn)=>{fn(); count++; console.log('PASS: '+name);};
const rejects=(name,fn,pattern)=>check(name,()=>assert.throws(fn,pattern));

check('revised DDL creates 13 tables / 5 explicit indexes / 29 triggers, legacy rows unchanged',()=>{
  db.exec('BEGIN IMMEDIATE'); db.exec(ddl); db.exec('COMMIT');
  const n=type=>db.prepare("SELECT count(*) n FROM sqlite_schema WHERE type=? AND name LIKE 'knowledge_%'").get(type).n;
  assert.deepEqual([n('table'),n('index'),n('trigger')],[13,5,29]);
  assert.deepEqual(snapshot(legacyTables),original);
  assert.equal(db.prepare("SELECT count(*) n FROM pragma_table_info('knowledge_entities') WHERE name IN ('external_id','action_id','current_revision')").get().n,0);
  assert.equal(db.prepare("SELECT count(*) n FROM sqlite_schema WHERE name='knowledge_workspaces'").get().n,0);
});
const stamp='2026-11-07T12:00:00.000Z';
const importId='00000000-0000-4000-8000-000000000002';
const bytes=Buffer.from('\uFEFF# Captured\r\nExact 🐾 source\r\n','utf8');
const sha=createHash('sha256').update(bytes).digest('hex');
const ref=JSON.stringify({documentId:'d0',span:{start:{byteOffset:0,utf16Offset:0,line:1,column:1},end:{byteOffset:bytes.length,utf16Offset:bytes.toString('utf8').length,line:3,column:1}},headingPath:[]});
const kinds=['project','component','feature','requirement','scope','action','decision','check'];
const entityId=index=>1000+index;
const run=(s,...p)=>db.prepare(s).run(...p);
function form(fault){
  const phase=p=>{if(fault===p) throw Error('Injected '+p);};
  run('INSERT INTO projects VALUES (2,?,?)','Knowledge',stamp); phase('project');
  run('INSERT INTO knowledge_source_bindings VALUES (20,2,?,?,?)','ptb','proj.test',importId); phase('binding');
  run('INSERT INTO knowledge_imports VALUES (?,2,20,?,?,?,?,?,?,?,?,?,?,?)',importId,'snapshot','v2-preview-1','0.2','v3a1a-1',sha,sha,'Knowledge',stamp,stamp,'valid','[]'); phase('receipt');
  run('INSERT INTO knowledge_documents VALUES (?, ?,2,?,0,?,?,?,?,?)',importId,'d0','project.md',bytes,bytes.length,bytes.toString('utf8').length,sha,'[]'); phase('documents');
  for(const [i,kind] of kinds.entries())run('INSERT INTO knowledge_entities VALUES (?,2,?,?)',entityId(i),kind,stamp);
  for(const [i,kind] of kinds.entries()){
    const native=kind==='project'?'proj.test':kind+'.test';
    run('INSERT INTO knowledge_definitions VALUES (?,1,2,?,?,?,?,?,?,?,?,?,?,?)',entityId(i),kind,kind,'Exact narrative',native,importId,'d0','d0:b'+i,i,ref,ref,stamp);
  }
  run('INSERT INTO knowledge_project_details VALUES (?,1,2,?,?,?,?)',entityId(0),'project','Goal','[]','[]');
  run('INSERT INTO knowledge_requirement_details VALUES (?,1,2,?,?,?)',entityId(3),'requirement','functional','["Observable criterion"]');
  run('INSERT INTO knowledge_scope_plans VALUES (?,1,2,?,?,?,?,?)',entityId(4),'scope','inline','inline',null,null);
  run('INSERT INTO knowledge_stage_definitions VALUES (?,1,2,?,?,?,0)',entityId(4),'scope','build','Build'); phase('definitions');
  for(const [from,to,relation] of [[2,1,'primary-component'],[3,2,'applies-to-feature'],[4,2,'concerns-feature'],[5,4,'concerns-scope'],[5,3,'addresses-requirement'],[6,2,'affects-feature'],[7,3,'plans-to-verify']]){
    run('INSERT INTO knowledge_relationships(project_id,from_entity_id,from_revision,from_kind,to_entity_id,to_kind,relation,origin_import_id,origin_document_key,source_ref_json) VALUES (2,?,1,?,?,?,?,?,?,?)',entityId(from),kinds[from],entityId(to),kinds[to],relation,importId,'d0',ref);
  } phase('links');
  run('INSERT INTO knowledge_action_details VALUES (?,1,2,?,?,?,?,?,?,?,?)',entityId(5),'action','verification','','','','','[]','build');
  run('INSERT INTO knowledge_decision_details VALUES (?,1,2,?,?,?)',entityId(6),'decision','Rationale','[]');
  run('INSERT INTO knowledge_check_details VALUES (?,1,2,?,?,?,?)',entityId(7),'check','manual','Inspect','["Expected"]'); phase('payloads');
  run('INSERT INTO action_events(project_id,description,after_value,created_at) VALUES (2,?,?,?)','Created knowledge project from reviewed blueprint',JSON.stringify({importId}),stamp); phase('audit');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]); phase('commit');
}
for(const p of ['project','binding','receipt','documents','definitions','links','payloads','audit','commit'])
  check('atomic rollback after '+p,()=>{
    db.exec('BEGIN IMMEDIATE'); assert.throws(()=>form(p),new RegExp('Injected '+p)); db.exec('ROLLBACK');
    assert.equal(db.prepare('SELECT count(*) n FROM projects WHERE id=2').get().n,0);
    assert.equal(db.prepare('SELECT count(*) n FROM knowledge_source_bindings').get().n,0);
    assert.equal(db.prepare('SELECT count(*) n FROM knowledge_imports').get().n,0);
    assert.equal(db.prepare('SELECT count(*) n FROM knowledge_entities').get().n,0);
    assert.deepEqual(snapshot(legacyTables),original);
  });
check('formation commits source/graph, adds zero operational actions/details/membership',()=>{
  const tables=['actions','action_details','release_actions'];
  const before=snapshot(tables);
  db.exec('BEGIN IMMEDIATE'); form(); db.exec('COMMIT');
  assert.deepEqual(snapshot(tables),before);
  assert.equal(db.prepare('SELECT count(*) n FROM knowledge_entities').get().n,8);
  assert.deepEqual(Buffer.from(db.prepare('SELECT source_utf8 FROM knowledge_documents').get().source_utf8),bytes);
  assert.equal(db.prepare('SELECT sha256 FROM knowledge_documents').get().sha256,sha);
  assert.equal(store.openProject({projectId:2}).actions.length,0);
  assert.equal(store.openProject({projectId:2}).releases.length,0);
});
const knowledgeTables=db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'knowledge_%' ORDER BY name").all().map(r=>r.name);
const knowledge=snapshot(knowledgeTables);
const freshRelease=store.createRelease({projectId:2,name:'Independent legacy release'});
const freshWorkspace=store.openProject({projectId:2}).releases[0];
const freshStage=freshWorkspace.stages[0];
const proposal=entityId(5);
const definition={title:'Do not write this',instructions:'',applicability:'',definitionOfDone:'',evidenceGuidance:'',actionType:'verification'};
for(const [name,command] of [
  ['complete',()=>store.completeAction({projectId:2,actionId:proposal})],
  ['reopen',()=>store.reopenAction({projectId:2,actionId:proposal})],
  ['assign',()=>store.assignAction({projectId:2,actionId:proposal,releaseId:freshRelease.id,stageId:freshStage.id})],
  ['exclude',()=>store.setActionExclusion({projectId:2,actionId:proposal,reason:'Not applicable'})],
  ['edit',()=>store.updateReleaseAction({projectId:2,actionId:proposal,...definition})],
  ['reorder',()=>store.reorderReleaseActions({projectId:2,releaseId:freshRelease.id,stageId:freshStage.id,actionIds:[proposal]})]
])check('actual legacy '+name+' rejects no-row proposal ID without state/audit/revision changes',()=>{
  const before=snapshot(legacyTables);
  assert.throws(command,e=>e.code==='NOT_FOUND'||e.code==='VALIDATION');
  assert.deepEqual(snapshot(legacyTables),before);
  assert.deepEqual(snapshot(knowledgeTables),knowledge);
});
check('raw operational update affects zero rows for non-colliding proposal ID',()=>{
  assert.equal(run('UPDATE actions SET completed_at=? WHERE id=?',stamp,proposal).changes,0);
  assert.deepEqual(snapshot(knowledgeTables),knowledge);
});
rejects('raw membership INSERT for proposal ID fails FK',()=>run('INSERT INTO release_actions(action_id,release_id,stage_id) VALUES (?,?,?)',proposal,freshRelease.id,freshStage.id),/FOREIGN KEY/);
const ordinary=store.addAction({projectId:2,title:'Actual legacy work'});
store.assignAction({projectId:2,actionId:ordinary.id,releaseId:freshRelease.id,stageId:freshStage.id});
rejects('raw membership UPDATE action_id cannot replace legacy work with proposal ID',()=>run('UPDATE release_actions SET action_id=? WHERE action_id=?',proposal,ordinary.id),/immutable/);
rejects('raw membership UPDATE release_id is blocked',()=>run('UPDATE release_actions SET release_id=? WHERE action_id=?',release.id,ordinary.id),/immutable/);
check('valid legacy stage/exclusion updates still work',()=>{
  const target=freshWorkspace.stages[1];
  store.assignAction({projectId:2,actionId:ordinary.id,releaseId:freshRelease.id,stageId:target.id});
  store.setActionExclusion({projectId:2,actionId:ordinary.id,reason:'Recorded scope reason'});
  assert.equal(db.prepare('SELECT stage_id s, exclusion_reason r FROM release_actions WHERE action_id=?').get(ordinary.id).s,target.id);
  assert.deepEqual(snapshot(knowledgeTables),knowledge);
});
check('numeric ID collision affects ordinary action only, never proposal identity/state',()=>{
  run('INSERT INTO actions(id,project_id,title,created_at) VALUES (?,2,?,?)',proposal,'Separate operational work with same number',stamp);
  store.completeAction({projectId:2,actionId:proposal});
  assert.ok(db.prepare('SELECT completed_at c FROM actions WHERE id=?').get(proposal).c);
  store.assignAction({projectId:2,actionId:proposal,releaseId:freshRelease.id,stageId:freshStage.id});
  assert.deepEqual(snapshot(knowledgeTables),knowledge);
  assert.equal(db.prepare("SELECT count(*) n FROM pragma_table_info('knowledge_entities') WHERE name='action_id'").get().n,0);
});
const gate=freshWorkspace.release.confirmedAt===null?store.openProject({projectId:2}).actions.find(a=>a.releaseId===freshRelease.id&&a.kind==='release-confirmation'):null;
rejects('ordinary checkbox cannot complete protected release gate',()=>store.completeAction({projectId:2,actionId:gate.id}),e=>e.code==='FORBIDDEN');
for(const table of knowledgeTables){
  rejects(table+' UPDATE blocked',()=>db.exec('UPDATE '+table+' SET project_id=project_id'),/fixed|immutable/);
  rejects(table+' DELETE blocked',()=>db.exec('DELETE FROM '+table),/deleted/);
}
rejects('wrong-kind typed payload FK',()=>run("INSERT INTO knowledge_requirement_details VALUES (?,1,2,'requirement','functional','[]')",entityId(2)),/FOREIGN KEY/);
rejects('wrong-project typed payload FK',()=>run("INSERT INTO knowledge_requirement_details VALUES (?,1,1,'requirement','functional','[]')",entityId(2)),/FOREIGN KEY/);
rejects('wrong-kind relationship CHECK',()=>run("INSERT INTO knowledge_relationships(project_id,from_entity_id,from_revision,from_kind,to_entity_id,to_kind,relation,origin_import_id,origin_document_key,source_ref_json) VALUES (2,?,1,'feature',?,'requirement','primary-component',?,'d0',?)",entityId(2),entityId(3),importId,ref),/CHECK/);
rejects('same PTB native root cannot bind another project',()=>run('INSERT INTO knowledge_source_bindings VALUES (21,1,?,?,?)','ptb','proj.test',importId),/UNIQUE/);
rejects('project definition native root must match its actual source',()=>run("INSERT INTO knowledge_definitions SELECT entity_id,2,project_id,kind,title,narrative_markdown,'proj.other',origin_import_id,origin_document_key,origin_occurrence_key,presentation_order,metadata_ref_json,narrative_ref_json,created_at FROM knowledge_definitions WHERE entity_id=?",entityId(0)),/does not match binding/);
check('initial receipt FK cannot point to another source binding import',()=>{
  db.exec('BEGIN IMMEDIATE');
  run('INSERT INTO knowledge_source_bindings VALUES (30,2,?,?,?)','fixture-only',null,importId);
  assert.throws(()=>db.exec('COMMIT'),/FOREIGN KEY/); db.exec('ROLLBACK');
});
db.exec('BEGIN IMMEDIATE');
run('INSERT INTO knowledge_definitions SELECT entity_id,2,project_id,kind,title,narrative_markdown,source_native_id,origin_import_id,origin_document_key,origin_occurrence_key,presentation_order,metadata_ref_json,narrative_ref_json,created_at FROM knowledge_definitions WHERE entity_id=?',entityId(4));
run("INSERT INTO knowledge_scope_plans VALUES (?,2,2,'scope','none','none',NULL,NULL)",entityId(4));
rejects('inline stage cannot be inserted into stage-less plan',()=>run("INSERT INTO knowledge_stage_definitions VALUES (?,2,2,'scope','invented','Invented',0)",entityId(4)),/inline scope plan/);
db.exec('ROLLBACK');
db.exec('BEGIN IMMEDIATE');
run("INSERT INTO knowledge_definitions SELECT entity_id,2,project_id,kind,title,narrative_markdown,source_native_id,origin_import_id,origin_document_key,origin_occurrence_key,presentation_order,metadata_ref_json,narrative_ref_json,created_at FROM knowledge_definitions WHERE entity_id=?",entityId(5));
run("INSERT INTO knowledge_relationships(project_id,from_entity_id,from_revision,from_kind,to_entity_id,to_kind,relation,origin_import_id,origin_document_key,source_ref_json) VALUES (2,?,2,'action',?,'scope','concerns-scope',?,'d0',?)",entityId(5),entityId(4),importId,ref);
rejects('nonexistent proposed inline stage rejected',()=>run("INSERT INTO knowledge_action_details VALUES (?,2,2,'action','verification','','','','','[]','absent')",entityId(5)),/Proposed stage/);
db.exec('ROLLBACK');
check('source metadata can represent second native format without fake PTB/project identity',()=>{
  const other='00000000-0000-4000-8000-000000000003';
  db.exec('BEGIN IMMEDIATE');
  run('INSERT INTO knowledge_source_bindings VALUES (30,2,?,?,?)','fixture-only',null,other);
  run('INSERT INTO knowledge_imports VALUES (?,2,30,?,?,?,?,?,?,?,?,?,?,?)',other,'fixture-snapshot','fixture-parser','native-v1','fixture-only',null,sha,'Knowledge',stamp,stamp,'valid','[]');
  run('INSERT INTO knowledge_documents VALUES (?, ?,2,?,0,?,?,?,?,?)',other,'native-doc','ordinary.md',bytes,bytes.length,bytes.toString('utf8').length,sha,'[]');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  assert.equal(db.prepare('SELECT count(*) n FROM knowledge_source_bindings WHERE project_id=2').get().n,2);
  assert.equal(db.prepare('SELECT native_root_key k FROM knowledge_source_bindings WHERE id=30').get().k,null);
  assert.equal(db.prepare('SELECT count(*) n FROM projects').get().n,2);
  db.exec('ROLLBACK');
});
check('capture-local native ID allows distinct same-project record with same alias in another source',()=>{
  // Synthetic SQL expressibility probe only; not a production adapter or auto-merge.
  const other='00000000-0000-4000-8000-000000000004';
  db.exec('BEGIN IMMEDIATE');
  run('INSERT INTO knowledge_source_bindings VALUES (40,2,?,?,?)','fixture-only','native.fixture',other);
  run('INSERT INTO knowledge_imports VALUES (?,2,40,?,?,?,?,?,?,?,?,?,?,?)',other,'fixture','fixture-parser','v1','fixture-only',sha,sha,'Knowledge',stamp,stamp,'valid','[]');
  run('INSERT INTO knowledge_documents VALUES (?, ?,2,?,0,?,?,?,?,?)',other,'d0','native.md',bytes,bytes.length,bytes.toString('utf8').length,sha,'[]');
  run('INSERT INTO knowledge_entities VALUES (2000,2,?,?)','component',stamp);
  run('INSERT INTO knowledge_definitions VALUES (2000,1,2,?,?,?,?,?,?,?,?,?,?,?)','component','Separate component','Body','component.test',other,'d0','d0:b0',0,ref,ref,stamp);
  assert.equal(db.prepare("SELECT count(DISTINCT entity_id) n FROM knowledge_definitions WHERE source_native_id='component.test'").get().n,2);
  db.exec('ROLLBACK');
});
check('source/header constraints preserve actor-free immutable initial graph',()=>{
  assert.deepEqual(snapshot(knowledgeTables),knowledge);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  assert.equal(db.prepare('SELECT completed_at c FROM actions WHERE id=?').get(done.id).c,original.actions.find(a=>a.id===done.id).completed_at);
});
db.close();
console.log('Final-design checks: '+count+' passed. No new formation command, migration runner, renderer, Electron/package or adapter functionality verified.');
