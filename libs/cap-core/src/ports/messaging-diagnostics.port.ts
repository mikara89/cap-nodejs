import { type CapMessagingDiagnosticEvent } from '../models/cap-messaging-diagnostic';

/**
 * Optional, framework-neutral sink for best-effort messaging diagnostics.
 */
export interface CapMessagingDiagnosticsPort {
  emit(event: CapMessagingDiagnosticEvent): void | Promise<void>;
}
