import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { launchWorkspace, saveCheckpoint } from '../electron-flow.mjs';
import { temporaryDirectory } from '../helpers.mjs';

const executable = process.env.PROJECTS_TIMELINE_EXECUTABLE;
const artifacts = resolve('artifacts/v3a1a-stabilization', executable ? 'packaged' : 'electron');
const button = (page, name) => page.getByRole('button', { name, exact: typeof name === 'string' });
const tab = (page, name) => page.getByRole('tab', { name, exact: true });
const inspector = page => page.getByRole('complementary', { name: 'Selected record details' });
const canvas = page => page.locator('.kw-flow');
const camera = page => page.locator('.react-flow__viewport').evaluate(el => el.style.transform);
const zoom = page => page.locator('.kw-zoom-value').innerText();
const focused = locator => locator.evaluate(el => document.activeElement === el);
const frames = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
const enter = async locator => { await locator.focus(); await locator.press('Enter'); };
const screenshot = async (page, name) => {
  mkdirSync(artifacts, { recursive: true });
  await page.screenshot({ path: join(artifacts, name + '.png'), animations: 'disabled' });
};

async function resize(app, page, width) {
  const height = width === 1540 ? 1000 : 820;
  await app.evaluate(({ BrowserWindow }, [w, h]) => BrowserWindow.getAllWindows()[0].setSize(w, h), [width, height]);
  await frames(page);
}

async function openApp(t) {
  let app;
  const directory = temporaryDirectory(t, () => app?.close());
  app = await launchWorkspace(join(directory, 'profile'), executable);
  const page = await app.firstWindow();
  await page.getByRole('heading', { name: 'Start with a project', exact: true }).waitFor();
  return { app, page, directory };
}

async function form(app, page, path, title) {
  await app.evaluate(({ dialog }, file) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] }); }, path);
  await button(page, 'Preview blueprint').click();
  await button(page, 'Review project formation').click();
  await button(page, 'Create knowledge project').click();
  await page.getByRole('region', { name: 'Project knowledge workspace' }).getByRole('heading', { name: title, exact: true }).waitFor();
  await button(page, 'Fit map').waitFor();
  await page.waitForFunction(() => !document.querySelector('.kw-map-actions button[title^="Rearrange"]')?.disabled);
  await frames(page);
}

function snapshot(page, title) {
  return page.evaluate(async name => {
    const result = await window.workspace.listProjects();
    if (!result.ok) throw Error(result.error.message);
    const project = result.value.find(item => item.name === name);
    const [knowledge, legacy] = await Promise.all([window.workspace.openKnowledgeWorkspace({ projectId: project.id }), window.workspace.openProject({ projectId: project.id })]);
    if (!knowledge.ok || !legacy.ok) throw Error('Could not read saved workspace');
    return { graph: knowledge.value, legacy: legacy.value };
  }, title);
}

async function fit(page) {
  await button(page, 'Fit map').click();
  await page.waitForFunction(() => {
    const flow = document.querySelector('.kw-flow').getBoundingClientRect();
    const cards = [...document.querySelectorAll('.react-flow__node')];
    return cards.length > 0 && cards.every(card => {
      const r = card.getBoundingClientRect();
      return r.left >= flow.left + 7 && r.right <= flow.right - 7 && r.top >= flow.top + 7 && r.bottom <= flow.bottom - 7;
    });
  }, null, { timeout: 4000 });
  await frames(page);
}

const positions = page => page.locator('.react-flow__node').evaluateAll(nodes =>
  Object.fromEntries(nodes.map(node => [node.dataset.id, node.style.transform])));

async function revealInCanvas(page, card) {
  await card.waitFor();
  await page.waitForFunction(label => {
    const flow = document.querySelector('.kw-flow').getBoundingClientRect();
    const item = [...document.querySelectorAll('.kw-node-button')].find(node => node.getAttribute('aria-label') === label);
    const r = item?.closest('.react-flow__node')?.getBoundingClientRect();
    return r && r.left >= flow.left + 6 && r.right <= flow.right - 6 && r.top >= flow.top + 6 && r.bottom <= flow.bottom - 6;
  }, await card.getAttribute('aria-label'), { timeout: 4000 });
}

async function useOutline(page, nativeId, title) {
  const browse = button(page, 'Browse definitions');
  if (await browse.isVisible() && await browse.getAttribute('aria-expanded') === 'false') await browse.click();
  await page.getByLabel('Search all definitions').fill(nativeId);
  await enter(page.locator('.kw-outline-row').filter({ hasText: title }));
  await inspector(page).getByRole('heading', { name: title, exact: true }).waitFor();
}

test('Vivarium expansion, directed edge captions, exact source and two-step Back preserve graph and UI state', { timeout: 120000 }, async t => {
  const { app, page } = await openApp(t);
  const title = 'Vivarium 3D Pet Generator';
  const action = 'Define the PetDNA schema and codec';
  const feature = 'Pet DNA schema';
  const requirement = 'DNA captures every visual parameter';
  await resize(app, page, 1540);
  await form(app, page, resolve('tests/fixtures/vivarium/project.md'), title);
  const saved = await snapshot(page, title);
  const id = external => saved.graph.nodes.find(node => node.externalId === external).entityId;
  const relationship = saved.graph.links.find(link => link.fromEntityId === id('act.define-dna-schema') && link.toEntityId === id('req.dna-completeness'));
  const direct = saved.graph.links.find(link => link.fromEntityId === id('act.define-dna-schema') && link.toEntityId === id('feat.dna-schema'));
  assert.equal(relationship.relation, 'addresses-requirement');
  assert.equal(direct.relation, 'concerns-feature');
  const readSource = () => page.evaluate(input => window.workspace.getKnowledgeSource(input), {
    projectId: saved.graph.project.id, target: { kind: 'relationship', relationshipId: relationship.relationshipId },
  });
  const original = await readSource();
  assert.equal(original.ok, true);
  assert.equal(await zoom(page), '82%');
  const initial = await positions(page);
  assert.equal(await button(page, 'Expand Renderer, scene, and camera').count(), 0);
  const expand = button(page, 'Expand Procedural anatomy generation');
  await enter(expand);
  const child = button(page, 'Component: Body silhouette and proportions');
  await revealInCanvas(page, child);
  assert.equal(await button(page, 'Collapse Procedural anatomy generation').getAttribute('aria-expanded'), 'true');
  const expanded = await positions(page);
  for (const [nodeId, position] of Object.entries(initial)) assert.equal(expanded[nodeId], position);
  assert.ok(await page.locator('.react-flow__edge[aria-label*="parent component"]').count());
  await fit(page);
  assert.deepEqual(await positions(page), expanded);
  await button(page, 'Collapse Procedural anatomy generation').click();
  await child.waitFor({ state: 'detached' });
  await fit(page);
  await expand.click();
  await revealInCanvas(page, child);
  await useOutline(page, 'cmp.anatomy', 'Procedural anatomy generation');
  const initialCamera = await camera(page);
  await resize(app, page, 1160);
  assert.equal(await camera(page), initialCamera);
  assert.ok((await canvas(page).boundingBox()).width > 470, 'The inspector leaves a usable mid-width canvas');
  assert.equal(await page.getByRole('complementary', { name: 'Knowledge outline' }).isVisible(), false);
  await fit(page);
  await screenshot(page, 'vivarium-expanded-fit-1160');
  await button(inspector(page), 'Close record details').click();
  await resize(app, page, 1540);
  await fit(page);
  await button(page, 'Collapse Procedural anatomy generation').click();
  await child.waitFor({ state: 'detached' });
  await useOutline(page, 'act.define-dna-schema', action);
  const relationButton = inspector(page).getByRole('button', { name: requirement + ' Requirement' });
  await enter(relationButton);
  await inspector(page).getByText('Acceptance criteria', { exact: true }).waitFor();
  await revealInCanvas(page, button(page, 'Requirement: ' + requirement));
  assert.equal(await inspector(page).evaluate(el => el.scrollTop), 0);
  assert.equal(await inspector(page).locator('.kw-field dd').first().evaluate(el =>
    parseFloat(getComputedStyle(el).fontSize) >= 14 && el.getBoundingClientRect().width >= el.closest('aside').clientWidth * .85), true);
  assert.equal(await focused(inspector(page).getByRole('heading', { name: requirement, exact: true })), true);
  await useOutline(page, 'act.define-dna-schema', action);
  const openSource = button(inspector(page), 'Source: addresses requirement · ' + requirement);
  await openSource.focus();
  const scrollBeforeSource = await inspector(page).evaluate(el => el.scrollTop);
  assert.ok(scrollBeforeSource > 0);
  await openSource.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  assert.equal(await dialog.locator('pre').textContent(), original.value.document.text);
  const { start, end } = original.value.selection.span;
  assert.equal(await dialog.locator('mark').textContent(), original.value.document.text.slice(start.utf16Offset, end.utf16Offset));
  await screenshot(page, 'exact-relationship-source');
  await page.keyboard.press('Escape');
  await frames(page);
  assert.equal(await focused(openSource), true);
  assert.equal(await inspector(page).evaluate(el => el.scrollTop), scrollBeforeSource);

  const explore = button(inspector(page), 'Explore connections');
  const back = button(page, 'Back to prior map');
  await explore.focus();
  const atlas = { positions: await positions(page), camera: await camera(page), scroll: await inspector(page).evaluate(el => el.scrollTop) };
  await explore.press('Enter');
  await back.waitFor();
  await frames(page);
  assert.equal(await focused(back), true);
  await fit(page);
  const directEdge = page.locator(`.react-flow__edge[data-id="${direct.relationshipId}"]`);
  assert.equal(await directEdge.getAttribute('aria-label'), action + ' · concerns feature → ' + feature);
  const incomingIds = new Set(saved.graph.links.filter(link => link.toEntityId === id('feat.dna-schema')).map(link => String(link.relationshipId)));
  const incoming = await page.locator('.react-flow__edge').evaluateAll((edges, ids) =>
    edges.filter(edge => ids.includes(edge.dataset.id)).map(edge => {
      const path = edge.querySelector('.react-flow__edge-path');
      const tip = path.getPointAtLength(path.getTotalLength());
      return [tip.x, tip.y, !!path.getAttribute('marker-end')];
    }), [...incomingIds]);
  assert.ok(incoming.length > 1 && incoming.every(([, , marked]) => marked));
  assert.equal(new Set(incoming.map(([, y]) => y)).size, incoming.length, 'Converging arrows have distinct tips');
  for (const width of [1540, 1160, 800, 1540]) {
    const prior = await camera(page);
    await resize(app, page, width);
    assert.equal(await camera(page), prior, 'Resize preserves viewport');
    await fit(page);
    await directEdge.focus();
    assert.equal(await focused(directEdge), true);
    const caption = page.locator('.kw-edge-caption');
    assert.equal(await caption.textContent(), action + ' · concerns feature → ' + feature);
    assert.equal(await caption.evaluate(el => {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const luminance = color => color.reduce((sum, value, index) => {
        const s = value / 255;
        return sum + [.2126, .7152, .0722][index] * (s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4);
      }, 0);
      const background = luminance([28, 30, 42]);
      const contrast = color => (luminance(color.match(/\d+/g).slice(0, 3).map(Number)) + .05) / (background + .05);
      const stroke = getComputedStyle(document.activeElement.querySelector('.react-flow__edge-path')).stroke;
      return parseFloat(style.fontSize) >= 12 && el.scrollWidth <= el.clientWidth &&
        r.top >= document.querySelector('.kw-flow').getBoundingClientRect().bottom && contrast(style.color) >= 4.5 && contrast(stroke) >= 3;
    }), true, 'Full edge label sits in a legible caption outside the canvas');
    if (width !== 1540) await page.locator('.kw-map-region').scrollIntoViewIfNeeded();
    else await page.evaluate(() => scrollTo(0, 0));
    await screenshot(page, 'vivarium-neighborhood-' + width);
  }
  const beforeTab = { camera: await camera(page), positions: await positions(page) };
  await tab(page, 'Overview').click();
  await tab(page, 'Map').click();
  await frames(page);
  assert.equal(await camera(page), beforeTab.camera);
  assert.deepEqual(await positions(page), beforeTab.positions);
  assert.equal(await back.isVisible(), true, 'Neighborhood history survives switching views');
  await enter(inspector(page).getByRole('button', { name: feature + ' Feature' }));
  await inspector(page).getByRole('heading', { name: feature, exact: true }).waitFor();
  await explore.focus(); await frames(page);
  const first = { positions: await positions(page), camera: await camera(page), scroll: await inspector(page).evaluate(el => el.scrollTop) };
  await explore.press('Enter');
  await page.locator('.kw-anchor-banner strong').getByText(feature, { exact: true }).waitFor();
  await enter(back);
  await page.locator('.kw-anchor-banner strong').getByText(action, { exact: true }).waitFor();
  await frames(page);
  assert.deepEqual(await positions(page), first.positions);
  assert.equal(await camera(page), first.camera);
  assert.equal(await inspector(page).evaluate(el => el.scrollTop), first.scroll);
  assert.equal(await focused(explore), true);
  await enter(back);
  await back.waitFor({ state: 'detached' });
  await frames(page);
  assert.deepEqual(await positions(page), atlas.positions);
  assert.equal(await camera(page), atlas.camera);
  assert.equal(await inspector(page).evaluate(el => el.scrollTop), atlas.scroll);
  assert.equal(await focused(explore), true);
  await resize(app, page, 800);
  const compactBack = button(page, '← Map');
  if (await compactBack.isVisible()) await enter(compactBack);
  await useOutline(page, 'act.define-dna-schema', action);
  await screenshot(page, 'vivarium-inspector-800');
  const compactAtlas = await camera(page);
  await enter(explore);
  await fit(page);
  const compactNeighborhood = await camera(page);
  await enter(button(page, 'Feature: ' + feature));
  await enter(explore);
  await page.locator('.kw-anchor-banner strong').getByText(feature, { exact: true }).waitFor();
  await enter(back);
  await inspector(page).getByRole('heading', { name: feature, exact: true }).waitFor();
  await frames(page);
  assert.equal(await focused(explore), true);
  await enter(compactBack); await frames(page);
  assert.equal(await camera(page), compactNeighborhood);
  await enter(back);
  await inspector(page).getByRole('heading', { name: action, exact: true }).waitFor();
  await enter(compactBack); await frames(page);
  assert.equal(await camera(page), compactAtlas);
  assert.deepEqual(await readSource(), original);
  assert.deepEqual(await snapshot(page, title), saved, 'Graph, receipt, actions, releases and audit survive renderer interaction unchanged');
});

test('FieldLedger fits all widths, keeps pointer and keyboard controls usable, and exposes stored files and journal', { timeout: 120000 }, async t => {
  const { app, page } = await openApp(t);
  const title = 'FieldLedger';
  await resize(app, page, 1540);
  await form(app, page, resolve('docs/design/examples/ptb-v0.2/complex/project.md'), title);
  const projectId = (await snapshot(page, title)).graph.project.id;
  await page.evaluate(async id => {
    const value = result => {
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    };
    const { template } = value(await window.workspace.getWorkflowLibrary()).find(item => item.template.builtInKey);
    const release = value(await window.workspace.createRelease({
      projectId: id, name: 'Preserved release progress', templateId: template.id, templateVersion: template.version,
    }));
    const work = value(await window.workspace.openProject({ projectId: id })).actions.find(action => action.releaseId === release.id && action.kind === 'work');
    value(await window.workspace.completeAction({ projectId: id, actionId: work.id }));
  }, projectId);
  const before = await snapshot(page, title);
  assert.deepEqual([before.graph.nodes.length, before.graph.links.length], [37, 82]);
  assert.ok(before.legacy.releases[0].progress.percent > 0);
  for (const width of [1540, 1160, 800]) {
    await resize(app, page, width);
    await fit(page);
    const old = await camera(page);
    await button(page, 'Zoom in').click();
    await frames(page);
    assert.notEqual(await camera(page), old);
    await button(page, /Reset to readable zoom/).click();
    await frames(page);
    assert.equal(await zoom(page), '82%');
    await fit(page);
    const panned = await camera(page);
    await canvas(page).scrollIntoViewIfNeeded();
    const area = await canvas(page).boundingBox();
    await page.mouse.move(area.x + 12, area.y + 12);
    await page.mouse.down(); await page.mouse.move(area.x + 56, area.y + 38, { steps: 6 }); await page.mouse.up();
    await frames(page);
    assert.notEqual(await camera(page), panned, 'Pointer pan changes translation');
    await fit(page);
    const fixed = await camera(page);
    const geometry = await positions(page);
    const grip = canvas(page).locator('.kw-drag-handle').first();
    const box = await grip.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 18, box.y + box.height / 2 + 15, { steps: 5 }); await page.mouse.up();
    await frames(page);
    const dragged = await positions(page);
    assert.notDeepEqual(dragged, geometry, 'Real drag changes card geometry');
    assert.equal(await camera(page), fixed);
    await button(page, 'Arrange').click();
    await page.waitForFunction(prior => [...document.querySelectorAll('.react-flow__node')].some(node =>
      node.style.transform !== prior[node.dataset.id]), dragged);
    assert.equal(await camera(page), fixed);
    await fit(page);
    if (width === 800) {
      assert.equal(await page.getByRole('complementary', { name: 'Project navigation' }).isVisible(), false);
      await enter(button(page, 'Projects & navigation'));
      await button(page, 'Home').focus();
      await page.keyboard.press('Escape');
      assert.equal(await focused(button(page, 'Projects & navigation')), true);
      assert.equal(await page.locator('.react-flow__minimap').isVisible(), false);
    }
    await screenshot(page, 'fieldledger-fit-' + width);
  }
  const stable = await camera(page);
  const stablePositions = await positions(page);
  await tab(page, 'Map').focus();
  await page.keyboard.press('End');
  assert.equal(await focused(tab(page, 'Captured sources')), true);
  await page.getByRole('region', { name: 'Captured files' }).waitFor();
  const file = button(page, 'work.md');
  await enter(file);
  await page.getByRole('dialog').getByRole('heading', { name: 'work.md', exact: true }).waitFor();
  await page.keyboard.press('Escape'); await frames(page);
  assert.equal(await focused(file), true);
  await screenshot(page, 'fieldledger-captured-sources-800');
  await tab(page, 'Captured sources').focus();
  await page.keyboard.press('Home'); await frames(page);
  assert.equal(await focused(tab(page, 'Map')), true);
  assert.equal(await camera(page), stable);
  assert.deepEqual(await positions(page), stablePositions);
  await enter(button(page, 'Projects & navigation'));
  await enter(button(page, 'Open FieldLedger'));
  await page.waitForFunction(() => document.activeElement.id === 'workspace-main');
  assert.equal(await camera(page), stable);
  assert.deepEqual(await positions(page), stablePositions);
  assert.deepEqual(await snapshot(page, title), before, 'Camera and layout preserve all stored engineering work');
  assert.equal(await button(page, 'Resume').isVisible(), false);
  const journal = button(page, 'Journal');
  const toolsBack = button(page, '← Back to knowledge workspace');
  await enter(journal); await frames(page);
  assert.equal(await focused(page.getByRole('heading', { name: 'Checkpoint', exact: true })), true);
  assert.equal(await page.getByRole('heading', { name: 'Resume Development', exact: true }).isVisible(), false);
  await saveCheckpoint(page, 'Reviewed the authored graph', 'Continue from the saved project journal');
  await enter(toolsBack); await frames(page);
  assert.equal(await focused(journal), true);
  assert.equal(await camera(page), stable);
  const resume = button(page, 'Resume');
  await enter(resume); await frames(page);
  assert.equal(await focused(page.getByRole('heading', { name: 'Resume Development', exact: true })), true);
  await page.getByText('Continue from the saved project journal', { exact: true }).first().waitFor();
  await enter(toolsBack); await frames(page);
  assert.equal(await focused(resume), true);
  await enter(button(page, 'Project tools')); await frames(page);
  assert.equal(await focused(page.locator('#project-title')), true);
  await page.getByRole('heading', { name: 'Releases', exact: true }).waitFor();
  await page.getByRole('combobox', { name: 'Selected release', exact: true }).selectOption(String(before.legacy.releases[0].release.id));
  await page.locator('.release-summary').getByText(before.legacy.releases[0].progress.percent.toFixed(2) + '%', { exact: true }).waitFor();
  await enter(toolsBack); await frames(page);
  assert.equal(await focused(button(page, 'Project tools')), true);
});

test('small and larger blueprints retain bounded, navigable canvas projections', { timeout: 120000 }, async t => {
  const { app, page, directory } = await openApp(t);
  await resize(app, page, 1160);
  const start = performance.now();
  await form(app, page, resolve('docs/design/examples/ptb-v0.2/small/project.md'), 'Desk Notes');
  await fit(page);
  const small = await snapshot(page, 'Desk Notes');
  t.diagnostic(`Desk Notes ${small.graph.nodes.length} definitions / ${small.graph.links.length} relationships, reviewed formation through Fit ${Math.round(performance.now() - start)} ms`);
  assert.deepEqual([small.graph.nodes.length, small.graph.links.length], [15, 29]);
  await button(page, 'Home').click();
  const project = 'proj.stabilization-scale';
  const records = [{ kind: 'project', id: project, title: 'Stabilization scale fixture' }];
  for (let index = 1; index <= 85; index++) {
    records.push({ kind: 'component', id: `cmp.sample-${index}`, title: `Module ${index}`, project });
    records.push({ kind: 'feature', id: `feat.sample-${index}`, title: `Feature ${index}`, project, component: `cmp.sample-${index}` });
  }
  const file = join(directory, 'scale.md');
  writeFileSync(file, records.map(record => '```ptb\n' + JSON.stringify({ ptb: '0.2', ...record }) + '\n```').join('\n\n'));
  const largeStart = performance.now();
  await form(app, page, file, 'Stabilization scale fixture');
  const large = await snapshot(page, 'Stabilization scale fixture');
  assert.deepEqual([large.graph.nodes.length, large.graph.links.length], [171, 85]);
  assert.equal(Object.keys(await positions(page)).length, 40);
  const beforeFit = performance.now();
  await fit(page);
  t.diagnostic(`Large fixture 171/85, 40 cards at ${await zoom(page)}. Formation through ready ${Math.round(beforeFit - largeStart)} ms, Fit ${Math.round(performance.now() - beforeFit)} ms`);
  await screenshot(page, 'large-fit-1160');
  await useOutline(page, 'feat.sample-85', 'Feature 85');
  await revealInCanvas(page, button(page, 'Feature: Feature 85'));
  assert.equal(Object.keys(await positions(page)).length, 40);
  await enter(button(inspector(page), 'Explore connections'));
  await button(page, 'Back to prior map').waitFor();
  await fit(page);
  assert.equal(Object.keys(await positions(page)).length, 2);
  assert.deepEqual(await snapshot(page, 'Stabilization scale fixture'), large);
});
