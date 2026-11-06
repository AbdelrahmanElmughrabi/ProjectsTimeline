import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateReleaseProgress } from '../../dist/main/progress.js';

const fixture = (stageCount = 7) => ({
  releaseId: 41,
  stages: Array.from({ length: stageCount }, (_, i) => ({ id: i + 1, included: true })),
  actions: [
    ...Array.from({ length: stageCount }, (_, i) => ({
      id: 100 + i, stageId: i + 1, committed: true, applicable: true,
      completed: false, kind: 'work',
    })),
    { id: 900, stageId: stageCount, committed: true, applicable: true, completed: false, kind: 'release-confirmation' },
  ],
});

test('equal stage weights and explicitly changing the included set', () => {
  const seven = fixture();
  seven.actions.slice(0, 3).forEach((action) => { action.completed = true; });
  assert.equal(calculateReleaseProgress(seven).percent, (3 / 7) * 100);

  const weighted = fixture();
  weighted.actions[0].completed = true;
  weighted.actions.push(...Array.from({ length: 99 }, (_, i) => ({
    id: 1000 + i, stageId: 2, committed: true, applicable: true, completed: false, kind: 'work',
  })));
  const eight = fixture(8);
  eight.actions.slice(0, 3).forEach((action) => { action.completed = true; });
  eight.actions[7].stageId = 8;
  assert.equal(calculateReleaseProgress(weighted).percent, 100 / 7);
  assert.equal(calculateReleaseProgress(eight).percent, (3 / 8) * 100);
  eight.stages[7].included = false;
  eight.actions[7].committed = false;
  eight.actions.find((action) => action.kind === 'release-confirmation').stageId = 7;
  const excluded = calculateReleaseProgress(eight);
  assert.equal(excluded.percent, (3 / 7) * 100);
  assert.equal(excluded.stages.length, 7);
  eight.actions.push({ id: 901, stageId: 8, committed: true, applicable: false, completed: false, kind: 'work' });
  assert.equal(calculateReleaseProgress(eight).percent, excluded.percent);
});

test('only committed applicable actions affect counts, current stage, and exclusion results', () => {
  const input = fixture();
  input.actions[0].completed = true;
  input.actions.push(
    { id: 901, stageId: 1, committed: false, applicable: true, completed: true, kind: 'work' },
    { id: 902, stageId: 1, committed: true, applicable: false, completed: false, kind: 'work' },
    { id: 903, stageId: 1, committed: true, applicable: true, completed: false, kind: 'work' },
  );
  const before = calculateReleaseProgress(input);
  assert.deepEqual([before.stages[0].completedActions, before.stages[0].totalActions], [1, 2]);
  assert.equal(before.currentStageId, 1);
  input.actions.find((action) => action.id === 903).applicable = false;
  const excluded = calculateReleaseProgress(input);
  assert.deepEqual([excluded.stages[0].completedActions, excluded.stages[0].totalActions], [1, 1]);
  assert.equal(excluded.currentStageId, 2);
  input.actions.find((action) => action.id === 903).applicable = true;
  assert.equal(calculateReleaseProgress(input).stages[0].totalActions, 2);
});

test('current stage follows supplied order while later stages may already be complete', () => {
  const input = fixture();
  input.actions[0].completed = true;
  input.actions[2].completed = true;
  assert.equal(calculateReleaseProgress(input).currentStageId, 2);
  input.stages = [input.stages[2], input.stages[1], input.stages[0], ...input.stages.slice(3)];
  assert.equal(calculateReleaseProgress(input).currentStageId, 2);
  input.stages = [input.stages[3], ...input.stages.slice(0, 3), ...input.stages.slice(4)];
  assert.equal(calculateReleaseProgress(input).currentStageId, 4, 'Persisted order, rather than numeric ID, chooses the earliest unfinished stage');
});

test('empty included stages and committed unassigned actions require scope review', () => {
  const empty = fixture();
  empty.actions = empty.actions.filter((action) => action.stageId !== 1);
  const emptyResult = calculateReleaseProgress(empty);
  assert.equal(emptyResult.state, 'needs-scope-review');
  assert.equal(emptyResult.percent, null);
  assert.deepEqual(emptyResult.emptyStageIds, [1]);
  assert.equal(emptyResult.stages[1].percent, 0);
  assert.equal(emptyResult.currentStageId, 2);

  const unassigned = fixture();
  unassigned.actions.push({ id: 950, stageId: null, committed: true, applicable: true, completed: false, kind: 'work' });
  const result = calculateReleaseProgress(unassigned);
  assert.equal(result.state, 'needs-scope-review');
  assert.equal(result.percent, null);
  assert.deepEqual(result.unassignedActionIds, [950]);
});

test('protected confirmation distinguishes in-progress from confirmed', () => {
  const input = fixture();
  input.actions.forEach((action) => { if (action.kind === 'work') action.completed = true; });
  const pending = calculateReleaseProgress(input);
  assert.equal(pending.state, 'in-progress');
  assert.equal(pending.percent, (6 + 0.5) / 7 * 100);
  assert.equal(pending.currentStageId, 7);
  input.actions.find((action) => action.kind === 'release-confirmation').completed = true;
  const confirmed = calculateReleaseProgress(input);
  assert.equal(confirmed.state, 'confirmed');
  assert.equal(confirmed.percent, 100);
  assert.equal(confirmed.currentStageId, null);
});

test('recalculation reflects completion, reopening, and added committed scope', () => {
  const input = fixture();
  const initial = calculateReleaseProgress(input).percent;
  input.actions[0].completed = true;
  const completed = calculateReleaseProgress(input).percent;
  assert.ok(completed > initial);
  input.actions[0].completed = false;
  assert.equal(calculateReleaseProgress(input).percent, initial);
  input.actions.push({ id: 999, stageId: 1, committed: true, applicable: true, completed: false, kind: 'work' });
  assert.ok(calculateReleaseProgress(input).percent < completed);
});

test('evaluation is deterministic and does not mutate deeply frozen input', () => {
  const input = fixture();
  input.actions[0].completed = true;
  input.stages.forEach(Object.freeze);
  input.actions.forEach(Object.freeze);
  Object.freeze(input.stages);
  Object.freeze(input.actions);
  Object.freeze(input);
  const first = calculateReleaseProgress(input);
  assert.deepEqual(calculateReleaseProgress(input), first);
  const otherRelease = { ...input, releaseId: 42 };
  assert.equal(calculateReleaseProgress(otherRelease).releaseId, 42);
  assert.deepEqual(calculateReleaseProgress(input), first);
});

test('invalid graph, IDs, included stages, and confirmation configuration fail validation', () => {
  const badCases = [
    (x) => { x.stages = []; },
    (x) => { x.stages[1].id = x.stages[0].id; },
    (x) => { x.actions[1].id = x.actions[0].id; },
    (x) => { x.actions[0].id = 0; },
    (x) => { x.actions[0].stageId = 999; },
    (x) => { x.actions = x.actions.filter((action) => action.kind !== 'release-confirmation'); },
    (x) => { x.actions.push({ ...x.actions.find((action) => action.kind === 'release-confirmation'), id: 901 }); },
    (x) => { x.stages[6].included = false; },
    (x) => { x.stages[0].included = false; },
    (x) => { x.actions.find((action) => action.kind === 'release-confirmation').stageId = 6; },
    (x) => { x.actions.find((action) => action.kind === 'release-confirmation').completed = true; },
    (x) => {
      x.actions[0].completed = false;
      x.actions.find((action) => action.kind === 'release-confirmation').completed = true;
    },
  ];
  for (const mutate of badCases) {
    const input = fixture();
    if (mutate === badCases.at(-1)) input.actions[0].completed = true;
    mutate(input);
    assert.throws(() => calculateReleaseProgress(input), { code: 'VALIDATION' });
  }
});
