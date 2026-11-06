import type { Checkpoint } from '../shared/contracts.js';

export function selectResumeCheckpoint(checkpoints: readonly Checkpoint[]): Checkpoint | null {
  let latest: Checkpoint | null = null;

  for (const checkpoint of checkpoints) {
    if (
      latest === null ||
      checkpoint.createdAt > latest.createdAt ||
      (checkpoint.createdAt === latest.createdAt && checkpoint.id > latest.id)
    ) {
      latest = checkpoint;
    }
  }

  return latest;
}
