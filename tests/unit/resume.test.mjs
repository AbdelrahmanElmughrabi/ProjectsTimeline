import assert from 'node:assert/strict';
import test from 'node:test';
import { selectResumeCheckpoint } from '../../dist/main/resume.js';

test('returns null when there are no checkpoints', () => {
  assert.equal(selectResumeCheckpoint([]), null);
});

test('selects the newest timestamp from unordered checkpoints', () => {
  const checkpoints = [
    { id: 4, projectId: 2, accomplished: 'First', nextSteps: 'Continue A', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 2, projectId: 2, accomplished: 'Last', nextSteps: 'Continue B', createdAt: '2026-03-01T00:00:00.000Z' },
    { id: 9, projectId: 2, accomplished: 'Middle', nextSteps: 'Continue C', createdAt: '2026-02-01T00:00:00.000Z' },
  ];

  assert.equal(selectResumeCheckpoint(checkpoints), checkpoints[1]);
});

test('breaks timestamp ties by descending numeric ID', () => {
  const checkpoints = [
    { id: 9, projectId: 1, accomplished: 'Lower', nextSteps: 'Old text', createdAt: '2026-03-01T00:00:00.000Z' },
    { id: 10, projectId: 1, accomplished: 'Higher', nextSteps: 'Newest text', createdAt: '2026-03-01T00:00:00.000Z' },
    { id: 2, projectId: 1, accomplished: 'Earlier', nextSteps: 'Earlier text', createdAt: '2026-02-01T00:00:00.000Z' },
  ];

  assert.equal(selectResumeCheckpoint(checkpoints), checkpoints[1]);
});

test('preserves the input and returns the original checkpoint text and timestamp intact', () => {
  const checkpoint = {
    id: 3,
    projectId: 7,
    accomplished: '  Shipped a fix\nwith exact spacing.  ',
    nextSteps: '  Review the edge case\nthen continue.  ',
    createdAt: '2026-03-01T12:34:56.789Z',
  };
  const checkpoints = [checkpoint];
  const before = structuredClone(checkpoints);

  const selected = selectResumeCheckpoint(checkpoints);

  assert.deepEqual(checkpoints, before);
  assert.equal(selected, checkpoint);
  assert.equal(selected.accomplished, checkpoint.accomplished);
  assert.equal(selected.nextSteps, checkpoint.nextSteps);
  assert.equal(selected.createdAt, checkpoint.createdAt);
});
