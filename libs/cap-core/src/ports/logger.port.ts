export interface CapLogger {
  debug?(message: string, context?: unknown): void;
  info?(message: string, context?: unknown): void;
  warn?(message: string, context?: unknown): void;
  error?(message: string, error?: unknown, context?: unknown): void;
}
