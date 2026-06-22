export function expJitter(
  attempt: number,
  baseMs = 1_000,
  maxMs = 5 * 60_000,
): number {
  const expo = baseMs * 2 ** attempt;
  const rand = Math.floor(Math.random() * baseMs);
  return Math.min(expo + rand, maxMs);
}

export function calculateBackoff(options: {
  retryCount: number;
  baseMs?: number;
  maxMs?: number;
  now: Date;
}): Date {
  return new Date(
    options.now.getTime() +
      expJitter(options.retryCount, options.baseMs, options.maxMs),
  );
}
