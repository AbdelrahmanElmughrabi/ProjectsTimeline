import type { ErrorCode, Result } from '../shared/contracts';

export class AppError extends Error {
  constructor(public readonly code: ErrorCode, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export async function operationResult<T>(operation: () => T | Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, value: await operation() };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, error: { code: error.code, message: error.message } };
    console.error('Database operation failed:', error);
    return { ok: false, error: { code: 'STORAGE', message: 'The operation could not be saved or loaded. Your input has been kept; please try again.' } };
  }
}

export function payload(input: unknown, keys: string[]): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new AppError('VALIDATION', 'Expected an object.');
  }
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some((key) => !keys.includes(key))) {
    throw new AppError('VALIDATION', 'Unexpected input field.');
  }
  return value;
}

export function requiredText(value: unknown, name: string, maximum: number): string {
  if (typeof value !== 'string' || value.length > maximum || value.trim().length === 0) {
    throw new AppError('VALIDATION', `${name} must contain 1–${maximum} characters.`);
  }
  return value.trim();
}

export function positiveId(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new AppError('VALIDATION', 'Expected a valid project or action ID.');
  }
  return value;
}
