import { _electron as electron } from 'playwright';
import { resolve } from 'node:path';

export async function launchWorkspace(dataDirectory, executablePath) {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  return electron.launch({
    executablePath,
    args: [...(executablePath ? [] : [resolve('.')]), `--data-dir=${dataDirectory}`],
    env,
    timeout: 20000,
  });
}

export async function createProject(page, name) {
  await page.getByLabel('Project name', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.getByRole('button', { name: `Open ${name}`, exact: true }).waitFor();
}

export async function openProject(page, name) {
  await page.getByRole('button', { name: `Open ${name}`, exact: true }).click();
  await page.getByRole('heading', { name, exact: true }).waitFor();
}

export async function saveCheckpoint(page, accomplished, nextSteps) {
  await page.getByLabel('What I accomplished', { exact: true }).fill(accomplished);
  await page.getByLabel('What to do next', { exact: true }).fill(nextSteps);
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Checkpoint saved.' }).waitFor();
}
