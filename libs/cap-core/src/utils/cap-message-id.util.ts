import type { CapHeaders } from '../models/cap-headers.type';

export const CAP_MESSAGE_ID_HEADER = 'cap-message-id';

export function withCapMessageId(
  headers: CapHeaders | undefined,
  messageId: string,
): CapHeaders {
  return { ...(headers ?? {}), [CAP_MESSAGE_ID_HEADER]: messageId };
}

export function getCapMessageId(
  headers: CapHeaders | undefined,
): string | undefined {
  const value = headers?.[CAP_MESSAGE_ID_HEADER];
  return value === undefined ? undefined : String(value);
}
