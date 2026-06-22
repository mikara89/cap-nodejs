export interface RedactionOptions {
  headers?: string[];
  payloadPaths?: string[];
}

export function redactHeaders(
  headers: unknown,
  sensitiveHeaders: string[] = [],
): unknown {
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return headers;
  }
  const sensitive = new Set(sensitiveHeaders.map((h) => h.toLowerCase()));
  return Object.fromEntries(
    Object.entries(headers as Record<string, unknown>).map(([key, value]) => [
      key,
      sensitive.has(key.toLowerCase()) ? '[redacted]' : value,
    ]),
  );
}

export function redactPayload(payload: unknown, paths: string[] = []): unknown {
  if (!paths.length || !payload || typeof payload !== 'object') return payload;
  const clone = JSON.parse(JSON.stringify(payload)) as unknown;
  for (const path of paths) redactPath(clone, path.split('.'));
  return clone;
}

function redactPath(target: unknown, parts: string[]): void {
  if (!target || typeof target !== 'object' || !parts.length) return;
  const record = target as Record<string, unknown>;
  const [head, ...tail] = parts;
  if (!head || !(head in record)) return;
  if (!tail.length) {
    record[head] = '[redacted]';
    return;
  }
  redactPath(record[head], tail);
}
