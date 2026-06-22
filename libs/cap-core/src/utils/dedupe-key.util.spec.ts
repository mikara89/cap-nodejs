import { createDedupeKey } from './dedupe-key.util';

describe('createDedupeKey', () => {
  it('uses topic, group, and message id in the stable current format', () => {
    expect(
      createDedupeKey({
        topic: 'user.created',
        group: 'email-service',
        messageId: 'message-1',
      }),
    ).toBe('user.created|email-service|message-1');
  });
});
