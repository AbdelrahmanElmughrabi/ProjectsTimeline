import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve, join } from 'node:path';
import { copyFileSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { temporaryDirectory } from '../helpers.mjs';
import { launchWorkspace } from '../electron-flow.mjs';
import { once } from 'node:events';

async function choose(application, page, file) {
  await application.evaluate(({ dialog }, entry) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [entry] }); }, file);
  await page.getByRole('button', { name: 'Preview blueprint', exact: true }).focus(); await page.keyboard.press('Enter');
  await page.getByRole('region', { name: 'Knowledge formation', exact: true }).waitFor();
}
async function prepare(page) {
  await page.getByRole('button', { name: 'Review project formation', exact: true }).focus(); await page.keyboard.press('Enter');
  await page.getByRole('heading', { name: 'Review new knowledge project', exact: true }).waitFor();
}
async function form(page) {
  await prepare(page);
  await page.getByRole('button', { name: 'Create knowledge project', exact: true }).click();
  await page.getByRole('region', { name: 'Connected knowledge map', exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.react-flow__node').length > 0);
}
async function resize(app, width, height) { await app.evaluate(({ BrowserWindow }, size) => BrowserWindow.getAllWindows()[0].setSize(size.width, size.height), { width, height }); }
const frame = async page => { await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); };
const viewport = page => page.locator('.react-flow__viewport').getAttribute('style');

test('actual Vivarium forms a persistent connected map with working drag, stable selection, exact source, responsive keyboard and restart recovery', { timeout: 120000 }, async t => {
  let application;
  const directory = temporaryDirectory(t, () => application?.close());
  const file = join(directory, 'project.md'); copyFileSync(resolve('tests/fixtures/vivarium/project.md'), file);
  const original = readFileSync(file, 'utf8');
  const profile = join(directory, 'profile');
  const executable=process.env.PROJECTS_TIMELINE_EXECUTABLE;
  const screenshotPrefix=executable?'packaged-':'';
  application = await launchWorkspace(profile,executable);
  const page = await application.firstWindow();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', message => {
    if (message.type() === 'error' && /content security policy|refused to (load|execute)|unsafe-eval/i.test(message.text())) errors.push(message.text());
  });
  const external = []; page.on('request', req => { if (/^https?:/.test(req.url())) external.push(req.url()); });
  await resize(application, 1540, 1000);
  await page.getByRole('heading', { name: 'Start with a project' }).waitFor();
  await application.evaluate(({ dialog }, entry) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [entry] }); }, file);
  const preview = await page.evaluate(() => window.workspace.chooseBlueprintPreview());
  assert.ok(preview.ok && preview.value.kind === 'snapshot');
  const captured = preview.value.snapshot;
  await choose(application, page, file); await form(page);
  const result = await page.evaluate(async () => { const p=(await window.workspace.listProjects()).value[0]; return { graph: await window.workspace.openKnowledgeWorkspace({projectId:p.id}), old: await window.workspace.openProject({projectId:p.id}) }; });
  assert.equal(result.graph.ok, true); const graph=result.graph.value;
  assert.equal(graph.nodes.length,47); assert.equal(graph.links.length,86);
  const definitions = new Map(graph.nodes.map(node => [node.entityId, node.origin.occurrenceKey]));
  assert.deepEqual(graph.nodes.map(node => [node.origin.occurrenceKey, node.externalId, node.kind, node.title, node.presentationOrder]),
    captured.records.map(({ key, record, order }) => [key, record.id, record.kind, record.title, order]));
  const edgeKey = (from, relation, to) => JSON.stringify([from, relation, to]);
  assert.deepEqual(graph.links.map(link => edgeKey(definitions.get(link.fromEntityId), link.relation, definitions.get(link.toEntityId))).sort(),
    captured.relationships.map(link => edgeKey(link.fromKey, link.relation, link.targetKeys[0])).sort());
  assert.equal(result.old.value.actions.length,0); assert.equal(result.old.value.releases.length,0);
  assert.equal(result.old.value.actionEvents.length,1);
  await page.waitForFunction(()=>document.querySelectorAll('.react-flow__node').length===14&&document.querySelectorAll('.react-flow__edge').length===7);
  await frame(page);
  mkdirSync(resolve('artifacts/v3a1a'),{recursive:true});
  await page.screenshot({path:resolve(`artifacts/v3a1a/${screenshotPrefix}map-1540.png`),fullPage:true,animations:'disabled'});
  const dragTarget=await page.locator('.kw-drag-handle').evaluateAll(handles=>{
    const region=document.querySelector('.kw-flow').getBoundingClientRect();
    for(const h of handles){const r=h.getBoundingClientRect();if(r.x>region.x&&r.y>region.y&&r.right<region.right-100&&r.bottom<region.bottom-80)return h.closest('.react-flow__node').getAttribute('data-id');} return null;
  });
  assert.ok(dragTarget,'A readable, draggable node is visible on initial map');
  const node=page.locator(`.react-flow__node[data-id="${dragTarget}"]`);
  const grip=node.locator('.kw-drag-handle'); const box=await grip.boundingBox();
  const beforeDrag=await node.getAttribute('style'), camera=await viewport(page);
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2); await page.mouse.down(); await page.mouse.move(box.x+box.width/2+100,box.y+box.height/2+55,{steps:12}); await page.mouse.up(); await frame(page);
  assert.notEqual(await node.getAttribute('style'),beforeDrag,'Native drag updates node geometry');
  assert.equal(await viewport(page),camera,'Dragging a node does not pan the camera');
  const geometry=await node.getAttribute('style');
  await node.locator('.kw-node-button').click(); await frame(page);
  await page.getByRole('complementary',{name:'Selected record details'}).getByRole('heading',{name:graph.nodes.find(n=>String(n.entityId)===dragTarget).title,exact:true}).waitFor();
  assert.equal(await node.getAttribute('style'),geometry,'Selection preserves node positions');
  assert.equal(await viewport(page),camera,'Selection preserves viewport');
  await page.getByRole('button',{name:'Fit map',exact:true}).click();await frame(page);
  assert.equal(await node.getAttribute('style'),geometry,'Fit changes the camera without rearranging nodes');
  const fittedCamera=await viewport(page);
  await page.getByRole('button',{name:'Arrange',exact:true}).click();
  await page.waitForFunction(({id,previous})=>document.querySelector(`.react-flow__node[data-id="${id}"]`)?.getAttribute('style')!==previous,{id:dragTarget,previous:geometry});
  assert.equal(await viewport(page),fittedCamera,'Arrange changes node geometry without resetting the camera');
  const action=graph.nodes.find(n=>n.kind==='action');
  await page.getByLabel('Search all definitions',{exact:true}).fill(action.externalId);
  await page.locator('.kw-outline-row').filter({hasText:action.title}).focus(); await page.keyboard.press('Enter');
  const inspector=page.getByRole('complementary',{name:'Selected record details'});
  await inspector.getByRole('heading',{name:action.title,exact:true}).waitFor();
  await inspector.getByText('Definition of done',{exact:true}).waitFor();
  const stored=await page.evaluate(async({projectId,entityId})=>(await window.workspace.getKnowledgeRecord({projectId,entityId})).value,{projectId:graph.project.id,entityId:action.entityId});
  assert.equal(stored.state,'proposed'); assert.equal('actionId' in stored,false);
  const sourceButton=inspector.getByRole('button',{name:'Metadata source',exact:true});
  await sourceButton.focus(); await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog'); await dialog.waitFor();
  assert.equal(await dialog.locator('pre').textContent(),original);
  assert.equal(await dialog.locator('mark').textContent(),original.slice(stored.metadata.source.span.start.utf16Offset,stored.metadata.source.span.end.utf16Offset));
  await page.screenshot({path:resolve(`artifacts/v3a1a/${screenshotPrefix}exact-source.png`),animations:'disabled'});
  await page.keyboard.press('Escape'); await frame(page);
  assert.equal(await sourceButton.evaluate(e=>document.activeElement===e),true,'Escape restores actual source opener focus');
  const priorCamera=await viewport(page);
  const priorIds=await page.locator('.react-flow__node').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-id')).sort());
  await inspector.getByRole('button',{name:'Explore connections',exact:true}).click();
  await page.getByRole('button',{name:'Back to prior map',exact:true}).waitFor();
  await page.waitForFunction(saved=>document.querySelector('.react-flow__viewport').getAttribute('style')!==saved,priorCamera);
  assert.ok(await page.locator('.react-flow__node').count()<priorIds.length,'A deliberate neighborhood focuses on native adjacent records');
  await page.screenshot({path:resolve(`artifacts/v3a1a/${screenshotPrefix}neighborhood-1540.png`),fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:'Back to prior map',exact:true}).click();await frame(page);
  assert.equal(await viewport(page),priorCamera,'Return restores prior camera');
  assert.deepEqual(await page.locator('.react-flow__node').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-id')).sort()),priorIds);
  for(const width of [1160,800]){
    await resize(application,width,820); await frame(page);
    if(width===800) {
      const back=page.getByRole('button',{name:'← Map',exact:true});
      if(await back.isVisible())await back.click();
      const browse=page.getByRole('button',{name:'Browse definitions',exact:true});
      if(await browse.getAttribute('aria-expanded')==='false')await browse.click();
      const row=page.locator('.kw-outline-row').filter({hasText:action.title});
      const compactCamera=await viewport(page);
      await row.focus();await page.keyboard.press('Enter');
      await inspector.getByRole('heading',{name:action.title,exact:true}).waitFor();
      await page.screenshot({path:resolve(`artifacts/v3a1a/${screenshotPrefix}detail-800.png`),fullPage:true,animations:'disabled'});
      await back.focus();await page.keyboard.press('Enter');await frame(page);
      assert.equal(await viewport(page),compactCamera,'Compact Back restores map viewport');
      assert.equal(await row.evaluate(element=>element===document.activeElement),true,'Compact Back restores outline opener focus');
      if(await browse.getAttribute('aria-expanded')==='true')await browse.click();
    }
    await page.screenshot({path:resolve(`artifacts/v3a1a/${screenshotPrefix}map-${width}.png`),fullPage:true,animations:'disabled'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`No horizontal page overflow at ${width}`);
  }
  await resize(application,1540,1000);
  await page.getByRole('tab',{name:'Overview',exact:true}).click();
  await page.getByRole('region',{name:'Project overview'}).waitFor();
  await page.screenshot({path:resolve(`artifacts/v3a1a/${screenshotPrefix}overview-1540.png`),fullPage:true,animations:'disabled'});
  await application.close();application=undefined; renameSync(file,join(directory,'removed-original.md'));
  application=await launchWorkspace(profile,executable);const reopened=await application.firstWindow();
  await reopened.getByRole('button',{name:'Open project Vivarium 3D Pet Generator',exact:true}).click();
  await reopened.getByRole('region',{name:'Connected knowledge map',exact:true}).waitFor();
  const recovered=await reopened.evaluate(async({projectId,entityId})=>({graph:(await window.workspace.openKnowledgeWorkspace({projectId})).value,source:(await window.workspace.getKnowledgeSource({projectId,target:{kind:'record',entityId,revision:1,part:'metadata'}})).value}),{projectId:graph.project.id,entityId:action.entityId});
  assert.deepEqual(recovered.graph,graph); assert.equal(recovered.source.document.text,original);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('empty knowledge map and failed inspector/source reads stay usable with keyboard focus fallback', {timeout:90000},async t=>{
  let application;const directory=temporaryDirectory(t,()=>application?.close());
  const file=join(directory,'empty.md');writeFileSync(file,'```ptb\n{"ptb":"0.2","kind":"project","id":"proj.empty","title":"Empty knowledge"}\n```');
  application=await launchWorkspace(join(directory,'profile'),process.env.PROJECTS_TIMELINE_EXECUTABLE);const page=await application.firstWindow();
  await page.getByRole('heading',{name:'Start with a project'}).waitFor();await choose(application,page,file);await prepare(page);
  await page.getByRole('button',{name:'Create knowledge project',exact:true}).click();
  await page.getByRole('heading',{name:'No components or features declared'}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Fit map',exact:true}).isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'Arrange',exact:true}).isDisabled(),true);
  await application.evaluate(({app})=>{
    const load=process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json');const{WorkspaceStore}=load('./dist/main/data/database.js');const original=WorkspaceStore.prototype.getKnowledgeRecord;
    WorkspaceStore.prototype.getKnowledgeRecord=function(input){WorkspaceStore.prototype.getKnowledgeRecord=original;throw Error('controlled inspector read failure');};
  });
  await page.getByRole('button',{name:'Browse saved definitions'}).click();
  await page.locator('.kw-outline-row').filter({hasText:'Empty knowledge'}).focus();await page.keyboard.press('Enter');
  const inspector=page.getByRole('complementary',{name:'Selected record details'});
  await inspector.getByRole('alert').waitFor();await inspector.getByRole('button',{name:'Retry',exact:true}).click();
  await inspector.getByText('Captured definition',{exact:true}).waitFor();
  await application.evaluate(({app})=>{
    const load=process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json');const{WorkspaceStore}=load('./dist/main/data/database.js');const original=WorkspaceStore.prototype.getKnowledgeSource;
    WorkspaceStore.prototype.getKnowledgeSource=function(input){WorkspaceStore.prototype.getKnowledgeSource=original;throw Error('controlled source read failure');};
  });
  const opener=inspector.getByRole('button',{name:'Metadata source',exact:true});await opener.focus();await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Retry source',exact:true}).click();
  await page.getByRole('dialog').waitFor();await opener.evaluate(el=>el.remove());
  await page.keyboard.press('Escape');await frame(page);
  assert.equal(await page.evaluate(()=>document.activeElement!==document.body),true,'Removed opener uses a surviving focus destination');
});

test('lost Apply acknowledgement retries same receipt; saved/read failure retries only reads', { timeout: 120000 }, async t => {
  let application; const directory=temporaryDirectory(t,()=>application?.close());
  application=await launchWorkspace(join(directory,'profile'),process.env.PROJECTS_TIMELINE_EXECUTABLE);const page=await application.firstWindow();
  await page.getByRole('heading',{name:'Start with a project'}).waitFor();
  await choose(application,page,resolve('docs/design/examples/ptb-v0.2/small/project.md'));await prepare(page);
  await application.evaluate(({app})=>{
    const load=process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json');
    const {WorkspaceStore}=load('./dist/main/data/database.js');const original=WorkspaceStore.prototype.commitKnowledgeFormation;
    WorkspaceStore.prototype.commitKnowledgeFormation=function(...args){WorkspaceStore.prototype.commitKnowledgeFormation=original;original.apply(this,args);throw Error('controlled acknowledgement lost after commit');};
  });
  await page.getByRole('button',{name:'Create knowledge project',exact:true}).click();
  await page.getByRole('button',{name:'Check saved result / Retry',exact:true}).waitFor();
  assert.equal((await page.evaluate(()=>window.workspace.listProjects())).value.length,1);
  await application.evaluate(({app})=>{
    const load=process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json');
    const {WorkspaceStore}=load('./dist/main/data/database.js');const original=WorkspaceStore.prototype.openKnowledgeWorkspace;
    WorkspaceStore.prototype.openKnowledgeWorkspace=function(input){WorkspaceStore.prototype.openKnowledgeWorkspace=original;throw Error('controlled post-save read failure');};
  });
  await page.getByRole('button',{name:'Check saved result / Retry',exact:true}).click();
  await page.getByText('Project created, but saved data could not be loaded. Retry loading; creation will not be repeated.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Retry loading',exact:true}).click();
  await page.getByRole('region',{name:'Connected knowledge map',exact:true}).waitFor();
  const state=await page.evaluate(async()=>{const p=(await window.workspace.listProjects()).value;return{count:p.length,events:(await window.workspace.openProject({projectId:p[0].id})).value.actionEvents};});
  assert.equal(state.count,1);assert.equal(state.events.length,1);
});

test('process interruption during real formation rolls back on restart and recapture creates one project', { timeout: 120000 }, async t => {
  let application; const directory=temporaryDirectory(t,()=>application?.close().catch(()=>{}));
  const profile=join(directory,'profile');
  application=await launchWorkspace(profile,process.env.PROJECTS_TIMELINE_EXECUTABLE);let page=await application.firstWindow();
  await page.getByRole('heading',{name:'Start with a project'}).waitFor();
  const fixture=resolve('docs/design/examples/ptb-v0.2/small/project.md');
  await choose(application,page,fixture);await prepare(page);
  await application.evaluate(({app})=>{
    const load=process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json');
    const data=load('./dist/main/data/knowledge.js'),original=data.formKnowledge;
    data.formKnowledge=function(db,...args){
      const prepare=db.prepare.bind(db);
      db.prepare=function(sql){const statement=prepare(sql);if(sql.startsWith('INSERT INTO knowledge_relationships')){
        const run=statement.run.bind(statement);statement.run=function(...values){run(...values);process.kill(process.pid,'SIGKILL');};
      }return statement;};
      return original(db,...args);
    };
  });
  const exit=once(application.process(),'exit');
  await page.getByRole('button',{name:'Create knowledge project',exact:true}).click().catch(()=>{});
  const [code,signal]=await exit; assert.ok(code!==0||signal,'The owned test main process was forcibly interrupted'); application=undefined;
  application=await launchWorkspace(profile,process.env.PROJECTS_TIMELINE_EXECUTABLE);page=await application.firstWindow();
  await page.getByRole('heading',{name:'Start with a project'}).waitFor();
  assert.equal((await page.evaluate(()=>window.workspace.listProjects())).value.length,0);
  await choose(application,page,fixture);await form(page);
  const data=await page.evaluate(async()=>{const projects=(await window.workspace.listProjects()).value;return {projects,graph:(await window.workspace.openKnowledgeWorkspace({projectId:projects[0].id})).value,legacy:(await window.workspace.openProject({projectId:projects[0].id})).value};});
  assert.equal(data.projects.length,1);assert.equal(data.graph.nodes.length,15);assert.equal(data.graph.links.length,29);
  assert.equal(data.legacy.actions.length,0);assert.equal(data.legacy.actionEvents.length,1);
});
