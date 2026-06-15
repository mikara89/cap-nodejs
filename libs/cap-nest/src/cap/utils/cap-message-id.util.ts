import type { CapHeaders } from '../models/cap-headers.type';

export const CAP_MESSAGE_ID_HEADER = 'cap-message-id';

export function withCapMessageId(
  headers: CapHeaders | undefined,
  messageId: string,
): CapHeaders {
  return { ...(headers ?? {}), [CAP_MESSAGE_ID_HEADER]: messageId };
}
