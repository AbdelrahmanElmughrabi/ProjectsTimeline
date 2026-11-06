import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { temporaryDirectory } from '../helpers.mjs';
import { launchWorkspace, createProject, openProject, saveCheckpoint } from '../electron-flow.mjs';

async function resize(application, page, width) {
  await application.evaluate(({ BrowserWindow }, value) => BrowserWindow.getAllWindows()[0].setSize(value, 900), width);
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
}

async function capture(page, name, fullPage = true) {
  mkdirSync(resolve('artifacts'), { recursive: true });
  await page.screenshot({ path: resolve(`artifacts/${name}.png`), fullPage, animations: 'disabled' });
}

async function layout(page) {
  return page.evaluate(() => {
    const bounds = (selector) => {
      const { x, y, width, height, right, bottom } = document.querySelector(selector).getBoundingClientRect();
      return { x, y, width, height, right, bottom };
    };
    return { width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth,
      resume: bounds('.resume-panel'), actions: bounds('.action-panel'), sidebar: bounds('.sidebar') };
  });
}

async function assertReadableContrast(page, selector, minimum = 4.5) {
  const ratio = await page.locator(selector).first().evaluate((element) => {
    const rgb = (color) => color.match(/[\d.]+/g).map(Number);
    const foreground = rgb(getComputedStyle(element).color);
    let background;
    for (let node = element; node; node = node.parentElement) {
      const candidate = rgb(getComputedStyle(node).backgroundColor);
      if (candidate.length === 3 || candidate[3] === 1) { background = candidate; break; }
    }
    if (!background) throw new Error('No opaque background found for contrast check.');
    const luminance = (values) => values.slice(0, 3).map(value => value / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
      .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const a = luminance(foreground), b = luminance(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });
  assert.ok(ratio >= minimum, `${selector} contrast ${ratio.toFixed(2)} is below ${minimum}`);
}

test('dark workspace is keyboard usable, Resume-first when compact and readable at all proposed sizes', { timeout: 120000 }, async (t) => {
  let application;
  const directory = temporaryDirectory(t, () => application?.close());
  application = await launchWorkspace(directory);
  const page = await application.firstWindow();
  const exceptions = [];
  page.on('pageerror', (error) => exceptions.push(error.message));
  await page.getByRole('heading', { name: 'Start with a project', exact: true }).waitFor();
  await resize(application, page, 800);
  await capture(page, 'visual-empty-workspace');

  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to workspace', exact: true });
  assert.equal(await skip.evaluate(element => element === document.activeElement), true);
  assert.ok((await skip.boundingBox()).y >= 0);
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'workspace-main');
  assert.equal(page.url(), 'app://workspace/index.html', 'Skipping to content must preserve the trusted IPC document URL');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.getByRole('button', { name: 'Create project', exact: true }).evaluate(element => element === document.activeElement), true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'project-name');
  await page.keyboard.type('ProjectsTimeline');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Open ProjectsTimeline', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Open ProjectsTimeline', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('heading', { name: 'ProjectsTimeline', exact: true }).waitFor();
  const resume = page.getByRole('region', { name: 'Resume Development', exact: true });
  await resume.getByText(/No checkpoint yet/).waitFor();
  await capture(page, 'visual-empty-project');

  await resume.getByRole('button', { name: 'Save your first checkpoint', exact: true }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'accomplished');
  await page.keyboard.type('Applied graphite and violet surfaces.\nPreserved SQLite and IPC boundaries.');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'next-steps');
  await page.keyboard.type('Review keyboard navigation and the compact Resume layout.');
  await page.keyboard.press('Tab');
  assert.equal(await page.getByRole('button', { name: 'Save checkpoint', exact: true }).evaluate(element => element === document.activeElement), true);
  await page.keyboard.press('Enter');
  await page.getByRole('status').filter({ hasText: /^Checkpoint saved\.$/ }).waitFor();
  await resume.getByRole('button', { name: 'Continue with actions', exact: true }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'action-title');
  await page.keyboard.type('Apply the visual foundation');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  const complete = page.getByRole('button', { name: 'Complete Apply the visual foundation', exact: true });
  await complete.waitFor();
  await complete.focus();
  await page.keyboard.press('Enter');
  await page.getByText('Completed', { exact: true }).waitFor();
  await page.getByLabel('Action title', { exact: true }).fill('Review the visual foundation');
  await page.getByRole('button', { name: 'Add action', exact: true }).click();
  await page.getByRole('button', { name: 'Complete Review the visual foundation', exact: true }).waitFor();
  await openProject(page, 'ProjectsTimeline');

  for (const width of [800, 1160, 1440]) {
    await resize(application, page, width);
    await page.evaluate(() => scrollTo(0, 0));
    const view = await layout(page);
    assert.ok(view.documentWidth <= view.width, `Horizontal overflow at outer width ${width}`);
    assert.equal(await page.getByRole('region', { name: 'Resume Development', exact: true }).count(), 1);
    assert.ok(view.resume.right <= view.width && view.actions.right <= view.width);
    if (view.width < 1120) {
      assert.ok(view.resume.bottom <= view.actions.y, 'Compact Resume must precede Actions');
      assert.ok(view.resume.y < view.height / 2, 'Compact Resume must be prominent in the first viewport');
    } else {
      assert.ok(view.resume.x >= view.actions.right, 'Wide Resume must sit beside the working column');
      assert.ok(Math.abs(view.resume.y - view.actions.y) < 2);
    }
    await capture(page, `visual-${width}`);
  }

  for (const selector of ['.resume-context p', '.resume-saved', '.field label', '.project-link.selected', '.button-primary']) {
    await assertReadableContrast(page, selector);
  }
  const continueButton = resume.getByRole('button', { name: 'Continue with actions', exact: true });
  await continueButton.hover();
  await page.evaluate(() => new Promise(done => setTimeout(done, 160)));
  await assertReadableContrast(page, '.resume-footer .button-primary');
  await page.keyboard.press('Tab');
  await continueButton.focus();
  const focus = await continueButton.evaluate(element => {
    const style = getComputedStyle(element);
    return { visible: element.matches(':focus-visible'), width: parseFloat(style.outlineWidth), style: style.outlineStyle };
  });
  assert.equal(focus.visible, true);
  assert.ok(focus.width >= 2 && focus.style !== 'none');
  await capture(page, 'visual-keyboard-focus');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await continueButton.hover();
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
  assert.equal(await page.evaluate(() => document.getAnimations().some(animation => animation.playState === 'running')), false);
  assert.deepEqual(exceptions, []);
  assert.equal(await page.locator('.sidebar').getByRole('button', { name: /^(Ideas|Engineering|Testing|Release)$/ }).count(), 0);
  assert.equal(await page.locator('.sidebar').getByRole('button', { name: 'Workflows', exact: true }).count(), 1);
});

test('maximum-length saved content wraps and remains reachable in compact and wide workspaces', { timeout: 120000 }, async (t) => {
  let application;
  const directory = temporaryDirectory(t, () => application?.close());
  application = await launchWorkspace(directory);
  const page = await application.firstWindow();
  const name = ('工程研究 — ' + 'ResumableProject'.repeat(8)).slice(0, 120);
  await createProject(page, name);
  await openProject(page, name);
  const title = ('Review long content ' + 'UnbrokenReference'.repeat(20)).slice(0, 300);
  await page.getByLabel('Action title', { exact: true }).fill(title);
  await page.getByRole('button', { name: 'Add action', exact: true }).click();
  await page.getByRole('button', { name: `Complete ${title}`, exact: true }).waitFor();
  const accomplishment = 'Context recovery confirmed. '.repeat(400).slice(0, 9999) + 'Z';
  const nextSteps = 'Review the next engineering decision. '.repeat(300).slice(0, 9999) + 'Z';
  await saveCheckpoint(page, accomplishment, nextSteps);
  for (const width of [800, 1160, 1440]) {
    await resize(application, page, width);
    const view = await layout(page);
    assert.ok(view.documentWidth <= view.width, `Long content overflow at ${width}`);
    const project = await page.getByRole('button', { name: `Open ${name}`, exact: true }).boundingBox();
    assert.ok(project.x + project.width <= view.sidebar.right);
  }
  await resize(application, page, 800);
  const resume = page.getByRole('region', { name: 'Resume Development', exact: true });
  assert.equal(await resume.locator('.resume-context p').first().innerText(), accomplishment);
  await resume.getByRole('button', { name: 'Continue with actions', exact: true }).click();
  const input = page.getByLabel('Action title', { exact: true });
  assert.equal(await input.evaluate(element => element === document.activeElement), true);
  const box = await input.boundingBox();
  assert.ok(box.y >= 0 && box.y < (await page.evaluate(() => innerHeight)));
  await page.evaluate(() => scrollTo(0, 0));
  await capture(page, 'visual-long-content', false);
});
