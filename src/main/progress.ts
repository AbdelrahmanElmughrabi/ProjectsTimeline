import type { ProgressInput, ReleaseProgress } from '../shared/contracts';
import { AppError, positiveId } from './domain';

function invalid(message: string): never {
  throw new AppError('VALIDATION', message);
}

function flag(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function calculateReleaseProgress(input: ProgressInput): ReleaseProgress {
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalid('Invalid progress input.');
  positiveId(input.releaseId);
  if (!Array.isArray(input.stages) || !Array.isArray(input.actions)) invalid('Progress stages and actions must be arrays.');

  const stageIds = new Set<number>();
  for (const stage of input.stages) {
    if (!stage || typeof stage !== 'object') invalid('Invalid release stage.');
    positiveId(stage.id);
    if (stageIds.has(stage.id)) invalid('Release stage IDs must be unique.');
    if (!flag(stage.included)) invalid('Stage inclusion must be explicit.');
    stageIds.add(stage.id);
  }

  const includedStages = input.stages.filter((stage) => stage.included);
  if (!includedStages.length) invalid('A release must include at least one stage.');

  const actionIds = new Set<number>();
  const gates: ProgressInput['actions'][number][] = [];
  for (const action of input.actions) {
    if (!action || typeof action !== 'object') invalid('Invalid progress action.');
    positiveId(action.id);
    if (actionIds.has(action.id)) invalid('Progress action IDs must be unique.');
    actionIds.add(action.id);
    if (action.stageId !== null) {
      positiveId(action.stageId);
      if (!stageIds.has(action.stageId)) invalid('An action references a stage outside this release.');
    }
    if (!flag(action.committed) || !flag(action.applicable) || !flag(action.completed)) invalid('Progress action flags must be explicit.');
    if (action.kind !== 'work' && action.kind !== 'release-confirmation') invalid('Invalid progress action kind.');
    if (action.kind === 'release-confirmation') gates.push(action);
  }

  if (gates.length !== 1) invalid('A release must have exactly one confirmation action.');
  const gate = gates[0];
  const closingStage = includedStages[includedStages.length - 1];
  if (!gate.committed || !gate.applicable || gate.stageId !== closingStage.id) {
    invalid('The confirmation action must be committed, applicable, and assigned to the closing stage.');
  }

  const includedIds = new Set(includedStages.map((stage) => stage.id));
  const eligible = input.actions.filter((action) => action.committed && action.applicable);
  for (const action of eligible) {
    if (action.stageId !== null && !includedIds.has(action.stageId)) {
      invalid('Committed applicable work must be assigned to an included stage.');
    }
  }

  const unassignedActionIds = eligible.filter((action) => action.stageId === null).map((action) => action.id);
  const stages = includedStages.map((stage) => {
    const stageActions = eligible.filter((action) => action.stageId === stage.id);
    const completedActions = stageActions.filter((action) => action.completed).length;
    const totalActions = stageActions.length;
    return {
      stageId: stage.id,
      completedActions,
      totalActions,
      percent: totalActions ? (completedActions / totalActions) * 100 : null,
    };
  });
  const emptyStageIds = stages.filter((stage) => stage.totalActions === 0).map((stage) => stage.stageId);
  const currentStageId = stages.find((stage) => {
    if (!stage.totalActions || stage.completedActions === stage.totalActions) return false;
    return true;
  })?.stageId ?? null;
  const needsScopeReview = emptyStageIds.length > 0 || unassignedActionIds.length > 0;

  if (gate.completed && (needsScopeReview || eligible.some((action) => !action.completed))) {
    invalid('A confirmation action cannot be complete while release work or scope review remains.');
  }

  if (needsScopeReview) {
    return { releaseId: input.releaseId, state: 'needs-scope-review', percent: null, currentStageId, stages, emptyStageIds, unassignedActionIds };
  }
  if (gate.completed) {
    return { releaseId: input.releaseId, state: 'confirmed', percent: 100, currentStageId: null, stages, emptyStageIds, unassignedActionIds };
  }

  const percent = stages.reduce((sum, stage) => sum + (stage.percent ?? 0), 0) / stages.length;
  return { releaseId: input.releaseId, state: 'in-progress', percent, currentStageId, stages, emptyStageIds, unassignedActionIds };
}
